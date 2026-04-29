# TicketOps Documentation

Start here if you are reviewing or continuing the TicketOps project.

## What TicketOps Is

TicketOps is a maintenance ticket management system for a restaurant business with:

- 4 outlets
- 4 outlet managers
- 4 technicians
- 1 admin

It replaces WhatsApp-based maintenance communication with a structured workflow for ticket creation, technician attendance, smart assignment, proof of work, verification, escalation, and reporting.

## Current Product Status

Read this first:

- [PROJECT_STATUS.md](PROJECT_STATUS.md)

This explains what is built, what is working, what is pending, and where the important files are.

## Business and Workflow Docs

- [PLAN.md](PLAN.md): business and developer-ready plan.
- [WORKFLOW.md](WORKFLOW.md): how the maintenance problem starts and how TicketOps handles it end to end.
- [USER_GUIDE.md](USER_GUIDE.md): how to use the current app.

## Technical Docs

- [API.md](API.md): REST API rules and endpoints.
- [SUPABASE.md](SUPABASE.md): Supabase storage model and setup.
- [MOBILE.md](MOBILE.md): Android/iOS packaging notes.
- [FLUTTER_MOBILE.md](FLUTTER_MOBILE.md): Flutter mobile app notes.

## Deployment Docs

- [DEPLOY_RENDER_SUPABASE.md](DEPLOY_RENDER_SUPABASE.md): Render + Supabase deployment.
- [DEPLOY_VERCEL_RENDER_SUPABASE.md](DEPLOY_VERCEL_RENDER_SUPABASE.md): Vercel frontend + Render backend + Supabase deployment.

## UI Docs

- [customer-dashboard-design-system.md](customer-dashboard-design-system.md): customer dashboard styling direction.

## Quick Run

From the project root:

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

On Windows:

```text
START-WEB.bat
```

## APK Files

Local Android APKs are generated but ignored by Git:

- `TicketOps-debug.apk`
- `TicketOps-Flutter-release.apk`

These files are on the local machine only unless manually shared.

