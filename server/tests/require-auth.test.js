const request = require('supertest');
const app  = require('../src/app');
const pool = require('../src/db');
const { makeToken, makeTokenPara, criarUsuario, removerUsuario } = require('./helpers');

const ATIVO   = 'ativo@test.com';
const INATIVO = 'inativo@test.com';

afterEach(async () => {
  await removerUsuario(ATIVO);
  await removerUsuario(INATIVO);
});

describe('requireAuth — resolução no banco', () => {
  it('aceita usuário ativo existente na tabela', async () => {
    await criarUsuario({ email: ATIVO, papel: 'editor' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeTokenPara(ATIVO)}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(ATIVO);
    expect(res.body.papel).toBe('editor');
  });

  it('rejeita usuário desativado mesmo com token válido', async () => {
    await criarUsuario({ email: ATIVO, ativo: true });
    await criarUsuario({ email: INATIVO, ativo: false });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeTokenPara(INATIVO)}`);
    expect(res.status).toBe(401);
  });

  it('rejeita e-mail que não existe na tabela quando há usuário ativo', async () => {
    await criarUsuario({ email: ATIVO, ativo: true });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeTokenPara('fantasma@test.com')}`);
    expect(res.status).toBe(401);
  });

  it('aceita a credencial do .env quando não há nenhum usuário ativo', async () => {
    await pool.query('DELETE FROM admin_users');
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.papel).toBe('admin');
  });

  it('continua rejeitando token ausente ou inválido', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me')
      .set('Authorization', 'Bearer lixo')).status).toBe(401);
  });
});
