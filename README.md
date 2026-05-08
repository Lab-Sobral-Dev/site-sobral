# Laboratório Sobral — Site institucional

Site institucional e catálogo de produtos do Laboratório Sobral, com painel administrativo (CMS) para gerenciar produtos, categorias, conteúdo editorial e o carrossel hero da home.

## Stack

**Frontend** — Vite 6 + React 18 + Tailwind CSS 3 + React Router 6
**Backend** — Node.js 20 + Express 4 + PostgreSQL 16 (driver `pg`, sem ORM)
**Auth** — JWT HS256 (admin), armazenado em `localStorage`
**E-mail** — Nodemailer + SMTP
**Idioma** — pt-BR

## Estrutura

```
site-sobral/
  src/                              ← frontend React
    main.jsx                        ← entry, envolve <App> com <AuthProvider>
    App.jsx                         ← rotas públicas + /admin/*
    context/AuthContext.jsx         ← estado de auth, JWT em localStorage
    components/
      Header.jsx, Footer.jsx        ← cabeçalho e rodapé públicos
      Breadcrumb.jsx, ProductCard.jsx
      HeroCarousel.jsx              ← carrossel da home (camadas via API)
      admin/RichTextEditor.jsx      ← editor TipTap (CMS)
    hooks/usePageContent.js         ← busca conteúdo editável
    data/catalog.js                 ← fallback estático de produtos
    pages/
      HomePage, QuemSomosPage,
      ProdutosPage, ProdutoPage,
      FaleConoscoPage, PrivacidadePage
      admin/                        ← painel administrativo
        AdminLoginPage              ← login JWT (rota pública)
        AdminLayout                 ← sidebar + guard
        AdminDashboardPage          ← listagem de produtos
        AdminProductFormPage        ← CRUD de produto
        AdminCategoriesPage         ← CRUD de categorias
        AdminContentPage            ← editor de conteúdo por página
        AdminHeroSlidesPage         ← lista/reordena slides do hero
        AdminSlideBuilderPage       ← builder de slide com camadas (drag, resize, animação)
  public/images/                    ← logos, hero, fotos de produtos
  server/                           ← backend Node.js
    src/
      app.js, server.js
      db/                           ← pool pg + scripts de migrate/seed
      middleware/requireAuth.js     ← verifica JWT Bearer
      routes/
        auth, products, categories, contact,
        content, hero-slides,
        admin-products, admin-categories,
        admin-content, admin-hero-slides,
        upload, psd-import
      email/mailer.js + templates/
      utils/normalizeLayers.js      ← compat retroativa de hero_slides.layers
    migrations/
      003_cms.sql                   ← page_content + hero_slides
      004_slide_builder.sql         ← layers JSONB + transition seed
      005_drop_animado.sql          ← drop coluna animado (animação por camada)
    .env.example                    ← variáveis necessárias
  vite.config.js                    ← proxy /api → localhost:3001
  tailwind.config.js
  docs/superpowers/                 ← specs e planos de implementação
```

## Rodando localmente

### Pré-requisitos
- Node.js 20 LTS
- PostgreSQL 16

### Frontend

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build de produção em dist/
npm run preview      # preview do build em http://localhost:4173
```

Em dev, `/api/*` é proxy para `http://localhost:3001` (configurado em `vite.config.js`).

### Backend

```bash
cd server
npm install
cp .env.example .env  # editar variáveis (veja abaixo)
npm run migrate       # aplica migrations 001 e 002 (categorias + produtos)
node migrations/run.js 003_cms.sql
node migrations/run.js 004_slide_builder.sql
node migrations/run.js 005_drop_animado.sql
npm run seed          # popula categorias e produtos iniciais
npm run dev           # http://localhost:3001
```

### Variáveis de ambiente (`server/.env`)

```
DATABASE_URL=postgresql://user:pass@localhost:5432/sobral
JWT_SECRET=string-aleatoria-longa
ADMIN_EMAIL=admin@laboratoriosobral.com.br
ADMIN_PASSWORD=senha-forte
SMTP_HOST=...
SMTP_PORT=465
SMTP_USER=...
SMTP_PASS=...
CONTACT_TO=marketing@laboratoriosobral.com.br
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Painel administrativo

- Login: `/admin/login` (credenciais via `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- Token JWT expira em 8 horas, guardado em `localStorage`

Funcionalidades:
- **Produtos** — CRUD completo + upload de imagem
- **Categorias** — listar, criar, deletar
- **Conteúdo (CMS)** — editor TipTap (rich-text) por página (home, sobre, contato)
- **Hero Slides** — gerenciar slides do carrossel da home (DnD para reordenar)
- **Slide Builder** — editor visual com N camadas arbitrárias por slide:
  - Importar PSD → camadas extraídas automaticamente
  - Drag para mover, 8 handles para redimensionar
  - Reordenar (z-index), renomear, alternar visibilidade
  - Converter camada image ↔ button
  - Animações por camada (fade, slide-up, slide-left, slide-right) + delay
  - Pré-visualização com replay

## API

REST em `/api/*`. Rotas públicas (sem auth):

- `GET /api/products`, `GET /api/products/:id`
- `GET /api/categories`
- `GET /api/content/:page`
- `GET /api/hero-slides`
- `POST /api/contact` (envia e-mail via SMTP)

Rotas admin (`Authorization: Bearer <jwt>`):

- `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/upload` (multer)
- `POST /api/admin/psd-import`
- CRUD em `/api/admin/products`, `/api/admin/categories`
- `GET/PUT /api/admin/content/:page/:key`
- CRUD + reorder em `/api/admin/hero-slides`

## Convenções

- **Commits:** Conventional Commits em pt-BR (`feat:`, `fix:`, `chore:`, `style:`, `refactor:`, `docs:`)
- **Branch:** `main` (único — sempre push direto após cada alteração)
- **Idioma da UI:** pt-BR
- **Não commitar:** `.claude/settings*.json`, `server/.env`
- **Skills relevantes** para contribuidores: ver `.agnostic-core/skills/` (HTML/CSS, accessibility, UX, CSS governance, performance, SEO, debugging, validação)

## Documentação interna

Specs e planos de implementação dos sub-projetos em `docs/superpowers/`:

- `2026-04-22-frontend-migration-design` — migração do protótipo HTML para Vite + React + Tailwind
- `2026-04-22-backend-node-design` — backend Node.js + Express + Postgres
- `2026-04-30-cms-hero-carousel-design` — CMS de páginas + carrossel hero
- `2026-05-04-slide-builder-design` — slide builder v1 (logo + CTA fixos)
- `2026-05-04-psd-import-design` — importação de PSD
- `2026-05-04-n-layers-slide-builder` — slide builder v2 (N camadas arbitrárias)

## Status

- ✅ Frontend migrado para Vite + React + Tailwind
- ✅ Backend Node.js + Express + Postgres
- ✅ Painel admin (produtos, categorias, conteúdo, hero slides)
- ✅ Importação de PSD
- ✅ Slide Builder v2 (N camadas arbitrárias)
- ⏳ Testes automatizados — não configurado
- ⏳ CI/CD — não configurado
- ⏳ Deploy — a definir
