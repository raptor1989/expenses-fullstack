import { ReactNode } from 'react';
import { Container, Box, Paper, Typography, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Brightness4 as Brightness4Icon, Brightness7 as Brightness7Icon } from '@mui/icons-material';
import { useThemeMode } from '../theme/ThemeProvider';

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    const theme = useTheme();
    const { mode, toggleColorMode } = useThemeMode();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.900'
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16
                }}
            >
                <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
                    {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
            </Box>

            <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRadius: 2
                    }}
                >
                    <Typography component="h1" variant="h4" color="primary" sx={{ mb: 2 }}>
                        Expense Manager
                    </Typography>
                    {children}
                </Paper>
            </Container>
        </Box>
    );
}
