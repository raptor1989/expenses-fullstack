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
    Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Add as AddIcon, Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import dayjs from 'dayjs';
import ExpenseTable from '../components/ExpenseTable';
import ExpenseForm from '../components/ExpenseForm';
import { getExpenses, deleteExpense, createExpense, updateExpense } from '../services/expenseService';
import { useCategoryStore } from '@/store/categoryStore';
import { secondaryTextSx } from '@/helpers/sxHelpers';
import { Expense, ExpenseCreateInput } from '@expenses/shared';

export default function Expenses() {
    // State variables
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const { categories, fetchCategories } = useCategoryStore();
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    });
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
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });

    // Fetch expenses with current filters and pagination
    const fetchExpenses = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getExpenses(
                pagination.page,
                pagination.limit,
                filters.startDate.format('YYYY-MM-DD'),
                filters.endDate.format('YYYY-MM-DD'),
                filters.categoryId || undefined
            );
            setExpenses(response.expenses);
            setPagination((prev) => ({
                ...prev,
                total: response.pagination.total,
                totalPages: response.pagination.totalPages
            }));
        } catch {
            setNotification({
                open: true,
                message: 'Failed to load expenses. Please try again later.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filters.startDate, filters.endDate, filters.categoryId]);

    // Initial data loading
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Map for easier category lookup in the table
    const categoriesMap = useMemo(() => {
        const categoryMap: Record<string, { name: string; color: string }> = {};
        categories.forEach((category) => {
            categoryMap[category.id] = {
                name: category.name,
                color: category.color || '#9e9e9e' // Default color if none is specified
            };
        });
        return categoryMap;
    }, [categories]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    // Event handlers
    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPagination((prev) => ({ ...prev, page: value }));
    };

    const handleFilterChange = (field: keyof typeof filters, value: unknown) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
    };

    const handleApplyFilters = () => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        fetchExpenses();
    };

    const handleAddExpense = () => {
        setEditExpense(null);
        setFormOpen(true);
    };

    const handleEditExpense = (expense: Expense) => {
        setEditExpense(expense);
        setFormOpen(true);
    };

    const handleDeleteClick = (expense: Expense) => {
        setExpenseToDelete(expense);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!expenseToDelete) return;

        try {
            await deleteExpense(expenseToDelete.id);
            setExpenses(expenses.filter((e) => e.id !== expenseToDelete.id));
            setNotification({
                open: true,
                message: 'Expense deleted successfully!',
                severity: 'success'
            });
        } catch {
            setNotification({
                open: true,
                message: 'Failed to delete expense. Please try again.',
                severity: 'error'
            });
        } finally {
            setDeleteDialogOpen(false);
            setExpenseToDelete(null);
        }
    };

    const handleSubmitExpense = async (expenseData: ExpenseCreateInput) => {
        try {
            if (editExpense) {
                const updatedExpense = await updateExpense(editExpense.id, expenseData);
                setExpenses(expenses.map((e) => (e.id === editExpense.id ? updatedExpense : e)));
                setNotification({
                    open: true,
                    message: 'Expense updated successfully!',
                    severity: 'success'
                });
            } else {
                const newExpense = await createExpense(expenseData);
                setExpenses([newExpense, ...expenses]);
                setNotification({
                    open: true,
                    message: 'Expense added successfully!',
                    severity: 'success'
                });
            }
            setFormOpen(false);
        } catch {
            setNotification({
                open: true,
                message: `Failed to ${editExpense ? 'update' : 'create'} expense. Please try again.`,
                severity: 'error'
            });
        }
    };

    const handleCloseNotification = () => {
        setNotification((prev) => ({ ...prev, open: false }));
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Expenses</Typography>
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddExpense}>
                    Add Expense
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <TextField
                        label="Search expenses"
                        variant="outlined"
                        size="small"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        sx={{ flexGrow: 1, mr: 1 }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={handleApplyFilters}>
                                            <SearchIcon />
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                    <Button variant="outlined" startIcon={<FilterIcon />} onClick={() => setShowFilters(!showFilters)}>
                        Filters
                    </Button>
                </Box>

                {showFilters && (
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DatePicker
                                label="Start Date"
                                value={filters.startDate}
                                onChange={(date) => handleFilterChange('startDate', date)}
                                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <DatePicker
                                label="End Date"
                                value={filters.endDate}
                                onChange={(date) => handleFilterChange('endDate', date)}
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
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Button variant="contained" color="primary" fullWidth onClick={handleApplyFilters}>
                                Apply Filters
                            </Button>
                        </Grid>
                    </Grid>
                )}
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : expenses.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" sx={secondaryTextSx}>
                        No expenses found. Add your first expense to get started!
                    </Typography>
                </Paper>
            ) : (
                <>
                    <ExpenseTable
                        expenses={expenses}
                        categories={categoriesMap}
                        onEdit={handleEditExpense}
                        onDelete={handleDeleteClick}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination
                            count={pagination.totalPages}
                            page={pagination.page}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Box>
                </>
            )}

            {/* Add/Edit Expense Form Dialog */}
            <ExpenseForm
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleSubmitExpense}
                categories={categories}
                initialValues={editExpense || undefined}
                title={editExpense ? 'Edit Expense' : 'Add Expense'}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the expense "{expenseToDelete?.description}"? This action cannot
                        be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={5000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
