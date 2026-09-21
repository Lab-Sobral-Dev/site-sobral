# Painel Admin — Fases 0 e 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar ao painel admin uma base de identidade e auditoria (fase 0) e
eliminar toda perda de trabalho por sessão expirada, saída acidental ou falha
silenciosa de salvamento (fase 1).

**Architecture:** O backend ganha `admin_users` e `audit_log`, um helper de
auditoria que nunca derruba requisição, e um `requireAuth` que resolve o
usuário no banco com recuperação via `.env` quando não há nenhum usuário ativo.
O frontend ganha renovação de sessão, guarda de saída por `useBlocker`,
rascunho local do formulário de produto e estado explícito por campo no CMS.

**Tech Stack:** Node 20 + Express 4 + PostgreSQL 16 (`pg`, SQL cru), Jest +
supertest no backend; React 18 + Vite 6 + React Router 6.28 + Tailwind 3 no
frontend.

**Spec:** `docs/superpowers/specs/2026-09-21-painel-admin-melhorias-design.md`

## Global Constraints

- Idioma do projeto é pt-BR: textos de UI, mensagens de erro de API e nomes de
  campos novos em português.
- Commits em Conventional Commits; push para `main` ao fim de cada task.
- Nunca commitar `server/.env`, `.claude/settings.json`,
  `.claude/settings.local.json`.
- Não tocar em `.github/workflows/deploy.yml` — tem alteração não commitada do
  usuário.
- Auditoria nunca pode derrubar a requisição que a originou.
- `requireAuth` só aceita a credencial do `.env` quando **não existe nenhum**
  usuário ativo em `admin_users` (ou a tabela ainda não existe).
- Migrations são numeradas em sequência: as próximas livres são `015` e `016`.
- Nenhuma mudança de comportamento público do site — só `/admin/*` e
  `/api/admin/*` + `/api/auth/*`.

## Ambiente de teste local

O banco de teste é um cluster PostgreSQL 18 descartável na porta 5433, já
criado nesta máquina:

```bash
PGBIN="/c/Program Files/PostgreSQL/18/bin"
SCRATCH="/c/Users/hclaudio/AppData/Local/Temp/claude/D--Hclaudio-Documents-Projetos-site-sobral/0eeb8460-de27-4d6e-adc5-95136863657f/scratchpad"
"$PGBIN/pg_isready.exe" -p 5433 -h 127.0.0.1          # verificar
"$PGBIN/pg_ctl.exe" -D "$SCRATCH/pgdata" -o "-p 5433" -l "$SCRATCH/pg.log" start   # subir se caiu
```

Recriar do zero quando um teste deixar lixo (o `--forceExit` do Jest às vezes
corta o `afterAll`):

```bash
PGBIN="/c/Program Files/PostgreSQL/18/bin"
"$PGBIN/dropdb.exe" -p 5433 -h 127.0.0.1 -U sobral --if-exists sobral_test
"$PGBIN/createdb.exe" -p 5433 -h 127.0.0.1 -U sobral sobral_test
cd server && DATABASE_URL="postgresql://sobral:sobral_pass@127.0.0.1:5433/sobral_test" node src/db/migrate.js
```

`server/tests/setup-env.js` já aponta `DATABASE_URL` para esse banco, então
`cd server && npm test` funciona sem variável extra.

**Linha de base verificada em 2026-09-21: 25/25 testes passando.** Toda task
precisa terminar com a suíte inteira verde, não só o teste novo.

---

# FASE 0 — Fundação

### Task 1: Tabela `admin_users` e semeadura do primeiro usuário

**Files:**
- Create: `server/src/db/migrations/015_admin_users.sql`
- Create: `server/src/db/seed-admin.js`
- Modify: `server/src/db/migrate.js` (chamar a semeadura ao fim das migrations)
- Test: `server/tests/seed-admin.test.js`

**Interfaces:**
- Consumes: nada.
- Produces: tabela `admin_users(id, email, nome, senha_hash, papel, ativo, ultimo_login, criado_em)`;
  `seedAdmin(client) → Promise<'criado'|'ja-existe'|'sem-env'>` exportado de
  `server/src/db/seed-admin.js`.

- [ ] **Step 1: Escrever a migration**

Criar `server/src/db/migrations/015_admin_users.sql`:

```sql
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(160) NOT NULL UNIQUE,
  nome          VARCHAR(120) NOT NULL,
  senha_hash    VARCHAR(120) NOT NULL,
  papel         VARCHAR(20)  NOT NULL DEFAULT 'editor'
                CHECK (papel IN ('admin','editor')),
  ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
  ultimo_login  TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email_ativo
  ON admin_users(email) WHERE ativo;
```

- [ ] **Step 2: Escrever o teste da semeadura (vai falhar)**

Criar `server/tests/seed-admin.test.js`:

```js
const pool = require('../src/db');
const { seedAdmin } = require('../src/db/seed-admin');

const EMAIL = String(process.env.ADMIN_EMAIL).toLowerCase();

async function limpar() {
  await pool.query('DELETE FROM admin_users');
}

beforeEach(limpar);
afterAll(async () => { await limpar(); });

describe('seedAdmin', () => {
  it('cria o primeiro usuário a partir do .env quando a tabela está vazia', async () => {
    const r = await seedAdmin(pool);
    expect(r).toBe('criado');

    const { rows } = await pool.query('SELECT email, papel, ativo FROM admin_users');
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe(EMAIL);
    expect(rows[0].papel).toBe('admin');
    expect(rows[0].ativo).toBe(true);
  });

  it('é idempotente: rodar de novo não cria um segundo usuário', async () => {
    await seedAdmin(pool);
    const r = await seedAdmin(pool);
    expect(r).toBe('ja-existe');

    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM admin_users');
    expect(rows[0].n).toBe(1);
  });

  it('não cria nada quando faltam as variáveis de ambiente', async () => {
    const email = process.env.ADMIN_EMAIL;
    const hash  = process.env.ADMIN_PASSWORD_HASH;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD_HASH;
    try {
      const r = await seedAdmin(pool);
      expect(r).toBe('sem-env');
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM admin_users');
      expect(rows[0].n).toBe(0);
    } finally {
      process.env.ADMIN_EMAIL = email;
      process.env.ADMIN_PASSWORD_HASH = hash;
    }
  });

  it('guarda o e-mail em minúsculas', async () => {
    process.env.ADMIN_EMAIL = 'MAIUSCULO@Test.com';
    try {
      await seedAdmin(pool);
      const { rows } = await pool.query('SELECT email FROM admin_users');
      expect(rows[0].email).toBe('maiusculo@test.com');
    } finally {
      process.env.ADMIN_EMAIL = EMAIL;
    }
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

```bash
cd server && npx jest tests/seed-admin.test.js
```

Esperado: FAIL — `Cannot find module '../src/db/seed-admin'`. (Se falhar com
`relation "admin_users" does not exist`, aplique a migration: veja o bloco
"Ambiente de teste local" no topo.)

- [ ] **Step 4: Implementar a semeadura**

Criar `server/src/db/seed-admin.js`:

```js
// Cria o primeiro usuário administrador a partir do .env.
// Roda ao fim de toda migração e é idempotente: existindo qualquer usuário,
// não faz nada. É o que liga o painel na primeira subida e depois se cala.
async function seedAdmin(client) {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const hash  = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !hash) return 'sem-env';

  const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM admin_users');
  if (rows[0].n > 0) return 'ja-existe';

  await client.query(
    `INSERT INTO admin_users (email, nome, senha_hash, papel, ativo)
     VALUES ($1, $2, $3, 'admin', TRUE)
     ON CONFLICT (email) DO NOTHING`,
    [email, 'Administrador', hash]
  );
  return 'criado';
}

