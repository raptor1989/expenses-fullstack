---
name: run-expenses-fullstack
description: Build, run, and drive the Household Expenses Manager (Express API + React/Vite web app, PostgreSQL, Turborepo monorepo). Use when asked to start the API or web dev servers, run DB migrations, build the monorepo, run tests, or log into / screenshot / interact with the web UI.
---

Fullstack app: `apps/api` (Express + PostgreSQL, port 4000) and `apps/web`
(React + Vite, port 5173), sharing types from `packages/shared`. Drive the
running web UI with `.claude/skills/run-expenses-fullstack/driver.mjs` — a
small Playwright script that launches the system-installed Microsoft Edge
(no Chromium download needed) and logs in / fills forms / screenshots.
All paths below are relative to the repo root.

## Prerequisites

- Node >= 20, npm. PostgreSQL running and reachable (any version — this
  was verified against PostgreSQL 17 on Windows).
- `playwright-core` for the driver — not a project dependency, install it
  on demand (see Run section). It reuses your installed Edge/Chrome via
  the `channel` option, so no browser binary download is required.

## Setup

```bash
npm install   # from repo root — installs all workspaces
```

Create `apps/api/.env` from `apps/api/.env.example` and point it at
**your actual local Postgres**, not the example defaults:

```bash
cp apps/api/.env.example apps/api/.env
# then edit DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME to match your install
```

Find your real port/credentials first — don't assume 5432/postgres/postgres
(see Gotchas). `ALLOWED_ORIGINS` must include the web dev origin
(`http://localhost:5173`) or the browser login flow will be blocked by CORS.
`JWT_SECRET` must be a non-empty string or the API refuses to start.

`apps/web` needs no `.env` — `VITE_API_URL` falls back to
`http://localhost:4000/api` in `apps/web/src/services/api.ts`.

Run migrations (creates `users`, `categories`, `expenses` tables/triggers;
safe to run against a DB that already has unrelated tables — uses
`CREATE TABLE IF NOT EXISTS`):

```bash
cd apps/api && npx ts-node -r dotenv/config src/db/migrate.ts
```

The `-r dotenv/config` is required — see Gotchas.

## Build

```bash
npm run build --workspace=@expenses/shared   # must run first, see Gotchas
npm run build --workspace=@expenses/web      # verified clean
```

`npm run build --workspace=@expenses/api` (and therefore the root
`npm run build`) **currently fails** on this branch — six pre-existing
`TS2345` errors in `category.controller.ts`/`expense.controller.ts`
(`req.params.id` typed `string | string[]` passed where `string` is
expected). That's existing/WIP code, not something this skill patches.
Run the API in dev with `--transpile-only` (below) to work around it.

## Run (agent path)

Start both servers, then drive the web UI through the real browser:

```bash
# 1. API (bypass the type errors above; -r dotenv/config loads apps/api/.env
#    before any module reads process.env — required, see Gotchas)
cd apps/api && npx ts-node --transpile-only -r dotenv/config src/index.ts &
# wait for it:
curl -sf http://localhost:4000/health

# 2. Web
cd apps/web && npx vite &
curl -sf http://localhost:5173/
```

Then drive it:

```bash
npm install --no-save playwright-core   # one-time per session, not a project dep

node .claude/skills/run-expenses-fullstack/driver.mjs \
  login-screenshot smoketest@example.com 'Password123!' /tmp/dashboard.png

node .claude/skills/run-expenses-fullstack/driver.mjs \
  add-expense-screenshot smoketest@example.com 'Password123!' "Grocery run" 42.50 /tmp/expense.png
```

The user must already exist — register first if needed:

```bash
curl -s -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"smoketest@example.com","password":"Password123!"}'
```

| driver command | what it does |
|---|---|
| `screenshot <url> <out.png>` | nav + screenshot, no auth (e.g. `/login` page) |
| `login-screenshot <email> <password> <out.png>` | fills `#email`/`#password`, clicks Sign In, waits for the dashboard, screenshots |
| `add-expense-screenshot <email> <password> <description> <amount> <out.png>` | logs in, opens the dashboard's inline expense form, picks "General" from the category `Select`, fills amount/description, clicks Save, waits for the new row, screenshots |

API-only smoke test without a browser (auth is httpOnly-cookie based, so
use a cookie jar — see Gotchas):

```bash
curl -s -c /tmp/cookies.txt -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" -d '{"email":"smoketest@example.com","password":"Password123!"}'
curl -s -b /tmp/cookies.txt http://localhost:4000/api/categories
```

Stop both servers when done: find PIDs listening on 4000/5173 and kill them
(`Get-NetTCPConnection -LocalPort 4000,5173 -State Listen` on Windows, or
`lsof -i:4000,5173` elsewhere).

## Run (human path)

```bash
npm run dev   # turbo: starts shared (tsc --watch), api, and web together
```

Currently **fails for `@expenses/api`** in this branch — its `dev` script
is plain `ts-node` (no `--transpile-only`), so it hits the same TS2345
errors as the build. `@expenses/shared` and `@expenses/web` start fine
under this command; only the API needs the manual `--transpile-only`
launch from the agent path above.

## Test

```bash
cd apps/api
DB_PORT=<your-port> DB_USER=<your-user> DB_PASSWORD=<your-password> \
  npx jest --config jest.config.js --runInBand --forceExit
```

