import { loadTestEnv } from './helpers/env';
loadTestEnv();

import request from 'supertest';
import app from '../app';

describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok', message: 'API is running' });
    });
});

describe('unknown routes', () => {
    it('return 404 with code not_found and the requested path', async () => {
        const res = await request(app).get('/api/users/session');

        expect(res.status).toBe(404);
        expect(res.body.code).toBe('not_found');
        expect(res.body.message).toContain('/api/users/session');
    });
});
