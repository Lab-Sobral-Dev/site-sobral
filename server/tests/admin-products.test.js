const request = require('supertest');
const app     = require('../src/app');
const { makeToken, createCategory, deleteCategory, deleteProduct } = require('./helpers');
const pool    = require('../src/db');

const CAT_ID       = 'test-cat-admin';
const NEW_PROD_ID  = 'test-admin-prod-001';
let token;

beforeAll(async () => {
  token = makeToken();
  await createCategory(CAT_ID);
});

afterAll(async () => {
  try { await pool.query('DELETE FROM products WHERE id = $1', [NEW_PROD_ID]); } catch (e) { console.error('cleanup product:', e.message); }
  try { await deleteCategory(CAT_ID); } catch (e) { console.error('cleanup category:', e.message); }
});

describe('GET /api/admin/products — autenticação', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/admin/products');
    expect(res.status).toBe(401);
  });

  it('retorna 200 com token válido', async () => {
    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('inclui produtos inativos (diferente da rota pública)', async () => {
    await pool.query(
      `INSERT INTO products(id, name, category_id, ativo)
       VALUES('test-inativo-001', 'Produto Inativo', $1, false)
       ON CONFLICT(id) DO UPDATE SET ativo = false`,
      [CAT_ID]
    );
    try {
      const res = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      const found = res.body.data.find(p => p.id === 'test-inativo-001');
      expect(found).toBeDefined();
      expect(found.ativo).toBe(false);
    } finally {
      await pool.query('DELETE FROM products WHERE id = $1', ['test-inativo-001']);
    }
  });
});

describe('POST /api/admin/products', () => {
  it('retorna 400 sem campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Produto sem id e categoria' });
    expect(res.status).toBe(400);
  });

  it('cria produto e retorna 201', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        id: NEW_PROD_ID,
        name: 'Produto Admin Teste',
        category_id: CAT_ID,
        tag: 'tag-teste',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(NEW_PROD_ID);
    expect(res.body.name).toBe('Produto Admin Teste');
    expect(res.body.ativo).toBe(true);
  });

  it('retorna 409 ao criar produto com id duplicado', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: NEW_PROD_ID, name: 'Duplicado', category_id: CAT_ID });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ID já existe.');
  });
});

describe('PUT /api/admin/products/:id', () => {
  it('atualiza produto existente', async () => {
    const res = await request(app)
      .put(`/api/admin/products/${NEW_PROD_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Produto Atualizado', category_id: CAT_ID });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Produto Atualizado');
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await request(app)
      .put('/api/admin/products/id-inexistente-xyz')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Qualquer', category_id: CAT_ID });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/admin/products/:id/ativo', () => {
  it('alterna ativo/inativo', async () => {
    const before = await request(app)
      .get(`/api/admin/products/${NEW_PROD_ID}`)
      .set('Authorization', `Bearer ${token}`);
    const wasAtivo = before.body.ativo;

    const res = await request(app)
      .patch(`/api/admin/products/${NEW_PROD_ID}/ativo`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ativo).toBe(!wasAtivo);
  });
});

describe('DELETE /api/admin/products/:id', () => {
  it('deleta produto existente', async () => {
    const res = await request(app)
      .delete(`/api/admin/products/${NEW_PROD_ID}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('retorna 404 para produto já deletado', async () => {
    const res = await request(app)
      .delete(`/api/admin/products/${NEW_PROD_ID}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
