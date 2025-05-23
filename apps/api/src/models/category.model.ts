import { Category } from '@expenses/shared';
import pool from '../db/index';

export class CategoryModel {
    // Create a new category
    static async create(userId: string, name: string, color?: string, icon?: string): Promise<Category> {
        const client = await pool.connect();

        try {
            const query = `
        INSERT INTO categories (name, color, icon, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, color, icon, user_id as "userId", created_at as "createdAt", updated_at as "updatedAt"
      `;

            const values = [name, color, icon, userId];
            const result = await client.query(query, values);

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Get all categories for a user
    static async findByUserId(userId: string): Promise<Category[]> {
        const client = await pool.connect();

        try {
            const query = `
        SELECT id, name, color, icon, user_id as "userId", created_at as "createdAt", updated_at as "updatedAt"
        FROM categories
        WHERE user_id = $1
        ORDER BY name ASC
      `;

            const result = await client.query(query, [userId]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // Get category by ID
    static async findById(id: string, userId: string): Promise<Category | null> {
        const client = await pool.connect();

        try {
            const query = `
        SELECT id, name, color, icon, user_id as "userId", created_at as "createdAt", updated_at as "updatedAt"
        FROM categories
        WHERE id = $1 AND user_id = $2
      `;

            const result = await client.query(query, [id, userId]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Update category
    static async update(
        id: string,
        userId: string,
        name?: string,
        color?: string,
        icon?: string
    ): Promise<Category | null> {
        const client = await pool.connect();

        try {
            // Build dynamic update query
            const updateFields = [];
            const values = [id, userId];
            let valueCounter = 3;

            if (name !== undefined) {
                updateFields.push(`name = $${valueCounter++}`);
                values.push(name);
            }

            if (color !== undefined) {
                updateFields.push(`color = $${valueCounter++}`);
                values.push(color);
            }

            if (icon !== undefined) {
                updateFields.push(`icon = $${valueCounter++}`);
                values.push(icon);
            }

            if (updateFields.length === 0) {
                return await this.findById(id, userId);
            }

            const query = `
        UPDATE categories
        SET ${updateFields.join(', ')}
        WHERE id = $1 AND user_id = $2
        RETURNING id, name, color, icon, user_id as "userId", created_at as "createdAt", updated_at as "updatedAt"
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

    // Delete category
    static async delete(id: string, userId: string): Promise<boolean> {
        const client = await pool.connect();

        try {
            // Check if category has associated expenses
            const checkQuery = `
        SELECT COUNT(*) as count
        FROM expenses
        WHERE category_id = $1 AND user_id = $2
      `;

            const checkResult = await client.query(checkQuery, [id, userId]);
            const expenseCount = parseInt(checkResult.rows[0].count);

            if (expenseCount > 0) {
                throw new Error('Cannot delete category with associated expenses');
            }

            // Delete category
            const query = `
        DELETE FROM categories
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;

            const result = await client.query(query, [id, userId]);
            return (result.rowCount ?? 0) > 0;
        } finally {
            client.release();
        }
    }
}
