```javascript
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

For quotes or commercial commitments, direct visitors to Mafube ICT Services.

Contact:
Email: silas.tseuoa@mafubeservices.co.za
Telephone: 011 070 8666
Mobile: 082 597 6262

Never request passwords, payment-card details, or sensitive personal data.
If unsure, say so honestly and provide the contact details above.
`;

app.disable("x-powered-by");

// Render runs the application behind a proxy.
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

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Configuration error: GEMINI_API_KE
```
