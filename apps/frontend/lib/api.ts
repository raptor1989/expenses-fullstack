import axios from 'axios';
import {
    ApiResponse,
    AuthResponse,
    CreateExpenseDto,
    Expense,
    ExpenseSummary,
    LoginDto,
    UpdateExpenseDto
} from 'shared-types';

// Create axios instance with the base URL
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
});

// Add interceptor to include auth token in requests
api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Auth API endpoints
export const authApi = {
    login: async (credentials: LoginDto): Promise<AuthResponse> => {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
        return response.data.data as AuthResponse;
    },

    register: async (userData: { username: string; email: string; password: string }): Promise<AuthResponse> => {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', userData);
        return response.data.data as AuthResponse;
    },

    logout: (): void => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

// Expenses API endpoints
export const expensesApi = {
    getAll: async (): Promise<Expense[]> => {
        const response = await api.get<ApiResponse<Expense[]>>('/expenses');
        return response.data.data || [];
    },

    getById: async (id: string): Promise<Expense> => {
        const response = await api.get<ApiResponse<Expense>>(`/expenses/${id}`);
        return response.data.data as Expense;
    },

    create: async (expense: CreateExpenseDto): Promise<Expense> => {
        const response = await api.post<ApiResponse<Expense>>('/expenses', expense);
        return response.data.data as Expense;
    },

    update: async (id: string, expense: UpdateExpenseDto): Promise<Expense> => {
        const response = await api.patch<ApiResponse<Expense>>(`/expenses/${id}`, expense);
        return response.data.data as Expense;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete<ApiResponse<null>>(`/expenses/${id}`);
    },

    getSummary: async (startDate: string, endDate: string): Promise<ExpenseSummary> => {
        const response = await api.get<ApiResponse<ExpenseSummary>>('/expenses/summary', {
            params: { startDate, endDate }
        });
        return response.data.data as ExpenseSummary;
    }
};

export default api;
