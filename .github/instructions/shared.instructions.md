---
applyTo: "packages/shared/**"
description: "Use when editing shared TypeScript types, API contracts, or interfaces used across frontend and backend."
---

# Shared Package Standards

## Purpose

Single source of truth for API contracts between `apps/api` and `apps/web`. Both apps import types as `@expenses/shared` via npm workspace resolution.

## Type Patterns

### Entity interfaces — for reads

Full entity representations returned by the API:

```typescript
export interface Expense {
    id: number;
    userId: number;
    categoryId: number;
    amount: number;
    description: string;
    date: string;
    createdAt: string;
    updatedAt: string;
}
```

### Input types — for mutations

Separate types for create/update operations (fewer required fields):

```typescript
export interface ExpenseCreateInput {
    categoryId: number;
    amount: number;
    description: string;
    date: string;
}

export interface ExpenseUpdateInput {
    categoryId?: number;
    amount?: number;
    description?: string;
    date?: string;
}
```

**Convention**: Entity type for reads, `*CreateInput`/`*UpdateInput` for mutations. Keep them separate — don't reuse entity type for input.

### Response/analytics types

Aggregated data for dashboards and reports:

```typescript
export interface ExpenseSummary { /* totals, averages */ }
export interface ExpenseByMonth { /* monthly breakdown */ }
export interface ExpenseByCategory { /* per-category totals */ }
```

### Error type

```typescript
export interface ApiError {
    message: string;
    code: string;
    details?: Record<string, unknown>;
}
```

## Current Entities

| Entity | Interfaces |
|--------|-----------|
| User | `User`, `UserCredentials`, `AuthResponse` |
| Expense | `Expense`, `ExpenseCreateInput`, `ExpenseUpdateInput` |
| Category | `Category` |
| Budget | `Budget`, `BudgetProgress` |
| Analytics | `ExpenseSummary`, `ExpenseByMonth`, `ExpenseByCategory` |
| API | `ApiError` |

## Exports

All types exported via `index.ts` barrel file:

```typescript
export type { User, Expense, Category, ... } from './types';
```

## TypeScript Config

- Extends root `tsconfig.json`
- `composite: true` — enables project references for incremental builds
- `declaration: true` — emits `.d.ts` files to `dist/`
- Both apps resolve `@expenses/shared` to the local workspace package

## Adding a New Type

1. Define the interface in `src/types.ts`
2. Export it from `src/index.ts`
3. Run `npm run build` in the shared package (or from root via Turbo)
4. Import in `apps/api` and/or `apps/web` as `import type { NewType } from '@expenses/shared'`

## Future Recommendations

- Add **Zod schemas** alongside interfaces for runtime validation in both apps (single source of truth for both compile-time types and runtime checks)
- Consider splitting `types.ts` into per-entity files if it grows beyond ~200 lines
