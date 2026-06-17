# CLAUDE.md

Guidance for Claude Code in this repository. Consolidates
`.github/copilot-instructions.md` and `.github/instructions/*.md` (which
load automatically for Copilot based on the files being edited) — treat
those as the source of truth if this file drifts out of sync.

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

Household Expenses Manager — fullstack TypeScript monorepo (Turborepo +
npm workspaces): React/Vite frontend, Express.js backend, PostgreSQL,
JWT (cookie-based) authentication.

```
apps/api/       Express.js backend (port 4000)
apps/web/       React frontend (port 5173)
packages/shared/ Shared types/interfaces, imported as @expenses/shared
```

## Monorepo commands

| Command | Scope | Purpose |
|---------|-------|---------|
| `npm run dev` | Root | Starts shared (watch), API, and Web via Turbo |
| `npm run build` | Root | Builds shared → API + Web in parallel |
| `npm run dev --workspace=@expenses/api` | API only | Start API dev server |
| `npm run dev --workspace=@expenses/web` | Web only | Start Vite dev server |
| `npm run build --workspace=@expenses/shared` | Shared only | Rebuild type definitions |

Build order: `packages/shared` builds first (emits `.d.ts`), then
`apps/api` and `apps/web` build in parallel (both depend on shared). After
changing shared types, run `npm run build` from root and confirm both apps
still compile.

## End-to-end feature workflow

When a feature spans both apps, build it in this order, verifying at each
layer before moving to the next:

```
1. Shared type    → packages/shared/src/types.ts, export from index.ts
2. DB migration   → apps/api/src/db/migrate.ts (inside a transaction)
3. Model          → apps/api/src/models/ (SQL queries)
4. Controller     → apps/api/src/controllers/ (request handling)
5. Route          → apps/api/src/routes/, mount in index.ts
6. Service        → apps/web/src/services/ (Axios calls)
7. Page/Component → apps/web/src/pages/, add route in App.tsx
```

## API contract alignment

Backend GET responses (no `message`):

```json
{ "items": [...], "pagination": { "total": 100, "page": 1, "limit": 10, "totalPages": 10 } }
```

Backend mutation (POST/PUT/DELETE) responses include `message`:

```json
{ "message": "Item created successfully", "item": { ... } }
```

Frontend services destructure `.data`:

```typescript
const { data } = await api.get<{ items: Item[]; pagination: Pagination }>('/api/items');
```

Error shape: `{ "message": "...", "code": "error_code", "details": {} }`.
Known codes: `auth_required`, `invalid_token`, `email_in_use`,
`missing_required_field`, `user_not_found`, `category_has_expenses`,
`server_error`. The frontend's Axios response interceptor handles `401`
globally (redirect to `/login`); other errors are caught per-call.

## Backend (apps/api)

Lightweight Express MVC: `route → middleware → controller (static method) → model (static method) → response`.

```
routes/       Define endpoints, attach middleware
controllers/  Parse request, validate, call model, format response
models/       Execute SQL queries, return typed objects
middlewares/  Cross-cutting concerns (auth, errors, 404)
db/           Pool singleton, migrations
```

- **Controllers**: class-based, **static async methods only** (class as
  namespace, no instance state). Always check `req.user` in protected
  endpoints; always pass `userId` to model methods for user-scoped access.
- **Models**: class-based static methods. Acquire a pg client, release in
  `finally`. **Always parameterized queries** (`$1, $2, ...`) — never
  interpolate user input. Map `snake_case` columns to `camelCase` via
  `SELECT` aliases (`first_name as "firstName"`). `parseFloat()` decimal
  fields — pg returns `DECIMAL` as strings.
- **Database**: singleton `pool` in `db/index.ts`. SSL enabled when
  `NODE_ENV === 'production'`. Migrations in `db/migrate.ts` run in a
  transaction (`BEGIN → DDL → COMMIT/ROLLBACK`). DB triggers handle:
  auto-generated default categories on user registration, auto-updated
  `updated_at` timestamps.
- **Routes**: exported as named constants (`export const itemRoutes = router`),
  lambdas delegating to controller statics, mounted under `/api/` in `index.ts`.
- **Auth**: JWT Bearer token (or cookie) → `auth` middleware decodes and
  attaches `req.user: { id, email, username }` via global `Express.Request`
  augmentation. Secret from `JWT_SECRET`, expiry from `JWT_EXPIRES_IN`
  (default `7D`). 401 with `auth_required`/`invalid_token` on failure.
- **Error handling**: `ApiError` extends `Error` with `statusCode`, `code`,
  `details`. Error middleware registered last. `stack` included only in
  development.
