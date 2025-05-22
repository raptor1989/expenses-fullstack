import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './theme/ThemeProvider';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <CssBaseline />
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </LocalizationProvider>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>
);
