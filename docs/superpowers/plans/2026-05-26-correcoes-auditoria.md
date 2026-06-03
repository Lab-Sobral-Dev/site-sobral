# Correções de Auditoria — Laboratório Sobral

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os 10 problemas priorizados da auditoria de 26/05/2026 sem introduzir breaking changes.

**Architecture:** Correções isoladas por arquivo/responsabilidade. Backend: Node/Express/PostgreSQL. Frontend: React 18 + Vite + Tailwind. Sem ORM. Sem framework de testes configurado — validação manual via curl e browser DevTools.

**Tech Stack:** React 18, React Router v6, Tailwind CSS 3, Vite 6, Node.js 20, Express 4, PostgreSQL 16 (driver `pg`), `react-helmet-async` (a instalar)

---

## Mapa de Arquivos

| Arquivo | Mudança | Tarefas |
|---------|---------|---------|
| `server/src/routes/products.js` | Clamp de página + filtro por `ids` | T1, T5 |
| `server/src/routes/admin-products.js` | Clamp de página | T1 |
| `server/src/routes/admin-categories.js` | Guard contra deleção de "all" | T2 |
| `src/hooks/useDebounce.js` | **Novo** — hook genérico de debounce | T3 |
| `src/pages/ProdutosPage.jsx` | Debounce na busca + lazy loading ProductCard | T3 |
| `src/pages/admin/AdminDashboardPage.jsx` | Debounce na busca | T3 |
| `src/pages/admin/AdminCategoriesPage.jsx` | Ocultar botão Deletar para id "all" | T2 |
| `src/hooks/usePageContent.js` | TTL de 5 min no cache | T4 |
| `src/pages/HomePage.jsx` | Buscar featured products via API | T5 |
| `src/pages/ProdutoPage.jsx` | Remover thumbnails falsos, lista características, "15ml" dinâmico | T6 |
| `src/components/ProductCard.jsx` | `loading="lazy"` nas imagens | T7 |
| `src/main.jsx` | Adicionar `<HelmetProvider>` | T8 |
| `src/pages/HomePage.jsx` | `<Helmet>` com metatags da home | T8 |
| `src/pages/ProdutosPage.jsx` | `<Helmet>` por categoria | T8 |
| `src/pages/ProdutoPage.jsx` | `<Helmet>` com nome e descrição do produto | T8 |
| `src/pages/QuemSomosPage.jsx` | `<Helmet>` | T8 |
| `src/pages/FaleConoscoPage.jsx` | `<Helmet>` | T8 |
| `src/pages/PrivacidadePage.jsx` | `<Helmet>` | T8 |

---

## Task 1: Clamp de página nas APIs de produtos (BUG-06)

**Arquivos:**
- Modify: `server/src/routes/products.js`
- Modify: `server/src/routes/admin-products.js`

- [ ] **1.1 — Corrigir `products.js` (rota pública)**

Em `server/src/routes/products.js`, no bloco `router.get('/', ...)`, substituir a linha do `res.json(...)` para clampar `page`:

```js
// ANTES (linha ~45):
res.json({
  data:       dataRes.rows,
  total,
  page,
  totalPages: Math.ceil(total / perPage),
});

// DEPOIS:
const totalPages = Math.ceil(total / perPage) || 1;
res.json({
  data:       dataRes.rows,
  total,
  page:       Math.min(page, totalPages),
  totalPages,
});
```

- [ ] **1.2 — Corrigir `admin-products.js` (rota admin)**

Em `server/src/routes/admin-products.js`, mesmo padrão no `router.get('/')`:

```js
// ANTES (linha ~46):
res.json({ data: dataRes.rows, total, page, totalPages: Math.ceil(total / perPage) });

// DEPOIS:
const totalPages = Math.ceil(total / perPage) || 1;
res.json({ data: dataRes.rows, total, page: Math.min(page, totalPages), totalPages });
```

- [ ] **1.3 — Verificar via curl**

```bash
curl -s "https://site.laboratoriosobral.com/api/products?page=999" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8');const j=JSON.parse(d);console.log('page:',j.page,'totalPages:',j.totalPages)"
```

Esperado: `page: 4 totalPages: 4` (ou qualquer valor ≤ totalPages).

- [ ] **1.4 — Commit**

```bash
git add server/src/routes/products.js server/src/routes/admin-products.js
git commit -m "fix(api): clampa número de página ao totalPages na resposta"
```

