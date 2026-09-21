const request = require('supertest');
const app  = require('../src/app');
const pool = require('../src/db');
const { criarUsuario, removerUsuario } = require('./helpers');

const EMAIL = 'login-tabela@test.com';
const SENHA = 'Test@123';

afterEach(async () => {
  await removerUsuario(EMAIL);
  await pool.query("DELETE FROM audit_log WHERE acao = 'login'");
});

describe('POST /api/auth/login pela tabela', () => {
  it('autentica usuário ativo com a senha da tabela', async () => {
    await criarUsuario({ email: EMAIL, papel: 'editor', senha: SENHA });

    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: SENHA });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(EMAIL);
    expect(res.body.expiresAt).toBeGreaterThan(Date.now());
  });

  it('aceita e-mail com maiúsculas', async () => {
    await criarUsuario({ email: EMAIL, senha: SENHA });
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'Login-Tabela@Test.com', password: SENHA });
    expect(res.status).toBe(200);
  });

  it('recusa senha errada', async () => {
    await criarUsuario({ email: EMAIL, senha: SENHA });
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'errada' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciais inválidas.');
  });

  it('recusa usuário desativado', async () => {
    await criarUsuario({ email: EMAIL, senha: SENHA, ativo: false });
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: SENHA });
    expect(res.status).toBe(401);
  });

  it('atualiza ultimo_login', async () => {
    await criarUsuario({ email: EMAIL, senha: SENHA });
    await request(app).post('/api/auth/login').send({ email: EMAIL, password: SENHA });

    const { rows } = await pool.query(
      'SELECT ultimo_login FROM admin_users WHERE lower(email) = $1', [EMAIL]
    );
    expect(rows[0].ultimo_login).not.toBeNull();
  });

  it('registra o login na auditoria', async () => {
    await criarUsuario({ email: EMAIL, senha: SENHA });
    await request(app).post('/api/auth/login').send({ email: EMAIL, password: SENHA });

    const { rows } = await pool.query("SELECT * FROM audit_log WHERE acao = 'login'");
    expect(rows).toHaveLength(1);
    expect(rows[0].user_email).toBe(EMAIL);
  });

  it('a credencial do .env deixa de valer quando existe usuário ativo', async () => {
    await criarUsuario({ email: EMAIL, senha: SENHA });
    const res = await request(app).post('/api/auth/login')
      .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    expect(res.status).toBe(401);
  });

  it('a credencial do .env volta a valer sem nenhum usuário ativo', async () => {
    await pool.query('DELETE FROM admin_users');
    const res = await request(app).post('/api/auth/login')
      .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    expect(res.status).toBe(200);
  });
});
