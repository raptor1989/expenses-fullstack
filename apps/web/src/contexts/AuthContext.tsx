import { createContext, useState, useEffect, ReactNode } from 'react';
import { AuthResponse, User } from '@expenses/shared';
import { loginUser, registerUser, fetchCurrentUser } from '../services/authService';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (
        username: string,
        email: string,
        password: string,
        firstName?: string,
        lastName?: string
    ) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => {},
    register: async () => {},
    logout: () => {},
    updateUser: () => {}
});

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if there's a token when the app loads
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');

            if (token) {
                try {
                    const userData = await fetchCurrentUser();
                    setUser(userData);
                } catch (error) {
                    console.error('Auth check failed:', error);
                    localStorage.removeItem('token');
                }
            }

            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await loginUser(email, password);
            setUser(response.user);
            localStorage.setItem('token', response.token);
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (
        username: string,
        email: string,
        password: string,
        firstName?: string,
        lastName?: string
    ) => {
        setIsLoading(true);
        try {
            const response = await registerUser({
                username,
                email,
                password,
                firstName,
                lastName
            });
            setUser(response.user);
            localStorage.setItem('token', response.token);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                updateUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
