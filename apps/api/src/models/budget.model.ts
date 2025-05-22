import { Budget } from '@expenses/shared';
import pool from '../db/index.js';

export class BudgetModel {
    // Create a new budget
    static async create(
        userId: string,
        amount: number,
        categoryId: string,
        startDate: Date,
        endDate: Date
    ): Promise<Budget> {
        const client = await pool.connect();

        try {
            const query = `
        INSERT INTO budgets (amount, category_id, user_id, start_date, end_date)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, amount, category_id as "categoryId", user_id as "userId", 
                 start_date as "startDate", end_date as "endDate",
                 created_at as "createdAt", updated_at as "updatedAt"
      `;

            const values = [amount, categoryId, userId, startDate, endDate];
            const result = await client.query(query, values);

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Get all budgets for a user
    static async findByUserId(userId: string): Promise<Budget[]> {
        const client = await pool.connect();

        try {
            const query = `
        SELECT b.id, b.amount, b.category_id as "categoryId", b.user_id as "userId",
               b.start_date as "startDate", b.end_date as "endDate",
               b.created_at as "createdAt", b.updated_at as "updatedAt",
               c.name as "categoryName"
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = $1
        ORDER BY b.end_date DESC
      `;

            const result = await client.query(query, [userId]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // Get budget by ID
    static async findById(id: string, userId: string): Promise<Budget | null> {
        const client = await pool.connect();

        try {
            const query = `
        SELECT b.id, b.amount, b.category_id as "categoryId", b.user_id as "userId",
               b.start_date as "startDate", b.end_date as "endDate",
               b.created_at as "createdAt", b.updated_at as "updatedAt",
               c.name as "categoryName"
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        WHERE b.id = $1 AND b.user_id = $2
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

    // Update budget
    static async update(
        id: string,
        userId: string,
        updateData: { amount?: number; categoryId?: string; startDate?: Date; endDate?: Date }
    ): Promise<Budget | null> {
        const client = await pool.connect();

        try {
            // Build dynamic update query
            const updateFields = [];
            const values = [id, userId];
            let valueCounter = 3;

            if (updateData.amount !== undefined) {
                updateFields.push(`amount = $${valueCounter++}`);
                values.push(updateData.amount.toString());
            }

            if (updateData.categoryId !== undefined) {
                updateFields.push(`category_id = $${valueCounter++}`);
                values.push(updateData.categoryId);
            }

            if (updateData.startDate !== undefined) {
                updateFields.push(`start_date = $${valueCounter++}`);
                values.push(updateData.startDate.toISOString());
            }

            if (updateData.endDate !== undefined) {
                updateFields.push(`end_date = $${valueCounter++}`);
                values.push(updateData.endDate.toISOString());
            }

            if (updateFields.length === 0) {
                return await this.findById(id, userId);
            }

            const query = `
        UPDATE budgets
        SET ${updateFields.join(', ')}
        WHERE id = $1 AND user_id = $2
        RETURNING id, amount, category_id as "categoryId", user_id as "userId", 
                 start_date as "startDate", end_date as "endDate",
                 created_at as "createdAt", updated_at as "updatedAt"
      `;

            const result = await client.query(query, values);

            if (result.rows.length === 0) {
                return null;
            }

            // Get category name for the updated budget
            const budgetWithCategory = await this.findById(id, userId);
            return budgetWithCategory;
        } finally {
            client.release();
        }
    }

    // Delete budget
    static async delete(id: string, userId: string): Promise<boolean> {
        const client = await pool.connect();

        try {
            const query = `
        DELETE FROM budgets
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;

            const result = await client.query(query, [id, userId]);
            return (result.rowCount ?? 0) > 0;
        } finally {
            client.release();
        }
    }

    // Get budget progress
    static async getBudgetProgress(userId: string, budgetId: string): Promise<any> {
        const client = await pool.connect();

        try {
            // First, get the budget details
            const budget = await this.findById(budgetId, userId);

            if (!budget) {
                return null;
            }

            // Get the total spent for this category in the budget period
            const spentQuery = `
        SELECT COALESCE(SUM(amount), 0) as spent
        FROM expenses
        WHERE user_id = $1 
          AND category_id = $2
          AND date BETWEEN $3 AND $4
      `;

            const spentResult = await client.query(spentQuery, [
                userId,
                budget.categoryId,
                budget.startDate,
                budget.endDate
            ]);

            const spent = parseFloat(spentResult.rows[0].spent || 0);
            const remaining = budget.amount - spent;
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

            return {
                budget,
                progress: {
                    spent,
                    remaining,
                    percentage: Math.min(percentage, 100) // Cap at 100%
                }
            };
        } finally {
            client.release();
        }
    }
}
