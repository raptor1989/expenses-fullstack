# Household Expenses Manager

A fullstack TypeScript application for managing household expenses. Built with NestJS (backend) and NextJS (frontend) in a Turborepo monorepo structure. This application uses MongoDB with Mongoose ORM for the backend database.

## Project Structure

```
expenses-fullstack-js/
├── apps/
│   ├── api/            # NestJS backend
│   └── frontend/       # NextJS frontend
├── packages/
│   ├── database/       # Mongoose database connection and models
│   ├── shared-types/   # Shared TypeScript interfaces
│   ├── ui/             # Shared UI components
│   ├── eslint-config/  # ESLint configuration
│   └── typescript-config/ # TypeScript configuration
├── scripts/            # Utility scripts
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
- MongoDB 5.0+ (local installation or MongoDB Atlas account)

### Environment Setup

1. **Database Configuration**:

Create a `.env` file in the `packages/database` directory:
```
MONGODB_URI=mongodb://localhost:27017/household-expenses
JWT_SECRET=your-secret-key-here
```

2. **API Configuration**:

Create a `.env` file in the `apps/api` directory:
```
PORT=3001
JWT_SECRET=your-secret-key-here
MONGODB_URI=mongodb://localhost:27017/household-expenses
```

3. **Frontend Configuration**:

Create a `.env.local` file in the `apps/frontend` directory:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Installation

```bash
# Install dependencies for all packages
npm install

# Or if you encounter peer dependency issues
npm install --legacy-peer-deps
```

### Testing MongoDB Connection

Before starting the application, test your MongoDB connection:

```bash
# Run the connection test script
node scripts/test-connection.js
```

### Development

```bash
# Start all services in development mode
npm run dev

# Or run services separately
npm run dev:api     # Start backend only on http://localhost:3001
npm run dev:frontend  # Start frontend only on http://localhost:3000
```

### Building for Production

```bash
# Build all packages and applications
npm run build

# Or build services separately
npm run build:api     # Build backend only
npm run build:frontend  # Build frontend only
```

### Production Deployment

For production deployment, make sure to set appropriate environment variables for:

1. MongoDB connection string (production database)
2. JWT secret (unique, secure random string)
3. Frontend API URL (production API endpoint)

You can deploy the frontend and backend separately to platforms like Vercel, Netlify, or any cloud provider of your choice.

## API Routes

- **Authentication**

  - POST `/auth/login` - User login
  - POST `/auth/register` - User registration
  - POST `/users` - Alternative user registration endpoint

- **Expenses**
  - GET `/expenses` - List all expenses for current user
  - GET `/expenses/:id` - Get specific expense
  - POST `/expenses` - Create new expense
  - PATCH `/expenses/:id` - Update expense
  - DELETE `/expenses/:id` - Delete expense
  - GET `/expenses/summary` - Get expense summary with date range (accepts `startDate` and `endDate` query parameters)

## Troubleshooting

### MongoDB Connection Issues

- Make sure MongoDB is running locally or your MongoDB Atlas connection string is correct
- Check that the environment variables are properly set
- Run the connection test script: `node scripts/test-connection.js`
- Ensure your network allows connections to MongoDB (check firewall settings)

### Authentication Issues

- JWT tokens expire after 24 hours. If you experience authentication errors, try logging out and logging back in
- Check that the same JWT_SECRET is used in both the database and API environments

### Development Environment

- If you encounter "Module not found" errors, try running `npm install` again
- For TypeScript errors, ensure you're using a compatible version of Node.js
- When switching branches or pulling updates, rebuild the application with `npm run build`

## Planned Future Improvements

1. **Monthly Budget Feature**: Set and track monthly budgets for different expense categories
2. **Multi-currency Support**: Handle expenses in different currencies
3. **Recurring Expenses**: Set up recurring expenses that are added automatically
4. **Mobile App**: React Native mobile application
5. **Export/Import**: Export expenses to CSV/Excel and import from various formats
6. **Multiple Users**: Family/household accounts with shared expenses
7. **Advanced Analytics**: More detailed charts and reports for spending analysis

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
