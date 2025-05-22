import pool, { testConnection } from './index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigrations = async () => {
    try {
        // Test database connection
        const isConnected = await testConnection();

        if (!isConnected) {
            console.error('Failed to connect to database. Aborting migrations.');
            process.exit(1);
        }

        console.log('Running database migrations...');

        const client = await pool.connect();

        try {
            // Begin transaction
            await client.query('BEGIN');

            // Create users table
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

            // Create categories table
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

            // Create expenses table
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

            // Create budgets table
            await client.query(`
        CREATE TABLE IF NOT EXISTS budgets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          amount DECIMAL(12, 2) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          category_id UUID NOT NULL,
          user_id UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

            // Create a few default categories for new users
            await client.query(`
        CREATE OR REPLACE FUNCTION create_default_categories()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO categories (name, color, icon, user_id)
          VALUES 
            ('Food', '#FF5733', 'food', NEW.id),
            ('Transportation', '#33FF57', 'car', NEW.id),
            ('Utilities', '#3357FF', 'utility', NEW.id),
            ('Entertainment', '#FF33A8', 'entertainment', NEW.id),
            ('Healthcare', '#33FFF6', 'health', NEW.id);
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

            // Create trigger for default categories
            await client.query(`
        DROP TRIGGER IF EXISTS create_categories_for_new_user ON users;
        CREATE TRIGGER create_categories_for_new_user
        AFTER INSERT ON users
        FOR EACH ROW
        EXECUTE FUNCTION create_default_categories();
      `);

            // Create updated_at triggers
            const tables = ['users', 'categories', 'expenses', 'budgets'];

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

            // Commit transaction
            await client.query('COMMIT');

            console.log('Database migrations completed successfully!');
        } catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            console.error('Migration failed:', error);
            process.exit(1);
        } finally {
            // Release client
            client.release();
        }
    } catch (error) {
        console.error('Failed to run migrations:', error);
        process.exit(1);
    }
};

// Run migrations
runMigrations().then(() => {
    console.log('Migration process finished');
    process.exit(0);
});
