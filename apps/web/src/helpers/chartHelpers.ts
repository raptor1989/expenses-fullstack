import { Category, ExpenseByMonth } from '@expenses/shared';
import { formatCurrency } from './formatHelpers';

// Palette: indigo accent + complementary vivid colors
export const CHART_COLORS: readonly string[] = [
    '#6c63ff', // indigo (primary accent)
    '#4ade80', // green
    '#fb923c', // orange
    '#38bdf8', // sky
    '#f472b6', // pink
    '#a78bfa', // violet
    '#34d399', // emerald
    '#fbbf24', // amber
    '#f87171', // red
    '#60a5fa'  // blue
];

export function resolveCategoryColor(categoryName: string, categories: Category[], indexInPalette: number): string {
    const match = categories.find((c) => c.name === categoryName);
    return match?.color || CHART_COLORS[indexInPalette % CHART_COLORS.length];
}

// Nivo theme — matches dark premium design tokens
function buildTheme(mode: 'light' | 'dark') {
    const isDark = mode === 'dark';
    return {
        background: 'transparent',
        text: {
            fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
            fontSize: 12,
            fill: isDark ? '#8a8a94' : '#6e6e78'
        },
        axis: {
            domain: { line: { stroke: isDark ? '#2a2a32' : '#e8e8ea', strokeWidth: 1 } },
            ticks: {
                line: { stroke: isDark ? '#2a2a32' : '#e8e8ea', strokeWidth: 1 },
                text: { fill: isDark ? '#8a8a94' : '#6e6e78', fontSize: 11 }
            },
            legend: { text: { fill: isDark ? '#c0c0ca' : '#4a4a55', fontSize: 12, fontWeight: 500 } }
        },
        grid: {
            line: { stroke: isDark ? '#1f1f28' : '#f0f0f4', strokeWidth: 1 }
        },
        legends: {
            text: { fill: isDark ? '#8a8a94' : '#6e6e78', fontSize: 12 },
            title: { text: { fill: isDark ? '#c0c0ca' : '#4a4a55' } }
        },
        tooltip: {
            container: {
                background: isDark ? '#16161c' : '#ffffff',
                color: isDark ? '#e8e8ea' : '#1a1a1f',
                border: `1px solid ${isDark ? '#2a2a32' : '#e8e8ea'}`,
                borderRadius: 8,
                fontSize: 13,
                fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
                padding: '8px 12px',
                boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.12)'
            }
        },
        crosshair: {
            line: { stroke: isDark ? '#6c63ff' : '#6c63ff', strokeOpacity: 0.5, strokeDasharray: '4 4' }
        }
    };
}

// ─── Bar chart (monthly totals + average line) ────────────────────────────────

export interface ChartColumnOptions {
    data: Array<{ month: string; total: number }>;
    markers: Array<{
        axis: 'y';
        value: number;
        legend: string;
        lineStyle: { stroke: string; strokeWidth: number; strokeDasharray: string };
        textStyle: { fill: string; fontSize: number };
    }>;
    theme: ReturnType<typeof buildTheme>;
    average: number;
}

export function getOptionsChartColumnForExpenses(
    monthsData: ExpenseByMonth[],
    mode: 'light' | 'dark',
    currency: string
): ChartColumnOptions {
    const data = monthsData.map((m) => ({ month: m.month.slice(0, 3), total: m.total }));
    const sum = monthsData.reduce((acc, m) => acc + m.total, 0);
    const average = monthsData.length > 0 ? sum / monthsData.length : 0;
    const isDark = mode === 'dark';

    return {
        data,
        average,
        markers: [
            {
                axis: 'y',
                value: average,
                legend: `Avg: ${formatCurrency(average, currency)}`,
                lineStyle: {
                    stroke: isDark ? '#fb923c' : '#f97316',
                    strokeWidth: 1.5,
                    strokeDasharray: '6 4'
                },
                textStyle: {
                    fill: isDark ? '#fb923c' : '#f97316',
                    fontSize: 11
                }
            }
        ],
        theme: buildTheme(mode)
    };
}

// ─── Line chart (per-category monthly trends) ────────────────────────────────

export interface ChartLineOptions {
    data: Array<{ id: string; data: Array<{ x: string; y: number }> }>;
    colors: string[];
    theme: ReturnType<typeof buildTheme>;
}

export function getOptionsChartLineForExpenses(
    monthsData: ExpenseByMonth[],
    categories: Category[],
    mode: 'light' | 'dark'
): ChartLineOptions {
    const series = categories.map((category, index) => ({
        id: category.name,
        color: resolveCategoryColor(category.name, categories, index),
        data: monthsData.map((m) => ({
            x: m.month.slice(0, 3),
            y: m.totalByCategory[category.name] ?? 0
        }))
    }));

    return {
        data: series.map(({ id, data }) => ({ id, data })),
        colors: series.map((s) => s.color),
        theme: buildTheme(mode)
    };
}

// ─── Doughnut chart (category share) ─────────────────────────────────────────

export interface DoughnutChartDatum {
    id: string;
    label: string;
    value: number;
    color: string;
}

export function getOptionsDoughnutChartForExpenses(
    monthsData: ExpenseByMonth[],
    categories: Category[]
): DoughnutChartDatum[] {
    const totals: Record<string, number> = {};
    monthsData.forEach((m) => {
        Object.entries(m.totalByCategory).forEach(([name, amount]) => {
            totals[name] = (totals[name] || 0) + (amount as number);
        });
    });

    return Object.entries(totals)
        .filter(([, value]) => value > 0)
        .map(([name, value], index) => ({
            id: name,
            label: name,
            value,
            color: resolveCategoryColor(name, categories, index)
        }));
}

// ─── Category ranking ─────────────────────────────────────────────────────────

export interface CategoryRankingRow {
    rank: number;
    name: string;
    total: number;
    percentage: number;
    color: string;
}

export function getCategoryRankingForExpenses(
    monthsData: ExpenseByMonth[],
    categories: Category[]
): CategoryRankingRow[] {
    const totals: Record<string, number> = {};
    monthsData.forEach((m) => {
        Object.entries(m.totalByCategory).forEach(([name, amount]) => {
            totals[name] = (totals[name] || 0) + (amount as number);
        });
    });

    const grandTotal = Object.values(totals).reduce((sum, v) => sum + v, 0);

    return Object.entries(totals)
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value], index) => ({
            rank: index + 1,
            name,
            total: value,
            percentage: grandTotal > 0 ? (value * 100) / grandTotal : 0,
            color: resolveCategoryColor(name, categories, index)
        }));
}