---

## Task 2: Proteger categoria "Todos" de deleção (BUG-04)

**Arquivos:**
- Modify: `server/src/routes/admin-categories.js`
- Modify: `src/pages/admin/AdminCategoriesPage.jsx`

- [ ] **2.1 — Guard no backend**

Em `server/src/routes/admin-categories.js`, no início de `router.delete('/:id', ...)` (linha ~42), adicionar:

```js
router.delete('/:id', async (req, res) => {
  if (req.params.id === 'all') {
    return res.status(403).json({ error: 'A categoria "Todos" é reservada e não pode ser removida.' });
  }
  // ... resto do handler existente
```

- [ ] **2.2 — Ocultar botão no frontend (tabela desktop)**

Em `src/pages/admin/AdminCategoriesPage.jsx`, na célula da tabela que renderiza o botão Deletar (linha ~140), trocar:

```jsx
// ANTES:
<td className="px-4 py-3">
  <button
    onClick={() => handleDelete(c.id, c.label)}
    className="text-red-400 hover:underline font-[600]"
  >
    Deletar
  </button>
</td>

// DEPOIS:
<td className="px-4 py-3">
  {c.id !== 'all' && (
    <button
      onClick={() => handleDelete(c.id, c.label)}
      className="text-red-400 hover:underline font-[600]"
    >
      Deletar
    </button>
  )}
</td>
```

- [ ] **2.3 — Ocultar botão no frontend (cards mobile)**

Ainda em `AdminCategoriesPage.jsx`, nos cards mobile (linha ~167):

```jsx
// ANTES:
<button
  onClick={() => handleDelete(c.id, c.label)}
  className="text-red-400 hover:underline font-[600] text-[13px]"
>
  Deletar
</button>

// DEPOIS:
{c.id !== 'all' && (
  <button
    onClick={() => handleDelete(c.id, c.label)}
    className="text-red-400 hover:underline font-[600] text-[13px]"
  >
    Deletar
  </button>
)}
```

- [ ] **2.4 — Verificar**

Acessar `/admin/categorias` no browser. A linha "Todos" (id=all) não deve ter botão "Deletar".  
Via curl: `DELETE /api/admin/categories/all` com token deve retornar HTTP 403.

- [ ] **2.5 — Commit**

```bash
git add server/src/routes/admin-categories.js src/pages/admin/AdminCategoriesPage.jsx
git commit -m "fix(admin): impede deleção da categoria reservada 'all'"
```

---

## Task 3: Debounce na busca (BUG-05)

**Arquivos:**
- Create: `src/hooks/useDebounce.js`
- Modify: `src/pages/ProdutosPage.jsx`
- Modify: `src/pages/admin/AdminDashboardPage.jsx`

- [ ] **3.1 — Criar hook `useDebounce`**

Criar `src/hooks/useDebounce.js`:

```js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
```

- [ ] **3.2 — Aplicar debounce em `ProdutosPage.jsx`**

Abrir `src/pages/ProdutosPage.jsx`. Separar estado do input do estado de busca:

```jsx
// No topo do arquivo, adicionar import:
import { useDebounce } from '../hooks/useDebounce';

// Dentro do componente, manter `query` como URL param mas criar inputValue local:
const [inputValue, setInputValue] = useState(query);
const debouncedQuery = useDebounce(inputValue, 300);

// Substituir o useEffect que reage a query para reagir a debouncedQuery:
// (já existe useEffect que chama fetchProducts quando [cat, query, page] muda)
// Criar um efeito separado para sincronizar debouncedQuery → URL:
useEffect(() => {
  const p = new URLSearchParams(searchParams);
  if (debouncedQuery.trim()) p.set('q', debouncedQuery.trim()); else p.delete('q');
  p.delete('page');
  setSearchParams(p, { replace: true });
}, [debouncedQuery]);

// No input de busca, trocar value/onChange para usar inputValue:
<input
  type="text"
  placeholder="Buscar produto..."
  value={inputValue}
  onChange={(e) => setInputValue(e.target.value)}
  className="..."
/>
```

> **Atenção:** remover o `setQuery` chamado diretamente no `onChange` anterior. O `query` lido de `searchParams` ainda controla o fetch; o `inputValue` é só o buffer local do input.

- [ ] **3.3 — Aplicar debounce em `AdminDashboardPage.jsx`**

