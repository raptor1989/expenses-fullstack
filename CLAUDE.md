# CLAUDE.md

Guidance for Claude Code in this repository. This file is the source of
truth for how the project works today; `.github/copilot-instructions.md`
and `.github/instructions/*.md` carry the same rules for GitHub Copilot
in a shorter form. When any doc disagrees with the code, trust the code,
then this file, and fix the doc.

Facts below were verified against the code on 2026-11-07 (build, lint,
unit, integration and smoke tests green — see "Verification baseline").

## Core principles

- **Honesty**: do not distort or omit facts.
- **Evidence-based**: base conclusions on user data and tool results.
- **Neutrality**: avoid assumptions unsupported by context.
- **Task focus**: do not stray from the scope of the request.
- **Technical clarity**: use precise language, provide concrete steps.
- **Thoroughness**: close tasks end-to-end (analysis, change, verification).

These guidelines bias toward caution over speed. For trivial tasks, use
judgment.

### 1. Think before coding

Don't assume. Don't hide ambiguity. Surface trade-offs.

- State assumptions explicitly. When in doubt — ask.
- If multiple interpretations exist, present them — don't choose silently.
- If a simpler approach exists, mention it. Challenge when justified.
- If something is unclear — stop. Name the problem. Ask.

### 2. Simplicity first

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked for.
- No abstractions for one-time code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.

Ask: "Would a senior engineer say this is over-engineered?" If yes — simplify.

### 3. Surgical changes

Touch only what you must. Clean up only after yourself.

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that work.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code — mention it, don't remove it.
- Remove imports/variables/functions that YOUR changes made unused; don't
  remove pre-existing dead code unless asked.

Test: every changed line should directly follow from the user's request.

### 4. Goal-oriented execution

Define success criteria. Iterate until verified.

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix a bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, give a short plan (`1. [Step] → verification: [check]`,
...). Strong success criteria enable independent work; weak criteria
("make it work") require constant clarification.

## Project

Household Expenses Manager — personal fullstack TypeScript monorepo
(Turborepo 2 + npm workspaces): React 19 / Vite 8 / MUI 9 frontend,
Express 5 API, PostgreSQL 17, JWT in an httpOnly cookie.

| Workspace | Package | Port | Notes |
|---|---|---|---|
| `apps/api` | `@expenses/api` | 4000 | Express 5, CommonJS, `strict: false`, Jest + Supertest integration tests against a real DB |
| `apps/web` | `@expenses/web` | 5173 | React 19, Vite 8 (rolldown), ESM, `strict: true`, Vitest 5 unit tests; served in production by `sirv` |
| `packages/shared` | `@expenses/shared` | — | Types + `SUPPORTED_CURRENCIES`; builds to ESM `dist/` with `.d.ts` |
| `e2e` | `@expenses/e2e` | — | Playwright smoke tests that boot the **built** API and web app against their own database |

- Git: GitHub `raptor1989/expenses-fullstack`, main branch `master`.
  Features go through PRs into `master` (squash merges). The local
  `develop` branch is stale and not on origin — don't base work on it.
- Node **≥ 22.12** (`engines`; Node 20 is EOL and Vitest 5 refuses it).
  CI runs on 22 (GitHub Actions) and 24 (Azure).
- `package-lock.json` is **gitignored**: every `npm install` resolves
  fresh, which is why every version in the `package.json` files is pinned
  exactly (no carets). npm `overrides` do not reach workspace dependencies
  in npm 11 — pick a different package instead (that is why `serve` was
  replaced by `sirv-cli`).
- Prettier: 4 spaces, single quotes, width 120, no trailing commas,
  `endOfLine: crlf`. Every file in the repo is CRLF — never convert.
- Code comments are minimal and in English; `README.md` and this file
  are English, `DEPLOYMENT.md` is Polish.
- Docs map: `README.md` (humans, setup, API table), `DEPLOYMENT.md`
  (production on a Linux VM + Azure pipeline), `.claude/skills/*`
  (procedures: `run-expenses-fullstack`, `add-feature`, `e2e-smoke`),
  `.github/instructions/*` (Copilot).

## Commands (verified from the repo root)

