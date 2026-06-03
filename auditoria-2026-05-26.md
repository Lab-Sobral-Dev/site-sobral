# Auditoria de Site — Laboratório Sobral
**Data:** 26/05/2026  
**URL:** https://site.laboratoriosobral.com/  
**Método:** Análise de código-fonte + testes diretos de API + revisão de rotas

---

## Resumo Executivo

| Categoria     | Total de problemas |
|---------------|--------------------|
| Bugs          | 8                  |
| Performance   | 4                  |
| SEO           | 2                  |
| Segurança     | 2                  |
| **Total**     | **16**             |

---

## 1. Bugs

### BUG-01 — Homepage usa catálogo estático em vez do banco de dados ⚠️ ALTO

**Arquivo:** `src/pages/HomePage.jsx:37`

```js
const featured = CATALOG.filter(p => FEATURED_IDS.includes(p.id));
```

A seção "Mais Vendidos" lê produtos do arquivo local `src/data/catalog.js`, não da API.  
**Consequência:** Qualquer alteração feita pelo admin no nome, imagem ou descrição de um produto **não aparece na homepage**.

Evidência concreta: o produto **Amargofig** foi atualizado no banco (imagem atual: `caixa-amargofig-sobral-produ-o-copia-1779482982515.png`), mas a homepage continua usando a imagem estática antiga `amargofig.png`. Ambas existem no servidor.

**Correção sugerida:** Buscar os 8 IDs featured via `/api/products?ids=...` (ou um endpoint dedicado) e renderizar com dados do banco.

---

### BUG-02 — Galeria de variantes no detalhe de produto é placeholder não funcional ⚠️ MÉDIO

**Arquivo:** `src/pages/ProdutoPage.jsx:71–85`

```jsx
{[0, 1, 2].map(i => (
  <div onClick={() => setVariant(i)} ...>
    <img src={p.image} alt="" ... />  {/* mesma imagem nos 3 thumbnails */}
  </div>
))}
```

Três miniaturas idênticas são exibidas abaixo da imagem principal. Clicar em qualquer uma muda o estado `variant` mas não altera a imagem exibida. O usuário vê 3 thumbnails clicáveis que não têm efeito, o que gera confusão.

**Correção sugerida:** Remover os thumbnails até que o campo de variantes seja implementado, ou ocultar quando `variant images` não existirem.

---

### BUG-03 — Características do produto renderizadas como parágrafo ao invés de lista ⚠️ MÉDIO

**Arquivo:** `src/pages/ProdutoPage.jsx:47`

```js
content: p.caracteristicas?.join(' ') || p.description
```

O banco armazena `caracteristicas` como `TEXT[]` (array). O `pg` retorna isso como array JS. O `.join(' ')` une todos os itens em uma única string com espaços — o conteúdo vira um parágrafo ao invés de lista de tópicos.

**Correção sugerida:** Renderizar como `<ul><li>` quando `Array.isArray(p.caracteristicas)`.

---

### BUG-04 — Categoria "Todos" pode ser deletada pelo admin ⚠️ MÉDIO

**Arquivo:** `src/pages/admin/AdminCategoriesPage.jsx`  
**Backend:** `server/src/routes/admin-categories.js:42`

A categoria `{ id: "all", label: "Todos", ordem: 0 }` está armazenada no banco de dados e aparece na tabela do admin com um botão "Deletar". Se for excluída, o filtro "Todos" na página pública de produtos desaparece sem erro.

**Correção sugerida:** No frontend, não renderizar o botão "Deletar" para o ID `"all"`. No backend, adicionar guard na rota `DELETE /api/admin/categories/:id` bloqueando `id === 'all'`.

---

### BUG-05 — Busca sem debounce dispara chamada à API por tecla ⚠️ MÉDIO (Performance)

**Arquivos:**  
- `src/pages/ProdutosPage.jsx:63–68`  
- `src/pages/admin/AdminDashboardPage.jsx:75`

```jsx
onChange={e => { setQuery(e.target.value); setPage(1); }}
```

Cada tecla digitada atualiza o estado, o que aciona `fetchProducts()` via `useEffect`. Com latência de rede, múltiplas requisições podem retornar fora de ordem, exibindo resultados desatualizados.

**Correção sugerida:** Usar `useDebouncedValue` (300 ms) ou separar o estado do input do estado de query.

---

### BUG-06 — API retorna número de página inválido na resposta ⚠️ BAIXO

**Arquivo:** `server/src/routes/products.js:46`

Ao solicitar `?page=999`, a resposta inclui `{ page: 999, totalPages: 4, data: [] }`. O campo `page` não é clampado ao intervalo válido, o que pode confundir clientes que usam essa informação para renderizar a paginação.

**Correção sugerida:** No response, definir `page: Math.min(page, totalPages)`.

