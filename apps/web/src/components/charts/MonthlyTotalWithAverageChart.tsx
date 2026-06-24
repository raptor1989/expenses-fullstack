import { Paper } from '@mui/material';
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

    return (
        <ChartCard title="Suma miesięcznych wydatków + linia średniej" isEmpty={monthsData.length === 0}>
            <ResponsiveBar
                data={options.data}
                keys={['total']}
                indexBy="month"
                margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
                padding={0.3}
                colors={['#2e7d32']}
                theme={options.theme}
                markers={options.markers}
                axisBottom={{ tickSize: 5, tickPadding: 5 }}
                axisLeft={{ tickSize: 5, tickPadding: 5 }}
                enableLabel={false}
                valueFormat={(value) => formatCurrency(value, currency)}
                tooltip={({ value, indexValue }) => (
                    <Paper sx={{ p: 1 }}>
                        {indexValue}: {formatCurrency(value, currency)}
                    </Paper>
                )}
            />
        </ChartCard>
    );
}
