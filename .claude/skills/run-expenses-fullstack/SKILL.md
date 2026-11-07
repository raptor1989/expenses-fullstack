---
name: run-expenses-fullstack
description: Build, run, and drive the Household Expenses Manager (Express API + React/Vite web app, PostgreSQL, Turborepo monorepo). Use when asked to start the API or web dev servers, run DB migrations, build the monorepo, run tests, smoke-test the API with curl, or log into / screenshot / interact with the web UI in a real browser.
---

Fullstack app: `apps/api` (Express 5 + PostgreSQL, port 4000) and
`apps/web` (React 19 + Vite 8, port 5173), sharing types from
`packages/shared`. Drive the running web UI with
`.claude/skills/run-expenses-fullstack/driver.mjs` — a small
`playwright-core` script that launches the system-installed Microsoft
Edge (no Chromium download) and logs in / fills forms / screenshots.
For automated end-to-end checks use the Playwright smoke suite instead
(skill `e2e-smoke`). Paths below are relative to the repo root.
Verified 2026-11-07.

## Prerequisites

- Node ≥ 22.12, npm 11. PostgreSQL running and reachable (17 on this
  machine, port 5432, service `postgresql-x64-17`).
- `playwright-core` for the driver — not a project dependency; install
  per session with `npm install --no-save playwright-core` (never touches
  `package.json`). It reuses Edge through `channel: 'msedge'`.

## Setup

```bash
npm install   # from the repo root — all workspaces
```

If `node_modules` is older than the last dependency bump (symptom:
`TS5103 Invalid value for '--ignoreDeprecations'` or peer conflicts on
`@typescript-eslint`), delete `node_modules`, `apps/*/node_modules`,
`packages/*/node_modules`, `e2e/node_modules` and the gitignored
`package-lock.json`, then reinstall.

`apps/api/.env` must exist (copy `apps/api/.env.example`, fill in the
real DB credentials, a non-empty `JWT_SECRET`, and `ALLOWED_ORIGINS`
containing `http://localhost:5173`). Set `DB_PORT` explicitly — the code
fallback is 5433. `apps/web` needs no `.env`: `VITE_API_URL` defaults to
`http://localhost:4000` (no `/api` suffix). `npm run setup` does the
`.env` copy, database creation and migration interactively.

Schema (idempotent, safe to re-run):

```bash
npm run db:migrate --workspace=@expenses/api
```

## Build

```bash
npm run build          # shared → api + web (Turbo); 3/3 tasks on a clean checkout
```

## Run (agent path)

Start each server in the background, wait for it, then drive it.

```bash
# 1. API — dotenv is loaded inside src/index.ts, no -r dotenv/config needed.
#    DB_NAME=expenses_test_db runs it against the disposable test DB (schema kept
#    current by the test suite) instead of the developer's expenses_db.
cd apps/api && DB_NAME=expenses_test_db npx ts-node src/index.ts    # run_in_background
curl --retry 30 --retry-delay 1 --retry-connrefused -sf http://localhost:4000/health   # {"status":"ok",...}

# 2. Web — an explicit VITE_API_URL beats a stale apps/web/.env.local
cd apps/web && VITE_API_URL=http://localhost:4000 npx vite          # run_in_background
curl --retry 30 --retry-delay 1 --retry-connrefused -sfo /dev/null http://localhost:5173/ && echo web up
```

Create a user for the smoke test (idempotent: a second call returns 400
`email_in_use`, which is fine):

```bash
curl -s -X POST http://localhost:4000/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"smoketest@example.com","password":"Password123!"}'
```

Drive the UI:

```bash
npm install --no-save playwright-core

node .claude/skills/run-expenses-fullstack/driver.mjs \
  login-screenshot smoketest@example.com 'Password123!' "$TMPDIR/dashboard.png"

node .claude/skills/run-expenses-fullstack/driver.mjs \
  add-expense-screenshot smoketest@example.com 'Password123!' "Grocery run" 42.50 "$TMPDIR/expense.png"
```

| driver command | what it does |
|---|---|
| `screenshot <url> <out.png>` | navigate + screenshot, no auth (e.g. `http://localhost:5173/login`) |
| `login-screenshot <email> <password> <out.png>` | fills `#email`/`#password`, submits, waits for the dashboard ("Add Expense" card), screenshots |
| `add-expense-screenshot <email> <password> <description> <amount> <out.png>` | logs in, picks the first category in the dashboard's inline form (MUI `Select`), fills amount/description, clicks Save, waits for the "Expense added successfully!" snackbar and for the new row in "Last 10 expenses" (the dashboard refetches by itself), screenshots |

`WEB_URL` env var overrides `http://localhost:5173`. The driver prints
browser console errors after each command — read them.

API-only smoke test (auth is an httpOnly cookie, so keep a cookie jar):

```bash
curl -s -c "$TMPDIR/cookies.txt" -X POST http://localhost:4000/users/login \
  -H "Content-Type: application/json" -d '{"email":"smoketest@example.com","password":"Password123!"}'
curl -s -b "$TMPDIR/cookies.txt" http://localhost:4000/categories
curl -s -b "$TMPDIR/cookies.txt" "http://localhost:4000/expenses?page=1&limit=5"
curl -s -b "$TMPDIR/cookies.txt" http://localhost:4000/settings
```

