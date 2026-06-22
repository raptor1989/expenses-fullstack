# Household Expenses Management App

A full-stack TypeScript application for managing household expenses. Built with a monorepo structure using Turborepo.

## Features

- **User Authentication**: Secure JWT-based authentication system
- **Expense Management**: Create, update, delete, and categorize expenses
- **Categories**: Organize expenses by customizable categories
- **Dashboard**: Visualize spending patterns
- **Responsive UI**: Works on mobile and desktop

## Tech Stack

### Frontend
- React (with Vite)
- TypeScript
- Material-UI
- React Router
- Formik & Yup (form handling)
- Nivo (data visualization)
- Axios (API client)

### Backend
- Node.js
- Express.js
- TypeScript
- PostgreSQL (with node-postgres)
- JWT Authentication

### Development Tools
- Turborepo (monorepo management)
- ESLint
- TypeScript
- PM2 (production process management)

### Testing
- Jest + ts-jest (test runner)
- Supertest (HTTP integration testing)

## Project Structure

```
expenses-fullstack-js/
├── apps/
│   ├── api/              # Express.js backend
│   └── web/              # React frontend
├── packages/
│   └── shared/           # Shared types and utilities
└── scripts/              # Setup and deployment scripts
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# In apps/api directory
cp .env.example .env
# Edit the .env file with your database credentials and JWT secret
```

4. Initialize the database:

```bash
cd apps/api
npm run db:migrate
npm run db:seed # Optional - adds sample data
```

### Development

Start all services in development mode:

```bash
npm run dev
```

Or start individual services:

```bash
# API only
npm run dev:api

# Web only
npm run dev:web
```

### Build for Production

Build all packages and apps:

```bash
npm run build
```

## Testing

Integration tests run against a dedicated PostgreSQL database (`expenses_test_db`) and cover the full HTTP stack — middleware, validation, authentication, and database queries.

### Prerequisites

Create the test database (done automatically on first run, but PostgreSQL must be running):

```bash
# The test setup creates expenses_test_db automatically
```

Configure test environment variables in `apps/api/.env.test`:

```env
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=expenses_test_db
JWT_SECRET=test-secret-key-for-integration-tests
```

### Running Tests

```bash
# Run all integration tests (from the API package)
cd apps/api
npm test

# Run from the monorepo root
npm test --workspace=apps/api

# Run a specific test file
cd apps/api
npm test -- --testPathPattern=auth
```

### Test Suites

| Suite | File | Tests |
|---|---|---|
| Auth & Users | `auth.test.ts` | Register, login, profile CRUD, logout |
| Categories | `categories.test.ts` | CRUD, user isolation, FK constraints |
| Expenses | `expenses.test.ts` | CRUD, pagination, date/category filtering, user isolation |
| Analytics | `analytics.test.ts` | Expense summary by category, monthly breakdown |

### Test Architecture

```
apps/api/
├── jest.config.js
├── tsconfig.test.json
├── .env.test
└── src/__tests__/
    ├── helpers/
    │   ├── setup.ts       # globalSetup: creates DB, runs migrations
    │   ├── teardown.ts    # globalTeardown
    │   ├── env.ts         # loads .env.test before app imports
    │   ├── db.ts          # test pool, truncateAllTables()
    │   ├── auth.ts        # registerAndLogin() helper
    │   └── fixtures.ts    # factory functions for test data
    ├── auth.test.ts
    ├── categories.test.ts
    ├── expenses.test.ts
    └── analytics.test.ts
```

Each test file truncates all tables in `beforeEach`/`afterEach` to guarantee isolation. Tests run serially (`--runInBand`) to avoid cross-test database conflicts.

### Deployment

Deploy using PM2:

```bash
npm run start:pm2
```

## API Documentation

The API endpoints are available at `/api/v1` and include:

- `/api/v1/auth` - Authentication
- `/api/v1/users` - User management
- `/api/v1/expenses` - Expense CRUD operations
- `/api/v1/categories` - Category management

## License

MIT
