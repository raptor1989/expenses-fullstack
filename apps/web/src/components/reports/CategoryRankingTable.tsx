import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Category, ExpenseByMonth } from '@expenses/shared';
import { getCategoryRankingForExpenses } from '@/helpers/chartHelpers';
import { formatCurrency } from '@/helpers/formatHelpers';

export interface CategoryRankingTableProps {
    monthsData: ExpenseByMonth[];
    categories: Category[];
    currency: string;
}

const cellSx = { py: 0.5 };

export default function CategoryRankingTable({ monthsData, categories, currency }: CategoryRankingTableProps) {
    const ranking = getCategoryRankingForExpenses(monthsData, categories);

    return (
        <TableContainer component={Paper}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={cellSx}>#</TableCell>
                        <TableCell sx={cellSx}>Category</TableCell>
                        <TableCell sx={cellSx} align="right">
                            Total
                        </TableCell>
                        <TableCell sx={cellSx} align="right">
                            Share
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {ranking.length === 0 ? (
                        <TableRow>
                            <TableCell sx={cellSx} colSpan={4}>
                                No data available
                            </TableCell>
                        </TableRow>
                    ) : (
                        ranking.map((row) => (
                            <TableRow key={row.name}>
                                <TableCell sx={cellSx}>{row.rank}</TableCell>
                                <TableCell sx={cellSx}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '2px',
                                                backgroundColor: row.color,
                                                flexShrink: 0
                                            }}
                                        />
                                        {row.name}
                                    </Box>
                                </TableCell>
                                <TableCell sx={cellSx} align="right">
                                    {formatCurrency(row.total, currency)}
                                </TableCell>
                                <TableCell sx={cellSx} align="right">
                                    {row.percentage.toFixed(1)}%
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
