'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Expense, ExpenseCategory } from 'shared-types';
import { useExpensesStore } from '../../../store/expenses';

export default function ExpensesList() {
    const { expenses, isLoading, error, fetchExpenses, deleteExpense } = useExpensesStore();
    const [filter, setFilter] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | ''>('');
    const [sortBy, setSortBy] = useState<{ field: keyof Expense; direction: 'asc' | 'desc' }>({
        field: 'date',
        direction: 'desc'
    });

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    // Format currency amount
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'MMM dd, yyyy');
    };

    // Handle sorting
    const handleSort = (field: keyof Expense) => {
        setSortBy((prev) => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Filter and sort expenses
    const filteredExpenses = expenses
        .filter((expense) => {
            const matchesFilter =
                filter === '' ||
                expense.title.toLowerCase().includes(filter.toLowerCase()) ||
                expense.description.toLowerCase().includes(filter.toLowerCase());

            const matchesCategory = categoryFilter === '' || expense.category === categoryFilter;

            return matchesFilter && matchesCategory;
        })
        .sort((a, b) => {
            const { field, direction } = sortBy;

            if (field === 'amount') {
                return direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
            }

            if (field === 'date') {
                return direction === 'asc'
                    ? new Date(a.date).getTime() - new Date(b.date).getTime()
                    : new Date(b.date).getTime() - new Date(a.date).getTime();
            }

            // Default string comparison (title, category, etc)
            const valueA = String(a[field]).toLowerCase();
            const valueB = String(b[field]).toLowerCase();

            return direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        });

    // Handle delete confirmation
    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            deleteExpense(id);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">All Expenses</h1>
                <p className="text-gray-600">View and manage all your expenses</p>
            </div>

            {/* Filters and Actions */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search Filter */}
                    <div className="flex-grow min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="w-full sm:w-auto">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | '')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                        >
                            <option value="">All Categories</option>
                            {Object.values(ExpenseCategory).map((category) => (
                                <option key={category} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Add New Button */}
                    <div className="ml-auto">
                        <Link
                            href="/dashboard/add-expense"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Add New Expense
                        </Link>
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
            ) : filteredExpenses.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('title')}
                                    >
                                        Title
                                        {sortBy.field === 'title' && (
                                            <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('category')}
                                    >
                                        Category
                                        {sortBy.field === 'category' && (
                                            <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('date')}
                                    >
                                        Date
                                        {sortBy.field === 'date' && (
                                            <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                        onClick={() => handleSort('amount')}
                                    >
                                        Amount
                                        {sortBy.field === 'amount' && (
                                            <span className="ml-1">{sortBy.direction === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                                            {expense.description && (
                                                <div className="text-xs text-gray-500 truncate max-w-xs">
                                                    {expense.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{expense.category}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{formatDate(expense.date)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(expense.amount)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/dashboard/expense/${expense.id}/edit`}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <p className="text-gray-500">No expenses match your filters.</p>
                </div>
            )}

            <div className="mt-4">
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                    &larr; Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
