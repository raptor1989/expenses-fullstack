import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button, TextField, Link, Box, Typography, Alert, Grid } from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const validationSchema = yup.object({
    email: yup.string().email('Enter a valid email').required('Email is required'),
    password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required')
});

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const formik = useFormik({
        initialValues: { email: '', password: '' },
        validationSchema,
        onSubmit: async (values) => {
            try {
                await login(values.email, values.password);
                navigate('/');
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || 'An error occurred during login.');
                } else {
                    setError('An error occurred during login.');
                }
            }
        }
    });

    return (
        <Box sx={{ width: '100%' }}>
            <Typography component="h1" sx={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', mb: 0.5, textAlign: 'center' }}>
                Sign in
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'center', mb: 2.5 }}>
                Welcome back to Expense Manager
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={formik.handleSubmit}>
                <TextField
                    margin="dense"
                    fullWidth
                    size="small"
                    id="email"
                    label="Email"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                />
                <TextField
                    margin="dense"
                    fullWidth
                    size="small"
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                />
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 2.5, mb: 2 }} disabled={formik.isSubmitting}>
                    Sign In
                </Button>
                <Grid container sx={{ justifyContent: 'space-between' }}>
                    <Grid size="auto">
                        <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ fontSize: 13 }}>
                            Forgot password?
                        </Link>
                    </Grid>
                    <Grid size="auto">
                        <Link component={RouterLink} to="/register" variant="body2" sx={{ fontSize: 13 }}>
                            Create account
                        </Link>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
