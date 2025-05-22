import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Divider,
    List,
    ListItem,
    ListItemText,
    LinearProgress,
    CircularProgress,
    IconButton,
    Button,
    Chip
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    AttachMoney as MoneyIcon,
    Receipt as ReceiptIcon,
    Category as CategoryIcon,
    DateRange as DateRangeIcon
} from '@mui/icons-material';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { getExpenseSummary } from '../services/expenseService';
import { getBudgets } from '../services/budgetService';
import { getCategories } from '../services/categoryService';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [recentExpenses, setRecentExpenses] = useState([]);
    const [budgetProgress, setBudgetProgress] = useState<any[]>([]);
    const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
    const [expensesTrend, setExpensesTrend] = useState<any[]>([]);

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
                const categoryData = summaryData.categoryBreakdown.map((item: any) => ({
                    id: item.categoryName,
                    label: item.categoryName,
                    value: item.amount,
                    color: `hsl(${Math.random() * 360}, 70%, 50%)`
                }));
                setExpensesByCategory(categoryData);

                // Fetch budgets for progress display
                const budgets = await getBudgets();
                const categories = await getCategories();

                // Map category names to budgets
                const budgetsWithCategories = budgets.slice(0, 3).map((budget) => {
                    const category = categories.find((cat) => cat.id === budget.categoryId);
                    return {
                        ...budget,
                        categoryName: category ? category.name : 'Unknown',
                        progress: Math.floor(Math.random() * 100) // Mock progress data
                    };
                });
                setBudgetProgress(budgetsWithCategories);

                // Generate mock trend data (in real app, we'd fetch this)
                const trendData = [
                    {
                        id: 'expenses',
                        color: 'hsl(211, 70%, 50%)',
                        data: Array.from({ length: 10 }, (_, i) => ({
                            x: dayjs()
                                .subtract(9 - i, 'day')
                                .format('MMM DD'),
                            y: Math.floor(Math.random() * 200) + 50
                        }))
                    }
                ];
                setExpensesTrend(trendData);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom variant="body2">
                                        Total Expenses (30 days)
                                    </Typography>
                                    <Typography variant="h5">${totalExpenses.toFixed(2)}</Typography>
                                </Box>
                                <MoneyIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
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
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom variant="body2">
                                        Active Budgets
                                    </Typography>
                                    <Typography variant="h5">{budgetProgress.length}</Typography>
                                </Box>
                                <DateRangeIcon sx={{ color: 'success.main', fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography color="textSecondary" gutterBottom variant="body2">
                                        Average Daily Spend
                                    </Typography>
                                    <Typography variant="h5">${(totalExpenses / 30).toFixed(2)}</Typography>
                                </Box>
                                <ReceiptIcon sx={{ color: 'warning.main', fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts and Lists */}
            <Grid container spacing={3}>
                {/* Expenses by Category */}
                <Grid item xs={12} md={6}>
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
                                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                                    arcLinkLabelsSkipAngle={10}
                                    arcLinkLabelsTextColor="#333333"
                                    arcLinkLabelsThickness={2}
                                    arcLinkLabelsColor={{ from: 'color' }}
                                    arcLabelsSkipAngle={10}
                                    arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
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
                </Grid>

                {/* Expense Trend */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 400 }}>
                        <Typography variant="h6" gutterBottom>
                            Expense Trend (Last 10 Days)
                        </Typography>
                        <Box sx={{ height: 320 }}>
                            <ResponsiveLine
                                data={expensesTrend}
                                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                                xScale={{ type: 'point' }}
                                yScale={{
                                    type: 'linear',
                                    min: 'auto',
                                    max: 'auto',
                                    stacked: true,
                                    reverse: false
                                }}
                                yFormat=" >-.2f"
                                axisTop={null}
                                axisRight={null}
                                axisBottom={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: -45,
                                    legend: 'Date',
                                    legendOffset: 36,
                                    legendPosition: 'middle'
                                }}
                                axisLeft={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                    legend: 'Amount',
                                    legendOffset: -40,
                                    legendPosition: 'middle'
                                }}
                                pointSize={10}
                                pointColor={{ theme: 'background' }}
                                pointBorderWidth={2}
                                pointBorderColor={{ from: 'serieColor' }}
                                pointLabelYOffset={-12}
                                useMesh={true}
                                legends={[
                                    {
                                        anchor: 'bottom-right',
                                        direction: 'column',
                                        justify: false,
                                        translateX: 100,
                                        translateY: 0,
                                        itemsSpacing: 0,
                                        itemDirection: 'left-to-right',
                                        itemWidth: 80,
                                        itemHeight: 20,
                                        itemOpacity: 0.75,
                                        symbolSize: 12,
                                        symbolShape: 'circle',
                                        symbolBorderColor: 'rgba(0, 0, 0, .5)',
                                        effects: [
                                            {
                                                on: 'hover',
                                                style: {
                                                    itemBackground: 'rgba(0, 0, 0, .03)',
                                                    itemOpacity: 1
                                                }
                                            }
                                        ]
                                    }
                                ]}
                            />
                        </Box>
                    </Paper>
                </Grid>

                {/* Budget Progress */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2
                            }}
                        >
                            <Typography variant="h6">Budget Progress</Typography>
                            <Button variant="outlined" size="small" onClick={() => navigate('/budget')}>
                                View All
                            </Button>
                        </Box>
                        {budgetProgress.length > 0 ? (
                            <List>
                                {budgetProgress.map((budget) => (
                                    <Box key={budget.id} sx={{ mb: 2 }}>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                mb: 0.5
                                            }}
                                        >
                                            <Typography variant="body2">{budget.categoryName}</Typography>
                                            <Typography variant="body2">{budget.progress}%</Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={budget.progress}
                                            color={
                                                budget.progress > 90
                                                    ? 'error'
                                                    : budget.progress > 70
                                                      ? 'warning'
                                                      : 'success'
                                            }
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                    </Box>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body1" color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
                                No active budgets
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* Recent Expenses */}
                <Grid item xs={12} md={6}>
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
                                                ${category.value.toFixed(2)}
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
                </Grid>
            </Grid>
        </Box>
    );
}