module.exports = { seedAdmin };
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

```bash
cd server && npx jest tests/seed-admin.test.js
```

Esperado: PASS, 4 testes.

- [ ] **Step 6: Ligar a semeadura ao runner de migrations**

Em `server/src/db/migrate.js`, logo após o `for` das migrations e antes do
`console.log('Migrações concluídas.')`, inserir:

```js
    const { seedAdmin } = require('./seed-admin');
    const resultado = await seedAdmin(client);
    console.log(`  seed  admin_users: ${resultado}`);
```

- [ ] **Step 7: Verificar o runner ponta a ponta**

```bash
cd server && DATABASE_URL="postgresql://sobral:sobral_pass@127.0.0.1:5433/sobral_test" node src/db/migrate.js
```

Esperado: `apply 015_admin_users.sql` e `seed  admin_users: criado` (ou
`ja-existe` numa segunda execução). Rodar duas vezes e conferir que a segunda
diz `ja-existe` e não quebra.

- [ ] **Step 8: Rodar a suíte inteira**

```bash
cd server && npm test
```

Esperado: 29 passando (25 da base + 4 novos).

- [ ] **Step 9: Commit**

```bash
git add server/src/db/migrations/015_admin_users.sql server/src/db/seed-admin.js server/src/db/migrate.js server/tests/seed-admin.test.js
git commit -m "feat(admin): tabela admin_users com semeadura do primeiro usuario"
git push origin main
```

---

### Task 2: Tabela `audit_log` e helper de auditoria

**Files:**
- Create: `server/src/db/migrations/016_audit_log.sql`
- Create: `server/src/lib/audit.js`
- Test: `server/tests/audit.test.js`

**Interfaces:**
- Consumes: `admin_users` (Task 1) para a FK `user_id`.
- Produces: `registrar(req, dados) → Promise<void>` exportado de
  `server/src/lib/audit.js`, onde `dados` é
  `{ acao, entidade, entidade_id?, campo?, valor_anterior?, valor_novo? }`.
  `acao ∈ 'create'|'update'|'delete'|'restore'|'login'`.
  `entidade ∈ 'product'|'category'|'content'|'hero_slide'|'misturinha'|'image'|'user'`.

- [ ] **Step 1: Escrever a migration**

Criar `server/src/db/migrations/016_audit_log.sql`:

```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id              BIGSERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  user_email      VARCHAR(160) NOT NULL,
  acao            VARCHAR(20)  NOT NULL,
  entidade        VARCHAR(30)  NOT NULL,
  entidade_id     VARCHAR(160),
  campo           VARCHAR(80),
  valor_anterior  JSONB,
  valor_novo      JSONB,
  ip              VARCHAR(60),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_criado_em
  ON audit_log(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entidade
  ON audit_log(entidade, entidade_id, criado_em DESC);
```

- [ ] **Step 2: Escrever o teste (vai falhar)**

Criar `server/tests/audit.test.js`:

```js
const pool = require('../src/db');
const { registrar } = require('../src/lib/audit');

const req = (admin) => ({ admin, ip: '10.0.0.1' });

afterAll(async () => {
  await pool.query("DELETE FROM audit_log WHERE entidade = 'product' AND entidade_id LIKE 'teste-%'");
});

describe('audit.registrar', () => {
  it('grava uma linha com autor, ação e valores', async () => {
    await registrar(req({ id: null, email: 'quem@test.com' }), {
      acao: 'update',
      entidade: 'product',
      entidade_id: 'teste-audit-1',
      campo: 'name',
      valor_anterior: 'Antes',
      valor_novo: 'Depois',
    });

    const { rows } = await pool.query(
      "SELECT * FROM audit_log WHERE entidade_id = 'teste-audit-1'"
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].user_email).toBe('quem@test.com');
    expect(rows[0].acao).toBe('update');
    expect(rows[0].campo).toBe('name');
    expect(rows[0].valor_anterior).toBe('Antes');
    expect(rows[0].valor_novo).toBe('Depois');
    expect(rows[0].ip).toBe('10.0.0.1');
  });

  it('trunca valores acima de 100 KB em vez de gravá-los inteiros', async () => {
    const gigante = 'x'.repeat(110 * 1024);
    await registrar(req({ id: null, email: 'quem@test.com' }), {
      acao: 'update',
      entidade: 'product',
      entidade_id: 'teste-audit-2',
      valor_novo: gigante,
    });

    const { rows } = await pool.query(
      "SELECT valor_novo FROM audit_log WHERE entidade_id = 'teste-audit-2'"
    );
    expect(rows[0].valor_novo).toEqual({ truncado: true, tamanho: gigante.length + 2 });
  });

  it('não lança quando a gravação falha', async () => {
    // entidade acima do limite da coluna força erro no INSERT
    await expect(
      registrar(req({ id: null, email: 'quem@test.com' }), {
        acao: 'update',
        entidade: 'e'.repeat(200),
        entidade_id: 'teste-audit-3',
      })
    ).resolves.toBeUndefined();
  });

  it('aceita requisição sem autor identificado', async () => {
    await registrar({ ip: null }, {
      acao: 'delete',
      entidade: 'product',
      entidade_id: 'teste-audit-4',
    });
    const { rows } = await pool.query(
      "SELECT user_email, user_id FROM audit_log WHERE entidade_id = 'teste-audit-4'"
    );
    expect(rows[0].user_email).toBe('desconhecido');
    expect(rows[0].user_id).toBeNull();
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

```bash
cd server && npx jest tests/audit.test.js
```

Esperado: FAIL — `Cannot find module '../src/lib/audit'`.

- [ ] **Step 4: Implementar o helper**

Criar `server/src/lib/audit.js`:

```js
const pool = require('../db');

