const request = require('supertest');
const app     = require('../src/app');
const { makeToken, createCategory, deleteCategory } = require('./helpers');
const pool    = require('../src/db');

const CAT_ID  = 'test-cat-lanc';
const PROD_ID = 'test-lanc-001';
let auth;

beforeAll(async () => {
  auth = { Authorization: `Bearer ${makeToken()}` };
  await createCategory(CAT_ID);
});

afterAll(async () => {
  await pool.query('DELETE FROM products WHERE id = $1', [PROD_ID]).catch(() => {});
  await deleteCategory(CAT_ID).catch(() => {});
});

const salvar = body =>
  request(app).put(`/api/admin/products/${PROD_ID}`).set(auth)
    .send({ name: 'Lançamento', category_id: CAT_ID, ...body });

describe('Lançamento no cadastro do produto', () => {
  it('cria como lançamento por 30 dias com a cor escolhida', async () => {
    const res = await request(app).post('/api/admin/products').set(auth)
      .send({ id: PROD_ID, name: 'Lançamento', category_id: CAT_ID, lancamento: true, lancamento_cor: '#1e90ff' });
    expect(res.status).toBe(201);
    expect(res.body.lancamento_cor).toBe('#1E90FF');
    const dias = (new Date(res.body.lancamento_ate) - Date.now()) / 86400000;
    expect(dias).toBeGreaterThan(29.9);
    expect(dias).toBeLessThanOrEqual(30);
  });

  it('API pública expõe lancamento e cor', async () => {
    const res = await request(app).get(`/api/products/${PROD_ID}`);
    expect(res.body.lancamento).toBe(true);
    expect(res.body.lancamento_cor).toBe('#1E90FF');
  });

  it('salvar de novo não renova a janela de 30 dias', async () => {
    const antes = (await pool.query('SELECT lancamento_ate FROM products WHERE id=$1', [PROD_ID])).rows[0].lancamento_ate;
    await salvar({ lancamento: true, lancamento_cor: '#00FF00' });
    const depois = (await pool.query('SELECT lancamento_ate FROM products WHERE id=$1', [PROD_ID])).rows[0].lancamento_ate;
    expect(depois.getTime()).toBe(antes.getTime());
  });

  it('cor inválida cai na cor padrão', async () => {
    const res = await salvar({ lancamento: true, lancamento_cor: 'vermelho' });
    expect(res.body.lancamento_cor).toBe('#F37021');
  });

  it('janela vencida deixa de ser lançamento e remarcar abre nova janela', async () => {
    await pool.query("UPDATE products SET lancamento_ate = NOW() - INTERVAL '1 day' WHERE id=$1", [PROD_ID]);
    expect((await request(app).get(`/api/products/${PROD_ID}`)).body.lancamento).toBe(false);
    const res = await salvar({ lancamento: true });
    expect(new Date(res.body.lancamento_ate) - Date.now()).toBeGreaterThan(29 * 86400000);
  });

  it('desmarcar remove a tag imediatamente', async () => {
    const res = await salvar({ lancamento: false });
    expect(res.body.lancamento_ate).toBeNull();
    expect((await request(app).get(`/api/products/${PROD_ID}`)).body.lancamento).toBeFalsy();
  });
});
