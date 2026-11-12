import { loadTestEnv } from './helpers/env';
loadTestEnv();

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createTransport } from 'nodemailer';
import app from '../app';
import { truncateAllTables, getTestPool } from './helpers/db';
import { userFixture } from './helpers/fixtures';
import { registerAndLogin } from './helpers/auth';

const mockSendMail = jest.fn();
jest.mock('nodemailer', () => ({ createTransport: jest.fn(() => ({ sendMail: mockSendMail })) }));

beforeEach(async () => {
    await truncateAllTables();
});

afterEach(async () => {
    await truncateAllTables();
});

function extractToken(logSpy: jest.SpyInstance): string {
    const call = logSpy.mock.calls.find((args) => String(args[0]).includes('Password reset link'));
    const match = call ? String(call[0]).match(/token=([a-f0-9]+)/) : null;
    if (!match) {
        throw new Error('Reset link was not logged to the console');
    }
    return match[1];
}

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

        const res = await request(app).post('/users/login').send({ email: data.email, password: 'WrongPassword1!' });

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
    it('updates the email', async () => {
        const data = userFixture();
        const { cookie } = await registerAndLogin(data);

        const res = await request(app).put('/users/profile').set('Cookie', cookie).send({ email: 'updated@example.com' });

        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe('updated@example.com');
    });

    it('returns 401 when not authenticated', async () => {
        const res = await request(app).put('/users/profile').send({ email: 'updated@example.com' });

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

    it('signs out other sessions and keeps the current one through a fresh cookie', async () => {
        const data = userFixture();
        const { cookie } = await registerAndLogin(data);
        const otherLogin = await request(app).post('/users/login').send(data);
        const otherCookie = (otherLogin.headers['set-cookie'] as unknown as string[])[0];

        const res = await request(app)
            .put('/users/password')
            .set('Cookie', cookie)
            .send({ currentPassword: data.password, newPassword: 'NewPassword123!' });
        expect(res.status).toBe(200);
        const freshCookie = (res.headers['set-cookie'] as unknown as string[] | undefined)?.[0];
        expect(freshCookie).toMatch(/^token=/);

        const otherRes = await request(app).get('/users/profile').set('Cookie', otherCookie);
        expect(otherRes.status).toBe(401);
        expect(otherRes.body.code).toBe('invalid_token');

        const oldCookieRes = await request(app).get('/users/profile').set('Cookie', cookie);
        expect(oldCookieRes.status).toBe(401);

        const freshRes = await request(app).get('/users/profile').set('Cookie', freshCookie!);
        expect(freshRes.status).toBe(200);
        expect(freshRes.body.user.email).toBe(data.email);
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

describe('POST /users/forgot-password', () => {
    it('returns 200 with a generic message when the email is registered', async () => {
        const data = userFixture();
        await request(app).post('/users/register').send(data);

        const res = await request(app).post('/users/forgot-password').send({ email: data.email });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/if that email is registered/i);
    });

    it('returns the same generic message when the email is not registered', async () => {
        const res = await request(app).post('/users/forgot-password').send({ email: 'nobody@example.com' });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/if that email is registered/i);
    });

    it('returns 400 for an invalid email format', async () => {
        const res = await request(app).post('/users/forgot-password').send({ email: 'not-an-email' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
    });

    it('logs a reset link only for emails that exist', async () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        await request(app).post('/users/forgot-password').send({ email: 'nobody@example.com' });
        expect(logSpy.mock.calls.some((args) => String(args[0]).includes('Password reset link'))).toBe(false);

        const data = userFixture();
        await request(app).post('/users/register').send(data);
        await request(app).post('/users/forgot-password').send({ email: data.email });
        expect(logSpy.mock.calls.some((args) => String(args[0]).includes('Password reset link'))).toBe(true);

        logSpy.mockRestore();
    });

    it('does not try to send mail while SMTP is not configured', async () => {
        jest.mocked(createTransport).mockClear();
        const data = userFixture();
        await request(app).post('/users/register').send(data);

        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        await request(app).post('/users/forgot-password').send({ email: data.email });
        logSpy.mockRestore();

        expect(createTransport).not.toHaveBeenCalled();
    });

    it('tells the user to ask the administrator instead of promising an e-mail', async () => {
        const data = userFixture();
        await request(app).post('/users/register').send(data);

        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const registered = await request(app).post('/users/forgot-password').send({ email: data.email });
        logSpy.mockRestore();
        const unknown = await request(app).post('/users/forgot-password').send({ email: 'nobody@example.com' });

        expect(registered.body.message).toMatch(/ask the administrator/i);
        expect(registered.body.message).not.toMatch(/inbox/i);
        expect(unknown.body.message).toBe(registered.body.message);
    });
});

describe('POST /users/forgot-password with SMTP configured', () => {
    beforeEach(() => {
        process.env.SMTP_HOST = 'smtp.example.com';
        process.env.MAIL_FROM = 'Expense Manager <no-reply@example.com>';
        jest.mocked(createTransport).mockClear();
        mockSendMail.mockReset().mockResolvedValue({ messageId: 'test' });
    });

    afterEach(() => {
        process.env.SMTP_HOST = '';
        delete process.env.MAIL_FROM;
    });

    it('emails a working reset link instead of logging it', async () => {
        const data = userFixture();
        await request(app).post('/users/register').send(data);

        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        const res = await request(app).post('/users/forgot-password').send({ email: data.email });
        const loggedLink = logSpy.mock.calls.some((args) => String(args[0]).includes('Password reset link'));
        logSpy.mockRestore();

        expect(res.status).toBe(200);
        expect(loggedLink).toBe(false);
        expect(createTransport).toHaveBeenCalledWith(
            expect.objectContaining({ host: 'smtp.example.com', port: 587, secure: false })
        );
        expect(mockSendMail).toHaveBeenCalledTimes(1);

        const mail = mockSendMail.mock.calls[0][0];
        expect(mail).toMatchObject({ to: data.email, from: 'Expense Manager <no-reply@example.com>' });
        const token = String(mail.text).match(/\/reset-password\?token=([a-f0-9]+)/)?.[1];
        expect(mail.html).toContain(`/reset-password?token=${token}`);

        const resetRes = await request(app)
            .post('/users/reset-password')
            .send({ token, newPassword: 'NewPassword123!' });
        expect(resetRes.status).toBe(200);
    });

    it('does not send mail for an unknown email', async () => {
        const res = await request(app).post('/users/forgot-password').send({ email: 'nobody@example.com' });

        expect(res.status).toBe(200);
        expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('promises an e-mail with the same message for known and unknown emails', async () => {
        const data = userFixture();
        await request(app).post('/users/register').send(data);

        const registered = await request(app).post('/users/forgot-password').send({ email: data.email });
        const unknown = await request(app).post('/users/forgot-password').send({ email: 'nobody@example.com' });

        expect(registered.body.message).toMatch(/check your inbox/i);
        expect(unknown.body.message).toBe(registered.body.message);
    });

    it('still answers 200 with the generic message when sending fails', async () => {
        const data = userFixture();
        await request(app).post('/users/register').send(data);
        mockSendMail.mockRejectedValue(new Error('SMTP unavailable'));

        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = await request(app).post('/users/forgot-password').send({ email: data.email });
        await new Promise((resolve) => setImmediate(resolve));
        const loggedFailure = errorSpy.mock.calls.some((args) =>
            String(args[0]).includes('Failed to send password reset email')
        );
        errorSpy.mockRestore();

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/if that email is registered/i);
        expect(loggedFailure).toBe(true);
    });
});

describe('POST /users/reset-password', () => {
    it('resets the password with a valid token and allows login with the new password', async () => {
        const data = userFixture();
        await request(app).post('/users/register').send(data);

        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        await request(app).post('/users/forgot-password').send({ email: data.email });
        const token = extractToken(logSpy);
        logSpy.mockRestore();

        const res = await request(app).post('/users/reset-password').send({ token, newPassword: 'NewPassword123!' });

        expect(res.status).toBe(200);

        const loginRes = await request(app)
            .post('/users/login')
            .send({ email: data.email, password: 'NewPassword123!' });

        expect(loginRes.status).toBe(200);
    });

    it('returns 400 with reset_token_invalid for a bogus token', async () => {
        const res = await request(app)
            .post('/users/reset-password')
            .send({ token: 'a'.repeat(64), newPassword: 'NewPassword123!' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('reset_token_invalid');
    });

    it('returns 400 with reset_token_expired for an expired token', async () => {
        const data = userFixture();
        await request(app).post('/users/register').send(data);

        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        await request(app).post('/users/forgot-password').send({ email: data.email });
        const token = extractToken(logSpy);
        logSpy.mockRestore();

        await getTestPool().query("UPDATE users SET reset_token_expires_at = NOW() - INTERVAL '1 hour' WHERE email = $1", [
            data.email
        ]);

        const res = await request(app).post('/users/reset-password').send({ token, newPassword: 'NewPassword123!' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('reset_token_expired');
    });

    it('returns 400 when the new password is too short', async () => {
        const res = await request(app)
            .post('/users/reset-password')
            .send({ token: 'a'.repeat(64), newPassword: 'short' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
    });

    it('rejects reusing the same token after a successful reset', async () => {
        const data = userFixture();
        await request(app).post('/users/register').send(data);

        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        await request(app).post('/users/forgot-password').send({ email: data.email });
        const token = extractToken(logSpy);
        logSpy.mockRestore();

        await request(app).post('/users/reset-password').send({ token, newPassword: 'NewPassword123!' });
        const res = await request(app).post('/users/reset-password').send({ token, newPassword: 'AnotherPassword456!' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('reset_token_invalid');
    });

    it('signs out every session opened before the reset', async () => {
        const data = userFixture();
        const { cookie } = await registerAndLogin(data);

        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        await request(app).post('/users/forgot-password').send({ email: data.email });
        const token = extractToken(logSpy);
        logSpy.mockRestore();

        await request(app).post('/users/reset-password').send({ token, newPassword: 'NewPassword123!' });

        const profileRes = await request(app).get('/users/profile').set('Cookie', cookie);
        expect(profileRes.status).toBe(401);
        expect(profileRes.body.code).toBe('invalid_token');

        const sessionRes = await request(app).get('/users/session').set('Cookie', cookie);
        expect(sessionRes.status).toBe(200);
        expect(sessionRes.body).toEqual({ user: null });

        const loginRes = await request(app)
            .post('/users/login')
            .send({ email: data.email, password: 'NewPassword123!' });
        const newCookie = (loginRes.headers['set-cookie'] as unknown as string[])[0];
        const newProfileRes = await request(app).get('/users/profile').set('Cookie', newCookie);
        expect(newProfileRes.status).toBe(200);
    });

    it('accepts tokens issued before token versions existed until the next reset', async () => {
        const data = userFixture();
        const { userId, email } = await registerAndLogin(data);
        const legacyToken = jwt.sign({ id: userId, email }, process.env.JWT_SECRET!, { expiresIn: '1h' });

        const beforeRes = await request(app).get('/users/profile').set('Authorization', `Bearer ${legacyToken}`);
        expect(beforeRes.status).toBe(200);

        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        await request(app).post('/users/forgot-password').send({ email: data.email });
        const token = extractToken(logSpy);
        logSpy.mockRestore();
        await request(app).post('/users/reset-password').send({ token, newPassword: 'NewPassword123!' });

        const afterRes = await request(app).get('/users/profile').set('Authorization', `Bearer ${legacyToken}`);
        expect(afterRes.status).toBe(401);
        expect(afterRes.body.code).toBe('invalid_token');
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

describe('PUT /users/profile validation', () => {
    it('returns 400 with details.email for an invalid address', async () => {
        const data = userFixture();
        const { cookie } = await registerAndLogin(data);

        const res = await request(app).put('/users/profile').set('Cookie', cookie).send({ email: 'not-an-email' });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('validation_error');
        expect(res.body.details.email).toBeDefined();

        const profile = await request(app).get('/users/profile').set('Cookie', cookie);
        expect(profile.body.user.email).toBe(data.email);
    });

    it("returns 400 email_in_use for another account's address and changes nothing", async () => {
        const dataA = userFixture();
        const dataB = userFixture();
        const { cookie: cookieA } = await registerAndLogin(dataA);
        const { cookie: cookieB } = await registerAndLogin(dataB);

        const res = await request(app).put('/users/profile').set('Cookie', cookieA).send({ email: dataB.email });

        expect(res.status).toBe(400);
        expect(res.body.code).toBe('email_in_use');
        expect(res.body.message).toBe('User with this email already exists');

        const profileA = await request(app).get('/users/profile').set('Cookie', cookieA);
        const profileB = await request(app).get('/users/profile').set('Cookie', cookieB);
        expect(profileA.body.user.email).toBe(dataA.email);
        expect(profileB.body.user.email).toBe(dataB.email);
    });

    it('accepts the current address of the same account', async () => {
        const data = userFixture();
        const { cookie } = await registerAndLogin(data);

        const res = await request(app).put('/users/profile').set('Cookie', cookie).send({ email: data.email });

        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe(data.email);
    });

    it('trims and normalizes the address like registration does', async () => {
        const { cookie } = await registerAndLogin(userFixture());

        const res = await request(app)
            .put('/users/profile')
            .set('Cookie', cookie)
            .send({ email: '  New.Address@Example.COM ' });

        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe('new.address@example.com');
    });

    it('re-issues the auth cookie so the session carries the new address', async () => {
        const { cookie } = await registerAndLogin(userFixture());

        const res = await request(app)
            .put('/users/profile')
            .set('Cookie', cookie)
            .send({ email: 'changed@example.com' });

        expect(res.status).toBe(200);
        const newCookie = (res.headers['set-cookie'] as unknown as string[] | undefined)?.[0] ?? '';
        expect(newCookie).toMatch(/^token=/);

        const session = await request(app).get('/users/session').set('Cookie', newCookie);
        expect(session.body.user.email).toBe('changed@example.com');
    });
});
