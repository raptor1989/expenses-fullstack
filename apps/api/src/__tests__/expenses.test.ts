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

/** Helper: create a user with a custom category and return both */
async function setupUserWithCategory() {
    const auth = await registerAndLogin(userFixture());
    const catRes = await request(app).post('/categories').set('Cookie', auth.cookie).send(categoryFixture());
    return { auth, categoryId: catRes.body.category.id as string };
}

describe('POST /expenses', () => {
    it('creates an expense and returns 201', async () => {
        const { auth, categoryId } = await setupUserWithCategory();

        const res = await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(categoryId));

        expect(res.status).toBe(201);
        expect(res.body.expense.amount).toBe(42.5);
        expect(res.body.expense.categoryId).toBe(categoryId);
    });

    it('returns 400 when amount is missing', async () => {
        const { auth, categoryId } = await setupUserWithCategory();

        const res = await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send({ description: 'Test', date: '2025-01-15', categoryId });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
    });

    it('returns 400 when amount is negative', async () => {
        const { auth, categoryId } = await setupUserWithCategory();

        const res = await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(categoryId, { amount: -10 }));

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
    });

    it('returns 400 when description is missing', async () => {
        const { auth, categoryId } = await setupUserWithCategory();

        const res = await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send({ amount: 10, date: '2025-01-15', categoryId });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
    });

    it('returns 400 when date is not ISO 8601', async () => {
        const { auth, categoryId } = await setupUserWithCategory();

        const res = await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(categoryId, { date: '15-01-2025' }));

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app)
            .post('/expenses')
            .send({ amount: 10, description: 'Test', date: '2025-01-15', categoryId: 'anything' });

        expect(res.status).toBe(401);
    });
});

describe('GET /expenses', () => {
    it('returns paginated expenses for the current user', async () => {
        const { auth, categoryId } = await setupUserWithCategory();

        await request(app).post('/expenses').set('Cookie', auth.cookie).send(expenseFixture(categoryId));

        const res = await request(app).get('/expenses').set('Cookie', auth.cookie);

        expect(res.status).toBe(200);
        expect(res.body.expenses).toHaveLength(1);
        expect(res.body.pagination.total).toBe(1);
    });

    it('respects limit and page query params', async () => {
        const { auth, categoryId } = await setupUserWithCategory();

        // Create 3 expenses
        for (let i = 0; i < 3; i++) {
            await request(app)
                .post('/expenses')
                .set('Cookie', auth.cookie)
                .send(expenseFixture(categoryId, { description: `Expense ${i}` }));
        }

        const res = await request(app).get('/expenses?limit=2&page=1').set('Cookie', auth.cookie);

        expect(res.status).toBe(200);
        expect(res.body.expenses).toHaveLength(2);
        expect(res.body.pagination.totalPages).toBe(2);
    });

    it('filters expenses by date range', async () => {
        const { auth, categoryId } = await setupUserWithCategory();

        await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(categoryId, { date: '2025-01-10' }));

        await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(categoryId, { date: '2025-06-20' }));

        const res = await request(app)
            .get('/expenses?startDate=2025-01-01&endDate=2025-03-31')
            .set('Cookie', auth.cookie);

        expect(res.status).toBe(200);
        expect(res.body.expenses).toHaveLength(1);
    });

    it('does not return expenses belonging to another user', async () => {
        const { auth: authA, categoryId: catA } = await setupUserWithCategory();
        const { auth: authB, categoryId: catB } = await setupUserWithCategory();

        await request(app)
            .post('/expenses')
            .set('Cookie', authB.cookie)
            .send(expenseFixture(catB, { description: 'B expense' }));

        const res = await request(app).get('/expenses').set('Cookie', authA.cookie);

        expect(res.status).toBe(200);
        expect(res.body.expenses).toHaveLength(0);
        // suppress unused variable warning
        void catA;
    });
});

describe('GET /expenses/:id', () => {
    it('returns own expense by id', async () => {
        const { auth, categoryId } = await setupUserWithCategory();
        const created = await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(categoryId));

        const res = await request(app).get(`/expenses/${created.body.expense.id}`).set('Cookie', auth.cookie);

        expect(res.status).toBe(200);
        expect(res.body.expense.id).toBe(created.body.expense.id);
    });

    it("returns 404 for another user's expense", async () => {
        const { auth: authA } = await setupUserWithCategory();
        const { auth: authB, categoryId: catB } = await setupUserWithCategory();

        const created = await request(app).post('/expenses').set('Cookie', authB.cookie).send(expenseFixture(catB));

        const res = await request(app).get(`/expenses/${created.body.expense.id}`).set('Cookie', authA.cookie);

        expect(res.status).toBe(404);
    });

    it('returns 404 for a non-existent id', async () => {
        const { auth } = await setupUserWithCategory();

        const res = await request(app)
            .get('/expenses/00000000-0000-0000-0000-000000000000')
            .set('Cookie', auth.cookie);

        expect(res.status).toBe(404);
    });
});

describe('PUT /expenses/:id', () => {
    it('updates expense amount and description', async () => {
        const { auth, categoryId } = await setupUserWithCategory();
        const created = await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(categoryId));

        const res = await request(app)
            .put(`/expenses/${created.body.expense.id}`)
            .set('Cookie', auth.cookie)
            .send({ amount: 99.99, description: 'Updated' });

        expect(res.status).toBe(200);
        expect(res.body.expense.amount).toBe(99.99);
        expect(res.body.expense.description).toBe('Updated');
    });

    it("returns 404 when updating another user's expense", async () => {
        const { auth: authA } = await setupUserWithCategory();
        const { auth: authB, categoryId: catB } = await setupUserWithCategory();

        const created = await request(app).post('/expenses').set('Cookie', authB.cookie).send(expenseFixture(catB));

        const res = await request(app)
            .put(`/expenses/${created.body.expense.id}`)
            .set('Cookie', authA.cookie)
            .send({ amount: 1 });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /expenses/:id', () => {
    it('deletes own expense', async () => {
        const { auth, categoryId } = await setupUserWithCategory();
        const created = await request(app)
            .post('/expenses')
            .set('Cookie', auth.cookie)
            .send(expenseFixture(categoryId));

        const res = await request(app).delete(`/expenses/${created.body.expense.id}`).set('Cookie', auth.cookie);

        expect(res.status).toBe(200);
    });

    it("returns 404 when deleting another user's expense", async () => {
        const { auth: authA } = await setupUserWithCategory();
        const { auth: authB, categoryId: catB } = await setupUserWithCategory();

        const created = await request(app).post('/expenses').set('Cookie', authB.cookie).send(expenseFixture(catB));

        const res = await request(app).delete(`/expenses/${created.body.expense.id}`).set('Cookie', authA.cookie);

        expect(res.status).toBe(404);
    });
});
