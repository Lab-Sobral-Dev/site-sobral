# Carrossel de Produtos em Destaque — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a seção "Nossas Linhas" da HomePage por um carrossel de produtos marcados como destaque pelo admin, usando o mesmo `ProductCard` da página de produtos.

**Architecture:** Nova coluna `destaque` na tabela `products` + filtro `?destaque=true` na rota pública existente + novo componente `ProductCarousel` que busca os dados e pagina de 4 em 4 com auto-avanço.

**Tech Stack:** React 18 + Tailwind CSS (frontend) · Node.js + Express + PostgreSQL (backend)

---

## Mapa de arquivos

| Arquivo | Operação |
|---|---|
| `server/src/db/migrations/007_destaque_produtos.sql` | Criar — nova coluna |
| `server/src/routes/products.js` | Modificar — filtro `?destaque=true` |
| `server/src/routes/admin-products.js` | Modificar — incluir `destaque` em GET/POST/PUT |
| `src/components/ProductCarousel.jsx` | Criar — carrossel completo |
| `src/pages/HomePage.jsx` | Modificar — trocar seção Nossas Linhas |
| `src/pages/admin/AdminProductFormPage.jsx` | Modificar — toggle destaque |

---

## Task 1: Migration — coluna `destaque`

**Files:**
- Create: `server/src/db/migrations/007_destaque_produtos.sql`

- [ ] **Criar o arquivo de migration**

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS destaque BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_destaque ON products(destaque) WHERE destaque = TRUE;
```

- [ ] **Commit**

```bash
git add server/src/db/migrations/007_destaque_produtos.sql
git commit -m "feat(db): adiciona coluna destaque em products"
```

---

## Task 2: Backend — rota pública `/api/products`

**Files:**
- Modify: `server/src/routes/products.js`

O arquivo usa um array `where` + `params` para construir o WHERE dinâmico. Basta adicionar mais um caso.

- [ ] **Adicionar filtro `destaque=true` logo após o filtro de `ids`** (linha ~31 do arquivo atual)

Localizar o bloco:
```javascript
    const ids = req.query.ids
      ? String(req.query.ids).split(',').map(s => s.trim()).filter(Boolean)
      : null;
    if (ids && ids.length) {
      params.push(ids);
      where.push(`id = ANY($${params.length})`);
    }
```

Adicionar **imediatamente após** esse bloco:
```javascript
    if (req.query.destaque === 'true') {
      where.push('destaque = TRUE');
    }
```

- [ ] **Verificar manualmente** (com o servidor rodando):

```bash
curl "http://localhost:3001/api/products?destaque=true"
# Deve retornar { data: [], total: 0, ... } enquanto nenhum produto está marcado
```

- [ ] **Commit**

```bash
git add server/src/routes/products.js
git commit -m "feat(api): suporte a filtro destaque=true em /api/products"
```

---

## Task 3: Backend — rotas admin de produtos

**Files:**
- Modify: `server/src/routes/admin-products.js`

São 4 pontos no arquivo:

- [ ] **GET `/` — adicionar `destaque` no SELECT** (linha ~37)

Localizar:
```javascript
      `SELECT id, name, tag, category_id, brand, image, description,
              caracteristicas, apresentacao, modo_uso, precaucoes,
              ingredientes, disclaimer, nutri_porcoes, nutri_rows, ativo
       FROM products ${whereClause}
```

Substituir por:
```javascript
      `SELECT id, name, tag, category_id, brand, image, description,
              caracteristicas, apresentacao, modo_uso, precaucoes,
              ingredientes, disclaimer, nutri_porcoes, nutri_rows, ativo, destaque
       FROM products ${whereClause}
```

- [ ] **GET `/:id` — adicionar `destaque` no SELECT** (linha ~57)

Localizar:
```javascript
      `SELECT id, name, tag, category_id, brand, image, description,
              caracteristicas, apresentacao, modo_uso, precaucoes,
              ingredientes, disclaimer, nutri_porcoes, nutri_rows, ativo
       FROM products WHERE id = $1`,
```

Substituir por:
```javascript
      `SELECT id, name, tag, category_id, brand, image, description,
              caracteristicas, apresentacao, modo_uso, precaucoes,
              ingredientes, disclaimer, nutri_porcoes, nutri_rows, ativo, destaque
       FROM products WHERE id = $1`,
```

- [ ] **POST `/` — adicionar `destaque` no INSERT** (linha ~73)

Localizar o destructuring:
```javascript
  const { id, name, tag, category_id, brand, image, description,
          caracteristicas, apresentacao, modo_uso, precaucoes,
          ingredientes, disclaimer, nutri_porcoes, nutri_rows } = req.body;
