import { Budget } from '@expenses/shared';
import api from './api';

interface BudgetProgress {
    spent: number;
    percentage: number;
    remaining: number;
}

interface BudgetCreateInput {
    categoryId: string;
    amount: number;
    startDate: Date | string;
    endDate: Date | string;
}

export const getBudgets = async (): Promise<Budget[]> => {
    const response = await api.get<{ budgets: Budget[] }>('/budgets');
    return response.data.budgets;
};

export const getBudgetById = async (id: string): Promise<Budget> => {
    const response = await api.get<{ budget: Budget }>(`/budgets/${id}`);
    return response.data.budget;
};

export const createBudget = async (budgetData: BudgetCreateInput): Promise<Budget> => {
    const response = await api.post<{ message: string; budget: Budget }>('/budgets', budgetData);
    return response.data.budget;
};

export const updateBudget = async (id: string, budgetData: Partial<BudgetCreateInput>): Promise<Budget> => {
    const response = await api.put<{ message: string; budget: Budget }>(`/budgets/${id}`, budgetData);
    return response.data.budget;
};

export const deleteBudget = async (id: string): Promise<void> => {
    await api.delete(`/budgets/${id}`);
};

export const getBudgetProgress = async (id: string): Promise<BudgetProgress> => {
    const response = await api.get<{ progress: BudgetProgress }>(`/budgets/${id}/progress`);
    return response.data.progress;
};
