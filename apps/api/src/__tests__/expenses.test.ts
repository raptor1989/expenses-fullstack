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

        const res = await request(app).post('/expenses').set('Cookie', auth.cookie).send(expenseFixture(categoryId));

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

        const res = await request(app).get('/expenses/00000000-0000-0000-0000-000000000000').set('Cookie', auth.cookie);

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

describe('identifier and category ownership validation', () => {
    it('returns 400 and creates nothing when the category belongs to another user', async () => {
        const { auth: authA } = await setupUserWithCategory();
        const { categoryId: catB } = await setupUserWithCategory();

        const res = await request(app).post('/expenses').set('Cookie', authA.cookie).send(expenseFixture(catB));

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
        expect(res.body.details.categoryId).toBeDefined();

        const list = await request(app).get('/expenses').set('Cookie', authA.cookie);
        expect(list.body.pagination.total).toBe(0);
    });

    it("returns 400 and keeps the category when updating to another user's category", async () => {
        const { auth: authA, categoryId: catA } = await setupUserWithCategory();
        const { categoryId: catB } = await setupUserWithCategory();
        const created = await request(app).post('/expenses').set('Cookie', authA.cookie).send(expenseFixture(catA));

        const res = await request(app)
            .put(`/expenses/${created.body.expense.id}`)
            .set('Cookie', authA.cookie)
            .send({ categoryId: catB });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
        expect(res.body.details.categoryId).toBeDefined();

        const fetched = await request(app).get(`/expenses/${created.body.expense.id}`).set('Cookie', authA.cookie);
        expect(fetched.body.expense.categoryId).toBe(catA);
    });

    it('returns 400 when categoryId in the body is not a UUID', async () => {
        const { auth } = await setupUserWithCategory();

        const res = await request(app).post('/expenses').set('Cookie', auth.cookie).send(expenseFixture('abc'));

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
        expect(res.body.details.categoryId).toBeDefined();
    });

    it('returns 400 when the categoryId filter is not a UUID', async () => {
        const { auth } = await setupUserWithCategory();

        const res = await request(app).get('/expenses?categoryId=not-a-uuid').set('Cookie', auth.cookie);

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
        expect(res.body.details.categoryId).toBeDefined();
    });

    it.each([
        ['GET', 'get'],
        ['PUT', 'put'],
        ['DELETE', 'delete']
    ] as const)('returns 400 for a malformed id on %s /expenses/:id', async (_, method) => {
        const { auth } = await setupUserWithCategory();

        const res = await request(app)[method]('/expenses/123').set('Cookie', auth.cookie).send({ amount: 1 });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
        expect(res.body.details.id).toBeDefined();
    });
});

describe('GET /expenses?search', () => {
    async function createWithDescriptions(cookie: string, categoryId: string, descriptions: string[]) {
        for (const description of descriptions) {
            await request(app)
                .post('/expenses')
                .set('Cookie', cookie)
                .send(expenseFixture(categoryId, { description }));
        }
    }

    it('matches a description fragment case-insensitively and filters the total', async () => {
        const { auth, categoryId } = await setupUserWithCategory();
        await createWithDescriptions(auth.cookie, categoryId, ['Weekly GROCERIES', 'Fuel']);

        const res = await request(app).get('/expenses?search=groceries').set('Cookie', auth.cookie);

        expect(res.status).toBe(200);
        expect(res.body.expenses.map((e: { description: string }) => e.description)).toEqual(['Weekly GROCERIES']);
        expect(res.body.pagination.total).toBe(1);
        expect(res.body.pagination.totalPages).toBe(1);
    });

    it("never matches another user's expenses", async () => {
        const { auth: authA, categoryId: catA } = await setupUserWithCategory();
        const { auth: authB, categoryId: catB } = await setupUserWithCategory();
        await createWithDescriptions(authB.cookie, catB, ['groceries']);
        await createWithDescriptions(authA.cookie, catA, ['Fuel']);

        const res = await request(app).get('/expenses?search=groceries').set('Cookie', authA.cookie);

        expect(res.status).toBe(200);
        expect(res.body.expenses).toHaveLength(0);
        expect(res.body.pagination.total).toBe(0);
    });

    it('treats % and _ as literal characters', async () => {
        const { auth, categoryId } = await setupUserWithCategory();
        await createWithDescriptions(auth.cookie, categoryId, ['50% off', '500 PLN', 'a_b', 'axb']);

        const percent = await request(app).get('/expenses?search=50%25').set('Cookie', auth.cookie);
        const underscore = await request(app).get('/expenses?search=a_b').set('Cookie', auth.cookie);

        expect(percent.body.expenses.map((e: { description: string }) => e.description)).toEqual(['50% off']);
        expect(underscore.body.expenses.map((e: { description: string }) => e.description)).toEqual(['a_b']);
    });

    it('ignores a blank search term', async () => {
        const { auth, categoryId } = await setupUserWithCategory();
        await createWithDescriptions(auth.cookie, categoryId, ['One', 'Two']);

        const res = await request(app).get('/expenses?search=%20%20').set('Cookie', auth.cookie);

        expect(res.status).toBe(200);
        expect(res.body.pagination.total).toBe(2);
    });

    it('returns 400 when search is repeated', async () => {
        const { auth } = await setupUserWithCategory();

        const res = await request(app).get('/expenses?search=a&search=b').set('Cookie', auth.cookie);

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
        expect(res.body.details.search).toBeDefined();
    });
});

