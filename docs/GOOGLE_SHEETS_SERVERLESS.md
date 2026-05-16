# TicketOps Google Sheets Serverless Backend

This replaces Supabase with a zero-cost Google Drive setup:

- Frontend: static files from GitHub Pages, Vercel static, Netlify, or local hosting.
- Backend: Google Apps Script Web App.
- Database: one Google Sheet tab named `ticketops_db` containing the same JSON structure as `data/db.json`.

## 1. Create the Sheet backend

1. Open Google Drive.
2. Create a new Google Sheet named `TicketOps Database`.
3. In the Sheet, open `Extensions` -> `Apps Script`.
4. Replace the default script with [Code.gs](../scripts/google-apps-script/Code.gs).
5. Save the project.

## 2. Import existing TicketOps data

In Apps Script, run this once from the editor:

```js
importTicketOpsJson(`PASTE_DATA_DB_JSON_HERE`);
```

Replace `PASTE_DATA_DB_JSON_HERE` with the contents of [data/db.json](../data/db.json).

For the current migrated production seed, use [data/google-sheets-seed.json](../data/google-sheets-seed.json). This contains the migrated users, outlets, technicians, tickets, scheduler rules, generated tasks, and assignment window.

For a fresh demo database instead, run:

```js
resetTicketOpsDemoData();
```

## 3. Deploy the API

1. In Apps Script, click `Deploy` -> `New deployment`.
2. Select type `Web app`.
3. Execute as: `Me`.
4. Who has access: `Anyone`.
5. Deploy and copy the Web App URL. It looks like:

```text
https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

## 4. Point TicketOps to Apps Script

Option A, permanent static config:

Set the Vercel environment variable `TICKETOPS_GOOGLE_APPS_SCRIPT_URL` to the Web App URL and redeploy. The build writes this value into `www/frontend-config.js`.

For a local/static manual config, edit [frontend-config.js](../frontend-config.js):

```js
window.TICKETOPS_CONFIG = {
  apiBase: "https://script.google.com/macros/s/DEPLOYMENT_ID/exec"
};
```

Option B, no code change:

Open TicketOps, go to API settings, and set the same Apps Script URL. The app stores it in browser local storage.

## Notes

- This removes Supabase egress and hosting dependency for the data layer.
- Google Apps Script quotas still apply, but normal small-team TicketOps usage should fit the free tier.
- This is not equivalent to Supabase row-level security. Treat the Apps Script URL as an operations endpoint and share the app only with trusted users.
- Existing PBKDF2 password hashes from the Node server cannot be verified directly in Apps Script. The bridge accepts the original demo passwords and any password changed/reset after migration.
