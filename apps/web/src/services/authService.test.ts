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

import { loginUser, registerUser, logoutUser, fetchCurrentUser, updateUserProfile, changePassword } from './authService';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('authService', () => {
    it('loginUser posts email/password and returns the auth response', async () => {
        const authResponse = { user: { id: '1', username: 'u', email: 'e@x.com' } };
        apiMock.post.mockResolvedValue({ data: authResponse });

        const result = await loginUser('e@x.com', 'pw');

        expect(apiMock.post).toHaveBeenCalledWith('/users/login', { email: 'e@x.com', password: 'pw' });
        expect(result).toEqual(authResponse);
    });

    it('registerUser posts the registration payload and returns the auth response', async () => {
        const authResponse = { user: { id: '1', username: 'u', email: 'e@x.com' } };
        apiMock.post.mockResolvedValue({ data: authResponse });
        const userData = { username: 'u', email: 'e@x.com', password: 'pw' };

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
        const user = { id: '1', username: 'u', email: 'e@x.com' };
        apiMock.get.mockResolvedValue({ data: { user } });

        const result = await fetchCurrentUser();

        expect(apiMock.get).toHaveBeenCalledWith('/users/profile', {
            headers: { 'X-Skip-Auth-Redirect': 'true' }
        });
        expect(result).toEqual(user);
    });

    it('updateUserProfile puts the partial user and unwraps the updated user', async () => {
        const user = { id: '1', username: 'u', email: 'e@x.com', firstName: 'New' };
        apiMock.put.mockResolvedValue({ data: { message: 'ok', user } });

        const result = await updateUserProfile({ firstName: 'New' });

        expect(apiMock.put).toHaveBeenCalledWith('/users/profile', { firstName: 'New' });
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
});
