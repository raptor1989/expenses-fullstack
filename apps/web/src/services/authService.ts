import { AuthResponse, User } from '@expenses/shared';
import api from './api';

interface RegisterParams {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/users/login', { email, password });
    return response.data;
};

export const registerUser = async (userData: RegisterParams): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/users/register', userData);
    return response.data;
};

export const fetchCurrentUser = async (): Promise<User> => {
    const response = await api.get<{ user: User }>('/users/profile');
    return response.data.user;
};

export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
    const response = await api.put<{ user: User; message: string }>('/users/profile', userData);
    return response.data.user;
};