---

### BUG-07 — Cabeçalho "15 ml" hardcoded na tabela nutricional ⚠️ BAIXO

**Arquivo:** `src/pages/ProdutoPage.jsx:127`

```jsx
<th className="text-right py-1.5 font-bold">15 ml</th>
```

A unidade de porção é fixa em "15 ml" para todos os produtos. Produtos com porções diferentes (comprimidos, sprays, gotas) exibiriam a unidade errada.

**Correção sugerida:** Extrair a unidade da primeira linha de `nutri_porcoes` ou adicionar um campo `nutri_unidade` separado.

---

### BUG-08 — Cache de conteúdo CMS sem invalidação ⚠️ BAIXO

**Arquivo:** `src/hooks/usePageContent.js:3–9`

```js
const cache = {};  // módulo-level, persiste enquanto a aba estiver aberta
```

O cache nunca expira. Se o admin atualizar um texto via painel CMS, visitantes que já estão no site não verão a mudança até recarregar a página. Além disso, um teste revelou que o retorno da API pública é um objeto plano `{ key: value }` — o hook trata corretamente, mas o cache impede atualização reativa.

**Correção sugerida:** Adicionar TTL de 5–10 minutos no cache ou invalidar após um tempo.

---

## 2. Performance

### PERF-01 — Sem SSR nem metatags dinâmicas por página ⚠️ ALTO (SEO)

**Arquivo:** `index.html`

```html
<title>Laboratório Sobral</title>
<meta name="description" content="Laboratório Sobral — há mais de 100 anos...">
```

O título e description são estáticos e iguais em todas as páginas. Bots de busca (Google, Bing) recebem `<div id="root"></div>` vazio sem JavaScript — todo o conteúdo é invisível para crawlers.

**Consequência:** Páginas de produto, categoria e "Quem Somos" não têm indexação individual.  
**Correção sugerida:** Implementar `react-helmet-async` para metatags dinâmicas por rota, ou avaliar SSG/SSR (Astro, Next.js).

---

### PERF-02 — Imagens sem `loading="lazy"` ⚠️ MÉDIO

**Arquivo:** `src/pages/ProdutosPage.jsx:133`

```jsx
{products.map(p => <ProductCard ... />)}
```

A grade de produtos carrega as 12 imagens da página imediatamente, incluindo as que estão fora da viewport. Impacta o LCP (Largest Contentful Paint).

**Correção sugerida:** Adicionar `loading="lazy"` nas imagens do `ProductCard` (exceto a primeira).

---

### PERF-03 — Sem otimização de imagens ⚠️ MÉDIO

Imagens de produto servidas diretamente como PNG/JPEG sem:
- Conversão para WebP
- Atributos `srcset` / `sizes` para telas de alta resolução
- Compressão automática no upload

**Correção sugerida:** No endpoint de upload (`server/src/routes/upload.js`), usar `sharp` para converter para WebP e redimensionar para max 800px de largura antes de salvar.

---

### PERF-04 — Upload de hero slides salvo em pasta de produtos ⚠️ BAIXO

**Arquivo:** `server/src/routes/upload.js:9`

```js
destination: path.join(__dirname, '..', '..', '..', 'public', 'images', 'produtos'),
```

Imagens de hero slides e de conteúdo CMS são todas salvas em `/images/produtos/`. Isso mistura arquivos de tipos distintos numa mesma pasta, dificultando manutenção e backups seletivos.

**Correção sugerida:** Aceitar um parâmetro `type` (produtos | hero | cms) e salvar na subpasta correspondente.

---

## 3. SEO

### SEO-01 — Título e description estáticos em todas as páginas

Ver PERF-01. Sem metatags dinâmicas, o Google indexa todas as páginas com o mesmo título "Laboratório Sobral".

---

### SEO-02 — Sem Open Graph / Twitter Cards

Nenhuma metatag OG presente no `index.html`. Ao compartilhar links do site em redes sociais, não aparece imagem de preview nem descrição.

**Correção sugerida:** Adicionar `<meta property="og:title">`, `og:description`, `og:image` e `og:url` por página via `react-helmet-async`.

---

## 4. Segurança

### SEC-01 — Validação de tipo de arquivo no upload baseada em MIME do cliente ⚠️ BAIXO

**Arquivo:** `server/src/routes/upload.js:29`

```js
cb(null, allowedExts.includes(ext) && allowedMimes.includes(file.mimetype));
```

O `file.mimetype` é informado pelo browser — pode ser manipulado. Arquivos maliciosos renomeados para `.png` passariam se o MIME informado for `image/png`.

**Contexto:** O upload exige autenticação JWT, o que mitiga o risco significativamente. Para o escopo atual (admin único), o risco é baixo.  
**Correção sugerida:** Usar `file-type` (magic bytes) para validar o tipo real do arquivo no fileFilter.

