# Mafube ICT Services — Responsive Website
Upload `index.html`, `styles.css`, `script.js` and `assets/` to static hosting such as GitHub Pages.

## Database-enabled version
The contact form opens a pre-filled email addressed to `silas.tseuoa@mafubeservices.co.za`; the visitor reviews and sends it using their email app. A configured mail application is required for this flow. For database lead storage, the Node server can also accept `/api/leads`. Run it with MySQL/MariaDB:
1. Create the database using `database.sql`.
2. `npm install`
3. Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=mafube_ict`
4. `npm start`
GitHub Pages is static and cannot run `server.js`; use a VPS, cPanel Node/PHP hosting, or another backend host for the database API.

## Microsoft media
The website now includes a Microsoft technology section with locally stored illustrative Microsoft 365, Azure, Teams and Copilot graphics, plus responsive official Microsoft Learn video embeds. Video links point to Microsoft-hosted learning resources.

## Gallery and navigation
The gallery uses product and collaboration images already in `assets/images/`; select an image to open its full-size version in a new browser tab. Internal navigation and enquiry links scroll to sections on the same page. External video resources open in a separate tab.
