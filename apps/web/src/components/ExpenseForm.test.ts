import { describe, it, expect } from 'vitest';
import { ExpenseSchema } from './ExpenseForm';

const validExpense = {
    amount: 12.5,
    description: 'Groceries',
    categoryId: 'cat-1',
    date: '2020-01-01'
};

describe('ExpenseSchema', () => {
    it('accepts a valid expense', async () => {
        await expect(ExpenseSchema.validate(validExpense)).resolves.toBeDefined();
    });

    it('rejects a missing amount', async () => {
        await expect(ExpenseSchema.validate({ ...validExpense, amount: undefined })).rejects.toThrow(
            'Amount is required'
        );
    });

    it('rejects a non-positive amount', async () => {
        await expect(ExpenseSchema.validate({ ...validExpense, amount: 0 })).rejects.toThrow();
    });

    it('rejects a missing categoryId', async () => {
        await expect(ExpenseSchema.validate({ ...validExpense, categoryId: '' })).rejects.toThrow(
            'Category is required'
        );
    });

    it('rejects a description longer than 100 characters', async () => {
        await expect(ExpenseSchema.validate({ ...validExpense, description: 'a'.repeat(101) })).rejects.toThrow(
            'Description is too long'
        );
    });

    it('rejects a date in the future', async () => {
        const future = new Date();
        future.setFullYear(future.getFullYear() + 1);

        await expect(ExpenseSchema.validate({ ...validExpense, date: future })).rejects.toThrow(
            'Date cannot be in the future'
        );
    });
});
