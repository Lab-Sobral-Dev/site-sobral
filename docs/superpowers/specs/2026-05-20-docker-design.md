# Docker Setup — Design Spec

**Goal:** Containerizar o projeto (frontend React/Vite + backend Express + PostgreSQL) para rodar em dev com hot-reload e em prod com build otimizado.

**Arquitetura:** Multi-stage Dockerfile (builder Vite → prod Express); docker-compose separados por ambiente; volumes Docker para banco e uploads.

**Tech Stack:** Docker Engine 24+, Docker Compose v2, Node 20 Alpine, PostgreSQL 16 Alpine

---

## Arquitetura

Dois ambientes com composição de serviços diferente:

### Dev (`docker-compose.dev.yml`)

| Serviço    | Imagem             | Porta host | Descrição                              |
|------------|--------------------|------------|----------------------------------------|
| `db`       | postgres:16-alpine | 5432       | Banco de dados, volume `db_data`       |
| `app`      | node:20-alpine     | 3001       | Express API, nodemon, volume `server/` |
| `frontend` | node:20-alpine     | 5173       | Vite dev server, volume `./`           |

- `frontend` depende de `app`; `app` depende de `db`
- Vite faz proxy de `/api` → `http://app:3001` via env var `VITE_API_TARGET=http://app:3001` (sem Docker usa fallback `localhost:3001`)
- Variáveis carregadas de `server/.env`

### Prod (`docker-compose.yml`)

| Serviço | Imagem           | Porta host | Descrição                                  |
|---------|------------------|------------|--------------------------------------------|
| `db`    | postgres:16-alpine | —        | Banco, volume `db_data`, sem porta exposta |
| `app`   | build local      | 3001       | Express serve dist/ + API                  |

- Porta do `db` não exposta no host em prod
- Express passa a servir `dist/` como arquivos estáticos e roteia `*` → `index.html` para SPA

---

## Dockerfile (multi-stage)

```
# Stage 1: builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build          # vite build → dist/

# Stage 2: prod
FROM node:20-alpine AS prod
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/
COPY --from=builder /app/dist ./dist/
EXPOSE 3001
CMD ["node", "server/src/server.js"]
```

---

## Arquivos criados/modificados

| Arquivo                    | Ação      | Responsabilidade                              |
|----------------------------|-----------|-----------------------------------------------|
| `Dockerfile`               | criar     | Multi-stage builder + prod                    |
| `docker-compose.yml`       | criar     | Prod: app + db                                |
| `docker-compose.dev.yml`   | criar     | Dev: frontend + app + db                      |
| `.dockerignore`            | criar     | Exclui node_modules, .env, dist, .git         |
| `.env.example`             | modificar | Adiciona vars Postgres e nota sobre Docker    |
| `vite.config.js`           | modificar | Proxy target via `VITE_API_TARGET` env var com fallback `http://localhost:3001` |
| `server/src/app.js`        | modificar | Serve `path.join(__dirname, '../../dist')` como static em `NODE_ENV=production`; rota `*` → `index.html` |

---

## Volumes

| Volume       | Montagem no container           | Descrição                      |
|--------------|---------------------------------|--------------------------------|
| `db_data`    | `/var/lib/postgresql/data`      | Dados Postgres, persiste sempre|
| `uploads`    | `/app/public/images/produtos`   | Imagens de produto uploadadas  |

Em dev, `uploads` pode ser bind mount da pasta local `./public/images/produtos` para que imagens já existentes fiquem disponíveis.

---

## Variáveis de ambiente

Novas vars adicionadas ao `.env.example`:

```env
# PostgreSQL (Docker)
POSTGRES_USER=sobral
POSTGRES_PASSWORD=sobral_pass
POSTGRES_DB=sobral

# Em Docker, apontar para o serviço:
# DATABASE_URL=postgresql://sobral:sobral_pass@db:5432/sobral
# Sem Docker (local):
# DATABASE_URL=postgresql://postgres:1234@localhost:5432/sobral
```

---

## Comandos de uso

```bash
# Dev (hot-reload)
docker compose -f docker-compose.dev.yml up

# Prod (build + subida)
docker compose up --build -d

# Rodar migrations
docker compose exec app node server/src/db/migrate.js

# Seed inicial
docker compose exec app node server/src/db/seed.js

# Parar tudo
docker compose down

# Parar e remover volumes (cuidado: apaga banco)
docker compose down -v
```

---

## Fluxo de dados

```
[Browser]
    ↓ :5173 (dev) ou :3001 (prod)
[frontend Vite] (dev apenas)
    ↓ proxy /api → :3001
[app Express]
    ├── /api/* → rotas Express
    └── /* → dist/index.html (prod apenas)
         ↓
      [db Postgres :5432]
```

---

## Decisões

- **Postgres containerizado** em ambos os ambientes — sem dependência externa
- **Volume `uploads`** em bind mount no dev (arquivos locais visíveis); volume nomeado em prod
- **Porta 5432 não exposta em prod** — acesso apenas interno entre containers
- **Imagem Alpine** — menor footprint (~180MB vs ~900MB do node:20)
- **`--omit=dev`** no stage prod — não instala devDependencies no container final
