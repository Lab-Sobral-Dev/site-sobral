# Design: CMS de Páginas + Carrossel Hero

**Data:** 2026-04-30
**Escopo:** Spec 1 de 2 — CMS de conteúdo editável + carrossel simples do hero

---

## Objetivo

Permitir que o admin edite textos, imagens e slides do hero sem tocar no código-fonte. O site continua funcionando normalmente com os textos hardcoded como fallback caso a API falhe.

---

## Fora do escopo (Spec 2)

- Hero Slide Builder com editor visual drag-and-drop de camadas animadas (layers do PSD)
- Animações CSS por camada individual

---

## Banco de dados

### Tabela `page_content`

```sql
CREATE TABLE page_content (
  id         SERIAL PRIMARY KEY,
  page       TEXT NOT NULL,
  key        TEXT NOT NULL,
  value      TEXT,
  type       TEXT NOT NULL DEFAULT 'text', -- 'text' | 'richtext' | 'image'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (page, key)
);
```

**Campos indexados por página:**

| page | key | type | Descrição |
|------|-----|------|-----------|
| `home` | `historia_titulo` | text | Título da seção história |
| `home` | `historia_subtitulo` | text | Subtítulo laranja |
| `home` | `historia_texto_1` | richtext | 1º parágrafo da história |
| `home` | `historia_texto_2` | richtext | 2º parágrafo da história |
| `home` | `historia_texto_3` | richtext | 3º parágrafo da história |
| `home` | `historia_imagem` | image | Foto lateral da seção história |
| `home` | `linhas_titulo` | text | Título "Nossas Linhas" |
| `home` | `marca_tradicionais_imagem` | image | Logo Linha Tradicionais |
| `home` | `marca_calciolax_imagem` | image | Logo Família Calciolax |
| `home` | `marca_movimex_imagem` | image | Logo Movimex |
| `home` | `marca_oleos_imagem` | image | Logo Óleos Sobral |
| `sobre` | `missao` | richtext | Texto da missão |
| `sobre` | `visao` | richtext | Texto da visão |
| `sobre` | `valores` | richtext | Texto dos valores |
| `sobre` | `historia_titulo` | text | Título principal |
| `sobre` | `historia_subtitulo` | text | Subtítulo laranja |
| `sobre` | `historia_texto_1` | richtext | 1º parágrafo |
| `sobre` | `historia_texto_2` | richtext | 2º parágrafo |
| `sobre` | `historia_texto_3` | richtext | 3º parágrafo |
| `sobre` | `historia_imagem` | image | Foto lateral |
| `contato` | `titulo` | text | Título da página |
| `contato` | `subtitulo` | richtext | Texto introdutório |
| `contato` | `email` | text | E-mail de contato exibido |
| `contato` | `telefone` | text | Telefone exibido |

### Tabela `hero_slides`

```sql
CREATE TABLE hero_slides (
  id         SERIAL PRIMARY KEY,
  image_url  TEXT NOT NULL,
  ordem      INT NOT NULL DEFAULT 99,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Backend

### Rotas públicas

```
GET /api/content/:page
  → Retorna objeto { key: value } com todos os campos da página
  → Campos de tipo 'image' retornam URL relativa (/images/...)
  → Usado pelo frontend para hidratar os componentes

GET /api/hero-slides
  → Retorna slides com ativo=true, ordenados por campo `ordem` ASC
```

### Rotas admin (requerem requireAuth)

```
GET    /api/admin/content/:page          → lista todos os campos da página
PUT    /api/admin/content/:page/:key     → { value } — upsert de um campo
POST   /api/admin/hero-slides            → { image_url, ordem }
PATCH  /api/admin/hero-slides/:id/ativo  → toggle ativo
PUT    /api/admin/hero-slides/reorder    → { ids: [id1, id2, ...] } — reordena todos de uma vez (usado pelo DnD)
DELETE /api/admin/hero-slides/:id        → remove slide
```

O upload de imagem reutiliza `POST /api/upload` já existente (retorna `{ url }`).

---

## Frontend

### Estratégia de hidratação

Cada página faz fetch ao montar e mescla com os defaults hardcoded:

```js
const [content, setContent] = useState(DEFAULTS_HOME);

useEffect(() => {
  fetch('/api/content/home')
    .then(r => r.json())
    .then(data => setContent(prev => ({ ...prev, ...data })))
    .catch(() => {}); // silencia — fallback para DEFAULTS
}, []);
```

Os textos atuais hardcoded viram o objeto `DEFAULTS_*` em cada página. O site continua funcionando sem o backend.

### Rich text

Renderizado com `dangerouslySetInnerHTML`. Sem risco XSS porque o conteúdo vem exclusivamente do admin autenticado.

### Carrossel do hero

- Substituição da `<img>` estática por componente `<HeroCarousel>`
- Busca `GET /api/hero-slides` ao montar
- Se retornar 0 ou 1 slides: exibe a imagem normalmente (sem UI de carrossel)
- Se retornar 2+ slides: exibe carrossel com:
  - Autoplay a cada 5 segundos (pausar no hover)
  - Setas ‹ › nas laterais
  - Pontos de navegação na base
  - Transição CSS suave (fade ou slide, 400ms)
- Fallback: se a API falhar, exibe `/images/hero-banner.png` atual

---

## Admin UI

### Sidebar — nova seção "Conteúdo"

```
CATÁLOGO
  Produtos
  Categorias

CONTEÚDO
  Home
  Quem Somos
  Fale Conosco
  Hero Slides
```

### Página de edição por seção

- Campos agrupados por seção visual (ex: "Seção História", "Nossas Linhas")
- `type: 'text'` → `<input type="text">`
- `type: 'richtext'` → editor TipTap (bold, italic, underline, listas)
- `type: 'image'` → exibe URL atual + botão "Trocar" que abre file picker → faz upload → atualiza campo
- Cada campo salva individualmente via `PUT /api/admin/content/:page/:key` (sem botão "Salvar tudo" — save on blur/change)

### Gerenciador de Hero Slides

- Lista de slides com thumbnail, status (ativo/inativo) e ordem
- Drag-and-drop para reordenar via `@dnd-kit/sortable`
- Toggle ativo/inativo inline
- Botão "+ Novo slide" → abre modal com file picker → faz upload → cria slide
- Botão Excluir com confirmação

---

## Dependências novas

| Pacote | Motivo |
|--------|--------|
| `@tiptap/react` + `@tiptap/starter-kit` | Editor rich text |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop dos slides |

---

## Não incluído nesta spec

- Histórico de revisões de conteúdo
- Preview ao vivo antes de publicar
- Permissões por página (todos os admins editam tudo)
- Internacionalização (conteúdo só em pt-BR)
