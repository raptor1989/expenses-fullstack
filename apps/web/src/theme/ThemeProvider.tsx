import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, PaletteMode } from '@mui/material';

// Define theme colors and settings
const getDesignTokens = (mode: PaletteMode) => ({
    palette: {
        mode,
        primary: {
            main: '#2e7d32', // green[800]
            light: '#4caf50', // green[500]
            dark: '#1b5e20', // green[900]
            contrastText: '#ffffff'
        },
        secondary: {
            main: '#f50057',
            light: '#ff4081',
            dark: '#c51162',
            contrastText: '#ffffff'
        },
        ...(mode === 'light'
            ? {
                  // Light mode colors
                  background: {
                      default: '#f5f5f5',
                      paper: '#ffffff'
                  },
                  text: {
                      primary: '#333333',
                      secondary: '#666666'
                  }
              }
            : {
                  // Dark mode colors
                  background: {
                      default: '#121212',
                      paper: '#1e1e1e'
                  },
                  text: {
                      primary: '#e0e0e0',
                      secondary: '#a0a0a0'
                  }
              })
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 500
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 500
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 500
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 500
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 500
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 500
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none' as const,
                    borderRadius: 8
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: mode === 'light' ? '0px 2px 4px rgba(0,0,0,0.1)' : '0px 2px 4px rgba(0,0,0,0.3)'
                }
            }
        }
    }
});

// Create context for theme mode
type ThemeContextType = {
    mode: PaletteMode;
    toggleColorMode: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
    mode: 'light',
    toggleColorMode: () => {}
});

// Custom hook to use theme context
export const useThemeMode = () => {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error('useThemeMode must be used within a ThemeProvider');
    }

    return context;
};

// Theme provider component
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    // Get stored theme preference or system preference
    const storedMode = localStorage.getItem('themeMode') as PaletteMode | null;
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const [mode, setMode] = useState<PaletteMode>(storedMode || (prefersDarkMode ? 'dark' : 'light'));

    // Toggle theme mode
    const toggleColorMode = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', newMode);
            return newMode;
        });
    };

    // Create theme with current mode
    const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

    return (
        <ThemeContext.Provider value={{ mode, toggleColorMode }}>
            <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
