import { create } from 'zustand';
import { Category } from '@expenses/shared';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/categoryService';

interface CategoryState {
    categories: Category[];
    loading: boolean;
    loaded: boolean;
    fetchCategories: () => Promise<void>;
    refreshCategories: () => Promise<void>;
    addCategory: (name: string, color?: string, icon?: string) => Promise<Category>;
    editCategory: (id: string, name?: string, color?: string, icon?: string) => Promise<Category>;
    removeCategory: (id: string, moveTo?: string) => Promise<void>;
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
    // Unconditional reload (fresh expense counts). Shows the loading state only before the first load,
    // so a refresh of an already rendered list does not flash a spinner.
    refreshCategories: async () => {
        const firstLoad = !get().loaded;
        if (firstLoad) set({ loading: true });
        try {
            const categories = await getCategories();
            set({ categories, loaded: true });
        } finally {
            if (firstLoad) set({ loading: false });
        }
    },
    addCategory: async (name, color, icon) => {
        const category = await createCategory(name, color, icon);
        set((state) => ({ categories: [...state.categories, category] }));
        return category;
    },
    editCategory: async (id, name, color, icon) => {
        const category = await updateCategory(id, name, color, icon);
        // Merge: the update response has no expenseCount, the stored list does.
        set((state) => ({
            categories: state.categories.map((c) => (c.id === category.id ? { ...c, ...category } : c))
        }));
        return category;
    },
    removeCategory: async (id, moveTo) => {
        await deleteCategory(id, moveTo);
        set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
        // The delete already succeeded; a failed count refresh only leaves the target's count stale.
        await get()
            .refreshCategories()
            .catch(() => undefined);
    },
    reset: () => set({ categories: [], loaded: false, loading: false })
}));
