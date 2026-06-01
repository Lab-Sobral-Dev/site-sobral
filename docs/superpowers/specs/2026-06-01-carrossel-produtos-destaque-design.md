# Carrossel de Produtos em Destaque — Spec

**Data:** 2026-06-01  
**Status:** Aprovado

---

## Contexto

A seção "Nossas Linhas" da `HomePage` exibe 4 cards com imagens de marca (Calciolax, Tradicionais, Movimex, Óleos). Ela será substituída por um carrossel de produtos individuais selecionados pelo admin.

---

## Decisões de design

| Aspecto | Decisão |
|---|---|
| Design dos cards | Idêntico ao `ProductCard` da `ProdutosPage` |
| Cards visíveis (desktop) | 4 simultâneos |
| Cards visíveis (mobile) | 2 simultâneos |
| Navegação | Setas ‹ › + dots indicadores |
| Auto-avanço | Sim — 5 segundos, pausa ao hover |
| Seleção de produtos | Admin marca/desmarca destaque por produto |
| Seção ausente | Se nenhum produto marcado, a seção não renderiza |

---

## Arquitetura

### 1. Banco de dados

Nova coluna na tabela `products`:

```sql
ALTER TABLE products ADD COLUMN destaque BOOLEAN NOT NULL DEFAULT FALSE;
```

Nova migration: `server/migrations/004_destaque_produtos.sql`

### 2. Backend

**Rota pública** — `GET /api/products` (existente em `server/src/routes/products.js`):
- Adicionar suporte ao query param `?destaque=true`
- Quando presente, adiciona `destaque = TRUE` ao `WHERE` clause

**Rota admin** — `server/src/routes/admin-products.js` (existente):
- `PUT /api/admin/products/:id` já existe — basta incluir o campo `destaque` no UPDATE

### 3. Frontend — componente `ProductCarousel`

Novo arquivo: `src/components/ProductCarousel.jsx`

**Props:** nenhuma (busca os dados internamente)

**Comportamento:**
- `useEffect` → `fetch('/api/products?destaque=true')` ao montar
- Armazena todos os produtos em destaque
- Divide em grupos de 4 (desktop) via lógica de paginação interna
- `idx` controla qual página de 4 cards está visível
- `setInterval` de 5s avança automaticamente; `clearInterval` ao hover
- Setas prev/next com wrap-around
- Dots: um por "página" de cards
- Se 4 ou menos produtos: setas e dots ficam ocultos (sem necessidade de navegar)
- Se nenhum produto: retorna `null` (seção não renderiza)

**Responsividade:**
- Desktop (md+): `grid-cols-4`
- Mobile: `grid-cols-2`

### 4. Frontend — `HomePage`

- Remover a seção "NOSSAS LINHAS" (JSX + constantes `BRAND_LABELS`, `BRAND_KEYS`)
- Remover as chaves CMS `marca_*` do `HOME_DEFAULTS`
- Remover `refLinhas` do `useScrollReveal`
- Substituir pelo `<ProductCarousel />` com eyebrow + título acima:
  - Eyebrow: `PRODUTOS EM DESTAQUE`
  - Título: `Conheça nossa linha`

### 5. Admin — `AdminProductFormPage`

- Adicionar campo toggle/checkbox "Produto em Destaque" ao formulário de edição
- Enviar `destaque` no payload do `PUT /api/admin/products/:id`

---

## Arquivos a criar/modificar

| Arquivo | Operação |
|---|---|
| `server/migrations/004_destaque_produtos.sql` | Criar |
| `server/src/routes/products.js` | Modificar — filtro `?destaque=true` |
| `server/src/routes/admin-products.js` | Modificar — incluir `destaque` no UPDATE |
| `src/components/ProductCarousel.jsx` | Criar |
| `src/pages/HomePage.jsx` | Modificar — trocar seção |
| `src/pages/admin/AdminProductFormPage.jsx` | Modificar — toggle destaque |

---

## Fora de escopo

- Ordenação manual dos produtos em destaque pelo admin (drag-and-drop)
- Limite máximo de produtos em destaque (controlado pelo admin)
- Transição animada entre páginas do carrossel (troca direta, sem fade)
