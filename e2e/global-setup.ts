import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { API_DIR, DB, apiEnv } from './env';

// Runs once before the web servers start: makes sure the e2e database exists,
// applies the API schema with the compiled migration script and empties the tables,
// so every run starts from the same state.
export default async function globalSetup() {
    const migrateScript = path.join(API_DIR, 'dist', 'db', 'migrate.js');
    if (!fs.existsSync(migrateScript)) {
        throw new Error(
            `${migrateScript} not found. Build first ("npm run build" from the repo root) or run "npm run test:e2e" from the root, which builds through Turbo.`
        );
    }

    const admin = new Client({ ...DB, database: 'postgres' });
    await admin.connect();
    try {
        const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB.database]);
        if (rows.length === 0) {
            // Database names cannot be parameterised; the value comes from our own config.
            await admin.query(`CREATE DATABASE "${DB.database}"`);
        }
    } finally {
        await admin.end();
    }

    execFileSync(process.execPath, [migrateScript], {
        cwd: API_DIR,
        env: { ...process.env, ...apiEnv },
        stdio: 'inherit'
    });

    const db = new Client(DB);
    await db.connect();
    try {
        await db.query('TRUNCATE expenses, user_settings, categories, users');
    } finally {
        await db.end();
    }
}
