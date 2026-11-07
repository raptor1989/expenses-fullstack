---
description: "Use when adding new features end-to-end, modifying API contracts, working across frontend and backend simultaneously, or creating new entities."
---

# Fullstack Integration Standards

The step-by-step procedure with file patterns and test templates is the Claude Code skill `.claude/skills/add-feature/SKILL.md`; the contract tables are in `CLAUDE.md` → "API contract".

## End-to-End Feature Workflow

```
1. Shared type    → packages/shared/src/types.ts (exported through the barrel automatically)
2. DB schema      → apps/api/src/db/migrate.ts AND apps/api/src/__tests__/helpers/setup.ts (same idempotent DDL)
3. Model          → apps/api/src/models/ (parameterised SQL, camelCase aliases)
4. Controller     → apps/api/src/controllers/ (static methods, req.user guard)
5. Route          → apps/api/src/routes/ (express-validator chains + validate), mount in src/app.ts (no /api prefix)
6. API test       → apps/api/src/__tests__/<entity>.test.ts (Supertest; happy path, 400s, 401, isolation)
7. Service        → apps/web/src/services/<entity>Service.ts + <entity>Service.test.ts (Vitest, mocked api)
8. State / page   → Zustand store for shared reference data, otherwise page-local useState; route in App.tsx; nav item in MainLayout
9. Smoke test     → e2e/tests/smoke.spec.ts: one happy-path test for the visible flow
```

Verify at each layer before moving on; root `npm run build && npm run lint && npm test && npm run test:e2e` at the end.

## API Contract Alignment

- Base URL has **no `/api` prefix**; web services call `/expenses`, `/categories`, `/users/...`, `/settings` relative to `VITE_API_URL`.
- Reads return the entity under its own key, no `message`:

```json
{ "expenses": [...], "pagination": { "total": 100, "page": 1, "limit": 10, "totalPages": 10 } }
```

- Mutations include `message` (`{ "message": "Expense created successfully", "expense": { ... } }`, 201 on create); deletes return `{ "message": "..." }`.
- Errors: `{ "message": "...", "code": "error_code", "details": {} }`. `validation_error` carries `details: { field: message }`.
- The web interceptor handles 401 globally (redirect to `/login`, except failed login/register attempts); other errors are handled per call (form `Alert` or `Snackbar`).

## Shared Types

- Entity interfaces for reads, `*CreateInput` / `*UpdateInput` for writes.
- Dates are typed `Date` but arrive as ISO strings — format through `helpers/formatHelpers.ts`.
- `packages/shared` is ESM-only; `apps/api` (CommonJS) can import **types** but not runtime values — duplicate constants such as `SUPPORTED_CURRENCIES` in the API and keep both in sync.
- After changing shared: `npm run build` from the root (both apps must compile).

## Monorepo Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | shared watcher + API (ts-node) + web (vite) via Turbo; frees ports 5173/4000 first |
| `npm run build` | shared → api + web |
| `npm run lint` | ESLint in every workspace (e2e also type-checks) |
| `npm test` | API integration (PostgreSQL) + web unit tests |
| `npm run test:e2e` | Playwright smoke tests against the built app |
| `npm run <script> --workspace=@expenses/<api\|web\|shared\|e2e>` | single workspace |

Turbo runs tasks in strict env mode — only variables listed in `turbo.json` `passThroughEnv` reach a task.