const LIMITE_BYTES = 100 * 1024;

// Valores muito grandes (um texto longo de CMS, por exemplo) viram um marcador:
// o histórico precisa caber na tabela sem inchar o banco.
function podar(valor) {
  if (valor === undefined) return null;
  const json = JSON.stringify(valor);
  if (json && json.length > LIMITE_BYTES) {
    return { truncado: true, tamanho: json.length };
  }
  return valor;
}

// Registra uma alteração. NUNCA lança: perder uma linha de histórico não pode
// derrubar o salvamento que a originou.
async function registrar(req, dados) {
  try {
    const { acao, entidade, entidade_id = null, campo = null,
            valor_anterior, valor_novo } = dados;

    await pool.query(
      `INSERT INTO audit_log
         (user_id, user_email, acao, entidade, entidade_id, campo,
          valor_anterior, valor_novo, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        req?.admin?.id ?? null,
        req?.admin?.email ?? 'desconhecido',
        acao,
        entidade,
        entidade_id,
        campo,
        JSON.stringify(podar(valor_anterior)),
        JSON.stringify(podar(valor_novo)),
        req?.ip ?? null,
      ]
    );
  } catch (err) {
    console.error('audit.registrar falhou:', err.message);
  }
}

module.exports = { registrar };
```

- [ ] **Step 5: Aplicar a migration e rodar o teste**

```bash
cd server && DATABASE_URL="postgresql://sobral:sobral_pass@127.0.0.1:5433/sobral_test" node src/db/migrate.js
npx jest tests/audit.test.js
```

Esperado: PASS, 4 testes. O terceiro teste imprime um `console.error` — é o
comportamento correto sendo exercitado, não uma falha.

- [ ] **Step 6: Rodar a suíte inteira**

```bash
cd server && npm test
```

Esperado: 33 passando.

- [ ] **Step 7: Commit**

```bash
git add server/src/db/migrations/016_audit_log.sql server/src/lib/audit.js server/tests/audit.test.js
git commit -m "feat(admin): tabela audit_log e helper de auditoria tolerante a falha"
git push origin main
```

---

### Task 3: `requireAuth` resolve o usuário no banco; `requirePapel`

**Files:**
- Modify: `server/src/middleware/requireAuth.js` (reescrita)
- Create: `server/src/middleware/requirePapel.js`
- Modify: `server/tests/helpers.js` (helpers de usuário)
- Test: `server/tests/require-auth.test.js`

**Interfaces:**
- Consumes: `admin_users` (Task 1).
- Produces:
  - `req.admin = { id, email, nome, papel }` em toda rota autenticada.
  - `req.tokenExp` — `exp` do JWT em segundos (usado pela Task 6).
  - `requirePapel('admin') → middleware` em `server/src/middleware/requirePapel.js`.
  - Em `tests/helpers.js`: `criarUsuario({ email, papel, ativo }) → Promise<{id, email}>`
    e `removerUsuario(email) → Promise<void>`.

- [ ] **Step 1: Acrescentar helpers de usuário aos testes**

Em `server/tests/helpers.js`, acrescentar antes do `module.exports`:

```js
const bcrypt = require('bcryptjs');

async function criarUsuario({ email, papel = 'editor', ativo = true, senha = 'Test@123' }) {
  const hash = bcrypt.hashSync(senha, 10);
  const { rows } = await pool.query(
    `INSERT INTO admin_users (email, nome, senha_hash, papel, ativo)
     VALUES (lower($1), 'Usuário Teste', $2, $3, $4)
     ON CONFLICT (email) DO UPDATE
       SET papel = EXCLUDED.papel, ativo = EXCLUDED.ativo, senha_hash = EXCLUDED.senha_hash
     RETURNING id, email`,
    [email, hash, papel, ativo]
  );
  return rows[0];
}

async function removerUsuario(email) {
  await pool.query('DELETE FROM admin_users WHERE lower(email) = lower($1)', [email]);
}

function makeTokenPara(email) {
  return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
}
```

E trocar o `module.exports` por:

```js
module.exports = {
  makeToken, makeTokenPara, createCategory, deleteCategory,
  createProduct, deleteProduct, criarUsuario, removerUsuario,
};
```

- [ ] **Step 2: Escrever o teste (vai falhar)**

Criar `server/tests/require-auth.test.js`:

```js
const request = require('supertest');
const app  = require('../src/app');
const pool = require('../src/db');
const { makeToken, makeTokenPara, criarUsuario, removerUsuario } = require('./helpers');

const ATIVO    = 'ativo@test.com';
const INATIVO  = 'inativo@test.com';

afterEach(async () => {
  await removerUsuario(ATIVO);
  await removerUsuario(INATIVO);
});

describe('requireAuth — resolução no banco', () => {
  it('aceita usuário ativo existente na tabela', async () => {
    await criarUsuario({ email: ATIVO, papel: 'editor' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeTokenPara(ATIVO)}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(ATIVO);
    expect(res.body.papel).toBe('editor');
  });

  it('rejeita usuário desativado mesmo com token válido', async () => {
    await criarUsuario({ email: ATIVO, ativo: true });          // garante 1 ativo
    await criarUsuario({ email: INATIVO, ativo: false });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeTokenPara(INATIVO)}`);
    expect(res.status).toBe(401);
  });

  it('rejeita e-mail que não existe na tabela quando há usuário ativo', async () => {
    await criarUsuario({ email: ATIVO, ativo: true });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeTokenPara('fantasma@test.com')}`);
    expect(res.status).toBe(401);
  });

  it('aceita a credencial do .env quando não há nenhum usuário ativo', async () => {
    await pool.query('DELETE FROM admin_users');
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.papel).toBe('admin');
  });

  it('continua rejeitando token ausente ou inválido', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me')
      .set('Authorization', 'Bearer lixo')).status).toBe(401);
  });
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

```bash
cd server && npx jest tests/require-auth.test.js
```

Esperado: FAIL — o teste do usuário desativado devolve 200 (o middleware atual
não consulta o banco) e `res.body.papel` vem `undefined`.

- [ ] **Step 4: Reescrever o middleware**

Substituir todo o conteúdo de `server/src/middleware/requireAuth.js`:

```js
const jwt  = require('jsonwebtoken');
const pool = require('../db');

// Resolve o usuário do token contra a tabela admin_users.
// Recuperação: se NÃO houver nenhum usuário ativo (tabela vazia, ou a migration
// ainda não rodou), a credencial do .env volta a valer. Existindo qualquer
// usuário ativo, esse caminho se fecha sozinho.
async function resolverAdmin(email) {
  const alvo = String(email || '').trim().toLowerCase();
  if (!alvo) return null;

  try {
    const { rows } = await pool.query(
      `SELECT id, email, nome, papel
       FROM admin_users
       WHERE lower(email) = $1 AND ativo
       LIMIT 1`,
      [alvo]
    );
    if (rows.length) return rows[0];

    const { rows: cont } = await pool.query(
      'SELECT COUNT(*)::int AS n FROM admin_users WHERE ativo'
    );
    if (cont[0].n === 0) return adminDoEnv(alvo);
    return null;
  } catch (err) {
    // 42P01 = tabela inexistente: migration não aplicada. Não trancar o painel.
    if (err.code === '42P01') return adminDoEnv(alvo);
    throw err;
  }
}

function adminDoEnv(alvo) {
  const doEnv = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!doEnv || alvo !== doEnv) return null;
  console.warn('requireAuth: nenhum usuário ativo em admin_users; aceitando credencial do .env');
  return { id: null, email: doEnv, nome: 'Administrador', papel: 'admin' };
}

