# Household Expenses Manager

A full-stack TypeScript monorepo for tracking household expenses:
React 19 + Vite + Material UI frontend, Express 5 API, PostgreSQL.
Managed with Turborepo and npm workspaces.

## Features

- **Accounts** — email/password registration and login, JWT kept in an
  `httpOnly` cookie, profile e-mail update, password change, and a
  "forgot password" flow (the reset link is e-mailed over SMTP; without
  SMTP configured it is written to the server log). A reset signs the
  user out on every device; a password change signs out the other ones.
- **Expenses** — create, edit, delete; paginated list with date-range and
  category filters; inline quick-add on the dashboard.
- **Categories** — five defaults created for every new user, custom name,
  colour and icon; a category with expenses cannot be deleted.
- **Dashboard** — totals, recent expenses and a category share pie.
- **Reports** — per year: monthly totals vs. average, per-category monthly
  lines, category share doughnut, horizontal month × category table and
  category ranking.
- **Settings** — currency (PLN, USD, EUR, GBP) and light/dark theme,
  persisted server-side per user.
- Request validation, rate limiting, responsive layout.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, TypeScript 6, Material UI 9 (+ MUI X Date Pickers 9), React Router 7, Formik + Yup, Zustand, Axios, Nivo charts, dayjs; static serving with `sirv` |
| Backend | Node.js ≥ 22.12, Express 5, TypeScript 6, node-postgres (`pg`), jsonwebtoken, bcryptjs, express-validator, express-rate-limit |
| Database | PostgreSQL (developed and tested with 17) |
| Tooling | Turborepo 2, ESLint 10 (flat config), Prettier, PM2 |
| Tests | Jest 30 + ts-jest + Supertest (API integration), Vitest 5 (web unit), Playwright 1.65 (end-to-end smoke) |

## Repository layout

```
expenses-fullstack-js/
├── apps/
│   ├── api/                 Express API (port 4000)
│   │   └── src/
│   │       ├── app.ts           Express app: trust proxy, CORS, cookies, routers, /health, error handlers
│   │       ├── index.ts         dotenv + JWT_SECRET guard + listen
│   │       ├── routes/          endpoint definitions + express-validator chains
│   │       ├── controllers/     static request handlers
│   │       ├── models/          SQL queries (parameterised, camelCase aliases)
│   │       ├── middlewares/     auth, validate, rateLimit, notFound, error
│   │       ├── db/              pg Pool, migrate.ts (schema), import-legacy-expenses.ts
│   │       └── __tests__/       Jest + Supertest integration suites
│   └── web/                 React SPA (port 5173)
│       └── src/
│           ├── pages/           Dashboard, Expenses, Categories, Reports, Settings, auth pages
│           ├── components/      charts/, expenses/, reports/
│           ├── services/        Axios calls, one file per domain
│           ├── contexts/ hooks/ AuthContext, SettingsContext, useAuth, useSettings
│           ├── store/           Zustand category store
│           ├── layouts/ theme/ helpers/
│           └── **/*.test.ts     Vitest unit tests
├── packages/
│   └── shared/              Shared TypeScript types (@expenses/shared)
├── e2e/                     Playwright smoke tests (boot the built API + web app)
├── scripts/                 free-ports.js (predev), setup-dev.js, start-pm2.js
├── pm2.config.js            PM2 ecosystem for production
├── azure-pipelines.yml      Azure DevOps: build, test, smoke tests, SSH deploy
├── .github/workflows/ci.yml GitHub Actions: build, lint, test, smoke tests
├── CLAUDE.md                Guidance for Claude Code (project map, conventions)
├── DEPLOYMENT.md            Production deployment guide (Polish)
└── .claude/skills/          Agent procedures: run-expenses-fullstack, add-feature, e2e-smoke
```

## Prerequisites

- Node.js ≥ 22.12 (CI runs on 22 and 24) and npm 11
- PostgreSQL reachable from your machine (any recent version; 17 is used
  in CI and development)

`package-lock.json` is intentionally not committed; dependency versions
in the `package.json` files are pinned exactly instead.

## Setup

1. Install all workspaces from the repo root:

   ```bash
   npm install
   ```

