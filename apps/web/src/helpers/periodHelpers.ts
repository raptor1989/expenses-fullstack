import dayjs, { Dayjs } from 'dayjs';

export type DashboardPeriod = 'thisMonth' | 'last30Days' | 'last3Months';

export const DASHBOARD_PERIOD_LABELS: Record<DashboardPeriod, string> = {
    thisMonth: 'This month',
    last30Days: 'Last 30 days',
    last3Months: 'Last 3 months'
};

export interface DashboardPeriodRange {
    startDate: string;
    endDate: string;
    /** Calendar days in the period, both ends included. */
    days: number;
    label: string;
}

/** Date range of a Dashboard summary period; every period ends today. */
export function getDashboardPeriod(period: DashboardPeriod, today: Dayjs = dayjs()): DashboardPeriodRange {
    const end = today.startOf('day');
    let start: Dayjs;
    if (period === 'thisMonth') {
        start = end.startOf('month');
    } else if (period === 'last30Days') {
        start = end.subtract(29, 'day');
    } else {
        start = end.subtract(3, 'month').add(1, 'day');
    }
    return {
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD'),
        days: end.diff(start, 'day') + 1,
        label: DASHBOARD_PERIOD_LABELS[period]
    };
}

/** Every year from the oldest expense year to the later of `currentYear` and the newest one, newest first. */
export function getReportYears(expenseYears: number[], currentYear: number): number[] {
    const all = [...expenseYears, currentYear];
    const newest = Math.max(...all);
    const oldest = Math.min(...all);
    return Array.from({ length: newest - oldest + 1 }, (_, i) => newest - i);
}
