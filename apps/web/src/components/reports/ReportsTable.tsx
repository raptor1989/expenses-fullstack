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
import { ExpenseByMonth } from '@expenses/shared';
import { formatCurrency } from '@/helpers/formatHelpers';

export interface ReportsTableProps {
    monthsData: ExpenseByMonth[];
    currency: string;
}

const cellSx = { py: 0.5 };

export default function ReportsTable({ monthsData, currency }: ReportsTableProps) {
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
                                    {topCat ? `${topCat[0]} (${formatCurrency(topCat[1], currency)})` : '-'}
                                </TableCell>
                            );
                        })}
                    </TableRow>
                    <TableRow>
                        <TableCell sx={cellSx}>Fuel Expenses</TableCell>
                        {monthsData.map((m) => {
                            const fuelTotal = m.totalByCategory['ecf19949-908b-44e6-b961-aec1317d0940']; // Replace with actual fuel category ID
                            return (
                                <TableCell key={m.month} sx={cellSx}>
                                    {fuelTotal !== undefined ? formatCurrency(fuelTotal, currency) : '-'}
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
