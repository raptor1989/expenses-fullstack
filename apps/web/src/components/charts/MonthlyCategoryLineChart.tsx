import { ResponsiveLine } from '@nivo/line';
import { Category, ExpenseByMonth } from '@expenses/shared';
import { getOptionsChartLineForExpenses } from '@/helpers/chartHelpers';
import { useThemeMode } from '@/theme/ThemeProvider';
import ChartCard from './ChartCard';

export interface MonthlyCategoryLineChartProps {
    monthsData: ExpenseByMonth[];
    categories: Category[];
}

export default function MonthlyCategoryLineChart({ monthsData, categories }: MonthlyCategoryLineChartProps) {
    const { mode } = useThemeMode();
    const options = getOptionsChartLineForExpenses(monthsData, categories, mode);

    return (
        <ChartCard
            title="Miesięczne wydatki według kategorii"
            isEmpty={monthsData.length === 0 || categories.length === 0}
        >
            <ResponsiveLine
                data={options.data}
                colors={options.colors}
                theme={options.theme}
                margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 0, max: 'auto' }}
                axisBottom={{ tickSize: 5, tickPadding: 5 }}
                axisLeft={{ tickSize: 5, tickPadding: 5 }}
                pointSize={6}
                useMesh
                legends={[
                    {
                        anchor: 'bottom-right',
                        direction: 'column',
                        translateX: 100,
                        itemWidth: 80,
                        itemHeight: 18,
                        symbolSize: 12
                    }
                ]}
            />
        </ChartCard>
    );
}
