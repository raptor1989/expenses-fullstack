# PowerShell Production Deployment Script for Expenses Full-Stack JS Application with PM2

Write-Host "Starting deployment process for Expenses Full-Stack JS Application with PM2..." -ForegroundColor Green

# Check for required environment variables
if (-not $env:MONGODB_URI) {
    Write-Host "ERROR: MONGODB_URI environment variable is required!" -ForegroundColor Red
    exit 1
}

if (-not $env:JWT_SECRET) {
    Write-Host "ERROR: JWT_SECRET environment variable is required!" -ForegroundColor Red
    exit 1
}

if (-not $env:API_URL) {
    Write-Host "ERROR: API_URL environment variable is required!" -ForegroundColor Red
    Write-Host "Example: https://api.example.com" -ForegroundColor Yellow
    exit 1
}

# Check for PM2
try {
    $pm2Version = npm list -g pm2
    if (-not $pm2Version) {
        Write-Host "PM2 is not installed globally. Installing PM2..." -ForegroundColor Yellow
        npm install -g pm2
    }
}
catch {
    Write-Host "PM2 is not installed globally. Installing PM2..." -ForegroundColor Yellow
    npm install -g pm2
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm ci

# Build for production
Write-Host "Building for production..." -ForegroundColor Cyan
$env:NODE_ENV = "production"
npm run build:prod

# Setup environment variables for the ecosystem.config.js
Write-Host "Setting up environment variables for PM2..." -ForegroundColor Cyan
pm2 set expenses-api:MONGODB_URI $env:MONGODB_URI
pm2 set expenses-api:JWT_SECRET $env:JWT_SECRET
pm2 set expenses-frontend:NEXT_PUBLIC_API_URL $env:API_URL

# Start or restart the application with PM2
$pmApps = pm2 list | Where-Object { $_ -match "expenses-api|expenses-frontend" }
if ($pmApps) {
    Write-Host "Restarting existing PM2 applications..." -ForegroundColor Yellow
    npm run pm2:restart
}
else {
    Write-Host "Starting applications with PM2..." -ForegroundColor Green
    npm run pm2:start
}

Write-Host "=====================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Applications running with PM2:" -ForegroundColor Cyan
Write-Host "- expenses-api    : API server" -ForegroundColor White
Write-Host "- expenses-frontend: Frontend server" -ForegroundColor White
Write-Host ""
Write-Host "PM2 Commands:" -ForegroundColor Yellow
Write-Host "npm run pm2:logs   - View application logs" -ForegroundColor White
Write-Host "npm run pm2:monit  - Monitor application" -ForegroundColor White
Write-Host "npm run pm2:stop   - Stop applications" -ForegroundColor White
Write-Host "npm run pm2:restart - Restart applications" -ForegroundColor White
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
