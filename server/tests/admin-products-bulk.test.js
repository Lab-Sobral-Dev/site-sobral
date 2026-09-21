const request = require('supertest');
const app  = require('../src/app');
const pool = require('../src/db');
const { makeToken, createCategory, deleteCategory } = require('./helpers');

const CAT     = 'test-cat-bulk';
const CAT_DST = 'test-cat-bulk-dst';
const IDS     = ['test-bulk-1', 'test-bulk-2', 'test-bulk-3'];
let token;

beforeAll(async () => {
  token = makeToken();
  await createCategory(CAT);
  await createCategory(CAT_DST);
});

beforeEach(async () => {
  await pool.query('DELETE FROM products WHERE id = ANY($1)', [IDS]);
  await pool.query("DELETE FROM audit_log WHERE entidade_id LIKE 'test-bulk-%'");
  for (const id of IDS) {
    await pool.query(
      `INSERT INTO products(id, name, category_id, ativo) VALUES($1, $2, $3, true)`,
      [id, `Produto ${id}`, CAT]
    );
  }
});

afterAll(async () => {
  await pool.query('DELETE FROM products WHERE id = ANY($1)', [IDS]);
  await deleteCategory(CAT);
  await deleteCategory(CAT_DST);
  await pool.query("DELETE FROM audit_log WHERE entidade_id LIKE 'test-bulk-%'");
});

const bulk = (body) => request(app)
  .post('/api/admin/products/bulk')
  .set('Authorization', `Bearer ${token}`)
  .send(body);

describe('POST /api/admin/products/bulk — validação', () => {
  it('exige autenticação', async () => {
    const res = await request(app).post('/api/admin/products/bulk').send({ ids: IDS, acao: 'ativar' });
    expect(res.status).toBe(401);
  });

  it('recusa ids que não sejam array não vazio', async () => {
    expect((await bulk({ ids: [], acao: 'ativar' })).status).toBe(400);
    expect((await bulk({ ids: 'x', acao: 'ativar' })).status).toBe(400);
  });

  it('recusa ação desconhecida', async () => {
    const res = await bulk({ ids: IDS, acao: 'explodir' });
    expect(res.status).toBe(400);
  });

  it('recusa mais de 100 ids', async () => {
    const muitos = Array.from({ length: 101 }, (_, i) => `x-${i}`);
    const res = await bulk({ ids: muitos, acao: 'ativar' });
    expect(res.status).toBe(400);
  });

  it('recusa mover para categoria inexistente sem alterar nada', async () => {
    const res = await bulk({ ids: IDS, acao: 'mover_categoria', valor: 'categoria-fantasma' });
    expect(res.status).toBe(400);

    const { rows } = await pool.query('SELECT category_id FROM products WHERE id = ANY($1)', [IDS]);
    expect(rows.every(r => r.category_id === CAT)).toBe(true);
  });
});

describe('POST /api/admin/products/bulk — execução', () => {
  it('desativa todos os selecionados', async () => {
    const res = await bulk({ ids: IDS, acao: 'desativar' });
    expect(res.status).toBe(200);
    expect(res.body.afetados).toBe(3);

    const { rows } = await pool.query('SELECT ativo FROM products WHERE id = ANY($1)', [IDS]);
    expect(rows.every(r => r.ativo === false)).toBe(true);
  });

  it('ativa todos os selecionados', async () => {
    await bulk({ ids: IDS, acao: 'desativar' });
    const res = await bulk({ ids: IDS, acao: 'ativar' });
    expect(res.body.afetados).toBe(3);

    const { rows } = await pool.query('SELECT ativo FROM products WHERE id = ANY($1)', [IDS]);
    expect(rows.every(r => r.ativo === true)).toBe(true);
  });

  it('move todos para a categoria destino', async () => {
    const res = await bulk({ ids: IDS, acao: 'mover_categoria', valor: CAT_DST });
    expect(res.body.afetados).toBe(3);

    const { rows } = await pool.query('SELECT category_id FROM products WHERE id = ANY($1)', [IDS]);
    expect(rows.every(r => r.category_id === CAT_DST)).toBe(true);
  });

  it('exclui todos os selecionados', async () => {
    const res = await bulk({ ids: IDS, acao: 'excluir' });
    expect(res.body.afetados).toBe(3);

    const { rows } = await pool.query('SELECT id FROM products WHERE id = ANY($1)', [IDS]);
    expect(rows).toHaveLength(0);
  });

  it('grava uma linha de auditoria por produto afetado', async () => {
    await bulk({ ids: IDS, acao: 'desativar' });
    const { rows } = await pool.query(
      "SELECT entidade_id FROM audit_log WHERE entidade = 'product' AND campo = 'bulk:desativar'"
    );
    expect(rows.map(r => r.entidade_id).sort()).toEqual([...IDS].sort());
  });

  it('ignora ids inexistentes sem falhar, contando só os reais', async () => {
    const res = await bulk({ ids: [...IDS, 'nao-existe'], acao: 'desativar' });
    expect(res.status).toBe(200);
    expect(res.body.afetados).toBe(3);
  });
});
