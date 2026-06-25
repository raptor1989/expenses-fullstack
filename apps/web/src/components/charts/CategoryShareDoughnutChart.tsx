import { ResponsivePie } from '@nivo/pie';
import { Category, ExpenseByMonth } from '@expenses/shared';
import { getOptionsDoughnutChartForExpenses } from '@/helpers/chartHelpers';
import { useThemeMode } from '@/theme/ThemeProvider';
import ChartCard from './ChartCard';

export interface CategoryShareDoughnutChartProps {
    monthsData: ExpenseByMonth[];
    categories: Category[];
}

export default function CategoryShareDoughnutChart({ monthsData, categories }: CategoryShareDoughnutChartProps) {
    const { mode } = useThemeMode();
    const data = getOptionsDoughnutChartForExpenses(monthsData, categories);

    return (
        <ChartCard title="Udział kategorii w wydatkach" isEmpty={data.length === 0}>
            <ResponsivePie
                data={data}
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                innerRadius={0.5}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{
                    from: 'color',
                    modifiers: [[mode === 'dark' ? 'brighter' : 'darker', 0.2]]
                }}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor={{
                    from: 'color',
                    modifiers: [[mode === 'dark' ? 'brighter' : 'darker', 2]]
                }}
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={10}
                arcLabelsTextColor={{
                    from: 'color',
                    modifiers: [[mode === 'dark' ? 'brighter' : 'darker', 2]]
                }}
            />
        </ChartCard>
    );
}
