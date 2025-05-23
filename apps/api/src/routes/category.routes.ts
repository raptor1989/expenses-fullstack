import express from 'express';
import { CategoryController } from '../controllers/category.controller';
import { auth } from '../middlewares/auth.middleware';

const router = express.Router();

// All category routes require authentication
router.use((req, res, next) => {
    auth(req, res, next);
});

// GET /api/categories - Get all categories for the current user
router.get('/', (req, res) => {
    CategoryController.getCategories(req, res);
});

// GET /api/categories/:id - Get category by ID
router.get('/:id', (req, res) => {
    CategoryController.getCategoryById(req, res);
});

// POST /api/categories - Create a new category
router.post('/', (req, res) => {
    CategoryController.createCategory(req, res);
});

// PUT /api/categories/:id - Update category
router.put('/:id', (req, res) => {
    CategoryController.updateCategory(req, res);
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', (req, res) => {
    CategoryController.deleteCategory(req, res);
});

export const categoryRoutes = router;
