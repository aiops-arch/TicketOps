# Contributing to TicketOps

This document defines how work moves through this repository — branching, environments,
deployment, and the rules that keep production safe while multiple people build in
parallel. Read this before opening your first branch.

---

## 1. Environments

| Environment | Branch | Frontend | Backend | Who touches it |
|---|---|---|---|---|
| **Production** | `main` | Vercel prod domain (`ticketops-silk.vercel.app`) | Live Apps Script deployment (`clasp deploy -i <live id>`) | Only via reviewed merge + explicit deploy step |
| **Demo / Staging** | `demo` | Vercel preview deployment (auto-built from the `demo` branch) | Same live Apps Script backend (read/write against real data — see §5) | All contributors integrate here |
| **Individual work** | `demo/<name>-<feature>` | Not deployed (local only) | N/A | One person's in-progress work |

`main` is production. Nothing lands there except a deliberate, confirmed release. `demo`
is the shared integration line everyone builds against day to day.

---

## 2. Branching strategy

```
main                      ← production, protected, deploy-on-merge only
 └── demo                 ← shared integration branch (this is where PRs land)
      ├── demo/alice-scheduler
      ├── demo/bob-manager-desk-fix
      └── demo/<you>-<feature>
```

Rules:

- **Never commit or push directly to `main`.** All production changes arrive via a
  reviewed merge from `demo`.
- **Never push directly to `demo` either** — branch off it, PR back into it. Treat
  `demo` like you'd treat `main` on a normal project.
- One branch per person per feature/fix. Keep them short-lived — open the PR as soon as
  the slice is reviewable, don't let branches drift for weeks.
- Name branches `demo/<yourname>-<short-feature>` (e.g. `demo/alice-scheduler-cols`,
  `demo/bob-fix-manager-grid`) so it's obvious at a glance who owns what.

---

## 3. Getting started

```bash
git clone https://github.com/aiops-arch/TicketOps.git
cd TicketOps
git checkout demo
git pull
git checkout -b demo/<yourname>-<feature>

npm install
npm run build:web        # builds src/ → www/
npx http-server www -p 8080
# open http://localhost:8080
```

This hits the **real live Apps Script backend** for data (see §5) — there is no local
mock backend maintained going forward, so you're always testing against live data
shape. Be deliberate with any destructive action (delete, reset) while testing.

---

## 4. Development workflow

1. Branch off `demo` (never off `main`).
2. Commit in small, reviewable increments. Write commit messages that explain *why*,
   not just *what* changed.
3. Push your branch: `git push -u origin demo/<yourname>-<feature>`.
4. Open a PR **into `demo`** (not `main`).
5. Get it reviewed. Address feedback with new commits (don't force-push over review
   history unless asked).
6. Once approved, merge into `demo`. Vercel will auto-build a preview deployment from
   the updated `demo` branch — check the Vercel dashboard for the current URL (a
   persistent branch alias avoids the URL changing on every push, and is worth
   configuring in Project Settings → Domains if not already set up).
7. `demo` accumulates everyone's merged work. When it's ready to become the real
   product, see §6.

---

## 5. Backend / deployment realities (read before touching `Code.gs`)

- **Frontend deploy = commit + push to `main`.** Vercel builds `src/` → `www/` via
  `npm run build:web` and serves it from the production domain. This is why nothing
  gets pushed to `main` casually.
- **Backend is a single live Google Apps Script deployment.** The live deployment ID
  is fixed — redeploying without pinning `-i <live-deployment-id>` generates a *new*
  `/exec` URL and breaks the frontend instantly. Never run `clasp deploy` without the
  explicit `-i` flag pointing at the current live ID.
- **`Code.gs` drift:** the repo's copy of `Code.gs` can lag behind what's actually
  live (live-only fixes get hotfixed directly sometimes). Before any `clasp push`,
  `clasp clone <scriptId>` into a scratch directory and diff it against the repo
  version — reconcile before pushing, don't push blind.
- **Apps Script deployment is anonymous (`ANYONE_ANONYMOUS`)** and auth is
  header-only (`X-TicketOps-User` / `X-TicketOps-Role`, no signed token). This is
  acceptable for an internal demo but is **not** a real security boundary — treat any
  data behind it as internal-only until a signed-token auth model is built. Flag it
  loudly if this backend ever starts holding real customer/business data.
- Full system status (routes, known bugs, dead code) is tracked in
  [`docs/SYSTEM-MAP.md`](docs/SYSTEM-MAP.md) — check it before assuming a view or
  route works as expected.

---

## 6. Going from `demo` to official / production

This is a deliberate, human-confirmed step, not something that happens automatically:

1. `demo` is reviewed as a whole and agreed to be release-ready.
2. Merge `demo` → `main`.
3. Push `main` (this triggers the real Vercel production deploy).
4. If backend changes are included, `clasp clone` + diff + reconcile, then
   `clasp deploy -i <live-deployment-id>` — never a bare `clasp deploy`.
5. Verify production after deploy (smoke-test login, bootstrap, and any changed
   routes) before calling it done.

---

## 7. Definition of done (per PR into `demo`)

- [ ] Branch is named `demo/<yourname>-<feature>`.
- [ ] Change is scoped — no unrelated refactors bundled in.
- [ ] Tested locally against the live backend (§3).
- [ ] No direct edits to `main`.
- [ ] No `clasp deploy` run without `-i <live-deployment-id>`.
- [ ] PR description explains *why*, links any related issue/context.
- [ ] Reviewed and approved before merge.
