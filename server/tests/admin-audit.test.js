const request = require('supertest');
const app  = require('../src/app');
const pool = require('../src/db');
const { makeToken } = require('./helpers');

const CHAVE = 'teste_historico';
let token;

beforeAll(() => { token = makeToken(); });

beforeEach(async () => {
  await pool.query("DELETE FROM audit_log WHERE campo = $1", [CHAVE]);
  await pool.query("DELETE FROM page_content WHERE key = $1", [CHAVE]);
});

afterAll(async () => {
  await pool.query("DELETE FROM audit_log WHERE campo = $1", [CHAVE]);
  await pool.query("DELETE FROM page_content WHERE key = $1", [CHAVE]);
});

const salvar = (valor) => request(app)
  .put(`/api/admin/content/home/${CHAVE}`)
  .set('Authorization', `Bearer ${token}`)
  .send({ value: valor });

describe('GET /api/admin/audit', () => {
  it('exige autenticação', async () => {
    const res = await request(app).get('/api/admin/audit');
    expect(res.status).toBe(401);
  });

  it('lista as alterações mais recentes primeiro', async () => {
    await salvar('um');
    await salvar('dois');

    const res = await request(app)
      .get(`/api/admin/audit?entidade=content&campo=${CHAVE}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data[0].valor_novo).toBe('dois');
    expect(res.body.data[1].valor_novo).toBe('um');
  });

  it('filtra por entidade', async () => {
    await salvar('um');
    const res = await request(app)
      .get('/api/admin/audit?entidade=hero_slide')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.data.every(l => l.entidade === 'hero_slide')).toBe(true);
  });

  it('pagina o resultado', async () => {
    await salvar('um');
    await salvar('dois');
    await salvar('tres');

    const res = await request(app)
      .get(`/api/admin/audit?campo=${CHAVE}&per_page=2`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(3);
    expect(res.body.totalPages).toBe(2);
  });
});

describe('POST /api/admin/audit/:id/restore', () => {
  it('devolve 404 para registro inexistente', async () => {
    const res = await request(app)
      .post('/api/admin/audit/99999999/restore')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('restaura o valor anterior de um campo de conteúdo', async () => {
    await salvar('original');
    await salvar('trocado por engano');

    const hist = await request(app)
      .get(`/api/admin/audit?campo=${CHAVE}`)
      .set('Authorization', `Bearer ${token}`);
    const ultima = hist.body.data[0];

    const res = await request(app)
      .post(`/api/admin/audit/${ultima.id}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.value).toBe('original');

    const { rows } = await pool.query(
      'SELECT value FROM page_content WHERE page = $1 AND key = $2', ['home', CHAVE]
    );
    expect(rows[0].value).toBe('original');
  });

  it('a restauração é ela mesma auditada e reversível', async () => {
    await salvar('original');
    await salvar('trocado');

    const hist = await request(app)
      .get(`/api/admin/audit?campo=${CHAVE}`)
      .set('Authorization', `Bearer ${token}`);
    await request(app)
      .post(`/api/admin/audit/${hist.body.data[0].id}/restore`)
      .set('Authorization', `Bearer ${token}`);

    const { rows } = await pool.query(
      "SELECT * FROM audit_log WHERE campo = $1 AND acao = 'restore'", [CHAVE]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].valor_anterior).toBe('trocado');
    expect(rows[0].valor_novo).toBe('original');
  });

  it('recusa restaurar qualquer entidade que não seja conteúdo', async () => {
    const { rows } = await pool.query(
      `INSERT INTO audit_log (user_email, acao, entidade, entidade_id, valor_anterior, valor_novo)
       VALUES ('x@test.com', 'update', 'product', 'algum-produto', '"antes"', '"depois"')
       RETURNING id`
    );
    try {
      const res = await request(app)
        .post(`/api/admin/audit/${rows[0].id}/restore`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/conteúdo/i);
    } finally {
      await pool.query('DELETE FROM audit_log WHERE id = $1', [rows[0].id]);
    }
  });
});
