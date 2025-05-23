import { Request, Response } from 'express';
import { BudgetModel } from '../models/budget.model';

export class BudgetController {
    // Create a new budget
    static async createBudget(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { amount, categoryId, startDate, endDate } = req.body;

            // Validate required fields
            if (!amount || !categoryId || !startDate || !endDate) {
                return res.status(400).json({
                    message: 'Missing required fields',
                    code: 'missing_required_fields'
                });
            }

            const parsedStartDate = new Date(startDate);
            const parsedEndDate = new Date(endDate);

            // Validate dates
            if (parsedEndDate <= parsedStartDate) {
                return res.status(400).json({
                    message: 'End date must be after start date',
                    code: 'invalid_date_range'
                });
            }

            const budget = await BudgetModel.create(
                req.user.id,
                parseFloat(amount),
                categoryId,
                parsedStartDate,
                parsedEndDate
            );

            res.status(201).json({
                message: 'Budget created successfully',
                budget
            });
        } catch (error) {
            console.error('Create budget error:', error);
            res.status(500).json({
                message: 'Failed to create budget',
                code: 'budget_creation_failed'
            });
        }
    }

    // Get all budgets for the current user
    static async getBudgets(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const budgets = await BudgetModel.findByUserId(req.user.id);

            res.status(200).json({ budgets });
        } catch (error) {
            console.error('Get budgets error:', error);
            res.status(500).json({
                message: 'Failed to get budgets',
                code: 'budget_fetch_failed'
            });
        }
    }

    // Get budget by ID
    static async getBudgetById(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { id } = req.params;

            const budget = await BudgetModel.findById(id, req.user.id);

            if (!budget) {
                return res.status(404).json({
                    message: 'Budget not found',
                    code: 'budget_not_found'
                });
            }

            res.status(200).json({ budget });
        } catch (error) {
            console.error('Get budget error:', error);
            res.status(500).json({
                message: 'Failed to get budget',
                code: 'budget_fetch_failed'
            });
        }
    }

    // Update budget
    static async updateBudget(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { id } = req.params;
            const { amount, categoryId, startDate, endDate } = req.body;

            // Prepare update data
            const updateData: any = {};

            if (amount !== undefined) {
                updateData.amount = parseFloat(amount);
            }

            if (categoryId !== undefined) {
                updateData.categoryId = categoryId;
            }

            if (startDate !== undefined) {
                updateData.startDate = new Date(startDate);
            }

            if (endDate !== undefined) {
                updateData.endDate = new Date(endDate);
            }

            // Validate dates if both are provided
            if (updateData.startDate && updateData.endDate && updateData.endDate <= updateData.startDate) {
                return res.status(400).json({
                    message: 'End date must be after start date',
                    code: 'invalid_date_range'
                });
            }

            const updatedBudget = await BudgetModel.update(id, req.user.id, updateData);

            if (!updatedBudget) {
                return res.status(404).json({
                    message: 'Budget not found',
                    code: 'budget_not_found'
                });
            }

            res.status(200).json({
                message: 'Budget updated successfully',
                budget: updatedBudget
            });
        } catch (error) {
            console.error('Update budget error:', error);
            res.status(500).json({
                message: 'Failed to update budget',
                code: 'budget_update_failed'
            });
        }
    }

    // Delete budget
    static async deleteBudget(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { id } = req.params;

            const deleted = await BudgetModel.delete(id, req.user.id);

            if (!deleted) {
                return res.status(404).json({
                    message: 'Budget not found',
                    code: 'budget_not_found'
                });
            }

            res.status(200).json({
                message: 'Budget deleted successfully'
            });
        } catch (error) {
            console.error('Delete budget error:', error);
            res.status(500).json({
                message: 'Failed to delete budget',
                code: 'budget_delete_failed'
            });
        }
    }

    // Get budget progress
    static async getBudgetProgress(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { id } = req.params;

            const progress = await BudgetModel.getBudgetProgress(req.user.id, id);

            if (!progress) {
                return res.status(404).json({
                    message: 'Budget not found',
                    code: 'budget_not_found'
                });
            }

            res.status(200).json(progress);
        } catch (error) {
            console.error('Get budget progress error:', error);
            res.status(500).json({
                message: 'Failed to get budget progress',
                code: 'budget_progress_fetch_failed'
            });
        }
    }
}
