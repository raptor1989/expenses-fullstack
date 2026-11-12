import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
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
    InputAdornment,
    Tooltip,
    DialogContentText,
    Grid,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useCategoryStore } from '@/store/categoryStore';
import { getApiErrorMessage } from '@/services/api';
import { Category } from '@expenses/shared';

export default function Categories() {
    const { categories, loading, refreshCategories, addCategory, editCategory, removeCategory } = useCategoryStore();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', color: '#6c63ff' });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [moveTo, setMoveTo] = useState('');
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    useEffect(() => {
        // Always reload here: the delete dialog relies on current expense counts.
        refreshCategories().catch((err) =>
            setNotification({
                open: true,
                message: getApiErrorMessage(err, 'Failed to load categories.'),
                severity: 'error'
            })
        );
    }, [refreshCategories]);

    const deleteExpenseCount = categoryToDelete?.expenseCount ?? 0;
    const moveTargets = categories.filter((c) => c.id !== categoryToDelete?.id);

    const openAdd = () => {
        setDialogMode('add');
        setFormData({ name: '', color: '#6c63ff' });
        setDialogOpen(true);
    };

    const openEdit = (cat: Category) => {
        setDialogMode('edit');
        setSelectedCategory(cat);
        setFormData({ name: cat.name, color: cat.color || '#6c63ff' });
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setNotification({ open: true, message: 'Category name is required', severity: 'error' });
            return;
        }
        try {
            if (dialogMode === 'add') {
                await addCategory(formData.name, formData.color);
                setNotification({ open: true, message: 'Category created!', severity: 'success' });
            } else if (selectedCategory) {
                await editCategory(selectedCategory.id, formData.name, formData.color);
                setNotification({ open: true, message: 'Category updated!', severity: 'success' });
            }
            setDialogOpen(false);
        } catch (err) {
            setNotification({
                open: true,
                message: getApiErrorMessage(err, `Failed to ${dialogMode} category.`),
                severity: 'error'
            });
        }
    };

    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return;
        try {
            await removeCategory(categoryToDelete.id, deleteExpenseCount > 0 ? moveTo : undefined);
            setNotification({ open: true, message: 'Category deleted!', severity: 'success' });
        } catch (err) {
            setNotification({
                open: true,
                message: getApiErrorMessage(err, 'Failed to delete category.'),
                severity: 'error'
            });
        } finally {
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography sx={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>Categories</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} size="small">
                    Add Category
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
                    <CircularProgress />
                </Box>
            ) : categories.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                        No categories yet. Add your first one to get started!
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={1.5}>
                    {categories.map((cat) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={cat.id}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    borderLeft: `3px solid ${cat.color || '#6c63ff'}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    transition: 'background 0.15s',
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        bgcolor: cat.color || '#6c63ff',
                                        flexShrink: 0
                                    }}
                                />
                                <Typography sx={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{cat.name}</Typography>
                                <Chip
                                    label={cat.color || '#6c63ff'}
                                    size="small"
                                    sx={{ fontSize: 10, height: 18, bgcolor: 'action.hover', color: 'text.secondary' }}
                                />
                                <Box sx={{ display: 'flex', gap: 0.25, ml: 0.5 }}>
                                    <Tooltip title="Edit">
                                        <IconButton size="small" onClick={() => openEdit(cat)} sx={{ p: 0.5 }}>
                                            <EditIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => { setCategoryToDelete(cat); setMoveTo(''); setDeleteDialogOpen(true); }}
                                            sx={{ p: 0.5 }}
                                        >
                                            <DeleteIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Add / Edit dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                slotProps={{ paper: { variant: 'outlined', sx: { borderRadius: 3 } } }}
            >
                <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>
                    {dialogMode === 'add' ? 'Add Category' : 'Edit Category'}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
                    <TextField
                        autoFocus
                        label="Name"
                        fullWidth
                        size="small"
                        value={formData.name}
                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    />
                    <TextField
                        label="Color"
                        fullWidth
                        size="small"
                        value={formData.color}
                        onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: formData.color, border: '1px solid', borderColor: 'divider' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <input
                                            type="color"
                                            value={formData.color}
                                            onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))}
                                            style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                                        />
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDialogOpen(false)} size="small">Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" size="small">
                        {dialogMode === 'add' ? 'Add' : 'Update'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                slotProps={{ paper: { variant: 'outlined', sx: { borderRadius: 3 } } }}
            >
                <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>Delete Category</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: 14 }}>
                        {deleteExpenseCount > 0
                            ? `"${categoryToDelete?.name}" has ${deleteExpenseCount} ${deleteExpenseCount === 1 ? 'expense' : 'expenses'}. ` +
                              (moveTargets.length > 0
                                  ? 'Choose a category to move them to; then the category is deleted.'
                                  : 'Create another category to move them to first.')
                            : `Delete "${categoryToDelete?.name}"? It has no expenses.`}
                    </DialogContentText>
                    {deleteExpenseCount > 0 && moveTargets.length > 0 && (
                        <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                            <InputLabel id="move-to-label">Move expenses to</InputLabel>
                            <Select
                                labelId="move-to-label"
                                label="Move expenses to"
                                value={moveTo}
                                onChange={(e) => setMoveTo(e.target.value)}
                            >
                                {moveTargets.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} size="small">Cancel</Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        size="small"
                        disabled={deleteExpenseCount > 0 && !moveTo}
                    >
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
                <Alert severity={notification.severity}>{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
}
