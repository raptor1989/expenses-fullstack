'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { useExpensesStore } from '../../../../store/expenses';

type ExpenseDetailParams = {
    id: string;
}

export default function ExpenseDetail() {
    const router = useRouter();
    const { id } = useParams<ExpenseDetailParams>();
    const [isLoading, setIsLoading] = useState(true);
    const { currentExpense, fetchExpense, deleteExpense } = useExpensesStore();

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

    // Format currency amount
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'MMMM dd, yyyy');
    };

    // Handle delete
    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await deleteExpense(id);
                router.push('/dashboard/expenses');
            } catch (error) {
                console.error('Error deleting expense:', error);
            }
        }
    };

    if (isLoading || !currentExpense) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
                <div className="flex space-x-3">
                    <Link
                        href={`/dashboard/expense/${id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                        Edit Expense
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                {/* Expense Header Info */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold mb-2">{currentExpense.title}</h2>
                    <div className="flex flex-wrap gap-4">
                        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                            {currentExpense.category}
                        </div>
                        <div className="text-gray-600 text-sm">{formatDate(currentExpense.date)}</div>
                        <div className="text-gray-600 text-sm">Created: {formatDate(currentExpense.createdAt)}</div>
                    </div>
                </div>

                {/* Expense Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Amount</h3>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentExpense.amount)}</p>
                    </div>

                    {currentExpense.description && (
                        <div className="md:col-span-2">
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                            <p className="text-gray-900 whitespace-pre-line">{currentExpense.description}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 flex space-x-4">
                <Link href="/dashboard/expenses" className="text-sm text-gray-600 hover:text-gray-900">
                    &larr; Back to All Expenses
                </Link>

                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                    Dashboard
                </Link>
            </div>
        </div>
    );
}
