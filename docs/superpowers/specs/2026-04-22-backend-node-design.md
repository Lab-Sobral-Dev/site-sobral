# Sub-projeto 2 — Backend Node.js
**Data:** 2026-04-22
**Status:** Aprovado — pronto para implementação

---

## Objetivo

Implementar uma API REST em Node.js + Express dentro do mesmo repositório do frontend (`server/`), com PostgreSQL como banco de dados, Nodemailer para envio de e-mail, e JWT para autenticação do painel admin (sub-projeto 3). JavaScript puro, sem TypeScript.

---

## Stack

| Item | Tecnologia |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express 4 |
| Banco | PostgreSQL 16, driver `pg` (raw SQL, sem ORM) |
| Migrações | SQL files numerados + `migrate.js` script com tabela `schema_migrations` |
| E-mail | Nodemailer + SMTP |
| Auth | `jsonwebtoken` (JWT HS256, expiração 8h) |
| Segurança | `helmet`, `cors`, `express-rate-limit` |
| Variáveis | `dotenv` + `.env.example` documentado |

---

## Estrutura de pastas

```
site-sobral/
  src/                              ← frontend React (não muda)
  server/
    src/
      routes/
        products.js                 ← GET /api/products, GET /api/products/:id
        categories.js               ← GET /api/categories
        contact.js                  ← POST /api/contact
        auth.js                     ← POST /api/auth/login, GET /api/auth/me
      middleware/
        requireAuth.js              ← verifica JWT Bearer token
        validate.js                 ← helper: valida campos obrigatórios
      db/
        index.js                    ← pool pg configurado via DATABASE_URL
        migrate.js                  ← script: roda migrations pendentes
        seed.js                     ← insere 46 produtos e 6 categorias (idempotente)
        migrations/
          001_create_categories.sql
          002_create_products.sql
      email/
        mailer.js                   ← instância Nodemailer (transporte SMTP)
        templates/
          contact.js                ← função que retorna HTML do e-mail de contato
      app.js                        ← Express: middlewares globais + mount das rotas
      server.js                     ← entry point: listen na porta
    package.json
    .env.example
  vite.config.js                    ← adiciona server.proxy /api → localhost:3001
```

---

## Schema do banco de dados

### `categories`
```sql
CREATE TABLE categories (
  id     VARCHAR(50)  PRIMARY KEY,
  label  VARCHAR(100) NOT NULL,
  ordem  SMALLINT     NOT NULL DEFAULT 0
);
```

Dados: `all`, `suplementos`, `tradicionais`, `oleos`, `cosmeticos`, `infantil` — inseridos pelo seed.

