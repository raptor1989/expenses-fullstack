# Household Expenses Manager

A fullstack TypeScript application for managing household expenses. Built with NestJS (backend) and NextJS (frontend) in a Turborepo monorepo structure.

## Project Structure

```
expenses-fullstack-js/
├── apps/
│   ├── api/            # NestJS backend
│   └── frontend/       # NextJS frontend
├── packages/
│   ├── database/       # Mongoose database package
│   └── shared-types/   # Shared TypeScript interfaces
├── package.json
└── turbo.json
```

## Features

- **User Authentication**: Register, login, and JWT-based auth
- **Expense Management**: Create, read, update, and delete expenses
- **Categorization**: Organize expenses by categories
- **Reporting**: Get summaries and visualize expense data
- **TypeScript**: End-to-end type safety

## Technology Stack

- **Frontend**: NextJS, React, TailwindCSS, Zustand (state management)
- **Backend**: NestJS, Mongoose, MongoDB database
- **Infrastructure**: Turborepo (monorepo management)
- **Authentication**: JWT-based authentication
- **Shared**: TypeScript for end-to-end type safety

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps
```

### Development

```bash
# Start all services in development mode
npm run dev

# Backend will run on http://localhost:3001/api
# Frontend will run on http://localhost:3000
```

### Building for Production

```bash
# Build all packages and applications
npm run build
```

## API Routes

- **Authentication**

  - POST `/api/auth/login` - User login
  - POST `/api/users` - User registration

- **Expenses**
  - GET `/api/expenses` - List all expenses for current user
  - GET `/api/expenses/:id` - Get specific expense
  - POST `/api/expenses` - Create new expense
  - PATCH `/api/expenses/:id` - Update expense
  - DELETE `/api/expenses/:id` - Delete expense
  - GET `/api/expenses/summary` - Get expense summary with date range

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
npx turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
