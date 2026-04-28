# Vercel + Render + Supabase Free MVP Deployment

This is the recommended zero-cost MVP structure:

- Vercel: static frontend from `www`
- Render: Node.js Express API from `server.js`
- Supabase: Postgres database and future file storage/auth

## 1. Supabase

Create a Supabase project and run:

```text
supabase/schema.sql
```

Command Prompt helper:

```text
SETUP-SUPABASE.bat
```

This uses the Supabase CLI. If the CLI is not installed, the script will tell you to install it or paste `supabase/schema.sql` into the Supabase SQL Editor manually.

Keep these values ready:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## 2. Render Backend

Create a Render Web Service from this repository.

Use:

```text
Build Command: npm install && npm run build:web
Start Command: npm start
```

Set Render environment variables:

```text
NODE_ENV=production
REQUIRE_SUPABASE=true
SUPABASE_URL=<your Supabase URL>
SUPABASE_SERVICE_ROLE_KEY=<your service role key>
```

Command Prompt helper:

```text
PREPARE-RENDER.bat
```

Render publishing is GitHub-based here. After your GitHub push, connect the GitHub repository in Render or use the Render Blueprint from `render.yaml`.

After deploy, copy the Render URL:

```text
https://your-service.onrender.com
```

## 3. Vercel Frontend

The repo includes `vercel.json`.

Vercel should use:

```text
Install Command: npm install
Build Command: npm run build:web
Output Directory: www
```

Set this Vercel environment variable:

```text
TICKETOPS_API_BASE=https://your-service.onrender.com
```

The build script generates `www/frontend-config.js` from that value. The frontend then calls the Render API instead of trying to call Vercel.

## 3.5 GitHub Publish Helper

Run:

```text
PUBLISH-GITHUB.bat
```

This builds the app, commits non-ignored project changes, and pushes to your GitHub remote. Render and Vercel can then auto-deploy from GitHub.

## Local Manual Check

Run:

```text
RELOAD-LOCAL.bat
```

This rebuilds the frontend, restarts the local server on port `3000`, and prints local URLs for manual checking.

## 4. URLs

Main operations app:

```text
https://your-vercel-domain.vercel.app/
```

Customer portal:

```text
https://your-vercel-domain.vercel.app/customer
```

Direct fallback:

```text
https://your-vercel-domain.vercel.app/customer.html
```

## Free Tier Caveats

Render Free web services sleep after idle time, so the first API request can be slow.

Do not use Render Free Postgres for this project because free Render Postgres expires after 30 days. Use Supabase Free for database persistence instead.