describe('GET /expenses sorting', () => {
    async function create(
        cookie: string,
        categoryId: string,
        overrides: { amount?: number; date?: string; description: string }
    ) {
        await request(app).post('/expenses').set('Cookie', cookie).send(expenseFixture(categoryId, overrides));
    }

    function descriptions(res: request.Response) {
        return res.body.expenses.map((e: { description: string }) => e.description);
    }

    it('orders by expense date, newest first, by default', async () => {
        const { auth, categoryId } = await setupUserWithCategory();
        await create(auth.cookie, categoryId, { date: '2025-01-16', description: 'yesterday' });
        // Created last but dated earlier: must not jump to the top.
        await create(auth.cookie, categoryId, { date: '2025-01-10', description: 'week ago' });

        const res = await request(app).get('/expenses').set('Cookie', auth.cookie);

        expect(res.status).toBe(200);
        expect(descriptions(res)).toEqual(['yesterday', 'week ago']);
    });

    it('orders by date ascending', async () => {
        const { auth, categoryId } = await setupUserWithCategory();
        await create(auth.cookie, categoryId, { date: '2025-01-16', description: 'later' });
        await create(auth.cookie, categoryId, { date: '2025-01-10', description: 'earlier' });

        const res = await request(app).get('/expenses?sort=date&order=asc').set('Cookie', auth.cookie);

        expect(descriptions(res)).toEqual(['earlier', 'later']);
    });

    it('orders by amount in both directions', async () => {
        const { auth, categoryId } = await setupUserWithCategory();
        await create(auth.cookie, categoryId, { amount: 30, description: 'thirty' });
        await create(auth.cookie, categoryId, { amount: 10, description: 'ten' });
        await create(auth.cookie, categoryId, { amount: 20, description: 'twenty' });

        const asc = await request(app).get('/expenses?sort=amount&order=asc').set('Cookie', auth.cookie);
        const desc = await request(app).get('/expenses?sort=amount&order=desc').set('Cookie', auth.cookie);

        expect(descriptions(asc)).toEqual(['ten', 'twenty', 'thirty']);
        expect(descriptions(desc)).toEqual(['thirty', 'twenty', 'ten']);
    });

    it('orders by creation time with sort=createdAt', async () => {
        const { auth, categoryId } = await setupUserWithCategory();
        await create(auth.cookie, categoryId, { date: '2025-01-16', description: 'created first' });
        await create(auth.cookie, categoryId, { date: '2025-01-10', description: 'created second' });

        const res = await request(app).get('/expenses?sort=createdAt').set('Cookie', auth.cookie);

        expect(descriptions(res)).toEqual(['created second', 'created first']);
    });

    it('returns 400 for an unknown sort column', async () => {
        const { auth } = await setupUserWithCategory();

        const res = await request(app).get('/expenses?sort=description').set('Cookie', auth.cookie);

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
        expect(res.body.details.sort).toBeDefined();
    });

    it('returns 400 for an unknown order', async () => {
        const { auth } = await setupUserWithCategory();

        const res = await request(app).get('/expenses?order=up').set('Cookie', auth.cookie);

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
        expect(res.body.details.order).toBeDefined();
    });
});

describe('GET /expenses/years', () => {
    it('returns the distinct expense years, newest first', async () => {
        const { auth, categoryId } = await setupUserWithCategory();
        for (const date of ['2023-06-01', '2025-01-15', '2025-08-20']) {
            await request(app).post('/expenses').set('Cookie', auth.cookie).send(expenseFixture(categoryId, { date }));
        }

        const res = await request(app).get('/expenses/years').set('Cookie', auth.cookie);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ years: [2025, 2023] });
    });

    it('returns an empty list for a user without expenses', async () => {
        const { auth } = await setupUserWithCategory();

        const res = await request(app).get('/expenses/years').set('Cookie', auth.cookie);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ years: [] });
    });

    it("ignores other users' expenses", async () => {
        const { auth: authA } = await setupUserWithCategory();
        const { auth: authB, categoryId: catB } = await setupUserWithCategory();
        await request(app)
            .post('/expenses')
            .set('Cookie', authB.cookie)
            .send(expenseFixture(catB, { date: '2020-03-03' }));

        const res = await request(app).get('/expenses/years').set('Cookie', authA.cookie);

        expect(res.body).toEqual({ years: [] });
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).get('/expenses/years');

        expect(res.status).toBe(401);
    });
});
