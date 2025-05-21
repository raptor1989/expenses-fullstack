#!/usr/bin/env pwsh
# Script to set up and install all dependencies for the household expenses application

Write-Host "Setting up Household Expenses Application..." -ForegroundColor Cyan

# Navigate to project root (if not already there)
$projectRoot = $PSScriptRoot

# Install root dependencies
Write-Host "`nInstalling root dependencies..." -ForegroundColor Yellow
npm install

# Install scripts dependencies
Write-Host "`nInstalling script dependencies..." -ForegroundColor Yellow
Push-Location "$projectRoot\scripts"
npm install
Pop-Location

Write-Host "`nChecking MongoDB connection..." -ForegroundColor Yellow
Push-Location "$projectRoot\scripts"
node test-connection.js
Pop-Location

Write-Host "`nInstallation complete!" -ForegroundColor Green
Write-Host "You can now start the application with 'npm run dev'" -ForegroundColor Cyan
