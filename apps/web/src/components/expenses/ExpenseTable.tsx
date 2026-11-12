import {
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Chip,
    IconButton,
    Box,
    Tooltip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Expense, ExpenseSortField, SortOrder } from '@expenses/shared';
import { formatCurrency, formatDate } from '@/helpers/formatHelpers';
import { useSettings } from '@/hooks/useSettings';

interface ExpenseTableProps {
    expenses: Expense[];
    categories: { [id: string]: { name: string; color: string } };
    sort: ExpenseSortField;
    order: SortOrder;
    onSortChange: (field: ExpenseSortField) => void;
    onEdit?: (expense: Expense) => void;
    onDelete?: (expense: Expense) => void;
}

export default function ExpenseTable({
    expenses,
    categories,
    sort,
    order,
    onSortChange,
    onEdit,
    onDelete
}: ExpenseTableProps) {
    const { settings } = useSettings();

    if (!expenses || expenses.length === 0) {
        return (
            <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>No expenses to display</Typography>
            </Paper>
        );
    }

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
            <Table sx={{ minWidth: 650 }} aria-label="expenses table">
                <TableHead>
                    <TableRow>
                        <TableCell sortDirection={sort === 'date' ? order : false}>
                            <TableSortLabel
                                active={sort === 'date'}
                                direction={sort === 'date' ? order : 'desc'}
                                onClick={() => onSortChange('date')}
                            >
                                Date
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="right" sortDirection={sort === 'amount' ? order : false}>
                            <TableSortLabel
                                active={sort === 'amount'}
                                direction={sort === 'amount' ? order : 'desc'}
                                onClick={() => onSortChange('amount')}
                            >
                                Amount
                            </TableSortLabel>
                        </TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {expenses.map((expense) => (
                        <TableRow
                            key={expense.id}
                            sx={{
                                '&:last-child td, &:last-child th': { border: 0 },
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                        >
                            <TableCell sx={{ fontSize: 13, whiteSpace: 'nowrap', color: 'text.secondary' }}>
                                {formatDate(expense.date)}
                            </TableCell>
                            <TableCell sx={{ fontSize: 13 }}>{expense.description}</TableCell>
                            <TableCell>
                                {categories[expense.categoryId] ? (
                                    <Chip
                                        label={categories[expense.categoryId].name}
                                        size="small"
                                        sx={{
                                            bgcolor: categories[expense.categoryId].color || '#6c63ff',
                                            color: '#fff',
                                            fontSize: 11,
                                            height: 20,
                                            fontWeight: 500
                                        }}
                                    />
                                ) : (
                                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>—</Typography>
                                )}
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: 13, fontWeight: 600 }}>
                                {formatCurrency(expense.amount, settings.currency)}
                            </TableCell>
                            <TableCell align="right">
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                    {onEdit && (
                                        <Tooltip title="Edit">
                                            <IconButton size="small" onClick={() => onEdit(expense)} sx={{ p: 0.5 }}>
                                                <EditIcon sx={{ fontSize: 15 }} />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    {onDelete && (
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" onClick={() => onDelete(expense)} sx={{ p: 0.5 }}>
                                                <DeleteIcon sx={{ fontSize: 15 }} />
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
