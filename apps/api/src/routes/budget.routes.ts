import express from 'express';
import { BudgetController } from '../controllers/budget.controller';
import { auth } from '../middlewares/auth.middleware';

const router = express.Router();

// All budget routes require authentication
router.use((req, res, next) => {
    auth(req, res, next);
});

// GET /api/budgets - Get all budgets for the current user
router.get('/', (req, res) => {
    BudgetController.getBudgets(req, res);
});

// GET /api/budgets/:id - Get budget by ID
router.get('/:id', (req, res) => {
    BudgetController.getBudgetById(req, res);
});

// GET /api/budgets/:id/progress - Get budget progress
router.get('/:id/progress', (req, res) => {
    BudgetController.getBudgetProgress(req, res);
});

// POST /api/budgets - Create a new budget
router.post('/', (req, res) => {
    BudgetController.createBudget(req, res);
});

// PUT /api/budgets/:id - Update budget
router.put('/:id', (req, res) => {
    BudgetController.updateBudget(req, res);
    });

// DELETE /api/budgets/:id - Delete budget
router.delete('/:id', (req, res) => {
  BudgetController.deleteBudget(req, res);
});

export const budgetRoutes = router;