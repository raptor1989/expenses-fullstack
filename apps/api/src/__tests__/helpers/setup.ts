import path from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';

export default async function globalSetup() {
    // Load test environment variables before anything else
    dotenv.config({ path: path.resolve(__dirname, '../../../.env.test') });

    const dbName = process.env.DB_NAME || 'expenses_test_db';
    const dbConfig = {
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        ssl: false,
    };

    // Create test database if it doesn't exist (connect to default 'postgres' db)
    const adminPool = new Pool({ ...dbConfig, database: 'postgres' });
    try {
        const { rows } = await adminPool.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [dbName]
        );
        if (rows.length === 0) {
            // Database names cannot be parameterised; dbName comes from our own .env.test
            await adminPool.query(`CREATE DATABASE "${dbName}"`);
        }
    } finally {
        await adminPool.end();
    }

    const pool = new Pool({ ...dbConfig, database: dbName });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL,
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(50) NOT NULL,
                color VARCHAR(7),
                icon VARCHAR(50),
                user_id UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS expenses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                amount DECIMAL(12, 2) NOT NULL,
                description TEXT NOT NULL,
                date DATE NOT NULL,
                category_id UUID NOT NULL,
                user_id UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await client.query(`
            CREATE OR REPLACE FUNCTION create_default_categories()
            RETURNS TRIGGER AS $$
            BEGIN
                INSERT INTO categories (name, color, icon, user_id)
                VALUES
                    ('General', '#FF5733', 'general', NEW.id),
                    ('Bill payments', '#33FF57', 'bills', NEW.id),
                    ('Fuel', '#3357FF', 'fuel', NEW.id),
                    ('Entertainment', '#FF33A8', 'entertainment', NEW.id),
                    ('Other', '#33FFF6', 'other', NEW.id);
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS create_categories_for_new_user ON users;
            CREATE TRIGGER create_categories_for_new_user
            AFTER INSERT ON users
            FOR EACH ROW
            EXECUTE FUNCTION create_default_categories();
        `);

        const tables = ['users', 'categories', 'expenses'];
        for (const table of tables) {
            await client.query(`
                CREATE OR REPLACE FUNCTION update_${table}_updated_at()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `);
            await client.query(`
                DROP TRIGGER IF EXISTS set_${table}_updated_at ON ${table};
                CREATE TRIGGER set_${table}_updated_at
                BEFORE UPDATE ON ${table}
                FOR EACH ROW
                EXECUTE FUNCTION update_${table}_updated_at();
            `);
        }

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}
