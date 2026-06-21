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
import { formatCurrency, formatDate } from '@/helpers/formatHelpers';
import { secondaryTextSx } from '@/helpers/sxHelpers';
import { useSettings } from '@/hooks/useSettings';

interface ExpenseTableProps {
    expenses: Expense[];
    categories: { [id: string]: { name: string; color: string } };
    onEdit?: (expense: Expense) => void;
    onDelete?: (expense: Expense) => void;
}

export default function ExpenseTable({ expenses, categories, onEdit, onDelete }: ExpenseTableProps) {
    const { settings } = useSettings();

    if (!expenses || expenses.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" sx={secondaryTextSx}>
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
                            <TableCell align="right">{formatCurrency(expense.amount, settings.currency)}</TableCell>
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
