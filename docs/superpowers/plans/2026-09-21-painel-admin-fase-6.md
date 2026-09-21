# Painel Admin — Fase 6 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parar o acúmulo de imagens órfãs no volume, apagando um arquivo
apenas quando nenhuma linha do banco mais o referencia.

**Architecture:** Um módulo `lib/imagens.js` concentra a decisão de apagar,
com três travas — diretório permitido, não ser link simbólico e nenhuma
referência no banco — e registra toda exclusão no `audit_log`. As rotas de
produto e de hero slide chamam esse módulo **depois** de confirmarem a
alteração no banco.

**Tech Stack:** Node 20 + Express 4 + PostgreSQL 16 (`pg`), `fs` síncrono;
Jest + supertest.

**Spec:** `docs/superpowers/specs/2026-09-21-painel-admin-melhorias-design.md`
(seção "Fase 6")

## Global Constraints

- Idioma do projeto é pt-BR.
- Commits em Conventional Commits; push para `main` ao fim de cada task.
- Não tocar em `.github/workflows/deploy.yml`.
- **A exclusão nunca pode lançar**: falhar em apagar um arquivo não pode
  derrubar o salvamento que a originou.
- Só apaga dentro de `public/images/{produtos,hero,cms}`.
- Só apaga depois do commit da alteração no banco. Consultar antes veria a
  própria linha antiga como referência e nunca apagaria nada.
- Toda exclusão vai para o `audit_log` (`entidade: 'image'`).

## Contexto acumulado

- Fases 0, 1, 3, 4 e 5 entregues; fase 2 cancelada pelo usuário.
- URLs de imagem são caminhos web: `/images/{produtos|hero|cms}/<arquivo>.webp`
  (`server/src/routes/upload.js`). Os arquivos ficam em `public/images/<tipo>/`.
- Em produção esses três diretórios são volumes Docker montados
  (`docker-compose.yml`), então a exclusão opera sobre o caminho montado.
- **A duplicação de produto (fase 3) faz duas linhas apontarem para o mesmo
  arquivo.** É exatamente por isso que a trava varre todas as linhas do banco,
  e não só a que está sendo alterada.
- Colunas que podem referenciar uma imagem: `products.image` (text),
  `products.gallery` (jsonb array de strings), `hero_slides.image_url` (text),
  `hero_slides.layers` (jsonb array de objetos com `url`), `page_content.value`
  (text).

**Linha de base ao iniciar: 88/88 testes passando.**

---

### Task 1: Módulo de exclusão com trava de referência

**Files:**
- Create: `server/src/lib/imagens.js`
- Test: `server/tests/imagens.test.js`

**Interfaces:**
- Consumes: `pool`, `registrar` de `lib/audit.js`.
- Produces:
  - `estaEmUso(caminho) → Promise<boolean>`
  - `removerSeOrfa(req, caminho) → Promise<'removida'|'em-uso'|'fora-do-escopo'|'inexistente'|'erro'>`
  - `removerVarias(req, caminhos) → Promise<void>` — laço sobre `removerSeOrfa`,
    ignorando valores falsos e duplicados.

- [ ] **Step 1: Escrever o teste (vai falhar)**

Criar `server/tests/imagens.test.js`:

```js
const fs   = require('fs');
const path = require('path');
const pool = require('../src/db');
const { estaEmUso, removerSeOrfa } = require('../src/lib/imagens');

const DIR_PRODUTOS = path.join(__dirname, '..', '..', 'public', 'images', 'produtos');
const req = { admin: { id: null, email: 'teste@test.com' }, ip: '127.0.0.1' };

function criarArquivo(nome) {
  fs.mkdirSync(DIR_PRODUTOS, { recursive: true });
  const p = path.join(DIR_PRODUTOS, nome);
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
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd server && npx jest tests/imagens.test.js
```

Esperado: FAIL — `Cannot find module '../src/lib/imagens'`.

- [ ] **Step 3: Implementar o módulo**

Criar `server/src/lib/imagens.js`:

