# Painel Admin — Fase 3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Acabar com o trabalho repetitivo no catálogo (duplicar produto, ações
em massa) e fechar as lacunas de interface da listagem de produtos.

**Architecture:** Duas rotas administrativas novas — duplicação e operações em
lote, ambas transacionais e auditadas pelo helper da fase 0 — e uma revisão da
`AdminDashboardPage` que acrescenta seleção múltipla, estados vazios, esqueletos
de carregamento, paginação em janela e ordenação acessível por teclado.

**Tech Stack:** Node 20 + Express 4 + PostgreSQL 16 (`pg`, SQL cru), Jest +
supertest no backend; React 18 + Vite 6 + Tailwind 3 no frontend.

**Spec:** `docs/superpowers/specs/2026-09-21-painel-admin-melhorias-design.md`
(seção "Fase 3")

## Global Constraints

- Idioma do projeto é pt-BR: textos de UI e mensagens de erro em português.
- Commits em Conventional Commits; push para `main` ao fim de cada task.
- Não tocar em `.github/workflows/deploy.yml` — tem alteração não commitada do
  usuário.
- Toda alteração administrativa nova precisa gravar em `audit_log` via
  `registrar(req, …)` de `server/src/lib/audit.js`.
- Auditoria nunca pode derrubar a requisição que a originou.
- Ação em massa é limitada a **100 ids** por chamada e roda em transação: ou
  aplica em todos, ou em nenhum.
- Duplicação **referencia** a mesma imagem e galeria; não copia arquivo em disco.
- Nenhuma mudança de comportamento público do site.

## Decisões que chegaram depois do spec

- **A fase 2 foi cancelada pelo usuário em 21/09/2026.** Ao planejar a fase 2
  descobriu-se que `nutri_rows`, `nutri_porcoes`, `ingredientes`, `precaucoes` e
  `disclaimer` não são renderizados em `src/pages/ProdutoPage.jsx` (zero
  ocorrências). O editor de tabela nutricional serviria a um campo invisível, e
  o usuário optou por não construir nem exibir por ora. O slug automático ficou
  parado junto.

## Ambiente de teste local

Cluster PostgreSQL 18 descartável na porta 5433 (ver o plano das fases 0 e 1
para a receita completa). Verificar e, se preciso, recriar:

```bash
PGBIN="/c/Program Files/PostgreSQL/18/bin"
"$PGBIN/pg_isready.exe" -p 5433 -h 127.0.0.1
# se um teste deixar lixo:
"$PGBIN/dropdb.exe" -p 5433 -h 127.0.0.1 -U sobral --if-exists sobral_test
"$PGBIN/createdb.exe" -p 5433 -h 127.0.0.1 -U sobral sobral_test
cd server && DATABASE_URL="postgresql://sobral:sobral_pass@127.0.0.1:5433/sobral_test" node src/db/migrate.js
```

**Linha de base ao iniciar esta fase: 43/43 testes passando.** Toda task termina
com a suíte inteira verde.

---

### Task 1: Duplicar produto (backend)

**Files:**
- Modify: `server/src/routes/admin-products.js` (rota nova, antes de `GET /:id`)
- Test: `server/tests/admin-products-duplicate.test.js`

**Interfaces:**
- Consumes: `registrar` de `server/src/lib/audit.js`; `req.admin` do `requireAuth`.
- Produces: `POST /api/admin/products/:id/duplicate` → 201 com o produto criado.
  O novo id é `<id>-copia`, ou `<id>-copia-2`, `-copia-3`… se já existir. O nome
  recebe o sufixo `" (cópia)"`. A cópia nasce com `ativo = false` e
  `destaque = false`.

- [ ] **Step 1: Escrever o teste (vai falhar)**

Criar `server/tests/admin-products-duplicate.test.js`:

```js
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
    // conteúdo copiado
    expect(res.body.tag).toBe('tag x');
    expect(res.body.brand).toBe('Marca');
    expect(res.body.description).toBe('desc');
    // imagem é referenciada, não duplicada em disco
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd server && npx jest tests/admin-products-duplicate.test.js
```