```jsx
// Adicionar import no topo:
import { useDebounce } from '../../hooks/useDebounce';

// Dentro do componente, adicionar após declaração de `query`:
const [inputQuery, setInputQuery] = useState('');
const debouncedQuery = useDebounce(inputQuery, 300);

// Substituir a referência de `query` no fetchProducts pelo debouncedQuery:
// No useCallback do fetchProducts, trocar `query` por `debouncedQuery`:
const fetchProducts = useCallback(async () => {
  setLoading(true);
  const params = new URLSearchParams({ page, per_page: 20 });
  if (cat !== 'all') params.set('cat', cat);
  if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
  // ... resto igual
}, [page, debouncedQuery, cat, request]);

// No input de busca, trocar value/onChange:
<input
  type="text"
  placeholder="Buscar..."
  value={inputQuery}
  onChange={e => { setInputQuery(e.target.value); setPage(1); }}
  className="..."
/>
```

> **Nota:** remover o `query` state duplicado do AdminDashboard que estava sendo usado no onChange anteriormente — ele deixa de existir; `inputQuery` é o buffer e `debouncedQuery` é o valor efetivo no fetch.

- [ ] **3.4 — Verificar**

Abrir `/produtos` no browser, digitar rapidamente "calcio" no campo de busca. Verificar no DevTools (Network) que apenas 1 requisição é enviada após parar de digitar (não uma por tecla).

- [ ] **3.5 — Commit**

```bash
git add src/hooks/useDebounce.js src/pages/ProdutosPage.jsx src/pages/admin/AdminDashboardPage.jsx
git commit -m "fix(perf): adiciona debounce de 300ms na busca de produtos"
```

---

## Task 4: TTL no cache de conteúdo CMS (BUG-08)

**Arquivo:**
- Modify: `src/hooks/usePageContent.js`

- [ ] **4.1 — Adicionar TTL de 5 minutos**

Substituir todo o conteúdo de `src/hooks/usePageContent.js`:

```js
import { useState, useEffect } from 'react';

const cache = {};
const TTL_MS = 5 * 60 * 1000;

export function usePageContent(page, defaults) {
  const [content, setContent] = useState(() => {
    const entry = cache[page];
    if (entry && Date.now() - entry.ts < TTL_MS) {
      return { ...defaults, ...entry.data };
    }
    return { ...defaults };
  });

  useEffect(() => {
    const entry = cache[page];
    if (entry && Date.now() - entry.ts < TTL_MS) return;
    fetch(`/api/content/${page}`)
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object' && !data.error) {
          cache[page] = { data, ts: Date.now() };
          setContent(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, [page]);

  return content;
}
```

- [ ] **4.2 — Verificar**

Abrir o site, navegar entre páginas. O conteúdo carrega normalmente. Não há nenhuma mudança visual — o teste é funcional (sem regressão).

- [ ] **4.3 — Commit**

```bash
git add src/hooks/usePageContent.js
git commit -m "fix(cache): adiciona TTL de 5 minutos no cache de conteúdo CMS"
```

---

## Task 5: Homepage buscar produtos via API (BUG-01)

**Arquivos:**
- Modify: `server/src/routes/products.js`
- Modify: `src/pages/HomePage.jsx`

- [ ] **5.1 — Adicionar suporte a `?ids=` no backend**

Em `server/src/routes/products.js`, dentro do `router.get('/', ...)`, após o bloco `if (q)`, adicionar suporte ao parâmetro `ids`:

```js
// Após o bloco do parâmetro `q` (em torno da linha 22):
const ids = req.query.ids
  ? String(req.query.ids).split(',').map(s => s.trim()).filter(Boolean)
  : null;

if (ids && ids.length) {
  params.push(ids);
  where.push(`id = ANY($${params.length})`);
}
```

Quando `ids` for fornecido, `ativo = TRUE` ainda se aplica (já está no array `where`), então produtos inativos não aparecem.

- [ ] **5.2 — Atualizar `HomePage.jsx` para buscar via API**

Em `src/pages/HomePage.jsx`:

1. Remover os imports de `CATALOG` e o filtro estático.
2. Adicionar state + fetch dos produtos featured.