---

### SEC-02 — JWT armazenado em localStorage ⚠️ BAIXO (trade-off)

**Arquivo:** `src/context/AuthContext.jsx`

JWT armazenado em `localStorage` é acessível via XSS. Em `HttpOnly cookie` seria mais seguro.

**Contexto:** A CSP `script-src 'self'` bloqueia scripts externos, reduzindo bastante a superfície de XSS. Para um painel admin simples, é aceitável.  
**Correção sugerida ao longo prazo:** Migrar para `HttpOnly cookie` + CSRF token.

---

## 5. Funcionalidades Admin Testadas

| Funcionalidade                    | Status        | Observação                                              |
|-----------------------------------|---------------|---------------------------------------------------------|
| Login JWT                         | ✅ OK          | Rate limit: 10 tentativas falhas/15min (correto)        |
| Listagem de produtos              | ✅ OK          | 46 produtos, paginação funcional                        |
| Toggle ativo/inativo              | ✅ OK          | PATCH `/api/admin/products/:id/ativo`                   |
| Formulário de edição de produto   | ✅ OK          | Carrega dados do banco, salva via PUT                   |
| Criação de produto                | ✅ OK          | POST com validação de campos obrigatórios               |
| Upload de imagem                  | ✅ OK          | Multer + auth + extensão + MIME validados               |
| Categorias — listagem             | ✅ OK          | Usa `/api/categories` pública                           |
| Categorias — criar                | ✅ OK          | POST `/api/admin/categories`                            |
| Categorias — deletar              | ⚠️ RISCO       | Ver BUG-04: "Todos" pode ser excluída                   |
| CMS de conteúdo (home/sobre)      | ✅ OK          | Upsert funcional, salva ao blur/botão                   |
| Hero Slides — CRUD                | ✅ OK          | 1 slide ativo, rota GET filtra por `ativo = true`       |
| Hero Slides — reordenar (DnD)     | ✅ OK          | Reorder via PUT `/api/admin/hero-slides/reorder`        |
| GET `/api/admin/categories`       | ❌ 404         | Rota não existe (não é necessária — frontend usa pública) |
| Formulário de contato (público)   | ✅ OK          | Validação server-side, rate limit 5/hora                |

---

## 6. APIs Verificadas em Produção

| Endpoint                        | Status | Observação                             |
|---------------------------------|--------|----------------------------------------|
| `GET /api/products`             | 200    | 46 produtos, 12/página, paginação OK   |
| `GET /api/products/:id`         | 200/404| Produto existente/inexistente correto  |
| `GET /api/categories`           | 200    | 6 categorias incluindo "all"           |
| `GET /api/hero-slides`          | 200    | 1 slide ativo                          |
| `GET /api/content/home`         | 200    | Objeto chave-valor correto             |
| `POST /api/auth/login`          | 200    | JWT retornado, rate limit ativo        |
| `GET /api/auth/me`              | 200    | Token válido                           |
| `GET /api/admin/products`       | 200    | 46 produtos, 20/página (admin)         |
| `GET /api/admin/categories`     | 404    | Rota não registrada no servidor        |
| `GET /api/admin/content/home`   | 200    | Array de `{key, value, type}`          |
| `GET /api/admin/hero-slides`    | 200    | Inclui campo `ativo` (diferente da pública) |
| `POST /api/contact`             | —      | Requer: nome, sobrenome, email, celular, assunto, mensagem |

---

## 7. Prioridade de Correção

| Prioridade | Problema                                              |
|------------|-------------------------------------------------------|
| 🔴 Alta     | BUG-01: Homepage com dados estáticos                  |
| 🔴 Alta     | PERF-01 / SEO-01: Sem SSR nem metatags dinâmicas      |
| 🟡 Média   | BUG-02: Thumbnails de variante não funcionais         |
| 🟡 Média   | BUG-03: `caracteristicas.join(' ')` ao invés de lista |
| 🟡 Média   | BUG-04: Categoria "Todos" deletável                   |
| 🟡 Média   | BUG-05: Busca sem debounce                            |
| 🟡 Média   | PERF-02: Imagens sem `loading="lazy"`                 |
| 🟡 Média   | PERF-03: Sem otimização WebP                          |
| 🟢 Baixa   | BUG-06: `page` não clampado                          |
| 🟢 Baixa   | BUG-07: "15 ml" hardcoded                            |
| 🟢 Baixa   | BUG-08: Cache sem TTL                                |
| 🟢 Baixa   | PERF-04: Upload em pasta errada                       |
| 🟢 Baixa   | SEO-02: Sem Open Graph                               |
| 🟢 Baixa   | SEC-01: MIME sem magic bytes                          |
| 🟢 Baixa   | SEC-02: JWT em localStorage                           |
