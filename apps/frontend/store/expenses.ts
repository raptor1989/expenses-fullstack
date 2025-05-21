import { create } from 'zustand';
import { Expense, CreateExpenseDto, UpdateExpenseDto, ExpenseSummary } from 'shared-types';
import { expensesApi } from '../lib/api';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface DateRange {
    startDate: string;
    endDate: string;
}

interface ExpensesState {
    expenses: Expense[];
    summary: ExpenseSummary | null;
    currentExpense: Expense | null;
    isLoading: boolean;
    error: string | null;
    dateRange: DateRange;

    // Actions
    fetchExpenses: () => Promise<void>;
    fetchExpense: (id: string) => Promise<void>;
    createExpense: (expense: CreateExpenseDto) => Promise<void>;
    updateExpense: (id: string, expense: UpdateExpenseDto) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    fetchSummary: () => Promise<void>;
    setDateRange: (range: DateRange) => void;
    setCurrentMonth: () => void;
    setPreviousMonth: () => void;
    resetCurrentExpense: () => void;
}

// Helper to format dates for the API
const formatDateForApi = (date: Date): string => format(date, 'yyyy-MM-dd');

// Default to current month
const today = new Date();
const defaultStartDate = formatDateForApi(startOfMonth(today));
const defaultEndDate = formatDateForApi(endOfMonth(today));

export const useExpensesStore = create<ExpensesState>((set, get) => ({
    expenses: [],
    summary: null,
    currentExpense: null,
    isLoading: false,
    error: null,
    dateRange: {
        startDate: defaultStartDate,
        endDate: defaultEndDate
    },
    fetchExpenses: async () => {
        try {
            set({ isLoading: true, error: null });
            const expenses = await expensesApi.getAll();
            set({ expenses, isLoading: false });
        } catch (error) {
            console.error('Error fetching expenses:', error);
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch expenses. Please try again.'
            });
            throw error;
        }
    },

    fetchExpense: async (id: string) => {
        try {
            set({ isLoading: true, error: null });
            const expense = await expensesApi.getById(id);
            set({ currentExpense: expense, isLoading: false });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch expense'
            });
        }
    },

    createExpense: async (expense: CreateExpenseDto) => {
        try {
            set({ isLoading: true, error: null });
            const newExpense = await expensesApi.create(expense);
            const { expenses } = get();
            set({
                expenses: [newExpense, ...expenses],
                isLoading: false
            });

            // Update summary after adding an expense
            get().fetchSummary();
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to create expense'
            });
            throw error;
        }
    },

    updateExpense: async (id: string, expense: UpdateExpenseDto) => {
        try {
            set({ isLoading: true, error: null });
            const updatedExpense = await expensesApi.update(id, expense);
            const { expenses } = get();
            set({
                expenses: expenses.map((item) => (item.id === id ? updatedExpense : item)),
                currentExpense: null,
                isLoading: false
            });

            // Update summary after updating an expense
            get().fetchSummary();
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to update expense'
            });
            throw error;
        }
    },

    deleteExpense: async (id: string) => {
        try {
            set({ isLoading: true, error: null });
            await expensesApi.delete(id);
            const { expenses } = get();
            set({
                expenses: expenses.filter((expense) => expense.id !== id),
                isLoading: false
            });

            // Update summary after deleting an expense
            get().fetchSummary();
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to delete expense'
            });
        }
    },
    fetchSummary: async () => {
        try {
            const { dateRange } = get();
            set({ isLoading: true, error: null });
            const summary = await expensesApi.getSummary(dateRange.startDate, dateRange.endDate);
            set({ summary, isLoading: false });
        } catch (error) {
            console.error('Error fetching expense summary:', error);
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch expense summary. Please try again.'
            });
            throw error;
        }
    },

    setDateRange: (range: DateRange) => {
        set({ dateRange: range });
        // Fetch new data based on the updated range
        get().fetchSummary();
        get().fetchExpenses();
    },

    setCurrentMonth: () => {
        const currentDate = new Date();
        const startDate = formatDateForApi(startOfMonth(currentDate));
        const endDate = formatDateForApi(endOfMonth(currentDate));

        get().setDateRange({ startDate, endDate });
    },

    setPreviousMonth: () => {
        const currentDate = new Date();
        const prevMonth = subMonths(currentDate, 1);
        const startDate = formatDateForApi(startOfMonth(prevMonth));
        const endDate = formatDateForApi(endOfMonth(prevMonth));

        get().setDateRange({ startDate, endDate });
    },

    resetCurrentExpense: () => {
        set({ currentExpense: null });
    }
}));
