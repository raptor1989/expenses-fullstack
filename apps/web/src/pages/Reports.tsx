import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Select,
    MenuItem
} from '@mui/material';
import { useEffect, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { getExpensesByMonth } from '../services/expenseService';
import { ExpenseByMonth } from '@expenses/shared';
import { formatCurrency } from '@/helpers/formatHelpers';
import { useThemeMode } from '@/theme/ThemeProvider';
import { useSettings } from '@/hooks/useSettings';

const currentYear = new Date().getFullYear();

export default function Reports() {
    const { mode } = useThemeMode();
    const { settings } = useSettings();
    const [year, setYear] = useState(currentYear);
    const [data, setData] = useState<ExpenseByMonth[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                        {/* Monthly total chart */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Monthly Total
                            </Typography>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveBar
                                    data={data.map((m) => ({ month: m.month.slice(0, 3), total: m.total }))}
                                    keys={['total']}
                                    indexBy="month"
                                    margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
                                    padding={0.3}
                                    colors={['#2e7d32']}
                                    theme={{
                                        text: { fill: mode === 'dark' ? '#e0e0e0' : '#333333' },
                                        grid: { line: { stroke: mode === 'dark' ? '#444444' : '#dddddd' } }
                                    }}
                                    axisBottom={{ tickSize: 5, tickPadding: 5 }}
                                    axisLeft={{ tickSize: 5, tickPadding: 5 }}
                                    enableLabel={false}
                                    valueFormat={(value) => formatCurrency(value, settings.currency)}
                                    tooltip={({ value, indexValue }) => (
                                        <Paper sx={{ p: 1 }}>
                                            {indexValue}: {formatCurrency(value, settings.currency)}
                                        </Paper>
                                    )}
                                />
                            </Box>
                        </Box>
                        {/* Table */}
                        <TableContainer component={Paper}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Month</TableCell>
                                        <TableCell>Total</TableCell>
                                        <TableCell>Top Category</TableCell>
                                        <TableCell>Top Expense</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.map((m) => {
                                        const topCat = Object.entries(m.totalByCategory).sort((a, b) => b[1] - a[1])[0];
                                        const topExp = m.topFiveMostExpensive[0];
                                        return (
                                            <TableRow key={m.month}>
                                                <TableCell>{m.month}</TableCell>
                                                <TableCell>{m.total.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    {topCat ? `${topCat[0]} (${topCat[1].toFixed(2)})` : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {topExp
                                                        ? `${topExp.description} (${formatCurrency(topExp.amount, settings.currency)})`
                                                        : '-'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </Paper>
        </Box>
    );
}
