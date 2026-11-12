import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import { getApiErrorMessage, getApiFieldErrors } from './api';

function apiError(status: number, data: unknown): AxiosError {
    const config = { headers: new AxiosHeaders() };
    const response = { status, statusText: '', headers: {}, config, data } as AxiosResponse;
    return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response);
}

describe('getApiErrorMessage', () => {
    it('returns the detail messages of a 4xx validation error', () => {
        const error = apiError(400, {
            message: 'Validation failed',
            code: 'validation_error',
            details: { amount: 'Amount must be a positive number', categoryId: 'Category not found' }
        });

        expect(getApiErrorMessage(error, 'fallback')).toBe('Amount must be a positive number; Category not found');
    });

    it('returns the message of a 4xx business error without details', () => {
        const error = apiError(400, {
            message: 'Cannot delete category with associated expenses',
            code: 'category_has_expenses'
        });

        expect(getApiErrorMessage(error, 'fallback')).toBe('Cannot delete category with associated expenses');
    });

    it('returns the fallback for a 5xx response', () => {
        const error = apiError(500, { message: 'Failed to create expense', code: 'expense_creation_failed' });

        expect(getApiErrorMessage(error, 'Failed to create expense.')).toBe('Failed to create expense.');
    });

    it('returns the fallback when there is no response (network failure)', () => {
        const error = new AxiosError('Network Error', 'ERR_NETWORK');

        expect(getApiErrorMessage(error, 'Failed to save.')).toBe('Failed to save.');
    });

    it('returns the fallback for a non-axios error', () => {
        expect(getApiErrorMessage(new Error('boom'), 'Failed to save.')).toBe('Failed to save.');
    });

    it('returns the fallback for a 4xx without a usable body', () => {
        expect(getApiErrorMessage(apiError(404, '<html>'), 'fallback')).toBe('fallback');
    });
});

describe('getApiFieldErrors', () => {
    it('maps 400 details to field errors', () => {
        const error = apiError(400, {
            message: 'Validation failed',
            code: 'validation_error',
            details: { email: 'Valid email is required' }
        });

        expect(getApiFieldErrors(error)).toEqual({ email: 'Valid email is required' });
    });

    it('returns no field errors for a 400 without details', () => {
        expect(getApiFieldErrors(apiError(400, { message: 'x', code: 'email_in_use' }))).toEqual({});
    });

    it('returns no field errors for other statuses or errors', () => {
        expect(getApiFieldErrors(apiError(409, { message: 'x', details: { a: 'b' } }))).toEqual({});
        expect(getApiFieldErrors(apiError(500, { message: 'x', details: { a: 'b' } }))).toEqual({});
        expect(getApiFieldErrors(new Error('boom'))).toEqual({});
    });
});
