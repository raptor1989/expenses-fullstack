import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Button,
    Grid,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    LinearProgress
} from '@mui/material';
import {
    AttachMoney as MoneyIcon,
    Receipt as ReceiptIcon,
    Category as CategoryIcon
} from '@mui/icons-material';
import { ResponsivePie } from '@nivo/pie';
import { getExpenses, getExpenseSummary } from '../services/expenseService';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { formatCurrency, formatDateTime } from '@/helpers/formatHelpers';
import { CHART_COLORS } from '@/helpers/chartHelpers';
import { useThemeMode } from '@/theme/ThemeProvider';
import { useSettings } from '@/hooks/useSettings';
import { useCategoryStore } from '@/store/categoryStore';
import { Expense, ExpenseSummary } from '@expenses/shared';
import SimpleExpenseForm from '@/components/expenses/SimpleExpenseForm';

type PieSlice = { id: string; label: string; value: number; color: string };

export default function Dashboard() {
    const navigate = useNavigate();
    const { mode } = useThemeMode();
    const { settings } = useSettings();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<ExpenseSummary | undefined>(undefined);
    const [expensesByCategory, setExpensesByCategory] = useState<PieSlice[]>([]);
    const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
    const { categories, fetchCategories } = useCategoryStore();

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const today = dayjs();
                const startDate = today.subtract(30, 'day').format('YYYY-MM-DD');
                const endDate = today.format('YYYY-MM-DD');

                const summaryData = await getExpenseSummary(startDate, endDate);
                setSummary(summaryData);

                const categoryData = summaryData.categoryBreakdown.map((item: { categoryId: string; categoryName: string; totalAmount: number; percentage: number; color: string }, index: number) => ({
                    id: item.categoryName,
                    label: item.categoryName,
                    value: item.totalAmount,
                    color: item.color || CHART_COLORS[index % CHART_COLORS.length]
                }));
                setExpensesByCategory(categoryData);

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

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const categoriesMap = useMemo(() => {
        const categoryMap: Record<string, { name: string; color: string }> = {};
        categories.forEach((category) => {
            categoryMap[category.id] = {
                name: category.name,
                color: category.color || '#9e9e9e'
            };
        });
        return categoryMap;
    }, [categories]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const totalExpenses = summary?.totalAmount || 0;

    const statCards = [
        {
            label: 'Total Expenses (30 days)',
            value: formatCurrency(totalExpenses, settings.currency),
            icon: <MoneyIcon sx={{ fontSize: 16 }} />
        },
        {
            label: 'Average Daily Spend',
            value: formatCurrency(totalExpenses / 30, settings.currency),
            icon: <ReceiptIcon sx={{ fontSize: 16 }} />
        },
        {
            label: 'Categories',
            value: String(expensesByCategory.length),
            icon: <CategoryIcon sx={{ fontSize: 16 }} />
        }
    ];

    return (
        <Box>
            {/* Stat Cards */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
                {statCards.map((stat) => (
                    <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
                        <Card sx={{ p: 2.25 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    mb: 1.25,
                                    color: 'primary.main'
                                }}
                            >
                                {stat.icon}
                                <Typography
                                    sx={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                        color: 'text.secondary'
                                    }}
                                >
                                    {stat.label}
                                </Typography>
                            </Box>
                            <Typography sx={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.03em' }}>
                                {stat.value}
                            </Typography>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Charts and Lists */}
            <Grid container spacing={1.5}>
                {/* Add Expense Form */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                        <Typography
                            sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 2 }}
                        >
                            Add Expense
                        </Typography>
                        <SimpleExpenseForm categories={categories} />
                    </Paper>
                </Grid>

                {/* Expenses by Category pie */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2.5, height: 380, borderRadius: 3 }}>
                        <Typography
                            sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 1 }}
                        >
                            Expenses by Category
                        </Typography>
                        <Box sx={{ height: 300 }}>
                            {expensesByCategory.length > 0 ? (
                                <ResponsivePie
                                    data={expensesByCategory}
                                    margin={{ top: 20, right: 80, bottom: 60, left: 80 }}
                                    innerRadius={0.55}
                                    padAngle={0.5}
                                    cornerRadius={4}
                                    activeOuterRadiusOffset={6}
                                    borderWidth={0}
                                    arcLinkLabelsSkipAngle={10}
                                    arcLinkLabelsTextColor={mode === 'dark' ? '#8a8a94' : '#6e6e78'}
                                    arcLinkLabelsThickness={1}
                                    arcLinkLabelsColor={{ from: 'color' }}
                                    arcLabelsSkipAngle={15}
                                    arcLabelsTextColor="#ffffff"
                                    theme={{
                                        text: { fontFamily: 'Inter, sans-serif', fontSize: 12 },
                                        tooltip: {
                                            container: {
                                                background: mode === 'dark' ? '#1a1a20' : '#ffffff',
                                                color: mode === 'dark' ? '#e8e8ea' : '#1a1a1f',
                                                border: `1px solid ${mode === 'dark' ? '#2a2a32' : '#e0e0e0'}`,
                                                borderRadius: 8,
                                                fontSize: 13
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No expense data available
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* Last 10 expenses table */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2.5, height: 380, overflow: 'auto', borderRadius: 3 }}>
                        <Typography
                            sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 1.5 }}
                        >
                            Last 10 Expenses
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
                                                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                                                    {formatDateTime(expense.createdAt)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: 12 }}>{expense.description}</TableCell>
                                                <TableCell>
                                                    {categoriesMap[expense.categoryId] ? (
                                                        <Chip
                                                            label={categoriesMap[expense.categoryId].name}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: categoriesMap[expense.categoryId].color || '#e0e0e0',
                                                                color: '#fff',
                                                                fontSize: 11,
                                                                height: 20
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>—</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600 }}>
                                                    {formatCurrency(expense.amount, settings.currency)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                                                No recent expenses
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Top Categories */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 2.5, height: 380, overflow: 'auto', borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography
                                sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}
                            >
                                Top Categories
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => navigate('/categories')}
                                sx={{ fontSize: 11, py: 0.4, px: 1.25, minWidth: 0 }}
                            >
                                Manage
                            </Button>
                        </Box>
                        {expensesByCategory.length > 0 ? (
                            <List disablePadding>
                                {expensesByCategory.slice(0, 6).map((category, index) => (
                                    <ListItem key={index} disablePadding sx={{ mb: 1.5, display: 'block' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <ListItemText
                                                primary={category.label}
                                                slotProps={{
                                                    primary: { sx: { fontSize: 13, fontWeight: 500 } }
                                                }}
                                            />
                                            <Typography sx={{ fontSize: 13, fontWeight: 600, flexShrink: 0, ml: 2 }}>
                                                {formatCurrency(category.value, settings.currency)}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={Math.round((category.value / totalExpenses) * 100)}
                                            sx={{
                                                height: 3,
                                                borderRadius: 99,
                                                bgcolor: 'action.hover',
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor: category.color || 'primary.main',
                                                    borderRadius: 99
                                                }
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                                No expense data available
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
