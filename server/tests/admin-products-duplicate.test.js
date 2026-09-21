const request = require('supertest');
const app  = require('../src/app');
const pool = require('../src/db');
const { makeToken, createCategory, deleteCategory } = require('./helpers');

const CAT  = 'test-cat-dup';
const ORIG = 'test-prod-dup';
let token;

beforeAll(async () => {
  token = makeToken();
  await createCategory(CAT);
});

beforeEach(async () => {
  await pool.query("DELETE FROM products WHERE id LIKE $1", [`${ORIG}%`]);
  // sem isto, as linhas de auditoria dos testes anteriores se acumulam
  await pool.query("DELETE FROM audit_log WHERE entidade_id LIKE $1", [`${ORIG}%`]);
  await pool.query(
    `INSERT INTO products(id, name, tag, category_id, brand, image, gallery,
                          description, ativo, destaque)
     VALUES($1, 'Original', 'tag x', $2, 'Marca', '/images/produtos/a.png',
            '["/images/produtos/b.png"]', 'desc', true, true)`,
    [ORIG, CAT]
  );
});

afterAll(async () => {
  await pool.query("DELETE FROM products WHERE id LIKE $1", [`${ORIG}%`]);
  await deleteCategory(CAT);
  await pool.query("DELETE FROM audit_log WHERE entidade_id LIKE $1", [`${ORIG}%`]);
});

describe('POST /api/admin/products/:id/duplicate', () => {
  it('exige autenticação', async () => {
    const res = await request(app).post(`/api/admin/products/${ORIG}/duplicate`);
    expect(res.status).toBe(401);
  });

  it('retorna 404 para produto inexistente', async () => {
    const res = await request(app)
      .post('/api/admin/products/nao-existe-mesmo/duplicate')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('copia os campos, nasce inativa e sem destaque', async () => {
    const res = await request(app)
      .post(`/api/admin/products/${ORIG}/duplicate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(`${ORIG}-copia`);
    expect(res.body.name).toBe('Original (cópia)');
    expect(res.body.ativo).toBe(false);
    expect(res.body.destaque).toBe(false);
    expect(res.body.tag).toBe('tag x');
    expect(res.body.brand).toBe('Marca');
    expect(res.body.description).toBe('desc');
    expect(res.body.image).toBe('/images/produtos/a.png');
    expect(res.body.gallery).toEqual(['/images/produtos/b.png']);
  });

  it('numera a partir da segunda cópia em vez de dar conflito', async () => {
    await request(app).post(`/api/admin/products/${ORIG}/duplicate`)
      .set('Authorization', `Bearer ${token}`);
    const segunda = await request(app).post(`/api/admin/products/${ORIG}/duplicate`)
      .set('Authorization', `Bearer ${token}`);

    expect(segunda.status).toBe(201);
    expect(segunda.body.id).toBe(`${ORIG}-copia-2`);
  });

  it('registra a duplicação na auditoria', async () => {
    const res = await request(app)
      .post(`/api/admin/products/${ORIG}/duplicate`)
      .set('Authorization', `Bearer ${token}`);

    const { rows } = await pool.query(
      "SELECT * FROM audit_log WHERE entidade = 'product' AND entidade_id = $1 AND acao = 'create'",
      [res.body.id]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].valor_novo.id).toBe(res.body.id);
  });
});