Esperado: FAIL — as rotas respondem 404 porque a rota não existe (o teste de
autenticação pode passar por acidente; os de conteúdo falham).

- [ ] **Step 3: Implementar a rota**

Em `server/src/routes/admin-products.js`, inserir **antes** de
`router.get('/:id', …)` para o Express não casar `:id` com `duplicate`:

```js
// POST /api/admin/products/:id/duplicate
// A cópia referencia a MESMA imagem e galeria do original: nada é copiado em
// disco. É por isso que a limpeza de imagens órfãs precisa varrer todas as
// linhas antes de apagar um arquivo.
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { rows: orig } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!orig.length) return res.status(404).json({ error: 'Produto não encontrado.' });
    const p = orig[0];

    // Procura o primeiro sufixo livre: -copia, -copia-2, -copia-3…
    const base = `${p.id}-copia`;
    const { rows: usados } = await pool.query(
      'SELECT id FROM products WHERE id = $1 OR id LIKE $2',
      [base, `${base}-%`]
    );
    const tomados = new Set(usados.map(r => r.id));
    let novoId = base;
    for (let n = 2; tomados.has(novoId); n++) novoId = `${base}-${n}`;

    const { rows } = await pool.query(
      `INSERT INTO products(id, name, tag, category_id, brand, image, gallery, description,
                            caracteristicas, apresentacao, modo_uso, precaucoes,
                            ingredientes, disclaimer, nutri_porcoes, nutri_rows,
                            ativo, destaque, video)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,false,false,$17)
       RETURNING *`,
      [
        novoId, `${p.name} (cópia)`, p.tag, p.category_id, p.brand, p.image,
        JSON.stringify(p.gallery ?? []), p.description,
        p.caracteristicas, p.apresentacao, p.modo_uso, p.precaucoes,
        p.ingredientes, p.disclaimer, p.nutri_porcoes,
        p.nutri_rows ? JSON.stringify(p.nutri_rows) : null,
        p.video,
      ]
    );

    await registrar(req, {
      acao: 'create', entidade: 'product', entidade_id: novoId,
      campo: 'duplicate', valor_anterior: { origem: p.id }, valor_novo: rows[0],
    });
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Já existe um produto com esse ID.' });
    console.error('POST /api/admin/products/:id/duplicate:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});
```

Tipos conferidos no banco: `caracteristicas` é `text[]` (o driver `pg` serializa
o array JS direto, sem `JSON.stringify`), enquanto `gallery` e `nutri_rows` são
`jsonb` e por isso vão com `JSON.stringify`. O código acima já respeita essa
distinção.

- [ ] **Step 4: Rodar o teste e a suíte**

```bash
cd server && npx jest tests/admin-products-duplicate.test.js && npm test
```

Esperado: 5 novos passando; suíte com 48 passando.

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/admin-products.js server/tests/admin-products-duplicate.test.js
git commit -m "feat(admin): rota para duplicar produto"
git push origin main
```

---

### Task 2: Ações em massa (backend)

**Files:**
- Modify: `server/src/routes/admin-products.js` (rota nova, antes de `GET /:id`)
- Test: `server/tests/admin-products-bulk.test.js`

**Interfaces:**
- Consumes: `registrar`, `req.admin`.
- Produces: `POST /api/admin/products/bulk` com corpo
  `{ ids: string[], acao: 'ativar'|'desativar'|'mover_categoria'|'excluir', valor?: string }`.
  Responde `{ ok: true, afetados: number }`. `valor` é o `category_id` destino e
  só é lido por `mover_categoria`.

- [ ] **Step 1: Escrever o teste (vai falhar)**

Criar `server/tests/admin-products-bulk.test.js`:

```js
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd server && npx jest tests/admin-products-bulk.test.js
```

Esperado: FAIL — rota inexistente.

- [ ] **Step 3: Implementar a rota**

Em `server/src/routes/admin-products.js`, inserir **antes** de
`router.get('/:id', …)`:

```js
const ACOES_BULK = ['ativar', 'desativar', 'mover_categoria', 'excluir'];
const LIMITE_BULK = 100;