| Command | What it does |
|---|---|
| `npm install` | installs all workspaces. If `node_modules` predates a dependency bump (symptoms: `TS5103 Invalid value for '--ignoreDeprecations'`, peer conflicts on `@typescript-eslint`), delete `node_modules`, `apps/*/node_modules`, `packages/*/node_modules`, `e2e/node_modules` and `package-lock.json`, then reinstall |
| `npm run build` | Turbo: `shared` (`tsc`, emits `dist/*.d.ts`) → `api` (`tsc` → `dist/`) + `web` (`tsc && vite build` → `dist/`) |
| `npm run lint` | ESLint 10 flat config per workspace; web runs with `--max-warnings 0`; `e2e` also runs `tsc --noEmit` |
| `npm test` | Turbo `test` (depends on `build`): API Jest suites against PostgreSQL, web Vitest, shared `--passWithNoTests`. `e2e` is not part of it |
| `npm run test:e2e` | Turbo `test:e2e` (depends on `build`, never cached): Playwright smoke suite — see "Smoke tests" |
| `npm run dev` | `predev` kills whatever **listens** on 5173/4000 (`netstat`/`taskkill` on Windows, `lsof`/`kill` elsewhere), then Turbo starts `shared` (`tsc --watch`), `api` (`ts-node src/index.ts`), `web` (`vite`) |
| `npm start` | `pm2 start pm2.config.js` — production process model, see `DEPLOYMENT.md` |
| `npm run format` | Prettier over every `*.ts`/`*.tsx` in the repo — prefer `npx prettier --write <files>` on the files you touched |
| `npm run db:migrate --workspace=@expenses/api` | runs `apps/api/src/db/migrate.ts` against the DB from `apps/api/.env` (idempotent) |
| `npm run setup` | `scripts/setup-dev.js`: copies `.env` from the example, creates the DB, migrates, starts `npm run dev` (interactive) |

Per workspace: `npm run <build|lint|test|dev> --workspace=@expenses/<api|web|shared>`.
Turbo runs in strict env mode: a task only sees the variables listed in
its `passThroughEnv` (`test:e2e`: `CI`, `E2E_*`, `DB_*`). Anything else
you export is invisible to the task.

### Verification baseline (2026-11-10, Node 22, PostgreSQL 17 on 5432)

| Check | Result |
|---|---|
| `npm run build` | 3/3 tasks |
| `npm run lint` | 4/4 tasks, 0 warnings |
| `npm test` → `@expenses/api` | 6 suites, 87 tests (`app`, `auth`, `categories`, `expenses`, `analytics`, `settings`) |
| `npm test` → `@expenses/web` | 5 files, 29 tests (4 service tests + `ExpenseForm.test.ts` Yup schema) |
| `npm run test:e2e` | 11 smoke tests, `e2e/tests/smoke.spec.ts` |
| `npm audit --omit=dev` | 0 vulnerabilities (remaining dev-only advisories: `glob`/`minimatch` pulled by jest and eslint, no upstream fix yet) |

What a change needs before it is "done":

- `apps/api` → root `npm run build`, `npm run lint`, `npm test --workspace=@expenses/api` (needs a reachable PostgreSQL).
- `apps/web` → `npm run build --workspace=@expenses/web` (runs `tsc`), `npm run lint --workspace=@expenses/web`, `npm test --workspace=@expenses/web`.
- `packages/shared` → root `npm run build` (both consumers must compile), then the tests of whichever app uses the type.
- Anything user-visible (a page, a flow, a form) → `npm run test:e2e` (skill `e2e-smoke`), and extend the smoke suite when the flow is new.
- Dev-server behaviour, screenshots, ad-hoc UI driving → skill `run-expenses-fullstack`.
- Prettier on changed files only. Report any check you skipped and why.

## Environment

`apps/api/.env` (gitignored; template `apps/api/.env.example`):

| Variable | Notes |
|---|---|
| `PORT`, `NODE_ENV` | `4000`; `production` turns on the `secure` cookie flag and hides error stacks; `test` disables the auth rate limiter |
| `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` | always set `DB_PORT`: the pool fallback in `src/db/index.ts` is **5433**, while `.env.example` and the tests assume 5432 |
| `JWT_SECRET` | the server refuses to start without it |
| `JWT_EXPIRES_IN` | `ms` format, default `7D`; also sets the cookie `maxAge` |
| `ALLOWED_ORIGINS` | comma-separated exact origins; empty = CORS disabled, so the browser flow fails |
| `FRONTEND_URL` | base of the password-reset link, default `http://localhost:5173` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | reset e-mail over SMTP (`nodemailer`); port default `587` (STARTTLS), `465` = TLS; no `SMTP_USER` = no auth; `MAIL_FROM` defaults to `SMTP_USER`. Empty `SMTP_HOST` = the link is only logged. In production the API warns at startup when it is missing |
| `TRUST_PROXY` | `true` behind nginx/Caddy (`app.set('trust proxy', 1)`), so rate limiting sees the client IP |

