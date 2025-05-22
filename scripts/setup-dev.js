#!/usr/bin/env node

/**
 * Local development setup script for the Expenses API
 * This script checks for PostgreSQL, creates the database if needed,
 * runs migrations, and starts the development server.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const DB_NAME = 'expenses_db';
const API_DIR = path.resolve(__dirname, '../apps/api');
const ENV_FILE = path.join(API_DIR, '.env');
const ENV_EXAMPLE_FILE = path.join(API_DIR, '.env.example');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to execute commands
function runCommand(command, args, cwd = process.cwd(), stdio = 'inherit') {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd, stdio });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Check if PostgreSQL is installed and running
async function checkPostgreSQL() {
  log('Checking PostgreSQL...', colors.cyan);
  try {
    execSync('pg_isready', { stdio: 'ignore' });
    log('PostgreSQL is running ✓', colors.green);
    return true;
  } catch (error) {
    log('PostgreSQL is not running or not installed ✗', colors.red);
    log('Please make sure PostgreSQL is installed and running', colors.yellow);
    return false;
  }
}

// Check if database exists
async function checkDatabase() {
  log(`Checking if database '${DB_NAME}' exists...`, colors.cyan);
  try {
    execSync(`psql -lqt | cut -d \\| -f 1 | grep -qw ${DB_NAME}`, { stdio: 'ignore' });
    log(`Database '${DB_NAME}' exists ✓`, colors.green);
    return true;
  } catch (error) {
    log(`Database '${DB_NAME}' does not exist ✗`, colors.yellow);
    return false;
  }
}

// Create database
async function createDatabase() {
  log(`Creating database '${DB_NAME}'...`, colors.cyan);
  try {
    execSync(`createdb ${DB_NAME}`);
    log(`Database '${DB_NAME}' created successfully ✓`, colors.green);
    return true;
  } catch (error) {
    log(`Failed to create database '${DB_NAME}' ✗`, colors.red);
    log(`Error: ${error.message}`, colors.red);
    return false;
  }
}

// Check if .env file exists and create if not
async function setupEnvFile() {
  log('Checking .env file...', colors.cyan);
  if (!fs.existsSync(ENV_FILE)) {
    log('.env file not found, creating one from example...', colors.yellow);
    if (fs.existsSync(ENV_EXAMPLE_FILE)) {
      fs.copyFileSync(ENV_EXAMPLE_FILE, ENV_FILE);
      log('.env file created successfully ✓', colors.green);
    } else {
      log('.env.example file not found, creating a basic .env file...', colors.yellow);
      const basicEnvContent = `PORT=4000
NODE_ENV=development
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
JWT_SECRET=development_secret_key
JWT_EXPIRES_IN=7d`;
      fs.writeFileSync(ENV_FILE, basicEnvContent);
      log('Basic .env file created ✓', colors.green);
    }
  } else {
    log('.env file exists ✓', colors.green);
  }
}

// Run database migrations
async function runMigrations() {
  log('Running database migrations...', colors.cyan);
  try {
    await runCommand('npm', ['run', 'db:migrate'], API_DIR);
    log('Database migrations completed successfully ✓', colors.green);
    return true;
  } catch (error) {
    log('Failed to run database migrations ✗', colors.red);
    console.error(error);
    return false;
  }
}

// Main function
async function main() {
  log('------ Expenses API Setup ------', colors.magenta);

  // Check PostgreSQL
  const postgresRunning = await checkPostgreSQL();
  if (!postgresRunning) {
    rl.close();
    process.exit(1);
  }

  // Setup environment file
  await setupEnvFile();

  // Check and create database if needed
  const dbExists = await checkDatabase();
  if (!dbExists) {
    const dbCreated = await createDatabase();
    if (!dbCreated) {
      rl.close();
      process.exit(1);
    }
  }

  // Run migrations
  const migrationsSuccessful = await runMigrations();
  if (!migrationsSuccessful) {
    rl.close();
    process.exit(1);
  }

  rl.close();

  log('------ Setup Complete! ------', colors.magenta);
  log('Starting development server...', colors.cyan);

  // Start the development server
  await runCommand('turbo', ['run', 'dev']);
}

// Run the script
main().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});
