'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { UpdateExpenseDto, ExpenseCategory } from 'shared-types';
import { useExpensesStore } from '@/store/expenses';

type EditExpenseParams = {
    id: string;
}

export default function EditExpense() {
    const router = useRouter();
    const { id } = useParams<EditExpenseParams>();
    const [isLoading, setIsLoading] = useState(true);
    const { currentExpense, fetchExpense, updateExpense } = useExpensesStore();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<UpdateExpenseDto>();

    useEffect(() => {
        const loadExpense = async () => {
            try {
                await fetchExpense(id);
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading expense:', error);
                router.push('/dashboard/expenses');
            }
        };

        loadExpense();
    }, [id, fetchExpense, router]);

    useEffect(() => {
        if (currentExpense) {
            // Format the date to YYYY-MM-DD for the input
            const formattedDate = new Date(currentExpense.date).toISOString().split('T')[0];

            reset({
                title: currentExpense.title,
                amount: currentExpense.amount,
                category: currentExpense.category,
                date: formattedDate,
                description: currentExpense.description
            });
        }
    }, [currentExpense, reset]);

    const onSubmit = async (data: UpdateExpenseDto) => {
        try {
            setIsLoading(true);
            await updateExpense(id, data);
            router.push('/dashboard/expenses');
        } catch (error) {
            console.error('Error updating expense:', error);
            setIsLoading(false);
        }
    };

    if (isLoading && !currentExpense) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Edit Expense</h1>
                <p className="text-gray-600">Update the details of your expense</p>
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
                                    valueAsNumber: true,
                                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
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
                                {...register('category')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                            >
                                {Object.values(ExpenseCategory).map((category) => (
                                    <option key={category} value={category}>
                                        {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date */}
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <input
                                id="date"
                                type="date"
                                {...register('date')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                            />
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
                            ></textarea>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition ${
                                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                            >
                                {isLoading ? 'Updating...' : 'Update Expense'}
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
