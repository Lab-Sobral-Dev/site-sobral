# Frontend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o protótipo do Laboratório Sobral (React UMD + Babel + CSS puro) para Vite 5 + React 18 + Tailwind CSS v3 + React Router v6, mantendo design pixel-perfect.

**Architecture:** App SPA com `createBrowserRouter`. Componentes em `src/components/`, páginas em `src/pages/`, dados em `src/data/catalog.js`. CSS via Tailwind classes no JSX + `@layer components` em `index.css` para padrões complexos. CSS variables no `:root` para troca de tema em runtime pelo painel Tweaks.

**Tech Stack:** Vite 5, React 18, React Router v6, Tailwind CSS v3, JavaScript, Google Fonts

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `index.html` | Criar — entry point Vite com Google Fonts |
| `vite.config.js` | Criar — config padrão Vite + React |
| `tailwind.config.js` | Criar — tokens de cor, fonte, sombra, radius |
| `src/index.css` | Criar — @tailwind + CSS variables + @layer components |
| `src/main.jsx` | Criar — entry React com RouterProvider |
| `src/App.jsx` | Criar — rotas + Tweaks panel |
| `src/data/catalog.js` | Criar — CATALOG e CATEGORIES como ES modules |
| `src/components/Breadcrumb.jsx` | Criar |
| `src/components/ProductCard.jsx` | Criar |
| `src/components/Header.jsx` | Criar — sem link para medicamentos |
| `src/components/Footer.jsx` | Criar — sem link para medicamentos |
| `src/pages/HomePage.jsx` | Criar |
| `src/pages/QuemSomosPage.jsx` | Criar |
| `src/pages/ProdutosPage.jsx` | Criar |
| `src/pages/ProdutoPage.jsx` | Criar — usa `useParams` + lookup no catalog |
| `src/pages/FaleConoscoPage.jsx` | Criar — formulário mock com validação |
| `src/pages/PrivacidadePage.jsx` | Criar |
| `public/images/` | Copiar de `project/images/` |
| `package.json` | Criar via npm create vite |

---

## Task 1: Scaffold do projeto Vite

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`

- [ ] **Step 1: Criar o projeto Vite dentro da pasta existente**

```bash
cd C:/Users/Hian/Documents/Projetos/site-sobral
npm create vite@latest . -- --template react
```
Quando perguntado sobre arquivos existentes, selecionar "Ignore files and continue".

- [ ] **Step 2: Instalar dependências base**

```bash
npm install
npm install react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Limpar arquivos padrão do template Vite**

Deletar:
- `src/App.css`
- `src/assets/react.svg`
- `public/vite.svg`
- Conteúdo de `src/App.jsx` (será reescrito)
- Conteúdo de `src/main.jsx` (será reescrito)
- Conteúdo de `src/index.css` (será reescrito)

- [ ] **Step 4: Copiar assets de imagens**

```bash
cp -r project/images/* public/images/
```
Se a pasta `public/images/` não existir: `mkdir -p public/images && cp -r project/images/* public/images/`

- [ ] **Step 5: Verificar estrutura**

```bash
ls public/images/
ls public/images/produtos/
```
Esperado: logo.png, hero-banner.png, fachada.png, brand-*.png, e pasta produtos/ com todas as imagens.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js index.html public/images/
git commit -m "chore: scaffold Vite + React, instalar React Router e Tailwind, copiar assets"
git push origin main
```

---

## Task 2: Tailwind config + index.css + index.html

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/index.css`
- Modify: `index.html`

