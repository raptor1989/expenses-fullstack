import { Category, ExpenseByMonth } from '@expenses/shared';
import { formatCurrency } from './formatHelpers';

export const CHART_COLORS: readonly string[] = [
    '#4e79a7',
    '#f28e2b',
    '#e15759',
    '#76b7b2',
    '#59a14f',
    '#edc948',
    '#b07aa1',
    '#ff9da7',
    '#9c755f',
    '#bab0ac'
];

export function resolveCategoryColor(categoryName: string, categories: Category[], indexInPalette: number): string {
    const match = categories.find((c) => c.name === categoryName);
    return match?.color || CHART_COLORS[indexInPalette % CHART_COLORS.length];
}

interface ChartTheme {
    text: { fill: string };
    grid: { line: { stroke: string } };
}

function buildTheme(mode: 'light' | 'dark'): ChartTheme {
    return {
        text: { fill: mode === 'dark' ? '#e0e0e0' : '#333333' },
        grid: { line: { stroke: mode === 'dark' ? '#444444' : '#dddddd' } }
    };
}

export interface ChartLineOptions {
    data: Array<{ id: string; data: Array<{ x: string; y: number }> }>;
    colors: string[];
    theme: ChartTheme;
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

export interface ChartColumnOptions {
    data: Array<{ month: string; total: number }>;
    markers: Array<{
        axis: 'y';
        value: number;
        legend: string;
        lineStyle: { stroke: string; strokeDasharray: string };
        textStyle: { fill: string };
    }>;
    theme: ChartTheme;
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

    return {
        data,
        average,
        markers: [
            {
                axis: 'y',
                value: average,
                legend: `Average: ${formatCurrency(average, currency)}`,
                lineStyle: { stroke: mode === 'dark' ? '#ff9800' : '#e65100', strokeDasharray: '6 4' },
                textStyle: { fill: mode === 'dark' ? '#ffb74d' : '#e65100' }
            }
        ],
        theme: buildTheme(mode)
    };
}

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
            totals[name] = (totals[name] || 0) + amount;
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