// POST /api/admin/products/bulk
// Tudo numa transação: ou aplica em todos os ids, ou em nenhum. Um erro no
// meio de uma exclusão de 40 produtos não pode deixar metade pelo caminho.
router.post('/bulk', async (req, res) => {
  const { ids, acao, valor } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Informe ao menos um produto.' });
  }
  if (ids.length > LIMITE_BULK) {
    return res.status(400).json({ error: `No máximo ${LIMITE_BULK} produtos por vez.` });
  }
  if (!ACOES_BULK.includes(acao)) {
    return res.status(400).json({ error: 'Ação inválida.' });
  }

  const client = await pool.connect();
  try {
    // Validar o destino ANTES de abrir a transação evita rollback inútil.
    if (acao === 'mover_categoria') {
      if (!valor) {
        client.release();
        return res.status(400).json({ error: 'Escolha a categoria de destino.' });
      }
      const dst = await client.query('SELECT id FROM categories WHERE id = $1', [valor]);
      if (!dst.rowCount) {
        client.release();
        return res.status(400).json({ error: 'Categoria de destino não encontrada.' });
      }
    }

    await client.query('BEGIN');

    let afetados;
    if (acao === 'excluir') {
      const r = await client.query('DELETE FROM products WHERE id = ANY($1) RETURNING id', [ids]);
      afetados = r.rows;
    } else if (acao === 'mover_categoria') {
      const r = await client.query(
        'UPDATE products SET category_id = $1, updated_at = NOW() WHERE id = ANY($2) RETURNING id',
        [valor, ids]
      );
      afetados = r.rows;
    } else {
      const novo = acao === 'ativar';
      const r = await client.query(
        'UPDATE products SET ativo = $1, updated_at = NOW() WHERE id = ANY($2) RETURNING id',
        [novo, ids]
      );
      afetados = r.rows;
    }

    await client.query('COMMIT');

    // Auditoria fora da transação: falhar aqui não pode desfazer a operação.
    for (const linha of afetados) {
      await registrar(req, {
        acao: acao === 'excluir' ? 'delete' : 'update',
        entidade: 'product',
        entidade_id: linha.id,
        campo: `bulk:${acao}`,
        valor_novo: acao === 'mover_categoria' ? valor : (acao === 'ativar'),
      });
    }

    res.json({ ok: true, afetados: afetados.length });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Algum produto não pôde ser alterado por vínculo no banco.' });
    }
    console.error('POST /api/admin/products/bulk:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    client.release();
  }
});
```

Cuidado com o `client.release()` duplicado: nos dois retornos antecipados de
`mover_categoria` o `finally` **também** roda. Reescrever esses dois retornos
sem o `release()` manual, deixando só o do `finally`:

```js
      if (!valor) return res.status(400).json({ error: 'Escolha a categoria de destino.' });
      const dst = await client.query('SELECT id FROM categories WHERE id = $1', [valor]);
      if (!dst.rowCount) return res.status(400).json({ error: 'Categoria de destino não encontrada.' });
```

- [ ] **Step 4: Rodar o teste e a suíte**

```bash
cd server && npx jest tests/admin-products-bulk.test.js && npm test
```

Esperado: 12 novos passando; suíte com 60 passando.

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/admin-products.js server/tests/admin-products-bulk.test.js
git commit -m "feat(admin): acoes em massa de produtos em transacao"
git push origin main
```

---

### Task 3: Seleção múltipla e duplicar na listagem

**Files:**
- Modify: `src/pages/admin/AdminDashboardPage.jsx`

**Interfaces:**
- Consumes: `POST /api/admin/products/bulk` e
  `POST /api/admin/products/:id/duplicate` (Tasks 1 e 2).
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Estado da seleção**

Em `src/pages/admin/AdminDashboardPage.jsx`, acrescentar:

