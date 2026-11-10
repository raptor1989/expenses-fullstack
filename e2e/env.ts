import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

export const API_PORT = 4000;
export const WEB_PORT = 5173;
export const API_URL = `http://localhost:${API_PORT}`;
export const WEB_URL = `http://localhost:${WEB_PORT}`;

export const API_DIR = path.resolve(__dirname, '../apps/api');
export const WEB_DIR = path.resolve(__dirname, '../apps/web');

// Connection settings for the dedicated e2e database. Resolution order:
// E2E_DB_* → DB_* from the environment → DB_* from apps/api/.env → CI defaults.
// DB_NAME is never reused: the suite always gets its own database.
const apiDotenv = (() => {
    const file = path.join(API_DIR, '.env');
    return fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {};
})();

const pick = (key: string, fallback: string): string =>
    process.env[`E2E_${key}`] ?? process.env[key] ?? apiDotenv[key] ?? fallback;

export const DB = {
    user: pick('DB_USER', 'postgres'),
    password: pick('DB_PASSWORD', 'postgres'),
    host: pick('DB_HOST', 'localhost'),
    port: Number(pick('DB_PORT', '5432')),
    database: process.env.E2E_DB_NAME ?? 'expenses_e2e_db'
};

// Environment handed to the API process (and to the migration script).
// Exported variables win over apps/api/.env because dotenv never overrides them.
export const apiEnv: Record<string, string> = {
    PORT: String(API_PORT),
    NODE_ENV: 'test',
    DB_USER: DB.user,
    DB_PASSWORD: DB.password,
    DB_HOST: DB.host,
    DB_PORT: String(DB.port),
    DB_NAME: DB.database,
    JWT_SECRET: process.env.E2E_JWT_SECRET ?? 'e2e-only-secret',
    JWT_EXPIRES_IN: '1h',
    ALLOWED_ORIGINS: WEB_URL,
    FRONTEND_URL: WEB_URL,
    // Empty on purpose: an SMTP_HOST in apps/api/.env must not send real mail from the suite.
    SMTP_HOST: ''
};
