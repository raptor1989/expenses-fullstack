import express from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { auth } from '../middlewares/auth.middleware';

const router = express.Router();

router.use((req, res, next) => {
    auth(req, res, next);
});

router.get('/', (req, res) => {
    ExpenseController.getExpenses(req, res);
});

router.get('/summary', (req, res) => {
    ExpenseController.getExpenseSummary(req, res);
});

router.get('/by-month', (req, res) => {
    ExpenseController.getExpensesByMonth(req, res);
});

router.get('/:id', (req, res) => {
    ExpenseController.getExpenseById(req, res);
});

router.post('/', (req, res) => {
    ExpenseController.createExpense(req, res);
});

router.put('/:id', (req, res) => {
    ExpenseController.updateExpense(req, res);
});

router.delete('/:id', (req, res) => {
    ExpenseController.deleteExpense(req, res);
});

export const expenseRoutes = router;
