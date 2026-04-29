import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    CardContent,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Button,
    Grid2,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip
} from '@mui/material';
import { AttachMoney as MoneyIcon, Receipt as ReceiptIcon, Category as CategoryIcon } from '@mui/icons-material';
import { ResponsivePie } from '@nivo/pie';
import { getExpenses, getExpenseSummary } from '../services/expenseService';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { formatCurrency, formatDate } from '@/helpers/formatHelpers';
import { useThemeMode } from '@/theme/ThemeProvider';
import { getCategories } from '../services/categoryService';
import { Category, Expense, ExpenseByCategory, ExpenseSummary } from '@expenses/shared';
import SimpleExpenseForm from '@/components/SimpleExpenseForm';

const CHART_COLORS = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac'];

export default function Dashboard() {
    const navigate = useNavigate();
    const { mode } = useThemeMode();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<ExpenseSummary | undefined>(undefined);
    const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);
    const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
    const [categoriesMap, setCategoriesMap] = useState<Record<string, { name: string; color: string }>>({});
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Set date ranges
                const today = dayjs();
                const startDate = today.subtract(30, 'day').format('YYYY-MM-DD');
                const endDate = today.format('YYYY-MM-DD');

                // Fetch expense summary
                const summaryData = await getExpenseSummary(startDate, endDate);
                setSummary(summaryData);

                // Transform category breakdown for pie chart
                const categoryData = summaryData.categoryBreakdown.map((item, index) => ({
                    id: item.categoryName,
                    label: item.categoryName,
                    value: item.totalAmount,
                    color: item.color || CHART_COLORS[index % CHART_COLORS.length]
                }));
                setExpensesByCategory(categoryData);

                // Fetch last 10 expenses
                try {
                    const recentData = await getExpenses();
                    setRecentExpenses(recentData.expenses);
                } catch {
                    setRecentExpenses([]);
                }
            } catch {
                // summary unavailable — UI shows zeroed state
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Fetch categories for dropdown and table display
    const fetchCategories = useCallback(async () => {
        try {
            const fetchedCategories = await getCategories();
            setCategories(fetchedCategories);
            // Create a map for easier lookup in the table
            const categoryMap: Record<string, { name: string; color: string }> = {};
            fetchedCategories.forEach((category) => {
                categoryMap[category.id] = {
                    name: category.name,
                    color: category.color || '#9e9e9e' // Default color if none is specified
                };
            });
            setCategoriesMap(categoryMap);
        } catch {
            // categories unavailable — table falls back to 'Unknown Category'
        }
    }, []);

    // Initial data loading
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const totalExpenses = summary?.totalAmount || 0;

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>

            {/* Summary Cards */}
            <Grid2 container spacing={3} sx={{ mb: 4 }}>
                <Grid2 size={{ xs: 12, md: 4, sm: 6 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom variant="body2">
                                        Total Expenses (30 days)
                                    </Typography>
                                    <Typography variant="h5">{totalExpenses.toFixed(2)} zł</Typography>
                                </Box>
                                <MoneyIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid2>

                <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom variant="body2">
                                        Categories
                                    </Typography>
                                    <Typography variant="h5">{expensesByCategory.length}</Typography>
                                </Box>
                                <CategoryIcon sx={{ color: 'secondary.main', fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid2>

                <Grid2 size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom variant="body2">
                                        Average Daily Spend
                                    </Typography>
                                    <Typography variant="h5">{(totalExpenses / 30).toFixed(2)} zł</Typography>
                                </Box>
                                <ReceiptIcon sx={{ color: 'warning.main', fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid2>
            </Grid2>

            {/* Charts and Lists */}
            <Grid2 container spacing={3}>
                {/* Simple Expense Form */}
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Add Expense</Typography>
                        </Box>
                        <SimpleExpenseForm categories={categories} />
                    </Paper>
                </Grid2>

                {/* Expenses by Category */}
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Expenses by Category
                        </Typography>
                        <Box sx={{ height: 320 }}>
                            {expensesByCategory.length > 0 ? (
                                <ResponsivePie
                                    data={expensesByCategory}
                                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                                    innerRadius={0.5}
                                    padAngle={0.7}
                                    cornerRadius={3}
                                    activeOuterRadiusOffset={8}
                                    borderWidth={1}
                                    borderColor={{
                                        from: 'color',
                                        modifiers: [[mode === 'dark' ? 'brighter' : 'darker', 0.2]]
                                    }}
                                    arcLinkLabelsSkipAngle={10}
                                    arcLinkLabelsTextColor={{
                                        from: 'color',
                                        modifiers: [[mode === 'dark' ? 'brighter' : 'darker', 2]]
                                    }}
                                    arcLinkLabelsThickness={2}
                                    arcLinkLabelsColor={{ from: 'color' }}
                                    arcLabelsSkipAngle={10}
                                    arcLabelsTextColor={{
                                        from: 'color',
                                        modifiers: [[mode === 'dark' ? 'brighter' : 'darker', 2]]
                                    }}
                                />
                            ) : (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '100%'
                                    }}
                                >
                                    <Typography variant="body1" color="textSecondary">
                                        No expense data available
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid2>

                {/* Last 10 expenses */}
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, height: 400, overflow: 'auto' }}>
                        <Typography variant="h6" gutterBottom>
                            Last 10 expenses
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Category</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentExpenses.length > 0 ? (
                                        recentExpenses.map((expense) => (
                                            <TableRow key={expense.id}>
                                                <TableCell>{formatDate(expense.date)}</TableCell>
                                                <TableCell>{expense.description}</TableCell>
                                                <TableCell>
                                                    {categoriesMap[expense.categoryId] ? (
                                                        <Chip
                                                            label={categoriesMap[expense.categoryId].name}
                                                            size="small"
                                                            sx={{
                                                                bgcolor:
                                                                    categoriesMap[expense.categoryId].color ||
                                                                    '#e0e0e0',
                                                                color: '#fff'
                                                            }}
                                                        />
                                                    ) : (
                                                        'Unknown Category'
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">{formatCurrency(expense.amount)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                No recent expenses
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid2>

                {/* Recent Expenses */}
                <Grid2 size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2
                            }}
                        >
                            <Typography variant="h6">Top Categories</Typography>
                            <Button variant="outlined" size="small" onClick={() => navigate('/categories')}>
                                Manage
                            </Button>
                        </Box>
                        {expensesByCategory.length > 0 ? (
                            <List>
                                {expensesByCategory.slice(0, 5).map((category, index) => (
                                    <ListItem
                                        key={index}
                                        secondaryAction={
                                            <Typography variant="body2" fontWeight="bold">
                                                {formatCurrency(category.value)}
                                            </Typography>
                                        }
                                    >
                                        <ListItemText
                                            primary={category.label}
                                            secondary={`${Math.round((category.value / totalExpenses) * 100)}% of expenses`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body1" color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
                                No expense data available
                            </Typography>
                        )}
                    </Paper>
                </Grid2>
            </Grid2>
        </Box>
    );
}
