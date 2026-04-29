# TicketOps

Mobile-first maintenance ticket management system for a restaurant business with 4 outlets, 4 outlet managers, 4 technicians, and 1 admin.

The product replaces WhatsApp-based maintenance communication with a structured workflow for ticket creation, technician attendance, smart assignment, updates, verification, escalation, and reporting.

## Current Status

- Start with `docs/README.md` for the documentation map.
- `docs/PLAN.md` contains the business and developer-ready plan.
- `docs/WORKFLOW.md` explains how the maintenance problem starts and how the system handles it end to end.
- `docs/API.md` contains REST API rules.
- `docs/SUPABASE.md` contains the Supabase storage model.
- `index.html`, `styles.css`, and `app.js` contain the mobile-first frontend.
- `server.js` contains the REST API backend.

## Open Prototype

Run:

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

On Windows, you can also double-click:

```text
START-WEB.bat
```

## Core Workflow

Manager creates ticket -> System logs ticket -> Admin assigns technician -> Technician acknowledges and works -> Technician resolves with proof -> Manager verifies -> Ticket closes or reopens.

## Attendance Rule

Technicians must be present and available for normal assignment. Admin can override with reason.

## Storage

Production target is Supabase Postgres. Add credentials in `.env` using `.env.example`.

Without Supabase credentials, the API uses `data/db.json` for local development.

## Free Production Deploy

Use Supabase for production data and Render for the Node/web service.

- `render.yaml` contains the Render Blueprint.
- `supabase/schema.sql` creates and seeds the database.
- `docs/DEPLOY_RENDER_SUPABASE.md` has the zero-cost deployment steps and free-tier caveats.

## Mobile

Android uses Capacitor and can produce an APK when Android SDK/JDK are installed.

iOS uses Capacitor iOS, but final IPA builds require macOS and Xcode.

Current Android debug APK:

```text
TicketOps-debug.apk
```

For a physical phone, the APK needs the REST API running on a reachable URL. If the app cannot connect, it will show an API URL field.

Full usage guide:

```text
docs/USER_GUIDE.md
```

Rebuild APK:

```text
BUILD-APK.bat
```
