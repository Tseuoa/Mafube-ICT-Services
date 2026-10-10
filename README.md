# Mafube ICT Services — Responsive Website
Upload `index.html`, `styles.css`, `script.js` and `assets/` for a static site. Automatic enquiry email requires deploying the Node server as described below; GitHub Pages alone cannot send email.

## Automatic contact email
The contact form sends enquiries to `silas.tseuoa@mafubeservices.co.za` through the Node server's `/api/contact` endpoint using SMTP. Visitors do not need Outlook or another email app. Configure these environment variables on the Node host (never in client-side files):

- `SMTP_HOST` — SMTP server hostname
- `SMTP_PORT` — SMTP port (defaults to `587`; port `465` uses TLS automatically)
- `SMTP_SECURE` — set to `true` to use TLS directly when required by the provider
- `SMTP_USER` and `SMTP_PASSWORD` — SMTP account credentials or provider-issued app password
- `SMTP_FROM` — optional verified sender address; defaults to `SMTP_USER`
- `TRUST_PROXY` — set to `true` only when the Node app is behind one trusted reverse proxy, so the enquiry rate limit can use the visitor IP

Deploy the site and Node server together on a Node-capable host with these settings for automatic email delivery. GitHub Pages is static and cannot run `/api/contact`; the live site must be moved to the Node host before the form can send emails. Until then, the form displays a message if the endpoint is unavailable.
Install the updated dependencies with `npm install`, then start the app with `npm start`. The contact email endpoint does not require MySQL; the optional `/api/leads` feature does.

## Database lead storage
For optional database lead storage, run the Node server with MySQL/MariaDB:
1. Create the database using `database.sql`.
2. `npm install`
3. Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=mafube_ict`
4. `npm start`

## Microsoft media
The website now includes a Microsoft technology section with locally stored illustrative Microsoft 365, Azure, Teams and Copilot graphics, plus responsive official Microsoft Learn video embeds. Video links point to Microsoft-hosted learning resources.

## Gallery and navigation
The gallery uses product and collaboration images already in `assets/images/`; select an image to open its full-size version in a new browser tab. Internal navigation and enquiry links scroll to sections on the same page. External video resources open in a separate tab.
