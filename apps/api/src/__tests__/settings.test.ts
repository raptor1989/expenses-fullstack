import { loadTestEnv } from './helpers/env';
loadTestEnv();

import request from 'supertest';
import app from '../app';
import { truncateAllTables } from './helpers/db';
import { userFixture } from './helpers/fixtures';
import { registerAndLogin } from './helpers/auth';

beforeEach(async () => {
    await truncateAllTables();
});

afterEach(async () => {
    await truncateAllTables();
});

describe('GET /settings', () => {
    it('returns default settings created for a new user', async () => {
        const { cookie } = await registerAndLogin(userFixture());

        const res = await request(app).get('/settings').set('Cookie', cookie);

        expect(res.status).toBe(200);
        expect(res.body.settings).toMatchObject({ currency: 'PLN', theme: 'light' });
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).get('/settings');
        expect(res.status).toBe(401);
    });
});

describe('PUT /settings', () => {
    it('updates currency and theme', async () => {
        const { cookie } = await registerAndLogin(userFixture());

        const res = await request(app).put('/settings').set('Cookie', cookie).send({ currency: 'USD', theme: 'dark' });

        expect(res.status).toBe(200);
        expect(res.body.settings).toMatchObject({ currency: 'USD', theme: 'dark' });
    });

    it('returns 400 for an unsupported currency', async () => {
        const { cookie } = await registerAndLogin(userFixture());

        const res = await request(app).put('/settings').set('Cookie', cookie).send({ currency: 'XYZ' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
    });

    it('returns 400 for an invalid theme', async () => {
        const { cookie } = await registerAndLogin(userFixture());

        const res = await request(app).put('/settings').set('Cookie', cookie).send({ theme: 'blue' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).put('/settings').send({ currency: 'USD' });
        expect(res.status).toBe(401);
    });

    it("does not affect another user's settings", async () => {
        const { cookie: cookieA } = await registerAndLogin(userFixture());
        const { cookie: cookieB } = await registerAndLogin(userFixture());

        await request(app).put('/settings').set('Cookie', cookieA).send({ currency: 'USD' });

        const res = await request(app).get('/settings').set('Cookie', cookieB);

        expect(res.body.settings.currency).toBe('PLN');
    });
});
