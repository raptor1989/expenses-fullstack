import pool, { testConnection } from './index';

const runMigrations = async () => {
    try {
        const isConnected = await testConnection();

        if (!isConnected) {
            console.error('Failed to connect to database. Aborting migrations.');
            process.exit(1);
        }

        console.log('Running database migrations...');

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password TEXT NOT NULL,
          first_name VARCHAR(50),
          last_name VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

            await client.query(`
        ALTER TABLE users ALTER COLUMN password TYPE TEXT
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
        CREATE TABLE IF NOT EXISTS user_settings (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          currency VARCHAR(3) NOT NULL DEFAULT 'PLN',
          theme VARCHAR(5) NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

            await client.query(`
        INSERT INTO user_settings (user_id)
        SELECT id FROM users
        ON CONFLICT (user_id) DO NOTHING
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

            await client.query(`
        CREATE OR REPLACE FUNCTION create_default_settings()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO user_settings (user_id) VALUES (NEW.id);
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

            await client.query(`
        DROP TRIGGER IF EXISTS create_settings_for_new_user ON users;
        CREATE TRIGGER create_settings_for_new_user
        AFTER INSERT ON users
        FOR EACH ROW
        EXECUTE FUNCTION create_default_settings();
      `);

            const tables = ['users', 'categories', 'expenses', 'user_settings'];

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

            console.log('Database migrations completed successfully!');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Migration failed:', error);
            process.exit(1);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Failed to run migrations:', error);
        process.exit(1);
    }
};

runMigrations().then(() => {
    console.log('Migration process finished');
    process.exit(0);
});
