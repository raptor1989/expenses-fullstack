import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Snackbar,
    Alert,
    Card,
    CardContent,
    CardActions,
    InputLabel,
    FormControl,
    Input,
    InputAdornment,
    Tooltip,
    DialogContentText
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ColorLens as ColorLensIcon
} from '@mui/icons-material';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { Category } from '@expenses/shared';

export default function Categories() {
    // State for categories list
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // State for dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    // State for form
    const [formData, setFormData] = useState({
        name: '',
        color: '#3f51b5', // Default color
        icon: '' // For future use
    });

    // State for delete confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    // State for notifications
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });

    // Fetch categories on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setNotification({
                open: true,
                message: 'Failed to load categories. Please try again.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddDialog = () => {
        setDialogMode('add');
        setFormData({
            name: '',
            color: '#3f51b5',
            icon: ''
        });
        setDialogOpen(true);
    };

    const handleOpenEditDialog = (category: Category) => {
        setDialogMode('edit');
        setSelectedCategory(category);
        setFormData({
            name: category.name,
            color: category.color || '#3f51b5',
            icon: category.icon || ''
        });
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setSelectedCategory(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCategorySubmit = async () => {
        try {
            if (!formData.name.trim()) {
                setNotification({
                    open: true,
                    message: 'Category name is required',
                    severity: 'error'
                });
                return;
            }

            if (dialogMode === 'add') {
                const newCategory = await createCategory(formData.name, formData.color, formData.icon);
                setCategories((prev) => [...prev, newCategory]);
                setNotification({
                    open: true,
                    message: 'Category created successfully!',
                    severity: 'success'
                });
            } else if (dialogMode === 'edit' && selectedCategory) {
                const updatedCategory = await updateCategory(
                    selectedCategory.id,
                    formData.name,
                    formData.color,
                    formData.icon
                );
                setCategories((prev) => prev.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat)));
                setNotification({
                    open: true,
                    message: 'Category updated successfully!',
                    severity: 'success'
                });
            }

            handleDialogClose();
        } catch (error) {
            console.error('Error saving category:', error);
            setNotification({
                open: true,
                message: `Failed to ${dialogMode === 'add' ? 'create' : 'update'} category. Please try again.`,
                severity: 'error'
            });
        }
    };

    const handleDeleteClick = (category: Category) => {
        setCategoryToDelete(category);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return;

        try {
            await deleteCategory(categoryToDelete.id);
            setCategories((prev) => prev.filter((cat) => cat.id !== categoryToDelete.id));
            setNotification({
                open: true,
                message: 'Category deleted successfully!',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error deleting category:', error);
            setNotification({
                open: true,
                message: 'Failed to delete category. It may be in use by existing expenses.',
                severity: 'error'
            });
        } finally {
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
        }
    };

    const handleCloseNotification = () => {
        setNotification((prev) => ({ ...prev, open: false }));
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Categories</Typography>
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenAddDialog}>
                    Add Category
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : categories.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                        No categories found. Add your first category to get started!
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {categories.map((category) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={category.id}>
                            <Card
                                sx={{
                                    borderLeft: `5px solid ${category.color || '#3f51b5'}`,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" component="h2">
                                        {category.name}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            mt: 1
                                        }}
                                    >
                                        <ColorLensIcon
                                            sx={{
                                                color: category.color || '#3f51b5',
                                                mr: 1
                                            }}
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                            {category.color || 'No color set'}
                                        </Typography>
                                    </Box>
                                </CardContent>
                                <CardActions>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                                        <Tooltip title="Edit">
                                            <IconButton size="small" onClick={() => handleOpenEditDialog(category)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteClick(category)}
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

            {/* Add/Edit Category Dialog */}
            <Dialog open={dialogOpen} onClose={handleDialogClose}>
                <DialogTitle>{dialogMode === 'add' ? 'Add Category' : 'Edit Category'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="name"
                        label="Category Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={formData.name}
                        onChange={handleInputChange}
                    />
                    <FormControl fullWidth margin="dense">
                        <InputLabel htmlFor="color">Color</InputLabel>
                        <Input
                            id="color"
                            name="color"
                            value={formData.color}
                            onChange={handleInputChange}
                            startAdornment={
                                <InputAdornment position="start">
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            backgroundColor: formData.color,
                                            borderRadius: '50%',
                                            marginRight: 1
                                        }}
                                    />
                                </InputAdornment>
                            }
                            endAdornment={
                                <InputAdornment position="end">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                                        style={{ width: 28, height: 28 }}
                                    />
                                </InputAdornment>
                            }
                        />
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button onClick={handleCategorySubmit} variant="contained" color="primary">
                        {dialogMode === 'add' ? 'Add' : 'Update'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the category "{categoryToDelete?.name}"?
                        {categoryToDelete && (
                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold', color: 'error.main' }}>
                                Warning: This will remove the category from all associated expenses.
                            </Typography>
                        )}
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
                <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
