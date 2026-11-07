---
applyTo: "packages/shared/**"
description: "Use when editing shared TypeScript types, API contracts, or interfaces used across frontend and backend."
---

# Shared Package Standards

## Purpose

Single source of truth for the API contract between `apps/api` and `apps/web`, imported as `@expenses/shared` through npm workspace resolution. Builds to an **ESM-only** `dist/` with `.d.ts` files.

## Type Patterns

- **Entity interfaces** for reads (`Expense`, `Category`, `User`, `UserSettings`): `id: string` (UUID), `userId: string`, `createdAt`/`updatedAt` typed `Date` (they arrive as ISO strings over JSON).
- **Input types** for writes: `ExpenseCreateInput` (required fields) and `ExpenseUpdateInput` (all optional), `UserSettingsUpdateInput`, `ForgotPasswordInput`, `ResetPasswordInput`. Keep them separate from the entity type.
- **Analytics types**: `ExpenseSummary`, `ExpenseByMonth`, `ExpenseByCategory`.
- **Runtime constants**: `SUPPORTED_CURRENCIES` (`['PLN', 'USD', 'EUR', 'GBP'] as const`) with `SupportedCurrency` and `ThemeMode`. The web app imports the value; **the CommonJS API cannot** — it keeps a hand-maintained copy in `apps/api/src/routes/settings.routes.ts`. Keep both lists in sync.
- `ApiError { message, code, details? }`.

## Exports

`src/index.ts` is `export * from './types'` — adding a type to `src/types.ts` is enough.

## TypeScript Config

- Extends the root `tsconfig.json`; `composite: true`, `declaration: true`, `module: ESNext`.
- Consumers reference the built `dist/`; after a change run `npm run build` from the root so both apps recompile. If a consumer reports `TS7016` right after a build, delete `packages/shared/dist` and `packages/shared/tsconfig.tsbuildinfo` and rebuild.

## Adding a Type

1. Define it in `src/types.ts`.
2. `npm run build` from the root.
3. Import in the apps with `import type { NewType } from '@expenses/shared'` (or a value import in the web app only).
4. Update the API model/controller, its Supertest suite, the web service and its Vitest test; extend the smoke suite if the change is user-visible.
