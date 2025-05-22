import { User } from '@expenses/shared';
import pool from '../db/index.js';
import bcrypt from 'bcryptjs';

export class UserModel {
    // Register a new user
    static async create(
        username: string,
        email: string,
        password: string,
        firstName?: string,
        lastName?: string
    ): Promise<User> {
        const client = await pool.connect();

        try {
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insert user into database
            const query = `
        INSERT INTO users (username, email, password, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, email, first_name as "firstName", last_name as "lastName", created_at as "createdAt", updated_at as "updatedAt"
      `;

            const values = [username, email, hashedPassword, firstName, lastName];
            const result = await client.query(query, values);

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Find user by email
    static async findByEmail(email: string): Promise<(User & { password: string }) | null> {
        const client = await pool.connect();

        try {
            const query = `
        SELECT id, username, email, password, first_name as "firstName", last_name as "lastName", 
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

    // Find user by ID
    static async findById(id: string): Promise<User | null> {
        const client = await pool.connect();

        try {
            const query = `
        SELECT id, username, email, first_name as "firstName", last_name as "lastName", 
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

    // Update user profile
    static async update(id: string, updateData: Partial<User>): Promise<User | null> {
        const client = await pool.connect();

        try {
            // Extract fields to update
            const { firstName, lastName, email, username } = updateData;

            // Build the query dynamically
            const updateFields = [];
            const values = [id];
            let valueCounter = 2;

            if (username !== undefined) {
                updateFields.push(`username = $${valueCounter++}`);
                values.push(username);
            }

            if (email !== undefined) {
                updateFields.push(`email = $${valueCounter++}`);
                values.push(email);
            }

            if (firstName !== undefined) {
                updateFields.push(`first_name = $${valueCounter++}`);
                values.push(firstName);
            }

            if (lastName !== undefined) {
                updateFields.push(`last_name = $${valueCounter++}`);
                values.push(lastName);
            }

            if (updateFields.length === 0) {
                // Nothing to update
                return await this.findById(id);
            }

            const query = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING id, username, email, first_name as "firstName", last_name as "lastName", 
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
}
