export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: Omit<User, 'password'>;
    token?: string;
}

export interface Category {
    id: string;
    name: string;
    color?: string;
    icon?: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Expense {
    id: string;
    amount: number;
    description: string;
    date: Date;
    categoryId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ExpenseCreateInput {
    amount: number;
    description: string;
    date: Date | string;
    categoryId: string;
}

export interface ExpenseUpdateInput {
    amount?: number;
    description?: string;
    date?: Date | string;
    categoryId?: string;
}

export interface ExpenseSummary {
    totalAmount: number;
    categoryBreakdown: Array<{
        categoryId: string;
        categoryName: string;
        totalAmount: number;
        percentage: number;
        color: string;
    }>;
    period: {
        startDate: Date;
        endDate: Date;
    };
}

export interface ApiError {
    message: string;
    code: string;
    details?: Record<string, unknown>;
}

export interface ExpenseByMonth {
    month: string;
    year: number;
    total: number;
    totalByCategory: Record<string, number>;
    topFiveMostExpensive: Expense[];
}

export interface ExpenseByCategory {
    id: string;
    label: string;
    value: number;
    color: string;
}

export const SUPPORTED_CURRENCIES = ['PLN', 'USD', 'EUR', 'GBP'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export type ThemeMode = 'light' | 'dark';

export interface UserSettings {
    userId: string;
    currency: SupportedCurrency;
    theme: ThemeMode;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserSettingsUpdateInput {
    currency?: SupportedCurrency;
    theme?: ThemeMode;
}
