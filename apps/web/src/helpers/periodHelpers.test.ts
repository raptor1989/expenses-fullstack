import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { getDashboardPeriod, getReportYears } from './periodHelpers';

const today = dayjs('2026-11-12');

describe('getDashboardPeriod', () => {
    it('this month runs from the first of the month to today', () => {
        expect(getDashboardPeriod('thisMonth', today)).toEqual({
            startDate: '2026-11-01',
            endDate: '2026-11-12',
            days: 12,
            label: 'This month'
        });
    });

    it('last 30 days is 30 days including today', () => {
        expect(getDashboardPeriod('last30Days', today)).toMatchObject({
            startDate: '2026-10-14',
            endDate: '2026-11-12',
            days: 30
        });
    });

    it('last 3 months starts the day after the same date three months ago', () => {
        expect(getDashboardPeriod('last3Months', today)).toMatchObject({
            startDate: '2026-08-13',
            endDate: '2026-11-12',
            days: 92
        });
    });

    it('last 3 months handles a month-end today', () => {
        expect(getDashboardPeriod('last3Months', dayjs('2026-05-31'))).toMatchObject({
            startDate: '2026-03-01',
            days: 92
        });
    });
});

describe('getReportYears', () => {
    it('lists every year from the oldest expense to the current year, newest first', () => {
        expect(getReportYears([2025, 2023], 2026)).toEqual([2026, 2025, 2024, 2023]);
    });

    it('lists only the current year without expenses', () => {
        expect(getReportYears([], 2026)).toEqual([2026]);
    });

    it('extends past the current year when an expense is dated later', () => {
        expect(getReportYears([2027], 2026)).toEqual([2027, 2026]);
    });
});
