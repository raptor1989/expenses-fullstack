#!/bin/bash

# Production Deployment Script for Expenses Full-Stack JS Application with PM2

# Exit on error
set -e

echo "Starting deployment process for Expenses Full-Stack JS Application with PM2..."

# Check for required environment variables
if [ -z "$MONGODB_URI" ]; then
  echo "ERROR: MONGODB_URI environment variable is required!"
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "ERROR: JWT_SECRET environment variable is required!"
  exit 1
fi

if [ -z "$API_URL" ]; then
  echo "ERROR: API_URL environment variable is required!"
  echo "Example: https://api.example.com"
  exit 1
fi

# Check for PM2
if ! command -v pm2 &> /dev/null; then
  echo "PM2 is not installed globally. Installing PM2..."
  npm install -g pm2
fi

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build for production
echo "Building for production..."
NODE_ENV=production npm run build:prod

# Setup environment variables for the ecosystem.config.js
echo "Setting up environment variables for PM2..."
pm2 set expenses-api:MONGODB_URI $MONGODB_URI
pm2 set expenses-api:JWT_SECRET $JWT_SECRET
pm2 set expenses-frontend:NEXT_PUBLIC_API_URL $API_URL

# Start or restart the application with PM2
if pm2 list | grep -q "expenses-api\|expenses-frontend"; then
  echo "Restarting existing PM2 applications..."
  npm run pm2:restart
else
  echo "Starting applications with PM2..."
  npm run pm2:start
fi

echo "====================================="
echo "Deployment completed successfully!"
echo "====================================="
echo ""
echo "Applications running with PM2:"
echo "- expenses-api    : API server"
echo "- expenses-frontend: Frontend server"
echo ""
echo "PM2 Commands:"
echo "npm run pm2:logs   - View application logs"
echo "npm run pm2:monit  - Monitor application"
echo "npm run pm2:stop   - Stop applications"
echo "npm run pm2:restart - Restart applications"
echo ""
echo "====================================="
