import { loadTestEnv } from './helpers/env';
loadTestEnv();

import request from 'supertest';
import app from '../app';
import { truncateAllTables } from './helpers/db';
import { userFixture, categoryFixture, expenseFixture } from './helpers/fixtures';
import { registerAndLogin } from './helpers/auth';

beforeEach(async () => {
    await truncateAllTables();
});

afterEach(async () => {
    await truncateAllTables();
});

describe('GET /expenses/summary', () => {
    it('returns category breakdown for a date range', async () => {
        const auth = await registerAndLogin(userFixture());
        const catRes = await request(app).post('/categories').set('Cookie', auth.cookie).send(categoryFixture());
        const categoryId = catRes.body.category.id as string;

        await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(categoryId, { amount: 100, date: '2025-02-10' }));

        await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(categoryId, { amount: 50, date: '2025-02-15' }));

        const res = await request(app)
            .get('/expenses/summary?startDate=2025-02-01&endDate=2025-02-28')
            .set('Cookie', auth.cookie);

        expect(res.status).toBe(200);
        expect(res.body.summary.totalAmount).toBeCloseTo(150, 1);
        expect(res.body.summary.categoryBreakdown).toHaveLength(1);
        expect(res.body.summary.categoryBreakdown[0].percentage).toBeCloseTo(100, 0);
    });

    it('returns empty result when no expenses match the range', async () => {
        const auth = await registerAndLogin(userFixture());

        const res = await request(app)
            .get('/expenses/summary?startDate=2020-01-01&endDate=2020-01-31')
            .set('Cookie', auth.cookie);

        expect(res.status).toBe(200);
        expect(res.body.summary.totalAmount).toBe(0);
        expect(res.body.summary.categoryBreakdown).toHaveLength(0);
    });

    it('returns 400 when startDate is missing', async () => {
        const auth = await registerAndLogin(userFixture());

        const res = await request(app).get('/expenses/summary?endDate=2025-02-28').set('Cookie', auth.cookie);

        expect(res.status).toBe(400);
    });

    it('returns 400 when endDate is missing', async () => {
        const auth = await registerAndLogin(userFixture());

        const res = await request(app).get('/expenses/summary?startDate=2025-02-01').set('Cookie', auth.cookie);

        expect(res.status).toBe(400);
    });
});

describe('GET /expenses/by-month', () => {
    it('returns monthly breakdown for a given year', async () => {
        const auth = await registerAndLogin(userFixture());
        const catRes = await request(app).post('/categories').set('Cookie', auth.cookie).send(categoryFixture());
        const categoryId = catRes.body.category.id as string;

        await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(categoryId, { amount: 200, date: '2025-03-05' }));

        await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(categoryId, { amount: 80, date: '2025-07-20' }));

        const res = await request(app).get('/expenses/by-month?year=2025').set('Cookie', auth.cookie);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.monthlyData)).toBe(true);

        const months = res.body.monthlyData as Array<{ month: string; year: number; total: number }>;
        const march = months.find((m) => m.month === 'March');
        const july = months.find((m) => m.month === 'July');

        expect(march).toBeDefined();
        expect(march!.total).toBeCloseTo(200, 1);
        expect(july).toBeDefined();
        expect(july!.total).toBeCloseTo(80, 1);
    });

    it('returns per-month category breakdown and top expenses', async () => {
        const auth = await registerAndLogin(userFixture());
        const groceriesRes = await request(app)
            .post('/categories')
            .set('Cookie', auth.cookie)
            .send(categoryFixture({ name: 'Groceries' }));
        const groceriesId = groceriesRes.body.category.id as string;

        const fuelRes = await request(app)
            .post('/categories')
            .set('Cookie', auth.cookie)
            .send(categoryFixture({ name: 'Fuel' }));
        const fuelId = fuelRes.body.category.id as string;

        await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(groceriesId, { amount: 100, date: '2025-03-05', description: 'Big shop' }));

        await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(groceriesId, { amount: 50, date: '2025-03-12', description: 'Top up' }));

        await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(fuelId, { amount: 60, date: '2025-03-20', description: 'Fill tank' }));

        const res = await request(app).get('/expenses/by-month?year=2025').set('Cookie', auth.cookie);

        expect(res.status).toBe(200);
        const months = res.body.monthlyData as Array<{
            month: string;
            total: number;
            totalByCategory: Record<string, number>;
            topFiveMostExpensive: Array<{ description: string; amount: number }>;
        }>;
        const march = months.find((m) => m.month === 'March');

        expect(march).toBeDefined();
        expect(march!.total).toBeCloseTo(210, 1);
        expect(march!.totalByCategory.Groceries).toBeCloseTo(150, 1);
        expect(march!.totalByCategory.Fuel).toBeCloseTo(60, 1);
        expect(march!.topFiveMostExpensive).toHaveLength(3);
        expect(march!.topFiveMostExpensive[0].description).toBe('Big shop');
        expect(march!.topFiveMostExpensive[0].amount).toBeCloseTo(100, 1);
    });

    it('returns 400 when year is missing', async () => {
        const auth = await registerAndLogin(userFixture());

        const res = await request(app).get('/expenses/by-month').set('Cookie', auth.cookie);

        expect(res.status).toBe(400);
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).get('/expenses/by-month?year=2025');
        expect(res.status).toBe(401);
    });
});
