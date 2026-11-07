---
name: add-feature
description: Add a feature end-to-end in the Household Expenses Manager monorepo — a new API endpoint, entity, field or page spanning packages/shared, apps/api (migration, model, controller, route, Supertest test) and apps/web (service, Vitest test, store/page, route, nav). Use when asked to add, extend or change an endpoint, entity, field, table, filter, report or page, or when a contract between the API and the web app changes.
---

Ordered checklist for a change that crosses layers. Each step names the
file pattern to copy and the check that proves the step is done. Skip
steps that don't apply (a web-only change starts at step 7), but keep
the order: contract first, then API with its test, then web with its
test, then the UI.

Conventions and gotchas that every step relies on are in `CLAUDE.md`
("Backend", "Frontend", "Shared", "API contract"). Read that first if it
is not already in context.

## 0. Pin down the contract

Before touching code, write down (in the plan you show the user):

- HTTP method + path (mounted at the root: `/expenses/...`, no `/api`),
  auth (`auth` / `optionalAuth` / none), query params, body fields,
  validation limits.
- Response key: reads return `{ <entity> }` or `{ <entities>, pagination }`,
  mutations return `{ message, <entity> }`, deletes `{ message }`.
- Error codes you will add. Pattern: `<entity>_not_found`,
  `<entity>_<action>_failed` (500), domain codes like
  `category_has_expenses` (400). Validation failures are always
  `validation_error` from the `validate` middleware.
- Which web pages/components consume it and whether the data is global
  (Zustand store, like categories) or page-local (`useState`, like
  expenses).

Contract changes should be additive. Renaming/removing a field means
updating every layer below in the same change.

## 1. Shared type — `packages/shared/src/types.ts`

- Entity interface for reads; `XCreateInput` / `XUpdateInput` for
  writes. Dates as `Date` in the interface (they arrive as ISO strings).
- Export happens through `export * from './types'` in `src/index.ts` —
  nothing to add there.
- A runtime constant (array/enum) can live here for the web app, but
  **the API cannot value-import it** (shared is ESM, API is CommonJS).
  Duplicate the value in the API file that needs it and leave a comment
  pointing at the shared one, as `apps/api/src/routes/settings.routes.ts`
  does for `SUPPORTED_CURRENCIES`.

Check: `npm run build --workspace=@expenses/shared`.

## 2. Schema — two files, same DDL

Add the DDL to **both**:

- `apps/api/src/db/migrate.ts` (production/dev schema)
- `apps/api/src/__tests__/helpers/setup.ts` (test schema applied by Jest
  `globalSetup`)

Rules: idempotent statements only (`CREATE TABLE IF NOT EXISTS`,
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`,
`DROP TRIGGER IF EXISTS` + `CREATE TRIGGER`), `snake_case` names, UUID
PKs with `gen_random_uuid()`, `user_id UUID NOT NULL REFERENCES users(id)
ON DELETE CASCADE` on every user-scoped table, `created_at`/`updated_at`
`TIMESTAMP WITH TIME ZONE`. For a new table also add it to the `tables`
array that creates the `set_<table>_updated_at` trigger (in both files)
and to `truncateAllTables()` in `__tests__/helpers/db.ts` (delete order:
children before parents).

Check: `npm run db:migrate --workspace=@expenses/api` against the dev DB
runs twice without error; the API tests (step 6) exercise the test copy.

## 3. Model — `apps/api/src/models/<entity>.model.ts`

Copy the shape of `settings.model.ts` (simple) or `expense.model.ts`
(filters, pagination, aggregates):

- `export class XModel { static async ... }`, every method:
  `const client = await pool.connect(); try { ... } finally { client.release(); }`.
- Parameterised SQL only (`$1, $2`), never string-interpolate values.
  Dynamic `WHERE`/`SET` builders increment a `paramCounter` and push to
  `values` in the same order.
- `SELECT`/`RETURNING` alias columns to camelCase:
  `user_id as "userId", created_at as "createdAt"`.
- `DECIMAL` columns come back as strings → `parseFloat` in the mapper.
- Every user-scoped query filters by `user_id = $n`; `findById(id, userId)`
  returns `null` when not found (→ controller 404). Partial update with
  no fields → return `findById`.
- Domain errors as classes with a `code` field (see
  `CategoryHasExpensesError`), thrown from the model and mapped in the
  controller.

## 4. Controller — `apps/api/src/controllers/<entity>.controller.ts`

Static async methods, one per endpoint, following `settings.controller.ts`:

```ts
static async getThing(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required', code: 'auth_required' });
        }
        const { id } = req.params as { id: string };
        const thing = await ThingModel.findById(id, req.user.id);
        if (!thing) {
            return res.status(404).json({ message: 'Thing not found', code: 'thing_not_found' });
        }
        res.status(200).json({ thing });
    } catch (error) {
        console.error('Get thing error:', error);
        res.status(500).json({ message: 'Failed to get thing', code: 'thing_fetch_failed' });
    }
}
```

Mutations respond `201` + `{ message, thing }` on create, `200` +
`{ message, thing }` on update, `200` + `{ message }` on delete. Parse
query params explicitly (`parseInt(req.query.x as string)`, clamp
limits) — the validator chains cover the body, not the query.

## 5. Route — `apps/api/src/routes/<entity>.routes.ts` + mount

Copy `settings.routes.ts` / `category.routes.ts`:

- `router.use(apiLimiter)` then `router.use((req, res, next) => { auth(req, res, next); })`
  for protected routers; per-route `auth` for mixed routers (see
  `user.routes.ts`).
- `express-validator` chains as module-level arrays (`body('field')...`),
  one for create (required) and one for update (`.optional()`), then
  `validate` before the lambda that calls the controller. Keep length
  limits equal to the column definitions (category `name` is `VARCHAR(50)`
  → `isLength({ max: 50 })`).
- Static paths (`/summary`) **before** `/:id`.
- Export `export const thingRoutes = router;` and mount in
  `apps/api/src/app.ts`: `app.use('/things', thingRoutes);` — no `/api`
  prefix, before `notFound`.

Check: `npm run build --workspace=@expenses/api`, `npm run lint --workspace=@expenses/api`.

## 6. API test — `apps/api/src/__tests__/<entity>.test.ts`

Copy the preamble exactly (env must load before `app`):

```ts
import { loadTestEnv } from './helpers/env';
loadTestEnv();

