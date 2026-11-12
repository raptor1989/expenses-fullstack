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

describe('GET /categories', () => {
    it('returns the 5 default categories created at registration', async () => {
        const { cookie } = await registerAndLogin(userFixture());

        const res = await request(app).get('/categories').set('Cookie', cookie);

        expect(res.status).toBe(200);
        expect(res.body.categories).toHaveLength(5);
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).get('/categories');
        expect(res.status).toBe(401);
    });

    it('does not return categories belonging to another user', async () => {
        const { cookie: cookieA } = await registerAndLogin(userFixture());
        const { cookie: cookieB } = await registerAndLogin(userFixture());

        // User B creates an extra category
        await request(app)
            .post('/categories')
            .set('Cookie', cookieB)
            .send(categoryFixture({ name: 'B Only' }));

        const res = await request(app).get('/categories').set('Cookie', cookieA);

        expect(res.status).toBe(200);
        const names = res.body.categories.map((c: { name: string }) => c.name);
        expect(names).not.toContain('B Only');
    });
});

describe('POST /categories', () => {
    it('creates a new category and returns 201', async () => {
        const { cookie } = await registerAndLogin(userFixture());
        const data = categoryFixture();

        const res = await request(app).post('/categories').set('Cookie', cookie).send(data);

        expect(res.status).toBe(201);
        expect(res.body.category.name).toBe(data.name);
    });

    it('returns 400 when name is missing', async () => {
        const { cookie } = await registerAndLogin(userFixture());

        const res = await request(app).post('/categories').set('Cookie', cookie).send({ color: '#AABBCC' });

        expect(res.status).toBe(400);
    });

    it('returns 400 when name exceeds 50 characters', async () => {
        const { cookie } = await registerAndLogin(userFixture());

        const res = await request(app)
            .post('/categories')
            .set('Cookie', cookie)
            .send(categoryFixture({ name: 'A'.repeat(51) }));

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
    });

    it('returns 400 when color is not a valid hex', async () => {
        const { cookie } = await registerAndLogin(userFixture());

        const res = await request(app)
            .post('/categories')
            .set('Cookie', cookie)
            .send(categoryFixture({ color: 'red' }));

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).post('/categories').send(categoryFixture());

        expect(res.status).toBe(401);
    });
});

describe('GET /categories/:id', () => {
    it('returns own category by id', async () => {
        const { cookie } = await registerAndLogin(userFixture());
        const created = await request(app).post('/categories').set('Cookie', cookie).send(categoryFixture());

        const res = await request(app).get(`/categories/${created.body.category.id}`).set('Cookie', cookie);

        expect(res.status).toBe(200);
        expect(res.body.category.id).toBe(created.body.category.id);
    });

    it("returns 404 for another user's category", async () => {
        const { cookie: cookieA } = await registerAndLogin(userFixture());
        const { cookie: cookieB } = await registerAndLogin(userFixture());

        const created = await request(app).post('/categories').set('Cookie', cookieB).send(categoryFixture());

        const res = await request(app).get(`/categories/${created.body.category.id}`).set('Cookie', cookieA);

        expect(res.status).toBe(404);
    });

    it('returns 404 for a non-existent id', async () => {
        const { cookie } = await registerAndLogin(userFixture());

        const res = await request(app).get('/categories/00000000-0000-0000-0000-000000000000').set('Cookie', cookie);

        expect(res.status).toBe(404);
    });
});

describe('PUT /categories/:id', () => {
    it('updates category name', async () => {
        const { cookie } = await registerAndLogin(userFixture());
        const created = await request(app).post('/categories').set('Cookie', cookie).send(categoryFixture());

        const res = await request(app)
            .put(`/categories/${created.body.category.id}`)
            .set('Cookie', cookie)
            .send({ name: 'Updated Name' });

        expect(res.status).toBe(200);
        expect(res.body.category.name).toBe('Updated Name');
    });

    it("returns 404 when updating another user's category", async () => {
        const { cookie: cookieA } = await registerAndLogin(userFixture());
        const { cookie: cookieB } = await registerAndLogin(userFixture());

        const created = await request(app).post('/categories').set('Cookie', cookieB).send(categoryFixture());

        const res = await request(app)
            .put(`/categories/${created.body.category.id}`)
            .set('Cookie', cookieA)
            .send({ name: 'Hijacked' });

        expect(res.status).toBe(404);
    });
});

describe('DELETE /categories/:id', () => {
    it('deletes a category with no linked expenses and returns 200', async () => {
        const { cookie } = await registerAndLogin(userFixture());
        const created = await request(app).post('/categories').set('Cookie', cookie).send(categoryFixture());

        const res = await request(app).delete(`/categories/${created.body.category.id}`).set('Cookie', cookie);

        expect(res.status).toBe(200);
    });

    it('returns 400 with category_has_expenses when expenses exist', async () => {
        const { cookie } = await registerAndLogin(userFixture());
        const catRes = await request(app).post('/categories').set('Cookie', cookie).send(categoryFixture());

        const categoryId = catRes.body.category.id;

        await request(app).post('/expenses').set('Cookie', cookie).send(expenseFixture(categoryId));

        const res = await request(app).delete(`/categories/${categoryId}`).set('Cookie', cookie);

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('category_has_expenses');
    });

    it("returns 404 when deleting another user's category", async () => {
        const { cookie: cookieA } = await registerAndLogin(userFixture());
        const { cookie: cookieB } = await registerAndLogin(userFixture());

        const created = await request(app).post('/categories').set('Cookie', cookieB).send(categoryFixture());

        const res = await request(app).delete(`/categories/${created.body.category.id}`).set('Cookie', cookieA);

        expect(res.status).toBe(404);
    });
});

