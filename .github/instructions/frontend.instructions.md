---
applyTo: "apps/web/**"
description: "Use when working on the React frontend: components, pages, services, hooks, forms, routing, theming, state management."
---

# Frontend Standards

React 19, Vite 8, TypeScript (`strict`), Material UI 9, React Router 7, Formik + Yup, Zustand, Axios, Vitest. Full detail: `CLAUDE.md` → "Frontend".

## Architecture

```
pages/        → full page components with business logic and local state
components/   → charts/ (nivo), expenses/ (ExpenseForm dialog, SimpleExpenseForm inline, ExpenseTable, expenseSchema.ts), reports/
services/     → pure async functions over the Axios instance, one file per domain, Vitest test next to each
contexts/     → AuthContext, SettingsContext      hooks/ → useAuth, useSettings
store/        → categoryStore.ts (Zustand)         theme/ → ThemeProvider (+ useThemeMode)
layouts/      → MainLayout (drawer + AppBar, <Outlet />), AuthLayout
helpers/      → formatHelpers (Intl), chartHelpers, sxHelpers
```

Provider order in `main.tsx`: `BrowserRouter` → `ThemeProvider` → `LocalizationProvider` → `AuthProvider` → `SettingsProvider` → `App`.

## Components

- Functional components only, hooks; props interfaces named `ComponentNameProps`.
- Pages carry data fetching and state; `components/` stays presentational and receives callbacks (e.g. `SimpleExpenseForm` gets `onCreated`).
- PascalCase `.tsx` for components/pages/contexts, camelCase `.ts` for services/hooks/helpers.
- Imports: libraries, then `@/` (alias for `src/`), then relative.

## MUI 9

- `Grid` from `@mui/material` with `size={{ xs: 12, md: 6 }}` (there is no `Grid2`).
- `Dialog` for modal forms, `Snackbar` + `Alert` for feedback, `DatePicker` from `@mui/x-date-pickers` with the dayjs adapter.
- Theme: light/dark, default dark, persisted in `localStorage.themeMode` and in the user's server-side settings.
- Shared `sx` fragments live in `helpers/sxHelpers.ts`.

## Forms (Formik + Yup)

- Yup schema as a module-level constant in a plain `.ts` file (`components/expenses/expenseSchema.ts`) so Vitest can import it without MUI.
- Show errors only when touched: `error={touched.field && Boolean(errors.field)}`.
- `Login` and `ForgotPassword` use `validateOnBlur: false` (autofocused email; a helper text on blur shifts the links below and swallows the first click).
- Limits mirror the API (expense `description ≤ 500`, `amount > 0`, date not in the future).

## Services

- `services/api.ts`: Axios instance, `baseURL` from `VITE_API_URL` (default `http://localhost:4000`, no `/api`), `withCredentials: true` — the httpOnly cookie is the session, nothing is stored in `localStorage`.
- Response interceptor: 401 → `window.location.href = '/login'`, except failed `/users/login` / `/users/register` attempts and when already on `/login` (forms show the API message).
- Functions return the unwrapped entity: `const response = await api.get<{ expense: Expense }>(url); return response.data.expense;`. Query strings via `URLSearchParams`.
- Each service has a Vitest test that mocks `./api` (`vi.hoisted` + `vi.mock`) and asserts the exact path and payload — update it with the service.

## State

- Auth: `AuthContext` (`user`, `isAuthenticated`, `isLoading`, `login`, `register`, `logout`, `updateUser`); `GET /users/session` on mount.
- Settings: `SettingsContext` (`settings`, `updateSettings`) — currency and theme.
- Categories: global Zustand store `useCategoryStore` (`fetchCategories` is idempotent; reset on logout).
- Everything else (expenses list, pagination, filters, dialogs): local `useState` in the page. Notifications: local `Snackbar`.

## Routing

- `App.tsx`: auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password`) in `AuthLayout`; protected tree `/` → `ProtectedRoute` → `MainLayout` with `index`, `expenses`, `categories`, `reports`, `settings`; `*` → `NotFound`.
- New page: component in `pages/`, `<Route>` inside the `MainLayout` tree, entry in `navItems` in `layouts/MainLayout.tsx`.

## Verification

- `npm run build --workspace=@expenses/web` (tsc + vite), `npm run lint --workspace=@expenses/web` (0 warnings), `npm test --workspace=@expenses/web`.
- User-visible changes: `npm run test:e2e` (Playwright smoke suite in `e2e/`); add a test for a new flow. The drawer is rendered twice (permanent + mobile), so test selectors on it need `.filter({ visible: true })`.
- Config files use `import.meta.dirname` (Vite 8), not `__dirname`.
