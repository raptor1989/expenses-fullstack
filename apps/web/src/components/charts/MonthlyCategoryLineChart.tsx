import { Box } from '@mui/material';
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
    const isDark = mode === 'dark';

    return (
        <ChartCard isEmpty={monthsData.length === 0 || categories.length === 0} height={320}>
            <ResponsiveLine
                data={options.data}
                colors={options.colors}
                theme={options.theme}
                margin={{ top: 20, right: 130, bottom: 50, left: 70 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false }}
                curve="monotoneX"
                axisBottom={{
                    tickSize: 0,
                    tickPadding: 10
                }}
                axisLeft={{
                    tickSize: 0,
                    tickPadding: 10
                }}
                enableGridX={false}
                pointSize={5}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointColor={isDark ? '#0f0f12' : '#ffffff'}
                useMesh
                enableCrosshair
                tooltip={({ point }) => (
                    <Box
                        sx={{
                            bgcolor: isDark ? '#16161c' : '#fff',
                            border: '1px solid',
                            borderColor: isDark ? '#2a2a32' : '#e8e8ea',
                            borderRadius: 2,
                            px: 1.5,
                            py: 1,
                            fontSize: 13,
                            fontFamily: '"Inter", sans-serif'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: point.color }} />
                            <Box component="span" sx={{ color: 'text.secondary' }}>{point.seriesId}</Box>
                            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>{String(point.data.yFormatted)}</Box>
                        </Box>
                    </Box>
                )}
                legends={[
                    {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 120,
                        translateY: 0,
                        itemsSpacing: 6,
                        itemWidth: 110,
                        itemHeight: 16,
                        itemDirection: 'left-to-right',
                        symbolSize: 8,
                        symbolShape: 'circle',
                        effects: []
                    }
                ]}
            />
        </ChartCard>
    );
}
