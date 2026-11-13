import { Category } from '@expenses/shared';
import pool from '../db/index';

export class CategoryHasExpensesError extends Error {
    code = 'category_has_expenses';

    constructor() {
        super('Cannot delete category with associated expenses');
        this.name = 'CategoryHasExpensesError';
    }
}

export class InvalidMoveTargetError extends Error {
    code = 'validation_error';

    constructor() {
        super('Target category not found');
        this.name = 'InvalidMoveTargetError';
    }
}

export class CategoryModel {
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

    static async findByUserId(userId: string): Promise<Category[]> {
        const client = await pool.connect();

        try {
            const query = `
        SELECT c.id, c.name, c.color, c.icon, c.user_id as "userId", c.created_at as "createdAt",
               c.updated_at as "updatedAt", COUNT(e.id)::int as "expenseCount"
        FROM categories c
        LEFT JOIN expenses e ON e.category_id = c.id AND e.user_id = c.user_id
        WHERE c.user_id = $1
        GROUP BY c.id
        ORDER BY c.name ASC, c.created_at ASC
      `;

            const result = await client.query(query, [userId]);
            return result.rows;
        } finally {
            client.release();
        }
    }

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

    static async update(
        id: string,
        userId: string,
        name?: string,
        color?: string,
        icon?: string
    ): Promise<Category | null> {
        const client = await pool.connect();

        try {
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

    // Without `moveTo` a category that still has expenses is refused; with it, the user's expenses are
    // reassigned first. Both paths run in one transaction, so a failure never leaves a partial move.
    static async delete(id: string, userId: string, moveTo?: string): Promise<boolean> {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const source = await client.query('SELECT id FROM categories WHERE id = $1 AND user_id = $2 FOR UPDATE', [
                id,
                userId
            ]);

            if (source.rows.length === 0) {
                await client.query('ROLLBACK');
                return false;
            }

            if (moveTo) {
                // `id <> $3` also guards against moving onto the deleted category, whose expenses would cascade.
                const target = await client.query(
                    'SELECT id FROM categories WHERE id = $1 AND user_id = $2 AND id <> $3',
                    [moveTo, userId, id]
                );

                if (target.rows.length === 0) {
                    throw new InvalidMoveTargetError();
                }

                await client.query('UPDATE expenses SET category_id = $1 WHERE category_id = $2 AND user_id = $3', [
                    moveTo,
                    id,
                    userId
                ]);
            } else {
                const checkResult = await client.query(
                    'SELECT COUNT(*) as count FROM expenses WHERE category_id = $1 AND user_id = $2',
                    [id, userId]
                );

                if (parseInt(checkResult.rows[0].count) > 0) {
                    throw new CategoryHasExpensesError();
                }
            }

            await client.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
