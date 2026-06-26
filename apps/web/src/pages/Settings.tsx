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
import { LightMode as LightModeIcon, DarkMode as DarkModeIcon } from '@mui/icons-material';

const ProfileSchema = Yup.object().shape({
    email: Yup.string().trim().email('Valid email is required').required('Email is required')
});

const PasswordSchema = Yup.object().shape({
    currentPassword: Yup.string().required('Current password is required'),
    newPassword: Yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Please confirm the new password')
});

const SectionTitle = ({ children }: { children: string }) => (
    <Typography sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 2.5 }}>
        {children}
    </Typography>
);

export default function Settings() {
    const { user, updateUser } = useAuth();
    const { settings, updateSettings } = useSettings();
    const { mode, setMode } = useThemeMode();
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const notify = (message: string, severity: 'success' | 'error') =>
        setNotification({ open: true, message, severity });

    const handleCurrencyChange = (e: SelectChangeEvent) => {
        updateSettings({ currency: e.target.value as SupportedCurrency })
            .then(() => notify('Currency updated!', 'success'))
            .catch(() => notify('Failed to update currency.', 'error'));
    };

    const handleThemeChange = (newTheme: ThemeMode) => {
        setMode(newTheme);
        updateSettings({ theme: newTheme }).catch(() => notify('Failed to save theme preference.', 'error'));
    };

    return (
        <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', mb: 2.5 }}>Settings</Typography>

            {/* Profile */}
            <Paper variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 3 }}>
                <SectionTitle>Profile</SectionTitle>
                <Formik
                    initialValues={{ email: user?.email || '' }}
                    validationSchema={ProfileSchema}
                    enableReinitialize
                    onSubmit={async (values, { setSubmitting }) => {
                        try {
                            const updated = await updateUserProfile(values);
                            updateUser(updated);
                            notify('Profile updated!', 'success');
                        } catch {
                            notify('Failed to update profile.', 'error');
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ isSubmitting, errors, touched }) => (
                        <Form>
                            <Field name="email">
                                {({ field }: FieldProps) => (
                                    <TextField
                                        {...field}
                                        label="Email"
                                        fullWidth
                                        size="small"
                                        error={touched.email && Boolean(errors.email)}
                                        helperText={touched.email && errors.email}
                                        sx={{ mb: 2 }}
                                    />
                                )}
                            </Field>
                            <Button
                                type="submit"
                                variant="contained"
                                size="small"
                                disabled={isSubmitting}
                                startIcon={isSubmitting ? <CircularProgress size={14} /> : null}
                            >
                                {isSubmitting ? 'Saving…' : 'Save Profile'}
                            </Button>
                        </Form>
                    )}
                </Formik>
            </Paper>

            {/* Change password */}
            <Paper variant="outlined" sx={{ p: 3, mb: 2, borderRadius: 3 }}>
                <SectionTitle>Change Password</SectionTitle>
                <Formik
                    initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
                    validationSchema={PasswordSchema}
                    onSubmit={async (values, { setSubmitting, resetForm }) => {
                        try {
                            await changePassword(values.currentPassword, values.newPassword);
                            resetForm();
                            notify('Password changed!', 'success');
                        } catch {
                            notify('Failed to change password — check your current password.', 'error');
                        } finally {
                            setSubmitting(false);
                        }
                    }}
                >
                    {({ isSubmitting, errors, touched }) => (
                        <Form>
                            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Field name="currentPassword">
                                        {({ field }: FieldProps) => (
                                            <TextField
                                                {...field} type="password" label="Current Password" fullWidth size="small"
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
                                                {...field} type="password" label="New Password" fullWidth size="small"
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
                                                {...field} type="password" label="Confirm Password" fullWidth size="small"
                                                error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                                                helperText={touched.confirmPassword && errors.confirmPassword}
                                            />
                                        )}
                                    </Field>
                                </Grid>
                            </Grid>
                            <Button
                                type="submit" variant="contained" size="small" disabled={isSubmitting}
                                startIcon={isSubmitting ? <CircularProgress size={14} /> : null}
                            >
                                {isSubmitting ? 'Saving…' : 'Change Password'}
                            </Button>
                        </Form>
                    )}
                </Formik>
            </Paper>

            {/* Preferences */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                <SectionTitle>Preferences</SectionTitle>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1, fontWeight: 500 }}>Currency</Typography>
                        <FormControl size="small" fullWidth>
                            <InputLabel>Currency</InputLabel>
                            <Select value={settings.currency} label="Currency" onChange={handleCurrencyChange}>
                                {(SUPPORTED_CURRENCIES as readonly string[]).map((currency: string) => (
                                    <MenuItem key={currency} value={currency}>{currency}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1, fontWeight: 500 }}>Theme</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {(['light', 'dark'] as ThemeMode[]).map((t) => (
                                <Button
                                    key={t}
                                    variant={mode === t ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => handleThemeChange(t)}
                                    startIcon={t === 'light' ? <LightModeIcon sx={{ fontSize: 16 }} /> : <DarkModeIcon sx={{ fontSize: 16 }} />}
                                    color={mode === t ? 'primary' : 'inherit'}
                                    sx={{ textTransform: 'capitalize' }}
                                >
                                    {t}
                                </Button>
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            <Snackbar
                open={notification.open}
                autoHideDuration={5000}
                onClose={() => setNotification((p) => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={notification.severity}>{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
}
