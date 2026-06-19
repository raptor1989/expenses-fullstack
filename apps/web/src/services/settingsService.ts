import { UserSettings, UserSettingsUpdateInput } from '@expenses/shared';
import api from './api';

export const getSettings = async (): Promise<UserSettings> => {
    const response = await api.get<{ settings: UserSettings }>('/settings');
    return response.data.settings;
};

export const updateSettings = async (data: UserSettingsUpdateInput): Promise<UserSettings> => {
    const response = await api.put<{ message: string; settings: UserSettings }>('/settings', data);
    return response.data.settings;
};
