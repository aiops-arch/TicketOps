# Supabase Storage Model

TicketOps uses Supabase Postgres as the intended production data store.

## Setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy `.env.example` to `.env`.
5. Fill `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
6. Start the API with `npm start`.

## Storage Rules

- The backend uses the Supabase service role key.
- The frontend does not talk directly to Supabase in this version.
- All business rules stay in `server.js`.
- If Supabase credentials are missing, the backend falls back to `data/db.json` for local demo work.

## Tables

- `outlets`: outlet master list.
- `technicians`: technician master and current availability status.
- `tickets`: ticket core fields and current state.
- `ticket_history`: append-only ticket timeline.
- `attendance_events`: attendance/status audit events.

## Production Note

Do not expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code or mobile app builds.
