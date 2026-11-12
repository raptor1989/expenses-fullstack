import express, { Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import { ExpenseController } from '../controllers/expense.controller';
import { auth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { apiLimiter } from '../middlewares/rateLimit.middleware';

const router = express.Router();

router.use(apiLimiter);

router.use((req: Request, res: Response, next: NextFunction) => {
    auth(req, res, next);
});

const expenseBodyValidation = [
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ max: 500 })
        .withMessage('Description too long'),
    body('date').isISO8601().withMessage('Date must be a valid ISO 8601 date'),
    body('categoryId')
        .trim()
        .notEmpty()
        .withMessage('Category is required')
        .bail()
        .isUUID()
        .withMessage('Category must be a valid id')
];

const expenseUpdateValidation = [
    body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('description')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Description cannot be empty')
        .isLength({ max: 500 })
        .withMessage('Description too long'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
    body('categoryId')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Category cannot be empty')
        .bail()
        .isUUID()
        .withMessage('Category must be a valid id')
];

const idParamValidation = [param('id').isUUID().withMessage('Invalid expense id')];

const listQueryValidation = [
    query('categoryId').optional().isUUID().withMessage('Category must be a valid id'),
    query('search')
        .optional()
        .custom((value) => typeof value === 'string')
        .withMessage('Search must be a single text value'),
    // Kept in sync by hand with ExpenseSortField / SortOrder in @expenses/shared (types only reach the API).
    query('sort')
        .optional()
        .isIn(['date', 'amount', 'createdAt'])
        .withMessage('Sort must be one of: date, amount, createdAt'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
];

router.get('/', listQueryValidation, validate, (req: Request, res: Response) => {
    ExpenseController.getExpenses(req, res);
});

router.get('/summary', (req: Request, res: Response) => {
    ExpenseController.getExpenseSummary(req, res);
});

router.get('/by-month', (req: Request, res: Response) => {
    ExpenseController.getExpensesByMonth(req, res);
});

router.get('/:id', idParamValidation, validate, (req: Request, res: Response) => {
    ExpenseController.getExpenseById(req, res);
});

router.post('/', expenseBodyValidation, validate, (req: Request, res: Response) => {
    ExpenseController.createExpense(req, res);
});

router.put('/:id', idParamValidation, expenseUpdateValidation, validate, (req: Request, res: Response) => {
    ExpenseController.updateExpense(req, res);
});

router.delete('/:id', idParamValidation, validate, (req: Request, res: Response) => {
    ExpenseController.deleteExpense(req, res);
});

export const expenseRoutes = router;
