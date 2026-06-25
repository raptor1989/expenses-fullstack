import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Avatar, Button, TextField, Link, Box, Typography, Alert } from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { forgotPassword } from '../services/authService';

// Validation schema
const validationSchema = yup.object({
    email: yup.string().email('Enter a valid email').required('Email is required')
});

export default function ForgotPassword() {
    const [submitted, setSubmitted] = useState(false);

    const formik = useFormik({
        initialValues: {
            email: ''
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            try {
                await forgotPassword(values.email);
            } finally {
                setSubmitted(true);
            }
        }
    });

    if (submitted) {
        return (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
                If that email is registered, a reset link has been logged to the server console.
            </Alert>
        );
    }

    return (
        <>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
                Forgot password
            </Typography>
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
                <TextField
                    margin="normal"
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={formik.isSubmitting}
                >
                    Send reset link
                </Button>
                <Link component={RouterLink} to="/login" variant="body2">
                    Back to sign in
                </Link>
            </Box>
        </>
    );
}
