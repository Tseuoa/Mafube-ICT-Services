import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
const port = Number(process.env.PORT || 3000);

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(value => value.trim())
  .filter(Boolean);

const SYSTEM_INSTRUCTIONS = `
You are Connector, the website AI assistant for Mafube ICT Services,
a South African ICT services business.

Be friendly, concise, professional, and honest.

Help visitors understand:
- Hosted PBX and VoIP
- IP telephony and unified communications
- Contact-centre solutions
- Fibre, LTE and 5G connectivity
- Microsoft 365 and cloud services
- ICT products and technical support

Do not invent prices, stock availability, contract terms,
certifications, or service availability.

If a visitor requests a quote or a specific commercial commitment,
ask them to contact Mafube ICT Services.

Contact details:
Email: silas.tseuoa@mafubeservices.co.za
Telephone: 011 070 8666
Mobile: 082 597 6262

Never request passwords, payment-card details, or sensitive personal data.
If you are unsure, say so honestly and offer the contact details.
`;

app.disable("x-powered-by");

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

app.use(
  "/api/",
  rateLimit({
    windowMs: 60_000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: "The AI service is not configured yet. Please contact Mafube ICT Services."
      });
    }

    const message =
      typeof req.body?.message === "string"
        ? req.body.message.trim()
        : "";

    if (!message) {
      return res.status(400).json({
        error: "Please type a message."
      });
    }

    if (message.length > 2000) {
      return res.status(413).json({
        error: "Please keep your message under 2,000 characters."
      });
    }

    const history = Array.isArray(req.body?.history)
      ? req.body.history.slice(-10)
      : [];

    const safeHistory = history
      .filter(item =>
        item &&
        ["user", "assistant"].includes(item.role) &&
        typeof item.content === "string" &&
        item.content.length <= 2000
      )
      .map(item => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.content }]
      }));

    const contents = [
      ...safeHistory,
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let response;

    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTIONS }]
            },
            contents,
            generationConfig: {
              maxOutputTokens: 600,
              temperature: 0.7
            }
          }),
          signal: controller.signal
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.error("Gemini API request failed with status:", response.status);

      if (response.status === 429) {
        return res.status(429).json({
          error: "The AI service has reached its current request limit. Please wait and try again."
        });
      }

      if (response.status === 401 || response.status === 403) {
        return res.status(502).json({
          error: "The AI service could not authorize the request. Please check the server configuration."
        });
      }

      return res.status(502).json({
        error: "The AI service is temporarily unavailable. Please try again later."
      });
    }

    const result = await response.json();

    const reply = (result.candidates?.[0]?.content?.parts || [])
      .map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      console.error("Gemini returned no text response.");

      return res.status(502).json({
        error: "The AI service returned no answer. Please try again."
      });
    }

    res.set("Cache-Control", "no-store");

    return res.json({ reply });

  } catch (error) {
    if (error?.name === "AbortError") {
      return res.status(504).json({
        error: "The AI service took too long to respond. Please try again."
      });
    }

    console.error("Connector request failed:", error?.name || "unknown");

    return res.status(502).json({
      error: "Connector is temporarily unavailable. Please try again or contact Mafube ICT Services."
    });
  }
});

app.use((error, _req, res, _next) => {
  if (error?.message === "Origin not allowed") {
    return res.status(403).json({
      error: "This website is not allowed to use Connector."
    });
  }

  if (error instanceof SyntaxError) {
    return res.status(400).json({
      error: "Invalid request format."
    });
  }

  return res.status(500).json({
    error: "Unexpected server error."
  });
});

app.listen(port, () => {
  console.log(`Connector API listening on port ${port}`);
});
