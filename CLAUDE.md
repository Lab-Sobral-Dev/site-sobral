Laboratório Sobral — Site institucional / catálogo de produtos

Stack: React 18 + Vite + Tailwind CSS (frontend) | Node.js + Express + PostgreSQL (backend)
Submodulo: .agnostic-core/

---

REGRAS OBRIGATÓRIAS (seguir sempre):

1. Antes de qualquer alteração, consultar este CLAUDE.md e os skills relevantes do .agnostic-core/
2. Após toda alteração de código: git add → git commit (Conventional Commits) → git push origin main
3. Nunca commitar .claude/settings.json, .claude/settings.local.json ou server/.env
4. Idioma do projeto: pt-BR (textos da UI em português)

---

Arquitetura do projeto:

  site-sobral/
    src/                              ← frontend React
      main.jsx                        ← entry point; envolve <App> com <AuthProvider>
      App.jsx                         ← React Router v6: rotas públicas + /admin/*
      context/
        AuthContext.jsx               ← estado auth global; JWT em cookie httpOnly (localStorage guarda só flag/e-mail)
      components/
        Header.jsx                    ← cabeçalho público
        Footer.jsx                    ← rodapé público
        Breadcrumb.jsx                ← breadcrumb compartilhado
        ProductCard.jsx               ← card de produto
        HeroCarousel.jsx              ← carrossel do hero (busca slides via API)
        admin/
          RichTextEditor.jsx          ← editor TipTap (bold, italic, listas, H2)
          ConfirmModal.jsx            ← modal de confirmação reutilizável
          SessionExpiryModal.jsx      ← aviso de expiração de sessão (T-5min)
          HistoricoCampo.jsx          ← histórico + restaurar por campo do CMS
      hooks/
        usePageContent.js             ← busca conteúdo editável da API com fallback
        useAdminFetch.js              ← fetch autenticado + renovação silenciosa da sessão
        useUnsavedChanges.js          ← bloqueia saída com alterações não salvas
        useRascunho.js                ← rascunho local do formulário em localStorage
        useAtalhoSalvar.js            ← Ctrl+S / Cmd+S nos formulários
        useDebounce.js                ← debounce de busca
      data/
        catalog.js                    ← array estático de produtos (legado/seed local)
      pages/
        HomePage.jsx                  ← hero carrossel + nossas linhas + mais vendidos + história
        QuemSomosPage.jsx             ← missão, visão, valores, história
        ProdutosPage.jsx              ← listagem com filtro por categoria
        ProdutoPage.jsx               ← detalhe de produto
        FaleConoscoPage.jsx           ← formulário de contato + informações
        PrivacidadePage.jsx           ← política de privacidade
        admin/
          AdminLoginPage.jsx          ← login JWT (rota pública)
          AdminLayout.jsx             ← sidebar + guard de rota
          AdminDashboardPage.jsx      ← listagem de produtos (incl. inativos)
          AdminProductFormPage.jsx    ← criar / editar produto + upload de imagem
          AdminCategoriesPage.jsx     ← listar, criar, deletar categorias
          AdminContentPage.jsx        ← editor CMS por página (home/sobre/contato)
          AdminHeroSlidesPage.jsx     ← gerenciar slides do hero (DnD, upload, toggle)
          AdminSlideBuilderPage.jsx   ← editor de camadas do slide
          AdminMisturinhasPage.jsx    ← CRUD de misturinhas
          AdminHistoricoPage.jsx      ← histórico de alterações (audit_log)
          AdminUsuariosPage.jsx       ← gerenciar usuários (só papel admin)
          AdminContaPage.jsx          ← trocar a própria senha
    public/
      images/                         ← logos, hero, fotos de produtos
    server/                           ← backend Node.js
      src/
        app.js                        ← Express: middlewares globais + mount das rotas
        server.js                     ← entry point (porta 3001)
        db/
          index.js                    ← pool pg via DATABASE_URL
          migrate.js                  ← roda migrations pendentes + semeia admin
          seed.js                     ← seed inicial de produtos e categorias
          seed-admin.js               ← cria o 1º admin a partir do .env (idempotente)
        middleware/
          requireAuth.js              ← verifica JWT e resolve o usuário em admin_users
          requirePapel.js             ← exige papel (admin/editor) na rota
          validate.js                 ← validação de campos obrigatórios
        lib/
          audit.js                    ← registra alterações em audit_log (nunca lança)
        routes/
          auth.js                     ← POST /api/auth/login, /logout, /refresh; GET /api/auth/me
          products.js                 ← GET /api/products, GET /api/products/:id
          categories.js               ← GET /api/categories
          contact.js                  ← POST /api/contact (envia e-mail)
          content.js                  ← GET /api/content/:page
          hero-slides.js              ← GET /api/hero-slides
          upload.js                   ← POST /api/upload (multer, requer auth)
          admin-products.js           ← CRUD /api/admin/products (requer auth)
          admin-categories.js         ← CRUD /api/admin/categories (requer auth)
          admin-content.js            ← GET+PUT /api/admin/content/:page/:key (requer auth)
          admin-hero-slides.js        ← CRUD+reorder /api/admin/hero-slides (requer auth)
          admin-misturinhas.js        ← CRUD /api/admin/misturinhas (requer auth)
          admin-stats.js              ← GET /api/admin/stats (métricas do dashboard)
          admin-audit.js              ← GET /api/admin/audit + POST /:id/restore (só conteúdo)
          admin-users.js              ← CRUD /api/admin/users (papel admin) + PUT /me/senha
          misturinhas.js              ← GET /api/misturinhas (público)
          psd-import.js               ← POST /api/admin/psd-import (importa camadas de PSD)
          sitemap.js                  ← GET /sitemap.xml
        email/
          mailer.js                   ← Nodemailer SMTP
          templates/contact.js        ← template HTML do e-mail de contato
      src/db/migrations/
        001_create_categories.sql
        002_create_products.sql
        003_cms.sql                   ← tabelas page_content + hero_slides
        ...
        015_admin_users.sql           ← usuários do painel (papel admin/editor)
        016_audit_log.sql             ← histórico de alterações administrativas
      .env.example                    ← variáveis necessárias (nunca commitar .env)
    vite.config.js                    ← proxy /api → localhost:3001 em dev
    tailwind.config.js
    package.json                      ← deps frontend

Convenções do projeto:

  Frontend:    React 18.3.1 + Vite 6 + React Router v6
  CSS:         Tailwind CSS 3 (utility classes) — sem CSS customizado global
  Fontes:      via Google Fonts (Nunito padrão)
  Roteamento:  React Router v6 (BrowserRouter)
  Dados:       API REST em /api/* (backend); fallback estático em src/data/catalog.js
  Auth:        JWT HS256, expiração 8h renovável, cookie httpOnly+secure+sameSite:strict
               Usuários em admin_users; o .env só vale se não houver usuário ativo
  Auditoria:   Toda alteração administrativa grava em audit_log
               Restauração só vale para conteúdo de CMS (entidade 'content')
  Papéis:      admin (tudo + usuários) e editor (tudo menos usuários)
  Backend:     Node.js 20 LTS + Express 4
  Banco:       PostgreSQL 16, driver `pg` (raw SQL, sem ORM)
  E-mail:      Nodemailer + SMTP
  CMS:         Tabela `page_content` (chave-valor por página) + `hero_slides`
  Testes:      Jest + supertest no backend (cd server && npm test); CI roda migrations + testes
  CI/CD:       .github/workflows/ci.yml (migrations + jest) e deploy.yml
  Deploy:      Automático via GitHub Actions para a VPS (docker compose)
  Commits:     Conventional Commits (feat:, fix:, chore:, style:, refactor:, docs:)
  Branch:      main (único branch — sempre push para main)

Páginas removidas / fora do escopo:

  medicamentos  ← removida do site; arquivo MedicamentosPage.jsx pode ser deletado

---

Antes de implementar — skills obrigatórios por tipo de tarefa:

Frontend / UI:
  HTML e CSS:          .agnostic-core/skills/frontend/html-css-audit.md
  Acessibilidade:      .agnostic-core/skills/frontend/accessibility.md
  UX Guidelines:       .agnostic-core/skills/frontend/ux-guidelines.md
  CSS Governance:      .agnostic-core/skills/frontend/css-governance.md
  SEO:                 .agnostic-core/skills/frontend/seo-checklist.md
  Performance:         .agnostic-core/skills/performance/performance-audit.md
  Anti-Frankenstein:   .agnostic-core/skills/frontend/anti-frankenstein.md

Git / entrega:
  Commits:             .agnostic-core/skills/git/commit-conventions.md
  Debugging:           .agnostic-core/skills/audit/systematic-debugging.md
  Validação:           .agnostic-core/skills/audit/validation-checklist.md
  Revisão de texto:    .agnostic-core/skills/audit/revisao-texto-ptbr.md

Antes de deploy:
  .agnostic-core/skills/devops/pre-deploy-checklist.md
  .agnostic-core/skills/devops/deploy-procedures.md

---

Workflow padrão para cada alteração:

  1. Ler CLAUDE.md (este arquivo)
  2. Ler skill(s) relevante(s) do .agnostic-core/
  3. Implementar a mudança
  4. git add <arquivos>
  5. git commit -m "tipo: descrição curta"
  6. git push origin main
