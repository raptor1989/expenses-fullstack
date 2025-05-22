# Household Expenses Management App

A full-stack TypeScript application for managing household expenses. Built with a monorepo structure using Turborepo.

## Features

- **User Authentication**: Secure JWT-based authentication system
- **Expense Management**: Create, update, delete, and categorize expenses
- **Categories**: Organize expenses by customizable categories
- **Budgets**: Set budgets by category with progress tracking
- **Dashboard**: Visualize spending patterns and budget progress
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
- `/api/v1/budgets` - Budget management

## License

MIT
