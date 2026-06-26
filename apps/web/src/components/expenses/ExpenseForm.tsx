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
import { Expense, ExpenseCreateInput, Category } from '@expenses/shared';
import dayjs from 'dayjs';
import { ExpenseSchema } from './expenseSchema';

interface ExpenseFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (expense: ExpenseCreateInput) => Promise<void>;
    categories: Category[];
    initialValues?: Expense;
    title?: string;
}

export default function ExpenseForm({ open, onClose, onSubmit, categories, initialValues, title = 'Add Expense' }: ExpenseFormProps) {
    const today = dayjs();

    const defaultValues: ExpenseCreateInput = {
        amount: 0,
        description: '',
        categoryId: '',
        date: today.format('YYYY-MM-DD')
    };

    const [formValues, setFormValues] = useState<ExpenseCreateInput>(
        initialValues
            ? { amount: initialValues.amount, description: initialValues.description, categoryId: initialValues.categoryId, date: dayjs(initialValues.date).format('YYYY-MM-DD') }
            : defaultValues
    );

    useEffect(() => {
        if (initialValues) {
            setFormValues({ amount: initialValues.amount, description: initialValues.description, categoryId: initialValues.categoryId, date: dayjs(initialValues.date).format('YYYY-MM-DD') });
        } else {
            setFormValues(defaultValues);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialValues, open]);

    const handleFormSubmit = async (
        values: ExpenseCreateInput,
        { setSubmitting, resetForm }: { setSubmitting: (v: boolean) => void; resetForm: () => void }
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
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            slotProps={{ paper: { variant: 'outlined', sx: { borderRadius: 3 } } }}
        >
            <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>{title}</DialogTitle>
            <Formik initialValues={formValues} validationSchema={ExpenseSchema} onSubmit={handleFormSubmit} enableReinitialize>
                {({ isSubmitting, errors, touched }) => (
                    <Form>
                        <DialogContent sx={{ pt: '12px !important' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Field name="date">
                                    {({ field, form }: FieldProps) => (
                                        <DatePicker
                                            label="Date"
                                            value={dayjs(field.value)}
                                            onChange={(v) => form.setFieldValue('date', v ? v.format('YYYY-MM-DD') : null)}
                                            format="DD.MM.YYYY"
                                            disableFuture
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    size: 'small',
                                                    error: touched.date && Boolean(errors.date),
                                                    helperText: touched.date && (errors.date as string)
                                                }
                                            }}
                                        />
                                    )}
                                </Field>

                                <Field name="categoryId">
                                    {({ field }: FieldProps) => (
                                        <FormControl fullWidth size="small" error={touched.categoryId && Boolean(errors.categoryId)}>
                                            <InputLabel>Category</InputLabel>
                                            <Select {...field} label="Category">
                                                {categories.map((cat) => (
                                                    <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
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
                                            fullWidth
                                            size="small"
                                            error={touched.amount && Boolean(errors.amount)}
                                            helperText={touched.amount && errors.amount}
                                            onChange={(e) => {
                                                const v = parseFloat(e.target.value);
                                                form.setFieldValue('amount', isNaN(v) ? '' : v);
                                            }}
                                            slotProps={{ htmlInput: { step: 0.01, min: 0 } }}
                                        />
                                    )}
                                </Field>

                                <Field name="description">
                                    {({ field }: FieldProps) => (
                                        <TextField
                                            {...field}
                                            label="Description"
                                            fullWidth
                                            size="small"
                                            error={touched.description && Boolean(errors.description)}
                                            helperText={touched.description && errors.description}
                                        />
                                    )}
                                </Field>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2.5 }}>
                            <Button onClick={onClose} disabled={isSubmitting} size="small">Cancel</Button>
                            <Button
                                type="submit"
                                variant="contained"
                                size="small"
                                disabled={isSubmitting}
                                startIcon={isSubmitting ? <CircularProgress size={14} /> : null}
                            >
                                {isSubmitting ? 'Saving…' : 'Save'}
                            </Button>
                        </DialogActions>
                    </Form>
                )}
            </Formik>
        </Dialog>
    );
}
