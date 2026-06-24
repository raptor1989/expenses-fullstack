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

describe('POST /users/register', () => {
    it('creates a new user and returns 201 with user data', async () => {
        const data = userFixture();
        const res = await request(app).post('/users/register').send(data);

        expect(res.status).toBe(201);
        expect(res.body.user).toMatchObject({
            email: data.email
        });
        expect(res.body.user.password).toBeUndefined();
        expect(res.headers['set-cookie']).toBeDefined();
    });

    it('returns 400 when email is already in use', async () => {
        const data = userFixture();
        await request(app).post('/users/register').send(data);
        const res = await request(app).post('/users/register').send(data);

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('email_in_use');
    });

    it('returns 400 for invalid email format', async () => {
        const res = await request(app)
            .post('/users/register')
            .send(userFixture({ email: 'not-an-email' }));

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
    });

    it('returns 400 when password is too short', async () => {
        const res = await request(app)
            .post('/users/register')
            .send(userFixture({ password: 'short' }));

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
    });
});

describe('POST /users/login', () => {
    it('returns 200 and sets auth cookie on valid credentials', async () => {
        const data = userFixture();
        await request(app).post('/users/register').send(data);

        const res = await request(app).post('/users/login').send({ email: data.email, password: data.password });

        expect(res.status).toBe(200);
        expect(res.headers['set-cookie']).toBeDefined();
        expect(res.body.user.email).toBe(data.email);
    });

    it('returns 401 on wrong password', async () => {
        const data = userFixture();
        await request(app).post('/users/register').send(data);

        const res = await request(app)
            .post('/users/login')
            .send({ email: data.email, password: 'WrongPassword1!' });

        expect(res.status).toBe(401);
        expect(res.body.code).toBe('invalid_credentials');
    });

    it('returns 401 when email is not registered', async () => {
        const res = await request(app)
            .post('/users/login')
            .send({ email: 'nobody@example.com', password: 'Password123!' });

        expect(res.status).toBe(401);
        expect(res.body.code).toBe('invalid_credentials');
    });
});

describe('GET /users/session', () => {
    it('returns the user when authenticated', async () => {
        const data = userFixture();
        const { cookie, email } = await registerAndLogin(data);

        const res = await request(app).get('/users/session').set('Cookie', cookie);

        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe(email);
    });

    it('returns 200 with user: null when no token is provided', async () => {
        const res = await request(app).get('/users/session');

        expect(res.status).toBe(200);
        expect(res.body.user).toBeNull();
    });

    it('returns 200 with user: null when the token is invalid', async () => {
        const res = await request(app).get('/users/session').set('Cookie', 'token=not-a-valid-token');

        expect(res.status).toBe(200);
        expect(res.body.user).toBeNull();
    });
});

describe('GET /users/profile', () => {
    it('returns user profile when authenticated', async () => {
        const data = userFixture();
        const { cookie } = await registerAndLogin(data);

        const res = await request(app).get('/users/profile').set('Cookie', cookie);

        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe(data.email);
    });

    it('returns 401 when no token is provided', async () => {
        const res = await request(app).get('/users/profile');

        expect(res.status).toBe(401);
        expect(res.body.code).toBe('auth_required');
    });
});

describe('PUT /users/profile', () => {
    it('updates first and last name', async () => {
        const data = userFixture();
        const { cookie } = await registerAndLogin(data);

        const res = await request(app)
            .put('/users/profile')
            .set('Cookie', cookie)
            .send({ firstName: 'John', lastName: 'Doe' });

        expect(res.status).toBe(200);
        expect(res.body.user.firstName).toBe('John');
        expect(res.body.user.lastName).toBe('Doe');
    });

    it('returns 401 when not authenticated', async () => {
        const res = await request(app).put('/users/profile').send({ firstName: 'John' });

        expect(res.status).toBe(401);
    });
});

describe('PUT /users/password', () => {
    it('changes the password and allows login with the new one', async () => {
        const data = userFixture();
        const { cookie } = await registerAndLogin(data);

        const res = await request(app)
            .put('/users/password')
            .set('Cookie', cookie)
            .send({ currentPassword: data.password, newPassword: 'NewPassword123!' });

        expect(res.status).toBe(200);

        const loginRes = await request(app)
            .post('/users/login')
            .send({ email: data.email, password: 'NewPassword123!' });

        expect(loginRes.status).toBe(200);
    });

    it('returns 400 when current password is incorrect', async () => {
        const data = userFixture();
        const { cookie } = await registerAndLogin(data);

        const res = await request(app)
            .put('/users/password')
            .set('Cookie', cookie)
            .send({ currentPassword: 'WrongPassword1!', newPassword: 'NewPassword123!' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('invalid_credentials');
    });

    it('returns 400 when new password is too short', async () => {
        const data = userFixture();
        const { cookie } = await registerAndLogin(data);

        const res = await request(app)
            .put('/users/password')
            .set('Cookie', cookie)
            .send({ currentPassword: data.password, newPassword: 'short' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
    });

    it('returns 401 when not authenticated', async () => {
        const res = await request(app)
            .put('/users/password')
            .send({ currentPassword: 'x', newPassword: 'NewPassword123!' });

        expect(res.status).toBe(401);
    });
});

describe('POST /users/logout', () => {
    it('clears the auth cookie', async () => {
        const { cookie } = await registerAndLogin(userFixture());

        const res = await request(app).post('/users/logout').set('Cookie', cookie);

        expect(res.status).toBe(200);
        const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
        expect(setCookie?.some((c) => c.startsWith('token=;') || c.includes('token=; '))).toBe(true);
    });
});
