# Painel Admin — Fases 4 e 5 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o histórico de alterações consultável e reversível no CMS
(fase 4) e trocar a credencial única por usuários de verdade, com papéis e
revogação individual (fase 5).

**Architecture:** O `audit_log` da fase 0 ganha uma API de leitura paginada e
uma rota de restauração restrita a conteúdo de CMS, mais uma página
`/admin/historico` e um histórico por campo dentro do editor de conteúdo. Em
seguida o login passa a consultar `admin_users`, com CRUD de usuários protegido
por `requirePapel('admin')` e troca da própria senha para todos.

**Tech Stack:** Node 20 + Express 4 + PostgreSQL 16 (`pg`, SQL cru), Jest +
supertest no backend; React 18 + Vite 6 + React Router 6.28 + Tailwind 3.

**Spec:** `docs/superpowers/specs/2026-09-21-painel-admin-melhorias-design.md`
(seções "Fase 4" e "Fase 5")

## Global Constraints

- Idioma do projeto é pt-BR: textos de UI e mensagens de erro em português.
- Commits em Conventional Commits; push para `main` ao fim de cada task.
- Não tocar em `.github/workflows/deploy.yml` — tem alteração não commitada do
  usuário.
- Restauração aceita **apenas** `entidade = 'content'`. Qualquer outra entidade
  responde 400 explicando. Restaurar grava `acao = 'restore'`, de modo que a
  própria restauração seja reversível.
- A credencial do `.env` só vale quando **não existe nenhum** usuário ativo em
  `admin_users` — mesma regra já implementada no `requireAuth`.
- Travas de usuários verificadas dentro da transação: ninguém se desativa nem se
  exclui, e sempre resta ao menos um `admin` ativo.
- Esconder item de menu não é controle de acesso: o backend barra sempre.
- Senhas com bcrypt custo 10, como no login atual.
- Nenhuma mudança de comportamento público do site.

## Contexto acumulado

- Fases 0, 1 e 3 estão entregues. A fase 2 foi cancelada pelo usuário em
  21/09/2026 (os campos que ela serviria não são renderizados no site).
- `requireAuth` já popula `req.admin = { id, email, nome, papel }` e `req.tokenExp`.
- `registrar(req, …)` de `server/src/lib/audit.js` já grava todas as alterações
  administrativas, inclusive `valor_anterior` do CMS — é essa coluna que a
  restauração desta fase consome.
- `emitirSessao(res, admin)` em `server/src/routes/auth.js` centraliza a emissão
  do cookie e devolve `expiresAt`.

## Ambiente de teste local

Cluster PostgreSQL 18 descartável na porta 5433 (receita completa no plano das
fases 0 e 1). **Linha de base ao iniciar: 59/59 testes passando.**

```bash
PGBIN="/c/Program Files/PostgreSQL/18/bin"
"$PGBIN/pg_isready.exe" -p 5433 -h 127.0.0.1
cd server && npm test
```

---

# FASE 4 — Histórico e restauração

### Task 1: API de consulta e restauração

**Files:**
- Create: `server/src/routes/admin-audit.js`
- Modify: `server/src/app.js` (montar a rota)
- Test: `server/tests/admin-audit.test.js`

**Interfaces:**
- Consumes: `requireAuth`, `registrar`, tabela `audit_log`.
- Produces:
  - `GET /api/admin/audit` → `{ data, total, page, totalPages }`. Filtros por
    query string: `entidade`, `entidade_id`, `campo`, `user_email`, `de`, `ate`,
    `page`, `per_page` (máx. 50). Ordena por `criado_em DESC`.
  - `POST /api/admin/audit/:id/restore` → `{ ok: true, page, key, value }`.
    400 para entidade diferente de `content`; 404 para id inexistente.

- [ ] **Step 1: Escrever o teste (vai falhar)**

Criar `server/tests/admin-audit.test.js`:

```js
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
    const ultima = hist.body.data[0];          // valor_anterior = 'original'

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
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd server && npx jest tests/admin-audit.test.js
```

Esperado: FAIL — rota inexistente (404 em tudo).

- [ ] **Step 3: Implementar a rota**

Criar `server/src/routes/admin-audit.js`:

