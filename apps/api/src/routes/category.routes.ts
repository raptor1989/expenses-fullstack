import express from 'express';
import { CategoryController } from '../controllers/category.controller';
import { auth } from '../middlewares/auth.middleware';

const router = express.Router();

router.use((req, res, next) => {
    auth(req, res, next);
});

router.get('/', (req, res) => {
    CategoryController.getCategories(req, res);
});

router.get('/:id', (req, res) => {
    CategoryController.getCategoryById(req, res);
});

router.post('/', (req, res) => {
    CategoryController.createCategory(req, res);
});

router.put('/:id', (req, res) => {
    CategoryController.updateCategory(req, res);
});

router.delete('/:id', (req, res) => {
    CategoryController.deleteCategory(req, res);
});

export const categoryRoutes = router;