2. Configure the API. Copy the template and fill in your database
   credentials and a JWT secret:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

   | Variable | Purpose |
   |---|---|
   | `PORT` | API port (default `4000`) |
   | `NODE_ENV` | `development` / `production` / `test` |
   | `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` | PostgreSQL connection (set `DB_PORT` explicitly) |
   | `JWT_SECRET` | required — the server refuses to start without it |
   | `JWT_EXPIRES_IN` | token and cookie lifetime, `ms` format (default `7D`) |
   | `ALLOWED_ORIGINS` | comma-separated origins allowed by CORS, e.g. `http://localhost:5173` |
   | `FRONTEND_URL` | base URL used in password-reset links (default `http://localhost:5173`) |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | SMTP server for the password-reset e-mail; port `587` (default) uses STARTTLS, `465` TLS. Empty `SMTP_HOST` = the link is only logged |
   | `MAIL_FROM` | sender of the reset e-mail, e.g. `Expense Manager <no-reply@example.com>` (default `SMTP_USER`) |
   | `TRUST_PROXY` | `true` when the API sits behind a reverse proxy (rate limiting then sees the client IP) |

3. Create the database named in `DB_NAME` (for example with `createdb
   expenses_db`), then apply the schema:

   ```bash
   npm run db:migrate --workspace=@expenses/api
   ```

   The migration is idempotent and can be re-run after schema changes.

4. (Optional) The web app talks to `http://localhost:4000` by default.
   To point it elsewhere create `apps/web/.env.local` with
   `VITE_API_URL=<api base url>` (no `/api` suffix — the API routes are
   mounted at the root).

`npm run setup` performs steps 2–3 interactively and then starts the dev
servers.

## Development

```bash
npm run dev
```

