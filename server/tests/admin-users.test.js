const request = require('supertest');
const app  = require('../src/app');
const pool = require('../src/db');
const bcrypt = require('bcryptjs');
const { makeTokenPara, criarUsuario, removerUsuario } = require('./helpers');

const ADMIN  = 'chefe@test.com';
const EDITOR = 'editor@test.com';
const NOVO   = 'novo@test.com';

let idAdmin;

beforeEach(async () => {
  await pool.query('DELETE FROM admin_users');
  const a = await criarUsuario({ email: ADMIN, papel: 'admin' });
  idAdmin = a.id;
  await criarUsuario({ email: EDITOR, papel: 'editor' });
});

afterAll(async () => {
  await pool.query('DELETE FROM admin_users');
});

const comoAdmin  = (req) => req.set('Authorization', `Bearer ${makeTokenPara(ADMIN)}`);
const comoEditor = (req) => req.set('Authorization', `Bearer ${makeTokenPara(EDITOR)}`);

describe('permissões', () => {
  it('editor não lista usuários', async () => {
    const res = await comoEditor(request(app).get('/api/admin/users'));
    expect(res.status).toBe(403);
  });

  it('admin lista usuários sem expor o hash', async () => {
    const res = await comoAdmin(request(app).get('/api/admin/users'));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].senha_hash).toBeUndefined();
  });

  it('editor não cria usuário', async () => {
    const res = await comoEditor(
      request(app).post('/api/admin/users').send({ email: NOVO, nome: 'X', senha: 'Test@123' })
    );
    expect(res.status).toBe(403);
  });
});

describe('criação', () => {
  it('cria usuário com senha utilizável', async () => {
    const res = await comoAdmin(
      request(app).post('/api/admin/users')
        .send({ email: NOVO, nome: 'Pessoa Nova', senha: 'Test@123', papel: 'editor' })
    );
    expect(res.status).toBe(201);
    expect(res.body.email).toBe(NOVO);
    expect(res.body.senha_hash).toBeUndefined();

    const login = await request(app).post('/api/auth/login')
      .send({ email: NOVO, password: 'Test@123' });
    expect(login.status).toBe(200);
  });

  it('recusa e-mail duplicado', async () => {
    const res = await comoAdmin(
      request(app).post('/api/admin/users').send({ email: EDITOR, nome: 'X', senha: 'Test@123' })
    );
    expect(res.status).toBe(409);
  });

  it('recusa senha curta', async () => {
    const res = await comoAdmin(
      request(app).post('/api/admin/users').send({ email: NOVO, nome: 'X', senha: '123' })
    );
    expect(res.status).toBe(400);
  });
});

describe('travas de segurança', () => {
  it('não deixa desativar a si mesmo', async () => {
    const res = await comoAdmin(
      request(app).put(`/api/admin/users/${idAdmin}`).send({ nome: 'Chefe', papel: 'admin', ativo: false })
    );
    expect(res.status).toBe(400);
  });

  it('não deixa excluir a si mesmo', async () => {
    const res = await comoAdmin(request(app).delete(`/api/admin/users/${idAdmin}`));
    expect(res.status).toBe(400);
  });

  it('não deixa remover o último admin ativo rebaixando o papel', async () => {
    const res = await comoAdmin(
      request(app).put(`/api/admin/users/${idAdmin}`).send({ nome: 'Chefe', papel: 'editor', ativo: true })
    );
    expect(res.status).toBe(400);
  });

  it('permite rebaixar quando existe outro admin ativo', async () => {
    await criarUsuario({ email: 'outro-admin@test.com', papel: 'admin' });
    const res = await comoAdmin(
      request(app).put(`/api/admin/users/${idAdmin}`).send({ nome: 'Chefe', papel: 'editor', ativo: true })
    );
    expect(res.status).toBe(200);
    await removerUsuario('outro-admin@test.com');
  });
});

describe('troca da própria senha', () => {
  it('exige a senha atual correta', async () => {
    const res = await comoEditor(
      request(app).put('/api/admin/users/me/senha')
        .send({ senha_atual: 'errada', senha_nova: 'NovaSenha@1' })
    );
    expect(res.status).toBe(401);
  });

  it('troca a senha e a nova passa a valer', async () => {
    const res = await comoEditor(
      request(app).put('/api/admin/users/me/senha')
        .send({ senha_atual: 'Test@123', senha_nova: 'NovaSenha@1' })
    );
    expect(res.status).toBe(200);

    const { rows } = await pool.query(
      'SELECT senha_hash FROM admin_users WHERE lower(email) = $1', [EDITOR]
    );
    expect(bcrypt.compareSync('NovaSenha@1', rows[0].senha_hash)).toBe(true);
  });

  it('recusa senha nova curta', async () => {
    const res = await comoEditor(
      request(app).put('/api/admin/users/me/senha')
        .send({ senha_atual: 'Test@123', senha_nova: '123' })
    );
    expect(res.status).toBe(400);
  });
});
