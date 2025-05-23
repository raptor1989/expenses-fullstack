import express from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { auth } from '../middlewares/auth.middleware';

const router = express.Router();

// All expense routes require authentication
router.use((req, res, next) => {
    auth(req, res, next);
});

// GET /api/expenses - Get all expenses for the current user
router.get('/', (req, res) => {
    ExpenseController.getExpenses(req, res);
});

// GET /api/expenses/summary - Get expense summary by category
router.get('/summary', (req, res) => {
    ExpenseController.getExpenseSummary(req, res);
});

// GET /api/expenses/:id - Get expense by ID
router.get('/:id', (req, res) => {
    ExpenseController.getExpenseById(req, res);
});

// POST /api/expenses - Create a new expense
router.post('/',(req, res) => {
    ExpenseController.createExpense(req, res);
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', (req, res) => {
    ExpenseController.updateExpense(req, res);
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', (req, res) => {
    ExpenseController.deleteExpense(req, res);
});

export const expenseRoutes = router;
