# TicketOps Project Status

Last updated: 2026-04-29

## Executive Summary

TicketOps has moved from planning into a working product base.

The project now includes:

- A mobile-first web app.
- A REST API backend.
- Supabase-ready production database schema.
- Local JSON fallback for demo/testing.
- Android Capacitor project and APK build.
- iOS Capacitor project prepared for Apple builds.
- Native Flutter mobile app folder.
- Deployment preparation for Render/Vercel/Supabase.
- Full workflow and usage documentation.

## What Is Built

### Web App

Main files:

- `index.html`
- `app.js`
- `styles.css`
- `customer.html`
- `customer.js`
- `customer.css`

Current role tabs:

- Manager
- Admin
- Technician
- Reports

Key behavior:

- Manager can create tickets.
- Admin can view technician attendance and assign work.
- Technician can acknowledge, start, block, and resolve tickets.
- Manager can approve or reopen resolved work.
- Reports show operational counts and alerts.

### Backend

Main file:

- `server.js`

The backend provides REST endpoints for:

- Health check
- Bootstrap data
- Ticket creation
- Ticket assignment
- Ticket status updates
- Technician attendance/status updates
- Demo reset

The backend enforces important workflow rules:

- `Blocked` requires a reason.
- `Resolved` requires a resolution note.
- `Reopened` requires a rejection/reopen reason.
- Unavailable technicians require admin override.
- If a technician becomes unavailable, unstarted assigned tickets return to the queue.

### Data Storage

Production target:

- Supabase Postgres

Schema:

- `supabase/schema.sql`

Local fallback:

- `data/db.json`

Current behavior:

- If Supabase credentials exist in `.env`, backend uses Supabase.
- If not, backend uses local JSON demo data.

### Mobile

Android Capacitor project:

- `android/`

iOS Capacitor project:

- `ios/`

Flutter mobile app:

- `mobile_flutter/`

Local APK outputs:

- `TicketOps-debug.apk`
- `TicketOps-Flutter-release.apk`

Important iOS note:

- Windows can prepare/sync the iOS project.
- Final iOS signing/IPA/App Store build requires macOS, Xcode, CocoaPods, and Apple Developer account.

## How To Run Locally

From project root:

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

Windows helper:

```text
START-WEB.bat
```

## How To Build Android APK

Capacitor APK:

```text
BUILD-APK.bat
```

Flutter APK:

```text
BUILD-FLUTTER-APK.bat
```

Outputs:

```text
TicketOps-debug.apk
TicketOps-Flutter-release.apk
```

## How To Connect Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in Supabase SQL Editor.
3. Copy `.env.example` to `.env`.
4. Fill:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

5. Restart the API:

```bash
npm start
```

The service role key must stay backend-only. Do not put it in frontend or mobile app code.

## Deployment Direction

Prepared deployment options:

- Render backend deployment.
- Supabase database.
- Vercel frontend deployment.

Relevant files:

- `render.yaml`
- `vercel.json`
- `docs/DEPLOY_RENDER_SUPABASE.md`
- `docs/DEPLOY_VERCEL_RENDER_SUPABASE.md`

## Current Git State Notes

Latest observed pushed branch:

- `main`
- Synced with `origin/main`

Recent major commits include:

- Native Flutter mobile app added.
- Supabase service role access work.
- Render/Vercel/Supabase deployment prep.
- Web build made cross-platform.
- Usage guide and helper scripts added.

Local uncommitted files may exist during active work. Before pushing, check:

```bash
git status --short
```

## What Is Still Pending

High-priority next work:

1. Real authentication and role-based login.
2. Live Supabase credentials/configuration.
3. Photo upload for issue proof and resolution proof.
4. Asset register per outlet.
5. SLA background jobs and scheduled escalation.
6. Push notifications.
7. Production deployment and API URL wiring.
8. Signed Android release build.
9. iOS build/signing on macOS.
10. Real QA on manager, admin, technician, and customer flows.

## Practical Current Status

The project is ready for:

- Local web testing.
- Android APK testing.
- Supabase connection once credentials are provided.
- Deployment setup.
- Continued product development.

It is not yet production-ready because authentication, photo storage, live deployment, and production QA are still pending.

