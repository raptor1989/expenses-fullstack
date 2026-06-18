import { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@expenses/shared';
import { loginUser, registerUser, logoutUser, fetchCurrentUser } from '../services/authService';

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
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
}

// eslint-disable-next-line react-refresh/only-export-components -- context object lives alongside its Provider intentionally
export const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => {},
    register: async () => {},
    logout: async () => {},
    updateUser: () => {}
});

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if there's an active session (cookie) when the app loads
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await fetchCurrentUser();
                setUser(userData);
            } catch {
                // No active session
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await loginUser(email, password);
            setUser(response.user);
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
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
        } finally {
            setUser(null);
        }
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