The committed `apps/api/.env.test` assumes `5432`/`postgres`/`postgres`;
override via env vars (as above) if your local Postgres differs — `dotenv`
never overwrites variables already present in `process.env`, so exported
vars win. **Currently this also fails to run any tests** — `ts-jest`
type-checks too, and hits the same pre-existing TS2345 errors, so all 4
suites fail at compile time before a single test executes.

---

## Gotchas

- **`.env.example` defaults are not your machine's defaults.** This dev
  box's PostgreSQL listens on port `5433`, not `5432`, with a non-default
  password. Confirm the real port before writing `apps/api/.env`:
  `Get-NetTCPConnection -State Listen | Where-Object LocalPort -in 5432,5433`
  (or check `Get-Service -Name "*postgres*"` then the data dir's
  `postgresql.conf`).
- **`dotenv.config()` runs too late in `apps/api/src/index.ts`.** The file
  is `import dotenv from 'dotenv'; import app from './app'; dotenv.config();`
  — ES imports execute before the rest of the module body, so `./app`
  (and transitively `./db`, which builds the `pg.Pool` from
  `process.env.DB_*` at import time) loads **before** `dotenv.config()`
  runs. Symptom: API connects to `localhost:5432` with `postgres`/`postgres`
  even though your `.env` says otherwise, or CORS silently blocks the web
  origin because `ALLOWED_ORIGINS` read as `undefined`. Fix: always launch
  with `-r dotenv/config` (`npx ts-node -r dotenv/config src/index.ts`).
  `src/db/migrate.ts` doesn't call `dotenv.config()` at all, so it needs
  the same `-r dotenv/config` preload unconditionally.
- **Auth is httpOnly-cookie based, not Bearer-in-body.** `POST
  /api/users/login` sets a `token` cookie via `res.cookie(...)` and returns
  no token in the JSON body. Use a cookie jar with curl (`-c`/`-b`), and
  in a browser driver make sure axios/fetch sends credentials (the app's
  `api.ts` already sets `withCredentials: true`).
- **Visiting `/login` cold causes an infinite reload loop.** On mount,
  `AuthContext` calls `GET /api/users/profile` to check for an existing
  session. Without a cookie this 401s, and the global axios response
  interceptor does `window.location.href = '/login'` on **any** 401 —
  including this one, even though you're already on `/login`. That's a
  hard navigation, which reloads the page, re-runs the same check, gets
  401 again, and reloads forever. The driver works around it by routing
  `**/api/users/profile` to a fake `200 {user: null}` response before
  navigating (see `driver.mjs`) — this is a real frontend bug, not
  something to silently "fix" as part of running the app.
- **The `pg.Pool` has no `.on('error', ...)` handler.** If the Postgres
  connection drops for any reason (service restart, admin kill), the
  unhandled `error` event crashes the entire Node process, not just the
  in-flight query. If the API stops responding mid-session, check
  Postgres is still up and just restart the API — there's no graceful
  recovery built in.
- **Stale `packages/shared/tsconfig.tsbuildinfo` silently breaks
  consumers.** TypeScript's incremental build can skip emitting
  `dist/index.d.ts` if the buildinfo cache thinks nothing changed, even
  when `dist/` is empty/stale. Symptom: `apps/web`/`apps/api` builds fail
  with `TS7016: Could not find a declaration file for module
  '@expenses/shared'` even right after building shared. Fix:
  `rm -rf packages/shared/dist packages/shared/tsconfig.tsbuildinfo`
  before `npm run build --workspace=@expenses/shared`.
- **The category field on the dashboard is a MUI `<Select>`, not a
  native `<select>`.** `page.selectOption()` won't work. Click the
  combobox div by its predictable id (`#mui-component-select-<fieldName>`,
  e.g. `#mui-component-select-categoryId`) to open the popup. Clicking a
  specific `li[role="option"]` by text is flaky (the popup's position
  isn't always settled the instant Playwright clicks) — use keyboard nav
  instead: `ArrowDown` then `Enter` reliably picks an option once the
  popup is open.
- **No Chrome/`chromium-cli` on this machine, but Edge is installed.**
  `playwright-core` with `chromium.launch({ channel: 'msedge' })` reuses
  it — no ~300MB Chromium download. Install with
  `npm install --no-save playwright-core` so it never touches
  `package.json`/the lockfile.
- **Login is rate-limited** (`RateLimit-Policy: 20;w=900` on the response
  headers) — don't loop login attempts in a tight retry script.

## Troubleshooting

- **`ECONNREFUSED ::1:5432` / `127.0.0.1:5432` when running the API or
  migrations**, even though `.env` specifies a different port: dotenv
  loaded too late (see Gotchas) — add `-r dotenv/config` to the launch
  command, or your `.env` simply has the wrong port for this machine.
- **`Cannot find module 'cookie-parser'` (or any dependency that's in
  `package.json` but errors as missing)**: `node_modules` is out of sync
  with `package.json` — run `npm install` from the repo root (workspaces
  share one `node_modules`).
- **`TS7016: Could not find a declaration file for module
  '@expenses/shared'`**: see the `tsconfig.tsbuildinfo` Gotcha above —
  clean-rebuild the shared package.
- **`page.fill`/`page.click` timeouts on a blank white page when scripting
  the web app**: you're hitting the `/login` reload loop (see Gotchas) —
  route `**/api/users/profile` to a non-401 response before navigating.
- **`psql: ... authorization failed for user "postgres"`**: the
  `.env.example` password (`postgres`) is just a placeholder; get the
  real credentials for the Postgres instance actually running on this
  machine.