async function requireAuth(req, res, next) {
  const cookie = req.cookies?.sobral_jwt;
  const header = req.headers.authorization;
  const token  = cookie || (header?.startsWith('Bearer ') ? header.slice(7) : null);

  if (!token) {
    req.resume();
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    req.resume();
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  let admin;
  try {
    admin = await resolverAdmin(payload.email);
  } catch (err) {
    console.error('requireAuth:', err.message);
    req.resume();
    return res.status(500).json({ error: 'Erro interno.' });
  }

  if (!admin) {
    req.resume();
    return res.status(401).json({ error: 'Usuário sem acesso ao painel.' });
  }

  req.admin    = admin;
  req.tokenExp = payload.exp;
  next();
}

module.exports = requireAuth;
```

- [ ] **Step 5: Fazer `/api/auth/me` devolver o papel**

Em `server/src/routes/auth.js`, trocar o handler do `/me`:

```js
router.get('/me', requireAuth, (req, res) => {
  res.json({
    email: req.admin.email,
    nome:  req.admin.nome,
    papel: req.admin.papel,
  });
});
```

- [ ] **Step 6: Criar o middleware de papel**

Criar `server/src/middleware/requirePapel.js`:

```js
// Barra quem não tem o papel exigido. Usado nas rotas de usuários (fase 5).
// Esconder o item no menu não é controle de acesso — a decisão é aqui.
function requirePapel(...papeis) {
  return (req, res, next) => {
    if (!req.admin || !papeis.includes(req.admin.papel)) {
      return res.status(403).json({ error: 'Permissão insuficiente.' });
    }
    next();
  };
}

module.exports = requirePapel;
```

- [ ] **Step 7: Rodar os testes e confirmar que passam**

```bash
cd server && npx jest tests/require-auth.test.js
```

Esperado: PASS, 5 testes.

- [ ] **Step 8: Rodar a suíte inteira — atenção à regressão**

```bash
cd server && npm test
```

Esperado: 38 passando. Os testes antigos usam `makeToken()` com
`ADMIN_EMAIL` e a tabela fica vazia entre eles, então caem no caminho de
recuperação — é esperado ver `console.warn` na saída. Se algum teste antigo
falhar com 401, a causa provável é um usuário ativo remanescente de outro
arquivo de teste: recriar o banco conforme o bloco do topo.

- [ ] **Step 9: Commit**

```bash
git add server/src/middleware/requireAuth.js server/src/middleware/requirePapel.js server/src/routes/auth.js server/tests/helpers.js server/tests/require-auth.test.js
git commit -m "feat(admin): requireAuth resolve usuario no banco com recuperacao via env"
git push origin main
```

---

### Task 4: Auditar as rotas administrativas existentes

**Files:**
- Modify: `server/src/routes/admin-products.js` (create, update, toggle, delete)
- Modify: `server/src/routes/admin-content.js` (update, guardando o valor anterior)
- Modify: `server/src/routes/admin-categories.js` (create, update, delete)
- Modify: `server/src/routes/admin-hero-slides.js` (create, update, toggle, delete)
- Modify: `server/src/routes/admin-misturinhas.js` (create, update, toggle, delete)
- Test: `server/tests/audit-rotas.test.js`

**Interfaces:**
- Consumes: `registrar` (Task 2), `req.admin` (Task 3).
- Produces: uma linha de `audit_log` por alteração administrativa. Para
  `entidade = 'content'`, `campo` é a chave do `page_content` e
  `valor_anterior` é o texto que estava salvo — é disso que a restauração da
  fase 4 depende.

- [ ] **Step 1: Escrever o teste (vai falhar)**

Criar `server/tests/audit-rotas.test.js`:

```js
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
  await pool.query("DELETE FROM audit_log WHERE entidade_id IN ($1, 'teste_chave')", [PROD]);
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
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd server && npx jest tests/audit-rotas.test.js
```

Esperado: FAIL — nenhuma linha em `audit_log`, `logs.map(...)` devolve `[]`.

- [ ] **Step 3: Auditar `admin-products.js`**

No topo, junto dos outros requires:

```js
const { registrar } = require('../lib/audit');
```

No `POST /`, depois do `res.status(201).json(rows[0]);`, antes do fechamento do
`try` — e trocando a ordem para registrar antes de responder não é necessário,
mas o registro precisa acontecer:

```js
    await registrar(req, {
      acao: 'create', entidade: 'product', entidade_id: rows[0].id,
      valor_novo: rows[0],
    });
```

No `PUT /:id`, é preciso ler o estado anterior **antes** do UPDATE. Inserir
logo no começo do `try`:

```js
    const anterior = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
```

e depois do `if (!rows.length) return res.status(404)...`:

```js
    await registrar(req, {
      acao: 'update', entidade: 'product', entidade_id: req.params.id,
      valor_anterior: anterior.rows[0] ?? null, valor_novo: rows[0],
    });
```

No `PATCH /:id/ativo`, depois do 404:

```js
    await registrar(req, {
      acao: 'update', entidade: 'product', entidade_id: req.params.id,
      campo: 'ativo', valor_novo: rows[0].ativo,
    });
```

No `DELETE /:id`, trocar a query por uma que devolva a linha removida:

```js
    const { rows } = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Produto não encontrado.' });
    await registrar(req, {
      acao: 'delete', entidade: 'product', entidade_id: req.params.id,
      valor_anterior: rows[0],
    });
    res.json({ ok: true });
```

- [ ] **Step 4: Auditar `admin-content.js`**

No topo: `const { registrar } = require('../lib/audit');`

No `PUT /:page/:key`, ler o valor anterior antes do upsert e registrar depois:

```js
    const anterior = await pool.query(
      'SELECT value FROM page_content WHERE page = $1 AND key = $2',
      [req.params.page, req.params.key]
    );
```

e depois do upsert, antes do `res.json(rows[0])`:

```js
    await registrar(req, {
      acao: 'update', entidade: 'content', entidade_id: req.params.page,
      campo: req.params.key,
      valor_anterior: anterior.rows[0]?.value ?? null,
      valor_novo: value,
    });
```

- [ ] **Step 5: Auditar categorias, hero slides e misturinhas**

Mesmo padrão nos três arquivos, com `entidade` `'category'`, `'hero_slide'` e
`'misturinha'`:

- `POST` → `acao: 'create'`, `valor_novo` = linha criada.
- `PUT` → ler a linha antes, `acao: 'update'`, `valor_anterior` + `valor_novo`.
- `PATCH /:id/ativo` → `acao: 'update'`, `campo: 'ativo'`, `valor_novo` = novo estado.
- `DELETE` → trocar para `DELETE ... RETURNING *`, `acao: 'delete'`,
  `valor_anterior` = linha removida.

Em `admin-hero-slides.js`, a rota `PUT /reorder` registra uma única linha:

```js
    await registrar(req, {
      acao: 'update', entidade: 'hero_slide', entidade_id: 'reorder',
      campo: 'ordem', valor_novo: ids,
    });
```

- [ ] **Step 6: Rodar o teste novo e a suíte inteira**

```bash
cd server && npx jest tests/audit-rotas.test.js && npm test
```

Esperado: teste novo com 2 passando; suíte com 40 passando.

- [ ] **Step 7: Commit**

```bash
git add server/src/routes/admin-products.js server/src/routes/admin-content.js server/src/routes/admin-categories.js server/src/routes/admin-hero-slides.js server/src/routes/admin-misturinhas.js server/tests/audit-rotas.test.js
git commit -m "feat(admin): registra alteracoes administrativas no audit_log"
git push origin main
```

---

# FASE 1 — Não perder trabalho

### Task 5: Renovação de sessão na API

**Files:**
- Modify: `server/src/routes/auth.js` (extrair `cookieOpts`/emissão, `/refresh`, `expiresAt` no `/me`)
- Test: `server/tests/auth-refresh.test.js`

**Interfaces:**
- Consumes: `req.admin` e `req.tokenExp` (Task 3).
- Produces:
  - `GET /api/auth/me` → `{ email, nome, papel, expiresAt }`, `expiresAt` em
    milissegundos desde a época (número).
  - `POST /api/auth/refresh` → `{ ok: true, expiresAt }` e novo cookie; 401 sem
    sessão válida.

- [ ] **Step 1: Escrever o teste (vai falhar)**

Criar `server/tests/auth-refresh.test.js`:

```js
const request = require('supertest');
const app = require('../src/app');
const { makeToken } = require('./helpers');

describe('GET /api/auth/me — expiresAt', () => {
  it('devolve o vencimento do token em milissegundos no futuro', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.expiresAt).toBe('number');
    expect(res.body.expiresAt).toBeGreaterThan(Date.now());
  });
});

