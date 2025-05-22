import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
    FormHelperText,
    FormControl,
    InputLabel,
    Select,
    CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Formik, Form, Field, FieldProps } from 'formik';
import * as Yup from 'yup';
import { Expense, ExpenseCreateInput, Category } from '@expenses/shared';
import dayjs from 'dayjs';

interface ExpenseFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (expense: ExpenseCreateInput) => Promise<void>;
    categories: Category[];
    initialValues?: Expense;
    title?: string;
}

const ExpenseSchema = Yup.object().shape({
    amount: Yup.number()
        .required('Amount is required')
        .positive('Amount must be positive')
        .min(0.01, 'Amount must be at least 0.01'),
    description: Yup.string()
        .required('Description is required')
        .min(3, 'Description is too short')
        .max(100, 'Description is too long'),
    categoryId: Yup.string().required('Category is required'),
    date: Yup.date().required('Date is required').max(new Date(), 'Date cannot be in the future')
});

export default function ExpenseForm({
    open,
    onClose,
    onSubmit,
    categories,
    initialValues,
    title = 'Add Expense'
}: ExpenseFormProps) {
    const today = dayjs();

    const defaultValues: ExpenseCreateInput = {
        amount: 0,
        description: '',
        categoryId: '',
        date: today.format('YYYY-MM-DD')
    };

    const [formValues, setFormValues] = useState<ExpenseCreateInput>(
        initialValues
            ? {
                  amount: initialValues.amount,
                  description: initialValues.description,
                  categoryId: initialValues.categoryId,
                  date: dayjs(initialValues.date).format('YYYY-MM-DD')
              }
            : defaultValues
    );

    useEffect(() => {
        if (initialValues) {
            setFormValues({
                amount: initialValues.amount,
                description: initialValues.description,
                categoryId: initialValues.categoryId,
                date: dayjs(initialValues.date).format('YYYY-MM-DD')
            });
        } else {
            setFormValues(defaultValues);
        }
    }, [initialValues, open]);

    const handleFormSubmit = async (
        values: ExpenseCreateInput,
        { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void; resetForm: () => void }
    ) => {
        try {
            await onSubmit(values);
            resetForm();
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <Formik
                initialValues={formValues}
                validationSchema={ExpenseSchema}
                onSubmit={handleFormSubmit}
                enableReinitialize
            >
                {({ isSubmitting, errors, touched }) => (
                    <Form>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
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

                                <Field name="categoryId">
                                    {({ field, form }: FieldProps) => (
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

                                <Field name="date">
                                    {({ field, form }: FieldProps) => (
                                        <DatePicker
                                            label="Date"
                                            value={dayjs(field.value)}
                                            onChange={(newValue) => {
                                                form.setFieldValue(
                                                    'date',
                                                    newValue ? newValue.format('YYYY-MM-DD') : null
                                                );
                                            }}
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
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isSubmitting}
                                startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                            >
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogActions>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
}
