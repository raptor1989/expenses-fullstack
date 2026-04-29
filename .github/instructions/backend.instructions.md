---
applyTo: "apps/api/**"
description: "Use when working on the Express.js backend API: controllers, models, routes, middleware, database queries, authentication, error handling."
---

# Backend API Standards

## Architecture

Lightweight Express.js MVC with clear separation:

```
routes/       → Define endpoints, attach middleware
controllers/  → Parse request, validate, call model, format response
models/       → Execute SQL queries, return typed objects
middlewares/  → Cross-cutting concerns (auth, errors, 404)
db/           → Pool singleton, migrations
```

Request flow: `route → middleware → controller (static method) → model (static method) → response`

## Controllers

- Class-based with **static async methods only** (no instance state — class acts as namespace)
- Each method receives `(req: Request, res: Response)`
- Always check `req.user` in protected endpoints before proceeding
- Always pass `userId` to model methods (user-scoped data access)

```typescript
static async getAll(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required', code: 'auth_required' });
        }
        const result = await SomeModel.findAll(req.user.id);
        res.json({ message: 'Items retrieved successfully', items: result });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error', code: 'server_error' });
    }
}
```

## Models

- Class-based with **static methods only**
- Each method acquires a pg client and releases it in `finally`
- All queries use **parameterized placeholders** (`$1, $2, ...`) — never interpolate user input
- Map `snake_case` DB columns to `camelCase` via SELECT aliases: `first_name as "firstName"`
- Convert decimal fields with `parseFloat()` (pg returns strings for DECIMAL)

```typescript
static async findById(id: number, userId: number): Promise<Item | null> {
    const client = await pool.connect();
    try {
        const result = await client.query(
            'SELECT id, name, amount::text as amount, user_id as "userId" FROM items WHERE id = $1 AND user_id = $2',
            [id, userId]
        );
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return { ...row, amount: parseFloat(row.amount) };
    } finally {
        client.release();
    }
}
```

## Database

- **Singleton Pool** in `db/index.ts` — import and use `pool.connect()` everywhere
- SSL enabled in production (`NODE_ENV === 'production'`)
- Migrations in `db/migrate.ts` use transactions: `BEGIN → DDL statements → COMMIT/ROLLBACK`
- Database triggers handle: auto-generated default categories on user registration, auto-updated `updated_at` timestamps

## Routes

- Exported as named constants: `export const itemRoutes = router`
- Use lambdas to delegate to controller static methods: `router.get('/', (req, res) => Controller.getAll(req, res))`
- Auth middleware applied per-route or per-router depending on the resource
- Mounted in `index.ts` under `/api/` prefix

## Authentication

- JWT Bearer token extracted from `Authorization` header
- Middleware decodes token and attaches to `req.user` via global `Express.Request` augmentation:
  ```typescript
  declare global { namespace Express { interface Request { user?: { id: number; email: string; username: string } } } }
  ```
- Token payload: `{ id, email, username }`
- Secret from `JWT_SECRET` env var, expiration from `JWT_EXPIRES_IN` (default `'7D'`)
- Returns 401 with code `auth_required` or `invalid_token` on failure

## Error Handling

- Custom `ApiError` interface extends `Error` with: `statusCode`, `code`, `details`
- Error middleware registered **last** in `index.ts`
- Response shape for errors:
  ```json
  { "message": "...", "code": "error_code", "details": {}, "stack": "..." }
  ```
- `stack` included only when `NODE_ENV !== 'production'`
- Standard error codes: `auth_required`, `invalid_token`, `email_in_use`, `missing_required_field`, `user_not_found`, `category_has_expenses`, `server_error`

## Response Format

Success responses follow this shape:

```json
{
    "message": "Items retrieved successfully",
    "items": [...],
    "pagination": { "total": 100, "page": 1, "limit": 10, "totalPages": 10 }
}
```

- Always include `message`
- Include `code` for error responses
- Include `pagination` for list endpoints

## Validation

- **Manual** in controllers — check required fields with `if (!field)` → 400 response
- No express-validator currently used
- Database constraints (UNIQUE, NOT NULL, FK) serve as fallback safety net
- Parse query params explicitly: `parseInt(req.query.limit as string)`

## Pagination

- Count query first (`SELECT COUNT(*)`) for total
- LIMIT/OFFSET applied with dynamic parameter counters
- Dynamic WHERE builder: increment param counter per condition
  ```typescript
  let paramCounter = 2;
  if (startDate) { conditions.push(`date >= $${paramCounter++}`); params.push(startDate); }
  ```

## New Endpoint Checklist

1. **Model** — add static method(s) with SQL queries in `models/`
2. **Controller** — add static method(s) parsing request and calling model in `controllers/`
3. **Route** — define route and attach middleware in `routes/`
4. **Register** — mount router in `index.ts` under `/api/` prefix

## Future Recommendations

- Migrate to `express-validator` for declarative input validation in route definitions
- Consider repository pattern for models with complex query logic
- Add request/response logging middleware
