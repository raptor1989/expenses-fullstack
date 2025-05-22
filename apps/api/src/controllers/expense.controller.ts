import { Request, Response } from 'express';
import { ExpenseModel } from '../models/expense.model.js';

export class ExpenseController {
    // Create a new expense
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

    // Get all expenses for the current user
    static async getExpenses(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            // Parse query parameters
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const offset = (page - 1) * limit;

            // Parse date filters
            let startDate: Date | undefined;
            let endDate: Date | undefined;

            if (req.query.startDate) {
                startDate = new Date(req.query.startDate as string);
            }

            if (req.query.endDate) {
                endDate = new Date(req.query.endDate as string);
            }

            // Parse category filter
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

    // Get expense by ID
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

    // Update expense
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

    // Delete expense
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

    // Get expense summary by category
    static async getExpenseSummary(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            // Parse date range
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

            // Get summary
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
}
