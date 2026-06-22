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

import {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseSummary,
    getExpensesByMonth
} from './expenseService';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('expenseService', () => {
    it('getExpenses builds the query string from all provided filters', async () => {
        const payload = { expenses: [], pagination: { total: 0, page: 2, limit: 5, totalPages: 0 } };
        apiMock.get.mockResolvedValue({ data: payload });

        const result = await getExpenses(2, 5, '2025-01-01', '2025-01-31', 'cat-1');

        expect(apiMock.get).toHaveBeenCalledWith(
            '/expenses?page=2&limit=5&startDate=2025-01-01&endDate=2025-01-31&categoryId=cat-1'
        );
        expect(result).toEqual(payload);
    });

    it('getExpenses omits optional filters when not provided', async () => {
        apiMock.get.mockResolvedValue({ data: { expenses: [], pagination: {} } });

        await getExpenses();

        expect(apiMock.get).toHaveBeenCalledWith('/expenses?page=1&limit=10');
    });

    it('createExpense posts the input and unwraps the created expense', async () => {
        const expense = {
            id: '1',
            amount: 10,
            description: 'x',
            date: '2025-01-01',
            categoryId: 'c1',
            userId: 'u1',
            createdAt: '',
            updatedAt: ''
        };
        apiMock.post.mockResolvedValue({ data: { message: 'ok', expense } });

        const input = { amount: 10, description: 'x', date: '2025-01-01', categoryId: 'c1' };
        const result = await createExpense(input);

        expect(apiMock.post).toHaveBeenCalledWith('/expenses', input);
        expect(result).toEqual(expense);
    });

    it('updateExpense puts to the expense id and unwraps the updated expense', async () => {
        const expense = {
            id: '1',
            amount: 20,
            description: 'y',
            date: '2025-01-01',
            categoryId: 'c1',
            userId: 'u1',
            createdAt: '',
            updatedAt: ''
        };
        apiMock.put.mockResolvedValue({ data: { message: 'ok', expense } });

        const result = await updateExpense('1', { amount: 20 });

        expect(apiMock.put).toHaveBeenCalledWith('/expenses/1', { amount: 20 });
        expect(result).toEqual(expense);
    });

    it('deleteExpense calls the delete endpoint for the given id', async () => {
        apiMock.delete.mockResolvedValue({});

        await deleteExpense('e1');

        expect(apiMock.delete).toHaveBeenCalledWith('/expenses/e1');
    });

    it('getExpenseSummary sends the date range and unwraps the summary', async () => {
        const summary = { totalAmount: 0, categoryBreakdown: [], period: { startDate: '', endDate: '' } };
        apiMock.get.mockResolvedValue({ data: { summary } });

        const result = await getExpenseSummary('2025-01-01', '2025-01-31');

        expect(apiMock.get).toHaveBeenCalledWith('/expenses/summary?startDate=2025-01-01&endDate=2025-01-31');
        expect(result).toEqual(summary);
    });

    it('getExpensesByMonth sends the year and unwraps monthlyData', async () => {
        const monthlyData = [{ month: 'January', year: 2025, total: 0, totalByCategory: {}, topFiveMostExpensive: [] }];
        apiMock.get.mockResolvedValue({ data: { monthlyData } });

        const result = await getExpensesByMonth(2025);

        expect(apiMock.get).toHaveBeenCalledWith('/expenses/by-month?year=2025');
        expect(result).toEqual(monthlyData);
    });
});
