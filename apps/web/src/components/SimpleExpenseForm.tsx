import { Category, ExpenseCreateInput } from '@expenses/shared';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    TextField,
    Button,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { Formik, Field, FieldProps, Form } from 'formik';
import { ExpenseSchema } from './ExpenseForm';
import { useState } from 'react';
import { createExpense } from '@/services/expenseService';

interface SimpleExpenseFormProps {
    categories: Category[];
}

const SimpleExpenseForm = ({ categories }: SimpleExpenseFormProps) => {
    const today = dayjs();

    const defaultValues: ExpenseCreateInput = {
        amount: 0,
        description: '',
        categoryId: '',
        date: today.format('YYYY-MM-DD')
    };

    const [formValues, _setFormValues] = useState<ExpenseCreateInput>(defaultValues);
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });

    const handleFormSubmit = async (
        values: ExpenseCreateInput,
        { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }
    ) => {
        try {
            await createExpense(values);
            setNotification({
                open: true,
                message: 'Expense added successfully!',
                severity: 'success'
            });
            resetForm();
        } catch (error) {
            setNotification({
                open: true,
                message: 'Failed to create expense. Please try again.',
                severity: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseNotification = () => {
        setNotification((prev) => ({ ...prev, open: false }));
    };

    return (
        <Formik
            initialValues={formValues}
            validationSchema={ExpenseSchema}
            onSubmit={handleFormSubmit}
            enableReinitialize
        >
            {({ isSubmitting, errors, touched }) => (
                <Form>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, pb: 2 }}>
                        <Field name="date">
                            {({ field, form }: FieldProps) => (
                                <DatePicker
                                    label="Date"
                                    value={dayjs(field.value)}
                                    onChange={(newValue) => {
                                        form.setFieldValue('date', newValue ? newValue.format('YYYY-MM-DD') : null);
                                    }}
                                    format="DD.MM.YYYY"
                                    disableFuture
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            error: touched.date && Boolean(errors.date),
                                            helperText: touched.date && (errors.date as string)
                                        }
                                    }}
                                />
                            )}
                        </Field>

                        <Field name="categoryId">
                            {({ field }: FieldProps) => (
                                <FormControl fullWidth error={touched.categoryId && Boolean(errors.categoryId)}>
                                    <InputLabel id="category-label">Category</InputLabel>
                                    <Select {...field} labelId="category-label" label="Category">
                                        {categories.map((category) => (
                                            <MenuItem key={category.id} value={category.id}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {touched.categoryId && errors.categoryId && (
                                        <FormHelperText>{errors.categoryId as string}</FormHelperText>
                                    )}
                                </FormControl>
                            )}
                        </Field>

                        <Field name="amount">
                            {({ field, form }: FieldProps) => (
                                <TextField
                                    {...field}
                                    label="Amount"
                                    type="number"
                                    inputProps={{
                                        step: 0.01,
                                        min: 0
                                    }}
                                    fullWidth
                                    error={touched.amount && Boolean(errors.amount)}
                                    helperText={touched.amount && errors.amount}
                                    onChange={(e) => {
                                        const value = parseFloat(e.target.value);
                                        form.setFieldValue('amount', isNaN(value) ? '' : value);
                                    }}
                                />
                            )}
                        </Field>

                        <Field name="description">
                            {({ field }: FieldProps) => (
                                <TextField
                                    {...field}
                                    label="Description"
                                    fullWidth
                                    error={touched.description && Boolean(errors.description)}
                                    helperText={touched.description && errors.description}
                                />
                            )}
                        </Field>
                    </Box>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                    >
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                    {/* Notification Snackbar */}
                    <Snackbar
                        open={notification.open}
                        autoHideDuration={5000}
                        onClose={handleCloseNotification}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    >
                        <Alert
                            onClose={handleCloseNotification}
                            severity={notification.severity}
                            sx={{ width: '100%' }}
                        >
                            {notification.message}
                        </Alert>
                    </Snackbar>
                </Form>
            )}
        </Formik>
    );
};

export default SimpleExpenseForm;
