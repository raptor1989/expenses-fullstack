import { Request, Response } from 'express';
import { CategoryModel } from '../models/category.model.js';

export class CategoryController {
    // Create a new category
    static async createCategory(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { name, color, icon } = req.body;

            if (!name) {
                return res.status(400).json({
                    message: 'Category name is required',
                    code: 'missing_required_field'
                });
            }

            const category = await CategoryModel.create(req.user.id, name, color, icon);

            res.status(201).json({
                message: 'Category created successfully',
                category
            });
        } catch (error) {
            console.error('Create category error:', error);
            res.status(500).json({
                message: 'Failed to create category',
                code: 'category_creation_failed'
            });
        }
    }

    // Get all categories for the current user
    static async getCategories(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const categories = await CategoryModel.findByUserId(req.user.id);

            res.status(200).json({ categories });
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({
                message: 'Failed to get categories',
                code: 'category_fetch_failed'
            });
        }
    }

    // Get category by ID
    static async getCategoryById(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { id } = req.params;

            const category = await CategoryModel.findById(id, req.user.id);

            if (!category) {
                return res.status(404).json({
                    message: 'Category not found',
                    code: 'category_not_found'
                });
            }

            res.status(200).json({ category });
        } catch (error) {
            console.error('Get category error:', error);
            res.status(500).json({
                message: 'Failed to get category',
                code: 'category_fetch_failed'
            });
        }
    }

    // Update category
    static async updateCategory(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { id } = req.params;
            const { name, color, icon } = req.body;

            const updatedCategory = await CategoryModel.update(id, req.user.id, name, color, icon);

            if (!updatedCategory) {
                return res.status(404).json({
                    message: 'Category not found',
                    code: 'category_not_found'
                });
            }

            res.status(200).json({
                message: 'Category updated successfully',
                category: updatedCategory
            });
        } catch (error) {
            console.error('Update category error:', error);
            res.status(500).json({
                message: 'Failed to update category',
                code: 'category_update_failed'
            });
        }
    }

    // Delete category
    static async deleteCategory(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'Authentication required',
                    code: 'auth_required'
                });
            }

            const { id } = req.params;

            try {
                const deleted = await CategoryModel.delete(id, req.user.id);

                if (!deleted) {
                    return res.status(404).json({
                        message: 'Category not found',
                        code: 'category_not_found'
                    });
                }

                res.status(200).json({
                    message: 'Category deleted successfully'
                });
            } catch (error) {
                if (error instanceof Error && error.message.includes('associated expenses')) {
                    return res.status(400).json({
                        message: 'Cannot delete category with associated expenses',
                        code: 'category_has_expenses'
                    });
                }
                throw error;
            }
        } catch (error) {
            console.error('Delete category error:', error);
            res.status(500).json({
                message: 'Failed to delete category',
                code: 'category_delete_failed'
            });
        }
    }
}
