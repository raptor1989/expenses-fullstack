import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    InputAdornment,
    IconButton,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Pagination,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Grid,
    Collapse
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Add as AddIcon, Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import ExpenseTable from '../components/expenses/ExpenseTable';
import ExpenseForm from '../components/expenses/ExpenseForm';
import { getExpenses, deleteExpense, createExpense, updateExpense } from '../services/expenseService';
import { useCategoryStore } from '@/store/categoryStore';
import { Expense, ExpenseCreateInput } from '@expenses/shared';

export default function Expenses() {
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const { categories, fetchCategories } = useCategoryStore();
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
    const [filters, setFilters] = useState({
        search: '',
        categoryId: '',
        startDate: dayjs().subtract(30, 'day'),
        endDate: dayjs()
    });
    const [showFilters, setShowFilters] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editExpense, setEditExpense] = useState<Expense | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const fetchExpenses = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getExpenses(
                pagination.page, pagination.limit,
                filters.startDate.format('YYYY-MM-DD'),
                filters.endDate.format('YYYY-MM-DD'),
                filters.categoryId || undefined
            );
            setExpenses(response.expenses);
            setPagination((prev) => ({ ...prev, total: response.pagination.total, totalPages: response.pagination.totalPages }));
        } catch {
            setNotification({ open: true, message: 'Failed to load expenses. Please try again later.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filters.startDate, filters.endDate, filters.categoryId]);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);
    useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

    const categoriesMap = useMemo(() => {
        const map: Record<string, { name: string; color: string }> = {};
        categories.forEach((c) => { map[c.id] = { name: c.name, color: c.color || '#9e9e9e' }; });
        return map;
    }, [categories]);

    const handleFilterChange = (field: keyof typeof filters, value: unknown) =>
        setFilters((prev) => ({ ...prev, [field]: value }));

    const handleApplyFilters = () => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        fetchExpenses();
    };

    const handleSubmitExpense = async (expenseData: ExpenseCreateInput) => {
        try {
            if (editExpense) {
                const updated = await updateExpense(editExpense.id, expenseData);
                setExpenses(expenses.map((e) => (e.id === editExpense.id ? updated : e)));
                setNotification({ open: true, message: 'Expense updated successfully!', severity: 'success' });
            } else {
                const newExp = await createExpense(expenseData);
                setExpenses([newExp, ...expenses]);
                setNotification({ open: true, message: 'Expense added successfully!', severity: 'success' });
            }
            setFormOpen(false);
        } catch {
            setNotification({ open: true, message: `Failed to ${editExpense ? 'update' : 'create'} expense.`, severity: 'error' });
        }
    };

    const handleConfirmDelete = async () => {
        if (!expenseToDelete) return;
        try {
            await deleteExpense(expenseToDelete.id);
            setExpenses(expenses.filter((e) => e.id !== expenseToDelete.id));
            setNotification({ open: true, message: 'Expense deleted successfully!', severity: 'success' });
        } catch {
            setNotification({ open: true, message: 'Failed to delete expense.', severity: 'error' });
        } finally {
            setDeleteDialogOpen(false);
            setExpenseToDelete(null);
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography sx={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>Expenses</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => { setEditExpense(null); setFormOpen(true); }}
                    size="small"
                >
                    Add Expense
                </Button>
            </Box>

            {/* Filters bar */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField
                        placeholder="Search expenses…"
                        variant="outlined"
                        size="small"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                        sx={{ flexGrow: 1 }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={handleApplyFilters}>
                                            <SearchIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                    <Button
                        variant={showFilters ? 'contained' : 'outlined'}
                        startIcon={<FilterIcon />}
                        onClick={() => setShowFilters(!showFilters)}
                        size="small"
                        color={showFilters ? 'primary' : 'inherit'}
                    >
                        Filters
                    </Button>
                </Box>

                <Collapse in={showFilters}>
                    <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DatePicker
                                label="Start Date"
                                value={filters.startDate}
                                onChange={(d) => handleFilterChange('startDate', d)}
                                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DatePicker
                                label="End Date"
                                value={filters.endDate}
                                onChange={(d) => handleFilterChange('endDate', d)}
                                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={filters.categoryId}
                                    label="Category"
                                    onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                                >
                                    <MenuItem value="">All Categories</MenuItem>
                                    {categories.map((c) => (
                                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Button variant="contained" fullWidth onClick={handleApplyFilters} size="small" sx={{ height: 40 }}>
                                Apply
                            </Button>
                        </Grid>
                    </Grid>
                </Collapse>
            </Paper>

            {/* Table */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
                    <CircularProgress />
                </Box>
            ) : expenses.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                        No expenses found. Add your first expense to get started!
                    </Typography>
                </Paper>
            ) : (
                <>
                    <ExpenseTable
                        expenses={expenses}
                        categories={categoriesMap}
                        onEdit={(exp) => { setEditExpense(exp); setFormOpen(true); }}
                        onDelete={(exp) => { setExpenseToDelete(exp); setDeleteDialogOpen(true); }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
                        <Pagination
                            count={pagination.totalPages}
                            page={pagination.page}
                            onChange={(_, v) => setPagination((prev) => ({ ...prev, page: v }))}
                            color="primary"
                            size="small"
                        />
                    </Box>
                </>
            )}

            <ExpenseForm
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleSubmitExpense}
                categories={categories}
                initialValues={editExpense || undefined}
                title={editExpense ? 'Edit Expense' : 'Add Expense'}
            />

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                slotProps={{ paper: { variant: 'outlined', sx: { borderRadius: 3 } } }}
            >
                <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>Delete Expense</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: 14 }}>
                        Are you sure you want to delete "{expenseToDelete?.description}"? This cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} size="small">Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" size="small" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={notification.open}
                autoHideDuration={5000}
                onClose={() => setNotification((p) => ({ ...p, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
