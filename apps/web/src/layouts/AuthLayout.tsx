import { ReactNode } from 'react';
import { Container, Box, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import {
    Brightness4 as Brightness4Icon,
    Brightness7 as Brightness7Icon,
    PieChart as PieChartIcon
} from '@mui/icons-material';
import { useThemeMode } from '../theme/ThemeProvider';

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    const { mode, toggleColorMode } = useThemeMode();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                bgcolor: 'background.default'
            }}
        >
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
                    <IconButton
                        onClick={toggleColorMode}
                        sx={{
                            color: 'text.secondary',
                            border: '0.5px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            width: 36,
                            height: 36
                        }}
                    >
                        {mode === 'dark' ? (
                            <Brightness7Icon sx={{ fontSize: 18 }} />
                        ) : (
                            <Brightness4Icon sx={{ fontSize: 18 }} />
                        )}
                    </IconButton>
                </Tooltip>
            </Box>

            <Container maxWidth="xs" sx={{ mt: { xs: 8, sm: 12 }, mb: 4 }}>
                {/* Brand */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1.5,
                        mb: 3
                    }}
                >
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2.5,
                            bgcolor: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <PieChartIcon sx={{ fontSize: 24, color: '#fff' }} />
                    </Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>
                        Expense Manager
                    </Typography>
                </Box>

                <Paper
                    variant="outlined"
                    sx={{
                        p: { xs: 3, sm: 4 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRadius: 3
                    }}
                >
                    {children}
                </Paper>
            </Container>
        </Box>
    );
}