```

Substituir por:
```javascript
  const { id, name, tag, category_id, brand, image, description,
          caracteristicas, apresentacao, modo_uso, precaucoes,
          ingredientes, disclaimer, nutri_porcoes, nutri_rows, destaque } = req.body;
```

Localizar o INSERT:
```javascript
      `INSERT INTO products(id, name, tag, category_id, brand, image, description,
                            caracteristicas, apresentacao, modo_uso, precaucoes,
                            ingredientes, disclaimer, nutri_porcoes, nutri_rows)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        id, name, tag || null, category_id, brand || null, image || null, description || null,
        caracteristicas || null, apresentacao || null, modo_uso || null, precaucoes || null,
        ingredientes || null, disclaimer || null, nutri_porcoes || null,
        nutri_rows ? JSON.stringify(nutri_rows) : null,
      ]
```

Substituir por:
```javascript
      `INSERT INTO products(id, name, tag, category_id, brand, image, description,
                            caracteristicas, apresentacao, modo_uso, precaucoes,
                            ingredientes, disclaimer, nutri_porcoes, nutri_rows, destaque)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        id, name, tag || null, category_id, brand || null, image || null, description || null,
        caracteristicas || null, apresentacao || null, modo_uso || null, precaucoes || null,
        ingredientes || null, disclaimer || null, nutri_porcoes || null,
        nutri_rows ? JSON.stringify(nutri_rows) : null,
        destaque === true,
      ]
```

- [ ] **PUT `/:id` — adicionar `destaque` no UPDATE** (linha ~100)

Localizar o destructuring:
```javascript
  const { name, tag, category_id, brand, image, description,
          caracteristicas, apresentacao, modo_uso, precaucoes,
          ingredientes, disclaimer, nutri_porcoes, nutri_rows, ativo } = req.body;
```

Substituir por:
```javascript
  const { name, tag, category_id, brand, image, description,
          caracteristicas, apresentacao, modo_uso, precaucoes,
          ingredientes, disclaimer, nutri_porcoes, nutri_rows, ativo, destaque } = req.body;
```

Localizar o UPDATE:
```javascript
      `UPDATE products SET
         name=$1, tag=$2, category_id=$3, brand=$4, image=$5, description=$6,
         caracteristicas=$7, apresentacao=$8, modo_uso=$9, precaucoes=$10,
         ingredientes=$11, disclaimer=$12, nutri_porcoes=$13, nutri_rows=$14,
         ativo=$15, updated_at=NOW()
       WHERE id=$16 RETURNING *`,
      [
        name, tag || null, category_id, brand || null, image || null, description || null,
        caracteristicas || null, apresentacao || null, modo_uso || null, precaucoes || null,
        ingredientes || null, disclaimer || null, nutri_porcoes || null,
        nutri_rows ? JSON.stringify(nutri_rows) : null,
        ativo !== undefined ? ativo : true,
        req.params.id,
      ]
```

Substituir por:
```javascript
      `UPDATE products SET
         name=$1, tag=$2, category_id=$3, brand=$4, image=$5, description=$6,
         caracteristicas=$7, apresentacao=$8, modo_uso=$9, precaucoes=$10,
         ingredientes=$11, disclaimer=$12, nutri_porcoes=$13, nutri_rows=$14,
         ativo=$15, destaque=$16, updated_at=NOW()
       WHERE id=$17 RETURNING *`,
      [
        name, tag || null, category_id, brand || null, image || null, description || null,
        caracteristicas || null, apresentacao || null, modo_uso || null, precaucoes || null,
        ingredientes || null, disclaimer || null, nutri_porcoes || null,
        nutri_rows ? JSON.stringify(nutri_rows) : null,
        ativo !== undefined ? ativo : true,
        destaque === true,
        req.params.id,
      ]
```

- [ ] **Commit**

```bash
git add server/src/routes/admin-products.js
git commit -m "feat(api): inclui campo destaque nas rotas admin de produtos"
```

---

## Task 4: Frontend — componente `ProductCarousel`

**Files:**
- Create: `src/components/ProductCarousel.jsx`

- [ ] **Criar o arquivo completo**

```jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import { useScrollReveal } from '../hooks/useScrollReveal';

const CARDS_PER_PAGE = 4;
const INTERVAL_MS = 5000;

