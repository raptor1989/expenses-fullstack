import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    Select,
    SelectChangeEvent,
    MenuItem,
    FormControl,
    InputLabel,
    ToggleButtonGroup,
    ToggleButton,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import { Formik, Form, Field, FieldProps } from 'formik';
import * as Yup from 'yup';
import { SUPPORTED_CURRENCIES, SupportedCurrency, ThemeMode } from '@expenses/shared';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useThemeMode } from '@/theme/ThemeProvider';
import { updateUserProfile, changePassword } from '@/services/authService';

const ProfileSchema = Yup.object().shape({
    email: Yup.string().trim().email('Valid email is required').required('Email is required'),
    firstName: Yup.string().max(100, 'First name too long'),
    lastName: Yup.string().max(100, 'Last name too long')
});

const PasswordSchema = Yup.object().shape({
    currentPassword: Yup.string().required('Current password is required'),
    newPassword: Yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Please confirm the new password')
});

export default function Settings() {
    const { user, updateUser } = useAuth();
    const { settings, updateSettings } = useSettings();
    const { setMode } = useThemeMode();
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });

    const showNotification = (message: string, severity: 'success' | 'error') => {
        setNotification({ open: true, message, severity });
    };

    const handleCurrencyChange = (e: SelectChangeEvent) => {
        updateSettings({ currency: e.target.value as SupportedCurrency })
            .then(() => showNotification('Currency updated!', 'success'))
            .catch(() => showNotification('Failed to update currency.', 'error'));
    };

    const handleThemeChange = (_: React.MouseEvent<HTMLElement>, newTheme: ThemeMode | null) => {
        if (!newTheme) return;
        setMode(newTheme);
        updateSettings({ theme: newTheme }).catch(() => showNotification('Failed to save theme preference.', 'error'));
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Settings
            </Typography>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Profile
                </Typography>
                <Formik
                    initialValues={{
                        email: user?.email || '',
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || ''
                    }}
                    validationSchema={ProfileSchema}
                    enableReinitialize
                    onSubmit={async (values, { setSubmitting }) => {
                        try {
                            const updatedUser = await updateUserProfile(values);
                            updateUser(updatedUser);
                            showNotification('Profile updated successfully!', 'success');
                        } catch {
                            showNotification('Failed to update profile.', 'error');
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ isSubmitting, errors, touched }) => (
                        <Form>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Field name="email">
                                        {({ field }: FieldProps) => (
                                            <TextField
                                                {...field}
                                                label="Email"
                                                fullWidth
                                                error={touched.email && Boolean(errors.email)}
                                                helperText={touched.email && errors.email}
                                            />
                                        )}
                                    </Field>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Field name="firstName">
                                        {({ field }: FieldProps) => (
                                            <TextField
                                                {...field}
                                                label="First Name"
                                                fullWidth
                                                error={touched.firstName && Boolean(errors.firstName)}
                                                helperText={touched.firstName && errors.firstName}
                                            />
                                        )}
                                    </Field>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Field name="lastName">
                                        {({ field }: FieldProps) => (
                                            <TextField
                                                {...field}
                                                label="Last Name"
                                                fullWidth
                                                error={touched.lastName && Boolean(errors.lastName)}
                                                helperText={touched.lastName && errors.lastName}
                                            />
                                        )}
                                    </Field>
                                </Grid>
                            </Grid>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{ mt: 2 }}
                                disabled={isSubmitting}
                                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                            >
                                {isSubmitting ? 'Saving...' : 'Save Profile'}
                            </Button>
                        </Form>
                    )}
                </Formik>
            </Paper>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Change Password
                </Typography>
                <Formik
                    initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
                    validationSchema={PasswordSchema}
                    onSubmit={async (values, { setSubmitting, resetForm }) => {
                        try {
                            await changePassword(values.currentPassword, values.newPassword);
                            resetForm();
                            showNotification('Password changed successfully!', 'success');
                        } catch {
                            showNotification('Failed to change password. Check your current password.', 'error');
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ isSubmitting, errors, touched }) => (
                        <Form>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Field name="currentPassword">
                                        {({ field }: FieldProps) => (
                                            <TextField
                                                {...field}
                                                type="password"
                                                label="Current Password"
                                                fullWidth
                                                error={touched.currentPassword && Boolean(errors.currentPassword)}
                                                helperText={touched.currentPassword && errors.currentPassword}
                                            />
                                        )}
                                    </Field>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Field name="newPassword">
                                        {({ field }: FieldProps) => (
                                            <TextField
                                                {...field}
                                                type="password"
                                                label="New Password"
                                                fullWidth
                                                error={touched.newPassword && Boolean(errors.newPassword)}
                                                helperText={touched.newPassword && errors.newPassword}
                                            />
                                        )}
                                    </Field>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Field name="confirmPassword">
                                        {({ field }: FieldProps) => (
                                            <TextField
                                                {...field}
                                                type="password"
                                                label="Confirm New Password"
                                                fullWidth
                                                error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                                                helperText={touched.confirmPassword && errors.confirmPassword}
                                            />
                                        )}
                                    </Field>
                                </Grid>
                            </Grid>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{ mt: 2 }}
                                disabled={isSubmitting}
                                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                            >
                                {isSubmitting ? 'Saving...' : 'Change Password'}
                            </Button>
                        </Form>
                    )}
                </Formik>
            </Paper>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Preferences
                </Typography>
                <Grid container spacing={3} sx={{
                    alignItems: "center"
                }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel id="currency-label">Currency</InputLabel>
                            <Select
                                labelId="currency-label"
                                name="currency"
                                label="Currency"
                                value={settings.currency}
                                onChange={handleCurrencyChange}
                            >
                                {SUPPORTED_CURRENCIES.map((currency) => (
                                    <MenuItem key={currency} value={currency}>
                                        {currency}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <ToggleButtonGroup value={settings.theme} exclusive onChange={handleThemeChange}>
                            <ToggleButton value="light">Light</ToggleButton>
                            <ToggleButton value="dark">Dark</ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                </Grid>
            </Paper>
            <Snackbar
                open={notification.open}
                autoHideDuration={5000}
                onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
