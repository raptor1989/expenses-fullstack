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

import { getSettings, updateSettings } from './settingsService';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('settingsService', () => {
    it('getSettings unwraps the settings object', async () => {
        const settings = { userId: 'u1', currency: 'PLN', theme: 'light', createdAt: '', updatedAt: '' };
        apiMock.get.mockResolvedValue({ data: { settings } });

        const result = await getSettings();

        expect(apiMock.get).toHaveBeenCalledWith('/settings');
        expect(result).toEqual(settings);
    });

    it('updateSettings puts the partial settings and unwraps the updated settings', async () => {
        const settings = { userId: 'u1', currency: 'USD', theme: 'dark', createdAt: '', updatedAt: '' };
        apiMock.put.mockResolvedValue({ data: { message: 'ok', settings } });

        const result = await updateSettings({ currency: 'USD', theme: 'dark' });

        expect(apiMock.put).toHaveBeenCalledWith('/settings', { currency: 'USD', theme: 'dark' });
        expect(result).toEqual(settings);
    });
});
