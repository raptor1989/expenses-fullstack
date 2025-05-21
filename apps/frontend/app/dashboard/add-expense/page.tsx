'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { CreateExpenseDto, ExpenseCategory } from 'shared-types';
import { useExpensesStore } from '../../../store/expenses';

export default function AddExpense() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { createExpense } = useExpensesStore();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<CreateExpenseDto>({
        defaultValues: {
            date: new Date().toISOString().split('T')[0] // Set default date to today
        }
    });

    const onSubmit = async (data: CreateExpenseDto) => {
        try {
            setIsSubmitting(true);
            await createExpense(data);
            router.push('/dashboard'); // Redirect to dashboard after successful creation
        } catch (error) {
            console.error('Error creating expense:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Add New Expense</h1>
                <p className="text-gray-600">Record a new household expense</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 gap-6">
                        {/* Title */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                Title
                            </label>
                            <input
                                id="title"
                                type="text"
                                {...register('title', { required: 'Title is required' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                                placeholder="e.g., Grocery Shopping, Electricity Bill"
                            />
                            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
                        </div>

                        {/* Amount */}
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                                Amount ($)
                            </label>
                            <input
                                id="amount"
                                type="number"
                                step="0.01"
                                {...register('amount', {
                                    required: 'Amount is required',
                                    valueAsNumber: true,
                                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                                placeholder="0.00"
                            />
                            {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>}
                        </div>

                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                id="category"
                                {...register('category', { required: 'Category is required' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                            >
                                <option value="">Select a category</option>
                                {Object.values(ExpenseCategory).map((category) => (
                                    <option key={category} value={category}>
                                        {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
                                    </option>
                                ))}
                            </select>
                            {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>}
                        </div>

                        {/* Date */}
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <input
                                id="date"
                                type="date"
                                {...register('date', { required: 'Date is required' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                            />
                            {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description (Optional)
                            </label>
                            <textarea
                                id="description"
                                rows={3}
                                {...register('description')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                                placeholder="Add any additional details about this expense"
                            ></textarea>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition ${
                                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                            >
                                {isSubmitting ? 'Adding...' : 'Add Expense'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="mt-4">
                <button onClick={() => router.back()} className="text-sm text-gray-600 hover:text-gray-900">
                    &larr; Back
                </button>
            </div>
        </div>
    );
}
