## Production Release Plan (Free, Non–Self-Hosted): **Vercel (Web + API) + Neon (Postgres)**

### Summary
Ship a “small-production” release on $0 tiers by:
- Hosting **frontend (Vite/React SPA)** on **Vercel** (Hobby/free) and **backend (FastAPI)** on **Vercel Functions**. ([vercel.com](https://vercel.com/docs/plans))  
- Hosting **Postgres** on **Neon Free** (no card required; serverless/scale-to-zero). ([neon.com](https://neon.com/pricing))  
- Updating the codebase to remove dev-only assumptions (hardcoded CORS, dev Docker entrypoints, env handling), and adding a safe migration/deploy workflow.

---

## 1) Codebase changes needed for “production-ready enough”
### 1.1 Config + secrets (must-do)
1. **Stop using committed dev secrets**:
   - Treat `api/docker/config.env` and `web/docker/config.env` as *dev-only examples*.
   - Add `api/.env.example` and `web/.env.example` (no real secrets).
2. **Centralize runtime settings for API** (already partially there in `api/src/core/conf.py`):
   - Add settings for:
     - `environment` (`dev|prod`)
     - `cors_allow_origins` (comma-separated)
     - `cors_allow_origin_regex` (for Vercel preview domains)
     - `trusted_hosts` (optional)
     - `docs_enabled` (optional)
   - Keep required: `database_dsn`, `secret_key`.
3. **Make CORS production-configurable**:
   - Replace hardcoded localhost origins in `api/src/main.py` with settings-driven values.

### 1.2 API hardening (must-do)
4. **Production server defaults**:
   - Ensure `DEBUG=False` in production env.
   - Ensure SQL echo/logging doesn’t leak sensitive data.
5. **Proxy awareness** (recommended on Vercel):
   - Configure the app to behave correctly behind proxies (headers/origin/host assumptions).
6. **Database connection safety for serverless**:
   - Use Neon’s pooled connection string if available (pgBouncer) and keep connection counts low (serverless bursts).
7. **Docs exposure** (recommended):
   - Keep `/docs` on for now, but add an easy kill-switch via env (`DOCS_ENABLED=false`) if you need to hide it quickly.

### 1.3 Frontend production readiness (must-do)
8. **SPA routing on Vercel**:
   - Add `web/vercel.json` to rewrite all non-file routes to `/index.html` so TanStack Router deep-links work.
9. **Runtime API URL**:
   - Keep using `VITE_API_URL`, but set it in Vercel env to the deployed API URL (no localhost in prod).

### 1.4 Repo hygiene (recommended)
10. Add a real `.gitignore` (repo-local) covering `node_modules/`, `dist/`, `__pycache__/`, `.venv/`, `.env*`, `api/data/`, etc.

---

## 2) Hosting/deployment choices (free + not self-hosted)
### 2.1 Database: Neon (Free)
- Create Neon project in an EU region (closest to Lisbon).
- Free plan is $0 and explicitly “no credit card required”; it scales compute to zero when idle. ([neon.com](https://neon.com/pricing))  
- Use a connection string formatted for SQLAlchemy/psycopg: `postgresql+psycopg://...?...sslmode=require`.

### 2.2 Backend: Vercel (FastAPI)
- Deploy FastAPI on Vercel per their FastAPI backend framework guidance. ([vercel.com](https://vercel.com/docs/frameworks/backend/fastapi))  
- Vercel Hobby is free and will **pause** if you exceed included usage—plan around that for “$0 production.” ([vercel.com](https://vercel.com/docs/plans))  

### 2.3 Frontend: Vercel (Vite)
- Deploy `web/` as a Vite static build on Vercel (Hobby).

---

## 3) Step-by-step execution plan (decision-complete)
### Phase A — Prep: production configuration + entrypoints
1. Add `.env.example` files:
   - `api/.env.example`: `DATABASE_DSN=`, `SECRET_KEY=`, `DEBUG=`, `CORS_ALLOW_ORIGINS=`, `CORS_ALLOW_ORIGIN_REGEX=`, `FRONTEND_URL=`
   - `web/.env.example`: `VITE_API_URL=`
2. Update API settings + CORS:
   - Edit `api/src/core/conf.py` to include new settings listed above.
   - Edit `api/src/main.py`:
     - Build CORS config from settings (origins list + optional regex).
     - Keep localhost origins only in `environment=dev`.
3. Add Vercel API entrypoint:
   - Create `api/index.py` that exposes the FastAPI instance from `api/src/main.py` (import and re-export `app`).
   - Ensure imports work with current `src` namespace layout.
4. Add SPA rewrites:
   - Create `web/vercel.json`:
     - Rewrite `/(.*)` → `/index.html` (and exclude assets if needed).

### Phase B — Provision Neon (database)
5. Create Neon project + database.
6. Copy Neon connection string and convert it to SQLAlchemy DSN:
   - Ensure `sslmode=require`.
7. Run migrations against Neon:
   - Preferred: add a GitHub Actions workflow `migrate-prod.yml` (manual `workflow_dispatch`) that runs `alembic upgrade head` using a GitHub Secret `DATABASE_DSN_PROD`.
   - Alternative (manual, one-time): run Alembic locally *inside Docker* with prod DSN injected, then remove it from shell history.

### Phase C — Deploy backend on Vercel
8. Create a **Vercel Project**: “fairshare-api”
   - Root Directory: `api`
   - Set env vars (Production):
     - `DATABASE_DSN` = Neon DSN (`postgresql+psycopg://...`)
     - `SECRET_KEY` = long random string (no quotes)
     - `DEBUG` = `false`
     - `CORS_ALLOW_ORIGINS` = `https://<your-frontend-domain>`
     - `CORS_ALLOW_ORIGIN_REGEX` = `^https://fairshare-web.*\\.vercel\\.app$` (optional, for previews)
9. Deploy and verify:
   - Hit `https://<api-domain>/-/alive/` returns `"ok"`.

### Phase D — Deploy frontend on Vercel
10. Create a **Vercel Project**: “fairshare-web”
    - Root Directory: `web`
    - Build Command: `npm run build`
    - Output Directory: `dist`
    - Env var (Production): `VITE_API_URL=https://<api-domain>`
11. Deploy and verify:
    - Load `/`, `/dashboard`, and a deep link like `/groups/123` (should render SPA, not 404).
    - Register + login + basic CRUD flows succeed.

### Phase E — Operational basics (still free)
12. Add uptime monitoring (free tier) hitting:
    - Web root URL
    - API `/-/alive/`
13. Define rollback procedure:
    - Vercel rollback to previous deployment for web/api.
    - Neon: use restore/time-travel window as available on Free (limited). ([neon.com](https://neon.com/pricing))  

---

## Public API / interface changes
- New API environment variables (in Vercel + `.env.example`):
  - `CORS_ALLOW_ORIGINS`, `CORS_ALLOW_ORIGIN_REGEX`, optional `DOCS_ENABLED`, `ENVIRONMENT`
- New deployment entrypoint: `api/index.py` (Vercel-facing)
- New Vercel SPA routing config: `web/vercel.json`

---

## Test cases / acceptance criteria
1. CI stays green (existing GitHub Actions).
2. Prod smoke:
   - API health: `/-/alive/` = `"ok"`
   - Auth: register/login, token works on protected routes
   - Groups: create group, add member/join flow (if applicable), view group
   - Expenses: create expense + splits, balances render in UI
3. Browser checks:
   - Hard refresh on `/dashboard` and `/groups/:id` works (SPA rewrite).
4. Security checks:
   - CORS only allows intended origins (prod domain + optional preview regex).
   - `DEBUG` off in prod.

---

## Assumptions / defaults
- You’re okay with “$0 production” constraints: Hobby usage caps and possible pausing on Vercel; serverless cold starts. ([vercel.com](https://vercel.com/docs/plans))  
- No credit card is available/allowed; Neon Free explicitly supports that. ([neon.com](https://neon.com/pricing))  
- Email verification, password reset, and refresh tokens are out of scope for the first production release (recommended follow-ups).
