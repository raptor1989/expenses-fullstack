import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  DialogContentText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { getCategories } from '../services/categoryService';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetProgress
} from '../services/budgetService';
import { Budget, Category } from '@expenses/shared';

interface BudgetWithProgress extends Budget {
  progress: number;
  spent: number;
  categoryName: string;
  categoryColor: string;
}

export default function BudgetPage() {
  // State for budgets
  const [budgets, setBudgets] = useState<BudgetWithProgress[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // State for budget dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: 0,
    startDate: dayjs().startOf('month'),
    endDate: dayjs().endOf('month')
  });

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // Initial data loading
  useEffect(() => {
    Promise.all([
      fetchCategories(),
      fetchBudgets()
    ]).finally(() => {
      setLoading(false);
    });
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      setNotification({
        open: true,
        message: 'Failed to load categories. Please try again.',
        severity: 'error'
      });
      return [];
    }
  };

  const fetchBudgets = async () => {
    try {
      const data = await getBudgets();
      const categories = await getCategories();
      
      // Fetch progress for each budget
      const budgetsWithProgress = await Promise.all(
        data.map(async (budget) => {
          const progress = await getBudgetProgress(budget.id);
          const category = categories.find(c => c.id === budget.categoryId);
          
          return {
            ...budget,
            progress: progress.percentage,
            spent: progress.spent,
            categoryName: category?.name || 'Unknown Category',
            categoryColor: category?.color || '#9e9e9e'
          };
        })
      );
      
      setBudgets(budgetsWithProgress);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setNotification({
        open: true,
        message: 'Failed to load budgets. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleOpenAddDialog = () => {
    setDialogMode('add');
    setFormData({
      categoryId: '',
      amount: 0,
      startDate: dayjs().startOf('month'),
      endDate: dayjs().endOf('month')
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (budget: Budget) => {
    setDialogMode('edit');
    setSelectedBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      amount: budget.amount,
      startDate: dayjs(budget.startDate),
      endDate: dayjs(budget.endDate)
    });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedBudget(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate', date: dayjs.Dayjs | null) => {
    if (date) {
      setFormData(prev => ({ ...prev, [field]: date }));
    }
  };

  const handleBudgetSubmit = async () => {
    try {
      if (!formData.categoryId) {
        setNotification({
          open: true,
          message: 'Please select a category',
          severity: 'error'
        });
        return;
      }

      if (formData.amount <= 0) {
        setNotification({
          open: true,
          message: 'Budget amount must be greater than zero',
          severity: 'error'
        });
        return;
      }

      if (formData.startDate.isAfter(formData.endDate)) {
        setNotification({
          open: true,
          message: 'Start date cannot be after end date',
          severity: 'error'
        });
        return;
      }

      const budgetData = {
        categoryId: formData.categoryId,
        amount: formData.amount,
        startDate: formData.startDate.format('YYYY-MM-DD'),
        endDate: formData.endDate.format('YYYY-MM-DD')
      };

      if (dialogMode === 'add') {
        await createBudget(budgetData);
        setNotification({
          open: true,
          message: 'Budget created successfully!',
          severity: 'success'
        });
      } else if (dialogMode === 'edit' && selectedBudget) {
        await updateBudget(selectedBudget.id, budgetData);
        setNotification({
          open: true,
          message: 'Budget updated successfully!',
          severity: 'success'
        });
      }

      handleDialogClose();
      fetchBudgets(); // Refresh the budgets list
    } catch (error) {
      console.error('Error saving budget:', error);
      setNotification({
        open: true,
        message: `Failed to ${dialogMode === 'add' ? 'create' : 'update'} budget. Please try again.`,
        severity: 'error'
      });
    }
  };

  const handleDeleteClick = (budget: Budget) => {
    setBudgetToDelete(budget);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!budgetToDelete) return;

    try {
      await deleteBudget(budgetToDelete.id);
      setBudgets(prev => prev.filter(b => b.id !== budgetToDelete.id));
      setNotification({
        open: true,
        message: 'Budget deleted successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting budget:', error);
      setNotification({
        open: true,
        message: 'Failed to delete budget. Please try again.',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setBudgetToDelete(null);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Helper functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateRange = (startDate: Date, endDate: Date): string => {
    return `${dayjs(startDate).format('MMM D')} - ${dayjs(endDate).format('MMM D, YYYY')}`;
  };

  const getProgressColor = (progress: number): string => {
    if (progress < 70) return 'success';
    if (progress < 90) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Budgets</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Budget
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : budgets.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No budgets found. Create your first budget to track your spending!
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {budgets.map((budget) => (
            <Grid item xs={12} md={6} lg={4} key={budget.id}>
              <Card>
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2
                  }}>
                    <Box>
                      <Typography 
                        variant="h6" 
                        gutterBottom
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: budget.categoryColor,
                            mr: 1
                          }}
                        />
                        {budget.categoryName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDateRange(budget.startDate, budget.endDate)}
                      </Typography>
                    </Box>
                    <Typography variant="h6">
                      {formatCurrency(budget.amount)}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        {formatCurrency(budget.spent)} spent
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" color={getProgressColor(budget.progress)}>
                        {budget.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(budget.progress, 100)} 
                      color={getProgressColor(budget.progress) as any}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenEditDialog(budget)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteClick(budget)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Budget Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'add' ? 'Add Budget' : 'Edit Budget'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                label="Category"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                fullWidth
                required
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Budget Amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleInputChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(date) => handleDateChange('startDate', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="End Date"
                value={formData.endDate}
                onChange={(date) => handleDateChange('endDate', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleBudgetSubmit} variant="contained" color="primary">
            {dialogMode === 'add' ? 'Add' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this budget?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
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
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
