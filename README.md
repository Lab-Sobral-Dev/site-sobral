# Laboratório Sobral — Site institucional

Site institucional e catálogo de produtos do Laboratório Sobral, com painel administrativo completo (CMS) para gerenciar produtos, categorias, conteúdo editorial, hero carousel, misturinhas e muito mais.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vite 6 + React 18 + Tailwind CSS 3 + React Router 6 |
| Backend | Node.js 20 LTS + Express 4 |
| Banco | PostgreSQL 16 — driver `pg`, SQL puro (sem ORM) |
| Auth | JWT HS256 em cookie httpOnly (8h) |
| E-mail | Nodemailer + SMTP |
| Deploy | Docker Compose + GitHub Actions → VPS via SSH |
| Fonte | Ubuntu (única fonte do projeto) |
| Idioma | pt-BR |

---

## Estrutura do projeto

```
site-sobral/
  src/                                  ← frontend React
    main.jsx                            ← entry point — envolve <App> com <AuthProvider>
    App.jsx                             ← React Router v6: rotas públicas + /admin/*
    context/AuthContext.jsx             ← estado de auth + email do usuário logado
    components/
      Header.jsx                        ← cabeçalho com nav, busca com autocomplete
      Footer.jsx                        ← rodapé com links e redes sociais
      Breadcrumb.jsx
      ProductCard.jsx
      HeroCarousel.jsx                  ← carrossel da home (slides via API)
      MobileDrawer.jsx                  ← menu mobile
      admin/
        RichTextEditor.jsx              ← editor TipTap (bold, italic, listas, H2)
        ConfirmModal.jsx                ← modal de confirmação reutilizável
        AdminMobileDrawer.jsx           ← menu mobile do painel admin
    hooks/
      usePageContent.js                 ← busca conteúdo editável da API com fallback
      useAdminFetch.js                  ← fetch autenticado (redireciona no 401)
      useDebounce.js
      useScrollReveal.js
    data/catalog.js                     ← fallback estático de produtos e categorias
    pages/
      HomePage.jsx
      QuemSomosPage.jsx
      ProdutosPage.jsx                  ← listagem com filtro por categoria
      ProdutoPage.jsx                   ← detalhe: galeria, acordeão, link misturinhas
      MisturinhasPage.jsx               ← receitas dos óleos (dados da API, deep link ?oleo=)
      FaleConoscoPage.jsx
      PrivacidadePage.jsx               ← política de privacidade e cookies (LGPD)
      admin/
        AdminLoginPage.jsx              ← login com mostrar/ocultar senha
        AdminLayout.jsx                 ← sidebar + guard de rota + email do usuário
        AdminDashboardPage.jsx          ← listagem com métricas, ordenação e paginação
        AdminProductFormPage.jsx        ← CRUD produto + galeria de imagens + rich text
        AdminCategoriesPage.jsx         ← CRUD categorias com edição inline e contador
        AdminContentPage.jsx            ← CMS por página com link "Ver página"
        AdminHeroSlidesPage.jsx         ← lista/reordena slides do hero
        AdminSlideBuilderPage.jsx       ← builder visual de slides (drag, resize, animações)
        AdminMisturinhasPage.jsx        ← CRUD de misturinhas (receitas dos óleos)
  public/images/                        ← logos, hero, fotos de produtos
  server/
    src/
      app.js                            ← Express: middlewares globais + mount das rotas
      server.js                         ← entry point (porta 3001)
      db/
        index.js                        ← pool pg via DATABASE_URL
        migrate.js                      ← aplica migrations pendentes em ordem
        seed.js                         ← seed inicial de produtos e categorias
        migrations/
          001_create_categories.sql
          002_create_products.sql
          003_cms.sql                   ← page_content + hero_slides
          004_slide_builder.sql         ← layers JSONB no hero
          005_drop_animado.sql
          006_indexes.sql
          007_destaque_produtos.sql
          008_update_categories.sql     ← 4 categorias: tradicionais/calciolax/movimex/oleos
          009_product_gallery.sql       ← coluna gallery JSONB em products
          010_misturinhas.sql           ← tabela misturinhas + seed das 10 receitas
      middleware/
        requireAuth.js                  ← verifica JWT no cookie
        validate.js                     ← validação de campos obrigatórios
      routes/
        auth.js                         ← POST /api/auth/login, GET /api/auth/me
        products.js                     ← GET /api/products, GET /api/products/:id
        categories.js                   ← GET /api/categories (inclui product_count)
        contact.js                      ← POST /api/contact (envia e-mail)
        content.js                      ← GET /api/content/:page
        hero-slides.js                  ← GET /api/hero-slides
        misturinhas.js                  ← GET /api/misturinhas (?categoria= ?oleo=)
        upload.js                       ← POST /api/upload (multer, requer auth)
        admin-products.js               ← CRUD + gallery + sort em /api/admin/products
        admin-categories.js             ← CRUD /api/admin/categories
        admin-content.js                ← GET+PUT /api/admin/content/:page/:key
        admin-hero-slides.js            ← CRUD+reorder /api/admin/hero-slides
        admin-misturinhas.js            ← CRUD+toggle /api/admin/misturinhas
        admin-stats.js                  ← GET /api/admin/stats (métricas do dashboard)
        psd-import.js                   ← POST /api/admin/psd-import
      email/mailer.js + templates/
      workers/psd-worker.js             ← parse de PSD em worker_thread
  .github/workflows/
    ci.yml                              ← build e lint no push para main
    deploy.yml                          ← deploy via SSH na VPS após CI passar
  vite.config.js                        ← proxy /api → localhost:3001 em dev
  tailwind.config.js
  Dockerfile
  docker-compose.yml
  docker-compose.dev.yml
```