export default function ProductCarousel() {
  const navigate = useNavigate();
  const ref = useScrollReveal();

  const [products, setProducts] = useState([]);
  const [pageIdx, setPageIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch('/api/products?destaque=true&per_page=50')
      .then(r => r.json())
      .then(json => setProducts(json.data || []))
      .catch(() => {});
  }, []);

  const totalPages = Math.ceil(products.length / CARDS_PER_PAGE);

  const next = useCallback(() => setPageIdx(i => (i + 1) % totalPages), [totalPages]);
  const prev = useCallback(() => setPageIdx(i => (i - 1 + totalPages) % totalPages), [totalPages]);

  useEffect(() => {
    if (totalPages <= 1 || paused) return;
    const t = setInterval(next, INTERVAL_MS);
    return () => clearInterval(t);
  }, [totalPages, paused, next]);

  if (!products.length) return null;

  const visible = products.slice(pageIdx * CARDS_PER_PAGE, (pageIdx + 1) * CARDS_PER_PAGE);
  const showControls = totalPages > 1;

  return (
    <section
      ref={ref}
      className="reveal max-w-content mx-auto px-4 md:px-10 mt-[60px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="text-center mt-10 mb-7">
        <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-1.5">PRODUTOS EM DESTAQUE</div>
        <h2 className="font-display text-[28px] md:text-[36px] font-[900] tracking-[-.5px] leading-none">Conheça nossa linha</h2>
      </div>

      <div className="relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {visible.map(p => (
            <ProductCard key={p.id} product={p} onClick={() => navigate(`/produtos/${p.id}`)} />
          ))}
        </div>

        {showControls && (
          <>
            <button
              onClick={prev}
              aria-label="Produtos anteriores"
              className="absolute left-[-18px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border-2 border-orange text-orange flex items-center justify-center text-[20px] shadow transition-all hover:bg-orange hover:text-white z-10 leading-none"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Próximos produtos"
              className="absolute right-[-18px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border-2 border-orange text-orange flex items-center justify-center text-[20px] shadow transition-all hover:bg-orange hover:text-white z-10 leading-none"
            >
              ›
            </button>
          </>
        )}
      </div>

      {showControls && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPageIdx(i)}
              aria-label={`Página ${i + 1}`}
              className={`w-2.5 h-2.5 rounded-full border-none transition-all ${i === pageIdx ? 'bg-orange scale-125' : 'bg-[#ccc] hover:bg-orange'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Commit**

```bash
git add src/components/ProductCarousel.jsx
git commit -m "feat(ui): componente ProductCarousel com auto-avanço e paginação"
```

---

## Task 5: Frontend — `HomePage` substitui seção Nossas Linhas

**Files:**
- Modify: `src/pages/HomePage.jsx`

- [ ] **Remover as constantes de marca** (linhas 9-10)

Remover:
```javascript
const BRAND_LABELS = ['Linha Tradicionais', 'Família Calciolax', 'Movimex', 'Óleos Sobral'];
const BRAND_KEYS   = ['marca_tradicionais_imagem', 'marca_calciolax_imagem', 'marca_movimex_imagem', 'marca_oleos_imagem'];
```

- [ ] **Remover as chaves CMS de marca em `HOME_DEFAULTS`** (linhas 20-23)

Localizar em `HOME_DEFAULTS`:
```javascript
  marca_tradicionais_imagem:   '/images/brand-tradicionais.png',
  marca_calciolax_imagem:      '/images/brand-calciolax.png',
  marca_movimex_imagem:        '/images/brand-movimex.png',
  marca_oleos_imagem:          '/images/brand-oleos.png',
```

Remover essas 4 linhas.

- [ ] **Remover `refLinhas` do hook** (linha 30)

Localizar:
```javascript
  const refLinhas   = useScrollReveal();
  const refHistoria = useScrollReveal();
```

Substituir por:
```javascript
  const refHistoria = useScrollReveal();
```

- [ ] **Adicionar import do `ProductCarousel`** logo após os imports existentes

Localizar:
```javascript
import HeroCarousel from '../components/HeroCarousel';
```

Substituir por:
```javascript
import HeroCarousel from '../components/HeroCarousel';
import ProductCarousel from '../components/ProductCarousel';
```

- [ ] **Substituir a seção JSX "NOSSAS LINHAS"**

Localizar o bloco inteiro:
```jsx
      {/* NOSSAS LINHAS */}
      <section ref={refLinhas} className="reveal max-w-content mx-auto px-4 md:px-10 mt-[60px]">
        <div className="text-center mt-10 mb-7">
          <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-1.5">{content.linhas_eyebrow}</div>
          <h2 className="font-display text-[28px] md:text-[36px] font-[900] tracking-[-.5px] leading-none">{content.linhas_titulo}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-[960px] mx-auto">
          {BRAND_KEYS.map((key, i) => (
            <div
              key={key}
              className="bg-white rounded p-5 flex flex-col items-center justify-between gap-3 cursor-pointer shadow-sm h-[220px] transition-[transform,box-shadow] duration-[220ms] hover:-translate-y-1 hover:shadow"
              onClick={() => navigate('/produtos')}
            >
              <div className="flex-1 w-full flex items-center justify-center min-h-0">
                <img src={content[key]} alt={BRAND_LABELS[i]} className="max-w-full max-h-full w-auto h-auto object-contain block" />
              </div>
              <div className="font-[800] text-[13.5px] text-ink text-center flex-shrink-0">{BRAND_LABELS[i]}</div>
            </div>
          ))}
        </div>
      </section>
```

Substituir por:
```jsx
      <ProductCarousel />
```

- [ ] **Remover as chaves CMS `linhas_eyebrow` e `linhas_titulo` de `HOME_DEFAULTS`**

Localizar em `HOME_DEFAULTS`:
```javascript
  linhas_eyebrow:       'FAMÍLIAS DE PRODUTOS',
  linhas_titulo:        'Nossas Linhas',
```

Remover essas 2 linhas.

- [ ] **Commit**

```bash
git add src/pages/HomePage.jsx
git commit -m "feat(home): substitui Nossas Linhas pelo ProductCarousel"
```

---

## Task 6: Admin — toggle destaque no formulário de produto

**Files:**
- Modify: `src/pages/admin/AdminProductFormPage.jsx`

- [ ] **Adicionar `destaque: false` em `EMPTY_FORM`** (linha 6-10)

Localizar:
```javascript
const EMPTY_FORM = {
  id: '', name: '', tag: '', category_id: '', brand: '', image: '',
  description: '', caracteristicas: '', apresentacao: '', modo_uso: '',
  precaucoes: '', ingredientes: '', disclaimer: '', nutri_porcoes: '',
  nutri_rows: '', ativo: true,
};
```

Substituir por:
```javascript
const EMPTY_FORM = {
  id: '', name: '', tag: '', category_id: '', brand: '', image: '',
  description: '', caracteristicas: '', apresentacao: '', modo_uso: '',
  precaucoes: '', ingredientes: '', disclaimer: '', nutri_porcoes: '',
  nutri_rows: '', ativo: true, destaque: false,
};
```

- [ ] **Carregar `destaque` ao editar produto** (bloco `setForm` dentro do `useEffect`, ~linha 36)

Localizar:
```javascript
          ativo:           p.ativo,
```

Adicionar **imediatamente após**:
```javascript
          destaque:        p.destaque ?? false,
```

- [ ] **Adicionar o checkbox no formulário** — inserir após o bloco do checkbox `ativo` (~linha 250)

Localizar:
```jsx
        {isEdit && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ativo"
              checked={form.ativo}
              onChange={e => set('ativo', e.target.checked)}
              className="w-4 h-4 accent-orange"
            />
            <label htmlFor="ativo" className="text-[14px] font-[600] text-ink">Produto ativo (visível no site)</label>
          </div>
        )}