Turbo starts `packages/shared` in watch mode, the API with `ts-node`
(http://localhost:4000) and the Vite dev server (http://localhost:5173).
The `predev` hook first stops whatever is listening on ports 5173 and
4000 (works on Windows, macOS and Linux).

Run a single workspace with `npm run dev --workspace=@expenses/api` or
`--workspace=@expenses/web`. Register the first user in the UI at
`/register`.

## Build

```bash
npm run build
```

Builds `packages/shared` first (type declarations), then `apps/api`
(`dist/`) and `apps/web` (`dist/`) in parallel.

## Scripts

| Command (repo root) | Description |
|---|---|
| `npm run dev` | start shared watcher, API and web dev servers |
| `npm run build` | build all workspaces |
| `npm run lint` | ESLint in all workspaces (web fails on warnings; e2e also type-checks) |
| `npm test` | unit and integration tests (builds first) |
| `npm run test:e2e` | Playwright smoke tests against the built app (builds first) |
| `npm start` | start the production processes with PM2 (`pm2.config.js`) |
| `npm run format` | Prettier over all `*.ts`/`*.tsx` files |
| `npm run clean` | remove `dist/` folders and `node_modules` |
| `npm run setup` | interactive bootstrap: `.env`, database, migration, dev servers |
| `npm run <script> --workspace=@expenses/<api\|web\|shared\|e2e>` | run a workspace script |
| `npm run db:migrate --workspace=@expenses/api` | apply the database schema |
| `npm run db:import-legacy --workspace=@expenses/api` | one-off CSV import with hard-coded ids (not for general use) |

## Testing

```bash
npm test                                   # API integration + web unit tests
npm test --workspace=@expenses/api         # API integration tests only
npm test --workspace=@expenses/web         # web unit tests only
npm run test:e2e                           # Playwright smoke tests
```

### API integration tests (Jest + Supertest)

They run against a real PostgreSQL database configured in the committed
`apps/api/.env.test` (`expenses_test_db`, user `postgres`, password
`postgres`, port 5432). The database is created automatically on the
first run; the schema is applied by the Jest `globalSetup`. Every test
truncates all tables before and after it runs, so the suites execute
serially (`--runInBand`). If your local PostgreSQL uses other
credentials, edit `.env.test` locally without committing it.

| Suite | Covers |
|---|---|
| `app.test.ts` | `/health`, 404 shape for unknown routes |
| `auth.test.ts` | register, login, session, profile, password change, forgot/reset password (incl. the e-mail with a mocked SMTP transport and revoking old sessions on reset and change), logout |
| `categories.test.ts` | CRUD, defaults, user isolation, delete protection |
| `expenses.test.ts` | CRUD, validation, pagination, date filtering, user isolation |
| `analytics.test.ts` | `/expenses/summary`, `/expenses/by-month` |
| `settings.test.ts` | read and update currency/theme, user isolation |

Run one file: `npm test --workspace=@expenses/api -- auth`.

### Web unit tests (Vitest)

`apps/web/src/services/*.test.ts` mock the Axios instance and assert the
exact request path and payload of every service function;
`components/expenses/ExpenseForm.test.ts` covers the Yup schema. Run one
file: `npm test --workspace=@expenses/web -- expenseService`.

### Smoke tests (Playwright, `e2e/`)

`npm run test:e2e` builds the monorepo, creates a dedicated
`expenses_e2e_db` database (schema from the compiled migration), starts
the compiled API on port 4000 and the static web build on port 5173,
then runs `e2e/tests/smoke.spec.ts` in a real browser: health check,
redirect to login, registration, wrong-password message, adding an
expense from the dashboard, the Expenses table, creating and deleting a
category, changing the currency, logging out.

- Database credentials default to `postgres`/`postgres` on
  `localhost:5432`, or whatever `apps/api/.env` says; override with
  `E2E_DB_USER`, `E2E_DB_PASSWORD`, `E2E_DB_HOST`, `E2E_DB_PORT`,
  `E2E_DB_NAME`.
- Browser: run `npx playwright install chromium` once, or reuse an
  installed Edge/Chrome with `E2E_BROWSER_CHANNEL=msedge` (or `chrome`).
- Ports 4000 and 5173 must be free — stop `npm run dev` first.
- Failures keep a trace and screenshot in `e2e/test-results/`; open a
  trace with `npx playwright show-trace <path-to-trace.zip>`.

## API

Base URL: `http://localhost:4000` (no version or `/api` prefix).
Authentication uses the `token` cookie set by `register`/`login`; the
`Authorization: Bearer <jwt>` header is accepted as a fallback for
non-browser clients.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | – | liveness check |
| POST | `/users/register` | – | create account, sets cookie (201) |
| POST | `/users/login` | – | sign in, sets cookie |
| POST | `/users/logout` | cookie | clear cookie |
| GET | `/users/session` | optional | `{ user }` or `{ user: null }`, always 200 |
| GET / PUT | `/users/profile` | cookie | read / update e-mail (validated and normalized; 400 `email_in_use` when another account has it; re-issues the cookie) |
| PUT | `/users/password` | cookie | change password; signs out the other sessions and re-issues the caller's cookie |
| POST | `/users/forgot-password` | – | e-mail a reset link, or log it without SMTP (always 200) |
| POST | `/users/reset-password` | – | set a new password with the token; revokes every existing session |
| GET | `/expenses` | cookie | paginated list: `page`, `limit` (≤ 100), `startDate`, `endDate`, `categoryId`, `search` (case-insensitive description fragment), `sort` (`date` \| `amount` \| `createdAt`, default `date`), `order` (`asc` \| `desc`, default `desc`) |
| GET | `/expenses/summary` | cookie | totals per category for `startDate`–`endDate` |
| GET | `/expenses/by-month` | cookie | monthly breakdown for `year` (`totalByCategory` keyed by category id) |
| GET | `/expenses/years` | cookie | distinct years that have expenses, newest first |
| GET / PUT / DELETE | `/expenses/:id` | cookie | single expense |
| POST | `/expenses` | cookie | create expense (201) |
| GET | `/categories` | cookie | list, each with `expenseCount` |
| GET / PUT / DELETE | `/categories/:id` | cookie | single category; `DELETE ?moveTo=<id>` first moves its expenses to another of your categories |
| POST | `/categories` | cookie | create category (201) |
| GET / PUT | `/settings` | cookie | currency and theme |

Responses wrap the entity under its own key (`{ expense }`,
`{ categories }`, `{ expenses, pagination }`); mutations add a
`message`. Errors have the shape `{ message, code, details? }`, for
example `validation_error` (400, `details` maps field → message),
`auth_required` / `invalid_token` (401), `not_found` (404),
`category_has_expenses` (400), `rate_limit_exceeded` (429). Auth
endpoints allow 20 requests per 15 minutes, other routes 300.

Example with curl and a cookie jar:

```bash
curl -s -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"Password123!"}' \
  http://localhost:4000/users/login
curl -s -b cookies.txt "http://localhost:4000/expenses?page=1&limit=10"
```

## CI and deployment

- **GitHub Actions** (`.github/workflows/ci.yml`): on every push and pull
  request to `master`/`develop` — install, build, lint, unit and
  integration tests, then the Playwright smoke suite against a
  PostgreSQL 17 service container (report uploaded on failure).
- **Azure Pipelines** (`azure-pipelines.yml`): on `master` — the same
  checks, then deployment over SSH to a Linux VM: install, build, run
  the database migration and (re)start the PM2 processes from
  `pm2.config.js`.

Production setup, reverse proxy, PM2 and the pipeline prerequisites are
described in [DEPLOYMENT.md](DEPLOYMENT.md).

## Working with AI assistants

- [CLAUDE.md](CLAUDE.md) — project map, conventions and verification
  rules for Claude Code; `.claude/skills/` holds the procedures for
  running the app (`run-expenses-fullstack`), adding a feature
  end-to-end (`add-feature`) and running or extending the smoke tests
  (`e2e-smoke`).
- `.github/copilot-instructions.md` and `.github/instructions/*.md` —
  the GitHub Copilot variants of the same conventions.
