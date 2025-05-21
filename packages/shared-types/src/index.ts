/**
 * Types shared between frontend and backend for the expense management system
 */

/**
 * Expense category types
 */
export enum ExpenseCategory {
    GROCERIES = 'groceries',
    UTILITIES = 'utilities',
    RENT = 'rent',
    TRANSPORTATION = 'transportation',
    ENTERTAINMENT = 'entertainment',
    DINING = 'dining',
    HEALTHCARE = 'healthcare',
    EDUCATION = 'education',
    PERSONAL = 'personal',
    OTHER = 'other'
}

/**
 * Expense interface
 */
export interface Expense {
    id: string;
    title: string;
    amount: number;
    category: ExpenseCategory;
    date: string; // ISO string format
    description: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Create expense DTO
 */
export interface CreateExpenseDto {
    title: string;
    amount: number;
    category: ExpenseCategory;
    date: string; // ISO date string
    description?: string;
}

/**
 * Update expense DTO
 */
export interface UpdateExpenseDto {
    title?: string;
    amount?: number;
    category?: ExpenseCategory;
    date?: string; // ISO date string
    description?: string;
}

/**
 * User interface
 */
export interface User {
    id: string;
    username: string;
    email: string;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
}

/**
 * Create user DTO
 */
export interface CreateUserDto {
    username: string;
    email: string;
    password: string;
}

/**
 * Authentication response DTO
 */
export interface AuthResponse {
    user: User;
    token: string;
}

/**
 * Login DTO
 */
export interface LoginDto {
    email: string;
    password: string;
}

/**
 * Expense summary interface
 */
export interface ExpenseSummary {
    totalExpenses: number;
    categorySummary: {
        [key in ExpenseCategory]?: number;
    };
    dateRange: {
        start: string; // ISO date string
        end: string; // ISO date string
    };
}

/**
 * API response interface
 */
export interface ApiResponse<T> {
    status: 'success' | 'error';
    data?: T;
    message?: string;
    errors?: string[];
}
