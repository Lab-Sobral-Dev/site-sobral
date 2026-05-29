const request = require('supertest');
const app     = require('../src/app');
const { createCategory, deleteCategory, createProduct, deleteProduct } = require('./helpers');

const CAT_ID  = 'test-cat-prods';
const PROD_ID = 'test-prod-pub';

beforeAll(async () => {
  await createCategory(CAT_ID);
  await createProduct(PROD_ID, CAT_ID);
});

afterAll(async () => {
  await deleteProduct(PROD_ID);
  await deleteCategory(CAT_ID);
});

describe('GET /api/products', () => {
  it('retorna estrutura de paginação', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('respeita per_page', async () => {
    const res = await request(app).get('/api/products?per_page=2');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });

  it('filtra por ids', async () => {
    const res = await request(app).get(`/api/products?ids=${PROD_ID}&per_page=5`);
    expect(res.status).toBe(200);
    const found = res.body.data.find(p => p.id === PROD_ID);
    expect(found).toBeDefined();
    expect(found.name).toBe('Produto Teste');
  });

  it('filtra por categoria', async () => {
    const res = await request(app).get(`/api/products?cat=${CAT_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.every(p => p.category_id === CAT_ID)).toBe(true);
  });

  it('não retorna produtos inativos', async () => {
    const pool = require('../src/db');
    await pool.query('UPDATE products SET ativo = false WHERE id = $1', [PROD_ID]);
    const res = await request(app).get(`/api/products?ids=${PROD_ID}&per_page=5`);
    expect(res.status).toBe(200);
    expect(res.body.data.find(p => p.id === PROD_ID)).toBeUndefined();
    await pool.query('UPDATE products SET ativo = true WHERE id = $1', [PROD_ID]);
  });
});

describe('GET /api/products/:id', () => {
  it('retorna produto existente', async () => {
    const res = await request(app).get(`/api/products/${PROD_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(PROD_ID);
    expect(res.body.name).toBe('Produto Teste');
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await request(app).get('/api/products/id-que-nao-existe-xyz');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Produto não encontrado.');
  });
});