```jsx
// REMOVER estas linhas:
import { CATALOG } from '../data/catalog';
// e:
const featured = CATALOG.filter(p => FEATURED_IDS.includes(p.id));
const visible  = featured.slice(carouselIdx, carouselIdx + 4);

// ADICIONAR (logo após as declarações de const FEATURED_IDS e BRAND_*):
import { useState, useEffect } from 'react'; // já existe, não duplicar

// Dentro do componente, substituir o `featured`/`visible` por:
const [featured, setFeatured] = useState([]);
useEffect(() => {
  fetch(`/api/products?ids=${FEATURED_IDS.join(',')}&per_page=20`)
    .then(r => r.json())
    .then(json => {
      if (Array.isArray(json.data)) {
        const ordered = FEATURED_IDS
          .map(id => json.data.find(p => p.id === id))
          .filter(Boolean);
        setFeatured(ordered);
      }
    })
    .catch(() => {});
}, []);

const visible = featured.slice(carouselIdx, carouselIdx + 4);
```

> A ordenação usa `FEATURED_IDS.map(...)` para garantir que a ordem curada seja preservada mesmo que a API retorne em outra ordem.

- [ ] **5.3 — Verificar**

Abrir a home no browser. A seção "Mais Vendidos" carrega. Verificar no DevTools que a requisição `/api/products?ids=aqualema,...` é feita. Confirmar que a imagem do Amargofig carregada na home corresponde à imagem atual do banco.

- [ ] **5.4 — Commit**

```bash
git add server/src/routes/products.js src/pages/HomePage.jsx
git commit -m "fix(home): mais vendidos agora busca produtos via API em vez de catálogo estático"
```

---

## Task 6: Correções em ProdutoPage (BUG-02, BUG-03, BUG-07)

**Arquivo:**
- Modify: `src/pages/ProdutoPage.jsx`

- [ ] **6.1 — BUG-03: Renderizar `caracteristicas` como lista**

Em `src/pages/ProdutoPage.jsx`, substituir o array `accordionData` para que o item de características renderize lista quando aplicável:

```jsx
// ANTES (linha ~47):
{ id: 'caracteristicas', title: 'Características do produto', content: p.caracteristicas?.join(' ') || p.description },

// DEPOIS — substituir toda a propriedade `content` desse item por `render`:
const accordionData = [
  {
    id: 'caracteristicas',
    title: 'Características do produto',
    render: Array.isArray(p.caracteristicas) && p.caracteristicas.length
      ? (
          <ul className="list-disc list-inside space-y-1">
            {p.caracteristicas.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )
      : <span>{p.description}</span>,
  },
  { id: 'apresentacao', title: 'Apresentação',  render: <span>{p.apresentacao || '—'}</span> },
  { id: 'modouso',      title: 'Modo de Uso',   render: <span>{p.modo_uso    || '—'}</span> },
  { id: 'precaucoes',   title: 'Precauções',    render: <span>{p.precaucoes  || '—'}</span> },
];
```

Depois, no JSX do accordion, substituir `{item.content}` por `{item.render}`:

```jsx
// ANTES (linha ~102):
<div className="pb-4 text-[14px] text-ink-light leading-[1.6]">{item.content}</div>

// DEPOIS:
<div className="pb-4 text-[14px] text-ink-light leading-[1.6]">{item.render}</div>
```

- [ ] **6.2 — BUG-02: Remover galeria de thumbnails falsa**

Em `src/pages/ProdutoPage.jsx`, remover o bloco de thumbnails (linhas ~71–85) e o estado `variant`:

```jsx
// REMOVER este bloco inteiro abaixo da div da imagem principal:
<div className="flex gap-[14px] mt-[18px] justify-center">
  {[0, 1, 2].map(i => (
    <div
      key={i}
      onClick={() => setVariant(i)}
      className={`w-[72px] h-[72px] ... ${variant === i ? 'border-2 border-orange' : 'border border-line'}`}
    >
      {p.image
        ? <img src={p.image} alt="" className="max-w-full max-h-full object-contain" />
        : <span className="text-[10px] text-[#bbb] font-mono">angle {i + 1}</span>
      }
    </div>
  ))}
</div>

// REMOVER também a declaração do estado:
const [variant, setVariant] = useState(0);
```

- [ ] **6.3 — BUG-07: Extrair unidade de porção dinamicamente**

Em `src/pages/ProdutoPage.jsx`, no header da tabela nutricional (linha ~127), substituir "15 ml" por valor extraído de `nutri_porcoes`:

