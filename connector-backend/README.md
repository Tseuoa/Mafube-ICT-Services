# Mafube ICT Services — Connector backend

This Node.js API securely connects the website chat to the OpenAI Responses API. The API key stays on the server and must never be added to `index.html` or committed to GitHub.

## Deploy it
1. Deploy this folder to a Node.js host that supports environment variables and HTTPS (for example Render, Railway, or your own server).
2. Set the environment variables from `.env.example` in the host dashboard. `OPENAI_API_KEY` must be a real API key from the OpenAI API platform; ChatGPT subscriptions and API billing are separate.
3. Set `ALLOWED_ORIGINS` to the exact public origins serving the site, comma-separated. Keep both apex and `www` only if both are used.
4. Deploy and verify `https://YOUR-BACKEND-DOMAIN/health` returns `{"status":"ok"}`.
5. In the website `index.html`, replace `https://YOUR-CONNECTOR-BACKEND-DOMAIN/api/chat` in `CONNECTOR_API_URL` with `https://YOUR-BACKEND-DOMAIN/api/chat`. Commit the updated `index.html` to the GitHub Pages repository.

## Run locally
- Install Node.js 20 or later.
- Copy `.env.example` to `.env`, add your real API key, and set `ALLOWED_ORIGINS=http://localhost:8000` for a local static web server.
- Install dependencies: `npm install`
- Load environment variables using your preferred secure method, then run `npm start`.
- Serve the website over `http://localhost:8000` and set the front-end API URL to `http://localhost:3000/api/chat` only for local testing.

## Security notes
- API key is read only from server environment.
- CORS origin allowlist, Helmet security headers, JSON body size limit, input validation, output limits, and per-IP rate limiting are enabled.
- Chat history is sent only with the request and is not persisted by this app. Server logs do not print message content or API keys.
- Configure provider usage limits and billing alerts. For public production use, consider adding CAPTCHA or stronger abuse prevention and monitoring.
- HTTPS is required for production. Do not use the example API URL as-is; deployment and configuration are required before live AI replies work.
