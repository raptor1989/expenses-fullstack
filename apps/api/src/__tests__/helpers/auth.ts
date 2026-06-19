import request from 'supertest';
import app from '../../app';

export interface AuthResult {
    token: string;
    cookie: string;
    userId: string;
    email: string;
}

export async function registerAndLogin(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}): Promise<AuthResult> {
    const res = await request(app).post('/api/users/register').send(userData);

    if (res.status !== 201) {
        throw new Error(`Registration failed (${res.status}): ${JSON.stringify(res.body)}`);
    }

    // Extract token from Set-Cookie header
    const rawCookie = (res.headers['set-cookie'] as unknown as string[] | undefined)?.[0] ?? '';
    const tokenMatch = rawCookie.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : '';

    return {
        token,
        cookie: rawCookie,
        userId: res.body.user.id,
        email: res.body.user.email,
    };
}