```jsx
  const [selecionados, setSelecionados] = useState(new Set());
  const [acaoMassa,    setAcaoMassa]    = useState('');
  const [confirmMassa, setConfirmMassa] = useState(null);

  const alternarSelecao = (id) => setSelecionados(s => {
    const novo = new Set(s);
    if (novo.has(id)) novo.delete(id); else novo.add(id);
    return novo;
  });

  const todosDaPaginaSelecionados =
    products.length > 0 && products.every(p => selecionados.has(p.id));

  const alternarTodosDaPagina = () => setSelecionados(s => {
    const novo = new Set(s);
    if (todosDaPaginaSelecionados) products.forEach(p => novo.delete(p.id));
    else products.forEach(p => novo.add(p.id));
    return novo;
  });
```

A seleção é limpa sempre que a listagem muda de página, filtro ou busca —
senão o usuário aplica uma ação em itens que não está mais vendo:

```jsx
  useEffect(() => { setSelecionados(new Set()); }, [page, debouncedQuery, cat, sort, sortDir]);
```

- [ ] **Step 2: Executar a ação em massa**

```jsx
  const executarMassa = async (acao, valor) => {
    const ids = [...selecionados];
    if (ids.length === 0) return;
    const res = await request('/api/admin/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids, acao, valor }),
    });
    if (!res) return;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(data.error || 'Erro ao aplicar a ação.'); return; }
    toast.success(`${data.afetados} produto${data.afetados !== 1 ? 's' : ''} atualizado${data.afetados !== 1 ? 's' : ''}`);
    setSelecionados(new Set());
    setAcaoMassa('');
    fetchProducts();
    refreshStats();
  };
```

- [ ] **Step 3: Duplicar**

```jsx
  const duplicar = async (id) => {
    const res = await request(`/api/admin/products/${id}/duplicate`, { method: 'POST' });
    if (!res) return;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(data.error || 'Erro ao duplicar.'); return; }
    toast.success('Cópia criada como inativa');
    navigate(`/admin/produtos/${data.id}/editar`);
  };
```

E um botão "Duplicar" ao lado de "Editar", nas duas variantes (tabela desktop e
card mobile):

```jsx
                        <button
                          onClick={() => duplicar(p.id)}
                          className="text-ink-light hover:text-orange font-[600] transition-colors"
                        >
                          Duplicar
                        </button>
```

- [ ] **Step 4: Coluna de checkbox na tabela**

No `<thead>`, antes da coluna "Produto":

```jsx
                  <th className="px-4 py-3 w-[40px]">
                    <input
                      type="checkbox"
                      checked={todosDaPaginaSelecionados}
                      onChange={alternarTodosDaPagina}
                      aria-label="Selecionar todos os produtos desta página"
                      className="w-4 h-4 accent-orange"
                    />
                  </th>
```

E em cada `<tr>`, antes da célula do produto:

```jsx
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selecionados.has(p.id)}
                        onChange={() => alternarSelecao(p.id)}
                        aria-label={`Selecionar ${p.name}`}
                        className="w-4 h-4 accent-orange"
                      />
                    </td>
```

No card mobile, o checkbox entra no canto superior esquerdo, antes da imagem.

- [ ] **Step 5: Barra flutuante**

Renderizar quando houver seleção, fixa no rodapé:

