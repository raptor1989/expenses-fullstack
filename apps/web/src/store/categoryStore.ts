import { create } from 'zustand';
import { Category } from '@expenses/shared';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/categoryService';

interface CategoryState {
    categories: Category[];
    loading: boolean;
    loaded: boolean;
    fetchCategories: () => Promise<void>;
    addCategory: (name: string, color?: string, icon?: string) => Promise<Category>;
    editCategory: (id: string, name?: string, color?: string, icon?: string) => Promise<Category>;
    removeCategory: (id: string) => Promise<void>;
    reset: () => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
    categories: [],
    loading: false,
    loaded: false,
    fetchCategories: async () => {
        if (get().loaded || get().loading) return;
        set({ loading: true });
        try {
            const categories = await getCategories();
            set({ categories, loaded: true });
        } finally {
            set({ loading: false });
        }
    },
    addCategory: async (name, color, icon) => {
        const category = await createCategory(name, color, icon);
        set((state) => ({ categories: [...state.categories, category] }));
        return category;
    },
    editCategory: async (id, name, color, icon) => {
        const category = await updateCategory(id, name, color, icon);
        set((state) => ({ categories: state.categories.map((c) => (c.id === category.id ? category : c)) }));
        return category;
    },
    removeCategory: async (id) => {
        await deleteCategory(id);
        set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
    },
    reset: () => set({ categories: [], loaded: false, loading: false })
}));
