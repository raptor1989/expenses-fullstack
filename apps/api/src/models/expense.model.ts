import { Expense, ExpenseByMonth, ExpenseCreateInput, ExpenseSummary, ExpenseUpdateInput } from '@expenses/shared';
import pool from '../db/index';

export class ExpenseModel {
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
            const row = result.rows[0];
            return { ...row, amount: parseFloat(row.amount) };
        } finally {
            client.release();
        }
    }

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

            const countQuery = `
        SELECT COUNT(*) as total
        FROM expenses
        ${whereClause}
      `;

            const countResult = await client.query(countQuery, values);
            const total = parseInt(countResult.rows[0].total);

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

            const expenses = result.rows.map((row) => ({ ...row, amount: parseFloat(row.amount) }));
            return {
                expenses,
                total
            };
        } finally {
            client.release();
        }
    }

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
            const row = result.rows[0];
            return { ...row, amount: parseFloat(row.amount) };
        } finally {
            client.release();
        }
    }

    static async update(id: string, userId: string, updateData: ExpenseUpdateInput): Promise<Expense | null> {
        const client = await pool.connect();

        try {
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
                values.push(updateData.date instanceof Date ? updateData.date.toISOString() : updateData.date);
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
            const row = result.rows[0];
            return { ...row, amount: parseFloat(row.amount) };
        } finally {
            client.release();
        }
    }

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

    static async getSummaryByCategory(userId: string, startDate: Date, endDate: Date): Promise<ExpenseSummary> {
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

            const totalQuery = `
        SELECT SUM(amount) as "grandTotal"
        FROM expenses
        WHERE user_id = $1 AND date BETWEEN $2 AND $3
      `;

            const totalResult = await client.query(totalQuery, [userId, startDate, endDate]);

            const categoryBreakdown = result.rows.map((row) => ({
                ...row,
                totalAmount: parseFloat(row.totalAmount),
                percentage: parseFloat(row.percentage)
            }));
            return {
                totalAmount: parseFloat(totalResult.rows[0].grandTotal || 0),
                categoryBreakdown,
                period: {
                    startDate,
                    endDate
                }
            };
        } finally {
            client.release();
        }
    }

    static async getExpensesByMonth(userId: string, year: number): Promise<ExpenseByMonth[]> {
        const client = await pool.connect();

        try {
            const monthlyTotalsQuery = `
        SELECT 
            TO_CHAR(date, 'Month') as "month",
            EXTRACT(MONTH FROM date) as month_num,
            EXTRACT(YEAR FROM date) as "year",
            SUM(amount) as "total"
        FROM expenses
        WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
        GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date), TO_CHAR(date, 'Month')
        ORDER BY month_num
      `;

            const monthlyTotals = await client.query(monthlyTotalsQuery, [userId, year]);

            const results: ExpenseByMonth[] = [];

            for (const monthData of monthlyTotals.rows) {
                const categoryQuery = `
          SELECT 
              c.id as "categoryId",
              c.name as "categoryName",
              SUM(e.amount) as "amount"
          FROM expenses e
          JOIN categories c ON e.category_id = c.id
          WHERE e.user_id = $1 
            AND EXTRACT(YEAR FROM e.date) = $2
            AND EXTRACT(MONTH FROM e.date) = $3
          GROUP BY c.id, c.name
          ORDER BY "amount" DESC
        `;

                const categoryResults = await client.query(categoryQuery, [userId, year, monthData.month_num]);

                const totalByCategory: Record<string, number> = {};
                categoryResults.rows.forEach((cat) => {
                    totalByCategory[cat.categoryName] = parseFloat(cat.amount);
                });

                const topExpensesQuery = `
          SELECT 
              id, amount, description, date, 
              category_id as "categoryId", user_id as "userId",
              created_at as "createdAt", updated_at as "updatedAt"
          FROM expenses
          WHERE user_id = $1 
            AND EXTRACT(YEAR FROM date) = $2
            AND EXTRACT(MONTH FROM date) = $3
          ORDER BY amount DESC
          LIMIT 5
        `;

                const topExpenses = await client.query(topExpensesQuery, [userId, year, monthData.month_num]);

                const topFiveMostExpensive = topExpenses.rows.map((row) => ({
                    ...row,
                    amount: parseFloat(row.amount)
                }));

                results.push({
                    month: monthData.month.trim(),
                    year: parseInt(monthData.year),
                    total: parseFloat(monthData.total),
                    totalByCategory,
                    topFiveMostExpensive
                });
            }

            return results;
        } finally {
            client.release();
        }
    }
}
