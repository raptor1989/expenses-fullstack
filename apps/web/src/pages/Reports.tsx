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
import { getExpensesByMonth } from '../services/expenseService';
import { ExpenseByMonth } from '@expenses/shared';
import { formatCurrency } from '@/helpers/formatHelpers';

const currentYear = new Date().getFullYear();

export default function Reports() {
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
                        {/* Chart placeholder */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Monthly Total (Bar Chart)
                            </Typography>
                            <Box
                                sx={{
                                    height: 200,
                                    bgcolor: '#f5f5f5',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    gap: 1,
                                    p: 2
                                }}
                            >
                                {data.map((m) => (
                                    <Box key={m.month} sx={{ flex: 1, textAlign: 'center' }}>
                                        <Box
                                            sx={{
                                                height: `${Math.max(10, (m.total / Math.max(...data.map((d) => d.total || 1))) * 150)}px`,
                                                bgcolor: 'primary.main',
                                                mb: 1
                                            }}
                                        />
                                        <Typography variant="caption">{m.month.slice(0, 3)}</Typography>
                                    </Box>
                                ))}
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
                                                        ? `${topExp.description} (${formatCurrency(topExp.amount)})`
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