- **Validation**: manual in controllers (`if (!field)` → 400). No
  `express-validator` currently used. DB constraints are the fallback
  safety net.
- **Pagination**: count query first, then `LIMIT`/`OFFSET` with a dynamic
  parameter counter for `WHERE` conditions.

New endpoint checklist: model method(s) → controller method(s) → route →
mount router in `index.ts`.

## Frontend (apps/web)

```
pages/        Full page components, business logic, local state
components/   Reusable presentational components
services/     Pure async functions wrapping Axios calls
contexts/     React Context providers (auth)
hooks/        Custom hooks (useAuth)
layouts/      MainLayout (sidebar + AppBar), AuthLayout (centered card)
helpers/      Formatting/utility functions
theme/        MUI ThemeProvider, dark/light mode
store/        Zustand — installed, not yet used
```

- **Components**: functional only, React 19 + hooks. Props interfaces
  named `ComponentNameProps`. Pages carry business logic; `components/` is
  lighter/presentational.
- **File naming**: PascalCase `.tsx` for Components/Pages/Contexts;
  camelCase `.ts` for Services/Hooks/Helpers.
- **Imports**: `@/` aliases `src/` — library imports, then `@/`, then
  relative.
- **MUI v6**: `Grid2` for layout, `Dialog` for modal forms, `DatePicker`
  (`@mui/x-date-pickers` + dayjs adapter). Theme supports light/dark,
  persisted in `localStorage`.
- **Forms**: Formik + Yup, schema as a module-level constant. Show field
  errors only when `touched`. Modal forms use `Dialog`; the Dashboard's
  inline form is `SimpleExpenseForm`.
- **Service layer**: one file per domain in `services/`, typed Axios calls,
  always destructure `.data`. Base instance in `api.ts`:
  `baseURL` from `VITE_API_URL` (default `http://localhost:4000/api`),
  request interceptor attaches Bearer token from `localStorage`, response
  interceptor redirects to `/login` on 401.
- **Auth flow**: `AuthContext` provides `user`, `isAuthenticated`,
  `isLoading`, `login/register/logout`. On mount, checks for an existing
  session via `fetchCurrentUser`. Token in `localStorage`. `useAuth()`
  wraps the context with an error-boundary check. `ProtectedRoute` blocks
  unauthenticated users.
- **State**: auth is global (`AuthContext`); feature data (expenses,
  categories, pagination) is local `useState` per page. Zustand is
  installed but `store/` is empty.
- **Routing**: React Router v6, `BrowserRouter` in `main.tsx`, nested
  routes + `<Outlet />` in layouts, `ProtectedRoute` wrapper, `path="*"`
  → `NotFound`.
- **Notifications**: local Snackbar state per page — no centralized system.

New page checklist: page component → route in `App.tsx` (inside
`ProtectedRoute` if authenticated) → sidebar nav entry in `MainLayout` →
service file if it calls the API.

## Shared types (packages/shared)

Single source of truth for API contracts between `apps/api` and
`apps/web`, imported as `@expenses/shared` via npm workspace resolution.

- **Entity interfaces** (reads) vs **`*CreateInput`/`*UpdateInput`**
  (mutations) — keep them separate, don't reuse the entity type for input.
- Aggregated/analytics types for dashboards (`ExpenseSummary`,
  `ExpenseByMonth`, `ExpenseByCategory`).
- Error type: `ApiError { message, code, details? }`.
- Current entities: User (`User`, `UserCredentials`, `AuthResponse`),
  Expense (`Expense`, `ExpenseCreateInput`, `ExpenseUpdateInput`),
  Category (`Category`), Budget (`Budget`, `BudgetProgress`), Analytics.
- All types exported via the `index.ts` barrel.
- `tsconfig.json`: `composite: true` (project references for incremental
  builds), `declaration: true` (emits `.d.ts` to `dist/`).

Adding a type: define in `src/types.ts` → export from `src/index.ts` →
`npm run build` in the shared package (or from root via Turbo) → import in
`apps/api`/`apps/web` as `import type { NewType } from '@expenses/shared'`.

## Known gaps / direction (not yet done — don't assume otherwise)

- API validation is manual, not `express-validator`-based; no
  request/response logging middleware.
- Models use raw SQL per-method; no repository pattern.
- Zustand is installed but unused — feature state is still per-page
  `useState`. Notification handling isn't centralized. Pagination/filters
  aren't synced to URL query params.
- Shared package has no Zod (or other runtime validation) schemas yet —
  only compile-time types.
