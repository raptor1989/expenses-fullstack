import { User } from '@expenses/shared';
import pool from '../db/index';
import bcrypt from 'bcryptjs';

export class UserModel {
    static async create(email: string, password: string): Promise<User> {
        const client = await pool.connect();

        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const query = `
        INSERT INTO users (email, password)
        VALUES ($1, $2)
        RETURNING id, email, created_at as "createdAt", updated_at as "updatedAt"
      `;

            const values = [email, hashedPassword];
            const result = await client.query(query, values);

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async findByEmail(email: string): Promise<(User & { password: string }) | null> {
        const client = await pool.connect();

        try {
            const query = `
        SELECT id, email, password,
               created_at as "createdAt", updated_at as "updatedAt"
        FROM users
        WHERE email = $1
      `;

            const result = await client.query(query, [email]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async findPasswordById(id: string): Promise<string | null> {
        const client = await pool.connect();

        try {
            const result = await client.query('SELECT password FROM users WHERE id = $1', [id]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0].password;
        } finally {
            client.release();
        }
    }

    static async updatePassword(id: string, newPassword: string): Promise<void> {
        const client = await pool.connect();

        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
        } finally {
            client.release();
        }
    }

    static async findById(id: string): Promise<User | null> {
        const client = await pool.connect();

        try {
            const query = `
        SELECT id, email,
               created_at as "createdAt", updated_at as "updatedAt"
        FROM users
        WHERE id = $1
      `;

            const result = await client.query(query, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async update(id: string, updateData: Partial<User>): Promise<User | null> {
        const client = await pool.connect();

        try {
            const { email } = updateData;

            const updateFields = [];
            const values = [id];
            let valueCounter = 2;

            if (email !== undefined) {
                updateFields.push(`email = $${valueCounter++}`);
                values.push(email);
            }

            if (updateFields.length === 0) {
                return await this.findById(id);
            }

            const query = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING id, email,
                 created_at as "createdAt", updated_at as "updatedAt"
      `;

            const result = await client.query(query, values);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async setResetToken(email: string, tokenHash: string, expiresAt: Date): Promise<void> {
        const client = await pool.connect();

        try {
            await client.query('UPDATE users SET reset_token_hash = $1, reset_token_expires_at = $2 WHERE email = $3', [
                tokenHash,
                expiresAt,
                email
            ]);
        } finally {
            client.release();
        }
    }

    static async findByResetTokenHash(tokenHash: string): Promise<(User & { resetTokenExpiresAt: Date | null }) | null> {
        const client = await pool.connect();

        try {
            const query = `
        SELECT id, email, created_at as "createdAt", updated_at as "updatedAt",
               reset_token_expires_at as "resetTokenExpiresAt"
        FROM users
        WHERE reset_token_hash = $1
      `;

            const result = await client.query(query, [tokenHash]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    static async resetPassword(id: string, newPassword: string): Promise<void> {
        const client = await pool.connect();

        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await client.query(
                'UPDATE users SET password = $1, reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = $2',
                [hashedPassword, id]
            );
        } finally {
            client.release();
        }
    }
}
