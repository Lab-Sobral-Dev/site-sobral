const fs   = require('fs');
const path = require('path');
const pool = require('../src/db');
const { estaEmUso, removerSeOrfa } = require('../src/lib/imagens');
const { HERO_SRCSET_WIDTHS, heroVariantFilename } = require('../src/utils/heroVariants');

const DIR_PRODUTOS = path.join(__dirname, '..', '..', 'public', 'images', 'produtos');
const DIR_HERO      = path.join(__dirname, '..', '..', 'public', 'images', 'hero');
const req = { admin: { id: null, email: 'teste@test.com' }, ip: '127.0.0.1' };

function criarArquivo(nome, dir = DIR_PRODUTOS) {
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, nome);
  fs.writeFileSync(p, 'conteudo de teste');
  return p;
}

const CAT = 'test-cat-img';

beforeAll(async () => {
  await pool.query(
    `INSERT INTO categories(id, label) VALUES($1, 'Cat Img')
     ON CONFLICT (id) DO NOTHING`, [CAT]
  );
});

afterEach(async () => {
  await pool.query("DELETE FROM products WHERE id LIKE 'test-img-%'");
  await pool.query("DELETE FROM page_content WHERE key = 'teste_img'");
  await pool.query("DELETE FROM audit_log WHERE entidade = 'image'");
});

afterAll(async () => {
  await pool.query('DELETE FROM categories WHERE id = $1', [CAT]);
});

describe('estaEmUso', () => {
  it('detecta referência em products.image', async () => {
    await pool.query(
      `INSERT INTO products(id, name, category_id, image) VALUES('test-img-1','P',$1,$2)`,
      [CAT, '/images/produtos/usada.webp']
    );
    expect(await estaEmUso('/images/produtos/usada.webp')).toBe(true);
    expect(await estaEmUso('/images/produtos/outra.webp')).toBe(false);
  });

  it('detecta referência dentro de products.gallery', async () => {
    await pool.query(
      `INSERT INTO products(id, name, category_id, gallery)
       VALUES('test-img-2','P',$1,$2::jsonb)`,
      [CAT, JSON.stringify(['/images/produtos/na-galeria.webp'])]
    );
    expect(await estaEmUso('/images/produtos/na-galeria.webp')).toBe(true);
  });

  it('detecta referência em page_content.value', async () => {
    await pool.query(
      `INSERT INTO page_content(page, key, value) VALUES('home','teste_img',$1)`,
      ['/images/cms/banner.webp']
    );
    expect(await estaEmUso('/images/cms/banner.webp')).toBe(true);
  });
});

describe('removerSeOrfa', () => {
  it('apaga o arquivo quando nada o referencia', async () => {
    const p = criarArquivo('orfa-teste.webp');
    const r = await removerSeOrfa(req, '/images/produtos/orfa-teste.webp');
    expect(r).toBe('removida');
    expect(fs.existsSync(p)).toBe(false);
  });

  it('registra a exclusão na auditoria', async () => {
    criarArquivo('orfa-auditada.webp');
    await removerSeOrfa(req, '/images/produtos/orfa-auditada.webp');
    const { rows } = await pool.query(
      "SELECT * FROM audit_log WHERE entidade = 'image' AND entidade_id = $1",
      ['/images/produtos/orfa-auditada.webp']
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].acao).toBe('delete');
  });

  it('NÃO apaga arquivo ainda referenciado', async () => {
    const p = criarArquivo('ainda-usada.webp');
    await pool.query(
      `INSERT INTO products(id, name, category_id, image) VALUES('test-img-3','P',$1,$2)`,
      [CAT, '/images/produtos/ainda-usada.webp']
    );
    const r = await removerSeOrfa(req, '/images/produtos/ainda-usada.webp');
    expect(r).toBe('em-uso');
    expect(fs.existsSync(p)).toBe(true);
    fs.unlinkSync(p);
  });

  it('recusa caminho fora de public/images', async () => {
    expect(await removerSeOrfa(req, '/etc/passwd')).toBe('fora-do-escopo');
    expect(await removerSeOrfa(req, '../../../server/.env')).toBe('fora-do-escopo');
    expect(await removerSeOrfa(req, '/images/../../server/.env')).toBe('fora-do-escopo');
  });

  it('recusa subdiretório de imagens não permitido', async () => {
    expect(await removerSeOrfa(req, '/images/logo.png')).toBe('fora-do-escopo');
  });

  it('não reclama de arquivo que já não existe', async () => {
    const r = await removerSeOrfa(req, '/images/produtos/nunca-existiu.webp');
    expect(r).toBe('inexistente');
  });

  it('ignora valores vazios sem lançar', async () => {
    expect(await removerSeOrfa(req, '')).toBe('fora-do-escopo');
    expect(await removerSeOrfa(req, null)).toBe('fora-do-escopo');
  });

  it('apaga junto as variantes de srcset do hero (upload.js)', async () => {
    const principal = criarArquivo('hero-com-srcset.webp', DIR_HERO);
    const variantes = HERO_SRCSET_WIDTHS.map(w => {
      const nome = heroVariantFilename('hero-com-srcset.webp', w);
      return criarArquivo(nome, DIR_HERO);
    });

    const r = await removerSeOrfa(req, '/images/hero/hero-com-srcset.webp');
    expect(r).toBe('removida');
    expect(fs.existsSync(principal)).toBe(false);
    for (const v of variantes) expect(fs.existsSync(v)).toBe(false);
  });

  it('não falha quando a imagem de hero não tem variantes (upload antigo)', async () => {
    const p = criarArquivo('hero-sem-srcset.webp', DIR_HERO);
    const r = await removerSeOrfa(req, '/images/hero/hero-sem-srcset.webp');
    expect(r).toBe('removida');
    expect(fs.existsSync(p)).toBe(false);
  });

  it('NÃO apaga as variantes de um hero ainda em uso', async () => {
    const principal = criarArquivo('hero-em-uso.webp', DIR_HERO);
    const variante   = criarArquivo(heroVariantFilename('hero-em-uso.webp', HERO_SRCSET_WIDTHS[0]), DIR_HERO);
    await pool.query(
      `INSERT INTO hero_slides(image_url, ordem) VALUES($1, 999)`,
      ['/images/hero/hero-em-uso.webp']
    );
    try {
      const r = await removerSeOrfa(req, '/images/hero/hero-em-uso.webp');
      expect(r).toBe('em-uso');
      expect(fs.existsSync(principal)).toBe(true);
      expect(fs.existsSync(variante)).toBe(true);
    } finally {
      await pool.query(`DELETE FROM hero_slides WHERE image_url = $1`, ['/images/hero/hero-em-uso.webp']);
      fs.unlinkSync(principal);
      fs.unlinkSync(variante);
    }
  });
});