- [ ] **Step 1: Configurar tailwind.config.js com tokens do projeto**

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        orange:         'var(--orange)',
        'orange-dark':  'var(--orange-dark)',
        'orange-light': 'var(--orange-light)',
        'orange-50':    'var(--orange-50)',
        ink:            '#3D3D3D',
        'ink-light':    '#6B6B6B',
        muted:          '#9A9A9A',
        line:           '#E5E5E5',
        bg:             '#F5F5F5',
      },
      borderRadius: {
        sm:  '8px',
        DEFAULT: '14px',
        lg:  '22px',
      },
      boxShadow: {
        sm:      '0 1px 2px rgba(0,0,0,.04), 0 2px 6px rgba(0,0,0,.04)',
        DEFAULT: '0 4px 14px rgba(0,0,0,.06)',
      },
      fontFamily: {
        sans: ['Nunito', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        content: '1180px',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Escrever src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* CSS Variables — usadas pelo Tweaks panel em runtime */
:root {
  --orange:       #F37021;
  --orange-dark:  #E0580A;
  --orange-light: #F89B4D;
  --orange-50:    #FFF4EB;
}

@layer base {
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Nunito', 'Segoe UI', system-ui, sans-serif;
    background: #F5F5F5;
    color: #3D3D3D;
    font-size: 15px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  img { max-width: 100%; display: block; }
  button { font-family: inherit; cursor: pointer; }
  a { color: inherit; text-decoration: none; }
  h1, h2, h3 { color: #3D3D3D; margin: 0; }
}

@layer components {
  /* Nav dropdown */
  .nav-dropdown {
    @apply absolute top-full -left-3 min-w-[200px] bg-white rounded-sm shadow-[0_6px_24px_rgba(0,0,0,.12)] py-2 opacity-0 invisible -translate-y-1 transition-all duration-[180ms] z-[100];
  }
  .nav-item.open .nav-dropdown {
    @apply opacity-100 visible translate-y-0.5;
  }
  .nav-item .caret {
    width: 0; height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 5px solid var(--orange);
    transition: transform .2s;
  }
  .nav-item.open .caret { transform: rotate(180deg); }

  /* Accordion */
  .accordion-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height .3s ease;
  }
  .accordion-item.open .accordion-content { max-height: 400px; }
  .accordion-item.open .arrow { transform: rotate(180deg); }

  /* Hero pseudo-elements (não expressáveis em Tailwind) */
  .hero-right-panel::before {
    content: '';
    position: absolute;
    left: -80px; top: 0; bottom: 0;
    width: 160px;
    background: white;
    border-radius: 50% 0 0 50% / 100% 0 0 100%;
    z-index: 0;
  }
  .hero-right-panel::after {
    content: '';
    position: absolute;
    left: -40px; right: -40px; top: 0; bottom: 0;
    background: white;
    border-radius: 200px 20px 20px 200px;
    z-index: 0;
  }

  /* Tweaks panel */
  .tweaks-panel {
    @apply fixed bottom-5 right-5 w-[280px] bg-white rounded shadow-[0_8px_32px_rgba(0,0,0,.18)] p-4 z-[9999] text-[13px];
  }

  /* Card variants via data-card-style */
  body[data-card-style="filled"] .btn-outline {
    background: var(--orange) !important;
    color: white !important;
    border-color: var(--orange) !important;
  }
  body[data-card-style="minimal"] .btn-outline {
    border: none !important;
    background: transparent !important;
    color: var(--orange) !important;
    text-decoration: underline;
  }

  /* Hero variants */
  body[data-hero-variant="bold"] .hero-section {
    background: linear-gradient(180deg, #F89B4D 0%, #E0580A 100%);
  }
  body[data-hero-variant="bold"] .hero-right-panel::before,
  body[data-hero-variant="bold"] .hero-right-panel::after { display: none; }
  body[data-hero-variant="clean"] .hero-section {
    background: white;
    color: #3D3D3D;
  }
  body[data-hero-variant="clean"] .hero-right-panel::before,
  body[data-hero-variant="clean"] .hero-right-panel::after { display: none; }

  /* Fade-in animation */
  @keyframes fadeIn {
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in {
    opacity: 0;
    transform: translateY(20px);
    animation: fadeIn .7s ease forwards;
  }
}
```

- [ ] **Step 3: Atualizar index.html com Google Fonts e meta tags**

```html
<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/images/logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Laboratório Sobral — há mais de 100 anos cuidando da saúde das famílias brasileiras." />
    <title>Laboratório Sobral</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Pacifico&family=DM+Sans:wght@400;500;700;800&family=Source+Serif+4:wght@400;600;800&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js src/index.css index.html
git commit -m "style: configurar Tailwind com tokens do projeto e index.css base"
git push origin main
```

---

## Task 3: Dados do catálogo

**Files:**
- Create: `src/data/catalog.js`

- [ ] **Step 1: Criar src/data/catalog.js como ES module**

```js
// src/data/catalog.js
export const CATEGORIES = [
  { id: 'all',          label: 'Todos'        },
  { id: 'suplementos',  label: 'Suplementos'  },
  { id: 'tradicionais', label: 'Tradicionais' },
  { id: 'oleos',        label: 'Óleos'        },
  { id: 'cosmeticos',   label: 'Cosméticos'   },
  { id: 'infantil',     label: 'Infantil'     },
];

export const CATALOG = [
  // Linha Calciolax
  { id: 'calciolax-articule', name: 'Calciolax Articule', tag: 'Cálcio + Vitamina D + Colágeno tipo II', category: 'suplementos', brand: 'Calciolax', image: '/images/produtos/calciolax-articule.png', description: 'Suplemento alimentar com cálcio, vitamina D e colágeno tipo II para mobilidade articular e saúde óssea.' },
  { id: 'calciolax-b12', name: 'Calciolax B12', tag: 'Cálcio + Vitamina B12 240ml', category: 'suplementos', brand: 'Calciolax', image: '/images/produtos/calciolax-b12.png', description: 'Solução oral de cálcio enriquecida com vitamina B12, auxilia no metabolismo energético e saúde óssea.' },
  { id: 'calciolax-d3', name: 'Calciolax D3', tag: 'Cálcio + Vitamina D3 240ml', category: 'suplementos', brand: 'Calciolax', image: '/images/produtos/calciolax-d3.png', description: 'Suplemento de cálcio com vitamina D3 para absorção otimizada.' },
  { id: 'calciolax-fixa', name: 'Calciolax Fixa', tag: 'Cálcio de alta absorção', category: 'suplementos', brand: 'Calciolax', image: '/images/produtos/calciolax-fixa.png', description: 'Fórmula exclusiva de cálcio com alta biodisponibilidade para reposição diária.' },
  { id: 'calciolax-kids', name: 'Calciolax Kids', tag: 'Cálcio + Vitamina D3 sabor morango', category: 'infantil', brand: 'Calciolax', image: '/images/produtos/calciolax-kids.png', description: 'Suplemento infantil de cálcio e vitamina D3 em sabor agradável, para o crescimento saudável.' },
  // Tradicionais
  { id: 'aqualema', name: 'Aqualemã Sobral', tag: 'Vitamina C + Magnésio 200ml', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/aqualema-200.png', description: 'Fonte de vitamina C e magnésio, auxiliando o sistema imune, o metabolismo de proteínas, carboidratos e gorduras, além do bom funcionamento muscular.' },
  { id: 'amargofig', name: 'Amargofig', tag: 'Colina + B6 + B12', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/amargofig.png', description: 'Solução com colina, vitamina B6 e B12 que auxilia no metabolismo de gorduras e no funcionamento do sistema nervoso.' },
  { id: 'inglesa-quina', name: 'Inglesa Quina Sobral', tag: 'Tônico fortificante 430ml', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/inglesa-quina.png', description: 'Tônico tradicional à base de quina, fortificante natural que auxilia no apetite e disposição.' },
  { id: 'magnesia', name: 'Magnésia Sobral', tag: 'Tradicional 300ml', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/magnesia.png', description: 'Solução oral tradicional para auxiliar no trato digestivo. Clássico do Laboratório Sobral.' },
  { id: 'magnesia-hortela', name: 'Magnésia Sobral Hortelã', tag: 'Sabor hortelã 100ml', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/magnesia-hortela.png', description: 'Magnésia Sobral com sabor refrescante de hortelã para auxiliar na digestão.' },
  { id: 'soralyt', name: 'Soralyt Tradicional', tag: 'Solução de reidratação oral', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/soralyt.png', description: 'Solução de reidratação oral para repor eletrólitos em casos de desidratação leve.' },
  { id: 'soralyt-laranja', name: 'Soralyt Laranja', tag: 'Reidratação sabor laranja', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/soralyt-laranja.png', description: 'Solução de reidratação em sabor laranja, para consumo mais agradável.' },
  { id: 'soralyt-uva', name: 'Soralyt Uva', tag: 'Reidratação sabor uva', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/soralyt-uva.png', description: 'Solução de reidratação em sabor uva.' },
  { id: 'soralyt-morango', name: 'Soralyt Morango', tag: 'Reidratação sabor morango', category: 'infantil', brand: 'Tradicionais', image: '/images/produtos/soralyt-morango.png', description: 'Solução de reidratação em sabor morango, ideal para crianças.' },
  { id: 'tintura-arnica', name: 'Tintura de Arnica', tag: 'Uso externo', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/tintura-arnica.png', description: 'Tintura tradicional de arnica para uso externo, auxiliar no alívio de dores musculares.' },
  { id: 'xaropvitan', name: 'Xaropvitan', tag: 'Xarope tradicional', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/xaropvitan.png', description: 'Xarope tradicional com vitaminas, auxiliar na dieta da família.' },
  { id: 'theogorico', name: 'Theogórico B6', tag: 'Vitamina B6 + Ativos', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/theogorico.png', description: 'Solução tradicional à base de vitamina B6, fortificante clássico.' },
  { id: 'laxdose', name: 'Laxdose Fibras', tag: 'Fibras alimentares', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/laxdose.png', description: 'Suplemento de fibras alimentares para o bom funcionamento intestinal.' },
  { id: 'laxdose-kids', name: 'Laxdose Kids', tag: 'Fibras para crianças', category: 'infantil', brand: 'Tradicionais', image: '/images/produtos/laxdose-kids.png', description: 'Suplemento de fibras em versão infantil, sabor agradável.' },
  { id: 'manafibras', name: 'Manáfibras', tag: 'Fonte de fibras naturais', category: 'suplementos', brand: 'Tradicionais', image: '/images/produtos/manafibras.jpeg', description: 'Suplemento natural à base de fibras solúveis para auxílio intestinal.' },
  // Movimex + Saludoz
  { id: 'movimex', name: 'Movimex 60 comp', tag: 'Mobilidade articular', category: 'suplementos', brand: 'Movimex', image: '/images/produtos/movimex-60.png', description: 'Suplemento alimentar para mobilidade e conforto articular, com ação em longa duração.' },
  { id: 'movimex-30', name: 'Movimex 30 comp', tag: 'Mobilidade articular', category: 'suplementos', brand: 'Movimex', image: '/images/produtos/movimex-30.png', description: 'Versão com 30 comprimidos do suplemento Movimex.' },
  { id: 'saludoz', name: 'Saludoz Ômega AZ', tag: 'Vitaminas de A a Z + Ômega 3', category: 'suplementos', brand: 'Saludoz', image: '/images/produtos/saludoz.png', description: 'Polivitamínico completo com vitaminas de A a Z enriquecido com ômega 3 em cápsulas.' },
  // Vitaminas
  { id: 'vitamina-d', name: 'Vitamina D Sobral', tag: '20ml em gotas', category: 'suplementos', brand: 'Sobral', image: '/images/produtos/vitamina-d.png', description: 'Vitamina D em gotas, de fácil administração, para toda a família.' },
  { id: 'vitamina-d-7m', name: 'Vitamina D 7 Meses', tag: 'Para bebês a partir de 7 meses', category: 'infantil', brand: 'Sobral', image: '/images/produtos/vitamina-d-7m.png', description: 'Vitamina D em gotas formulada para bebês a partir de 7 meses de idade.' },
  // Própolis
  { id: 'propolis-verde', name: 'Extrato de Própolis Verde', tag: 'Fonte de compostos fenólicos', category: 'suplementos', brand: 'Sobral', image: '/images/produtos/propolis-verde.png', description: 'Extrato concentrado de própolis verde brasileira, fonte de flavonoides e compostos fenólicos.' },
  { id: 'propzinco', name: 'PropZinco', tag: 'Própolis + Zinco 100ml', category: 'suplementos', brand: 'PropZinco', image: '/images/produtos/propzinco-frasco.png', description: 'Solução oral de própolis enriquecida com zinco, aliado do sistema imune.' },
  { id: 'propzinco-spray', name: 'PropZinco Spray', tag: 'Spray 30ml', category: 'suplementos', brand: 'PropZinco', image: '/images/produtos/propzinco-spray.png', description: 'Spray de própolis com zinco para uso prático no dia a dia.' },
  { id: 'propzinco-menta', name: 'PropZinco Menta', tag: 'Spray sabor menta', category: 'suplementos', brand: 'PropZinco', image: '/images/produtos/propzinco-menta.png', description: 'Spray de própolis sabor menta refrescante.' },
  { id: 'propzinco-roma', name: 'PropZinco Romã', tag: 'Spray sabor romã', category: 'suplementos', brand: 'PropZinco', image: '/images/produtos/propzinco-roma.png', description: 'Spray de própolis sabor romã.' },
  { id: 'propzinco-gengibre', name: 'PropZinco Gengibre', tag: 'Spray sabor gengibre', category: 'suplementos', brand: 'PropZinco', image: '/images/produtos/propzinco-gengibre.png', description: 'Spray de própolis sabor gengibre, ideal para a garganta.' },
  // Cosmético
  { id: 'glicerina', name: 'Glicerina Sobral', tag: '100% glicerina', category: 'cosmeticos', brand: 'Sobral', image: '/images/produtos/glicerina.png', description: 'Glicerina pura para múltiplos usos, tradição do Laboratório Sobral.' },
  // Óleos
  { id: 'oleo-girassol-age', name: 'Óleo de Girassol AGE', tag: '100ml — uso adulto e infantil', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-girassol-age.png', description: 'Óleo de girassol enriquecido com AGE, hidratação e cuidado da pele.' },
  { id: 'rosa-mosqueta-spray', name: 'Óleo de Rosa Mosqueta Spray', tag: 'Aplicação em spray', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/rosa-mosqueta-spray.jpg', description: 'Óleo de rosa mosqueta em spray para cuidado da pele, fácil aplicação.' },
  { id: 'rosa-mosqueta-gotas', name: 'Óleo de Rosa Mosqueta Gotas', tag: 'Conta-gotas', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/rosa-mosqueta-gotas.jpg', description: 'Óleo de rosa mosqueta em conta-gotas, aplicação precisa.' },
  { id: 'oleo-coco', name: 'Óleo de Coco', tag: '50ml — 100% natural', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-coco.png', description: 'Óleo de coco puro e natural para cabelos e pele.' },
  { id: 'oleo-argan', name: 'Óleo de Argan', tag: '50ml — puro e natural', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-argan.png', description: 'Óleo de argan 100% puro, nutrição profunda para cabelos.' },
  { id: 'oleo-abacate', name: 'Óleo de Abacate', tag: '50ml — cabelos e pele', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-abacate.png', description: 'Óleo de abacate nutritivo para cabelos e pele.' },
  { id: 'oleo-amendoas', name: 'Óleo de Amêndoas Doce', tag: '30ml — hidratação', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-amendoas.png', description: 'Óleo de amêndoas doce, hidratação suave para pele sensível.' },
  { id: 'oleo-babosa', name: 'Óleo de Babosa', tag: '50ml', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-babosa.png', description: 'Óleo de babosa para cuidado dos fios e hidratação.' },
  { id: 'oleo-ricino', name: 'Óleo de Rícino', tag: '50ml', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-ricino.png', description: 'Óleo de rícino tradicional, cuidado dos cabelos e cílios.' },
  { id: 'oleo-copaiba', name: 'Óleo de Copaíba', tag: '30ml', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-copaiba.png', description: 'Óleo de copaíba para uso cosmético.' },
  { id: 'oleo-alecrim', name: 'Óleo de Alecrim', tag: '50ml', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-alecrim.png', description: 'Óleo de alecrim, aliado dos cuidados capilares.' },
  { id: 'oleo-karite', name: 'Óleo de Karité Preto', tag: '50ml', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-karite.png', description: 'Óleo de karité preto, nutrição intensa para pele e cabelos.' },
  { id: 'oleo-uva', name: 'Óleo de Semente de Uva', tag: '50ml', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-uva.png', description: 'Óleo de semente de uva, rico em antioxidantes naturais.' },
  { id: 'oleo-girassol', name: 'Óleo de Girassol', tag: '50ml', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-girassol.png', description: 'Óleo de girassol puro, múltiplos usos cosméticos.' },
];
```

- [ ] **Step 2: Criar pasta src/data/**

```bash
mkdir -p src/data src/components src/pages
```

- [ ] **Step 3: Commit**

```bash
git add src/data/catalog.js src/components src/pages
git commit -m "feat: adicionar catalog.js como ES module"
git push origin main
```

---

## Task 4: Componente Breadcrumb

**Files:**
- Create: `src/components/Breadcrumb.jsx`

- [ ] **Step 1: Criar Breadcrumb.jsx**

```jsx
// src/components/Breadcrumb.jsx
import { Link } from 'react-router-dom';

export default function Breadcrumb({ trail }) {
  return (
    <div className="bg-orange text-white px-10 py-2.5 text-[13px] font-semibold">
      <div className="max-w-content mx-auto flex items-center gap-0">
        {trail.map((item, i) => (
          <span key={i} className="flex items-center">
            {item.to
              ? <Link to={item.to} className="opacity-90 hover:opacity-100 hover:underline">{item.label}</Link>
              : <span>{item.label}</span>}
            {i < trail.length - 1 && <span className="mx-2 opacity-70">&gt;</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Breadcrumb.jsx
git commit -m "feat: componente Breadcrumb"
git push origin main
```

---

## Task 5: Componente ProductCard

**Files:**
- Create: `src/components/ProductCard.jsx`

- [ ] **Step 1: Criar ProductCard.jsx**

```jsx
// src/components/ProductCard.jsx
export default function ProductCard({ product, onClick }) {
  return (
    <div
      className="bg-white rounded p-[18px_18px_22px] flex flex-col items-center transition-[transform,box-shadow] duration-[220ms] hover:-translate-y-1 hover:shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="w-full aspect-square bg-[#EAEAEA] rounded-sm flex items-center justify-center mb-4 overflow-hidden">
        {product.image
          ? <img src={product.image} alt={product.name} className="max-w-[82%] max-h-[88%] object-contain" />
          : <span className="text-[11px] text-muted font-mono text-center p-3 leading-snug">[ foto: {product.name} ]</span>
        }
      </div>
      <div className="font-[800] text-[15px] text-ink mb-1 text-center">{product.name}</div>
      <div className="text-[12.5px] text-ink-light text-center mb-[14px] min-h-[36px]">{product.tag}</div>
      <button
        className="btn-outline inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-orange bg-white text-orange font-bold text-[14px] transition-colors hover:bg-orange-50"
        onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      >
        Saber Mais
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProductCard.jsx
git commit -m "feat: componente ProductCard"
git push origin main
```

---

## Task 6: Componente Header

**Files:**
- Create: `src/components/Header.jsx`

- [ ] **Step 1: Criar Header.jsx**

```jsx
// src/components/Header.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CATALOG } from '../data/catalog';

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"/>
      <line x1="21" y1="21" x2="16.5" y2="16.5"/>
    </svg>
  );
}

function NavDropdown({ id, label, items, open, onToggle, onNavigate }) {
  return (
    <div
      className={`nav-item relative font-bold text-[15px] text-ink px-0 py-2.5 flex items-center gap-1.5 cursor-pointer select-none transition-colors hover:text-orange ${open ? 'open text-orange' : ''}`}
      onClick={(e) => { e.stopPropagation(); onToggle(id); }}
    >
      {label}
      <span className="caret" />
      <div className="nav-dropdown">
        {items.map((it) => (
          <a
            key={it.label}
            className="block px-4 py-2 text-[14px] font-semibold text-ink-light transition-all hover:bg-orange-50 hover:text-orange cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onNavigate(it.to); onToggle(null); }}
          >
            {it.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest('.nav-item')) setOpenDropdown(null);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/produtos?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  const isFaleConosco = location.pathname === '/fale-conosco';

  return (
    <>
      <div className="h-[6px] bg-gradient-to-r from-[#FFB46B] via-orange to-[#FFB46B]" />
      <header className="bg-white px-10 py-[14px] flex items-center gap-10 shadow-sm sticky top-0 z-50">
        <div
          className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden cursor-pointer"
          onClick={() => navigate('/')}
          title="Laboratório Sobral"
        >
          <img src="/images/logo.png" alt="Laboratório Sobral" width={56} height={56} className="w-full h-full object-cover rounded-full" />
        </div>

        <nav className="flex gap-7 items-center flex-1">
          <NavDropdown
            id="sobral" label="O Sobral" open={openDropdown === 'sobral'}
            onToggle={setOpenDropdown} onNavigate={navigate}
            items={[
              { label: 'Quem Somos', to: '/quem-somos' },
              { label: 'Nossa História', to: '/quem-somos' },
              { label: 'Trabalhe Conosco', to: '/fale-conosco' },
            ]}
          />
          <NavDropdown
            id="produtos" label="Produtos" open={openDropdown === 'produtos'}
            onToggle={setOpenDropdown} onNavigate={navigate}
            items={[
              { label: 'Todos os produtos', to: '/produtos' },
              { label: 'Suplementos', to: '/produtos?cat=suplementos' },
              { label: 'Tradicionais', to: '/produtos?cat=tradicionais' },
              { label: 'Cosméticos', to: '/produtos?cat=cosmeticos' },
            ]}
          />
          <NavDropdown
            id="vendidos" label="Mais Vendidos" open={openDropdown === 'vendidos'}
            onToggle={setOpenDropdown} onNavigate={navigate}
            items={[
              { label: 'Aqualemã Sobral', to: '/produtos/aqualema' },
              { label: 'Calciolax Articule', to: '/produtos/calciolax-articule' },
              { label: 'Saludoz Ômega AZ', to: '/produtos/saludoz' },
              { label: 'Extrato de Própolis Verde', to: '/produtos/propolis-verde' },
            ]}
          />
          <div
            className={`font-bold text-[15px] py-2.5 cursor-pointer transition-colors hover:text-orange ${isFaleConosco ? 'text-orange' : 'text-ink'}`}
            onClick={() => navigate('/fale-conosco')}
          >
            Fale Conosco
          </div>
        </nav>

        <div className="relative w-[260px]">
          <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Pesquisar produto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full py-[9px] pl-[38px] pr-4 rounded-full border border-line bg-white text-[13px] text-ink outline-none transition-[border-color,box-shadow] focus:border-orange focus:shadow-[0_0_0_3px_rgba(243,112,33,.12)] placeholder:text-muted"
          />
        </div>
      </header>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.jsx
git commit -m "feat: componente Header com React Router"
git push origin main
```

---

## Task 7: Componente Footer

**Files:**
- Create: `src/components/Footer.jsx`

- [ ] **Step 1: Criar Footer.jsx**

```jsx
// src/components/Footer.jsx
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-[60px] bg-gradient-to-br from-[#F89B4D] via-[#E85A0C] to-[#F89B4D] text-white pt-12 px-10 pb-0">
      <div className="max-w-content mx-auto grid grid-cols-[1.2fr_1fr_1.2fr_1fr] gap-10">
        <div>
          <div className="w-[72px] h-[72px] rounded-full border-2 border-white overflow-hidden mb-[14px]">
            <img src="/images/logo.png" alt="Laboratório Sobral" className="w-full h-full object-cover" />
          </div>
          <div className="text-[13.5px] leading-relaxed font-semibold">
            Rua Bento Leão,<br />
            25, Centro,<br />
            Floriano–PI.
          </div>
        </div>

        <div>
          <h4 className="text-[16px] font-[800] mb-[14px] tracking-[.3px]">Redes sociais</h4>
          <ul className="list-none p-0 m-0 space-y-1.5">
            {['Facebook', 'Instagram', 'Youtube', 'LinkedIn', 'Tiktok'].map(s => (
              <li key={s} className="text-[14px] font-semibold opacity-95"><a href="#" className="hover:underline">{s}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-[16px] font-[800] mb-[14px] tracking-[.3px]">Institucional</h4>
          <ul className="list-none p-0 m-0 space-y-1.5">
            <li className="text-[14px] font-semibold opacity-95"><Link to="/" className="hover:underline">Home</Link></li>
            <li className="text-[14px] font-semibold opacity-95"><Link to="/quem-somos" className="hover:underline">Quem Somos</Link></li>
            <li className="text-[14px] font-semibold opacity-95"><Link to="/privacidade" className="hover:underline">Privacidade e Proteção de Dados</Link></li>
            <li className="text-[14px] font-semibold opacity-95"><Link to="/fale-conosco" className="hover:underline">Fale Conosco</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[16px] font-[800] mb-[14px] tracking-[.3px]">Links Rápidos</h4>
          <ul className="list-none p-0 m-0 space-y-1.5">
            <li className="text-[14px] font-semibold opacity-95"><Link to="/fale-conosco" className="hover:underline">Trabalhe Conosco</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-10 border-t border-white/20 py-4 text-center text-[13px] font-semibold">
        Copyright © 2025 Laboratório Sobral. Todos os direitos reservados |
        <Link to="/privacidade" className="underline mx-1"> Política de Privacidade </Link>|
        <Link to="/privacidade" className="underline mx-1"> Política de Cookies </Link>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.jsx
git commit -m "feat: componente Footer com React Router (sem link medicamentos)"
git push origin main
```

---

## Task 8: App.jsx + main.jsx (Router + Tweaks)

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Escrever src/main.jsx**

```jsx
// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 2: Escrever src/App.jsx com rotas + Tweaks**

```jsx
// src/App.jsx
import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, ScrollRestoration } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import QuemSomosPage from './pages/QuemSomosPage';
import ProdutosPage from './pages/ProdutosPage';
import ProdutoPage from './pages/ProdutoPage';
import FaleConoscoPage from './pages/FaleConoscoPage';
import PrivacidadePage from './pages/PrivacidadePage';

const DEFAULTS = {
  theme: 'orange-classic',
  typography: 'nunito',
  productCardStyle: 'pill-outline',
  heroVariant: 'split',
};

function Tweaks() {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState(DEFAULTS);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === '__activate_edit_mode') setVisible(true);
      if (e.data?.type === '__deactivate_edit_mode') setVisible(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (config.theme === 'orange-classic') {
      root.style.setProperty('--orange', '#F37021');
      root.style.setProperty('--orange-dark', '#E0580A');
      root.style.setProperty('--orange-light', '#F89B4D');
      root.style.setProperty('--orange-50', '#FFF4EB');
    } else if (config.theme === 'deep-clinical') {
      root.style.setProperty('--orange', '#0E6DAA');
      root.style.setProperty('--orange-dark', '#084E80');
      root.style.setProperty('--orange-light', '#3E9AD2');
      root.style.setProperty('--orange-50', '#EBF4FA');
    } else if (config.theme === 'nature-green') {
      root.style.setProperty('--orange', '#2E8540');
      root.style.setProperty('--orange-dark', '#1F5E2C');
      root.style.setProperty('--orange-light', '#5AAE6B');
      root.style.setProperty('--orange-50', '#EBF5ED');
    }
    if (config.typography === 'nunito') document.body.style.fontFamily = "'Nunito', system-ui, sans-serif";
    else if (config.typography === 'serif') document.body.style.fontFamily = "'Source Serif 4', Georgia, serif";
    else if (config.typography === 'dm-sans') document.body.style.fontFamily = "'DM Sans', system-ui, sans-serif";
    document.body.dataset.cardStyle = config.productCardStyle;
    document.body.dataset.heroVariant = config.heroVariant;
  }, [config]);

  const set = (key, val) => {
    const next = { ...config, [key]: val };
    setConfig(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
  };

  if (!visible) return null;

  return (
    <div className="tweaks-panel">
      <h5 className="m-0 mb-3 text-[13px] font-[800] text-orange tracking-[.5px] uppercase">Tweaks</h5>
      {[
        { label: 'Paleta', key: 'theme', options: [['orange-classic','Laranja clássico'],['deep-clinical','Azul clínico'],['nature-green','Verde natural']] },
        { label: 'Tipografia', key: 'typography', options: [['nunito','Nunito'],['dm-sans','DM Sans'],['serif','Serifada']] },
        { label: 'Card produto', key: 'productCardStyle', options: [['pill-outline','Pílula laranja'],['filled','Botão sólido'],['minimal','Minimalista']] },
        { label: 'Hero', key: 'heroVariant', options: [['split','Split laranja'],['bold','Gradiente amplo'],['clean','Clean']] },
      ].map(row => (
        <div key={row.key} className="flex justify-between items-center py-2 border-b border-line gap-2.5 last:border-0">
          <label className="font-semibold text-ink-light">{row.label}</label>
          <select
            value={config[row.key]}
            onChange={(e) => set(row.key, e.target.value)}
            className="border border-line rounded-[6px] px-2 py-1 text-[12px] font-sans bg-white"
          >
            {row.options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

function Layout() {
  return (
    <>
      <ScrollRestoration />
      <Header />
      <main><Outlet /></main>
      <Footer />
      <Tweaks />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true,              element: <HomePage /> },
      { path: 'quem-somos',      element: <QuemSomosPage /> },
      { path: 'produtos',        element: <ProdutosPage /> },
      { path: 'produtos/:id',    element: <ProdutoPage /> },
      { path: 'fale-conosco',    element: <FaleConoscoPage /> },
      { path: 'privacidade',     element: <PrivacidadePage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/main.jsx src/App.jsx
git commit -m "feat: App.jsx com React Router createBrowserRouter e painel Tweaks"
git push origin main
```

---

## Task 9: Página Home

**Files:**
- Create: `src/pages/HomePage.jsx`

- [ ] **Step 1: Criar HomePage.jsx**

```jsx
// src/pages/HomePage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATALOG } from '../data/catalog';
import ProductCard from '../components/ProductCard';

const FEATURED_IDS = ['aqualema','calciolax-articule','saludoz','propolis-verde','movimex','calciolax-kids','rosa-mosqueta-spray','propzinco'];

const BRANDS = [
  { img: '/images/brand-tradicionais.png', label: 'Linha Tradicionais' },
  { img: '/images/brand-calciolax.png',    label: 'Família Calciolax'  },
  { img: '/images/brand-movimex.png',      label: 'Movimex'            },
  { img: '/images/brand-oleos.png',        label: 'Óleos Sobral'       },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [carouselIdx, setCarouselIdx] = useState(0);

  const featured = CATALOG.filter(p => FEATURED_IDS.includes(p.id));
  const visible = featured.slice(carouselIdx, carouselIdx + 4);

  return (
    <>
      {/* HERO */}
      <section className="w-full bg-bg leading-[0]">
        <img src="/images/hero-banner.png" alt="Laboratório Sobral — há mais de 100 anos cuidando da saúde das famílias brasileiras" className="w-full h-auto block" />
      </section>

      {/* NOSSAS LINHAS */}
      <section className="max-w-content mx-auto px-10 mt-[60px]">
        <h2 className="text-[28px] font-[800] text-center my-10">Nossas Linhas</h2>
        <div className="grid grid-cols-4 gap-5 max-w-[960px] mx-auto">
          {BRANDS.map((b, i) => (
            <div
              key={i}
              className="bg-white rounded p-5 flex flex-col items-center justify-between gap-3 cursor-pointer shadow-sm h-[220px] transition-[transform,box-shadow] duration-[220ms] hover:-translate-y-1 hover:shadow"
              onClick={() => navigate('/produtos')}
            >
              <div className="flex-1 w-full flex items-center justify-center min-h-0">
                <img src={b.img} alt={b.label} className="max-w-full max-h-full w-auto h-auto object-contain block" />
              </div>
              <div className="font-[800] text-[13.5px] text-ink text-center flex-shrink-0">{b.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MAIS VENDIDOS */}
      <section className="max-w-content mx-auto px-10 mt-[70px]">
        <h2 className="text-[28px] font-[800] text-center my-10">Produtos mais vendidos</h2>
        <div className="relative">
          <button
            className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-none bg-white shadow text-orange flex items-center justify-center text-[22px] z-[5] transition-all hover:bg-orange hover:text-white disabled:opacity-30"
            onClick={() => setCarouselIdx(Math.max(0, carouselIdx - 1))}
            disabled={carouselIdx === 0}
          >‹</button>
          <div className="grid grid-cols-4 gap-[18px] px-5">
            {visible.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => navigate(`/produtos/${p.id}`)} />
            ))}
          </div>
          <button
            className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-none bg-white shadow text-orange flex items-center justify-center text-[22px] z-[5] transition-all hover:bg-orange hover:text-white disabled:opacity-30"
            onClick={() => setCarouselIdx(Math.min(featured.length - 4, carouselIdx + 1))}
            disabled={carouselIdx >= featured.length - 4}
          >›</button>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section className="max-w-content mx-auto px-10 mt-[80px] mb-0">
        <div className="grid grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <div className="mt-12 mb-6">
              <h2 className="text-[36px] font-[800] leading-[1.15] mb-2.5">
                Conheça a história do
                <span className="text-orange block">Laboratório Sobral</span>
              </h2>
              <div className="h-[2px] bg-gradient-to-r from-orange to-transparent mt-2.5" />
            </div>
            <p className="text-[15.5px] leading-[1.7] text-ink-light mb-7">
              Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos brasileiros.
              Estamos nas casas das famílias levando mais saúde e proporcionando leveza e
              bem-estar ao dia a dia. Mais que uma indústria, somos um símbolo da luta do
              povo brasileiro. Essa é nossa essência e isso nunca vai mudar.
            </p>
            <button
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border-none font-bold text-[14px] tracking-[.3px] text-white bg-gradient-to-b from-[#F89B4D] to-[#E85A0C] shadow-[0_2px_8px_rgba(232,90,12,.3)] transition-all hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(232,90,12,.42)]"
              onClick={() => navigate('/quem-somos')}
            >
              VEJA MAIS
            </button>
          </div>
          <div className="aspect-[4/3] rounded overflow-hidden shadow">
            <img src="/images/fachada.png" alt="Fachada do Laboratório Sobral" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/HomePage.jsx
git commit -m "feat: página Home com hero, linhas, carrossel e seção história"
git push origin main
```

---

## Task 10: Página Quem Somos

**Files:**
- Create: `src/pages/QuemSomosPage.jsx`

- [ ] **Step 1: Criar QuemSomosPage.jsx**

```jsx
// src/pages/QuemSomosPage.jsx
export default function QuemSomosPage() {
  return (
    <>
      <div className="bg-gradient-to-b from-orange to-[#E85A0C] text-white text-center py-[22px] px-5 text-[26px] font-[800] tracking-[.3px]">
        Quem Somos
      </div>

      <section className="max-w-content mx-auto px-10 mt-10">
        <div className="bg-gradient-to-br from-[#F89B4D] via-orange to-[#E0580A] rounded-lg p-[32px_28px] text-white grid grid-cols-[1fr_1px_1fr_1px_1fr] gap-6 shadow-[0_4px_18px_rgba(232,90,12,.22)]">
          {[
            { title: 'Missão', text: 'Contribuir com a saúde e a qualidade de vida das famílias brasileiras.' },
            { divider: true },
            { title: 'Visão', text: 'Continuar a expansão do negócio, tornando-se referência nos segmentos de suplementos alimentares e cosméticos.' },
            { divider: true },
            { title: 'Valores', text: 'Compromisso, qualidade, respeito, entusiasmo, credibilidade, perseverança e orgulho nordestino.' },
          ].map((item, i) =>
            item.divider
              ? <div key={i} className="bg-white/40 w-px" />
              : (
                <div key={i} className="text-center px-2.5">
                  <h3 className="text-white text-[22px] font-[800] mb-2 tracking-[.3px]">{item.title}</h3>
                  <p className="text-[14.5px] leading-[1.55] m-0 font-semibold opacity-[.96]">{item.text}</p>
                </div>
              )
          )}
        </div>
      </section>

      <section className="max-w-content mx-auto px-10 mt-[60px] pb-16">
        <div className="grid grid-cols-[1.35fr_1fr] gap-14 items-start">
          <div>
            <div className="mt-12 mb-9">
              <h2 className="text-[36px] font-[800] leading-[1.15] mb-2.5">
                Da cura à prevenção:
                <span className="text-orange block">Uma tradição centenária que sempre se renova!</span>
              </h2>
              <div className="h-[2px] bg-gradient-to-r from-orange to-transparent mt-2.5" />
            </div>
            <p className="text-[15px] leading-[1.7] text-ink-light mb-9">
              Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos brasileiros.
              Estamos nas casas das famílias levando mais saúde e proporcionando leveza e
              bem-estar ao dia a dia. Mais que uma indústria, somos um símbolo da luta do
              povo brasileiro. Essa é nossa essência e isso nunca vai mudar.
            </p>
            <h2 className="text-[30px] font-[800] mb-[18px]">Um pouco de história...</h2>
            <p className="text-[15px] leading-[1.7] text-ink-light mb-[18px]">
              A história do Laboratório Sobral começou a ser contada em 1911, com a abertura
              de uma botica na cidade de Amarante – Piauí, a Pharmacia Sobral. Em 1919 foi
              transferida pra Floriano, e aqui fixada. Em 1925 foi para sede própria onde está até hoje.
            </p>
            <p className="text-[15px] leading-[1.7] text-ink-light mb-[18px]">
              Ao longo dos anos o pequeno negócio cresceu e, além da Pharmacia, que
              comercializava produtos próprios e de outras marcas, a botica transformou-se em
              um laboratório e pequena (e artesanal) indústria de medicamentos.
            </p>
            <p className="text-[15px] leading-[1.7] text-ink-light">
              Até que, em 1973, sob a gestão do economista e empreendedor Teodoro Ferreira
              Sobral Neto, a fábrica passou a ser continuamente ampliada e modernizada até
              chegar aos dias de hoje, em que é uma referência no cuidado da saúde dos brasileiros.
            </p>
          </div>

          <div className="flex flex-col gap-6 pt-[60px]">
            <div className="aspect-[4/5] bg-[#DCDCDC] rounded-[18px_18px_28px_28px] relative overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,.1)] -rotate-1">
              <img src="/images/fachada.png" alt="Fachada do Laboratório Sobral" className="absolute inset-0 w-full h-full object-cover z-[2]" />
            </div>
            <div className="aspect-[4/3.6] bg-[#DCDCDC] rounded-[18px_18px_28px_28px] relative overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,.1)] rotate-[1.2deg]">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#D1D1D1_0_10px,#DCDCDC_10px_20px)]" />
              <div className="absolute inset-0 flex items-center justify-center text-[11px] text-[#999] font-mono text-center p-3 leading-snug">[ foto histórica: linha de produção ]</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/QuemSomosPage.jsx
git commit -m "feat: página Quem Somos com MVV e história"
git push origin main
```

---

## Task 11: Página Produtos

**Files:**
- Create: `src/pages/ProdutosPage.jsx`

- [ ] **Step 1: Criar ProdutosPage.jsx**

```jsx
// src/pages/ProdutosPage.jsx
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CATALOG, CATEGORIES } from '../data/catalog';
import ProductCard from '../components/ProductCard';

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>
    </svg>
  );
}

const PER_PAGE = 12;

export default function ProdutosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);

  const cat = searchParams.get('cat') || 'all';
  const query = searchParams.get('q') || '';

  const setCat = (val) => {
    const p = new URLSearchParams(searchParams);
    if (val === 'all') p.delete('cat'); else p.set('cat', val);
    p.delete('q');
    setSearchParams(p);
  };

  const setQuery = (val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set('q', val); else p.delete('q');
    setSearchParams(p);
  };

  useEffect(() => { setPage(1); }, [cat, query]);

  const filtered = useMemo(() => {
    let list = CATALOG;
    if (cat !== 'all') list = list.filter(p => p.category === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [cat, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <div className="bg-gradient-to-b from-orange to-[#E85A0C] text-white text-center py-[22px] px-5 text-[26px] font-[800] tracking-[.3px]">
        Produtos
      </div>

      <section className="max-w-content mx-auto px-10 mt-9 pb-16">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#F89B4D] via-orange to-[#E0580A] rounded flex items-center justify-between gap-6 p-[32px_40px] mb-8 shadow-[0_4px_18px_rgba(232,90,12,.2)]">
          <div>
            <h2 className="text-[30px] font-[800] text-white mb-1.5">Todo o catálogo Sobral</h2>
            <p className="text-[15px] opacity-95 m-0 max-w-[520px] text-white">
              Suplementos, tradicionais, óleos e cosméticos — toda nossa linha em um só lugar.
            </p>
          </div>
          <img src="/images/logo.png" alt="" className="w-[110px] h-[110px] rounded-full" />
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center gap-5 mb-2.5 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className={`px-[18px] py-2 rounded-full border text-[13px] font-bold transition-all ${cat === c.id ? 'bg-orange border-orange text-white' : 'bg-white border-line text-ink-light hover:border-orange hover:text-orange'}`}
                onClick={() => setCat(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="relative w-[240px]">
            <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-muted"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Buscar produto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full py-[9px] pl-[38px] pr-4 rounded-full border border-line bg-white text-[13px] outline-none focus:border-orange focus:shadow-[0_0_0_3px_rgba(243,112,33,.12)]"
            />
          </div>
        </div>

        <div className="text-[13px] text-ink-light mb-[18px]">
          {filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
        </div>

        {pageItems.length === 0 ? (
          <div className="py-[60px] text-center text-muted text-[15px]">Nenhum produto encontrado com estes filtros.</div>
        ) : (
          <div className="grid grid-cols-4 gap-5">
            {pageItems.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => navigate(`/produtos/${p.id}`)} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-9">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={`w-8 h-8 rounded-[6px] border text-[13px] font-bold transition-all ${page === n ? 'bg-orange border-orange text-white' : 'bg-white border-line text-ink-light hover:border-orange hover:text-orange'}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ProdutosPage.jsx
git commit -m "feat: página Produtos com filtro por categoria, busca e paginação"
git push origin main
```

---

## Task 12: Página Produto (detalhe)

**Files:**
- Create: `src/pages/ProdutoPage.jsx`

- [ ] **Step 1: Criar ProdutoPage.jsx**

```jsx
// src/pages/ProdutoPage.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CATALOG } from '../data/catalog';
import Breadcrumb from '../components/Breadcrumb';

export default function ProdutoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [openAccordion, setOpenAccordion] = useState('caracteristicas');
  const [variant, setVariant] = useState(0);

  const p = CATALOG.find(x => x.id === id) || CATALOG[0];

  const accordionData = [
    { id: 'caracteristicas', title: 'Características do produto', content: p.caracteristicas?.join(' ') || p.description },
    { id: 'apresentacao',    title: 'Apresentação',               content: p.apresentacao || '—' },
    { id: 'modouso',         title: 'Modo de Uso',                content: p.modoUso || '—' },
    { id: 'precaucoes',      title: 'Precauções',                 content: p.precaucoes || '—' },
  ];

  return (
    <>
      <Breadcrumb trail={[
        { label: '🏠 Home', to: '/' },
        { label: 'Produtos', to: '/produtos' },
        { label: p.name },
      ]} />

      <section className="max-w-content mx-auto px-10 mt-11">
        <div className="grid grid-cols-[1fr_1.1fr] gap-16 items-start">
          {/* Galeria */}
          <div>
            <div className="aspect-square bg-white border border-line rounded flex items-center justify-center relative overflow-hidden p-[30px]">
              {p.image
                ? <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" />
                : <span className="text-[11px] text-muted font-mono text-center">[ foto: {p.name} ]</span>
              }
            </div>
            <div className="flex gap-[14px] mt-[18px] justify-center">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  onClick={() => setVariant(i)}
                  className={`w-[72px] h-[72px] bg-white rounded-[8px] flex items-center justify-center cursor-pointer p-1.5 ${variant === i ? 'border-2 border-orange' : 'border border-line'}`}
                >
                  {p.image
                    ? <img src={p.image} alt="" className="max-w-full max-h-full object-contain" />
                    : <span className="text-[10px] text-[#bbb] font-mono">angle {i + 1}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <h1 className="text-[36px] font-bold mb-[14px] text-ink-light">{p.name}</h1>
            <p className="text-[15px] leading-[1.6] text-ink-light mb-7">{p.description}</p>

            <div className="accordion">
              {accordionData.map(item => (
                <div key={item.id} className={`accordion-item border-b border-line ${openAccordion === item.id ? 'open' : ''}`}>
                  <button
                    className="flex justify-between items-center w-full py-[14px] bg-transparent border-none text-left font-bold text-[15px] text-ink"
                    onClick={() => setOpenAccordion(openAccordion === item.id ? null : item.id)}
                  >
                    {item.title}
                    <span className="arrow text-orange transition-transform duration-200 text-[18px]">▾</span>
                  </button>
                  <div className="accordion-content">
                    <div className="pb-4 text-[14px] text-ink-light leading-[1.6]">{item.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ingredientes + Nutricional */}
      <section className="bg-gradient-to-b from-[#C5D11E] to-[#A8B410] text-white mt-[60px] py-12 px-10">
        <div className="max-w-content mx-auto grid grid-cols-2 gap-12">
          <div>
            <h2 className="text-[26px] font-[800] text-center mb-[22px] text-white">Ingredientes</h2>
            <p className="text-[13.5px] leading-[1.65] mb-[18px]">{p.ingredientes || 'Informações não disponíveis.'}</p>
            {p.disclaimer && <p className="text-[13.5px] leading-[1.65] font-bold">{p.disclaimer}</p>}
          </div>
          {p.nutri && (
            <div className="border-l border-white/30 pl-12">
              <h2 className="text-[26px] font-[800] text-center mb-[22px] text-white">Informação nutricional</h2>
              <pre className="font-sans text-[13.5px] m-0 whitespace-pre-wrap mb-[14px]">{p.nutri.porcoes}</pre>
              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr className="border-b border-white/40">
                    <th></th>
                    <th className="text-right py-1.5 font-bold">15 ml</th>
                    <th className="text-right py-1.5 font-bold">%VD*</th>
                  </tr>
                </thead>
                <tbody>
                  {p.nutri.rows.map((r, i) => (
                    <tr key={i} className="border-b border-white/20">
                      <td className="py-2">{r[0]}</td>
                      <td className="text-right">{r[1]}</td>
                      <td className="text-right">{r[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[12px] mt-[14px] leading-[1.55]">
                Não contém quantidades significativas de açúcares totais, açúcares adicionados, proteínas, gorduras totais, gorduras saturadas, gorduras trans, fibras alimentares e sódio.
              </p>
              <p className="text-[11px] mt-2.5 italic">*Percentual de valores diários fornecidos pela porção.</p>
            </div>
          )}
          {!p.nutri && (
            <div className="border-l border-white/30 pl-12 flex items-center justify-center text-white/70 text-[14px]">
              Informações nutricionais não disponíveis para este produto.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ProdutoPage.jsx
git commit -m "feat: página Produto com useParams, accordion e seção nutricional"
git push origin main
```

---

## Task 13: Página Fale Conosco

**Files:**
- Create: `src/pages/FaleConoscoPage.jsx`

- [ ] **Step 1: Criar FaleConoscoPage.jsx**

```jsx
// src/pages/FaleConoscoPage.jsx
import { useState } from 'react';
import Breadcrumb from '../components/Breadcrumb';

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const EMPTY_FORM = { nome: '', sobrenome: '', email: '', celular: '', endereco: '', estado: '', assunto: '', mensagem: '' };

export default function FaleConoscoPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const required = ['nome', 'sobrenome', 'email', 'celular', 'assunto', 'mensagem'];
    const newErrors = {};
    required.forEach(f => { if (!form[f].trim()) newErrors[f] = true; });
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = true;
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }
    setSent(true);
    setTimeout(() => { setForm(EMPTY_FORM); setSent(false); }, 3000);
  };

  const inputClass = (field) =>
    `w-full py-[14px] px-[18px] rounded-full border bg-white font-sans text-[14px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted ${
      errors[field]
        ? 'border-[#E04444] shadow-[0_0_0_3px_rgba(224,68,68,.12)]'
        : 'border-line focus:border-orange focus:shadow-[0_0_0_3px_rgba(243,112,33,.12)]'
    }`;

  return (
    <>
      <Breadcrumb trail={[{ label: '🏠 Home', to: '/' }, { label: 'Fale Conosco' }]} />

      <section className="max-w-content mx-auto px-10 mt-10 pb-16">
        <div className="grid grid-cols-[1.4fr_1fr] gap-12 mb-12">
          <div>
            <h2 className="text-[22px] font-[800] text-orange mb-[18px]">LABORATÓRIO SOBRAL</h2>
            <div className="mb-[22px] text-[14.5px] leading-[1.6]">
              <div className="font-[800] mb-1">Unidade Fabril</div>
              <div>Rua Bento Leão, 25, Centro</div>
              <div>Floriano | PI | CEP 64800-062.</div>
              <div>Telefone: (89) 2101-2202</div>
            </div>
            <div className="text-[14.5px] leading-[1.6]">
              <div className="font-[800] mb-1">Escritório Comercial</div>
              <div>Avenida Elias João Tajra, 1601, Fátima</div>
              <div>Teresina | PI | CEP 64049-300</div>
              <div>Telefone: (89) 99921-0283</div>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 items-start">
            <div className="bg-white rounded-[14px] py-[14px] px-[22px] w-full max-w-[360px] shadow-sm border border-line">
              <div className="bg-gradient-to-b from-[#F89B4D] to-[#E0580A] text-white font-[800] text-[14px] tracking-[.5px] py-2 px-[18px] rounded-full inline-block mb-1">MARKETING</div>
              <div className="text-[14px] text-ink-light mt-1">(89) 99999-9999</div>
              <div className="text-[14px] text-ink-light">marketing@laboratoriosobral.com.br</div>
            </div>
            <div className="bg-white rounded-[14px] py-[14px] px-[22px] w-full max-w-[360px] shadow-sm border border-line">
              <div className="bg-gradient-to-b from-[#F89B4D] to-[#E0580A] text-white font-[800] text-[14px] tracking-[.5px] py-2 px-[18px] rounded-full inline-block mb-1">ATENDIMENTO</div>
              <div className="text-[14px] text-ink-light mt-1">(89) 99999-9999</div>
            </div>
            <div className="mt-2.5 text-[18px] font-[800] text-orange">SAC 0800 979 5040</div>
          </div>
        </div>

        <h2 className="text-[22px] font-[800] text-orange mb-[18px]">Fale Conosco</h2>

        {sent && (
          <div className="py-[14px] px-5 mb-[18px] bg-[#E8F5E8] text-[#2D6A2D] rounded font-bold text-[14px]">
            ✓ Mensagem enviada com sucesso! Retornaremos em breve.
          </div>
        )}

        <form
          className="grid grid-cols-2 gap-[14px] bg-[#EEEEEE] p-7 rounded"
          onSubmit={handleSubmit}
        >
          <input placeholder="Nome*" className={inputClass('nome')} value={form.nome} onChange={handleChange('nome')} />
          <input placeholder="Sobrenome*" className={inputClass('sobrenome')} value={form.sobrenome} onChange={handleChange('sobrenome')} />
          <input placeholder="E-mail*" type="email" className={inputClass('email')} value={form.email} onChange={handleChange('email')} />
          <input placeholder="Celular*" className={inputClass('celular')} value={form.celular} onChange={handleChange('celular')} />
          <input placeholder="Endereço" className={inputClass('endereco')} value={form.endereco} onChange={handleChange('endereco')} />
          <select
            className={inputClass('estado').replace('rounded-full', 'rounded-full appearance-none')}
            value={form.estado} onChange={handleChange('estado')}
          >
            <option value="">Estado</option>
            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
          <div className="col-span-2">
            <input placeholder="Assunto*" className={inputClass('assunto')} value={form.assunto} onChange={handleChange('assunto')} />
          </div>
          <div className="col-span-2">
            <textarea
              placeholder="Mensagem*"
              className={`w-full py-[14px] px-[18px] rounded-[18px] border bg-white font-sans text-[14px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted min-h-[140px] resize-y ${
                errors.mensagem
                  ? 'border-[#E04444] shadow-[0_0_0_3px_rgba(224,68,68,.12)]'
                  : 'border-line focus:border-orange focus:shadow-[0_0_0_3px_rgba(243,112,33,.12)]'
              }`}
              value={form.mensagem}
              onChange={handleChange('mensagem')}
            />
          </div>
          <div className="col-span-2 flex justify-end mt-1">
            <button
              type="submit"
              className="inline-flex items-center justify-center px-9 py-3 rounded-full border-none font-bold text-[14px] tracking-[.3px] text-white bg-gradient-to-b from-[#F89B4D] to-[#E85A0C] shadow-[0_2px_8px_rgba(232,90,12,.3)] transition-all hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(232,90,12,.42)]"
            >
              ENVIAR
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/FaleConoscoPage.jsx
git commit -m "feat: página Fale Conosco com formulário e validação"
git push origin main
```

---

## Task 14: Página Privacidade

**Files:**
- Create: `src/pages/PrivacidadePage.jsx`

- [ ] **Step 1: Criar PrivacidadePage.jsx**

```jsx
// src/pages/PrivacidadePage.jsx
export default function PrivacidadePage() {
  return (
    <>
      <div className="bg-gradient-to-b from-orange to-[#E85A0C] text-white text-center py-[22px] px-5 text-[26px] font-[800] tracking-[.3px]">
        Privacidade e Proteção de Dados
      </div>

      <section className="max-w-[920px] mx-auto px-10 mt-10 pb-16">
        <h2 className="text-[26px] font-[800] text-ink text-center mb-[30px]">Política de Privacidade</h2>

        <div className="text-[14.5px] leading-[1.75] text-ink-light">
          <p className="mb-[18px]">
            A Política tem como prioridade a proteção dos dados pessoais, mantendo todos os aspectos devidos
            de segurança e privacidade. O comprometimento engloba, também, a transparência do processo de
            tratamento de dados pessoais dos stakeholders. Por isso, a presente Política de Privacidade
            estabelece como é feita a coleta, uso e transferência de informações de clientes e terceiros que
            acessam ou usam o site da organização.
          </p>
          <p className="mb-[18px]">
            Ao utilizar serviços da organização, as informações pessoais são coletadas e utilizadas nas formas
            descritas nesta Política, conforme as normas da{' '}
            <strong className="text-ink">Lei Geral de Proteção de Dados nº 13.709/2018</strong>,
            combinadas com as disposições consumeristas da{' '}
            <strong className="text-ink">Lei 8.078/1990</strong> e as demais normas do
            ordenamento jurídico brasileiro aplicáveis.
          </p>
          <p className="mb-6">No papel de Controladora de Dados, obriga-se ao disposto na presente Política de Privacidade.</p>

          <h3 className="text-[16px] font-[800] text-ink mb-2">1. Quais dados são coletados sobre você e para qual finalidade?</h3>
          <p className="mb-[14px]">
            O site da organização coleta e utiliza alguns dos seus dados pessoais, de forma a viabilizar a prestação
            de serviços e aprimorar a experiência de uso.
          </p>
          <p className="mb-2.5">Dados pessoais fornecidos pelo titular:</p>
          <ol className="pl-7 mb-6 list-[lower-alpha] space-y-1.5 text-[14.5px]">
            <li>Dados fornecidos pelos usuários (ex.: informações de contato, dados profissionais, informações financeiras ou técnicas);</li>
            <li>Dados de navegação (ex.: endereço IP, localização, país, tempo de navegação, tempo de acesso) ou dados que surjam de sua interação com o site;</li>
            <li>Cookies e sistemas de rastreamento da Internet;</li>
            <li>Informações sobre a convicção religiosa do usuário só são coletadas quando o cadastro é preenchido.</li>
          </ol>

          <h3 className="text-[16px] font-[800] text-ink mb-2">2. Consentimento</h3>
          <p className="mb-4">
            É a partir do seu consentimento que a organização pode tratar os seus dados pessoais. O
            consentimento é a manifestação livre e inequívoca pela qual você nos autoriza a tratar seus dados.
            Assim, em consonância com a Lei Geral de Proteção de Dados nº 13.709/18, seus dados só serão
            coletados, tratados e armazenados mediante prévio e expresso consentimento.
          </p>
          <p className="mb-4">
            O seu consentimento será obtido de forma específica para cada finalidade acima descrita,
            evidenciando o compromisso de transparência e boa-fé para com seus usuários/clientes, seguindo as
            regulações legislativas pertinentes.
          </p>
          <p>
            Ao utilizar os serviços e fornecer seus dados pessoais, você está ciente e consentindo com as
            disposições desta Política de Privacidade, além de conhecer seus direitos e como exercê-los.
            A qualquer tempo e sem nenhum custo, você poderá revogar seu consentimento.
          </p>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/PrivacidadePage.jsx
git commit -m "feat: página Privacidade e Proteção de Dados"
git push origin main
```

---

## Task 15: Build de verificação e ajustes finais

**Files:**
- Verify: build funciona sem erros

- [ ] **Step 1: Rodar dev server e verificar visualmente**

```bash
npm run dev
```
Abrir `http://localhost:5173` e verificar:
- [ ] Header com logo, nav e busca
- [ ] Home: hero banner, seção de linhas (4 cards), carrossel de produtos, seção história
- [ ] Navegação para `/quem-somos`: MVV card, texto, fotos
- [ ] Navegação para `/produtos`: banner, filtros por categoria, grid de produtos, paginação
- [ ] Clique em produto → `/produtos/calciolax-articule`: imagem, accordion, seção nutricional
- [ ] `/fale-conosco`: informações de contato + formulário + validação
- [ ] `/privacidade`: texto da política
- [ ] Footer em todas as páginas
- [ ] Botão voltar do browser funciona (React Router)
- [ ] Reload em `/produtos` não dá 404 (apenas em dev — em prod precisa do Nginx config)

- [ ] **Step 2: Rodar build de produção**

```bash
npm run build
```
Esperado: saída sem erros, pasta `dist/` gerada.

- [ ] **Step 3: Verificar build com preview**

```bash
npm run preview
```
Abrir `http://localhost:4173` e repetir verificação do Step 1.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "feat: site Laboratório Sobral migrado para Vite + React + Tailwind + React Router"
git push origin main
```
