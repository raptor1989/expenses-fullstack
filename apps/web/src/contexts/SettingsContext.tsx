import { createContext, useState, useEffect, ReactNode } from 'react';
import { UserSettings, UserSettingsUpdateInput } from '@expenses/shared';
import { getSettings, updateSettings as updateSettingsApi } from '../services/settingsService';
import { useAuth } from '../hooks/useAuth';
import { useThemeMode } from '../theme/ThemeProvider';

const DEFAULT_SETTINGS: UserSettings = {
    userId: '',
    currency: 'PLN',
    theme: 'light',
    createdAt: new Date(),
    updatedAt: new Date()
};

interface SettingsContextType {
    settings: UserSettings;
    updateSettings: (data: UserSettingsUpdateInput) => Promise<UserSettings>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context object lives alongside its Provider intentionally
export const SettingsContext = createContext<SettingsContextType>({
    settings: DEFAULT_SETTINGS,
    updateSettings: async () => DEFAULT_SETTINGS
});

interface SettingsProviderProps {
    children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
    const { isAuthenticated } = useAuth();
    const { setMode } = useThemeMode();
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        if (!isAuthenticated) {
            setSettings(DEFAULT_SETTINGS);
            return;
        }

        getSettings()
            .then((fetched) => {
                setSettings(fetched);
                setMode(fetched.theme);
            })
            .catch(() => {
                // settings unavailable — fall back to defaults
            });
    }, [isAuthenticated, setMode]);

    const updateSettings = async (data: UserSettingsUpdateInput) => {
        const updated = await updateSettingsApi(data);
        setSettings(updated);
        return updated;
    };

    return <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>;
};
