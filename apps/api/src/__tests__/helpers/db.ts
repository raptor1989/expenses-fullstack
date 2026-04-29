import { Pool } from 'pg';

let testPool: Pool | null = null;

export function getTestPool(): Pool {
    if (!testPool) {
        testPool = new Pool({
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME || 'expenses_test_db',
            ssl: false,
        });
    }
    return testPool;
}

export async function truncateAllTables(): Promise<void> {
    const pool = getTestPool();
    // Delete in FK order: expenses → categories → users
    await pool.query('DELETE FROM expenses');
    await pool.query('DELETE FROM categories');
    await pool.query('DELETE FROM users');
}

export async function closeTestPool(): Promise<void> {
    if (testPool) {
        await testPool.end();
        testPool = null;
    }
}