```js
const { Router }  = require('express');
const pool        = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { registrar } = require('../lib/audit');

const router = Router();
router.use(requireAuth);

// GET /api/admin/audit — histórico paginado, do mais recente para o mais antigo
router.get('/', async (req, res) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(req.query.per_page) || 25));
    const offset  = (page - 1) * perPage;

    const params = [];
    const where  = [];
    const filtro = (coluna, valor) => {
      if (!valor) return;
      params.push(valor);
      where.push(`${coluna} = $${params.length}`);
    };

    filtro('entidade',    req.query.entidade);
    filtro('entidade_id', req.query.entidade_id);
    filtro('campo',       req.query.campo);
    filtro('user_email',  req.query.user_email);
    filtro('acao',        req.query.acao);

    if (req.query.de)  { params.push(req.query.de);  where.push(`criado_em >= $${params.length}`); }
    if (req.query.ate) { params.push(req.query.ate); where.push(`criado_em <= $${params.length}`); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countRes = await pool.query(`SELECT COUNT(*) FROM audit_log ${whereClause}`, params);
    const total    = parseInt(countRes.rows[0].count);

    params.push(perPage, offset);
    const dataRes = await pool.query(
      `SELECT id, user_id, user_email, acao, entidade, entidade_id, campo,
              valor_anterior, valor_novo, ip, criado_em
       FROM audit_log ${whereClause}
       ORDER BY criado_em DESC, id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const totalPages = Math.ceil(total / perPage) || 1;
    res.json({ data: dataRes.rows, total, page: Math.min(page, totalPages), totalPages });
  } catch (err) {
    console.error('GET /api/admin/audit:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/admin/audit/:id/restore
// Só conteúdo de CMS. Produto, categoria e slide têm vínculos e estado demais
// para uma restauração cega ser segura — foi decisão explícita do escopo.
router.post('/:id/restore', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Registro não encontrado.' });

  try {
    const { rows } = await pool.query('SELECT * FROM audit_log WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Registro não encontrado.' });

    const log = rows[0];
    if (log.entidade !== 'content') {
      return res.status(400).json({
        error: 'Só é possível restaurar campos de conteúdo das páginas.',
      });
    }
    if (!log.campo) {
      return res.status(400).json({ error: 'Registro sem campo identificado.' });
    }

    const pagina = log.entidade_id;
    const chave  = log.campo;
    const alvo   = log.valor_anterior ?? '';

    const atual = await pool.query(
      'SELECT value FROM page_content WHERE page = $1 AND key = $2', [pagina, chave]
    );

    await pool.query(
      `INSERT INTO page_content (page, key, value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (page, key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = NOW()`,
      [pagina, chave, alvo]
    );

    // A própria restauração vira histórico: dá para desfazer a desfeita.
    await registrar(req, {
      acao: 'restore', entidade: 'content', entidade_id: pagina, campo: chave,
      valor_anterior: atual.rows[0]?.value ?? null,
      valor_novo: alvo,
    });

    res.json({ ok: true, page: pagina, key: chave, value: alvo });
  } catch (err) {
    console.error('POST /api/admin/audit/:id/restore:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
```

- [ ] **Step 4: Montar a rota no app**

Em `server/src/app.js`, junto dos outros requires administrativos:

```js
const adminAuditRouter      = require('./routes/admin-audit');
```

e junto dos outros `app.use` de `/api/admin/*`:

```js
app.use('/api/admin/audit', adminAuditRouter);
```

Conferir a ordem: precisa ficar antes de qualquer rota curinga, se houver.

- [ ] **Step 5: Rodar o teste e a suíte**

```bash
cd server && npx jest tests/admin-audit.test.js && npm test
```

Esperado: 9 novos passando; suíte com 68 passando.

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/admin-audit.js server/src/app.js server/tests/admin-audit.test.js
git commit -m "feat(admin): API de historico com restauracao de conteudo"
git push origin main
```

---

### Task 2: Página de histórico

**Files:**
- Create: `src/pages/admin/AdminHistoricoPage.jsx`
- Modify: `src/App.jsx` (rota `/admin/historico`)
- Modify: `src/pages/admin/AdminLayout.jsx` (item na sidebar, seção "Sistema")
- Modify: `src/components/admin/AdminMobileDrawer.jsx` (mesmo item no drawer)

**Interfaces:**
- Consumes: `GET /api/admin/audit` (Task 1).
- Produces: rota `/admin/historico`.

- [ ] **Step 1: Criar a página**

Criar `src/pages/admin/AdminHistoricoPage.jsx`:

```jsx
import { useState, useEffect, useCallback } from 'react';
import { useAdminFetch } from '../../hooks/useAdminFetch';

const ENTIDADES = {
  product:    'Produto',
  category:   'Categoria',
  content:    'Conteúdo',
  hero_slide: 'Slide',
  misturinha: 'Misturinha',
  image:      'Imagem',
  user:       'Usuário',
};

const ACOES = {
  create:  { label: 'Criou',      cor: 'bg-green-100 text-green-700' },
  update:  { label: 'Alterou',    cor: 'bg-blue-50 text-blue-600' },
  delete:  { label: 'Excluiu',    cor: 'bg-red-50 text-red-600' },
  restore: { label: 'Restaurou',  cor: 'bg-orange-50 text-orange' },
  login:   { label: 'Entrou',     cor: 'bg-[#F0F0F0] text-ink-light' },
};

// Um valor de auditoria pode ser texto, booleano ou o objeto inteiro da linha.
// Aqui só interessa um resumo legível de uma linha.
function resumir(valor) {
  if (valor === null || valor === undefined) return '—';
  if (typeof valor === 'string') return valor.replace(/<[^>]*>/g, '').slice(0, 120) || '(vazio)';
  if (typeof valor === 'boolean') return valor ? 'sim' : 'não';
  if (typeof valor === 'object' && valor.truncado) return `(conteúdo grande, ${valor.tamanho} bytes)`;
  if (typeof valor === 'object') return JSON.stringify(valor).slice(0, 120);
  return String(valor);
}

export default function AdminHistoricoPage() {
  const { request } = useAdminFetch();
  const [linhas,     setLinhas]     = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [entidade,   setEntidade]   = useState('');
  const [loading,    setLoading]    = useState(true);
  const [aberta,     setAberta]     = useState(null);

  const buscar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, per_page: 25 });
    if (entidade) params.set('entidade', entidade);
    try {
      const res = await request(`/api/admin/audit?${params}`);
      if (!res) return;
      const json = await res.json();
      setLinhas(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
    } catch {
      // listagem silenciosa, como nas outras telas do painel
    } finally {
      setLoading(false);
    }
  }, [page, entidade, request]);

  useEffect(() => { buscar(); }, [buscar]);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-[22px] md:text-[24px] font-[800] text-ink">Histórico</h1>
      <p className="text-[13px] text-muted mb-6">
        {total} alteraç{total !== 1 ? 'ões' : 'ão'} registrada{total !== 1 ? 's' : ''}.
        Para desfazer um texto de página, use o histórico do próprio campo em Conteúdo.
      </p>

      <select
        value={entidade}
        onChange={e => { setEntidade(e.target.value); setPage(1); }}
        aria-label="Filtrar por tipo"
        className="border border-line rounded-[8px] px-3 py-2 text-[13px] bg-white outline-none focus:border-orange mb-5"
      >
        <option value="">Tudo</option>
        {Object.entries(ENTIDADES).map(([id, label]) => (
          <option key={id} value={id}>{label}</option>
        ))}
      </select>

      {loading ? (
        <div className="bg-white rounded-[10px] border border-line overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-line last:border-0">
              <div className="h-3 w-1/2 bg-[#EEE] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : linhas.length === 0 ? (
        <div className="bg-white border border-line rounded-[10px] py-16 text-center">
          <p className="text-[15px] font-[700] text-ink mb-1">Nada registrado ainda</p>
          <p className="text-[13px] text-muted">As alterações feitas no painel aparecem aqui.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[10px] border border-line overflow-hidden">
          {linhas.map(l => {
            const acao = ACOES[l.acao] || { label: l.acao, cor: 'bg-[#F0F0F0] text-ink-light' };
            const expandida = aberta === l.id;
            return (
              <div key={l.id} className="border-b border-line last:border-0">
                <button
                  onClick={() => setAberta(expandida ? null : l.id)}
                  aria-expanded={expandida}
                  className="w-full text-left px-4 py-3 hover:bg-[#FAFAFA] transition-colors flex flex-wrap items-center gap-2"
                >
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-[700] ${acao.cor}`}>
                    {acao.label}
                  </span>
                  <span className="text-[13px] font-[600] text-ink">
                    {ENTIDADES[l.entidade] || l.entidade}
                    {l.entidade_id ? ` · ${l.entidade_id}` : ''}
                    {l.campo ? ` · ${l.campo}` : ''}
                  </span>
                  <span className="text-[12px] text-muted ml-auto">
                    {l.user_email} · {new Date(l.criado_em).toLocaleString('pt-BR')}
                  </span>
                </button>
                {expandida && (
                  <div className="px-4 pb-4 grid md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] font-[700] text-muted uppercase tracking-[.6px] mb-1">Antes</div>
                      <div className="text-[13px] text-ink-light bg-[#FAFAFA] border border-line rounded-[6px] p-2 break-words">
                        {resumir(l.valor_anterior)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-[700] text-muted uppercase tracking-[.6px] mb-1">Depois</div>
                      <div className="text-[13px] text-ink-light bg-[#FAFAFA] border border-line rounded-[6px] p-2 break-words">
                        {resumir(l.valor_novo)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-6 items-center">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-line rounded-[8px] text-[13px] font-[600] text-ink-light disabled:opacity-40 hover:border-orange hover:text-orange transition-colors"
          >
            Anterior
          </button>
          <span className="text-[13px] text-muted">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-line rounded-[8px] text-[13px] font-[600] text-ink-light disabled:opacity-40 hover:border-orange hover:text-orange transition-colors"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Registrar a rota**

Em `src/App.jsx`, junto dos outros lazy imports do admin:

```jsx
const AdminHistoricoPage    = lazy(() => import('./pages/admin/AdminHistoricoPage'));
```

e dentro das children de `/admin`:

```jsx
      { path: 'historico',                  element: admin(<AdminHistoricoPage />) },
```

- [ ] **Step 3: Item na sidebar e no drawer**

Em `src/pages/admin/AdminLayout.jsx`, depois do grupo "Conteúdo":

```jsx
          <div className="px-3 pt-3 pb-1 text-[10px] font-[700] text-[#aaa] uppercase tracking-[.6px]">Sistema</div>
          <NavLink to="/admin/historico" className={navClass}>Histórico</NavLink>
```

Repetir o mesmo item em `src/components/admin/AdminMobileDrawer.jsx`, seguindo a
estrutura de links que já existe lá.

- [ ] **Step 4: Verificação manual**

```bash
npm run build
```

1. Abrir `/admin/historico`: a lista traz as alterações feitas nas fases
   anteriores, mais recentes no topo.
2. Clicar numa linha: expande mostrando "Antes" e "Depois".
3. Filtrar por "Conteúdo": só sobram linhas de CMS.
4. Com mais de 25 registros, "Próxima" avança e "Anterior" volta.
5. O item "Histórico" aparece na sidebar e no menu mobile.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminHistoricoPage.jsx src/App.jsx src/pages/admin/AdminLayout.jsx src/components/admin/AdminMobileDrawer.jsx
git commit -m "feat(admin): pagina de historico de alteracoes"
git push origin main
```

---

### Task 3: Histórico e restauração por campo no CMS

**Files:**
- Create: `src/components/admin/HistoricoCampo.jsx`
- Modify: `src/pages/admin/AdminContentPage.jsx`

**Interfaces:**
- Consumes: `GET /api/admin/audit?entidade=content&entidade_id=<page>&campo=<key>`
  e `POST /api/admin/audit/:id/restore` (Task 1).
- Produces: componente `HistoricoCampo({ page, chave, aoRestaurar })`.

- [ ] **Step 1: Criar o componente**

Criar `src/components/admin/HistoricoCampo.jsx`:

```jsx
import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminFetch } from '../../hooks/useAdminFetch';

function resumo(valor) {
  if (valor === null || valor === undefined) return '(vazio)';
  if (typeof valor === 'string') return valor.replace(/<[^>]*>/g, '').slice(0, 160) || '(vazio)';
  if (typeof valor === 'object' && valor.truncado) return '(conteúdo grande)';
  return String(valor);
}

// Últimos valores de um campo do CMS, com botão de restaurar. É a rede de
// segurança para um texto sobrescrito por engano.
export default function HistoricoCampo({ page, chave, aoRestaurar }) {
  const { request } = useAdminFetch();
  const [aberto,  setAberto]  = useState(false);
  const [linhas,  setLinhas]  = useState([]);
  const [loading, setLoading] = useState(false);

  const abrir = async () => {
    if (aberto) { setAberto(false); return; }
    setAberto(true);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        entidade: 'content', entidade_id: page, campo: chave, per_page: 10,
      });
      const res = await request(`/api/admin/audit?${params}`);
      if (!res) return;
      const json = await res.json();
      setLinhas(json.data || []);
    } catch {
      toast.error('Não foi possível carregar o histórico.');
    } finally {
      setLoading(false);
    }
  };

  const restaurar = async (id) => {
    const res = await request(`/api/admin/audit/${id}/restore`, { method: 'POST' });
    if (!res) return;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast.error(data.error || 'Erro ao restaurar.'); return; }
    toast.success('Valor restaurado');
    aoRestaurar(data.value);
    setAberto(false);
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={abrir}
        aria-expanded={aberto}
        className="text-[12px] font-[600] text-muted hover:text-orange transition-colors"
      >
        {aberto ? 'Fechar histórico' : 'Histórico'}
      </button>

      {aberto && (
        <div className="mt-2 border border-line rounded-[8px] divide-y divide-[#eee]">
          {loading ? (
            <div className="px-3 py-2 text-[12px] text-muted">Carregando...</div>
          ) : linhas.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-muted">Nenhuma alteração registrada neste campo.</div>
          ) : (
            linhas.map(l => (
              <div key={l.id} className="px-3 py-2 flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-ink truncate">{resumo(l.valor_anterior)}</div>
                  <div className="text-[11px] text-muted">
                    {l.user_email} · {new Date(l.criado_em).toLocaleString('pt-BR')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => restaurar(l.id)}
                  className="text-[12px] font-[700] text-orange hover:underline flex-shrink-0"
                >
                  Restaurar
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

O que se restaura é o **valor anterior** de cada linha — ou seja, "voltar para o
que estava antes desta alteração".

- [ ] **Step 2: Ligar ao editor de conteúdo**

Em `src/pages/admin/AdminContentPage.jsx`, importar e renderizar dentro do
`<div>` de cada campo, depois do controle:

```jsx
                <HistoricoCampo
                  page={page}
                  chave={field.key}
                  aoRestaurar={(valor) => {
                    setContent(c => ({ ...c, [field.key]: valor }));
                    setValorSalvo(v => ({ ...v, [field.key]: valor }));
                    setStatus(s => ({ ...s, [field.key]: 'salvo' }));
                  }}
                />
```

Note que o restaurado já está salvo no servidor: o status vai direto para
`salvo`, sem passar por `dirty`.

- [ ] **Step 3: Verificação manual**

```bash
npm run build
```

1. Em `/admin/conteudo/home`, alterar um campo de texto duas vezes.
2. Clicar em "Histórico" nesse campo: aparecem os valores anteriores com autor e
   data.
3. Clicar "Restaurar" no mais antigo: o campo volta ao valor antigo, com "✓ Salvo".
4. Recarregar a página: o valor restaurado persiste.
5. Abrir o histórico de novo: a restauração aparece como mais uma entrada.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/HistoricoCampo.jsx src/pages/admin/AdminContentPage.jsx
git commit -m "feat(admin): historico e restauracao por campo no editor de conteudo"
git push origin main
```

---

# FASE 5 — Usuários

### Task 4: Login pela tabela `admin_users`

**Files:**
- Modify: `server/src/routes/auth.js`
- Test: `server/tests/auth-usuarios.test.js`

**Interfaces:**
- Consumes: `admin_users`, `emitirSessao`, `registrar`.
- Produces: `POST /api/auth/login` autenticando contra a tabela; atualiza
  `ultimo_login`; registra `acao: 'login'` na auditoria.

- [ ] **Step 1: Escrever o teste (vai falhar)**

Criar `server/tests/auth-usuarios.test.js`:

```js
const request = require('supertest');
const app  = require('../src/app');
const pool = require('../src/db');
const { criarUsuario, removerUsuario } = require('./helpers');

const EMAIL = 'login-tabela@test.com';
const SENHA = 'Test@123';

afterEach(async () => {
  await removerUsuario(EMAIL);
  await pool.query("DELETE FROM audit_log WHERE acao = 'login'");
});

describe('POST /api/auth/login pela tabela', () => {
  it('autentica usuário ativo com a senha da tabela', async () => {
    await criarUsuario({ email: EMAIL, papel: 'editor', senha: SENHA });

    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: SENHA });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(EMAIL);
    expect(res.body.expiresAt).toBeGreaterThan(Date.now());
  });

  it('aceita e-mail com maiúsculas', async () => {
    await criarUsuario({ email: EMAIL, senha: SENHA });
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'Login-Tabela@Test.com', password: SENHA });
    expect(res.status).toBe(200);
  });

  it('recusa senha errada', async () => {
    await criarUsuario({ email: EMAIL, senha: SENHA });
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: 'errada' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciais inválidas.');
  });

  it('recusa usuário desativado', async () => {
    await criarUsuario({ email: EMAIL, senha: SENHA, ativo: false });
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: SENHA });
    expect(res.status).toBe(401);
  });

  it('atualiza ultimo_login', async () => {
    await criarUsuario({ email: EMAIL, senha: SENHA });
    await request(app).post('/api/auth/login').send({ email: EMAIL, password: SENHA });

    const { rows } = await pool.query(
      'SELECT ultimo_login FROM admin_users WHERE lower(email) = $1', [EMAIL]
    );
    expect(rows[0].ultimo_login).not.toBeNull();
  });

  it('registra o login na auditoria', async () => {
    await criarUsuario({ email: EMAIL, senha: SENHA });
    await request(app).post('/api/auth/login').send({ email: EMAIL, password: SENHA });

    const { rows } = await pool.query("SELECT * FROM audit_log WHERE acao = 'login'");
    expect(rows).toHaveLength(1);
    expect(rows[0].user_email).toBe(EMAIL);
  });

  it('a credencial do .env deixa de valer quando existe usuário ativo', async () => {
    await criarUsuario({ email: EMAIL, senha: SENHA });
    const res = await request(app).post('/api/auth/login')
      .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    expect(res.status).toBe(401);
  });

  it('a credencial do .env volta a valer sem nenhum usuário ativo', async () => {
    await pool.query('DELETE FROM admin_users');
    const res = await request(app).post('/api/auth/login')
      .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd server && npx jest tests/auth-usuarios.test.js
```

Esperado: FAIL — o login atual só compara com o `.env`, então autenticar pela
tabela dá 401.

- [ ] **Step 3: Reescrever o handler do login**

Em `server/src/routes/auth.js`, acrescentar os requires que faltam:

```js
const pool = require('../db');
const { registrar } = require('../lib/audit');
```

e substituir o corpo do `router.post('/login', …)`:

```js
router.post('/login', loginLimiter, validate(['email', 'password']), async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const { password } = req.body;

  try {
    const { rows } = await pool.query(
      `SELECT id, email, nome, senha_hash, papel
       FROM admin_users
       WHERE lower(email) = $1 AND ativo
       LIMIT 1`,
      [email]
    );

    let admin = rows[0];

    if (admin) {
      const ok = await bcrypt.compare(password, admin.senha_hash);
      if (!ok) return res.status(401).json({ error: 'Credenciais inválidas.' });
    } else {
      // Recuperação: só quando NÃO existe nenhum usuário ativo. Qualquer
      // usuário ativo fecha esse caminho sozinho.
      const { rows: cont } = await pool.query(
        'SELECT COUNT(*)::int AS n FROM admin_users WHERE ativo'
      );
      const doEnv = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
      const ok = cont[0].n === 0
        && email === doEnv
        && await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || '');
      if (!ok) return res.status(401).json({ error: 'Credenciais inválidas.' });
      console.warn('login: nenhum usuário ativo; aceitando credencial do .env');
      admin = { id: null, email, nome: 'Administrador', papel: 'admin' };
    }

    if (admin.id) {
      await pool.query('UPDATE admin_users SET ultimo_login = NOW() WHERE id = $1', [admin.id]);
    }

    const expiresAt = emitirSessao(res, admin);
    req.admin = admin;   // para a auditoria saber quem entrou
    await registrar(req, {
      acao: 'login', entidade: 'user', entidade_id: String(admin.id ?? admin.email),
    });

    res.json({ ok: true, email: admin.email, expiresAt });
  } catch (err) {
    console.error('POST /api/auth/login:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});
```

- [ ] **Step 4: Rodar o teste e a suíte**

```bash
cd server && npx jest tests/auth-usuarios.test.js && npm test
```

Esperado: 8 novos passando; suíte com 76 passando. O `auth.test.js` antigo, que
loga com a credencial do `.env`, continua passando pelo caminho de recuperação —
a tabela fica vazia entre arquivos.

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/auth.js server/tests/auth-usuarios.test.js
git commit -m "feat(auth): login autenticado pela tabela admin_users"
git push origin main
```

---

### Task 5: CRUD de usuários

**Files:**
- Create: `server/src/routes/admin-users.js`
- Modify: `server/src/app.js` (montar a rota)
- Test: `server/tests/admin-users.test.js`

**Interfaces:**
- Consumes: `requireAuth`, `requirePapel`, `registrar`.
- Produces:
  - `GET /api/admin/users` (papel `admin`) → lista sem `senha_hash`.
  - `POST /api/admin/users` (papel `admin`) → cria com senha inicial.
  - `PUT /api/admin/users/:id` (papel `admin`) → nome, papel, ativo.
  - `DELETE /api/admin/users/:id` (papel `admin`).
  - `PUT /api/admin/users/me/senha` (qualquer papel) → exige `senha_atual` e
    `senha_nova`.

- [ ] **Step 1: Escrever o teste (vai falhar)**

Criar `server/tests/admin-users.test.js`:

```js
const request = require('supertest');
const app  = require('../src/app');
const pool = require('../src/db');
const bcrypt = require('bcryptjs');
const { makeTokenPara, criarUsuario, removerUsuario } = require('./helpers');

const ADMIN  = 'chefe@test.com';
const EDITOR = 'editor@test.com';
const NOVO   = 'novo@test.com';

let idAdmin;

beforeEach(async () => {
  await pool.query('DELETE FROM admin_users');
  const a = await criarUsuario({ email: ADMIN, papel: 'admin' });
  idAdmin = a.id;
  await criarUsuario({ email: EDITOR, papel: 'editor' });
});

afterAll(async () => {
  await pool.query('DELETE FROM admin_users');
});

const comoAdmin  = (req) => req.set('Authorization', `Bearer ${makeTokenPara(ADMIN)}`);
const comoEditor = (req) => req.set('Authorization', `Bearer ${makeTokenPara(EDITOR)}`);

describe('permissões', () => {
  it('editor não lista usuários', async () => {
    const res = await comoEditor(request(app).get('/api/admin/users'));
    expect(res.status).toBe(403);
  });

  it('admin lista usuários sem expor o hash', async () => {
    const res = await comoAdmin(request(app).get('/api/admin/users'));
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].senha_hash).toBeUndefined();
  });

  it('editor não cria usuário', async () => {
    const res = await comoEditor(
      request(app).post('/api/admin/users').send({ email: NOVO, nome: 'X', senha: 'Test@123' })
    );
    expect(res.status).toBe(403);
  });
});

describe('criação', () => {
  it('cria usuário com senha utilizável', async () => {
    const res = await comoAdmin(
      request(app).post('/api/admin/users')
        .send({ email: NOVO, nome: 'Pessoa Nova', senha: 'Test@123', papel: 'editor' })
    );
    expect(res.status).toBe(201);
    expect(res.body.email).toBe(NOVO);
    expect(res.body.senha_hash).toBeUndefined();

    const login = await request(app).post('/api/auth/login')
      .send({ email: NOVO, password: 'Test@123' });
    expect(login.status).toBe(200);
  });

  it('recusa e-mail duplicado', async () => {
    const res = await comoAdmin(
      request(app).post('/api/admin/users').send({ email: EDITOR, nome: 'X', senha: 'Test@123' })
    );
    expect(res.status).toBe(409);
  });

  it('recusa senha curta', async () => {
    const res = await comoAdmin(
      request(app).post('/api/admin/users').send({ email: NOVO, nome: 'X', senha: '123' })
    );
    expect(res.status).toBe(400);
  });
});

describe('travas de segurança', () => {
  it('não deixa desativar a si mesmo', async () => {
    const res = await comoAdmin(
      request(app).put(`/api/admin/users/${idAdmin}`).send({ nome: 'Chefe', papel: 'admin', ativo: false })
    );
    expect(res.status).toBe(400);
  });

  it('não deixa excluir a si mesmo', async () => {
    const res = await comoAdmin(request(app).delete(`/api/admin/users/${idAdmin}`));
    expect(res.status).toBe(400);
  });

  it('não deixa remover o último admin ativo rebaixando o papel', async () => {
    const res = await comoAdmin(
      request(app).put(`/api/admin/users/${idAdmin}`).send({ nome: 'Chefe', papel: 'editor', ativo: true })
    );
    expect(res.status).toBe(400);
  });

  it('permite rebaixar quando existe outro admin ativo', async () => {
    const outro = await criarUsuario({ email: 'outro-admin@test.com', papel: 'admin' });
    const res = await comoAdmin(
      request(app).put(`/api/admin/users/${idAdmin}`).send({ nome: 'Chefe', papel: 'editor', ativo: true })
    );
    expect(res.status).toBe(200);
    await removerUsuario('outro-admin@test.com');
    expect(outro.id).toBeDefined();
  });
});

describe('troca da própria senha', () => {
  it('exige a senha atual correta', async () => {
    const res = await comoEditor(
      request(app).put('/api/admin/users/me/senha')
        .send({ senha_atual: 'errada', senha_nova: 'NovaSenha@1' })
    );
    expect(res.status).toBe(401);
  });

  it('troca a senha e a nova passa a valer', async () => {
    const res = await comoEditor(
      request(app).put('/api/admin/users/me/senha')
        .send({ senha_atual: 'Test@123', senha_nova: 'NovaSenha@1' })
    );
    expect(res.status).toBe(200);

    const { rows } = await pool.query(
      'SELECT senha_hash FROM admin_users WHERE lower(email) = $1', [EDITOR]
    );
    expect(bcrypt.compareSync('NovaSenha@1', rows[0].senha_hash)).toBe(true);
  });

  it('recusa senha nova curta', async () => {
    const res = await comoEditor(
      request(app).put('/api/admin/users/me/senha')
        .send({ senha_atual: 'Test@123', senha_nova: '123' })
    );
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd server && npx jest tests/admin-users.test.js
```

Esperado: FAIL — rota inexistente.

- [ ] **Step 3: Implementar a rota**

Criar `server/src/routes/admin-users.js`:

```js
const { Router }   = require('express');
const bcrypt       = require('bcryptjs');
const pool         = require('../db');
const requireAuth  = require('../middleware/requireAuth');
const requirePapel = require('../middleware/requirePapel');
const validate     = require('../middleware/validate');
const { registrar } = require('../lib/audit');

const router = Router();
router.use(requireAuth);

const SENHA_MINIMA = 8;
const CAMPOS = 'id, email, nome, papel, ativo, ultimo_login, criado_em';

// Troca da própria senha: qualquer papel, antes do requirePapel abaixo.
router.put('/me/senha', validate(['senha_atual', 'senha_nova']), async (req, res) => {
  const { senha_atual, senha_nova } = req.body;

  if (String(senha_nova).length < SENHA_MINIMA) {
    return res.status(400).json({ error: `A nova senha precisa de ao menos ${SENHA_MINIMA} caracteres.` });
  }
  if (!req.admin.id) {
    return res.status(400).json({ error: 'Sessão de recuperação não permite trocar senha. Crie um usuário primeiro.' });
  }

  try {
    const { rows } = await pool.query('SELECT senha_hash FROM admin_users WHERE id = $1', [req.admin.id]);
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const ok = await bcrypt.compare(senha_atual, rows[0].senha_hash);
    if (!ok) return res.status(401).json({ error: 'Senha atual incorreta.' });

    await pool.query('UPDATE admin_users SET senha_hash = $1 WHERE id = $2',
      [bcrypt.hashSync(senha_nova, 10), req.admin.id]);

    // A senha em si nunca entra no histórico.
    await registrar(req, {
      acao: 'update', entidade: 'user', entidade_id: String(req.admin.id), campo: 'senha',
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/admin/users/me/senha:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// Daqui para baixo, só papel admin.
router.use(requirePapel('admin'));

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${CAMPOS} FROM admin_users ORDER BY criado_em ASC`);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/users:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/', validate(['email', 'nome', 'senha']), async (req, res) => {
  const email = String(req.body.email).trim().toLowerCase();
  const { nome, senha } = req.body;
  const papel = req.body.papel === 'admin' ? 'admin' : 'editor';

  if (String(senha).length < SENHA_MINIMA) {
    return res.status(400).json({ error: `A senha precisa de ao menos ${SENHA_MINIMA} caracteres.` });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO admin_users (email, nome, senha_hash, papel, ativo)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING ${CAMPOS}`,
      [email, nome, bcrypt.hashSync(senha, 10), papel]
    );
    await registrar(req, {
      acao: 'create', entidade: 'user', entidade_id: String(rows[0].id), valor_novo: rows[0],
    });
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Já existe um usuário com esse e-mail.' });
    console.error('POST /api/admin/users:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.put('/:id', validate(['nome']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const { nome } = req.body;
  const papel = req.body.papel === 'admin' ? 'admin' : 'editor';
  const ativo = req.body.ativo !== false;

  if (id === req.admin.id && (!ativo || papel !== 'admin')) {
    return res.status(400).json({ error: 'Você não pode remover o próprio acesso de administrador.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const anterior = await client.query(`SELECT ${CAMPOS} FROM admin_users WHERE id = $1 FOR UPDATE`, [id]);
    if (!anterior.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const { rows } = await client.query(
      `UPDATE admin_users SET nome = $1, papel = $2, ativo = $3 WHERE id = $4 RETURNING ${CAMPOS}`,
      [nome, papel, ativo, id]
    );

    // Trava verificada DENTRO da transação: nunca pode sobrar zero admin ativo.
    const { rows: cont } = await client.query(
      "SELECT COUNT(*)::int AS n FROM admin_users WHERE ativo AND papel = 'admin'"
    );
    if (cont[0].n === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'É preciso manter ao menos um administrador ativo.' });
    }

    await client.query('COMMIT');
    await registrar(req, {
      acao: 'update', entidade: 'user', entidade_id: String(id),
      valor_anterior: anterior.rows[0], valor_novo: rows[0],
    });
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('PUT /api/admin/users/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Usuário não encontrado.' });
  if (id === req.admin.id) {
    return res.status(400).json({ error: 'Você não pode excluir a si mesmo.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `DELETE FROM admin_users WHERE id = $1 RETURNING ${CAMPOS}`, [id]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const { rows: cont } = await client.query(
      "SELECT COUNT(*)::int AS n FROM admin_users WHERE ativo AND papel = 'admin'"
    );
    if (cont[0].n === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'É preciso manter ao menos um administrador ativo.' });
    }

    await client.query('COMMIT');
    await registrar(req, {
      acao: 'delete', entidade: 'user', entidade_id: String(id), valor_anterior: rows[0],
    });
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('DELETE /api/admin/users/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    client.release();
  }
});

module.exports = router;
```

Atenção à ordem: `/me/senha` é declarada **antes** do `router.use(requirePapel('admin'))`,
senão um editor não conseguiria trocar a própria senha. E antes de `/:id`, senão
o Express tentaria interpretar `me` como id.

- [ ] **Step 4: Montar no app**

Em `server/src/app.js`:

```js
const adminUsersRouter      = require('./routes/admin-users');
// …
app.use('/api/admin/users', adminUsersRouter);
```

- [ ] **Step 5: Rodar o teste e a suíte**

```bash
cd server && npx jest tests/admin-users.test.js && npm test
```

Esperado: 13 novos passando; suíte com 89 passando.

Se algum teste de outro arquivo começar a falhar com 401, a causa é este arquivo
deixar usuário ativo para trás: conferir se o `afterAll` limpou `admin_users`.

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/admin-users.js server/src/app.js server/tests/admin-users.test.js
git commit -m "feat(admin): CRUD de usuarios com papeis e travas de seguranca"
git push origin main
```

---

### Task 6: Telas de usuários e da própria conta

**Files:**
- Create: `src/pages/admin/AdminUsuariosPage.jsx`
- Create: `src/pages/admin/AdminContaPage.jsx`
- Modify: `src/App.jsx` (rotas)
- Modify: `src/pages/admin/AdminLayout.jsx` (itens na sidebar, condicionados ao papel)
- Modify: `src/components/admin/AdminMobileDrawer.jsx`

**Interfaces:**
- Consumes: as rotas da Task 5; `user.papel` do `AuthContext`, já preenchido
  pelo `/api/auth/me` desde a fase 1.

- [ ] **Step 1: Página de usuários**

Criar `src/pages/admin/AdminUsuariosPage.jsx` com:

- lista em tabela: nome, e-mail, papel, status, último login;
- formulário de criação (nome, e-mail, senha, papel);
- edição em linha de nome/papel/ativo;
- exclusão com `ConfirmModal`;
- erros da API mostrados em faixa vermelha, como nas outras telas;
- `toast.success` nas operações bem-sucedidas.

Seguir a estrutura de `AdminCategoriesPage.jsx`, que já faz exatamente esse
conjunto (listar, criar, editar em linha, excluir com confirmação) e é o padrão
do painel.

Regra de interface: o próprio usuário aparece com "(você)" ao lado do nome e sem
os botões de desativar e excluir — o backend já barra, mas mostrar o botão para
depois recusar seria desonesto com quem usa.

- [ ] **Step 2: Página da conta**

Criar `src/pages/admin/AdminContaPage.jsx`: mostra e-mail e papel (somente
leitura) e um formulário com senha atual, nova senha e confirmação. Valida no
cliente que a confirmação bate e que a nova senha tem ao menos 8 caracteres,
mas **sem** confiar nisso — o backend valida de novo.

- [ ] **Step 3: Rotas e navegação**

Em `src/App.jsx`:

```jsx
const AdminUsuariosPage     = lazy(() => import('./pages/admin/AdminUsuariosPage'));
const AdminContaPage        = lazy(() => import('./pages/admin/AdminContaPage'));
// …
      { path: 'usuarios',                   element: admin(<AdminUsuariosPage />) },
      { path: 'conta',                      element: admin(<AdminContaPage />) },
```

Em `AdminLayout.jsx`, na seção "Sistema" criada na Task 2:

```jsx
          <NavLink to="/admin/historico" className={navClass}>Histórico</NavLink>
          {user?.papel === 'admin' && (
            <NavLink to="/admin/usuarios" className={navClass}>Usuários</NavLink>
          )}
          <NavLink to="/admin/conta" className={navClass}>Minha conta</NavLink>
```

Esconder o item é conveniência, não segurança: quem digitar a URL vê a página,
mas as chamadas respondem 403 e a tela mostra o erro.

- [ ] **Step 4: Verificação manual**

```bash
npm run build
```

1. Entrar como admin: "Usuários" aparece na sidebar.
2. Criar um usuário editor; sair; entrar com ele: o painel abre e "Usuários"
   **não** aparece no menu.
3. Como editor, abrir `/admin/usuarios` digitando a URL: a página carrega mas
   mostra erro de permissão, sem listar ninguém.
4. Como editor, em "Minha conta", trocar a própria senha; sair e entrar com a
   senha nova.
5. Como admin, tentar desativar a si mesmo: o botão não existe.
6. Como admin, desativar o editor; tentar entrar com ele: login recusado.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminUsuariosPage.jsx src/pages/admin/AdminContaPage.jsx src/App.jsx src/pages/admin/AdminLayout.jsx src/components/admin/AdminMobileDrawer.jsx
git commit -m "feat(admin): telas de usuarios e de troca da propria senha"
git push origin main
```

---

### Task 7: Atualizar o CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Acrescentar o que estas fases criaram**

- Rotas: `admin-audit.js`, `admin-users.js`.
- Páginas: `AdminHistoricoPage.jsx`, `AdminUsuariosPage.jsx`, `AdminContaPage.jsx`.
- Componente: `HistoricoCampo.jsx`.
- Hooks criados na fase 3: `useAtalhoSalvar.js`.
- Na seção de convenções, registrar que restauração só vale para conteúdo de CMS.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: atualiza CLAUDE.md com historico e usuarios"
git push origin main
```

---

## Self-Review

**Cobertura do spec (fases 4 e 5):**

| Requisito do spec | Task |
|---|---|
| `GET /api/admin/audit` paginado com filtros | 1 |
| `POST /api/admin/audit/:id/restore` só para `content` | 1 |
| Restauração é ela mesma auditada | 1 |
| Página `/admin/historico` com filtros e comparativo | 2 |
| Item "Histórico" na sidebar, seção Sistema | 2 |
| Histórico por campo no CMS com restaurar | 3 |
| Login consulta `admin_users` | 4 |
| Recuperação via `.env` sem usuário ativo | 4 |
| `ultimo_login` e auditoria de login | 4 |
| CRUD `/api/admin/users` restrito a `admin` | 5 |
| `PUT /me/senha` exigindo a senha atual | 5 |
| Travas: não se desativa, não se exclui, resta um admin | 5 |
| `/admin/usuarios` e `/admin/conta` | 6 |
| Sidebar esconde "Usuários" para editor | 6 |

**Consistência de tipos:** `req.admin.id` é `number | null` (null na sessão de
recuperação) — a Task 5 trata o `null` explicitamente na troca de senha. `id` de
`audit_log` é `BIGSERIAL`, chega ao frontend como string ou número conforme o
driver; as Tasks 2 e 3 só o usam como identificador opaco, sem aritmética.
`valor_anterior`/`valor_novo` são `jsonb` e podem ser string, booleano ou objeto:
as funções `resumir`/`resumo` das Tasks 2 e 3 cobrem os três casos, mais o
marcador `{ truncado: true }` do helper da fase 0.

**Riscos conhecidos:**

1. **Ordem de rotas em `admin-users.js`:** `/me/senha` precisa vir antes do
   `requirePapel('admin')` e antes de `/:id`. Os testes de editor cobrem os dois
   erros.
2. **Isolamento entre arquivos de teste:** `admin-users.test.js` faz
   `DELETE FROM admin_users` no `beforeEach` e no `afterAll`. Sem isso, um
   usuário ativo remanescente faz o `auth.test.js` antigo falhar, porque fecharia
   o caminho de recuperação do `.env`.
3. **Sessão de recuperação não tem `id`:** trocar a própria senha nesse estado é
   impossível por definição (não há linha para atualizar). A Task 5 responde 400
   com explicação em vez de estourar.
4. **Restaurar um valor `null`:** se o campo nunca existiu antes, `valor_anterior`
   é `null` e a restauração grava string vazia. É o comportamento desejado —
   voltar ao "não havia nada" —, mas vale conferir no roteiro manual da Task 3.