```jsx
      {selecionados.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-[220px] bg-white border-t border-line shadow-[0_-2px_10px_rgba(0,0,0,.06)] px-4 py-3 z-50 flex flex-wrap items-center gap-3">
          <span className="text-[13px] font-[700] text-ink">
            {selecionados.size} selecionado{selecionados.size !== 1 ? 's' : ''}
          </span>
          <button onClick={() => executarMassa('ativar')}
            className="text-[13px] font-[600] text-green-700 hover:underline">Ativar</button>
          <button onClick={() => executarMassa('desativar')}
            className="text-[13px] font-[600] text-ink-light hover:underline">Desativar</button>
          <select
            value={acaoMassa}
            onChange={e => { const v = e.target.value; if (v) executarMassa('mover_categoria', v); }}
            aria-label="Mover selecionados para a categoria"
            className="border border-line rounded-[8px] px-2 py-1.5 text-[13px] bg-white outline-none focus:border-orange"
          >
            <option value="">Mover para…</option>
            {categories.filter(c => c.id !== 'all').map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <button onClick={() => setConfirmMassa(selecionados.size)}
            className="text-[13px] font-[700] text-red-600 hover:underline">Excluir</button>
          <button onClick={() => setSelecionados(new Set())}
            className="ml-auto text-[13px] font-[600] text-muted hover:text-ink-light">Limpar seleção</button>
        </div>
      )}

      <ConfirmModal
        open={!!confirmMassa}
        title="Excluir produtos"
        message={`Tem certeza que deseja excluir ${confirmMassa} produto${confirmMassa !== 1 ? 's' : ''}? Esta ação não pode ser desfeita. Para apenas tirá-los do site, use Desativar.`}
        confirmLabel="Excluir"
        onConfirm={() => { setConfirmMassa(null); executarMassa('excluir'); }}
        onCancel={() => setConfirmMassa(null)}
      />
```

- [ ] **Step 6: Verificação manual**

```bash
npm run build
```

Com backend rodando e sessão aberta em `/admin`:

1. Marcar dois produtos: a barra aparece com "2 selecionados".
2. "Desativar": ambos viram Inativo, a barra some, as métricas no topo mudam.
3. Marcar de novo, "Mover para…" uma categoria: a coluna Categoria muda nos dois.
4. Marcar e "Excluir": o modal nomeia a quantidade; confirmando, somem da lista.
5. Marcar um item, trocar de página: a seleção se limpa (a barra some).
6. "Duplicar" num produto: abre o editor da cópia, com nome "(cópia)" e o
   checkbox "Produto ativo" desmarcado.

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/AdminDashboardPage.jsx
git commit -m "feat(admin): selecao multipla, acoes em massa e duplicar na listagem"
git push origin main
```

---

### Task 4: Polimento da listagem

**Files:**
- Modify: `src/pages/admin/AdminDashboardPage.jsx`

**Interfaces:**
- Consumes: nada novo.
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Estado vazio**

Hoje uma busca sem resultado deixa a tabela vazia e muda. Envolver a
renderização da lista:

```jsx
          {products.length === 0 ? (
            <div className="bg-white border border-line rounded-[10px] py-16 px-4 text-center">
              <p className="text-[15px] font-[700] text-ink mb-1">
                {query || cat !== 'all' ? 'Nenhum produto encontrado' : 'Nenhum produto no catálogo'}
              </p>
              <p className="text-[13px] text-muted mb-4">
                {query || cat !== 'all'
                  ? 'Tente outro termo de busca ou remova o filtro de categoria.'
                  : 'Cadastre o primeiro produto para ele aparecer no site.'}
              </p>
              {(query || cat !== 'all') ? (
                <button
                  onClick={() => { setQuery(''); setCat('all'); setPage(1); }}
                  className="text-[13px] font-[700] text-orange hover:underline"
                >
                  Limpar filtros
                </button>
              ) : (
                <button
                  onClick={() => navigate('/admin/produtos/novo')}
                  className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors"
                >
                  + Novo produto
                </button>
              )}
            </div>
          ) : (
            <>{/* tabela desktop + cards mobile já existentes */}</>
          )}
```

- [ ] **Step 2: Esqueletos de carregamento**

Trocar `<div className="py-16 text-center text-muted text-[14px]">Carregando...</div>`
por linhas cinzas pulsando, que não deslocam o layout quando o conteúdo chega:

```jsx
        <div className="bg-white rounded-[10px] border border-line overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-0">
              <div className="w-10 h-10 rounded bg-[#EEE] animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 w-1/3 bg-[#EEE] rounded animate-pulse mb-2" />
                <div className="h-2.5 w-1/4 bg-[#F2F2F2] rounded animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-[#EEE] rounded-full animate-pulse" />
            </div>
          ))}
        </div>