`dotenv` is loaded at the top of `src/index.ts` and in `src/db/index.ts`
before anything reads `process.env`, so plain `ts-node src/index.ts`
works. Exported variables win over `.env` (dotenv never overrides), e.g.
`DB_NAME=expenses_test_db npx ts-node src/index.ts` runs the API against
the disposable test database. A dev database created before
`user_settings` / the reset-token columns existed makes
`POST /users/register` fail with 500 until `db:migrate` is re-run.

`apps/api/.env.test` is **committed** (`expenses_test_db`,
`postgres`/`postgres` on 5432, `JWT_EXPIRES_IN=1h`, `NODE_ENV=test`).
Test files load it with `override: true`, so exported shell variables do
not win over it inside the test process (only Jest's `globalSetup`
honours them). To test against a different local Postgres, edit
`.env.test` locally and don't commit it.

`apps/web`: `VITE_API_URL` (default `http://localhost:4000` — **no
`/api` suffix**), `VITE_LOCALE` (`pl-PL`), `VITE_CURRENCY` (`PLN`). All
are baked in at build time; `vite build` also reads the gitignored
`apps/web/.env.local` and `.env.production`. If the API log shows
`Not Found - /api/users/session`, a local env file still carries the old
`/api` suffix.

## Backend (`apps/api`)

Request flow: `router → apiLimiter → auth → express-validator chain → validate → Controller.static → Model.static → JSON`.

Entry `src/index.ts` (dotenv, `JWT_SECRET` guard, `listen`) → `src/app.ts`
(`trust proxy` from env, cors with credentials, cookie-parser,
json/urlencoded, routers, `GET /health`, `notFound`, `errorHandler`).
Routers are mounted **without an `/api` prefix**: `/users`, `/expenses`,
`/categories`, `/settings`. Full route table in `README.md`.

- **Controllers** (`src/controllers/*.controller.ts`): classes with
  static async methods only. Every protected method starts with the
  `req.user` guard and passes `req.user.id` to the model; `req.params`
  is cast `as { id: string }` (Express 5 typings). Errors are caught in
  the method: `console.error` → 500 with a feature-specific code
  (`expense_fetch_failed`, …). `errorHandler` only sees errors thrown
  outside controllers; an unknown route is 404 `not_found` (from
  `notFound.middleware.ts`).
- **Models** (`src/models/*.model.ts`): static methods, `pool.connect()`
  and `release()` in `finally`, parameterised queries only, `snake_case`
  columns aliased to camelCase in `SELECT`/`RETURNING`, `DECIMAL` →
  `parseFloat`. Partial updates build `SET` with a running `$n` counter
  and fall back to `findById` when nothing changed. Business errors are
  typed classes carrying `code` (`CategoryHasExpensesError`).
- **Auth** (`src/middlewares/auth.middleware.ts`): JWT payload
  `{ id, email, tokenVersion }` read from the `token` cookie or `Authorization: Bearer`
  (fallback for non-browser clients — keep it). Both middlewares are
  async: after `jwt.verify` they compare `tokenVersion` (missing = 0, for
  tokens issued before the column existed) with `users.token_version`, so
  every request costs one `SELECT`. A password reset or change bumps the
  column and thereby revokes all earlier tokens; `PUT /users/password`
  re-issues the caller's cookie (`issueAuthCookie` in `user.controller.ts`),
  so only the other sessions end.
  The routers call them without returning the promise, so they never
  reject — a DB error goes to `next(error)` (500), not to a 401. `auth` → 401
  `auth_required` / `invalid_token`; `optionalAuth` never rejects and
  backs `GET /users/session`, which answers `200 { user: null }` for
  anonymous callers so the SPA's startup check never trips the 401
  interceptor. Cookie: `httpOnly`, `sameSite: 'strict'`, `secure` only in
  production, `maxAge` from `JWT_EXPIRES_IN`. No CSRF token — relies on
  `sameSite: strict`, valid only while web and API share a site.
  `ms` is a direct dependency because `user.controller.ts` imports it.
