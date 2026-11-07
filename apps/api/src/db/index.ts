import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5433,
    database: process.env.DB_NAME || 'expenses_db'
});

// Without a listener a dropped idle connection emits an unhandled 'error' and kills the process.
pool.on('error', (error) => {
    console.error('Unexpected error on idle PostgreSQL client:', error);
});

export const testConnection = async (): Promise<boolean> => {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to PostgreSQL database');
        client.release();
        return true;
    } catch (error) {
        console.error('Error connecting to database:', error);
        return false;
    }
};

export default pool;
