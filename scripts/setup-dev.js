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
const dotenv = require('dotenv');
const { Pool } = require('pg');


const DB_NAME = 'expenses_db';
const API_DIR = path.resolve(__dirname, '../apps/api');
const ENV_FILE = path.join(API_DIR, '.env');
const ENV_EXAMPLE_FILE = path.join(API_DIR, '.env.example');


const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};


function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}


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


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Connects to the 'postgres' maintenance database using the same credentials
// the API itself uses (read from .env), rather than shelling out to the
// psql CLI, which may not be installed or on PATH.
function getAdminPool() {
  return new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: 'postgres',
    connectionTimeoutMillis: 3000,
  });
}

async function checkPostgreSQL() {
  log('Checking PostgreSQL...', colors.cyan);
  const pool = getAdminPool();
  try {
    const client = await pool.connect();
    client.release();
    log('PostgreSQL is running ✓', colors.green);
    return true;
  } catch (error) {
    log('PostgreSQL is not running or not installed ✗', colors.red);
    log('Please make sure PostgreSQL is installed and running', colors.yellow);
    log(`Error: ${error.message}`, colors.red);
    return false;
  } finally {
    await pool.end();
  }
}


async function checkDatabase() {
  const dbName = process.env.DB_NAME || DB_NAME;
  log(`Checking if database '${dbName}' exists...`, colors.cyan);
  const pool = getAdminPool();
  try {
    const { rows } = await pool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (rows.length === 0) {
      log(`Database '${dbName}' does not exist ✗`, colors.yellow);
      return false;
    }
    log(`Database '${dbName}' exists ✓`, colors.green);
    return true;
  } catch (error) {
    log(`Error checking if database exists: ${error.message}`, colors.red);
    log(`Assuming database '${dbName}' does not exist ✗`, colors.yellow);
    return false;
  } finally {
    await pool.end();
  }
}

// Create database
async function createDatabase() {
  const dbName = process.env.DB_NAME || DB_NAME;
  log(`Creating database '${dbName}'...`, colors.cyan);
  const pool = getAdminPool();
  try {
    // Database names cannot be parameterised; dbName comes from our own .env
    await pool.query(`CREATE DATABASE "${dbName}"`);
    log(`Database '${dbName}' created successfully ✓`, colors.green);
    return true;
  } catch (error) {
    log(`Failed to create database '${dbName}' ✗`, colors.red);
    log(`Error: ${error.message}`, colors.red);
    return false;
  } finally {
    await pool.end();
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
JWT_EXPIRES_IN=7D`;
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
    execSync('ts-node .\\apps\\api\\src\\db\\migrate.ts', { stdio: 'ignore' });
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

  // Setup environment file, then load it so DB_* vars are available
  await setupEnvFile();
  dotenv.config({ path: ENV_FILE, quiet: true });

  // Check PostgreSQL
  const postgresRunning = await checkPostgreSQL();
  if (!postgresRunning) {
    rl.close();
    process.exit(1);
  }

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
  execSync('npm run dev', { stdio: 'ignore' });
}

// Run the script
main().catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});