describe('category identifier validation', () => {
    it.each([
        ['GET', 'get'],
        ['PUT', 'put'],
        ['DELETE', 'delete']
    ] as const)('returns 400 for a malformed id on %s /categories/:id', async (_, method) => {
        const { cookie } = await registerAndLogin(userFixture());

        const res = await request(app)[method]('/categories/xyz').set('Cookie', cookie).send({ name: 'X' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
        expect(res.body.details.id).toBeDefined();
    });
});

describe('category expense counts and delete with moveTo', () => {
    async function setup() {
        const auth = await registerAndLogin(userFixture());
        const source = await request(app).post('/categories').set('Cookie', auth.cookie).send(categoryFixture());
        const target = await request(app).post('/categories').set('Cookie', auth.cookie).send(categoryFixture());
        return {
            cookie: auth.cookie,
            sourceId: source.body.category.id as string,
            targetId: target.body.category.id as string
        };
    }

    async function addExpenses(cookie: string, categoryId: string, count: number) {
        for (let i = 0; i < count; i++) {
            await request(app).post('/expenses').set('Cookie', cookie).send(expenseFixture(categoryId));
        }
    }

    async function countIn(cookie: string, categoryId: string) {
        const res = await request(app).get(`/expenses?categoryId=${categoryId}`).set('Cookie', cookie);
        return res.body.pagination.total as number;
    }

    it("returns each category's expenseCount", async () => {
        const { cookie, sourceId, targetId } = await setup();
        await addExpenses(cookie, sourceId, 2);

        const res = await request(app).get('/categories').set('Cookie', cookie);

        const byId = new Map(
            res.body.categories.map((c: { id: string; expenseCount: number }) => [c.id, c.expenseCount])
        );
        expect(byId.get(sourceId)).toBe(2);
        expect(byId.get(targetId)).toBe(0);
    });

    it('moves the expenses to the target and deletes the category', async () => {
        const { cookie, sourceId, targetId } = await setup();
        await addExpenses(cookie, sourceId, 3);

        const res = await request(app).delete(`/categories/${sourceId}?moveTo=${targetId}`).set('Cookie', cookie);

        expect(res.status).toBe(200);
        expect(res.body.message).toBeDefined();
        const list = await request(app).get('/categories').set('Cookie', cookie);
        expect(list.body.categories.map((c: { id: string }) => c.id)).not.toContain(sourceId);
        expect(await countIn(cookie, targetId)).toBe(3);
    });

    it('returns 400 when moveTo is the deleted category, in any letter case', async () => {
        const { cookie, sourceId } = await setup();
        await addExpenses(cookie, sourceId, 1);

        const same = await request(app).delete(`/categories/${sourceId}?moveTo=${sourceId}`).set('Cookie', cookie);
        const upper = await request(app)
            .delete(`/categories/${sourceId}?moveTo=${sourceId.toUpperCase()}`)
            .set('Cookie', cookie);

        for (const res of [same, upper]) {
            expect(res.status).toBe(400);
            expect(res.body.code).toBe('validation_error');
            expect(res.body.details.moveTo).toBeDefined();
        }
        expect(await countIn(cookie, sourceId)).toBe(1);
    });

    it("returns 400 and changes nothing when moveTo is another user's category", async () => {
        const { cookie, sourceId } = await setup();
        const other = await setup();
        await addExpenses(cookie, sourceId, 2);

        const res = await request(app).delete(`/categories/${sourceId}?moveTo=${other.targetId}`).set('Cookie', cookie);

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
        expect(res.body.details.moveTo).toBeDefined();
        expect(await countIn(cookie, sourceId)).toBe(2);
        expect(await countIn(other.cookie, other.targetId)).toBe(0);
    });

    it('returns 400 for a malformed moveTo', async () => {
        const { cookie, sourceId } = await setup();

        const res = await request(app).delete(`/categories/${sourceId}?moveTo=nope`).set('Cookie', cookie);

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
        expect(res.body.details.moveTo).toBeDefined();
    });

    it("returns 404 when the source is unknown or another user's, even with moveTo", async () => {
        const { cookie, targetId } = await setup();
        const other = await setup();

        const unknown = await request(app)
            .delete(`/categories/00000000-0000-0000-0000-000000000000?moveTo=${targetId}`)
            .set('Cookie', cookie);
        const foreign = await request(app)
            .delete(`/categories/${other.sourceId}?moveTo=${targetId}`)
            .set('Cookie', cookie);

        expect(unknown.status).toBe(404);
        expect(foreign.status).toBe(404);
        expect(foreign.body.code).toBe('category_not_found');
    });
});
