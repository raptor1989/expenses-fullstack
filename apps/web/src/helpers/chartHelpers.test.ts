import { describe, it, expect } from 'vitest';
import { Category, ExpenseByMonth } from '@expenses/shared';
import {
    buildCategoryLabels,
    getCategoryRankingForExpenses,
    getOptionsChartLineForExpenses,
    getOptionsDoughnutChartForExpenses,
    UNKNOWN_CATEGORY_LABEL
} from './chartHelpers';

function category(id: string, name: string, color?: string): Category {
    return { id, name, color, userId: 'u1', createdAt: new Date(), updatedAt: new Date() };
}

function month(name: string, totalByCategory: Record<string, number>): ExpenseByMonth {
    const total = Object.values(totalByCategory).reduce((sum, v) => sum + v, 0);
    return { month: name, year: 2025, total, totalByCategory, topFiveMostExpensive: [] };
}

describe('buildCategoryLabels', () => {
    it('labels by name and keeps the category color', () => {
        expect(buildCategoryLabels([category('c1', 'Fuel', '#3357FF')])).toEqual({
            c1: { label: 'Fuel', color: '#3357FF' }
        });
    });

    it('makes repeated names distinguishable in list order', () => {
        const labels = buildCategoryLabels([category('a', 'Home'), category('b', 'Home'), category('c', 'Home')]);

        expect([labels.a.label, labels.b.label, labels.c.label]).toEqual(['Home', 'Home (2)', 'Home (3)']);
    });
});

describe('report helpers keyed by category id', () => {
    const months = [month('January', { c1: 100, c2: 50 }), month('February', { c1: 20 })];

    it('labels a renamed category with its current name', () => {
        const renamed = [category('c1', 'Car'), category('c2', 'General')];

        const ranking = getCategoryRankingForExpenses(months, renamed);

        expect(ranking.map((r) => [r.categoryId, r.name, r.total])).toEqual([
            ['c1', 'Car', 120],
            ['c2', 'General', 50]
        ]);
    });

    it('keeps same-named categories apart in every chart', () => {
        const twins = [category('c1', 'Home'), category('c2', 'Home')];

        const doughnut = getOptionsDoughnutChartForExpenses(months, twins);
        const line = getOptionsChartLineForExpenses(months, twins, 'light');

        expect(doughnut.map((d) => [d.id, d.label, d.value])).toEqual([
            ['c1', 'Home', 120],
            ['c2', 'Home (2)', 50]
        ]);
        expect(line.data.map((s) => s.id)).toEqual(['Home', 'Home (2)']);
        expect(line.data[1].data.map((p) => p.y)).toEqual([50, 0]);
    });

    it('labels an id without a category as Unknown', () => {
        const ranking = getCategoryRankingForExpenses([month('March', { missing: 5 })], []);

        expect(ranking[0].name).toBe(UNKNOWN_CATEGORY_LABEL);
    });
});