- **Password reset**: `POST /users/forgot-password` always answers 200
  with the same message for known and unknown emails. The message
  depends only on `SMTP_HOST` ("check your inbox" vs "ask the
  administrator for the link"), and the ForgotPassword page shows it
  as is. When the email exists it stores a SHA-256 hash
  of a random token (1 h expiry) and, with `SMTP_HOST` set, e-mails the
  link (`src/services/mail.service.ts`, English text + HTML). The send is
  not awaited (no timing difference between known and unknown emails);
  success and failure are only logged. Without `SMTP_HOST` the link goes
  to the console (`[DEV] Password reset link …`, which the API tests
  parse) and, outside `NODE_ENV=test`, to
  `apps/api/logs/password-resets.log` (gitignored).
  `POST /users/reset-password` consumes the token and bumps
  `token_version` (signs the user out everywhere). `.env.test` and the
  e2e `apiEnv` set `SMTP_HOST` to an empty string on purpose:
  `src/db/index.ts` loads `apps/api/.env` inside the test process too, and
  a developer's SMTP settings there would otherwise send real mail.
- **Validation**: `express-validator` chains in `src/routes/*.routes.ts`
  followed by the `validate` middleware → 400 `validation_error` with
  `details: { field: message }`. A few controllers keep an older manual
  `if (!field)` guard (`missing_required_field`). Limits: expense
  `amount > 0`, `description ≤ 500`, `date` ISO 8601, `categoryId`
  required and a UUID; category `name ≤ 50` (matches the `VARCHAR(50)` column),
  `color` `#RRGGBB`, `icon ≤ 50`; password ≥ 8; settings `currency ∈
  PLN|USD|EUR|GBP`, `theme ∈ light|dark`. The web Yup schema uses the
  same expense limits. Every `:id` on the expense and category routes
  and the `categoryId` list filter go through `param()`/`query()`
  `isUUID()` chains, so a malformed id is a 400, never a Postgres cast
  error. The expense controller also checks that `categoryId` belongs
  to the caller (`CategoryModel.findById`) and answers 400
  `validation_error` with `details.categoryId` otherwise.
  `PUT /users/profile` runs the register e-mail chain (`trim`,
  `isEmail`, `normalizeEmail`), answers 400 `email_in_use` when another
  account has the address, and re-issues the cookie through
  `issueAuthCookie` (shared with register/login) because the token
  carries the e-mail.
- **Rate limits**: `apiLimiter` 300 req / 15 min on every resource
  router; `authLimiter` 20 / 15 min on register, login, forgot/reset
  password (skipped when `NODE_ENV=test`). Both answer 429
  `rate_limit_exceeded`. Limits are in memory (restart resets them).
- **Pagination** (`GET /expenses`): `page ≥ 1`, `limit` clamped 1–100
  (API default 50, the web service sends 10), optional `startDate`,
  `endDate`, `categoryId`, `search` (trimmed, blank ignored;
  `description ILIKE` with `%`/`_`/`\` escaped, so the term matches
  literally); `sort` (`date` | `amount` | `createdAt`, default `date`)
  and `order` (`asc` | `desc`, default `desc`), anything else is 400;
  `ORDER BY` comes from a whitelist map, never from the request, with
  `created_at DESC, id DESC` as tie-breakers; count query first, then
  `LIMIT/OFFSET` (both share one `WHERE`). The Expenses table shows
  `expense.date` and sorts by the Date and Amount headers; the
  Dashboard "Last 10" asks for `sort=createdAt`. The model takes an options
  object (`findByUserId(userId, { limit, offset, ... })`), the web
  service `getExpenses({ page, limit, ... })`. The Expenses page keeps
  the typed search text apart from the applied term; Enter, the search
  icon and Apply set it, go to page 1 and fetch once (`refreshKey`).
- **Database** (`src/db/index.ts`): one `pg.Pool` with an `error`
  listener (a dropped idle connection is logged, not fatal), no SSL
  option. Schema = `src/db/migrate.ts`: idempotent DDL in one
  transaction (`CREATE TABLE IF NOT EXISTS`, `ADD/DROP COLUMN IF (NOT)
  EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS` +
  `CREATE TRIGGER`). Tables: `users` (+ `reset_token_hash`,
  `reset_token_expires_at`, `token_version`), `categories`, `expenses`, `user_settings`.
  Triggers create 5 default categories and a `user_settings` row for
  each new user and bump `updated_at` on every table. **The same schema
  is duplicated in `src/__tests__/helpers/setup.ts`** — every schema
  change goes into both files, or the tests run against a stale schema.
  The compiled `dist/db/migrate.js` is what the e2e suite and the
  deployment pipeline run.
- `src/db/import-legacy-expenses.ts` (`npm run db:import-legacy`) is a
  one-off CSV import with hard-coded UUIDs; ignore unless asked.
- TS: `strict: false`, CommonJS, `**/*.test.ts` excluded from the
  build; tests compile through `tsconfig.test.json` (ts-jest,
  type-checked, so type errors fail the suite before any test runs).

### API tests (`apps/api/src/__tests__`)

Supertest against the real `app` and a real PostgreSQL. Jest
`globalSetup` creates `expenses_test_db` if missing and applies the
schema. Each test file: `loadTestEnv()` **before** importing `app`,
`truncateAllTables()` in `beforeEach`/`afterEach`, `registerAndLogin()`
(returns `cookie`, `token`, `userId`), `userFixture` /
`categoryFixture` / `expenseFixture`. Requests authenticate with
`.set('Cookie', cookie)`. Jest runs `--runInBand --forceExit`. Each
endpoint is covered for: happy path, validation 400s, 401 when
unauthenticated, 404/isolation for another user's rows. `app.test.ts`
pins `/health` and the 404 shape.

## Frontend (`apps/web`)

Provider order in `main.tsx`: `BrowserRouter` → `ThemeProvider` →
`LocalizationProvider` (dayjs) → `AuthProvider` → `SettingsProvider` →
`App` (the order matters: `SettingsProvider` uses both `useAuth` and
`useThemeMode`).

```
pages/        Dashboard (/), Expenses, Categories, Reports, Settings,
              Login, Register, ForgotPassword, ResetPassword, NotFound (*)
layouts/      MainLayout (drawer + AppBar + theme toggle + account menu, <Outlet />), AuthLayout
components/   charts/   ChartCard, MonthlyTotalWithAverageChart, MonthlyCategoryLineChart,
                        CategoryShareDoughnutChart (nivo)
              expenses/ ExpenseForm (Dialog), SimpleExpenseForm (inline on Dashboard, onCreated callback),
                        ExpenseTable, expenseSchema.ts (Yup)
              reports/  ReportsTable, CategoryRankingTable
services/     api.ts (axios instance), authService, expenseService, categoryService, settingsService
contexts/     AuthContext, SettingsContext        hooks/   useAuth, useSettings
store/        categoryStore.ts (Zustand)           theme/   ThemeProvider.tsx (+ useThemeMode)
helpers/      formatHelpers (Intl; VITE_LOCALE / VITE_CURRENCY), chartHelpers (CHART_COLORS,
              resolveCategoryColor, …), sxHelpers (shared sx fragments)
```

- **Routing** (React Router 7): the protected tree is `/` →
  `ProtectedRoute` → `MainLayout` with nested `index`, `expenses`,
  `categories`, `reports`, `settings`; auth pages render inside
  `AuthLayout`; `*` → `NotFound`.
- **Auth**: `AuthContext` calls `fetchCurrentUser()` (`GET
  /users/session`) on mount and exposes `user`, `isAuthenticated`,
  `isLoading`, `login`, `register`, `logout`, `updateUser`. Nothing is
  stored in `localStorage` for auth — the httpOnly cookie is the session.
  `services/api.ts`: `withCredentials: true`; the response interceptor
  sends the browser to `/login` on a 401 **except** for failed
  `/users/login` and `/users/register` attempts and when already on
  `/login`, so forms can show the API message. `logout` also resets the
  category store.
- **Settings**: `SettingsContext` loads `/settings` after login and
  applies `theme` to `ThemeProvider`; `updateSettings` persists currency
  and theme. `ThemeProvider` defaults to **dark**, persists `themeMode`
  in `localStorage`; the AppBar toggle updates both.
- **State**: categories are global in `useCategoryStore`
  (`fetchCategories` is idempotent via `loaded`/`loading`;
  `refreshCategories` always reloads (the Categories page uses it on
  mount and after a delete, for current `expenseCount`s); `addCategory`,
  `editCategory` (merges into the stored item), `removeCategory(id,
  moveTo?)`, `reset`). Expenses, pagination,
  filters and dialogs are local `useState` in each page. The Dashboard
  loads through `fetchDashboardData({ silent })` and refetches silently
  after the inline form saves. Notifications are a local MUI `Snackbar`
  per page or component.
- **MUI 9** (`@mui/material` 9.5, `@mui/x-date-pickers` 9.17): `Grid`
  from `@mui/material` with the `size={{ xs: 12, md: 6 }}` prop (there
  is no `Grid2`); `Dialog` for modal forms; `DatePicker` with dayjs;
  icons from `@mui/icons-material`. Reusable `sx` fragments go to
  `helpers/sxHelpers.ts`. The drawer is rendered twice (permanent +
  mobile variant kept mounted) — selectors in tests must pick the
  visible copy.
- **Forms**: Formik + Yup. Schemas live in plain `.ts` files
  (`components/expenses/expenseSchema.ts`) so Vitest can import them
  without pulling MUI. Show errors only when `touched`. `Login` and
  `ForgotPassword` set `validateOnBlur: false`: their email field is
  autofocused, and a helper text appearing on blur shifts the links below
  it, so the first click on "Forgot password?" / "Back to sign in" was lost.
- **Services**: one file per domain, typed `api.<verb><T>()`, return
  the unwrapped entity (`response.data.expense`, `.categories`, …).
  Query strings via `URLSearchParams`. Paths are relative to
  `VITE_API_URL` and start with `/users`, `/expenses`, … (no `/api`).
- **Tests**: Vitest 5 (`environment: 'node'`, `@/` alias). Service tests
  mock `./api` with `vi.hoisted` + `vi.mock` and assert the exact path
  and payload — update them whenever an endpoint or payload changes.
- **Build/serve**: Vite 8 (rolldown); `vite.config.mts` and
  `vitest.config.ts` use `import.meta.dirname`, not `__dirname`.
  `npm run serve:dist` = `sirv dist --single --host 0.0.0.0 --port 5173`
  (SPA fallback), used by PM2 in production and by the e2e suite.
- TS: `strict`, `noUnusedLocals`/`noUnusedParameters`, `@/` → `src/`,
  project reference to `packages/shared`. ESLint: react-hooks
  recommended with `set-state-in-effect` off,
  `react-refresh/only-export-components` off.

## Shared (`packages/shared`)

`src/types.ts` (barrel `src/index.ts`): `User`, `UserCredentials`,
`ForgotPasswordInput`, `ResetPasswordInput`, `AuthResponse`, `Category`
(optional `expenseCount`, only from `GET /categories`),
`Expense`, `ExpenseCreateInput`, `ExpenseUpdateInput`, `ExpenseSummary`,
`ExpenseByMonth`, `ExpenseByCategory`, `ApiError`, `SUPPORTED_CURRENCIES`
+ `SupportedCurrency`, `ThemeMode`, `UserSettings`, `UserSettingsUpdateInput`.

- Entity interfaces for reads, `*CreateInput` / `*UpdateInput` for
  writes — don't reuse one for the other.
- `createdAt` / `updatedAt` / `date` are typed `Date` but arrive as ISO
  strings over JSON; format through `formatHelpers`, don't call `Date`
  methods on them without `new Date(...)`.
- The package is **ESM only** (`"type": "module"`), while `apps/api` is
  CommonJS: the API can import **types** from `@expenses/shared` (erased
  at compile time) but a runtime value import would fail. That is why
  `SUPPORTED_CURRENCIES` is duplicated by hand in
  `apps/api/src/routes/settings.routes.ts` — keep both lists in sync.
- After editing shared: `npm run build` from the root (both apps must
  compile). If a consumer reports `TS7016` for `@expenses/shared` right
  after a build, delete `packages/shared/dist` and
  `packages/shared/tsconfig.tsbuildinfo` and rebuild.

## Smoke tests (`e2e`)

`@playwright/test` 1.65, config `e2e/playwright.config.ts`, suite
`e2e/tests/smoke.spec.ts` (serial, one worker, one fresh account per run).
Procedure and conventions: skill `e2e-smoke`.

- `globalSetup` creates `expenses_e2e_db` if missing, runs the compiled
  `apps/api/dist/db/migrate.js` against it and truncates all tables.
- `webServer` starts `node dist/index.js` (API, `NODE_ENV=test`,
  `JWT_SECRET=e2e-only-secret`, `ALLOWED_ORIGINS=http://localhost:5173`,
  `SMTP_HOST=` empty) and `npm run serve:dist` (sirv) on **the same ports as dev**
  (4000/5173) with `reuseExistingServer: false` — a running `npm run dev`
  makes the suite fail fast instead of touching the dev database.
- DB credentials: `E2E_DB_*` → `DB_*` → `apps/api/.env` → `postgres`/
  `postgres`@`localhost:5432` (the CI containers); `DB_NAME` is never
  reused. Browser: downloaded Chromium (`npx playwright install
  chromium`) or `E2E_BROWSER_CHANNEL=msedge|chrome` for a system browser.
- Needs the build output: run through the root `npm run test:e2e`
  (Turbo builds first) or build before `npx playwright test` in `e2e/`.
  `test:e2e.dependsOn` names `@expenses/api#build` and
  `@expenses/web#build` explicitly: `e2e` doesn't depend on those
  packages, so with plain `build` Turbo ran the web build in parallel
  with the suite, and after a change in `apps/web` a test got a 404 on
  `assets/index-*.js` and a blank page.
- Flows covered: `/health` + anonymous session, redirect to login,
  register, wrong password → API message, inline expense add + dashboard
  refresh, Expenses table, category create/delete, currency change
  persisted, password reset (forgot form → planted token → reset → old
  session revoked → token single-use → sign in), password change in
  Settings (this session survives a reload, another one is signed out),
  logout. The reset test
  plants its own token in the DB because without SMTP the link is only
  logged. Failures keep a trace + screenshot in
  `e2e/test-results/` (gitignored); CI uploads `e2e/playwright-report`.

## API contract

Success shapes (JSON, cookie auth unless noted):

| Endpoint | Body |
|---|---|
| `GET /expenses?page&limit&startDate&endDate&categoryId&search&sort&order` | `{ expenses: Expense[], pagination: { total, page, limit, totalPages } }` |
| `GET /expenses/:id` · `POST /expenses` (201) · `PUT /expenses/:id` | `{ expense }` · `{ message, expense }` |
| `GET /expenses/summary?startDate&endDate` | `{ summary: ExpenseSummary }` |
| `GET /expenses/by-month?year` | `{ monthlyData: ExpenseByMonth[] }` |
| `GET /categories` (each with `expenseCount`) · `GET /categories/:id` · `POST` (201) · `PUT /:id` | `{ categories }` · `{ category }` · `{ message, category }` |
| `DELETE /expenses/:id` · `DELETE /categories/:id[?moveTo=<id>]` (in one transaction: move the caller's expenses to `moveTo`, then delete; `moveTo` must be another own category, else 400 `validation_error`; without it a category in use is 400 `category_has_expenses`) | `{ message }` |
| `GET /settings` · `PUT /settings` | `{ settings }` · `{ message, settings }` |
| `POST /users/register` (201) · `POST /users/login` (no auth) | `{ message, user }` + `Set-Cookie: token=…` |
| `GET /users/session` (optional auth) | `{ user }` or `{ user: null }`, always 200 |
| `GET /users/profile` · `PUT /users/profile` | `{ user }` · `{ message, user }` |
| `PUT /users/password` · `POST /users/logout` · `POST /users/forgot-password` · `POST /users/reset-password` (last two: no auth) | `{ message }` |
| `GET /health` (no auth) | `{ status: 'ok', message }` |

Reads return the entity under its own key (no `message`); mutations add
`message`. Errors: `{ message, code, details? }` (+ `stack` in
development, only from `errorHandler`).

Error codes in use: `auth_required`, `invalid_token`, `validation_error`,
`missing_required_field`, `missing_date_range`, `missing_year_parameter`,
`invalid_year_format`, `email_in_use`, `invalid_credentials`,
`user_not_found`, `reset_token_invalid`, `reset_token_expired`,
`category_not_found`, `category_has_expenses`, `expense_not_found`,
`settings_not_found`, `not_found`, `rate_limit_exceeded`, `server_error`,
and `<feature>_<action>_failed` for 500s. The web layer handles 401
globally (redirect, with the login/register exception above) and
everything else per call (`Snackbar` or form error) through
`getApiErrorMessage(error, fallback)` and `getApiFieldErrors(error)` in
`services/api.ts`: a 4xx shows the `details` messages (else `message`),
a 400's `details` go to Formik `setErrors`, and a 5xx, a network error or
a non-axios error shows the caller's generic fallback. The expense
dialog stays open on a failed save (the page rethrows to the form).

Contract changes are additive where possible. When you rename or remove
a field: shared type → API model/controller → API tests → web service +
its Vitest test → pages → smoke test if the flow is covered, then root
`npm run build`.

## Adding things

- **New endpoint or entity end-to-end**: skill `add-feature`
  (`.claude/skills/add-feature/SKILL.md`) — ordered checklist with the
  file patterns and test templates. Short form: shared type →
  `migrate.ts` **and** `__tests__/helpers/setup.ts` → model → controller
  → route (validators + `validate`) → mount in `app.ts` → API test →
  web service + Vitest test → store or page state → route in `App.tsx`
  → nav item in `MainLayout.tsx` → smoke test for the visible flow.
- **New page**: `pages/<Name>.tsx` → `<Route path="<name>">` inside the
  `MainLayout` tree in `App.tsx` → entry in `navItems` in
  `layouts/MainLayout.tsx`.
- **New shared constant the API needs at runtime**: duplicate it in the
  API (ESM/CJS split above) or migrate the API to ESM first — say which.
- **Dependency updates**: bump the exact versions in every `package.json`
  that lists the package, delete `node_modules` + `package-lock.json`,
  reinstall, then build/lint/test/e2e. TypeScript 7 (`tsgo`), `dotenv` 18
  and `@types/node` 26 were deliberately not adopted on 2026-11-07
  (toolchain compatibility, runtime is Node 22/24).

## Running the app

Skill `run-expenses-fullstack` (`.claude/skills/run-expenses-fullstack/`)
covers starting the API and web dev servers, migrating, API smoke tests
with curl and a cookie jar, and driving the UI with a Playwright script
on the system Edge. `npm run dev` starts real local servers and first
kills anything listening on ports 4000/5173 — run it deliberately, not
as a side effect of verification. The smoke suite needs those ports
free.

## CI / deployment

- `.github/workflows/ci.yml`: GitHub Actions on push/PR to `master` and
  `develop` — Node 22, PostgreSQL 17 service, `npm install`, build,
  lint, test, `playwright install --with-deps chromium`, `test:e2e`,
  Playwright report uploaded on failure.
- `azure-pipelines.yml`: Azure DevOps, trigger `master` — the same
  checks with a `postgres:17` container (Node 24), then SSH deploy to a
  VM: copy files, `npm install --no-audit --no-fund`, `npm run build`,
  `npm run db:migrate --workspace=@expenses/api`,
  `pm2 startOrRestart pm2.config.js --update-env`. The SSH step judges
  the exit code (`set -e`, `failOnStdErr: false`, `exec 2>&1`): npm
  writes warnings to stderr, and the task default `failOnStdErr: true`
  failed every deploy that installed a deprecated package.
- Production process model: `pm2.config.js` (`expenses-api` on 4000,
  `expenses-web` = `npm run serve:dist` → sirv on 5173) behind a reverse
  proxy that strips the `/api` prefix. Manual steps and pitfalls:
  `DEPLOYMENT.md`.

## Known gaps / direction (true as of 2026-11-07)

- No request/response logging middleware; no repository layer (raw SQL
  per model method); the DB connection has no SSL option.
- Expenses list state, filters and pagination are per-page `useState`
  and not reflected in the URL; only categories moved to Zustand.
  Notifications are per-page `Snackbar`.
- No runtime validation schemas in `packages/shared` (Yup lives in the
  web app, express-validator in the API); the category dialog has no
  client-side length check, the API's `≤ 50` is the only guard.
- `apps/api` still compiles with `strict: false`.
- Dev-only `npm audit` advisories remain for `glob`/`minimatch` pulled in
  by jest 30 and eslint 10 (the suggested "fix" is a downgrade).
