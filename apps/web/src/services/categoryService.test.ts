import { describe, it, expect, vi, beforeEach } from 'vitest';

const { apiMock } = vi.hoisted(() => ({
    apiMock: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
    }
}));

vi.mock('./api', () => ({ default: apiMock }));

import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from './categoryService';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('categoryService', () => {
    it('getCategories unwraps the categories list', async () => {
        const categories = [{ id: '1', name: 'General', userId: 'u1', createdAt: '', updatedAt: '' }];
        apiMock.get.mockResolvedValue({ data: { categories } });

        const result = await getCategories();

        expect(apiMock.get).toHaveBeenCalledWith('/categories');
        expect(result).toEqual(categories);
    });

    it('getCategoryById fetches by id and unwraps the category', async () => {
        const category = { id: '1', name: 'General', userId: 'u1', createdAt: '', updatedAt: '' };
        apiMock.get.mockResolvedValue({ data: { category } });

        const result = await getCategoryById('1');

        expect(apiMock.get).toHaveBeenCalledWith('/categories/1');
        expect(result).toEqual(category);
    });

    it('createCategory posts name/color/icon and unwraps the created category', async () => {
        const category = {
            id: '1',
            name: 'Fuel',
            color: '#FF0000',
            icon: 'fuel',
            userId: 'u1',
            createdAt: '',
            updatedAt: ''
        };
        apiMock.post.mockResolvedValue({ data: { message: 'ok', category } });

        const result = await createCategory('Fuel', '#FF0000', 'fuel');

        expect(apiMock.post).toHaveBeenCalledWith('/categories', { name: 'Fuel', color: '#FF0000', icon: 'fuel' });
        expect(result).toEqual(category);
    });

    it('updateCategory puts to the category id and unwraps the updated category', async () => {
        const category = { id: '1', name: 'Fuel 2', userId: 'u1', createdAt: '', updatedAt: '' };
        apiMock.put.mockResolvedValue({ data: { message: 'ok', category } });

        const result = await updateCategory('1', 'Fuel 2');

        expect(apiMock.put).toHaveBeenCalledWith('/categories/1', {
            name: 'Fuel 2',
            color: undefined,
            icon: undefined
        });
        expect(result).toEqual(category);
    });

    it('deleteCategory calls the delete endpoint for the given id', async () => {
        apiMock.delete.mockResolvedValue({});

        await deleteCategory('1');

        expect(apiMock.delete).toHaveBeenCalledWith('/categories/1');
    });
});
