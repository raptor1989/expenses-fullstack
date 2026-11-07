---
name: e2e-smoke
description: Run, debug and extend the Playwright smoke tests of the Household Expenses Manager (the e2e workspace) — the suite that boots the built Express API and the static web build against a dedicated PostgreSQL database and drives the real UI — and know how both CI pipelines run it. Use when asked to run the smoke or e2e tests, when a page, form or user flow changes, when a smoke test fails locally or in CI, or when a new user-visible feature needs end-to-end coverage.
---

The smoke suite lives in `e2e/` (`@expenses/e2e`): `playwright.config.ts`,
`env.ts` (ports, paths, DB resolution, API env), `global-setup.ts`,
`tests/smoke.spec.ts`. It tests the **build output** the way production
runs it — compiled API, static web bundle served by `sirv --single` — so
it needs `npm run build` first. Paths below are relative to the repo
root. Verified 2026-11-07: 9 tests, ~20 s.

## Prerequisites

- PostgreSQL reachable. Credentials are resolved in this order:
  `E2E_DB_*` → `DB_*` from the shell → `DB_*` from `apps/api/.env` →
  `postgres`/`postgres`@`localhost:5432`. The database is always
  `expenses_e2e_db` (or `E2E_DB_NAME`) — never the dev or Jest DB.
- A browser: either `npx playwright install chromium` once (downloads
  ~150 MB into the user profile), or reuse an installed Edge/Chrome with
  `E2E_BROWSER_CHANNEL=msedge` / `chrome`. On this machine use msedge.
- Ports 4000 and 5173 free. `reuseExistingServer` is off on purpose: a
  dev server left running fails the run fast instead of letting the
  suite write into the developer's database.

## Run

```bash
E2E_BROWSER_CHANNEL=msedge npm run test:e2e          # root: Turbo builds, then runs the suite
E2E_BROWSER_CHANNEL=msedge npm run test:e2e -- --grep "category"   # one test by title
cd e2e && npx playwright test --headed                # after a build; watch the browser
cd e2e && npx playwright test --ui                    # Playwright UI mode
```

Turbo passes only `CI`, `E2E_*` and `DB_*` into the task
(`passThroughEnv` in `turbo.json`); other exported variables never reach
Playwright. Running `npx playwright test` directly inside `e2e/` has no
such filter but also no build step — stale `dist/` is the usual reason a
"fixed" bug still fails there.

What a run does:

1. `global-setup.ts`: creates `expenses_e2e_db` if missing, runs
   `apps/api/dist/db/migrate.js` with the e2e `DB_*` env, truncates
   `expenses, user_settings, categories, users`.
2. `webServer[0]`: `node dist/index.js` in `apps/api` with
   `NODE_ENV=test` (auth rate limiter off, non-secure cookie),
   `JWT_SECRET=e2e-only-secret`, `ALLOWED_ORIGINS=http://localhost:5173`,
   `FRONTEND_URL=http://localhost:5173`; ready when `/health` answers.
3. `webServer[1]`: `npm run serve:dist` in `apps/web` (sirv on 5173).
4. `tests/smoke.spec.ts`, serial, one worker, one fresh account
   `smoke-<runId>@example.com` per run so repeated runs never collide.

## Writing or extending a test

- Keep everything in `tests/smoke.spec.ts` while the suite is small; the
  file is `test.describe.configure({ mode: 'serial' })` because later
  tests reuse the account and data created earlier. A second spec file
  must create its own account (the `login()` helper pattern) — specs run
  in separate workers only if `workers` is raised.
- Locators: prefer `getByRole` / `getByLabel` / `getByText` with the
  exact UI strings. The strings that matter today: buttons `Sign In`,
  `Create Account`, `Save`, `Add Expense`, `Add Category`, `Add`,
  `Update`, `Delete`, `Cancel`; snackbars `Expense added successfully!`,
  `Category created!`, `Category deleted!`, `Currency updated!`; menu item
  `Logout`; table `aria-label="expenses table"`.
- MUI quirks that bite:
  - `Select` is a `div[role="combobox"]`, options are `role="option"` in a
    popup. The Dashboard category select has the id
    `#mui-component-select-categoryId` (only `Select`s with a `name`
    get that id); the Settings currency select has none — filter the
    combobox by its text (`/^(PLN|USD|EUR|GBP)$/`).
  - `Tooltip title="Delete"` becomes `aria-label` on the icon button →
    `getByRole('button', { name: 'Delete' })`, scoped to the card
    (`getByText(name, { exact: true }).locator('..')`) or to the
    `getByRole('dialog')`.
  - The side drawer is rendered twice (permanent + mobile, kept
    mounted): `getByText(email)` matches two nodes → add
    `.filter({ visible: true })`.
  - Alerts (`MuiAlert`) have `role="alert"`; the login error is the only
    alert on `/login`.
- Assert through the UI, not the API, except for pure API checks
  (`request` fixture, see the first test). After a mutation, assert the
  snackbar **and** the data on screen; the Dashboard refetches after the
  inline form saves, so no reload is needed.
- New user-visible feature → add one test that walks its happy path
  (navigate, act, see the result) and, if it has a validation message,
  one negative case. Keep each test independent of UI timing: wait on
  `expect(...).toBeVisible()`, never on fixed sleeps.
- `npm run lint --workspace=@expenses/e2e` runs ESLint and `tsc --noEmit`
  over the suite; Prettier config is the repo's (4 spaces, single quotes,
  width 120, CRLF).

## Debugging a failure

- `e2e/test-results/<test-name>/` (gitignored) holds `test-failed-1.png`,
  `error-context.md` (an ARIA snapshot of the page at failure — read it
  first, it shows exactly what was on screen) and `trace.zip`.
- `npx playwright show-trace e2e/test-results/<test>/trace.zip` opens
  the trace viewer (actions, network, console, DOM snapshots).
- To read the trace without a UI: it is a zip; `*.network` lines are
  JSON `resource-snapshot` entries with request/response, `*.trace`
  lines carry actions and console messages.
- API output: Playwright hides the web servers' stdout. Add
  `stdout: 'pipe'` to the API `webServer` entry temporarily, or start
  the API by hand with the same env (`env.ts` → `apiEnv`) and run
  `npx playwright test` in `e2e/`.
- `Error: ... is already used` → something listens on 4000/5173
  (`node scripts/free-ports.js 4000 5173`).
- `Executable doesn't exist at ...chromium_headless_shell...` → no
  downloaded browser and no `E2E_BROWSER_CHANNEL`; the variable also gets
  dropped when it is not exported through Turbo's `passThroughEnv`.
- `... dist/db/migrate.js not found` → build first (root
  `npm run test:e2e` does it).
- `password authentication failed` → wrong `DB_*`; set `E2E_DB_PASSWORD`
  (or fix `apps/api/.env`, which the suite reads as a fallback).

## CI

- GitHub Actions (`.github/workflows/ci.yml`): after `npm test`, `npx
  playwright install --with-deps chromium` then `npm run test:e2e`;
  `e2e/playwright-report` is uploaded as the `playwright-report`
  artifact when the step fails.
- Azure Pipelines (`azure-pipelines.yml`, stage BuildAndTest): the same
  two steps with `CI: true` in the step env, then
  `PublishPipelineArtifact@1` of the report on failure. The deploy stage
  only runs when the smoke tests pass.
- Both use the `postgres:17` service container with `postgres`/`postgres`
  on 5432 — the suite's defaults — and the bundled Chromium (no
  `E2E_BROWSER_CHANNEL`). `retries: 1` and the HTML reporter are enabled
  only when `CI` is set.
