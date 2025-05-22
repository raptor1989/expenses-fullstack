import { Expense, ExpenseCreateInput, ExpenseUpdateInput, ExpenseSummary } from '@expenses/shared';
import api from './api';

interface ExpensesResponse {
    expenses: Expense[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const getExpenses = async (
    page = 1,
    limit = 10,
    startDate?: string,
    endDate?: string,
    categoryId?: string
): Promise<ExpensesResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (categoryId) params.append('categoryId', categoryId);

    const response = await api.get<ExpensesResponse>(`/expenses?${params.toString()}`);
    return response.data;
};

export const getExpenseById = async (id: string): Promise<Expense> => {
    const response = await api.get<{ expense: Expense }>(`/expenses/${id}`);
    return response.data.expense;
};

export const createExpense = async (expense: ExpenseCreateInput): Promise<Expense> => {
    const response = await api.post<{ message: string; expense: Expense }>('/expenses', expense);
    return response.data.expense;
};

export const updateExpense = async (id: string, expense: ExpenseUpdateInput): Promise<Expense> => {
    const response = await api.put<{ message: string; expense: Expense }>(`/expenses/${id}`, expense);
    return response.data.expense;
};

export const deleteExpense = async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
};

export const getExpenseSummary = async (startDate: string, endDate: string): Promise<ExpenseSummary> => {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);

    const response = await api.get<{ summary: ExpenseSummary }>(`/expenses/summary?${params.toString()}`);
    return response.data.summary;
};
