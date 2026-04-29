---
description: "Use when adding new features end-to-end, modifying API contracts, working across frontend and backend simultaneously, or creating new entities."
---

# Fullstack Integration Standards

## End-to-End Feature Workflow

When adding a new entity or feature that spans both apps, follow this order:

```
1. Shared type    → Define interface in packages/shared/src/types.ts, export from index.ts
2. DB migration   → Add table/columns in apps/api/src/db/migrate.ts (inside transaction)
3. Model          → Add static methods in apps/api/src/models/ (SQL queries)
4. Controller     → Add static methods in apps/api/src/controllers/ (request handling)
5. Route          → Define routes in apps/api/src/routes/, mount in index.ts
6. Service        → Add async functions in apps/web/src/services/ (Axios calls)
7. Page/Component → Create or update page in apps/web/src/pages/, add route in App.tsx
```

Verify at each layer before moving to the next.

## API Contract Alignment

### Response shape

Backend controllers return:
```json
{
    "message": "Items retrieved successfully",
    "items": [...],
    "pagination": { "total": 100, "page": 1, "limit": 10, "totalPages": 10 }
}
```

Frontend services destructure `.data`:
```typescript
const { data } = await api.get<{ items: Item[]; pagination: Pagination }>('/api/items');
return data;
```

### Error shape

Backend error middleware returns:
```json
{ "message": "Not found", "code": "not_found", "details": {} }
```

Frontend Axios response interceptor handles 401 globally (redirect to `/login`). Other errors should be caught per-call in the service or component.

### Error codes

Error codes defined in backend should be handled in frontend where user-facing feedback is needed:
- `auth_required` / `invalid_token` → handled globally by Axios interceptor (401 → redirect)
- `email_in_use` → show in registration form
- `missing_required_field` → show in form validation
- `category_has_expenses` → show in category delete confirmation

## Shared Types Usage

- Import types in both apps: `import type { Expense } from '@expenses/shared'`
- Entity types (e.g., `Expense`) for API responses and display
- Input types (e.g., `ExpenseCreateInput`) for form data and POST/PUT payloads
- Keep types in sync — a breaking change in shared types must be reflected in both apps

## Monorepo Commands

| Command | Scope | Purpose |
|---------|-------|---------|
| `npm run dev` | Root | Starts both API and Web dev servers via Turbo |
| `npm run build` | Root | Builds shared → API + Web in parallel |
| `npm run dev --workspace=@expenses/api` | API only | Start API dev server |
| `npm run dev --workspace=@expenses/web` | Web only | Start Vite dev server |
| `npm run build --workspace=@expenses/shared` | Shared only | Rebuild type definitions |

## Build Order

Turbo manages the dependency graph:
1. `packages/shared` builds first (exports `.d.ts` type definitions)
2. `apps/api` and `apps/web` build in parallel (both depend on shared)

After modifying shared types, always verify both apps still compile: `npm run build` from root.

## Cross-Layer Verification

When modifying API contracts or shared types:
1. Update the type in `packages/shared`
2. Update backend model/controller to match the new shape
3. Update frontend service and components to use updated types
4. Run `npm run build` from root — TypeScript will catch mismatches between layers
