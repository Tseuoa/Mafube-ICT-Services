# Mafube ICT Services — Responsive Website
Upload `index.html`, `styles.css`, `script.js` and `assets/` for a static site. Automatic enquiry email requires deploying the Node server as described below; GitHub Pages alone cannot send email.

## Automatic contact email with Microsoft 365
The contact form posts to `/api/contact`. The Node server uses Microsoft Graph app-only authentication to send enquiries to `silas.tseuoa@mafubeservices.co.za`; visitors do not need Outlook. This requires that the address is a mailbox in a Microsoft 365 work/school tenant. A personal Microsoft account needs a different delegated OAuth flow.

### Configure the Microsoft Entra application
1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com) with an administrator account for the Microsoft 365 tenant that owns the mailbox.
2. Go to **Identity → Applications → App registrations → New registration**. Create a single-tenant app, for example `Mafube Website Contact Mailer`, and save its **Application (client) ID** and **Directory (tenant) ID**.
3. Create a client secret under **Certificates & secrets** and copy its **Value** immediately. The Microsoft account password is not the app secret. Store the value only in the Render secret setting described below.
4. Grant the app permission to send as the mailbox. Recommended: use Exchange Online **Application RBAC** to scope the `Application Mail.Send` role to only `silas.tseuoa@mafubeservices.co.za`. Do not also grant an unscoped tenant-wide `Mail.Send` application permission, because that defeats the mailbox restriction. This requires an Exchange Administrator/Organization Management administrator. Follow Microsoft's [Application RBAC guidance](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac) and test the service principal's authorization against the Silas mailbox and an unrelated mailbox. If an administrator instead grants Entra's `Mail.Send` application permission, understand it is tenant-wide unless separately constrained.

### Deploy the Node service
`render.yaml` prepares a Render Blueprint with the Graph endpoint and secret settings:

1. In Render, create a Blueprint for this GitHub repository using `render.yaml`.
2. Enter `MS_TENANT_ID` (Directory/tenant ID), `MS_CLIENT_ID` (Application/client ID), and `MS_CLIENT_SECRET` (the secret **Value**) when prompted. `MS_SENDER` is prefilled as `silas.tseuoa@mafubeservices.co.za`. Never commit any app secret to Git or put it in browser code.
3. Wait for deployment and check `https://<your-render-service>.onrender.com/api/health` returns `{"ok":true}`. Submit a test enquiry on the Render URL and confirm it arrives in Silas's mailbox.
4. To use `mafubeservices.co.za`, add it as a custom domain to the Render service and update DNS exactly as Render instructs. GitHub Pages cannot run `/api/contact`; the domain must route to the Node service for automatic contact email to work on the public website.

The blueprint uses Render's Free plan to avoid unapproved hosting charges. Free services may sleep after inactivity and can take about a minute to wake; Render documents Free as unsuitable for production. Upgrade the service for reliable always-on operation. Creating the Entra app, granting scoped mailbox access, creating the secret, deploying the Blueprint, and changing DNS require access to the corresponding Microsoft, Render, and domain accounts.

The email endpoint does not require MySQL. The optional `/api/leads` feature does. Install dependencies with `npm install`, then start the app with `npm start`.

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
