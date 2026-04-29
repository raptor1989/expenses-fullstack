import path from 'path';
import dotenv from 'dotenv';

/**
 * Must be called at the very top of each test file (before any app imports)
 * so env vars are set before the pg Pool and JWT modules are initialized.
 * Uses override:true to ensure .env.test always wins over existing env vars.
 */
export function loadTestEnv() {
    dotenv.config({ path: path.resolve(__dirname, '../../../.env.test'), override: true });
}
