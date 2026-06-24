import { Box, Typography, Paper, CircularProgress, Select, MenuItem } from '@mui/material';
import { useEffect, useState } from 'react';
import { getExpensesByMonth } from '../services/expenseService';
import { ExpenseByMonth } from '@expenses/shared';
import { useSettings } from '@/hooks/useSettings';
import { useCategoryStore } from '@/store/categoryStore';
import MonthlyTotalWithAverageChart from '@/components/charts/MonthlyTotalWithAverageChart';
import MonthlyCategoryLineChart from '@/components/charts/MonthlyCategoryLineChart';
import CategoryShareDoughnutChart from '@/components/charts/CategoryShareDoughnutChart';
import ReportsTable from '@/components/reports/ReportsTable';

const currentYear = new Date().getFullYear();

export default function Reports() {
    const { settings } = useSettings();
    const { categories, fetchCategories } = useCategoryStore();
    const [year, setYear] = useState(currentYear);
    const [data, setData] = useState<ExpenseByMonth[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getExpensesByMonth(year)
            .then(setData)
            .catch(() => setError('Failed to load report data.'))
            .finally(() => setLoading(false));
    }, [year]);

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Reports
            </Typography>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6">Year:</Typography>
                    <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                        {[...Array(5)].map((_, i) => {
                            const y = currentYear - i;
                            return (
                                <MenuItem key={y} value={y}>
                                    {y}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </Box>
                {loading ? (
                    <CircularProgress />
                ) : error ? (
                    <Typography color="error">{error}</Typography>
                ) : (
                    <>
                        <Box sx={{ mb: 4 }}>
                            <MonthlyTotalWithAverageChart monthsData={data} currency={settings.currency} />
                        </Box>
                        <Box sx={{ mb: 4 }}>
                            <MonthlyCategoryLineChart monthsData={data} categories={categories} />
                        </Box>
                        <Box sx={{ mb: 4 }}>
                            <CategoryShareDoughnutChart monthsData={data} categories={categories} />
                        </Box>
                        <ReportsTable monthsData={data} currency={settings.currency} />
                    </>
                )}
            </Paper>
        </Box>
    );
}
