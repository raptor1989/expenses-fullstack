import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { CategoryController } from '../controllers/category.controller';
import { auth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = express.Router();

router.use((req, res, next) => {
    auth(req, res, next);
});

const categoryBodyValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ max: 100 })
        .withMessage('Name too long'),
    body('color')
        .optional()
        .trim()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Color must be a valid hex color (e.g. #FF5733)'),
    body('icon').optional().trim().isLength({ max: 50 }).withMessage('Icon name too long')
];

const categoryUpdateValidation = [
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Name cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Name too long'),
    body('color')
        .optional()
        .trim()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Color must be a valid hex color (e.g. #FF5733)'),
    body('icon').optional().trim().isLength({ max: 50 }).withMessage('Icon name too long')
];

router.get('/', (req: Request, res: Response) => {
    CategoryController.getCategories(req, res);
});

router.get('/:id', (req: Request, res: Response) => {
    CategoryController.getCategoryById(req, res);
});

router.post('/', categoryBodyValidation, validate, (req: Request, res: Response) => {
    CategoryController.createCategory(req, res);
});

router.put('/:id', categoryUpdateValidation, validate, (req: Request, res: Response) => {
    CategoryController.updateCategory(req, res);
});

router.delete('/:id', (req: Request, res: Response) => {
    CategoryController.deleteCategory(req, res);
});

export const categoryRoutes = router;
