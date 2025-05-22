import { Category } from '@expenses/shared';
import api from './api';

export const getCategories = async (): Promise<Category[]> => {
    const response = await api.get<{ categories: Category[] }>('/categories');
    return response.data.categories;
};

export const getCategoryById = async (id: string): Promise<Category> => {
    const response = await api.get<{ category: Category }>(`/categories/${id}`);
    return response.data.category;
};

export const createCategory = async (name: string, color?: string, icon?: string): Promise<Category> => {
    const response = await api.post<{ message: string; category: Category }>('/categories', { name, color, icon });
    return response.data.category;
};

export const updateCategory = async (id: string, name?: string, color?: string, icon?: string): Promise<Category> => {
    const response = await api.put<{ message: string; category: Category }>(`/categories/${id}`, { name, color, icon });
    return response.data.category;
};

export const deleteCategory = async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
};
