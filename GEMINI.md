# TicketOps Deployment Architecture

## Strategy: Split Free Tier MVP
To maximize reliability and performance on free tiers, TicketOps is split into three parts:

1.  **Database: Supabase (Postgres)**
    - Persistent storage.
    - Schema: `supabase/schema.sql`
2.  **Backend: Render (Node.js/Express)**
    - Persistent API (sleeps after idle).
    - GitHub-based auto-deploy.
    - Configured via `render.yaml`.
3.  **Frontend: Vercel (Static)**
    - High-performance static asset delivery.
    - GitHub-based auto-deploy.
    - Configured via `vercel.json`.

## Deployment Steps

### 1. Supabase
- Create a new project.
- Run `supabase/schema.sql` in the SQL Editor.
- Get `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### 2. Render (Backend)
- Connect GitHub repo.
- Environment variables:
    - `NODE_ENV=production`
    - `REQUIRE_SUPABASE=true`
    - `SUPABASE_URL=...`
    - `SUPABASE_SERVICE_ROLE_KEY=...`
- Render will use `npm start` to run `server.js`.
- **Note:** Copy the Render Web Service URL (e.g., `https://ticketops.onrender.com`).

### 3. Vercel (Frontend)
- Connect GitHub repo.
- Environment variables:
    - `TICKETOPS_API_BASE=https://ticketops.onrender.com` (Your Render URL)
- Vercel will run `npm run build:web` which generates the `www` folder.
- Output directory: `www`.

## Configuration Files
- `render.yaml`: Defines Render service.
- `vercel.json`: Defines Vercel static build.
- `scripts/build-web.js`: Generates `www/frontend-config.js` using the API URL.
