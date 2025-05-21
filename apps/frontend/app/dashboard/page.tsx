'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts';
import { useExpensesStore } from '../../store/expenses';
import Link from 'next/link';

// Colors for the charts
const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#A569BD',
    '#5DADE2',
    '#48C9B0',
    '#F4D03F',
    '#EB984E',
    '#EC7063'
];

// Loading skeleton component for better UX during data loading
const LoadingSkeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export default function Dashboard() {
    const {
        expenses,
        summary,
        isLoading,
        error,
        fetchExpenses,
        fetchSummary,
        dateRange,
        setPreviousMonth,
        setCurrentMonth
    } = useExpensesStore();

    // Track if this is the initial loading state
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                await Promise.all([fetchExpenses(), fetchSummary()]);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setInitialLoading(false);
            }
        };

        fetchData();
    }, [fetchExpenses, fetchSummary]);

    // Format category data for the pie chart
    const pieChartData = summary?.categorySummary
        ? Object.entries(summary.categorySummary).map(([category, amount]) => ({
              name: category,
              value: amount
          }))
        : [];

    // Format data for bar chart by expense
    const barChartData = expenses
        .slice(0, 10) // Show only the 10 most recent expenses
        .map((expense) => ({
            name: expense.title,
            amount: expense.amount
        }))
        .reverse(); // Show most recent first

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div className="p-4">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Expense Dashboard</h1>
                <Link
                    href="/dashboard/add-expense"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    Add New Expense
                </Link>
            </div>

            {/* Date range selector */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <button onClick={setPreviousMonth} className="px-3 py-1 text-sm border rounded hover:bg-gray-100">
                    Previous Month
                </button>

                <button onClick={setCurrentMonth} className="px-3 py-1 text-sm border rounded hover:bg-gray-100">
                    Current Month
                </button>

                <div className="text-sm">
                    <span className="font-medium">Date Range:</span>{' '}
                    {format(new Date(dateRange.startDate), 'MMM dd, yyyy')} -{' '}
                    {format(new Date(dateRange.endDate), 'MMM dd, yyyy')}
                </div>
            </div>

            {initialLoading ? (
                // Show loading skeletons during initial load
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white p-6 rounded-lg shadow">
                                <LoadingSkeleton className="h-5 w-1/2 mb-4" />
                                <LoadingSkeleton className="h-8 w-1/3" />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white p-6 rounded-lg shadow">
                                <LoadingSkeleton className="h-5 w-1/3 mb-4" />
                                <LoadingSkeleton className="h-64 w-full" />
                            </div>
                        ))}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <LoadingSkeleton className="h-5 w-1/4 mb-4" />
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <LoadingSkeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </div>
                </div>
            ) : isLoading ? (
                // Show overlay loading state when refreshing data
                <div className="relative">
                    <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>

                    {/* Content remains visible but dimmed */}
                    <div className="opacity-50">
                        {/* Summary Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Total Expenses</h3>
                                <p className="text-3xl font-bold text-blue-600">
                                    {summary ? formatCurrency(summary.totalExpenses) : '$0.00'}
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Number of Expenses</h3>
                                <p className="text-3xl font-bold text-blue-600">{expenses.length}</p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Average Expense</h3>
                                <p className="text-3xl font-bold text-blue-600">
                                    {expenses.length > 0
                                        ? formatCurrency(summary ? summary.totalExpenses / expenses.length : 0)
                                        : '$0.00'}
                                </p>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">{/* Chart content */}</div>

                        {/* Recent Expenses Table */}
                        <div className="bg-white p-6 rounded-lg shadow">{/* Table content */}</div>
                    </div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <p>{error}</p>
                    </div>
                    <div className="mt-3">
                        <button
                            onClick={() => {
                                fetchExpenses();
                                fetchSummary();
                            }}
                            className="text-sm text-red-700 font-medium hover:text-red-800"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Expenses</h3>
                            <p className="text-3xl font-bold text-blue-600">
                                {summary ? formatCurrency(summary.totalExpenses) : '$0.00'}
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Number of Expenses</h3>
                            <p className="text-3xl font-bold text-blue-600">{expenses.length}</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Average Expense</h3>
                            <p className="text-3xl font-bold text-blue-600">
                                {expenses.length > 0
                                    ? formatCurrency(summary ? summary.totalExpenses / expenses.length : 0)
                                    : '$0.00'}
                            </p>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Pie Chart */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses by Category</h3>
                            <div className="h-80">
                                {pieChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        No data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Expenses</h3>
                            <div className="h-80">
                                {barChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={barChartData}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 12 }}
                                                interval={0}
                                                tickFormatter={(value) =>
                                                    value.length > 10 ? `${value.substring(0, 10)}...` : value
                                                }
                                            />
                                            <YAxis />
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                            <Bar dataKey="amount" fill="#4F46E5" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        No recent expenses
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Expenses Table */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
                        {expenses.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Title
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Category
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Date
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Amount
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {expenses.slice(0, 5).map((expense) => (
                                            <tr key={expense.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {expense.title}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">
                                                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatCurrency(expense.amount)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <Link
                                                        href={`/dashboard/expense/${expense.id}`}
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                    >
                                                        View
                                                    </Link>
                                                    <Link
                                                        href={`/dashboard/expense/${expense.id}/edit`}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Edit
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>No expenses recorded yet.</p>
                                <Link
                                    href="/dashboard/add-expense"
                                    className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Add Your First Expense
                                </Link>
                            </div>
                        )}

                        <div className="mt-4 text-right">
                            <Link href="/dashboard/expenses" className="text-sm text-blue-600 hover:text-blue-900">
                                View All Expenses &rarr;
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
