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
    loginUser,
    registerUser,
    logoutUser,
    fetchCurrentUser,
    updateUserProfile,
    changePassword,
    forgotPassword,
    resetPassword
} from './authService';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('authService', () => {
    it('loginUser posts email/password and returns the auth response', async () => {
        const authResponse = { user: { id: '1', email: 'e@x.com' } };
        apiMock.post.mockResolvedValue({ data: authResponse });

        const result = await loginUser('e@x.com', 'pw');

        expect(apiMock.post).toHaveBeenCalledWith('/users/login', { email: 'e@x.com', password: 'pw' });
        expect(result).toEqual(authResponse);
    });

    it('registerUser posts the registration payload and returns the auth response', async () => {
        const authResponse = { user: { id: '1', email: 'e@x.com' } };
        apiMock.post.mockResolvedValue({ data: authResponse });
        const userData = { email: 'e@x.com', password: 'pw' };

        const result = await registerUser(userData);

        expect(apiMock.post).toHaveBeenCalledWith('/users/register', userData);
        expect(result).toEqual(authResponse);
    });

    it('logoutUser posts to the logout endpoint', async () => {
        apiMock.post.mockResolvedValue({});

        await logoutUser();

        expect(apiMock.post).toHaveBeenCalledWith('/users/logout');
    });

    it('fetchCurrentUser unwraps the current user', async () => {
        const user = { id: '1', email: 'e@x.com' };
        apiMock.get.mockResolvedValue({ data: { user } });

        const result = await fetchCurrentUser();

        expect(apiMock.get).toHaveBeenCalledWith('/users/session');
        expect(result).toEqual(user);
    });

    it('fetchCurrentUser returns null when there is no active session', async () => {
        apiMock.get.mockResolvedValue({ data: { user: null } });

        const result = await fetchCurrentUser();

        expect(result).toBeNull();
    });

    it('updateUserProfile puts the partial user and unwraps the updated user', async () => {
        const user = { id: '1', email: 'new@x.com' };
        apiMock.put.mockResolvedValue({ data: { message: 'ok', user } });

        const result = await updateUserProfile({ email: 'new@x.com' });

        expect(apiMock.put).toHaveBeenCalledWith('/users/profile', { email: 'new@x.com' });
        expect(result).toEqual(user);
    });

    it('changePassword puts the current and new password', async () => {
        apiMock.put.mockResolvedValue({});

        await changePassword('oldpw', 'newpw');

        expect(apiMock.put).toHaveBeenCalledWith('/users/password', {
            currentPassword: 'oldpw',
            newPassword: 'newpw'
        });
    });

    it('forgotPassword posts the email and returns the message', async () => {
        apiMock.post.mockResolvedValue({ data: { message: 'ok' } });

        const result = await forgotPassword('e@x.com');

        expect(apiMock.post).toHaveBeenCalledWith('/users/forgot-password', { email: 'e@x.com' });
        expect(result).toEqual({ message: 'ok' });
    });

    it('resetPassword posts the token and new password and returns the message', async () => {
        apiMock.post.mockResolvedValue({ data: { message: 'ok' } });

        const result = await resetPassword('sometoken', 'newpw');

        expect(apiMock.post).toHaveBeenCalledWith('/users/reset-password', { token: 'sometoken', newPassword: 'newpw' });
        expect(result).toEqual({ message: 'ok' });
    });
});
