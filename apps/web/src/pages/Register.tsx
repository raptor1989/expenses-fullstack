import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button, TextField, Link, Grid, Box, Typography, Alert } from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const validationSchema = yup.object({
    email: yup.string().email('Enter a valid email').required('Email is required'),
    password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm your password')
});

export default function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const formik = useFormik({
        initialValues: { email: '', password: '', confirmPassword: '' },
        validationSchema,
        onSubmit: async (values) => {
            try {
                await register(values.email, values.password);
                navigate('/');
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || 'An error occurred during registration.');
                } else {
                    setError('An error occurred during registration.');
                }
            }
        }
    });

    return (
        <Box sx={{ width: '100%' }}>
            <Typography component="h1" sx={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', mb: 0.5, textAlign: 'center' }}>
                Create account
            </Typography>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', textAlign: 'center', mb: 2.5 }}>
                Start tracking your expenses today
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={formik.handleSubmit}>
                <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth size="small" id="email" label="Email" name="email" autoComplete="email"
                            value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur}
                            error={formik.touched.email && Boolean(formik.errors.email)}
                            helperText={formik.touched.email && formik.errors.email}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth size="small" name="password" label="Password" type="password" id="password" autoComplete="new-password"
                            value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur}
                            error={formik.touched.password && Boolean(formik.errors.password)}
                            helperText={formik.touched.password && formik.errors.password}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth size="small" name="confirmPassword" label="Confirm Password" type="password" id="confirmPassword"
                            value={formik.values.confirmPassword} onChange={formik.handleChange} onBlur={formik.handleBlur}
                            error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                        />
                    </Grid>
                </Grid>
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 2.5, mb: 2 }} disabled={formik.isSubmitting}>
                    Create Account
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                    <Link component={RouterLink} to="/login" variant="body2" sx={{ fontSize: 13 }}>
                        Already have an account? Sign in
                    </Link>
                </Box>
            </Box>
        </Box>
    );
}
