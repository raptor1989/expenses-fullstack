import * as Yup from 'yup';

export const ExpenseSchema = Yup.object().shape({
    amount: Yup.number()
        .required('Amount is required')
        .positive('Amount must be positive')
        .min(0.01, 'Amount must be at least 0.01'),
    description: Yup.string().max(100, 'Description is too long'),
    categoryId: Yup.string().required('Category is required'),
    date: Yup.date().required('Date is required').max(new Date(), 'Date cannot be in the future')
});
