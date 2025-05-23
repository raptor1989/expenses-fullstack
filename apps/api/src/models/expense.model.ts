import { Expense, ExpenseCreateInput, ExpenseUpdateInput } from '@expenses/shared';
import pool from '../db/index';

export class ExpenseModel {
    // Create a new expense
    static async create(userId: string, expense: ExpenseCreateInput): Promise<Expense> {
        const client = await pool.connect();

        try {
            const query = `
        INSERT INTO expenses (amount, description, date, category_id, user_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, amount, description, date, category_id as "categoryId", user_id as "userId",
                 created_at as "createdAt", updated_at as "updatedAt"
      `;

            const values = [expense.amount, expense.description, expense.date, expense.categoryId, userId];

            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Get all expenses for a user
    static async findByUserId(
        userId: string,
        limit = 50,
        offset = 0,
        startDate?: Date,
        endDate?: Date,
        categoryId?: string
    ): Promise<{ expenses: Expense[]; total: number }> {
        const client = await pool.connect();

        try {
            // Build the query dynamically based on filters
            let whereClause = 'WHERE user_id = $1';
            const values = [userId];
            let paramCounter = 2;

            if (startDate) {
                whereClause += ` AND date >= $${paramCounter++}`;
                values.push(startDate.toISOString());
            }

            if (endDate) {
                whereClause += ` AND date <= $${paramCounter++}`;
                values.push(endDate.toISOString());
            }

            if (categoryId) {
                whereClause += ` AND category_id = $${paramCounter++}`;
                values.push(categoryId);
            }

            // Get total count for pagination
            const countQuery = `
        SELECT COUNT(*) as total
        FROM expenses
        ${whereClause}
      `;

            const countResult = await client.query(countQuery, values);
            const total = parseInt(countResult.rows[0].total);

            // Get expenses with pagination
            const query = `
        SELECT id, amount, description, date, category_id as "categoryId", user_id as "userId",
               created_at as "createdAt", updated_at as "updatedAt"
        FROM expenses
        ${whereClause}
        ORDER BY date DESC
        LIMIT $${paramCounter++} OFFSET $${paramCounter++}
      `;

            const paginatedValues = [...values, limit, offset];
            const result = await client.query(query, paginatedValues);

            return {
                expenses: result.rows,
                total
            };
        } finally {
            client.release();
        }
    }

    // Get expense by ID
    static async findById(id: string, userId: string): Promise<Expense | null> {
        const client = await pool.connect();

        try {
            const query = `
        SELECT id, amount, description, date, category_id as "categoryId", user_id as "userId",
               created_at as "createdAt", updated_at as "updatedAt"
        FROM expenses
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

    // Update expense
    static async update(id: string, userId: string, updateData: ExpenseUpdateInput): Promise<Expense | null> {
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

            if (updateData.description !== undefined) {
                updateFields.push(`description = $${valueCounter++}`);
                values.push(updateData.description);
            }

            if (updateData.date !== undefined) {
                updateFields.push(`date = $${valueCounter++}`);
                values.push(
                    updateData.date instanceof Date
                        ? updateData.date.toISOString()
                        : updateData.date
                );
            }

            if (updateData.categoryId !== undefined) {
                updateFields.push(`category_id = $${valueCounter++}`);
                values.push(updateData.categoryId);
            }

            if (updateFields.length === 0) {
                return await this.findById(id, userId);
            }

            const query = `
        UPDATE expenses
        SET ${updateFields.join(', ')}
        WHERE id = $1 AND user_id = $2
        RETURNING id, amount, description, date, category_id as "categoryId", user_id as "userId",
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

    // Delete expense
    static async delete(id: string, userId: string): Promise<boolean> {
        const client = await pool.connect();

        try {
            const query = `
        DELETE FROM expenses
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;

            const result = await client.query(query, [id, userId]);
            return (result.rowCount ?? 0) > 0;
        } finally {
            client.release();
        }
    }

    // Get expense summary by category
    static async getSummaryByCategory(userId: string, startDate: Date, endDate: Date): Promise<any> {
        const client = await pool.connect();

        try {
            const query = `
        SELECT 
          c.id as "categoryId", 
          c.name as "categoryName", 
          c.color,
          SUM(e.amount) as "totalAmount",
          (SUM(e.amount) * 100.0 / (
            SELECT SUM(amount) FROM expenses 
            WHERE user_id = $1 AND date BETWEEN $2 AND $3
          )) as "percentage"
        FROM 
          expenses e
        JOIN 
          categories c ON e.category_id = c.id
        WHERE 
          e.user_id = $1 AND e.date BETWEEN $2 AND $3
        GROUP BY 
          c.id, c.name, c.color
        ORDER BY 
          "totalAmount" DESC
      `;

            const result = await client.query(query, [userId, startDate, endDate]);

            // Calculate the grand total
            const totalQuery = `
        SELECT SUM(amount) as "grandTotal"
        FROM expenses
        WHERE user_id = $1 AND date BETWEEN $2 AND $3
      `;

            const totalResult = await client.query(totalQuery, [userId, startDate, endDate]);

            return {
                totalAmount: parseFloat(totalResult.rows[0].grandTotal || 0),
                categoryBreakdown: result.rows,
                period: {
                    startDate,
                    endDate
                }
            };
        } finally {
            client.release();
        }
    }
}