describe('POST /api/auth/refresh', () => {
  it('retorna 401 sem sessão', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('emite novo cookie e novo vencimento', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.expiresAt).toBeGreaterThan(Date.now());

    const cookies = res.headers['set-cookie'];
    const cookieStr = Array.isArray(cookies) ? cookies.join('') : (cookies || '');
    expect(cookieStr).toContain('sobral_jwt');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd server && npx jest tests/auth-refresh.test.js
```

Esperado: FAIL — `expiresAt` é `undefined` e `/refresh` dá 404.

- [ ] **Step 3: Implementar**

Em `server/src/routes/auth.js`, extrair a emissão do token para uma função e
reaproveitá-la no login:

```js
const DURACAO_HORAS = 8;

function emitirSessao(res, admin) {
  const token = jwt.sign(
    { sub: admin.id ?? undefined, email: admin.email, papel: admin.papel ?? 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: `${DURACAO_HORAS}h` }
  );
  res.cookie(COOKIE_NAME, token, cookieOpts);
  return Date.now() + DURACAO_HORAS * 60 * 60 * 1000;
}
```

No `/login`, trocar as duas linhas de `jwt.sign` + `res.cookie` por:

```js
  const expiresAt = emitirSessao(res, { id: null, email, papel: 'admin' });
  res.json({ ok: true, email, expiresAt });
```

Acrescentar a rota de renovação, depois do `/logout`:

```js
router.post('/refresh', requireAuth, (req, res) => {
  const expiresAt = emitirSessao(res, req.admin);
  res.json({ ok: true, expiresAt });
});
```

E o `/me` passa a incluir o vencimento do token atual:

```js
router.get('/me', requireAuth, (req, res) => {
  res.json({
    email:     req.admin.email,
    nome:      req.admin.nome,
    papel:     req.admin.papel,
    expiresAt: req.tokenExp ? req.tokenExp * 1000 : null,
  });
});
```

- [ ] **Step 4: Rodar os testes**

```bash
cd server && npx jest tests/auth-refresh.test.js && npm test
```

Esperado: 3 novos passando; suíte com 43 passando.

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/auth.js server/tests/auth-refresh.test.js
git commit -m "feat(auth): rota de renovacao de sessao e expiresAt no /me"
git push origin main
```

---

### Task 6: Aviso e renovação de sessão no painel

**Files:**
- Modify: `src/context/AuthContext.jsx` (guardar `expiresAt`, expor `renovar`)
- Create: `src/components/admin/SessionExpiryModal.jsx`
- Modify: `src/pages/admin/AdminLayout.jsx` (montar o modal, alimentar `expiresAt`)
- Modify: `src/hooks/useAdminFetch.js` (renovação silenciosa em atividade)

**Interfaces:**
- Consumes: `GET /api/auth/me` e `POST /api/auth/refresh` (Task 5).
- Produces: no `AuthContext`, `expiresAt: number|null`, `setExpiresAt(ms)` e
  `renovarSessao() → Promise<boolean>`.

Sem runner de testes no frontend: a verificação é o roteiro manual do Step 5
mais `npm run build` limpo.

- [ ] **Step 1: Guardar o vencimento no AuthContext**

Em `src/context/AuthContext.jsx`, acrescentar o estado e a função de renovação,
e incluí-los no `value` do provider:

```jsx
  const [expiresAt, setExpiresAt] = useState(null);

  const renovarSessao = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;
      const data = await res.json();
      setExpiresAt(data.expiresAt ?? null);
      return true;
    } catch {
      return false;
    }
  }, []);
```

No `logout`, zerar também o vencimento: `setExpiresAt(null);`.

- [ ] **Step 2: Criar o modal de expiração**

Criar `src/components/admin/SessionExpiryModal.jsx`:

```jsx
import { useEffect, useState } from 'react';

const AVISO_MS = 5 * 60 * 1000;

function formatar(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const min = String(Math.floor(total / 60)).padStart(2, '0');
  const seg = String(total % 60).padStart(2, '0');
  return `${min}:${seg}`;
}

// Avisa quando faltam 5 minutos para a sessão vencer e oferece renovar.
// Sem isso, o token morre no meio de uma edição longa e o trabalho se perde.
export default function SessionExpiryModal({ expiresAt, onRenovar, onSair }) {
  const [restante, setRestante] = useState(null);

  useEffect(() => {
    if (!expiresAt) { setRestante(null); return; }
    const tick = () => setRestante(expiresAt - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (restante === null || restante > AVISO_MS) return null;

  const venceu = restante <= 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="sessao-title"
           className="bg-white rounded-[14px] shadow-xl p-6 w-full max-w-sm">
        <h3 id="sessao-title" className="font-[800] text-[17px] text-ink mb-2">
          {venceu ? 'Sua sessão expirou' : 'Sua sessão está expirando'}
        </h3>
        <p className="text-[14px] text-ink-light mb-6 leading-[1.5]">
          {venceu
            ? 'Entre novamente para continuar. O que você digitou foi guardado como rascunho.'
            : <>Faltam <b className="text-orange">{formatar(restante)}</b> para o fim da sessão. Continue conectado para não perder o que está editando.</>}
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onSair}
            className="px-4 py-2 text-[14px] font-[600] text-ink-light border border-line rounded-[8px] hover:border-orange hover:text-orange transition-colors">
            Sair
          </button>
          {!venceu && (
            <button onClick={onRenovar}
              className="px-4 py-2 text-[14px] font-[700] text-white bg-orange hover:bg-[#E0580A] rounded-[8px] transition-colors">
              Continuar conectado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Montar o modal no layout**

Em `src/pages/admin/AdminLayout.jsx`: importar o modal e o que falta do
contexto (`expiresAt`, `setExpiresAt`, `renovarSessao`), guardar `expiresAt`
vindo do `/api/auth/me` no `useEffect` existente:

```jsx
      .then(data => {
        if (data?.email) setUser({ email: data.email, nome: data.nome, papel: data.papel });
        if (data?.expiresAt) setExpiresAt(data.expiresAt);
      })
```

e renderizar antes do `<Toaster />`:

```jsx
      <SessionExpiryModal
        expiresAt={expiresAt}
        onRenovar={renovarSessao}
        onSair={handleLogout}
      />
```

- [ ] **Step 4: Renovação silenciosa em atividade**

Em `src/hooks/useAdminFetch.js`, depois de uma resposta bem-sucedida, renovar
quando faltar menos de 30 minutos — assim quem está trabalhando nunca chega a
ver o modal:

```js
const LIMIAR_RENOVACAO_MS = 30 * 60 * 1000;

// dentro do useAdminFetch, com expiresAt e renovarSessao vindos do contexto:
    if (res.ok && expiresAt && expiresAt - Date.now() < LIMIAR_RENOVACAO_MS) {
      renovarSessao();   // sem await: não atrasa a resposta ao chamador
    }
```

Cuidado ao montar as dependências do `useCallback`: incluir `expiresAt` e
`renovarSessao`. `renovarSessao` é estável (`useCallback` sem deps), mas
`expiresAt` muda — é o que se quer, já que o limiar depende dele.

- [ ] **Step 5: Verificação manual**

```bash
npm run build          # na raiz: precisa terminar sem erro
```

Roteiro no navegador, com o backend rodando (`cd server && npm run dev`):

1. Entrar em `/admin/login`. Confirmar que entra normalmente.
2. No DevTools, rodar
   `window.__expira = Date.now() + 4*60*1000` não serve — o estado é interno.
   Em vez disso, baixar `DURACAO_HORAS` para `0.09` (≈5,4 min) em
   `server/src/routes/auth.js`, reiniciar o backend e entrar de novo.
3. Esperar ~30 s: o modal deve aparecer com a contagem regressiva correndo.
4. Clicar "Continuar conectado": o modal some e a contagem reinicia.
5. Deixar zerar sem clicar: o texto muda para "Sua sessão expirou" e só resta
   "Sair".
6. **Reverter `DURACAO_HORAS` para 8** antes de commitar.

- [ ] **Step 6: Commit**

```bash
git add src/context/AuthContext.jsx src/components/admin/SessionExpiryModal.jsx src/pages/admin/AdminLayout.jsx src/hooks/useAdminFetch.js
git commit -m "feat(admin): aviso de expiracao e renovacao de sessao"
git push origin main
```

---

### Task 7: Guarda de saída com alterações não salvas

**Files:**
- Create: `src/hooks/useUnsavedChanges.js`
- Modify: `src/pages/admin/AdminProductFormPage.jsx`
- Modify: `src/pages/admin/AdminMisturinhasPage.jsx`

**Interfaces:**
- Consumes: `useBlocker` do `react-router-dom` (disponível: o app usa
  `createBrowserRouter`).
- Produces: `useUnsavedChanges(dirty: boolean) → { bloqueio }`, onde `bloqueio`
  é `null` ou `{ confirmar(), cancelar() }`.

- [ ] **Step 1: Criar o hook**

Criar `src/hooks/useUnsavedChanges.js`:

```js
import { useEffect, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

// Impede que uma navegação interna ou o fechamento da aba descartem edição
// em andamento. Devolve o bloqueio pendente para a página desenhar o modal.
export function useUnsavedChanges(dirty) {
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        dirty && currentLocation.pathname !== nextLocation.pathname,
      [dirty]
    )
  );

  useEffect(() => {
    if (!dirty) return;
    const aviso = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [dirty]);

  const bloqueio = blocker.state === 'blocked'
    ? { confirmar: () => blocker.proceed(), cancelar: () => blocker.reset() }
    : null;

  return { bloqueio };
}
```

- [ ] **Step 2: Aplicar no formulário de produto**

Em `src/pages/admin/AdminProductFormPage.jsx`:

- guardar o estado inicial para comparar:

```jsx
  const [formInicial, setFormInicial] = useState(EMPTY_FORM);
  const dirty = JSON.stringify(form) !== JSON.stringify(formInicial) || !!imageFile;
  const { bloqueio } = useUnsavedChanges(dirty && !saving);
```

- no `useEffect` de carga (modo edição), depois do `setForm({...})`, chamar
  `setFormInicial` com o mesmo objeto;
- depois de salvar com sucesso, antes do `navigate('/admin')`, marcar como
  limpo: `setFormInicial(form);`
- renderizar o modal ao fim do componente, reaproveitando `ConfirmModal`:

```jsx
      <ConfirmModal
        open={!!bloqueio}
        danger={false}
        title="Sair sem salvar?"
        message="Você tem alterações que ainda não foram salvas. Se sair agora, elas serão perdidas."
        confirmLabel="Sair sem salvar"
        onConfirm={() => bloqueio.confirmar()}
        onCancel={() => bloqueio.cancelar()}
      />
```

- [ ] **Step 3: Aplicar no formulário de misturinhas**

Mesmo padrão em `src/pages/admin/AdminMisturinhasPage.jsx`, onde `dirty` é
`form !== null` combinado com a comparação contra o estado inicial do
formulário aberto.

- [ ] **Step 4: Verificação manual**

```bash
npm run build
```

1. Abrir `/admin/produtos/novo`, digitar algo no Nome, clicar em "← Produtos":
   o modal "Sair sem salvar?" aparece. "Cancelar" mantém na página com o texto
   intacto; "Sair sem salvar" navega.
2. Com texto digitado, recarregar a aba (F5): o navegador pede confirmação.
3. Salvar um produto normalmente: **não** pode aparecer modal ao navegar de
   volta.
4. Abrir um produto existente e sair sem alterar nada: nenhum modal.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useUnsavedChanges.js src/pages/admin/AdminProductFormPage.jsx src/pages/admin/AdminMisturinhasPage.jsx
git commit -m "feat(admin): guarda de saida com alteracoes nao salvas"
git push origin main
```

---

### Task 8: Rascunho local do formulário de produto

**Files:**
- Create: `src/hooks/useRascunho.js`
- Modify: `src/pages/admin/AdminProductFormPage.jsx`

**Interfaces:**
- Consumes: `form` e `setForm` do formulário de produto.
- Produces: `useRascunho(chave, valor, { ativo }) → { rascunho, descartar, limpar }`,
  onde `rascunho` é `{ dados, salvoEm }` ou `null`.

- [ ] **Step 1: Criar o hook**

Criar `src/hooks/useRascunho.js`:

```js
import { useEffect, useRef, useState } from 'react';

const PREFIXO = 'sobral_draft_';

// Guarda o formulário em localStorage enquanto se digita, para que uma sessão
// expirada, um fechamento acidental ou uma queda não levem o trabalho junto.
// Toda leitura/escrita é protegida: modo privativo ou storage cheio não podem
// quebrar o formulário.
export function useRascunho(chave, valor, { ativo = true } = {}) {
  const storageKey = PREFIXO + chave;
  const [rascunho, setRascunho] = useState(null);
  const primeiraCarga = useRef(true);

  // Na montagem, procura um rascunho anterior.
  useEffect(() => {
    try {
      const bruto = localStorage.getItem(storageKey);
      if (bruto) setRascunho(JSON.parse(bruto));
    } catch { /* storage indisponível: segue sem rascunho */ }
  }, [storageKey]);

  // Grava com debounce a cada mudança, menos na primeira renderização.
  useEffect(() => {
    if (!ativo) return;
    if (primeiraCarga.current) { primeiraCarga.current = false; return; }
    const id = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          dados: valor,
          salvoEm: new Date().toISOString(),
        }));
      } catch { /* sem espaço: o formulário continua funcionando */ }
    }, 1000);
    return () => clearTimeout(id);
  }, [valor, ativo, storageKey]);

  const limpar = () => {
    try { localStorage.removeItem(storageKey); } catch {}
    setRascunho(null);
  };

  return { rascunho, descartar: limpar, limpar };
}
```

- [ ] **Step 2: Usar no formulário de produto**

Em `src/pages/admin/AdminProductFormPage.jsx`:

```jsx
  const { rascunho, descartar, limpar } = useRascunho(id || 'novo', form, { ativo: !loading });
  const [rascunhoVisivel, setRascunhoVisivel] = useState(true);
```

Depois de salvar com sucesso, chamar `limpar()` antes do `navigate`.

Renderizar a faixa de recuperação logo abaixo do cabeçalho, antes do bloco de
erro:

```jsx
      {rascunho && rascunhoVisivel && (
        <div className="mb-4 bg-[#FFF4EB] border border-orange/30 text-ink text-[13px] rounded-[8px] px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="flex-1">
            Encontramos um rascunho não salvo de{' '}
            <b>{new Date(rascunho.salvoEm).toLocaleString('pt-BR')}</b>.
          </span>
          <button type="button"
            onClick={() => { setForm(rascunho.dados); setRascunhoVisivel(false); }}
            className="font-[700] text-orange hover:underline">
            Recuperar
          </button>
          <button type="button"
            onClick={() => { descartar(); setRascunhoVisivel(false); }}
            className="font-[600] text-muted hover:text-ink-light">
            Descartar
          </button>
        </div>
      )}
```

Nada é aplicado sem o usuário mandar — a faixa só oferece.

- [ ] **Step 3: Verificação manual**

```bash
npm run build
```

1. Abrir `/admin/produtos/novo`, preencher Nome e Descrição, esperar 2 s.
2. Fechar a aba confirmando a saída; reabrir `/admin/produtos/novo`.
3. A faixa aparece com a data. "Recuperar" repõe os campos; "Descartar" some
   com ela e não volta ao recarregar.
4. Criar um produto de verdade e voltar a `/admin/produtos/novo`: **nenhuma**
   faixa (o rascunho foi limpo no salvamento).
5. Abrir um produto existente, alterar, sair sem salvar, voltar: a faixa
   aparece para aquele produto especificamente.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useRascunho.js src/pages/admin/AdminProductFormPage.jsx
git commit -m "feat(admin): rascunho local do formulario de produto"
git push origin main
```

---

### Task 9: Estado explícito por campo no CMS

**Files:**
- Modify: `src/pages/admin/AdminContentPage.jsx`

**Interfaces:**
- Consumes: `PUT /api/admin/content/:page/:key` (inalterado).
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Trocar os dois mapas por um mapa de status**

Em `src/pages/admin/AdminContentPage.jsx`, substituir `saving`/`saved` por:

```jsx
  const [status,     setStatus]     = useState({});   // key → idle|dirty|saving|salvo|erro
  const [valorSalvo, setValorSalvo] = useState({});   // key → último valor confirmado pelo servidor
```

Ao carregar, popular `valorSalvo` com o mesmo mapa de `content`.

- [ ] **Step 2: Reescrever `saveField`**

```jsx
  const saveField = async (key, value) => {
    setStatus(s => ({ ...s, [key]: 'saving' }));
    try {
      const res = await request(`/api/admin/content/${page}/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
      if (!res || !res.ok) throw new Error();
      setValorSalvo(v => ({ ...v, [key]: value }));
      setStatus(s => ({ ...s, [key]: 'salvo' }));
      setTimeout(() => setStatus(s => (s[key] === 'salvo' ? { ...s, [key]: 'idle' } : s)), 2000);
    } catch {
      // Erro é persistente: sem isso o campo fica na tela parecendo salvo.
      setStatus(s => ({ ...s, [key]: 'erro' }));
    }
  };
```

E marcar `dirty` no `onChange` de cada campo:

```jsx
  const alterar = (key, valor) => {
    setContent(c => ({ ...c, [key]: valor }));
    setStatus(s => ({ ...s, [key]: valor === valorSalvo[key] ? 'idle' : 'dirty' }));
  };
```

- [ ] **Step 3: Criar o indicador visual por campo**

Um componente local no mesmo arquivo, usado nos três tipos de campo:

```jsx
function StatusCampo({ estado, onTentarDeNovo }) {
  if (estado === 'saving') return <span className="text-[12px] text-muted">Salvando...</span>;
  if (estado === 'salvo')  return <span className="text-[12px] text-green-600">✓ Salvo</span>;
  if (estado === 'dirty')  return <span className="text-[12px] text-muted">Não salvo</span>;
  if (estado === 'erro')   return (
    <span className="text-[12px] text-red-600 font-[600] flex items-center gap-2">
      Não salvo
      <button type="button" onClick={onTentarDeNovo} className="underline hover:no-underline">
        Tentar de novo
      </button>
    </span>
  );
  return null;
}
```

E o campo em erro ganha borda vermelha: adicionar
`status[field.key] === 'erro' ? 'border-red-400' : 'border-line'` na classe do
`input`/wrapper.

- [ ] **Step 4: Bloquear a saída com campos pendentes**

Reaproveitar o hook da Task 7:

```jsx
  const pendentes = Object.values(status).some(e => e === 'dirty' || e === 'erro');
  const { bloqueio } = useUnsavedChanges(pendentes);
```

e renderizar o mesmo `ConfirmModal` da Task 7, com a mensagem
"Há campos que não foram salvos. Se sair agora, as alterações serão perdidas."

- [ ] **Step 5: Verificação manual**

```bash
npm run build
```

1. Abrir `/admin/conteudo/home`, alterar um campo de texto sem sair dele:
   aparece "Não salvo".
2. Sair do campo (blur): vira "Salvando..." e depois "✓ Salvo", sumindo em 2 s.
3. Derrubar o backend (`Ctrl+C` no `npm run dev` do server) e alterar outro
   campo com blur: o estado fica **vermelho e permanente**, com "Tentar de
   novo".
4. Subir o backend e clicar "Tentar de novo": salva e vira "✓ Salvo".
5. Com um campo em erro, tentar navegar para "Produtos": o modal de saída
   aparece.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/AdminContentPage.jsx
git commit -m "feat(admin): estado explicito por campo no editor de conteudo"
git push origin main
```

---

### Task 10: Atualizar o CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Corrigir e acrescentar**

- Trocar `Testes: Nenhum framework configurado` por
  `Testes: Jest + supertest no backend (cd server && npm test); CI roda migrations + testes`.
- Acrescentar na árvore do backend: `middleware/requirePapel.js`,
  `lib/audit.js`, `db/seed-admin.js`, migrations `015_admin_users.sql` e
  `016_audit_log.sql`.
- Acrescentar na árvore do frontend: `hooks/useUnsavedChanges.js`,
  `hooks/useRascunho.js`, `components/admin/SessionExpiryModal.jsx`.
- Acrescentar as rotas `POST /api/auth/refresh`.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: atualiza CLAUDE.md com testes e arquivos das fases 0 e 1"
git push origin main
```

---

## Self-Review

**Cobertura do spec (fases 0 e 1):**

| Requisito do spec | Task |
|---|---|
| Migration `015_admin_users` + semeadura fora do SQL | 1 |
| Migration `016_audit_log` | 2 |
| Helper `lib/audit.js` que nunca lança, com truncagem em 100 KB | 2 |
| JWT com `sub`/`papel`; `requireAuth` confere no banco | 3, 5 |
| Recuperação via `.env` sem nenhum usuário ativo | 3 |
| `requirePapel('admin')` | 3 |
| Auditoria gravando nas rotas existentes | 4 |
| `POST /api/auth/refresh` e `expiresAt` no `/me` | 5 |
| Modal T‑5min e renovação silenciosa T‑30min | 6 |
| `useUnsavedChanges` com `useBlocker` + `beforeunload` | 7 |
| Rascunho local com oferta de recuperação | 8 |
| Estado `idle/dirty/saving/salvo/erro` por campo no CMS | 9 |
| Atualização do CLAUDE.md | 10 |

Fases 2 a 6 ficam para planos próprios, conforme a decomposição.

**Consistência de tipos:** `req.admin` (`{id, email, nome, papel}`) é produzido
na Task 3 e consumido nas Tasks 4 e 5. `req.tokenExp` (segundos) é produzido na
Task 3 e convertido para milissegundos na Task 5. `expiresAt` é milissegundos
do Task 5 em diante, em toda a cadeia até o modal da Task 6.
`useUnsavedChanges` devolve `{ bloqueio }` nas Tasks 7 e 9.

**Riscos conhecidos na execução:**

1. Os testes antigos passam pelo caminho de recuperação do `.env` porque a
   tabela fica vazia entre arquivos. É esperado e está anotado na Task 3
   Step 8. Se um arquivo de teste deixar usuário ativo para trás, os outros
   quebram — daí os `afterEach` de limpeza.
2. `useBlocker` exige router de dados. O projeto usa `createBrowserRouter`,
   então está satisfeito; se algum dia voltar para `BrowserRouter`, a Task 7
   quebra.
