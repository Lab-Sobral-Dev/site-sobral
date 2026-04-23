# Sub-projeto 1 — Migração Frontend
**Data:** 2026-04-22
**Status:** Aprovado — pronto para implementação

---

## Objetivo

Migrar o protótipo atual (React UMD + Babel Standalone + CSS puro) para uma stack de produção com Vite + React 18 + Tailwind CSS + React Router v6, mantendo design pixel-perfect em relação ao protótipo existente em `project/`.

---

## Stack

| Item | Tecnologia |
|---|---|
| Bundler | Vite 5 |
| UI | React 18 + JavaScript |
| Estilo | Tailwind CSS v3 com tokens customizados |
| Roteamento | React Router v6 (`createBrowserRouter`) |
| Fontes | Google Fonts via `index.html` (Nunito, DM Sans, Source Serif 4, Pacifico) |
| Deploy | VPS com Nginx (estáticos do `dist/`) |

---

## Estrutura de pastas

```
site-sobral/
  src/
    components/
      Header.jsx
      Footer.jsx
      ProductCard.jsx
      Breadcrumb.jsx
    pages/
      HomePage.jsx
      QuemSomosPage.jsx
      ProdutosPage.jsx
      ProdutoPage.jsx
      FaleConoscoPage.jsx
      PrivacidadePage.jsx
    data/
      catalog.js          ← ES module com CATALOG e CATEGORIES
    App.jsx               ← router + Tweaks panel
    main.jsx              ← entry point
    index.css             ← @tailwind directives + CSS variables
  public/
    images/               ← assets copiados de project/images/
  tailwind.config.js
  vite.config.js
  index.html
  docs/
    superpowers/
      specs/              ← este arquivo
  project/                ← protótipo original (referência, não usado em prod)
```

---

## Rotas

| URL | Componente |
|---|---|
| `/` | HomePage |
| `/quem-somos` | QuemSomosPage |
| `/produtos` | ProdutosPage |
| `/produtos/:id` | ProdutoPage |
| `/fale-conosco` | FaleConoscoPage |
| `/privacidade` | PrivacidadePage |

**Nota:** React Router usa `createBrowserRouter`. O Nginx precisa de `try_files $uri $uri/ /index.html` para evitar 404 em refresh.

A página de **Medicamentos foi removida** a pedido do cliente.

---

## Sistema de design (Tailwind config)

Tokens mapeados do protótipo atual:

```js
colors: {
  orange:          'var(--orange)',        // #F37021
  'orange-dark':   'var(--orange-dark)',   // #E0580A
  'orange-light':  'var(--orange-light)',  // #F89B4D
  'orange-50':     'var(--orange-50)',     // #FFF4EB
  ink:             '#3D3D3D',
  'ink-light':     '#6B6B6B',
  muted:           '#9A9A9A',
  line:            '#E5E5E5',
  bg:              '#F5F5F5',
}
borderRadius: { sm: '8px', DEFAULT: '14px', lg: '22px' }
boxShadow:    { sm: '0 1px 2px rgba(0,0,0,.04), 0 2px 6px rgba(0,0,0,.04)', DEFAULT: '0 4px 14px rgba(0,0,0,.06)' }
fontFamily:   { sans: ['Nunito', 'system-ui', 'sans-serif'] }
maxWidth:     { content: '1180px' }
```

As cores de tema (`--orange`, `--orange-dark`, `--orange-light`, `--orange-50`) ficam como CSS variables no `:root` para que o painel Tweaks continue funcionando em runtime.

---

## Componentes

### Header
- Logo + nav com dropdowns (Produtos, Institucional)
- Campo de busca de produtos
- Sticky no topo (z-50)

### Footer
- Links de navegação, redes sociais, endereço

### ProductCard
- Suporta variantes de estilo via `data-card-style` no body (pill-outline, filled, minimal)
- Props: `product`, `onClick`

### Breadcrumb
- Props: `trail` (array de `{ label, page }`), `onNavigate`

---

## Painel Tweaks

Permanece em `App.jsx`. Controla em runtime:
- **Tema:** orange-classic / deep-clinical / nature-green (troca as CSS variables)
- **Tipografia:** Nunito / DM Sans / Serifada
- **Card de produto:** pill-outline / filled / minimal
- **Hero variant:** split / bold / clean

Ativado via `postMessage` (`__activate_edit_mode`).

---

## Formulário de Contato

Mock funcional (validação + feedback visual de sucesso). Estrutura preparada para conectar à API Node.js no Sub-projeto 2.

---

## Build e deploy

```bash
npm run dev      # dev local com HMR em localhost:5173
npm run build    # gera dist/ com assets otimizados e hash
npm run preview  # preview local do build antes de subir para VPS
```

Nginx config mínima necessária:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## Fora de escopo (sub-projetos futuros)

### Sub-projeto 2 — Backend Node.js
- API REST com Express
- Banco de dados para produtos, textos e mensagens de contato
- Upload e gestão de imagens
- Envio real de e-mail via formulário de contato
- Autenticação JWT para o painel admin

### Sub-projeto 3 — Painel Administrativo
- App React para gerenciar conteúdo do site
- CRUD de produtos (nome, descrição, imagem, categoria)
- Edição de textos e imagens do site
- Visualização de mensagens do formulário de contato
- Login/logout do administrador

### Sub-projeto 4 — Deploy e Infraestrutura VPS
- Configuração completa do Nginx (reverse proxy + fallback SPA)
- PM2 para gerenciar processo Node.js
- SSL/HTTPS com Certbot (Let's Encrypt)
- Variáveis de ambiente de produção
- CI/CD via GitHub Actions