Stop both servers when done — kill the background tasks you started, or
free the ports: `node scripts/free-ports.js 4000 5173` (kills listeners
only; works on Windows, macOS and Linux).

## Run (human path)

```bash
npm run dev   # predev frees 5173/4000, then Turbo starts shared (tsc --watch), api (ts-node), web (vite)
```

Production-like run of the build output: `npm run build`, then
`npm start` (PM2 from `pm2.config.js`: compiled API + `sirv dist --single`).

## Test

```bash
npm test                               # API integration + web unit (builds first)
npm test --workspace=@expenses/api     # Jest + Supertest, 6 suites / 78 tests, needs PostgreSQL
npm test --workspace=@expenses/web     # Vitest, 5 files / 29 tests, no DB
npm test --workspace=@expenses/api -- auth   # one suite
E2E_BROWSER_CHANNEL=msedge npm run test:e2e  # Playwright smoke suite, 9 tests — skill e2e-smoke
```

API tests use the committed `apps/api/.env.test` (`expenses_test_db`,
`postgres`/`postgres`, port 5432); the DB is created on first run. Test
files load `.env.test` with `override: true`, so exporting `DB_PORT=...`
in the shell is **not** enough — edit `.env.test` locally (don't commit)
if the local Postgres differs.

## Gotchas

- **No `/api` prefix.** Routers mount at `/users`, `/expenses`,
  `/categories`, `/settings`; `GET /health` is the liveness check;
  anything else is 404 `not_found`.
- **Stale `apps/web/.env.local`.** The gitignored local override may
  still say `VITE_API_URL=http://localhost:4000/api`; symptom:
  `Error: Not Found - /api/users/session` in the API log and a login
  that never navigates. Fix the file or start Vite with
  `VITE_API_URL=http://localhost:4000` (process env wins).
- **Stale dev database.** `POST /users/register` → 500
  `registration_failed` with an `ExecConstraints` error (`username`
  NOT NULL) in the API log means `expenses_db` predates the current
  `migrate.ts`. Run `npm run db:migrate --workspace=@expenses/api`
  (idempotent; drops the unused `username`/`first_name`/`last_name`
  columns), or point the API at `expenses_test_db` as above.
- **`GET /users/session` is the SPA's startup check** and answers
  `200 { user: null }` without a cookie. A 401 anywhere else
  hard-redirects to `/login` (axios interceptor in
  `apps/web/src/services/api.ts`), except failed login/register
  attempts, which stay on the form and show the API message.
- **Rate limits:** 20 register/login/reset attempts per 15 min per IP,
  300 other requests. Don't loop logins in a retry script; after a 429
  wait or restart the API (limits are in memory). `NODE_ENV=test`
  disables the auth limiter.
- **Category field on the dashboard is a MUI `<Select>`**, not a native
  `<select>`: open it by clicking `#mui-component-select-categoryId`,
  then `ArrowDown` + `Enter` (clicking an option by text is flaky in the
  bare driver; Playwright Test's `getByRole('option')` is fine).
- **Default theme is dark**; `localStorage.themeMode` and the server
  setting both influence it. Screenshots of a fresh profile are dark on
  the auth pages and light after login (server default).
- **Password reset** writes the link to the API console and to
  `apps/api/logs/password-resets.log` — read it from there in a test.
- **Stale `packages/shared/tsconfig.tsbuildinfo`** can leave `dist/`
  without `.d.ts` → consumers fail with `TS7016`. Delete
  `packages/shared/dist` and the buildinfo, rebuild shared.
- **`ts-node` in `apps/api` uses `apps/api/tsconfig.json`** (CommonJS).
  Run it from `apps/api`, not from the repo root (the root tsconfig is
  ESNext and breaks it).
- **Turbo strict env:** `npm run <task>` through Turbo drops exported
  variables unless the task lists them in `passThroughEnv`
  (`turbo.json`). Start servers directly (as above) when you need
  custom env.

## Troubleshooting

- `FATAL: JWT_SECRET environment variable is not set` → `apps/api/.env`
  missing or empty secret.
- `{"code":"registration_failed"}` from `/users/register` → stale dev DB
  schema (see Gotchas); `{"code":"invalid_credentials"}` on login right
  after → the registration never happened.
- `Not Found - /api/...` in the API log while the UI does nothing → stale
  `apps/web/.env.local` (see Gotchas).
- `ECONNREFUSED ...:5433` → `DB_PORT` not set in `.env` (code fallback is
  5433) or Postgres is down (`Get-Service postgresql-x64-17`).
- Browser login fails with a CORS error → `ALLOWED_ORIGINS` lacks
  `http://localhost:5173`.
- `TS5103` / peer-dependency errors on build or install → stale
  `node_modules` (see Setup).
- `Cannot find module '<dep>'` → `npm install` from the repo root
  (workspaces share one `node_modules`).
- `page.fill` timeout on `#email` → web server not up yet or wrong
  `WEB_URL`; try `screenshot http://localhost:5173/login` first.
- Driver fails to launch → Edge missing or `playwright-core` not
  installed in this session.
