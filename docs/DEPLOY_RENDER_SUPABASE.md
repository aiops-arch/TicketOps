# Deploy on Render with Supabase

This setup keeps the app fast and free for light usage:

- Render hosts the Node API and web app.
- Supabase stores all production data.
- Local JSON storage remains only for development.

## Free-Tier Reality

This can run at zero cost while usage stays inside free-tier limits.

- Render Free web services spin down after 15 minutes without traffic and wake on the next request.
- Render Free web services use an ephemeral filesystem, so production data must not be stored in `data/db.json`.
- Supabase Free provides limited project and usage quotas. If you exceed them, Supabase may restrict the project until usage drops or the project is upgraded.

## 1. Create Supabase Project

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Go to Project Settings > API.
5. Copy:
   - Project URL
   - `service_role` key

The service role key must stay server-side only. Never place it in frontend code or mobile builds.

## 2. Deploy to Render

Use the included `render.yaml` blueprint.

1. Push this repo to GitHub.
2. In Render, create a new Blueprint from the repo.
3. Choose the Free instance type.
4. Add these environment variables:

```text
NODE_ENV=production
REQUIRE_SUPABASE=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Render will run:

```text
npm install && npm run build:web
npm start
```

## 3. Verify Production

Open:

```text
https://your-render-service.onrender.com/api/health
```

Expected:

```json
{
  "ok": true,
  "name": "TicketOps API",
  "storage": "supabase",
  "auth": "demo"
}
```

Then open the Render app URL and log in:

```text
chintan.patel / chintan123
meet.patel / meet123
pratik.patel / pratik123
hussain.sheikh / hussain123
vicky / vicky123
rahul.patil / rahul123
abrar / abrar123
```

## 4. Mobile API URL

For APK/mobile builds, set the API URL inside the app connection screen to:

```text
https://your-render-service.onrender.com
```

Do not use Supabase keys inside the mobile app. Mobile clients should only call the Render API.

## Notes

- `REQUIRE_SUPABASE=true` prevents accidental production launches on Render's temporary filesystem.
- If Supabase variables are missing, the Render deploy fails fast instead of silently using local JSON.
- For paid or higher traffic production, upgrade Render/Supabase as needed.
