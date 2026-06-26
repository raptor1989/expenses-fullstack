import { Box } from '@mui/material';
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
    const isDark = mode === 'dark';

    return (
        <ChartCard isEmpty={data.length === 0} height={340}>
            <ResponsivePie
                data={data}
                colors={({ data: d }) => d.color}
                margin={{ top: 30, right: 100, bottom: 80, left: 100 }}
                innerRadius={0.58}
                padAngle={0.4}
                cornerRadius={4}
                activeOuterRadiusOffset={5}
                borderWidth={0}
                arcLinkLabelsSkipAngle={12}
                arcLinkLabelsTextColor={isDark ? '#8a8a94' : '#6e6e78'}
                arcLinkLabelsThickness={1}
                arcLinkLabelsColor={{ from: 'color' }}
                arcLabelsSkipAngle={20}
                arcLabelsTextColor="#ffffff"
                theme={{
                    text: {
                        fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
                        fontSize: 12,
                        fill: isDark ? '#8a8a94' : '#6e6e78'
                    },
                    tooltip: {
                        container: {
                            background: isDark ? '#16161c' : '#ffffff',
                            color: isDark ? '#e8e8ea' : '#1a1a1f',
                            border: `1px solid ${isDark ? '#2a2a32' : '#e8e8ea'}`,
                            borderRadius: 8,
                            fontSize: 13,
                            fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
                            padding: '8px 12px'
                        }
                    }
                }}
                tooltip={({ datum }) => (
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
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: datum.color }} />
                            <Box component="span" sx={{ color: 'text.secondary' }}>{datum.label}</Box>
                            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {datum.value.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}
                            </Box>
                        </Box>
                    </Box>
                )}
            />
        </ChartCard>
    );
}
