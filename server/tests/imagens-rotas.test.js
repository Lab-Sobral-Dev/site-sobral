const request = require('supertest');
const fs   = require('fs');
const path = require('path');
const app  = require('../src/app');
const pool = require('../src/db');
const { makeToken, createCategory, deleteCategory } = require('./helpers');

const DIR = path.join(__dirname, '..', '..', 'public', 'images', 'produtos');
const DIR_HERO = path.join(__dirname, '..', '..', 'public', 'images', 'hero');
const CAT  = 'test-cat-imgrota';
const PROD = 'test-prod-imgrota';
let token;

function criarArquivo(nome, dir = DIR) {
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, nome);
  fs.writeFileSync(p, 'x');
  return p;
}

beforeAll(async () => {
  token = makeToken();
  await createCategory(CAT);
});

afterEach(async () => {
  await pool.query("DELETE FROM products WHERE id LIKE $1", [`${PROD}%`]);
  await pool.query("DELETE FROM hero_slides WHERE image_url LIKE '/images/hero/rota-%'");
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

describe('limpeza ao excluir hero slide', () => {
  it('apaga a imagem de fundo que ficou órfã', async () => {
    const arquivo = criarArquivo('rota-hero-orfa.webp', DIR_HERO);
    const url = '/images/hero/rota-hero-orfa.webp';
    const { rows } = await pool.query(
      `INSERT INTO hero_slides(image_url, layers) VALUES($1, '[]'::jsonb) RETURNING id`,
      [url]
    );

    const res = await request(app)
      .delete(`/api/admin/hero-slides/${rows[0].id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(fs.existsSync(arquivo)).toBe(false);
  });

  it('apaga imagem de camada que ficou órfã', async () => {
    const arquivo = criarArquivo('rota-hero-camada.webp', DIR_HERO);
    const url = '/images/hero/rota-hero-camada.webp';
    const layers = [{ id: 'l1', type: 'image', name: 'logo', url, x: 0, y: 0, width: 10, height: 10, visible: true }];
    const { rows } = await pool.query(
      `INSERT INTO hero_slides(image_url, layers) VALUES('/images/hero/rota-hero-fundo.webp', $1::jsonb) RETURNING id`,
      [JSON.stringify(layers)]
    );

    await request(app)
      .delete(`/api/admin/hero-slides/${rows[0].id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(fs.existsSync(arquivo)).toBe(false);
  });

  it('preserva a imagem que outro slide ainda usa', async () => {
    const arquivo = criarArquivo('rota-hero-compartilhada.webp', DIR_HERO);
    const url = '/images/hero/rota-hero-compartilhada.webp';
    const { rows } = await pool.query(
      `INSERT INTO hero_slides(image_url, layers) VALUES($1, '[]'::jsonb) RETURNING id`,
      [url]
    );
    await pool.query(
      `INSERT INTO hero_slides(image_url, layers) VALUES($1, '[]'::jsonb)`,
      [url]
    );

    await request(app)
      .delete(`/api/admin/hero-slides/${rows[0].id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(fs.existsSync(arquivo)).toBe(true);
    fs.unlinkSync(arquivo);
  });
});

describe('imagem mobile do hero slide', () => {
  it('atualiza só a imagem mobile sem apagar as camadas existentes', async () => {
    const layer = { id: 'l1', type: 'image', name: 'logo', url: '/images/hero/rota-hero-fundo4.webp', x: 0, y: 0, width: 10, height: 10, visible: true };
    const { rows } = await pool.query(
      `INSERT INTO hero_slides(image_url, layers) VALUES('/images/hero/rota-hero-fundo4.webp', $1::jsonb) RETURNING id`,
      [JSON.stringify([layer])]
    );
    criarArquivo('rota-hero-mobile.webp', DIR_HERO);

    const res = await request(app)
      .put(`/api/admin/hero-slides/${rows[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ image_mobile_url: '/images/hero/rota-hero-mobile.webp' });

    expect(res.status).toBe(200);
    expect(res.body.image_mobile_url).toBe('/images/hero/rota-hero-mobile.webp');
    expect(res.body.layers).toEqual([layer]);
    fs.unlinkSync(path.join(DIR_HERO, 'rota-hero-mobile.webp'));
  });

  it('apaga a imagem mobile antiga ao trocar por outra', async () => {
    const antiga = criarArquivo('rota-hero-mobile-antiga.webp', DIR_HERO);
    const { rows } = await pool.query(
      `INSERT INTO hero_slides(image_url, image_mobile_url, layers) VALUES('/images/hero/rota-hero-fundo5.webp', '/images/hero/rota-hero-mobile-antiga.webp', '[]'::jsonb) RETURNING id`
    );
    criarArquivo('rota-hero-mobile-nova.webp', DIR_HERO);

    await request(app)
      .put(`/api/admin/hero-slides/${rows[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ image_mobile_url: '/images/hero/rota-hero-mobile-nova.webp' });

    expect(fs.existsSync(antiga)).toBe(false);
    fs.unlinkSync(path.join(DIR_HERO, 'rota-hero-mobile-nova.webp'));
  });

  it('apaga a imagem mobile órfã ao excluir o slide', async () => {
    const arquivo = criarArquivo('rota-hero-mobile-orfa.webp', DIR_HERO);
    const { rows } = await pool.query(
      `INSERT INTO hero_slides(image_url, image_mobile_url, layers) VALUES('/images/hero/rota-hero-fundo6.webp', '/images/hero/rota-hero-mobile-orfa.webp', '[]'::jsonb) RETURNING id`
    );

    const res = await request(app)
      .delete(`/api/admin/hero-slides/${rows[0].id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(fs.existsSync(arquivo)).toBe(false);
  });

  it('preserva a imagem mobile que outro slide ainda usa', async () => {
    const arquivo = criarArquivo('rota-hero-mobile-compartilhada.webp', DIR_HERO);
    const url = '/images/hero/rota-hero-mobile-compartilhada.webp';
    const { rows } = await pool.query(
      `INSERT INTO hero_slides(image_url, image_mobile_url, layers) VALUES('/images/hero/rota-hero-fundo7.webp', $1, '[]'::jsonb) RETURNING id`,
      [url]
    );
    await pool.query(
      `INSERT INTO hero_slides(image_url, image_mobile_url, layers) VALUES('/images/hero/rota-hero-fundo8.webp', $1, '[]'::jsonb)`,
      [url]
    );

    await request(app)
      .delete(`/api/admin/hero-slides/${rows[0].id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(fs.existsSync(arquivo)).toBe(true);
    fs.unlinkSync(arquivo);
  });
});

describe('limpeza ao trocar camadas do hero slide', () => {
  it('apaga a imagem de camada removida', async () => {
    const saiu = criarArquivo('rota-hero-saiu.webp', DIR_HERO);
    const url  = '/images/hero/rota-hero-saiu.webp';
    const layers = [{ id: 'l1', type: 'image', name: 'logo', url, x: 0, y: 0, width: 10, height: 10, visible: true }];
    const { rows } = await pool.query(
      `INSERT INTO hero_slides(image_url, layers) VALUES('/images/hero/rota-hero-fundo2.webp', $1::jsonb) RETURNING id`,
      [JSON.stringify(layers)]
    );

    const res = await request(app)
      .put(`/api/admin/hero-slides/${rows[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ layers: [] });

    expect(res.status).toBe(200);
    expect(fs.existsSync(saiu)).toBe(false);
  });

  it('não apaga a imagem de camada que continua presente', async () => {
    const mantida = criarArquivo('rota-hero-mantida.webp', DIR_HERO);
    const url = '/images/hero/rota-hero-mantida.webp';
    const layer = { id: 'l1', type: 'image', name: 'logo', url, x: 0, y: 0, width: 10, height: 10, visible: true };
    const { rows } = await pool.query(
      `INSERT INTO hero_slides(image_url, layers) VALUES('/images/hero/rota-hero-fundo3.webp', $1::jsonb) RETURNING id`,
      [JSON.stringify([layer])]
    );

    await request(app)
      .put(`/api/admin/hero-slides/${rows[0].id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ layers: [{ ...layer, x: 5 }] });

    expect(fs.existsSync(mantida)).toBe(true);
    fs.unlinkSync(mantida);
  });
});
