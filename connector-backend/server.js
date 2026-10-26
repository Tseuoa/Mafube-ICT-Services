import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT || 3000);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map(value => value.trim()).filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Allow health checks and server-to-server calls with no Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed"));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "12kb" }));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "AI service is not configured yet. Please contact Mafube ICT Services." });
    }
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message) return res.status(400).json({ error: "Please type a message." });
    if (message.length > 2000) return res.status(413).json({ error: "Please keep your message under 2,000 characters." });

    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-10) : [];
    const safeHistory = history.filter(item =>
      item && ["user", "assistant"].includes(item.role) &&
      typeof item.content === "string" && item.content.length <= 2000
    ).map(item => ({ role: item.role, content: item.content }));

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30_000, maxRetries: 1 });
    const input = [
      ...safeHistory,
      { role: "user", content: message }
    ];
    const result = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-astra",
      instructions: `You are Connector, the website AI assistant for Mafube ICT Services, a South African ICT services business. Be friendly, concise, professional, and honest. Help visitors understand business ICT, Hosted PBX and VoIP, IP telephony, contact-centre solutions, connectivity (fibre, LTE/5G), Microsoft 365, cloud services, ICT products and support. Do not invent prices, stock, contract terms, certifications, or service availability. If a quote or specific commercial commitment is needed, ask the visitor to contact Mafube ICT Services. Contact: silas.tseuoa@mafubeservices.co.za; 011 070 8666; 082 597 6262. Do not request passwords, payment-card details, or sensitive personal data. If unsure, say so and offer the contact details.`,
      input,
      max_output_tokens: 600
    });
    const reply = (result.output_text || "").trim();
    if (!reply) return res.status(502).json({ error: "The AI service returned no answer. Please try again." });
    res.set("Cache-Control", "no-store");
    return res.json({ reply });
  } catch (error) {
    console.error("Connector request failed:", error?.status || error?.name || "unknown");
    if (error?.status === 429) return res.status(429).json({ error: "Connector is busy. Please wait a moment and try again." });
    return res.status(502).json({ error: "Connector is temporarily unavailable. Please try again or contact Mafube ICT Services." });
  }
});

app.use((error, _req, res, _next) => {
  if (error?.message === "Origin not allowed") return res.status(403).json({ error: "This website is not allowed to use Connector." });
  if (error instanceof SyntaxError) return res.status(400).json({ error: "Invalid request format." });
  return res.status(500).json({ error: "Unexpected server error." });
});

app.listen(port, () => console.log(`Connector API listening on port ${port}`));
