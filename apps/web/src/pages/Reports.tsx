import { Box, Typography, Paper, CircularProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useEffect, useState } from 'react';
import { getExpensesByMonth } from '../services/expenseService';
import { ExpenseByMonth } from '@expenses/shared';
import { useSettings } from '@/hooks/useSettings';
import { useCategoryStore } from '@/store/categoryStore';
import MonthlyTotalWithAverageChart from '@/components/charts/MonthlyTotalWithAverageChart';
import MonthlyCategoryLineChart from '@/components/charts/MonthlyCategoryLineChart';
import CategoryShareDoughnutChart from '@/components/charts/CategoryShareDoughnutChart';
import ReportsTable from '@/components/reports/ReportsTable';
import CategoryRankingTable from '@/components/reports/CategoryRankingTable';

const currentYear = new Date().getFullYear();

export default function Reports() {
    const { settings } = useSettings();
    const { categories, fetchCategories } = useCategoryStore();
    const [year, setYear] = useState(currentYear);
    const [data, setData] = useState<ExpenseByMonth[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography sx={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }}>Reports</Typography>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Year</InputLabel>
                    <Select value={year} label="Year" onChange={(e) => setYear(Number(e.target.value))}>
                        {[...Array(5)].map((_, i) => {
                            const y = currentYear - i;
                            return <MenuItem key={y} value={y}>{y}</MenuItem>;
                        })}
                    </Select>
                </FormControl>
            </Box>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error" sx={{ py: 4, textAlign: 'center' }}>{error}</Typography>
                ) : (
                    <>
                        <Box sx={{ mb: 4 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 2 }}>
                                Monthly Totals
                            </Typography>
                            <MonthlyTotalWithAverageChart monthsData={data} currency={settings.currency} />
                        </Box>
                        <Box sx={{ mb: 4 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 2 }}>
                                Category Trends
                            </Typography>
                            <MonthlyCategoryLineChart monthsData={data} categories={categories} />
                        </Box>
                        <Box sx={{ mb: 4 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 2 }}>
                                Category Share
                            </Typography>
                            <CategoryShareDoughnutChart monthsData={data} categories={categories} />
                        </Box>
                        <Box sx={{ mb: 4 }}>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 2 }}>
                                Category Ranking
                            </Typography>
                            <CategoryRankingTable monthsData={data} categories={categories} currency={settings.currency} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 2 }}>
                                Monthly Breakdown
                            </Typography>
                            <ReportsTable monthsData={data} currency={settings.currency} />
                        </Box>
                    </>
                )}
            </Paper>
        </Box>
    );
}
