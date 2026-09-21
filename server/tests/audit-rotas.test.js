const request = require('supertest');
const app  = require('../src/app');
const pool = require('../src/db');
const { makeToken, createCategory, deleteCategory } = require('./helpers');

const CAT  = 'test-cat-audit';
const PROD = 'test-prod-audit';
let token;

beforeAll(async () => {
  token = makeToken();
  await createCategory(CAT);
});

afterAll(async () => {
  await pool.query('DELETE FROM products WHERE id = $1', [PROD]);
  await deleteCategory(CAT);
  await pool.query("DELETE FROM audit_log WHERE entidade_id = $1 OR campo = 'teste_chave'", [PROD]);
  await pool.query("DELETE FROM page_content WHERE key = 'teste_chave'");
});

async function logsDe(entidade, id) {
  const { rows } = await pool.query(
    'SELECT * FROM audit_log WHERE entidade = $1 AND entidade_id = $2 ORDER BY id ASC',
    [entidade, id]
  );
  return rows;
}

describe('auditoria das rotas de produto', () => {
  it('registra create, update e delete', async () => {
    await request(app).post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ id: PROD, name: 'Auditado', category_id: CAT });

    await request(app).put(`/api/admin/products/${PROD}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Auditado v2', category_id: CAT });

    await request(app).delete(`/api/admin/products/${PROD}`)
      .set('Authorization', `Bearer ${token}`);

    const logs = await logsDe('product', PROD);
    expect(logs.map(l => l.acao)).toEqual(['create', 'update', 'delete']);
    expect(logs[1].valor_anterior.name).toBe('Auditado');
    expect(logs[1].valor_novo.name).toBe('Auditado v2');
    expect(logs[2].valor_anterior.name).toBe('Auditado v2');
  });
});

describe('auditoria do CMS', () => {
  it('guarda o valor anterior de cada campo, que é o que permite restaurar', async () => {
    await request(app).put('/api/admin/content/home/teste_chave')
      .set('Authorization', `Bearer ${token}`)
      .send({ value: 'primeiro' });

    await request(app).put('/api/admin/content/home/teste_chave')
      .set('Authorization', `Bearer ${token}`)
      .send({ value: 'segundo' });

    const logs = await logsDe('content', 'home');
    const meus = logs.filter(l => l.campo === 'teste_chave');
    expect(meus).toHaveLength(2);
    expect(meus[0].valor_anterior).toBeNull();
    expect(meus[0].valor_novo).toBe('primeiro');
    expect(meus[1].valor_anterior).toBe('primeiro');
    expect(meus[1].valor_novo).toBe('segundo');
  });
});
