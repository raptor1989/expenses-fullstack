import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { Category, ExpenseByMonth } from '@expenses/shared';
import { formatCurrency } from '@/helpers/formatHelpers';
import { buildCategoryLabels, UNKNOWN_CATEGORY_LABEL } from '@/helpers/chartHelpers';

export interface ReportsTableProps {
    monthsData: ExpenseByMonth[];
    categories: Category[];
    currency: string;
}

const cellSx = { py: 0.5 };

export default function ReportsTable({ monthsData, categories, currency }: ReportsTableProps) {
    const labels = buildCategoryLabels(categories);

    return (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={cellSx}>Month</TableCell>
                        {monthsData.map((m) => (
                            <TableCell key={m.month} sx={cellSx}>
                                {m.month}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell sx={cellSx}>Total</TableCell>
                        {monthsData.map((m) => (
                            <TableCell key={m.month} sx={cellSx}>
                                {formatCurrency(m.total, currency)}
                            </TableCell>
                        ))}
                    </TableRow>
                    <TableRow>
                        <TableCell sx={cellSx}>Top Category</TableCell>
                        {monthsData.map((m) => {
                            const topCat = Object.entries(m.totalByCategory).sort((a, b) => b[1] - a[1])[0];
                            return (
                                <TableCell key={m.month} sx={cellSx}>
                                    {topCat
                                        ? `${labels[topCat[0]]?.label ?? UNKNOWN_CATEGORY_LABEL} (${formatCurrency(topCat[1], currency)})`
                                        : '-'}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                    <TableRow>
                        <TableCell sx={cellSx}>Top Five</TableCell>
                        {monthsData.map((m) => (
                            <TableCell key={m.month} sx={{ ...cellSx, verticalAlign: 'top' }}>
                                {m.topFiveMostExpensive.length > 0 ? (
                                    <Box>
                                        {m.topFiveMostExpensive.map((exp) => (
                                            <Typography key={exp.id} variant="caption" component="div" noWrap>
                                                {exp.description} ({formatCurrency(exp.amount, currency)})
                                            </Typography>
                                        ))}
                                    </Box>
                                ) : (
                                    '-'
                                )}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
}
