const request = require('supertest');
const fs   = require('fs');
const path = require('path');
const app  = require('../src/app');
const pool = require('../src/db');
const { makeToken, createCategory, deleteCategory } = require('./helpers');

const DIR = path.join(__dirname, '..', '..', 'public', 'images', 'produtos');
const CAT  = 'test-cat-imgrota';
const PROD = 'test-prod-imgrota';
let token;

function criarArquivo(nome) {
  fs.mkdirSync(DIR, { recursive: true });
  const p = path.join(DIR, nome);
  fs.writeFileSync(p, 'x');
  return p;
}

beforeAll(async () => {
  token = makeToken();
  await createCategory(CAT);
});

afterEach(async () => {
  await pool.query("DELETE FROM products WHERE id LIKE $1", [`${PROD}%`]);
  await pool.query("DELETE FROM audit_log WHERE entidade = 'image'");
});

afterAll(async () => {
  await deleteCategory(CAT);
});

describe('limpeza ao excluir produto', () => {
  it('apaga a imagem que ficou órfã', async () => {
    const arquivo = criarArquivo('rota-orfa.webp');
    await pool.query(
      `INSERT INTO products(id, name, category_id, image) VALUES($1,'P',$2,$3)`,
      [PROD, CAT, '/images/produtos/rota-orfa.webp']
    );

    const res = await request(app)
      .delete(`/api/admin/products/${PROD}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(fs.existsSync(arquivo)).toBe(false);
  });

  it('preserva a imagem que outro produto ainda usa (caso da duplicação)', async () => {
    const arquivo = criarArquivo('rota-compartilhada.webp');
    const url = '/images/produtos/rota-compartilhada.webp';
    await pool.query(
      `INSERT INTO products(id, name, category_id, image) VALUES($1,'P',$2,$3)`,
      [PROD, CAT, url]
    );
    await pool.query(
      `INSERT INTO products(id, name, category_id, image) VALUES($1,'Copia',$2,$3)`,
      [`${PROD}-copia`, CAT, url]
    );

    await request(app)
      .delete(`/api/admin/products/${PROD}`)
      .set('Authorization', `Bearer ${token}`);

    expect(fs.existsSync(arquivo)).toBe(true);
    fs.unlinkSync(arquivo);
  });
});

describe('limpeza ao trocar a imagem', () => {
  it('apaga a imagem antiga que saiu do produto', async () => {
    const antiga = criarArquivo('rota-antiga.webp');
    criarArquivo('rota-nova.webp');
    await pool.query(
      `INSERT INTO products(id, name, category_id, image) VALUES($1,'P',$2,$3)`,
      [PROD, CAT, '/images/produtos/rota-antiga.webp']
    );

    const res = await request(app)
      .put(`/api/admin/products/${PROD}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'P', category_id: CAT, image: '/images/produtos/rota-nova.webp' });

    expect(res.status).toBe(200);
    expect(fs.existsSync(antiga)).toBe(false);

    fs.unlinkSync(path.join(DIR, 'rota-nova.webp'));
  });

  it('não apaga a imagem quando ela continua no produto', async () => {
    const arquivo = criarArquivo('rota-mantida.webp');
    const url = '/images/produtos/rota-mantida.webp';
    await pool.query(
      `INSERT INTO products(id, name, category_id, image) VALUES($1,'P',$2,$3)`,
      [PROD, CAT, url]
    );

    await request(app)
      .put(`/api/admin/products/${PROD}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Outro nome', category_id: CAT, image: url });

    expect(fs.existsSync(arquivo)).toBe(true);
    fs.unlinkSync(arquivo);
  });

  it('apaga foto removida da galeria', async () => {
    const saiu = criarArquivo('rota-galeria-saiu.webp');
    const url  = '/images/produtos/rota-galeria-saiu.webp';
    await pool.query(
      `INSERT INTO products(id, name, category_id, gallery) VALUES($1,'P',$2,$3::jsonb)`,
      [PROD, CAT, JSON.stringify([url])]
    );

    await request(app)
      .put(`/api/admin/products/${PROD}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'P', category_id: CAT, gallery: [] });

    expect(fs.existsSync(saiu)).toBe(false);
  });
});
