---
applyTo: "apps/web/**"
description: "Use when working on the React frontend: components, pages, services, hooks, forms, routing, theming, state management."
---

# Frontend Standards

## Architecture

```
pages/        → Full page components with business logic, local state
components/   → Reusable presentational components
services/     → Pure async functions wrapping Axios calls
contexts/     → React Context providers (auth)
hooks/        → Custom hooks (useAuth)
layouts/      → MainLayout (sidebar + AppBar) and AuthLayout (centered card)
helpers/      → Utility functions (formatting)
theme/        → MUI ThemeProvider with dark/light mode
store/        → Zustand (installed, not yet used)
```

## Components

- **Functional components only** — React 19 with hooks, no class components
- Props interfaces named `ComponentNameProps`
- Pages are heavier components with embedded business logic and local state
- Lighter reusable components in `components/`

## File Naming

| Entity | Convention | Examples |
|--------|-----------|---------|
| Components, Pages, Contexts | PascalCase `.tsx` | `ExpenseForm.tsx`, `Dashboard.tsx`, `AuthContext.tsx` |
| Services, Hooks, Helpers | camelCase `.ts` | `expenseService.ts`, `useAuth.ts`, `formatHelpers.ts` |
| Folders | camelCase | `services/`, `pages/`, `contexts/` |

## Imports

- Path alias `@/` maps to `src/` (configured in `tsconfig.json` and `vite.config.mts`)
- Library imports first, then `@/` imports, then relative imports
  ```typescript
  import { useState } from 'react';
  import { Box, Typography } from '@mui/material';
  import { useAuth } from '@/hooks/useAuth';
  import type { Expense } from '@expenses/shared';
  ```

## MUI (Material-UI v6)

- `Grid2` for responsive layouts: `size={{ xs: 12, md: 6 }}`
- `Dialog` for modal forms (create/edit)
- `TextField`, `Select` for form inputs
- `Card`, `Paper`, `Chip` for data display
- `IconButton` with icons from `@mui/icons-material`
- `DatePicker` from `@mui/x-date-pickers` with dayjs adapter
- Theme supports light/dark toggle, persisted in localStorage

## Forms (Formik + Yup)

- Yup validation schema defined as a **module-level constant**:
  ```typescript
  const ExpenseSchema = Yup.object().shape({
      amount: Yup.number().required('Amount is required').positive('Must be positive'),
      description: Yup.string().required('Description is required'),
  });
  ```
- Formik with `enableReinitialize` for edit mode (pre-fill from existing data)
- Show field errors only when `touched`: `error={touched.field && Boolean(errors.field)}`
- Modal forms use `Dialog` wrapper; inline forms on Dashboard use `SimpleExpenseForm`

## Service Layer

- Pure async functions in `services/` — one file per domain (`expenseService.ts`, `categoryService.ts`)
- Typed Axios calls with generic: `api.get<{ expenses: Expense[] }>(url)`
- Always destructure `.data` from response: `const { data } = await api.get<T>(url)`
- Query params built with `URLSearchParams`
- Base Axios instance in `api.ts` with:
  - `baseURL` from `VITE_API_URL` env variable
  - Request interceptor: attaches Bearer token from localStorage
  - Response interceptor: redirects to `/login` on 401

## Authentication Flow

1. `AuthContext` provides: `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`, `register()`
2. On mount: checks localStorage for token → calls `fetchCurrentUser` to restore session
3. Token stored in `localStorage.setItem('token', ...)`
4. `useAuth()` hook wraps `useContext(AuthContext)` with error boundary check
5. `ProtectedRoute` component blocks unauthenticated users, shows loading spinner during check

## State Management

- **Auth state**: global via `AuthContext`
- **Feature data** (expenses list, categories, pagination): local `useState` per page
- **Zustand**: installed (`zustand@5`) but **store/ is empty** — not yet used

## Routing (React Router v6)

- `BrowserRouter` wraps entire app in `main.tsx`
- Nested routes in `App.tsx` with `<Outlet />` in layouts
- Protected routes wrapped in `<ProtectedRoute>` component
- Auth routes (`/login`, `/register`) use `AuthLayout`
- Main routes nested under `/` use `MainLayout` (sidebar + AppBar)
- 404 fallback: `path="*"` → `NotFound` page

## Notifications

- Local Snackbar state per page:
  ```typescript
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>(...);
  ```
- No centralized notification system

## New Page Checklist

1. **Page component** — create in `pages/` with local state and data fetching
2. **Route** — add route definition in `App.tsx` (inside `ProtectedRoute` if authenticated)
3. **Navigation** — add menu item in `MainLayout` sidebar
4. **Service** — create service file in `services/` if the page calls API endpoints

## Future Recommendations

- Consolidate feature list state into **Zustand stores** (expenses, categories) to reduce local state duplication across pages
- Centralize notification handling (global Snackbar context or Zustand slice)
- Sync pagination/filter state with URL query params for shareable URLs
- Extract common data-fetching patterns into custom hooks per domain