---

## Rodando localmente

### Pré-requisitos
- Node.js 20 LTS
- PostgreSQL 16

### Frontend

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # build de produção em dist/
npm run preview   # preview do build em http://localhost:4173
```

Em dev, `/api/*` é proxy automático para `http://localhost:3001` (ver `vite.config.js`).

### Backend

```bash
cd server
npm install
cp .env.example .env   # preencher variáveis (ver seção abaixo)
npm run migrate        # aplica todas as migrations pendentes em ordem
npm run seed           # popula categorias e produtos iniciais (opcional)
npm run dev            # http://localhost:3001
```

### Variáveis de ambiente — `server/.env`

```env
# Banco de dados
DATABASE_URL=postgresql://user:pass@localhost:5432/sobral

# Auth
JWT_SECRET=string-aleatoria-longa
ADMIN_EMAIL=admin@laboratoriosobral.com.br
ADMIN_PASSWORD_HASH=$2a$10$...   # gerar: node -e "require('bcryptjs').hash('suasenha',10).then(console.log)"

# PostgreSQL (usado pelo Docker Compose)
POSTGRES_USER=sobral
POSTGRES_PASSWORD=sobral_pass
POSTGRES_DB=sobral

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

## Deploy

O deploy é **automático** via GitHub Actions:

1. Push para `main` → dispara o workflow **CI** (build + lint)
2. CI passa → dispara o workflow **Deploy** (SSH na VPS)
3. Na VPS: `git pull` → `docker compose up --build -d` → `node server/src/db/migrate.js`

**Deploy manual** (caso o automático falhe):

```bash
ssh suporte@<VPS_HOST>
cd /home/suporte/projetos/site-sobral
git pull origin main
docker compose up --build -d
docker compose exec -T app node server/src/db/migrate.js
```

**Verificar migrations aplicadas:**

```bash
docker compose exec -T app psql $DATABASE_URL \
  -c "SELECT filename, applied_at FROM schema_migrations ORDER BY applied_at;"
```

---

## Painel administrativo

Acesso: `/admin/login` — credenciais via `ADMIN_EMAIL` e `ADMIN_PASSWORD_HASH`
Token JWT expira em 8 horas (cookie httpOnly).

### Funcionalidades

| Seção | Funcionalidades |
|-------|----------------|
| **Produtos** | CRUD completo, upload de imagem principal, galeria de até 4 fotos, rich text (descrição, apresentação, modo de uso, precauções, ingredientes), toggle ativo/destaque |
| **Categorias** | Listar, criar, editar inline, deletar; contador de produtos por categoria |
| **Conteúdo (CMS)** | Editor TipTap por página: Home, Quem Somos, Fale Conosco |
| **Hero Slides** | Gerenciar slides do carrossel da home (DnD para reordenar, toggle ativo/inativo) |
| **Slide Builder** | Editor visual com N camadas por slide: importar PSD, drag/resize, animações por camada, preview |
| **Misturinhas** | CRUD de receitas dos óleos: título, categoria livre, aplicação, resultado, ingredientes dinâmicos |
| **Dashboard** | Métricas: total ativos/inativos, produtos por categoria, slides ativos; ordenação por coluna; paginação com contexto |

---

## API

### Rotas públicas

```
GET    /api/products                  lista produtos ativos (?q= ?cat= ?ids= ?destaque= ?page= ?per_page= ?sort= ?dir=)
GET    /api/products/:id              detalhe do produto
GET    /api/categories                lista categorias com product_count
GET    /api/content/:page             conteúdo CMS da página
GET    /api/hero-slides               slides ativos do carrossel
GET    /api/misturinhas               lista misturinhas ativas (?categoria= ?oleo=)
POST   /api/contact                   envia e-mail de contato
POST   /api/auth/login                autenticação admin
```

### Rotas admin (requerem cookie JWT válido)

```
GET    /api/auth/me
POST   /api/upload                    upload de imagem (multer)
POST   /api/admin/psd-import          importar PSD e extrair camadas

GET/POST        /api/admin/products
GET/PUT/DELETE  /api/admin/products/:id
PATCH           /api/admin/products/:id/ativo

GET/POST        /api/admin/categories
PUT/DELETE      /api/admin/categories/:id

GET/PUT         /api/admin/content/:page/:key

GET/POST        /api/admin/hero-slides
PUT/DELETE      /api/admin/hero-slides/:id
PATCH           /api/admin/hero-slides/:id/ativo
PUT             /api/admin/hero-slides/reorder

GET/POST        /api/admin/misturinhas
PUT/DELETE      /api/admin/misturinhas/:id
PATCH           /api/admin/misturinhas/:id/ativo

GET             /api/admin/stats
```

---

## Categorias de produtos

As 4 categorias ativas são: **Tradicionais**, **Calciolax**, **Movimex**, **Óleos**.  
A categoria `all` é virtual (usada como filtro "Todos") e não pode ser deletada.

---

## Misturinhas

Receitas dos Óleos Sobral gerenciadas pelo admin. Cada misturinha tem:
- Título, categoria (texto livre), como aplicar, resultado esperado
- Lista de ingredientes: produto (do catálogo) + quantidade

Na página pública `/misturinhas`, o parâmetro `?oleo=<product_id>` abre diretamente a primeira misturinha que contém aquele óleo. Produtos da categoria Óleos exibem um link para isso na aba "Modo de Uso".

---

## Convenções

- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `style:`, `refactor:`, `docs:`)
- **Branch:** `main` — único branch; sempre push direto após cada alteração
- **Idioma da UI:** pt-BR
- **Não commitar:** `.claude/settings*.json`, `server/.env`
- **CSS:** Tailwind CSS utility classes — sem CSS customizado global (exceto `src/index.css`)
- **Fonte:** Ubuntu — única fonte; pesos 300/400/500/700 carregados via Google Fonts

---

## Status

- ✅ Frontend React + Vite + Tailwind
- ✅ Backend Node.js + Express + PostgreSQL
- ✅ Painel admin completo (produtos, categorias, CMS, hero slides, misturinhas)
- ✅ Slide Builder v2 (N camadas, PSD import, animações)
- ✅ Busca com autocomplete no header
- ✅ Galeria de imagens por produto
- ✅ Misturinhas gerenciáveis pelo admin com deep link por óleo
- ✅ Deploy automático via GitHub Actions + Docker
- ⏳ Testes automatizados — não configurado