```

Substituir por:
```jsx
        {isEdit && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ativo"
              checked={form.ativo}
              onChange={e => set('ativo', e.target.checked)}
              className="w-4 h-4 accent-orange"
            />
            <label htmlFor="ativo" className="text-[14px] font-[600] text-ink">Produto ativo (visível no site)</label>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="destaque"
            checked={form.destaque}
            onChange={e => set('destaque', e.target.checked)}
            className="w-4 h-4 accent-orange"
          />
          <label htmlFor="destaque" className="text-[14px] font-[600] text-ink">Produto em destaque (aparece no carrossel da home)</label>
        </div>
```

- [ ] **Commit**

```bash
git add src/pages/admin/AdminProductFormPage.jsx
git commit -m "feat(admin): toggle destaque no formulário de produto"
```

---

## Task 7: Deploy e verificação

- [ ] **Push para main**

```bash
git push origin main
```

- [ ] **Aguardar o deploy via GitHub Actions** (workflow `deploy.yml` roda automaticamente após o CI)

```bash
gh run list --limit 3
```

- [ ] **Após o deploy, rodar as migrations na VPS**

O deploy já executa `docker compose exec -T app node server/src/db/migrate.js` automaticamente. Verificar nos logs do GitHub Actions se o step "migrations" passou com `apply 007_destaque_produtos.sql`.

- [ ] **Verificação funcional**

1. Acesse `/admin` → edite qualquer produto → marque "Produto em destaque" → salve
2. Acesse a home page — o carrossel deve aparecer com o produto marcado
3. Se houver mais de 4 produtos em destaque: setas e dots devem aparecer e o auto-avanço deve funcionar
4. Se apenas 1-4 produtos: sem setas/dots, sem auto-avanço
5. Se nenhum produto marcado: seção não aparece na home