```

- [ ] **Step 3: Paginação em janela**

Hoje é um botão por página, sem limite. Substituir a geração por uma janela com
reticências:

```jsx
// Fora do componente: primeira, última, a atual e as vizinhas; o resto vira '…'.
function paginasVisiveis(atual, total) {
  const set = new Set([1, total, atual, atual - 1, atual + 1]);
  const paginas = [...set].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
  const saida = [];
  let anterior = 0;
  for (const n of paginas) {
    if (anterior && n - anterior > 1) saida.push('…');
    saida.push(n);
    anterior = n;
  }
  return saida;
}
```

e no JSX, no lugar do `Array.from({ length: totalPages } …)`:

```jsx
                  {paginasVisiveis(page, totalPages).map((n, i) =>
                    n === '…' ? (
                      <span key={`gap-${i}`} className="w-8 h-8 grid place-items-center text-muted text-[13px]">…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        aria-current={page === n ? 'page' : undefined}
                        className={`w-8 h-8 rounded-[6px] border text-[13px] font-bold transition-all ${
                          page === n ? 'bg-orange border-orange text-white' : 'bg-white border-line text-ink-light hover:border-orange hover:text-orange'
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}
```

- [ ] **Step 4: Ordenação acessível por teclado**

Os `<th onClick>` atuais não são focáveis nem anunciam o estado. Trocar cada um
por um botão dentro do `th`, com `aria-sort` na célula:

```jsx
                  <th
                    scope="col"
                    aria-sort={sort === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="px-4 py-3 font-[700] text-ink-light whitespace-nowrap"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-1 hover:text-orange transition-colors"
                    >
                      Produto <SortIcon active={sort === 'name'} dir={sortDir} />
                    </button>
                  </th>
```

Repetir para "Categoria" (`category_id`) e "Marca" (`brand`). As colunas Status
e Ações ganham apenas `scope="col"`.

- [ ] **Step 5: Verificação manual**

```bash
npm run build
```

1. Buscar por um termo inexistente: aparece "Nenhum produto encontrado" com
   "Limpar filtros", e o botão realmente limpa busca e categoria.
2. Recarregar a página: aparecem as linhas cinzas pulsando antes da tabela.
3. Com poucos produtos, a paginação some (1 página). Forçar `per_page` baixo no
   `fetchProducts` temporariamente para conferir a janela com "…" e reverter.
4. Navegar só com Tab até o cabeçalho "Produto" e apertar Enter: a ordenação
   inverte. Um leitor de tela deve anunciar o estado de ordenação.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/AdminDashboardPage.jsx
git commit -m "feat(admin): estado vazio, esqueletos, paginacao em janela e ordenacao acessivel"
git push origin main
```

---

### Task 5: Preview do arquivo escolhido e Ctrl+S

**Files:**
- Create: `src/hooks/useAtalhoSalvar.js`
- Modify: `src/pages/admin/AdminProductFormPage.jsx`
- Modify: `src/pages/admin/AdminMisturinhasPage.jsx`

**Interfaces:**
- Produces: `useAtalhoSalvar(callback, ativo)` — registra Ctrl+S / Cmd+S
  enquanto `ativo` for verdadeiro.

- [ ] **Step 1: Criar o hook de atalho**

Criar `src/hooks/useAtalhoSalvar.js`:

```js
import { useEffect } from 'react';

// Ctrl+S (Cmd+S no Mac) salva o formulário em vez de abrir o "salvar página"
// do navegador. Em formulários longos, poupa a rolagem até o botão.
export function useAtalhoSalvar(aoSalvar, ativo = true) {
  useEffect(() => {
    if (!ativo) return;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        aoSalvar();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aoSalvar, ativo]);
}
```

- [ ] **Step 2: Preview do arquivo no formulário de produto**

Hoje o `<img>` mostra `form.image` — a URL antiga — mesmo depois de escolher um
arquivo novo. Acrescentar o preview do arquivo local:

```jsx
  const [previewLocal, setPreviewLocal] = useState('');

  // objectURL precisa ser revogado, senão o blob fica preso na memória.
  useEffect(() => {
    if (!imageFile) { setPreviewLocal(''); return; }
    const url = URL.createObjectURL(imageFile);
    setPreviewLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);
```

e trocar a renderização da miniatura por:

```jsx
            {(previewLocal || form.image) && (
              <img
                src={previewLocal || form.image}
                alt=""
                className="w-16 h-16 object-contain rounded border border-line"
              />
            )}
```

- [ ] **Step 3: Ligar o atalho nos dois formulários**

Em `AdminProductFormPage`, o `handleSubmit` recebe um evento; criar um invólucro:

```jsx
  useAtalhoSalvar(() => {
    if (!saving && !uploading) handleSubmit({ preventDefault: () => {} });
  }, true);
```

Em `AdminMisturinhasPage`, só quando o formulário estiver aberto:

```jsx
  useAtalhoSalvar(() => {
    if (form && !saving) handleSave({ preventDefault: () => {} });
  }, !!form);
```

- [ ] **Step 4: Verificação manual**

```bash
npm run build
```

1. Em `/admin/produtos/novo`, escolher um arquivo de imagem: a miniatura passa a
   mostrar **o arquivo escolhido**, não a URL antiga.
2. Trocar por outro arquivo: a miniatura acompanha.
3. Preencher Nome e apertar Ctrl+S: salva, sem abrir a caixa de "salvar página"
   do navegador.
4. Em `/admin/misturinhas` com o formulário fechado, Ctrl+S **não** deve
   disparar nada.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAtalhoSalvar.js src/pages/admin/AdminProductFormPage.jsx src/pages/admin/AdminMisturinhasPage.jsx
git commit -m "feat(admin): preview do arquivo escolhido e atalho Ctrl+S"
git push origin main
```

---

## Self-Review

**Cobertura do spec (fase 3):**

| Requisito do spec | Task |
|---|---|
| `POST /:id/duplicate`, inativo, sufixo `-copia` numerado | 1 |
| Imagem referenciada, não copiada em disco | 1 |
| `POST /bulk` com 4 ações, transação, limite 100 | 2 |
| Validação da categoria destino antes da transação | 2 |
| Uma linha de auditoria por produto afetado | 2 |
| Checkbox por linha e no cabeçalho, barra flutuante | 3 |
| Confirmação nomeando a quantidade ao excluir | 3 |
| Empty state | 4 |
| Skeletons | 4 |
| Paginação em janela | 4 |
| Ordenação acessível com `aria-sort` | 4 |
| Preview do arquivo escolhido | 5 |
| Ctrl+S | 5 |

**Consistência de tipos:** `afetados` é número na resposta do bulk (Task 2) e é
lido como número na Task 3. `selecionados` é um `Set<string>` em toda a Task 3.
`paginasVisiveis` devolve `(number|'…')[]` e a Task 4 trata os dois casos.

**Riscos conhecidos:**

1. **Ordem das rotas.** `/bulk` e `/:id/duplicate` precisam ser registradas
   antes de `GET /:id`, senão o Express casa `bulk` como id de produto. Os
   testes de 404 pegam isso.
2. **`client.release()` duplicado** nos retornos antecipados da rota bulk — o
   Step 3 da Task 2 já corrige explicitamente.
3. **Seleção órfã:** sem o `useEffect` que limpa a seleção ao trocar página ou
   filtro, o usuário aplicaria ação em itens fora da vista. Coberto na Task 3
   Step 1 e no roteiro manual item 5.
4. Tipos mistos na tabela `products`: `caracteristicas` é `text[]`, enquanto
   `gallery` e `nutri_rows` são `jsonb`. Serializar o array de características
   com `JSON.stringify` quebraria o INSERT — a Task 1 Step 3 trata os dois
   casos de forma diferente de propósito.
