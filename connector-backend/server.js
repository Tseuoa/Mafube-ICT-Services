import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { pathToFileURL } from "node:url";

const app = express();
const port = Number(process.env.PORT || 3000);
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4_000;
const MAX_HISTORY_LENGTH = 12_000;
const MAX_REPLY_LENGTH = 8_000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(value => value.trim())
  .filter(Boolean);

const SYSTEM_INSTRUCTIONS = `You are Connector, the website AI assistant for Mafube ICT Services, a South African ICT services business.

Be friendly, concise, professional, and honest. Help visitors understand hosted PBX and VoIP, IP telephony and unified communications, contact-centre solutions, fibre, LTE and 5G connectivity, Microsoft 365 and cloud services, ICT products, and technical support.

Do not invent prices, stock availability, contract terms, certifications, or service availability. For quotes or commercial commitments, direct visitors to Mafube ICT Services.

Contact: silas.tseuoa@mafubeservices.co.za, 011 070 8666, 082 597 6262.

Never request passwords, payment-card details, or sensitive personal data. If unsure, say so honestly and provide the contact details above.`;

const providerNames = new Set(["openai", "azure-openai", "gemini", "claude"]);

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed"));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "12kb" }));
app.use("/api/", rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false
}));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

function validateChatRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "invalid_request", "A JSON request body is required.");
  }

  if (!providerNames.has(body.provider)) {
    throw new HttpError(400, "invalid_provider", "Choose a supported AI provider.");
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
    throw new HttpError(400, "invalid_messages", `Send between 1 and ${MAX_MESSAGES} chat messages.`);
  }

  let totalLength = 0;
  const messages = body.messages.map(message => {
    if (!message || typeof message !== "object" || Array.isArray(message)
      || !["user", "assistant"].includes(message.role)
      || typeof message.content !== "string"
      || !message.content.trim()
      || message.content.length > MAX_MESSAGE_LENGTH) {
      throw new HttpError(400, "invalid_message", "Each message must have a valid role and non-empty text of at most 4,000 characters.");
    }

    totalLength += message.content.length;
    return { role: message.role, content: message.content.trim() };
  });

  if (totalLength > MAX_HISTORY_LENGTH || messages[messages.length - 1].role !== "user") {
    throw new HttpError(400, "invalid_messages", "The chat history is too large or does not end with a user message.");
  }

  return { provider: body.provider, messages };
}

function requireEnvironment(names, provider) {
  const missing = names.filter(name => !process.env[name]);
  if (missing.length) {
    throw new HttpError(503, "provider_not_configured", `${provider} is not configured on this server.`);
  }
}

async function postJson(provider, url, headers, body) {
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000)
    });
  } catch {
    throw new HttpError(502, "provider_unavailable", `${provider} could not be reached. Please try again later.`);
  }

  if (!response.ok) {
    console.error(`AI provider request failed: ${provider} returned HTTP ${response.status}.`);
    throw new HttpError(502, "provider_error", `${provider} could not complete the request. Please try again later.`);
  }

  try {
    return await response.json();
  } catch {
    throw new HttpError(502, "provider_error", `${provider} returned an invalid response.`);
  }
}

async function requestOpenAI(messages) {
  requireEnvironment(["OPENAI_API_KEY"], "OpenAI");
  const data = await postJson("OpenAI", "https://api.openai.com/v1/chat/completions", {
    authorization: `Bearer ${process.env.OPENAI_API_KEY}`
  }, {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "system", content: SYSTEM_INSTRUCTIONS }, ...messages]
  });

  return data.choices?.[0]?.message?.content;
}

async function requestAzureOpenAI(messages) {
  requireEnvironment([
    "AZURE_OPENAI_API_KEY",
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_DEPLOYMENT",
    "AZURE_OPENAI_API_VERSION"
  ], "Azure OpenAI");

  let endpoint;
  try {
    endpoint = new URL(process.env.AZURE_OPENAI_ENDPOINT);
    if (endpoint.protocol !== "https:") throw new Error("HTTPS required");
  } catch {
    throw new HttpError(503, "provider_not_configured", "Azure OpenAI endpoint configuration is invalid.");
  }

  const url = `${endpoint.origin}${endpoint.pathname.replace(/\/+$/, "")}/openai/deployments/${encodeURIComponent(process.env.AZURE_OPENAI_DEPLOYMENT)}/chat/completions?api-version=${encodeURIComponent(process.env.AZURE_OPENAI_API_VERSION)}`;
  const data = await postJson("Azure OpenAI", url, {
    "api-key": process.env.AZURE_OPENAI_API_KEY
  }, {
    messages: [{ role: "system", content: SYSTEM_INSTRUCTIONS }, ...messages]
  });

  return data.choices?.[0]?.message?.content;
}

async function requestGemini(messages) {
  requireEnvironment(["GEMINI_API_KEY"], "Google Gemini");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
  const data = await postJson("Google Gemini", url, {}, {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTIONS }] },
    contents: messages.map(message => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }]
    }))
  });

  return data.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "")
    .join("")
    .trim();
}

async function requestClaude(messages) {
  requireEnvironment(["ANTHROPIC_API_KEY"], "Anthropic Claude");
  const data = await postJson("Anthropic Claude", "https://api.anthropic.com/v1/messages", {
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01"
  }, {
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
    max_tokens: 1_024,
    system: SYSTEM_INSTRUCTIONS,
    messages
  });

  return data.content
    ?.filter(block => block.type === "text")
    .map(block => block.text)
    .join("")
    .trim();
}

const providerHandlers = {
  openai: requestOpenAI,
  "azure-openai": requestAzureOpenAI,
  gemini: requestGemini,
  claude: requestClaude
};

app.post("/api/chat", async (req, res, next) => {
  try {
    const request = validateChatRequest(req.body);
    const text = await providerHandlers[request.provider](request.messages);
    if (typeof text !== "string" || !text.trim()) {
      throw new HttpError(502, "provider_error", "The AI provider returned an empty response.");
    }

    res.json({
      provider: request.provider,
      reply: text.trim().slice(0, MAX_REPLY_LENGTH)
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (res.headersSent) return;

  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }

  if (error.message === "Origin not allowed") {
    return res.status(403).json({ error: { code: "origin_not_allowed", message: "This website is not allowed to use the chat service." } });
  }

  if (error.type === "entity.parse.failed" || error.type === "entity.too.large") {
    const tooLarge = error.type === "entity.too.large";
    return res.status(tooLarge ? 413 : 400).json({
      error: {
        code: tooLarge ? "request_too_large" : "invalid_json",
        message: tooLarge ? "The request is too large." : "The request body must be valid JSON."
      }
    });
  }

  console.error("Unexpected Connector API error.");
  return res.status(500).json({ error: { code: "internal_error", message: "The chat service encountered an error." } });
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(port, () => {
    console.log(`Connector backend listening on port ${port}`);
  });
}

export { app };
