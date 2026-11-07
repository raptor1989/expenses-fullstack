---
applyTo: "apps/api/**"
description: "Use when working on the Express.js backend API: controllers, models, routes, middleware, database queries, authentication, error handling."
---

# Backend API Standards

Express 5, TypeScript (CommonJS, `strict: false`), PostgreSQL through `pg`. Full detail: `CLAUDE.md` → "Backend".

## Architecture

```
routes/       → endpoints + express-validator chains, attach middleware
controllers/  → parse request, call model, format response (static methods)
models/       → SQL queries, return typed objects (static methods)
middlewares/  → auth, optionalAuth, validate, rateLimit, notFound, errorHandler
db/           → Pool singleton (index.ts), schema (migrate.ts)
__tests__/    → Jest + Supertest integration suites against a real database
```

Request flow: `router → apiLimiter → auth → validator chain → validate → Controller.static → Model.static → JSON`.
Routers are mounted in `src/app.ts` **without an `/api` prefix**: `/users`, `/expenses`, `/categories`, `/settings`, plus `GET /health`.

## Controllers

- Class with **static async methods only**; `(req: Request, res: Response)`.
- Protected methods start with the `req.user` guard (401 `auth_required`) and pass `req.user.id` to the model.
- `req.params` is cast `as { id: string }` (Express 5 typings).
- Catch errors inside the method: `console.error` → 500 with a feature-specific code (`expense_fetch_failed`).

```typescript
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

## Models

- Static methods; `const client = await pool.connect(); try { ... } finally { client.release(); }`.
- **Parameterised queries only** (`$1, $2, ...`) — never interpolate user input.
- Alias `snake_case` columns to camelCase in `SELECT`/`RETURNING`: `user_id as "userId"`.
- `DECIMAL` comes back as a string → `parseFloat`.
- Every user-scoped query filters by `user_id`; `findById(id, userId)` returns `null` → controller 404.
- Partial updates: build `SET` with a running `$n` counter; no fields → return `findById`.
- Domain errors as classes with a `code` (`CategoryHasExpensesError`), mapped in the controller.

## Database

- One `pg.Pool` in `db/index.ts` with an `error` listener; no SSL option. `dotenv` is loaded there and in `index.ts`.
- Schema is `db/migrate.ts`: idempotent DDL in one transaction (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER`). Triggers create default categories and a `user_settings` row per user and bump `updated_at`.
- **The same DDL is duplicated in `__tests__/helpers/setup.ts`** — change both, plus `truncateAllTables()` in `__tests__/helpers/db.ts` for a new table.

## Routes

- `export const thingRoutes = router`; `router.use(apiLimiter)`, then `auth` for protected routers; lambdas delegate to the controller.
- Validation chains are module-level arrays (`body('field')...`), one for create and one (`.optional()`) for update, followed by `validate` → 400 `validation_error` with `details: { field: message }`.
- Static paths (`/summary`) before `/:id`. Mount the router in `src/app.ts` before `notFound`.

## Authentication

- JWT `{ id, email }` from the `token` cookie (httpOnly, `sameSite: 'strict'`, `secure` in production) or `Authorization: Bearer` fallback.
- `auth` → 401 `auth_required` / `invalid_token`; `optionalAuth` never rejects (`GET /users/session` answers `{ user: null }` for anonymous callers).
- `JWT_SECRET` is required at startup; `JWT_EXPIRES_IN` (`ms` format, default `7D`).
- Rate limits: `authLimiter` 20/15 min on register, login, forgot/reset password (off when `NODE_ENV=test`); `apiLimiter` 300/15 min elsewhere; `TRUST_PROXY=true` behind a reverse proxy.
- Password reset only logs the link (console + `logs/password-resets.log`); no e-mail.

## Response Format

- Reads: entity under its own key, no `message` — `{ expense }`, `{ categories }`, `{ expenses, pagination: { total, page, limit, totalPages } }`.
- Mutations: `{ message, expense }` (201 on create), deletes `{ message }`.
- Errors: `{ message, code, details? }`; codes in use are listed in `CLAUDE.md` → "API contract" (`validation_error`, `invalid_credentials`, `category_has_expenses`, `not_found`, `rate_limit_exceeded`, `<feature>_<action>_failed`, …).

## Tests

- Preamble in every file: `loadTestEnv()` **before** `import app`; `truncateAllTables()` in `beforeEach`/`afterEach`; `registerAndLogin()` gives the `cookie`; fixtures in `helpers/fixtures.ts`.
- Cover: happy path, each validation rule, 401 without cookie, 404 for another user's row.
- Run: `npm test --workspace=@expenses/api` (PostgreSQL from the committed `.env.test`; the DB is created automatically). A type error anywhere in `src/` fails the whole run (ts-jest type-checks).

## New Endpoint Checklist

1. Shared type (`packages/shared`) if the shape is new.
2. Schema in `db/migrate.ts` **and** `__tests__/helpers/setup.ts`.
3. Model → 4. Controller → 5. Route with validators → 6. Mount in `src/app.ts`.
7. Supertest suite in `__tests__/`.
8. Web service + Vitest test, page, and a smoke test in `e2e/` if the flow is user-visible.