```jsx
// Antes do return, criar helper:
const nutriUnidade = (() => {
  if (!p.nutri_porcoes) return '—';
  const match = p.nutri_porcoes.match(/Porção:\s*([^\n(]+)/i);
  return match ? match[1].trim() : p.nutri_porcoes.split('\n')[0];
})();

// No header da tabela (linha ~127):
// ANTES:
<th className="text-right py-1.5 font-bold">15 ml</th>

// DEPOIS:
<th className="text-right py-1.5 font-bold">{nutriUnidade}</th>
```

- [ ] **6.4 — Verificar**

Abrir uma página de produto (ex: `/produtos/aqualema`):
- Tabela nutricional mostra "15ml (1 colher de sopa)" ou o valor extraído, não mais "15 ml" fixo
- Seção de características está ausente ou mostra lista `<ul>` quando populada
- Thumbnails abaixo da imagem principal não aparecem mais

- [ ] **6.5 — Commit**

```bash
git add src/pages/ProdutoPage.jsx
git commit -m "fix(produto): remove thumbnails falsos, lista características, unidade nutricional dinâmica"
```

---

## Task 7: Lazy loading nas imagens de produto (PERF-02)

**Arquivo:**
- Modify: `src/components/ProductCard.jsx`

- [ ] **7.1 — Ler o componente**

Localizar a tag `<img>` dentro de `src/components/ProductCard.jsx`.

- [ ] **7.2 — Adicionar `loading="lazy"`**

Adicionar o atributo `loading="lazy"` na `<img>` de produto:

```jsx
// Encontrar a img do produto dentro do ProductCard e adicionar loading="lazy":
<img
  src={product.image}
  alt={product.name}
  loading="lazy"
  className="..."   // manter classes existentes
/>
```

- [ ] **7.3 — Verificar**

Abrir `/produtos` no browser. Inspecionar o HTML: imagens abaixo da dobra devem ter `loading="lazy"`. No DevTools > Network, imagens fora da viewport não devem ser baixadas no carregamento inicial.

- [ ] **7.4 — Commit**

```bash
git add src/components/ProductCard.jsx
git commit -m "perf: adiciona loading=lazy nas imagens de produto no catálogo"
```

---

## Task 8: Metatags dinâmicas com react-helmet-async (PERF-01, SEO-01, SEO-02)

**Arquivos:**
- Modify: `src/main.jsx` — adicionar `<HelmetProvider>`
- Modify: `src/pages/HomePage.jsx`
- Modify: `src/pages/ProdutosPage.jsx`
- Modify: `src/pages/ProdutoPage.jsx`
- Modify: `src/pages/QuemSomosPage.jsx`
- Modify: `src/pages/FaleConoscoPage.jsx`
- Modify: `src/pages/PrivacidadePage.jsx`

- [ ] **8.1 — Instalar react-helmet-async**

```bash
cd D:\Hclaudio\Documents\Projetos\site-sobral
bun add react-helmet-async
```

Confirmar que `react-helmet-async` aparece em `package.json > dependencies`.

- [ ] **8.2 — Envolver a App com `HelmetProvider` em `main.jsx`**

Em `src/main.jsx`, adicionar o import e envolver `<App>`:

```jsx
import { HelmetProvider } from 'react-helmet-async';

// No createRoot(...)render(...):
root.render(
  <StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HelmetProvider>
  </StrictMode>
);
```

- [ ] **8.3 — Helmet na `HomePage`**

Em `src/pages/HomePage.jsx`, adicionar no topo do `return`:

```jsx
import { Helmet } from 'react-helmet-async';

// Dentro do return, como primeiro filho do fragmento:
<Helmet>
  <title>Laboratório Sobral — Suplementos e Tradicionais desde 1911</title>
  <meta name="description" content="Há mais de 100 anos cuidando da saúde das famílias brasileiras. Conheça nossas linhas: Calciolax, Movimex, PropZinco e Tradicionais." />
  <meta property="og:title" content="Laboratório Sobral" />
  <meta property="og:description" content="Suplementos e produtos tradicionais desde 1911." />
  <meta property="og:image" content="/images/logo.png" />
  <meta property="og:type" content="website" />
</Helmet>
```

- [ ] **8.4 — Helmet em `ProdutosPage`**

Em `src/pages/ProdutosPage.jsx`:

```jsx
import { Helmet } from 'react-helmet-async';

// No início do return, antes do primeiro elemento:
const catLabel = categories.find(c => c.id === cat)?.label || 'Todos';
const pageTitle = cat === 'all'
  ? 'Catálogo completo — Laboratório Sobral'
  : `${catLabel} — Laboratório Sobral`;

// No JSX:
<Helmet>
  <title>{pageTitle}</title>
  <meta name="description" content={`Veja ${total} produto${total !== 1 ? 's' : ''} na categoria ${catLabel}. Suplementos, tradicionais, óleos e cosméticos.`} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:type" content="website" />
</Helmet>
```

- [ ] **8.5 — Helmet em `ProdutoPage`**

Em `src/pages/ProdutoPage.jsx`, dentro do bloco após `if (loading)` e `if (notFound)`, adicionar:

```jsx
import { Helmet } from 'react-helmet-async';

// Antes do bloco <Breadcrumb>, no return principal:
<Helmet>
  <title>{p.name} — Laboratório Sobral</title>
  <meta name="description" content={p.description || `${p.name}: ${p.tag}`} />
  <meta property="og:title" content={`${p.name} — Laboratório Sobral`} />
  <meta property="og:description" content={p.description || p.tag || ''} />
  {p.image && <meta property="og:image" content={`https://site.laboratoriosobral.com${p.image}`} />}
  <meta property="og:type" content="product" />
</Helmet>
```

- [ ] **8.6 — Helmet em `QuemSomosPage`**

```jsx
import { Helmet } from 'react-helmet-async';

// No return:
<Helmet>
  <title>Quem Somos — Laboratório Sobral</title>
  <meta name="description" content="Conheça a história do Laboratório Sobral. Há mais de 100 anos presente na vida dos brasileiros, com missão, visão e valores sólidos." />
  <meta property="og:title" content="Quem Somos — Laboratório Sobral" />
  <meta property="og:type" content="website" />
</Helmet>
```

- [ ] **8.7 — Helmet em `FaleConoscoPage`**

```jsx
import { Helmet } from 'react-helmet-async';

// No return:
<Helmet>
  <title>Fale Conosco — Laboratório Sobral</title>
  <meta name="description" content="Entre em contato com o Laboratório Sobral. Unidade fabril em Floriano-PI, escritório em Teresina-PI. SAC: 0800 979 5040." />
  <meta property="og:title" content="Fale Conosco — Laboratório Sobral" />
  <meta property="og:type" content="website" />
</Helmet>
```

- [ ] **8.8 — Helmet em `PrivacidadePage`**

```jsx
import { Helmet } from 'react-helmet-async';

// No return:
<Helmet>
  <title>Política de Privacidade — Laboratório Sobral</title>
  <meta name="description" content="Leia a política de privacidade do Laboratório Sobral." />
</Helmet>
```

- [ ] **8.9 — Verificar**

Abrir o browser, navegar entre páginas e verificar a aba do browser: o título deve mudar por rota. Inspecionar `<head>` no DevTools para confirmar metatags OG.

- [ ] **8.10 — Commit**

```bash
git add src/main.jsx src/pages/HomePage.jsx src/pages/ProdutosPage.jsx src/pages/ProdutoPage.jsx src/pages/QuemSomosPage.jsx src/pages/FaleConoscoPage.jsx src/pages/PrivacidadePage.jsx package.json bun.lock
git commit -m "feat(seo): metatags dinâmicas por página e Open Graph via react-helmet-async"
```

---

## Task 9: Push e deploy

- [ ] **9.1 — Push para main**

```bash
git push origin main
```

- [ ] **9.2 — Confirmar build em produção**

Aguardar deploy (processo definido no servidor) e verificar em https://site.laboratoriosobral.com/ que:
- Título da aba muda por rota
- "Mais Vendidos" na home mostra imagem atualizada do Amargofig
- Thumbnails de variante sumiram na página de produto
- Campo de busca com debounce (observar no Network)
- Categoria "Todos" sem botão Deletar

---

## Itens Diferidos (não incluídos neste plano)

| Item | Motivo |
|------|--------|
| PERF-03: WebP/sharp | Requer módulo nativo; mudança no flow de upload; fazer em sprint separado |
| PERF-04: pasta de upload | Baixa prioridade; requer migração de paths salvos no banco |
| SEC-01: magic bytes | Requer `file-type` (ESM puro, precisa de workaround em CJS); risco baixo com auth |
| SEC-02: JWT → HttpOnly cookie | Mudança grande; risco mitigado pela CSP `script-src 'self'` |
