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

    it('returns 400 when name exceeds 100 characters', async () => {
        const { cookie } = await registerAndLogin(userFixture());

        const res = await request(app)
            .post('/categories')
            .set('Cookie', cookie)
            .send(categoryFixture({ name: 'A'.repeat(101) }));

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
