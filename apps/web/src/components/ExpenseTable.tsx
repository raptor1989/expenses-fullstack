import { useState } from 'react';
import {
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Box,
    Tooltip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Expense } from '@expenses/shared';

interface ExpenseTableProps {
    expenses: Expense[];
    categories: { [id: string]: { name: string; color: string } };
    onEdit?: (expense: Expense) => void;
    onDelete?: (expense: Expense) => void;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
};

// Helper function to format date
const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export default function ExpenseTable({ expenses, categories, onEdit, onDelete }: ExpenseTableProps) {
    if (!expenses || expenses.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    No expenses to display
                </Typography>
            </Paper>
        );
    }

    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="expenses table">
                <TableHead>
                    <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {expenses.map((expense) => (
                        <TableRow key={expense.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell component="th" scope="row">
                                {formatDate(expense.date)}
                            </TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>
                                {categories[expense.categoryId] ? (
                                    <Chip
                                        label={categories[expense.categoryId].name}
                                        size="small"
                                        sx={{
                                            bgcolor: categories[expense.categoryId].color || '#e0e0e0',
                                            color: '#fff'
                                        }}
                                    />
                                ) : (
                                    'Unknown Category'
                                )}
                            </TableCell>
                            <TableCell align="right">{formatCurrency(expense.amount)}</TableCell>
                            <TableCell align="right">
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    {onEdit && (
                                        <Tooltip title="Edit">
                                            <IconButton size="small" onClick={() => onEdit(expense)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    {onDelete && (
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" onClick={() => onDelete(expense)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