```js
const fs   = require('fs');
const path = require('path');
const pool = require('../db');
const { registrar } = require('./audit');

const TIPOS_PERMITIDOS = ['produtos', 'hero', 'cms'];
// server/src/lib → raiz do repositório
const RAIZ_IMAGENS = path.resolve(__dirname, '..', '..', '..', 'public', 'images');

// Converte a URL pública em caminho absoluto, recusando tudo que escape dos
// diretórios permitidos. Devolve null quando o caminho não é aceitável.
function resolverCaminho(url) {
  if (!url || typeof url !== 'string') return null;

  const limpo = url.trim().split('?')[0].split('#')[0];
  if (!limpo.startsWith('/images/')) return null;

  const relativo = limpo.slice('/images/'.length);
  const tipo = relativo.split('/')[0];
  if (!TIPOS_PERMITIDOS.includes(tipo)) return null;

  const absoluto = path.resolve(RAIZ_IMAGENS, relativo);
  const base = path.resolve(RAIZ_IMAGENS, tipo);

  // Trava contra travessia de diretório: o resultado precisa continuar dentro
  // do diretório do tipo.
  if (absoluto !== base && !absoluto.startsWith(base + path.sep)) return null;

  return absoluto;
}

// Varre TODAS as linhas que podem apontar para uma imagem. A duplicação de
// produto faz duas linhas compartilharem o mesmo arquivo, então não basta
// olhar a linha que acabou de mudar.
async function estaEmUso(url) {
  const { rows } = await pool.query(
    `SELECT
       EXISTS(SELECT 1 FROM products     WHERE image = $1)                   AS p_img,
       EXISTS(SELECT 1 FROM products     WHERE gallery @> $2::jsonb)         AS p_gal,
       EXISTS(SELECT 1 FROM hero_slides  WHERE image_url = $1)               AS h_img,
       EXISTS(SELECT 1 FROM hero_slides  WHERE layers::text LIKE $3)         AS h_lay,
       EXISTS(SELECT 1 FROM page_content WHERE value LIKE $3)                AS c_val`,
    [url, JSON.stringify([url]), `%${url}%`]
  );
  const r = rows[0];
  return r.p_img || r.p_gal || r.h_img || r.h_lay || r.c_val;
}

// Apaga o arquivo SÓ se nada mais o referenciar. Nunca lança: perder a
// limpeza não pode derrubar a operação que a originou.
async function removerSeOrfa(req, url) {
  try {
    const absoluto = resolverCaminho(url);
    if (!absoluto) return 'fora-do-escopo';

    // lstat (não stat): um link simbólico nunca é seguido.
    let st;
    try {
      st = fs.lstatSync(absoluto);
    } catch {
      return 'inexistente';
    }
    if (!st.isFile()) return 'fora-do-escopo';

    if (await estaEmUso(url)) return 'em-uso';

    fs.unlinkSync(absoluto);
    await registrar(req, {
      acao: 'delete', entidade: 'image', entidade_id: url,
      valor_anterior: { bytes: st.size },
    });
    return 'removida';
  } catch (err) {
    console.error('removerSeOrfa falhou:', err.message);
    return 'erro';
  }
}

async function removerVarias(req, urls) {
  const unicas = [...new Set((urls || []).filter(Boolean))];
  for (const url of unicas) {
    await removerSeOrfa(req, url);
  }
}

module.exports = { estaEmUso, removerSeOrfa, removerVarias };
```

- [ ] **Step 4: Rodar o teste e a suíte**

```bash
cd server && npx jest tests/imagens.test.js && npm test
```

Esperado: 10 novos passando; suíte com 98 passando.

- [ ] **Step 5: Commit**

```bash
git add server/src/lib/imagens.js server/tests/imagens.test.js
git commit -m "feat(admin): modulo de exclusao de imagem orfa com trava de referencia"
git push origin main
```

---

### Task 2: Ligar a limpeza às rotas

**Files:**
- Modify: `server/src/routes/admin-products.js` (PUT e DELETE)
- Modify: `server/src/routes/admin-hero-slides.js` (PUT e DELETE)
- Test: `server/tests/imagens-rotas.test.js`

**Interfaces:**
- Consumes: `removerVarias` (Task 1).
- Produces: nenhuma mudança de contrato de API. A limpeza é efeito colateral,
  sempre **após** a resposta ao banco estar confirmada.

- [ ] **Step 1: Escrever o teste (vai falhar)**

Criar `server/tests/imagens-rotas.test.js`:

```js
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd server && npx jest tests/imagens-rotas.test.js
```

Esperado: FAIL — os arquivos continuam existindo depois das operações.

- [ ] **Step 3: Ligar em `admin-products.js`**

Importar no topo:

```js
const { removerVarias } = require('../lib/imagens');
```

No `PUT /:id`, depois do `await registrar(...)` e antes do `res.json(rows[0])`,
comparar o antes e o depois e limpar o que saiu:

```js
    // Depois do UPDATE confirmado: consultar antes veria a própria linha
    // antiga como referência e nunca apagaria nada.
    const antes = anterior.rows[0];
    if (antes) {
      const antigas = [antes.image, ...(Array.isArray(antes.gallery) ? antes.gallery : [])];
      const atuais  = new Set([rows[0].image, ...(Array.isArray(rows[0].gallery) ? rows[0].gallery : [])]);
      await removerVarias(req, antigas.filter(u => u && !atuais.has(u)));
    }
```

No `DELETE /:id`, depois do `await registrar(...)`:

```js
    await removerVarias(req, [
      rows[0].image,
      ...(Array.isArray(rows[0].gallery) ? rows[0].gallery : []),
    ]);
```

- [ ] **Step 4: Ligar em `admin-hero-slides.js`**

Importar `removerVarias` e uma função local para extrair urls das camadas:

```js
const { removerVarias } = require('../lib/imagens');

// As camadas são objetos; só as de imagem têm url.
function urlsDasCamadas(layers) {
  if (!Array.isArray(layers)) return [];
  return layers.filter(l => l && l.type === 'image' && l.url).map(l => l.url);
}
```

No `PUT /:id`, depois do registro de auditoria:

```js
    const antes  = anterior.rows[0];
    if (antes) {
      const antigas = [antes.image_url, ...urlsDasCamadas(antes.layers)];
      const atuais  = new Set([rows[0].image_url, ...urlsDasCamadas(rows[0].layers)]);
      await removerVarias(req, antigas.filter(u => u && !atuais.has(u)));
    }
```

No `DELETE /:id`, depois do registro:

```js
    await removerVarias(req, [rows[0].image_url, ...urlsDasCamadas(rows[0].layers)]);
```

- [ ] **Step 5: Rodar o teste e a suíte**

```bash
cd server && npx jest tests/imagens-rotas.test.js && npm test
```

Esperado: 5 novos passando; suíte com 103 passando.

- [ ] **Step 6: Conferir que nenhum arquivo de teste ficou para trás**

```bash
ls public/images/produtos/ | grep -E "^rota-|^orfa-|^ainda-" || echo "limpo"
```

Esperado: `limpo`. Se sobrar algo, apagar à mão — são arquivos criados pelos
testes, não do projeto.

- [ ] **Step 7: Commit**

```bash
git add server/src/routes/admin-products.js server/src/routes/admin-hero-slides.js server/tests/imagens-rotas.test.js
git commit -m "feat(admin): remove imagem orfa ao excluir ou trocar produto e slide"
git push origin main
```

---

### Task 3: Atualizar o CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Registrar o módulo e a regra**

- Acrescentar `lib/imagens.js` na árvore do backend.
- Na seção de convenções: "Imagens: arquivo é apagado ao sair do último uso;
  só dentro de public/images/{produtos,hero,cms} e sempre auditado".

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: registra limpeza de imagens orfas no CLAUDE.md"
git push origin main
```

---

## Decisão pendente: decomposição do `AdminSlideBuilderPage`

O spec previa, nesta fase, quebrar `AdminSlideBuilderPage.jsx` (623 linhas) em
canvas, lista de camadas e inspetor de propriedades.

**Recomendação: adiar.** É a única peça do projeto inteiro que é puro ganho
interno, sem efeito para quem usa o painel, e ao mesmo tempo a mais arriscada
de mexer: um editor de arrastar-e-soltar com redimensionamento por handles,
estado de ponteiro e animações, sem nenhuma cobertura de teste e sem meio de
verificar em navegador nesta sessão (o MCP do Playwright não conectou). Cada
commit vai para produção pelo deploy automático, então uma regressão silenciosa
aqui quebra a edição de hero slides no ar.

Vale fazer quando houver como verificar interativamente, ou junto de uma
próxima mudança funcional no builder, que justifique o risco.

Fica registrado aqui em vez de simplesmente sumir do escopo.

---

## Self-Review

**Cobertura do spec (fase 6):**

| Requisito do spec | Task |
|---|---|
| `lib/imagens.js` com `removerSeOrfa` | 1 |
| Recusa fora de `public/images/{produtos,hero,cms}` | 1 |
| Recusa link simbólico (`lstat`) | 1 |
| Varredura das 5 colunas que referenciam imagem | 1 |
| Registro em `audit_log` | 1 |
| Nunca lança | 1 |
| Acionada no DELETE e no PUT de produto | 2 |
| Acionada no DELETE e no PUT de hero slide | 2 |
| Chamada depois do commit no banco | 2 |
| Decomposição do slide builder | adiada, com justificativa acima |
| CLAUDE.md | 3 |

**Consistência de tipos:** `removerSeOrfa` devolve sempre uma das cinco strings
de estado, nunca lança; `removerVarias` devolve `void` e engole tudo.
`gallery` e `layers` chegam do `pg` já desserializados (jsonb → array JS), por
isso os `Array.isArray` antes de espalhar.

**Riscos conhecidos:**

1. **Falso positivo do `LIKE`** em `layers` e `page_content`: um caminho que
   seja substring de outro (`/images/hero/a.webp` dentro de
   `/images/hero/xa.webp`) marca como "em uso" e **não** apaga. O erro é na
   direção segura — sobra arquivo, nunca some arquivo em uso.
2. **Arquivos de teste no diretório real:** os testes escrevem em
   `public/images/produtos/`. Todos limpam o que criam, e o Step 6 da Task 2
   confere. Vale não rodar a suíte com o volume de produção montado.
3. **Volume Docker:** em produção o diretório é volume montado; a exclusão
   opera nele normalmente, mas um arquivo apagado ali **não** volta por deploy,
   já que não está no repositório. É o comportamento escolhido pelo usuário,
   com a trava de referência como proteção.
