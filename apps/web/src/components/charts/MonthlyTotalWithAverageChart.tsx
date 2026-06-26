import { Box } from '@mui/material';
import { ResponsiveBar } from '@nivo/bar';
import { ExpenseByMonth } from '@expenses/shared';
import { getOptionsChartColumnForExpenses } from '@/helpers/chartHelpers';
import { formatCurrency } from '@/helpers/formatHelpers';
import { useThemeMode } from '@/theme/ThemeProvider';
import ChartCard from './ChartCard';

export interface MonthlyTotalWithAverageChartProps {
    monthsData: ExpenseByMonth[];
    currency: string;
}

export default function MonthlyTotalWithAverageChart({ monthsData, currency }: MonthlyTotalWithAverageChartProps) {
    const { mode } = useThemeMode();
    const options = getOptionsChartColumnForExpenses(monthsData, mode, currency);
    const isDark = mode === 'dark';

    return (
        <ChartCard isEmpty={monthsData.length === 0}>
            <ResponsiveBar
                data={options.data}
                keys={['total']}
                indexBy="month"
                margin={{ top: 20, right: 20, bottom: 40, left: 70 }}
                padding={0.35}
                borderRadius={4}
                colors={['#6c63ff']}
                theme={options.theme}
                markers={options.markers}
                axisBottom={{
                    tickSize: 0,
                    tickPadding: 10,
                    tickRotation: 0
                }}
                axisLeft={{
                    tickSize: 0,
                    tickPadding: 10,
                    format: (v) => formatCurrency(v as number, currency)
                }}
                enableGridX={false}
                enableLabel={false}
                valueFormat={(value) => formatCurrency(value, currency)}
                tooltip={({ value, indexValue }) => (
                    <Box
                        sx={{
                            bgcolor: isDark ? '#16161c' : '#fff',
                            border: '1px solid',
                            borderColor: isDark ? '#2a2a32' : '#e8e8ea',
                            borderRadius: 2,
                            px: 1.5,
                            py: 1,
                            fontSize: 13,
                            color: 'text.primary',
                            fontFamily: '"Inter", sans-serif'
                        }}
                    >
                        <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>{indexValue}</Box>
                        <Box component="span" sx={{ fontWeight: 600 }}>{formatCurrency(value, currency)}</Box>
                    </Box>
                )}
            />
        </ChartCard>
    );
}
