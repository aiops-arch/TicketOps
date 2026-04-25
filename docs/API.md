# TicketOps REST API

## Backend Rules

- Backend REST API is the source of truth for tickets, attendance, assignment, and reports.
- Supabase Postgres is the production storage model.
- Local JSON is only a development fallback when Supabase credentials are missing.
- Frontend must not calculate final ticket priority or assignment ownership.
- Assignment to unavailable technicians requires an override reason.
- When a technician becomes unavailable, assigned but unstarted tickets return to the admin queue.
- Every ticket status change must add a history event.
- Closed and cancelled tickets are excluded from active workload.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API health check |
| GET | `/api/bootstrap` | Load outlets, technicians, tickets, suggestions, and reports |
| POST | `/api/tickets` | Create manager ticket |
| PATCH | `/api/tickets/:id/assign` | Assign or reassign technician |
| PATCH | `/api/tickets/:id/status` | Change ticket status |
| PATCH | `/api/technicians/:id/status` | Update technician availability |
| POST | `/api/reset` | Reset demo data |

## Frontend Rules

- Frontend should be mobile-first and role-first.
- Manager ticket creation should stay below 10 seconds.
- Technician actions must be one tap where possible.
- Admin screen must prioritize critical, blocked, unassigned, and reopened tickets.
- Attendance and assignment state must refresh after each action.
- API errors must be visible and actionable.

## Mobile Packaging Rules

- Android APK can be generated from the Capacitor Android project.
- iOS cannot use APK. Apple apps require an iOS Capacitor project and an IPA built on macOS with Xcode.
- The Android app should call the deployed API URL in production.
