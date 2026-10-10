# Mafube ICT Services — Responsive Website
Upload `index.html`, `styles.css`, `script.js` and `assets/` for a static site. Automatic enquiry email requires deploying the Node server as described below; GitHub Pages alone cannot send email.

## Automatic contact email
The contact form sends enquiries to `silas.tseuoa@mafubeservices.co.za` through the Node server's `/api/contact` endpoint using SMTP. Visitors do not need Outlook or another email app.

### Prepared Render + Brevo setup
`render.yaml` prepares a Node web service with Brevo SMTP on port `2525` (Render Free blocks the usual SMTP ports `25`, `465` and `587`). To activate it:

1. Create or sign in to a Render account and create a new **Blueprint** for this GitHub repository using `render.yaml`.
2. Create or sign in to a Brevo account, verify `silas.tseuoa@mafubeservices.co.za` as a sender (or verify a domain), and generate SMTP credentials. Use the **SMTP login** for `SMTP_USER`, the generated **SMTP key** (not the API key) for `SMTP_PASSWORD`, and the verified sender address for `SMTP_FROM`.
3. Enter those three values in Render when prompted. Keep the password in Render's environment settings; never put it in this repository.
4. After deployment, test `https://<your-render-service>.onrender.com/api/health` and submit the contact form on that Render URL.
5. To use `mafubeservices.co.za`, add it as a custom domain to the Render service and update the domain's DNS records as Render instructs. GitHub Pages cannot run the `/api/contact` backend, so the domain must point to the Node service for the form to work on the main website.

The blueprint selects Render's Free plan to avoid configuring a paid service without approval. Free web services can sleep after inactivity and may take about a minute to wake; Render also documents Free as unsuitable for production use. Upgrade the service in Render if reliable always-on production operation is required. Provisioning the Render/Brevo accounts, verifying the sender, adding DNS records, and entering credentials require access to those accounts; those actions cannot be completed by repository code alone.

The contact email endpoint does not require MySQL. The optional `/api/leads` feature does. Install dependencies with `npm install`, then start the app with `npm start`.

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
