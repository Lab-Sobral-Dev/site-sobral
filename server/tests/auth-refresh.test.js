const request = require('supertest');
const app = require('../src/app');
const { makeToken } = require('./helpers');

describe('GET /api/auth/me — expiresAt', () => {
  it('devolve o vencimento do token em milissegundos no futuro', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.expiresAt).toBe('number');
    expect(res.body.expiresAt).toBeGreaterThan(Date.now());
  });
});

describe('POST /api/auth/refresh', () => {
  it('retorna 401 sem sessão', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('emite novo cookie e novo vencimento', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.expiresAt).toBeGreaterThan(Date.now());

    const cookies = res.headers['set-cookie'];
    const cookieStr = Array.isArray(cookies) ? cookies.join('') : (cookies || '');
    expect(cookieStr).toContain('sobral_jwt');
  });
});
