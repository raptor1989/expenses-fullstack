import { create } from 'zustand';
import { User, AuthResponse, LoginDto } from 'shared-types';
import { authApi } from '../lib/api';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: LoginDto) => Promise<void>;
    register: (userData: { username: string; email: string; password: string }) => Promise<void>;
    logout: () => void;
    initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (credentials) => {
        try {
            set({ isLoading: true, error: null });
            const response: AuthResponse = await authApi.login(credentials);

            // Store token and user in localStorage for persistence
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
            }

            set({
                user: response.user,
                token: response.token,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Authentication failed'
            });
            throw error;
        }
    },

    register: async (userData) => {
        try {
            set({ isLoading: true, error: null });
            const response: AuthResponse = await authApi.register(userData);

            // Store token and user in localStorage for persistence
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
            }

            set({
                user: response.user,
                token: response.token,
                isAuthenticated: true,
                isLoading: false
            });
        } catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Registration failed'
            });
            throw error;
        }
    },

    logout: () => {
        authApi.logout();
        set({
            user: null,
            token: null,
            isAuthenticated: false
        });
    },

    initAuth: () => {
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr) as User;
                set({ user, token, isAuthenticated: true });
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }
}));
