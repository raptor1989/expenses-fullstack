import { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, PaletteMode } from '@mui/material';

// ---------------------------------------------------------------------------
// Design tokens — "dark premium" direction (Linear / Vercel inspired)
// Indigo accent (#6c63ff) on near-black graphite surfaces.
// ---------------------------------------------------------------------------
const ACCENT = '#6c63ff';
const ACCENT_LIGHT = '#8b85ff';
const ACCENT_DARK = '#574fd6';

const getDesignTokens = (mode: PaletteMode) => ({
    palette: {
        mode,
        primary: {
            main: ACCENT,
            light: ACCENT_LIGHT,
            dark: ACCENT_DARK,
            contrastText: '#ffffff'
        },
        secondary: {
            main: '#4ade80',
            light: '#86efac',
            dark: '#22c55e',
            contrastText: '#06210f'
        },
        success: { main: '#4ade80', light: '#86efac', dark: '#22c55e' },
        warning: { main: '#fb923c', light: '#fdba74', dark: '#f97316' },
        error: { main: '#f87171', light: '#fca5a5', dark: '#ef4444' },
        info: { main: '#38bdf8', light: '#7dd3fc', dark: '#0ea5e9' },
        ...(mode === 'light'
            ? {
                  background: {
                      default: '#f7f7f9',
                      paper: '#ffffff'
                  },
                  text: {
                      primary: '#1a1a1f',
                      secondary: '#6e6e78'
                  },
                  divider: 'rgba(0,0,0,0.08)'
              }
            : {
                  // Dark mode — the hero theme
                  background: {
                      default: '#0a0a0b',
                      paper: '#0f0f12'
                  },
                  text: {
                      primary: '#e8e8ea',
                      secondary: '#8a8a94'
                  },
                  divider: 'rgba(255,255,255,0.07)'
              })
    },
    shape: {
        borderRadius: 10
    },
    typography: {
        fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        h1: { fontSize: '2.25rem', fontWeight: 600, letterSpacing: '-0.03em' },
        h2: { fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em' },
        h3: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em' },
        h4: { fontSize: '1.375rem', fontWeight: 600, letterSpacing: '-0.02em' },
        h5: { fontSize: '1.125rem', fontWeight: 600, letterSpacing: '-0.015em' },
        h6: { fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.01em' },
        button: { fontWeight: 500, letterSpacing: 0 }
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                '*::-webkit-scrollbar': { width: 8, height: 8 },
                '*::-webkit-scrollbar-thumb': {
                    backgroundColor: mode === 'light' ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.12)',
                    borderRadius: 8
                },
                '*::-webkit-scrollbar-track': { backgroundColor: 'transparent' }
            }
        },
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: {
                    textTransform: 'none' as const,
                    borderRadius: 8,
                    fontWeight: 500,
                    paddingTop: 7,
                    paddingBottom: 7
                },
                containedPrimary: {
                    '&:hover': { backgroundColor: ACCENT_DARK }
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    border: `0.5px solid ${mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)'}`,
                    backgroundImage: 'none',
                    boxShadow: 'none'
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: { backgroundImage: 'none' },
                outlined: {
                    border: `0.5px solid ${mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)'}`
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: 'none',
                    borderBottom: `0.5px solid ${mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)'}`
                }
            }
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundImage: 'none',
                    borderRight: `0.5px solid ${mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)'}`,
                    backgroundColor: mode === 'light' ? '#ffffff' : '#0f0f12'
                }
            }
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    marginBottom: 1,
                    '&.Mui-selected': {
                        backgroundColor: mode === 'light' ? 'rgba(108,99,255,0.10)' : 'rgba(108,99,255,0.14)',
                        '&:hover': {
                            backgroundColor: mode === 'light' ? 'rgba(108,99,255,0.16)' : 'rgba(108,99,255,0.20)'
                        }
                    }
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: { borderRadius: 8 }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: { borderRadius: 6, fontWeight: 500 }
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottomColor: mode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'
                },
                head: {
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.05em',
                    color: mode === 'light' ? '#6e6e78' : '#8a8a94'
                }
            }
        }
    }
});

// Create context for theme mode
type ThemeContextType = {
    mode: PaletteMode;
    toggleColorMode: () => void;
    setMode: (mode: PaletteMode) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    mode: 'dark',
    toggleColorMode: () => {},
    setMode: () => {}
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
    // Get stored theme preference or default to dark (the hero theme)
    const storedMode = localStorage.getItem('themeMode') as PaletteMode | null;

    const [mode, setMode] = useState<PaletteMode>(storedMode || 'dark');

    // Toggle theme mode
    const toggleColorMode = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', newMode);
            return newMode;
        });
    };

    // Set theme mode directly (e.g. from a saved preference)
    const applyMode = (newMode: PaletteMode) => {
        localStorage.setItem('themeMode', newMode);
        setMode(newMode);
    };

    // Create theme with current mode
    const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

    return (
        <ThemeContext.Provider value={{ mode, toggleColorMode, setMode: applyMode }}>
            <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