### `products`
```sql
CREATE TABLE products (
  id              VARCHAR(100) PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  tag             VARCHAR(200),
  category_id     VARCHAR(50)  REFERENCES categories(id),
  brand           VARCHAR(100),
  image           VARCHAR(300),
  description     TEXT,
  caracteristicas TEXT[],
  apresentacao    TEXT,
  modo_uso        TEXT,
  precaucoes      TEXT,
  ingredientes    TEXT,
  disclaimer      TEXT,
  nutri_porcoes   TEXT,
  nutri_rows      JSONB,
  ativo           BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

O campo `id` é o slug do produto (ex: `calciolax-articule`), mantendo compatibilidade com as rotas do frontend (`/produtos/:id`).

### `schema_migrations`
```sql
CREATE TABLE schema_migrations (
  filename   VARCHAR(200) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Rotas da API

### Produtos (públicas)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/products` | Lista produtos com filtros e paginação |
| `GET` | `/api/products/:id` | Detalhe de um produto pelo slug |

**Query params de `/api/products`:**
- `cat` — filtra por `category_id` (ignorado se `all`)
- `q` — busca por `name`, `tag` ou `brand` (case-insensitive, `ILIKE`)
- `page` — página (default: `1`)
- `per_page` — itens por página (default: `12`, max: `50`)

**Resposta de `/api/products`:**
```json
{
  "data": [{ "id": "calciolax-articule", "name": "Calciolax Articule", "..." : "..." }],
  "total": 46,
  "page": 1,
  "totalPages": 4
}
```

### Categorias (pública)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/categories` | Lista categorias ordenadas por `ordem` |

### Contato (pública, rate-limited)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/contact` | Valida campos e envia e-mail via SMTP |

**Body:**
```json
{
  "nome": "string (obrigatório)",
  "sobrenome": "string (obrigatório)",
  "email": "string válido (obrigatório)",
  "celular": "string (obrigatório)",
  "assunto": "string (obrigatório)",
  "mensagem": "string (obrigatório)",
  "endereco": "string (opcional)",
  "estado": "string (opcional)"
}
```

Rate limit específico: **5 requisições por hora por IP**.

### Auth (para painel admin)

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/login` | Valida `email`+`password` contra env vars, retorna JWT |
| `GET` | `/api/auth/me` | Valida token ativo; retorna `{ email }` do admin |

O token JWT tem expiração de **8 horas**. O middleware `requireAuth.js` extrai o header `Authorization: Bearer <token>` e rejeita com `401` se ausente, inválido ou expirado. Todas as rotas de escrita do sub-projeto 3 usarão este middleware.

**Resposta de `/api/auth/login` (sucesso):**
```json
{ "token": "eyJ..." }
```

---

## Segurança

| Camada | Configuração |
|---|---|
| `helmet()` | Headers de segurança HTTP globais |
| `cors` | Dev: `http://localhost:5173`. Prod: `CORS_ORIGIN` do `.env` |
| Rate limit global | 100 req / 15 min por IP |
| Rate limit contato | 5 req / hora por IP |
| Validação | `validate.js` checa campos obrigatórios antes de qualquer lógica; erros retornam `400` |
| Erros internos | Mensagens genéricas ao cliente; detalhes apenas no log do servidor |

---

## E-mail

- `mailer.js` cria um `nodemailer.createTransport` com as variáveis `SMTP_*`
- Destinatário: `CONTACT_TO` (configurável por `.env`)
- Remetente: `SMTP_USER`
- `templates/contact.js` exporta uma função `contactEmailHtml({ nome, sobrenome, email, celular, assunto, mensagem, endereco, estado })` que retorna o HTML formatado
- Em caso de falha SMTP, a rota retorna `500` com `{ "error": "Não foi possível enviar a mensagem. Tente novamente." }` sem expor detalhes internos

---

## Variáveis de ambiente

```
# Banco
DATABASE_URL=postgresql://user:pass@localhost:5432/sobral

# Auth
JWT_SECRET=troque-por-string-aleatoria-longa
ADMIN_EMAIL=admin@laboratoriosobral.com.br
ADMIN_PASSWORD=senha-forte-aqui

# SMTP
SMTP_HOST=mail.laboratoriosobral.com.br
SMTP_PORT=465
SMTP_USER=contato@laboratoriosobral.com.br
SMTP_PASS=senha-smtp
CONTACT_TO=marketing@laboratoriosobral.com.br

# App
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

---

## Integração frontend ↔ backend

### Desenvolvimento

`vite.config.js` recebe um bloco `server.proxy`:
```js
server: {
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

Os dois processos rodam em paralelo: `npm run dev` (Vite na `:5173`) e `npm run dev` dentro de `server/` (Express na `:3001`).

### Migração gradual do frontend

Os componentes React (`ProdutosPage`, `ProdutoPage`) atualmente lêem `src/data/catalog.js` diretamente. Neste sub-projeto, eles passam a fazer `fetch('/api/products')` e `fetch('/api/products/:id')`. O arquivo `catalog.js` permanece no repositório como referência para o seed, mas não é mais importado pelos componentes.

### Produção

Nginx roteia:
- `/api/*` → `http://localhost:3001`
- tudo mais → `dist/` (Vite build estático)

Configuração Nginx detalhada fica para o sub-projeto 4.

---

## O que este sub-projeto NÃO inclui

- Rotas de escrita (POST/PUT/DELETE) para produtos e categorias — ficam para o sub-projeto 3 (Admin Panel)
- Upload de imagens — sub-projeto 3
- Deploy e configuração Nginx/PM2/SSL — sub-projeto 4
- Testes automatizados — não há framework de testes configurado no projeto
