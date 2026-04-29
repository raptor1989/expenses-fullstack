import { Request, Response } from 'express';
import { ExpenseModel } from '../models/expense.model';

export class ExpenseController {
    static async createExpense(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { amount, description, date, categoryId } = req.body;

            const expense = await ExpenseModel.create(req.user.id, {
                amount,
                description,
                date,
                categoryId
            });

            res.status(201).json({
                message: 'Expense created successfully',
                expense
            });
        } catch (error) {
            console.error('Create expense error:', error);
            res.status(500).json({
                message: 'Failed to create expense',
                code: 'expense_creation_failed'
            });
        }
    }

    static async getExpenses(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 50), 100);
            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const offset = (page - 1) * limit;

            let startDate: Date | undefined;
            let endDate: Date | undefined;

            if (req.query.startDate) {
                startDate = new Date(req.query.startDate as string);
            }

            if (req.query.endDate) {
                endDate = new Date(req.query.endDate as string);
            }

            const categoryId = req.query.categoryId as string | undefined;

            const { expenses, total } = await ExpenseModel.findByUserId(
                req.user.id,
                limit,
                offset,
                startDate,
                endDate,
                categoryId
            );

            res.status(200).json({
                expenses,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get expenses error:', error);
            res.status(500).json({
                message: 'Failed to get expenses',
                code: 'expense_fetch_failed'
            });
        }
    }

    static async getExpenseById(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { id } = req.params;

            const expense = await ExpenseModel.findById(id, req.user.id);

            if (!expense) {
                return res.status(404).json({
                    message: 'Expense not found',
                    code: 'expense_not_found'
                });
            }

            res.status(200).json({ expense });
        } catch (error) {
            console.error('Get expense error:', error);
            res.status(500).json({
                message: 'Failed to get expense',
                code: 'expense_fetch_failed'
            });
        }
    }

    static async updateExpense(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { id } = req.params;
            const { amount, description, date, categoryId } = req.body;

            const updatedExpense = await ExpenseModel.update(id, req.user.id, {
                amount,
                description,
                date,
                categoryId
            });

            if (!updatedExpense) {
                return res.status(404).json({
                    message: 'Expense not found',
                    code: 'expense_not_found'
                });
            }

            res.status(200).json({
                message: 'Expense updated successfully',
                expense: updatedExpense
            });
        } catch (error) {
            console.error('Update expense error:', error);
            res.status(500).json({
                message: 'Failed to update expense',
                code: 'expense_update_failed'
            });
        }
    }

    static async deleteExpense(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { id } = req.params;

            const deleted = await ExpenseModel.delete(id, req.user.id);

            if (!deleted) {
                return res.status(404).json({
                    message: 'Expense not found',
                    code: 'expense_not_found'
                });
            }

            res.status(200).json({
                message: 'Expense deleted successfully'
            });
        } catch (error) {
            console.error('Delete expense error:', error);
            res.status(500).json({
                message: 'Failed to delete expense',
                code: 'expense_delete_failed'
            });
        }
    }

    static async getExpenseSummary(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const startDateStr = req.query.startDate as string;
            const endDateStr = req.query.endDate as string;

            if (!startDateStr || !endDateStr) {
                return res.status(400).json({
                    message: 'Start date and end date are required',
                    code: 'missing_date_range'
                });
            }

            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);

            const summary = await ExpenseModel.getSummaryByCategory(req.user.id, startDate, endDate);

            res.status(200).json({ summary });
        } catch (error) {
            console.error('Get summary error:', error);
            res.status(500).json({
                message: 'Failed to get expense summary',
                code: 'summary_fetch_failed'
            });
        }
    }

    static async getExpensesByMonth(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const yearStr = req.query.year as string;

            if (!yearStr) {
                return res.status(400).json({
                    message: 'Year parameter is required',
                    code: 'missing_year_parameter'
                });
            }

            const year = parseInt(yearStr);

            if (isNaN(year)) {
                return res.status(400).json({
                    message: 'Year must be a valid number',
                    code: 'invalid_year_format'
                });
            }

            const monthlyData = await ExpenseModel.getExpensesByMonth(req.user.id, year);

            res.status(200).json({ monthlyData });
        } catch (error) {
            console.error('Get expenses by month error:', error);
            res.status(500).json({
                message: 'Failed to get expenses by month',
                code: 'monthly_expenses_fetch_failed'
            });
        }
    }
}
