# Expenses Management Full-Stack Application

## 📋 Project Overview

A comprehensive full-stack TypeScript application for managing household expenses. Built with a modern monorepo architecture using Turborepo for efficient development and deployment workflows.

## 🏗️ Architecture

### Monorepo Structure
```
expenses-fullstack-js/
├── apps/
│   ├── api/                 # Express.js Backend API
│   └── web/                 # React Frontend Application
├── packages/
│   └── shared/              # Shared Types and Utilities
├── scripts/                 # Development and Deployment Scripts
├── .github/                 # GitHub Workflows and Documentation
└── turbo.json              # Turborepo Configuration
```

## 🛠️ Technology Stack

### Frontend (`apps/web`)
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **Form Handling**: Formik + Yup validation
- **HTTP Client**: Axios
- **State Management**: Zustand
- **Date Handling**: Day.js
- **Charts**: Nivo (D3-based React components)
- **Date Pickers**: MUI X Date Pickers

### Backend (`apps/api`)
- **Runtime**: Node.js 18+
- **Framework**: Express.js v5
- **Language**: TypeScript
- **Database**: PostgreSQL with node-postgres (pg)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **CORS**: cors middleware
- **Environment**: dotenv

### Shared (`packages/shared`)
- **Purpose**: Shared TypeScript interfaces and utilities
- **Exports**: Type definitions for API contracts

### Development Tools
- **Monorepo Management**: Turborepo
- **Package Manager**: npm
- **Linting**: ESLint
- **Code Formatting**: Prettier
- **Testing**: Jest
- **Process Management**: PM2 (production)
- **Development**: Nodemon (API), Vite Dev Server (Web)

## 🗂️ Database Schema

### Core Entities
- **Users**: Authentication and user profiles
- **Categories**: Expense categorization with colors
- **Expenses**: Transaction records with amounts and descriptions
- **Budgets**: Category-based budget limits with time periods

### Key Relationships
- Users → Expenses (one-to-many)
- Users → Budgets (one-to-many)
- Categories → Expenses (one-to-many)
- Categories → Budgets (one-to-many)

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher
- PostgreSQL 12+ database
- PowerShell 7+ (Windows) or Bash (Unix)

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd expenses-fullstack-js

# Install all dependencies
npm install

# Setup environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Configure database connection in apps/api/.env
# DATABASE_URL=postgresql://username:password@localhost:5432/expenses_db
# JWT_SECRET=your_secure_jwt_secret

# Run database migrations
cd apps/api
npm run db:migrate
```

## 🏃‍♂️ Development Workflow

### Running the Full Stack
```bash
# From project root - runs both API and Web simultaneously
npm run dev
```

### Running Individual Services
```bash
# API only (from apps/api/)
npm run dev

# Web only (from apps/web/)
npm run dev

# With file watching
npm run dev:watch
```

### Building for Production
```bash
# Build all packages and applications
npm run build

# Build specific application
npm run build --workspace=@expenses/api
npm run build --workspace=@expenses/web
```

## 📡 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User authentication
- `GET /api/users/profile` - Get user profile (protected)

### Expenses Management
- `GET /api/expenses` - List expenses with pagination/filtering
- `POST /api/expenses` - Create new expense
- `GET /api/expenses/:id` - Get specific expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary` - Get expense analytics

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Budgets
- `GET /api/budgets` - List user budgets
- `POST /api/budgets` - Create budget
- `GET /api/budgets/:id/progress` - Get budget progress
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

## 🎨 Frontend Features

### Core Pages
- **Dashboard**: Overview with charts and summaries
- **Expenses**: Full CRUD operations with filtering/pagination
- **Categories**: Category management with color coding
- **Budgets**: Budget creation and progress tracking
- **Authentication**: Login/Register flows

### UI Components
- Responsive Material Design interface
- Dark/Light theme support
- Data visualization with interactive charts
- Form validation and error handling
- Loading states and notifications

## 🔧 Configuration Files

### TypeScript Configuration
- Root `tsconfig.json`: Base configuration
- App-specific configs extend the base
- ES Modules support with Node.js compatibility

### Build Configuration
- `turbo.json`: Monorepo build orchestration
- `vite.config.ts`: Frontend build configuration
- Individual `package.json` files per workspace

### Development Tools
- `.eslintrc`: Code linting rules
- `.prettierrc`: Code formatting rules
- `nodemon.json`: API development server config

## 🚢 Deployment

### Production Build
```bash
# Build all applications
npm run build

# Start with PM2
npm run start:pm2
```

### Environment Variables

#### API (.env)
```
PORT=4000
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=secure_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

#### Web (.env.local)
```
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=Expenses Manager
```

## 🧪 Testing Strategy

### Current Implementation
- Unit tests with Jest
- TypeScript compilation validation
- ESLint code quality checks

### Future Enhancements
- Integration tests for API endpoints
- Component testing with React Testing Library
- E2E tests with Playwright/Cypress

## 🔍 Troubleshooting

### Common Issues

#### TypeScript ESM Issues
- Ensure Node.js 18+ is installed
- Check import statements use `.js` extensions
- Verify `"type": "module"` in package.json

#### Database Connection
- Confirm PostgreSQL is running
- Validate DATABASE_URL format
- Check user permissions

#### Build Failures
- Clear `node_modules` and reinstall
- Check TypeScript compilation errors
- Verify all dependencies are installed

## 📚 Development Best Practices

### Code Organization
- Shared types in `packages/shared`
- Feature-based folder structure
- Separation of concerns (controllers, services, models)

### Git Workflow
- Feature branches from `develop`
- Conventional commit messages
- Pull request reviews required

### Security
- JWT token authentication
- Password hashing with bcryptjs
- Input validation on all endpoints
- CORS configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the API documentation in individual README files

---

**Last Updated**: October 2025  
**Node.js Version**: 18.x+  
**TypeScript Version**: 5.x+  
**Database**: PostgreSQL 12+