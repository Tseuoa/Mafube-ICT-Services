# Mafube ICT Services — Connector backend

Connector is a Node.js API for the website chat. It supports OpenAI, Azure OpenAI, Google Gemini, and Anthropic Claude. Provider credentials stay in the backend environment; never put API keys in `index.html`, browser code, or a committed file.

## Deploy the backend

1. Deploy this `connector-backend` directory to a Node.js host with Node.js 20+, HTTPS, and private environment-variable support (for example Render, Railway, or your own server). GitHub Pages hosts the static website, not this API. The existing Render contact-form API is a separate service and does not host or configure Connector.
2. Set `ALLOWED_ORIGINS` to the exact production origins that serve the site: `https://mafubeservices.co.za,https://www.mafubeservices.co.za`. Remove an origin if that hostname does not serve the site. For local testing, add the exact local site origin, such as `http://localhost:8000`.
3. Configure the key and model for every provider you want enabled. Each provider requires its own API account and API billing; ChatGPT, Microsoft 365, Google One, or Claude chat subscriptions do not pay for API usage.
4. For Azure OpenAI, also set the resource endpoint (for example `https://YOUR-RESOURCE.openai.azure.com`), the exact model deployment name created in Azure, and an API version supported by that Azure resource. The endpoint must use HTTPS.
5. Set `PORT` only if the host requires a specific port. Deploy, then confirm `https://YOUR-BACKEND-DOMAIN/health` returns `{"status":"ok"}`.
6. In `index.html`, set `window.CONNECTOR_API_BASE_URL` before the Connector script to the backend origin, for example `https://YOUR-BACKEND-DOMAIN`. Do not add a trailing `/api/chat`; the page appends that path. Commit and publish the static-site change.

## Provider environment variables

See `.env.example` for the variable names. Set secrets only in the backend host's private environment configuration:

| Provider | Required secret | Optional model setting |
|---|---|---|
| OpenAI | `OPENAI_API_KEY` | `OPENAI_MODEL` (defaults to `gpt-4o-mini`) |
| Azure OpenAI | `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION` | Deployment is selected with `AZURE_OPENAI_DEPLOYMENT` |
| Google Gemini | `GEMINI_API_KEY` | `GEMINI_MODEL` (defaults to `gemini-2.5-flash`) |
| Anthropic Claude | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL` (defaults to `claude-haiku-4-5`) |

If a visitor selects a provider that has not been configured, the API returns a clear `503 provider_not_configured` response; it does not fall back to another provider.

## Run locally

1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env`, add a valid provider API key, and set `ALLOWED_ORIGINS=http://localhost:8000`.
3. Install dependencies with `npm install`. Load the `.env` values into the process using a local environment loader or shell; this project intentionally does not load secrets from a file automatically.
4. Start the API with `npm start` and serve the website on the allowed local origin.
5. Set `window.CONNECTOR_API_BASE_URL = "http://localhost:3000"` before the Connector script in `index.html` while testing locally.
6. Run backend tests with `npm test`.

## API and security

- `POST /api/chat` accepts `{ "provider": "openai", "messages": [{ "role": "user", "content": "..." }] }`. Provider values are `openai`, `azure-openai`, `gemini`, and `claude`; roles are limited to `user` and `assistant`.
- Requests are limited to 20 messages, 4,000 characters per message, 12,000 characters total, and 12 KB of JSON. Responses use `{ "provider": "...", "reply": "..." }`.
- Helmet, exact-origin CORS, JSON size limits, per-IP rate limiting, and upstream request timeouts are enabled. Upstream credentials and error details are never returned to the browser.
- Chat history is sent only with each request and is not persisted by this app. Avoid entering passwords, payment details, or sensitive personal information.
- Configure provider usage limits and billing alerts. For public production use, consider stronger abuse prevention and monitoring.

The backend and website configuration are code-ready, but AI replies will not work until a backend is deployed, the chosen provider credentials are configured there, and the published page points to that backend.