import request from 'supertest';
import app from '../app';
import { truncateAllTables } from './helpers/db';
import { userFixture, categoryFixture } from './helpers/fixtures';
import { registerAndLogin } from './helpers/auth';

beforeEach(async () => { await truncateAllTables(); });
afterEach(async () => { await truncateAllTables(); });

describe('POST /things', () => {
    it('creates a thing and returns 201', async () => {
        const { cookie } = await registerAndLogin(userFixture());
        const res = await request(app).post('/things').set('Cookie', cookie).send({ name: 'x' });
        expect(res.status).toBe(201);
        expect(res.body.thing).toMatchObject({ name: 'x' });
    });

    it('returns 400 when name is missing', async () => { /* expect code 'validation_error' */ });
    it('returns 401 when unauthenticated', async () => { /* no cookie → code 'auth_required' */ });
    it("returns 404 for another user's thing", async () => { /* second registerAndLogin */ });
});
```

Minimum per endpoint: happy path, each validation rule, 401, and a
user-isolation case (404 for another user's row). Add a fixture to
`helpers/fixtures.ts` for a new entity. `authLimiter` is disabled under
`NODE_ENV=test`; `apiLimiter` (300/15 min) is not, which is fine for
the suite sizes here.

Check: `npm test --workspace=@expenses/api` (needs PostgreSQL; the test
DB is created automatically). A type error anywhere in `src/` fails the
whole suite before any test runs — read the first error, not the count.

## 7. Web service — `apps/web/src/services/<entity>Service.ts` + test

- Pure async functions over the `api` instance, typed with the shared
  types, returning the unwrapped entity:
  `const response = await api.get<{ thing: Thing }>(`/things/${id}`); return response.data.thing;`
- Query strings via `URLSearchParams`; paths start at the root (`/things`).
- Test next to it (`<entity>Service.test.ts`), copying
  `settingsService.test.ts`: `vi.hoisted` + `vi.mock('./api', ...)`, then
  one `it` per function asserting `apiMock.<verb>` was called with the
  exact path and payload and that the result is unwrapped.

Check: `npm test --workspace=@expenses/web`.

## 8. State: store or page?

- Reference data reused across pages (categories today) → Zustand store
  in `apps/web/src/store/`, following `categoryStore.ts`
  (`loaded`/`loading` guards, optimistic list updates, `reset()` called
  from `AuthContext.logout`).
- Everything else → `useState` inside the page, fetched in `useEffect`
  with a `useCallback` loader, like `pages/Expenses.tsx`.
- Server-side user preferences → extend `UserSettings` and
  `SettingsContext`, not a new context.

## 9. Page / component / route / nav

- Pages in `pages/<Name>.tsx` (PascalCase), presentational pieces in
  `components/<domain>/`, props interface named `<Component>Props`.
- Forms: Formik + Yup, schema in a plain `.ts` file next to the
  component (no MUI imports there so Vitest can load it), errors shown
  only when `touched`; modal forms use `Dialog` (`components/expenses/ExpenseForm.tsx`).
- Layout: `Grid` from `@mui/material` with `size={{ xs: 12, md: 6 }}`;
  currency through `formatCurrency(amount, settings.currency)`; colours
  from `helpers/chartHelpers.ts`; feedback via a local `Snackbar`.
- New page: add `<Route path="things" element={<Things />} />` inside the
  `MainLayout` route in `App.tsx` and an entry in `navItems` in
  `layouts/MainLayout.tsx` (icon from `@mui/icons-material`).

Check: `npm run build --workspace=@expenses/web` (tsc + vite),
`npm run lint --workspace=@expenses/web` (0 warnings).

## 10. Smoke test — `e2e/tests/smoke.spec.ts`

Every user-visible flow gets one Playwright test that walks its happy
path through the real UI (navigate, act, assert the snackbar **and** the
data on screen), plus one negative case when the flow has a validation
message. Conventions, MUI selector quirks and debugging: skill `e2e-smoke`.
The suite is serial and shares one account created by the register test,
so append new tests after the flows they depend on.

Check: `E2E_BROWSER_CHANNEL=msedge npm run test:e2e` (root; Turbo builds
first). Ad-hoc screenshots or dev-server checks: skill `run-expenses-fullstack`.

## 11. Finish

1. `npx prettier --write <changed files>` (4 spaces, single quotes, CRLF).
2. Root `npm run build && npm run lint && npm test && npm run test:e2e`.
3. If the schema changed: say so explicitly — production migrations are
   manual (`DEPLOYMENT.md`, section 2).
4. If the contract changed: update the API table in `README.md` and the
   contract table in `CLAUDE.md`.
5. Report per layer what changed and which checks ran.
