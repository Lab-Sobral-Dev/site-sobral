# Design: Slide Builder com Camadas Animadas

**Data:** 2026-05-04
**Status:** Aprovado — pronto para implementação

---

## Objetivo

Permitir que o admin componha cada hero slide com camadas posicionáveis (logo e botão CTA) sobre a imagem de fundo, escolhendo entre modo estático (sem animação) e animado (cada camada entra com uma animação configurável). A transição entre slides também é configurável globalmente.

---

## Fora do escopo

- Camada de texto livre (título/subtítulo) — poderá vir numa Spec 3
- Preview mobile no builder
- Animações de saída (somente entrada)
- Histórico de versões dos slides

---

## Banco de dados

### Alterações em `hero_slides`

```sql
ALTER TABLE hero_slides
  ADD COLUMN animado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN layers  JSONB   NOT NULL DEFAULT '{}';
```

### Estrutura do JSONB `layers`

```json
{
  "logo": {
    "image_url": "/images/logo-calciolax.png",
    "x": 75,
    "y": 12,
    "width": 80,
    "animation": "fade",
    "delay": 0.3,
    "visible": true
  },
  "cta": {
    "text": "Ver produtos",
    "link": "/produtos",
    "x": 50,
    "y": 78,
    "animation": "slide-up",
    "delay": 0.5,
    "visible": true
  }
}
```

- `x` e `y` em **porcentagem** do canvas (0–100) — responsivos por natureza
- `animation`: `"fade"` | `"slide-up"` | `"zoom"` | `"slide-left"` | `"none"`
- Camadas ausentes no JSON são ignoradas silenciosamente

### Transição global

Reutiliza a tabela `page_content` existente:

| page | key | type | valor padrão |
|------|-----|------|-------------|
| `carousel` | `transition` | `text` | `fade` |

Valores válidos: `"fade"` | `"slide"` | `"cut"`

---

## Backend

### Rotas modificadas

**`GET /api/hero-slides`** — passa a retornar `animado` e `layers`:
```json
[{ "id": 1, "image_url": "...", "ordem": 1, "animado": true, "layers": { ... } }]
```

**`GET /api/admin/hero-slides`** — idem.

**`POST /api/admin/hero-slides`** — aceita `animado` e `layers` opcionais no body.

### Nova rota

**`PUT /api/admin/hero-slides/:id`** — salva o estado completo do builder:

```js
// Body: { animado, layers }
// Retorna: slide atualizado
```

### Transição global

Reutiliza as rotas CMS já existentes:
- `GET /api/content/carousel` → retorna `{ transition: "fade" }`
- `PUT /api/admin/content/carousel/transition` → salva novo valor

---

## Frontend — HeroCarousel.jsx (site público)

### Transição entre slides

Classe CSS dinâmica no container baseada na config global:

| valor | comportamento |
|-------|--------------|
| `fade` | `opacity` 0→1 com `transition: opacity 0.6s ease` |
| `slide` | `translateX` com `transition: transform 0.5s ease` |
| `cut` | sem transição |

### Renderização de camadas

Cada camada é um `<div>` com `position: absolute`, `left: x%`, `top: y%`.

**Modo estático** (`animado = false`): camadas visíveis imediatamente, sem animação.

**Modo animado** (`animado = true`): camada recebe classe `anim-{animation}` e `style="animation-delay: {delay}s"`. As classes são definidas em CSS puro no componente ou em `index.css`.

Animações disponíveis:

| classe | efeito |
|--------|--------|
| `anim-fade` | opacity 0 → 1 |
| `anim-slide-up` | translateY(24px) + opacity → normal |
| `anim-zoom` | scale(0.7) + opacity → normal |
| `anim-slide-left` | translateX(30px) + opacity → normal |

### Fallback

- Se `layers` estiver vazio: renderiza só a imagem de fundo (comportamento atual preservado)
- Se a API falhar: exibe `/images/hero-banner.png` (comportamento atual preservado)

---

## Frontend — Admin

### AdminHeroSlidesPage.jsx (modificado)

- Cada item da lista ganha botão **"Editar"** que navega para `/admin/hero-slides/:id/editar`
- Upload e demais funcionalidades permanecem iguais

### AdminSlideBuilderPage.jsx (novo)

Rota: `/admin/hero-slides/:id/editar`

**Painel esquerdo — Slide:**
- Toggle `Animado / Estático` (altera `slide.animado`)
- Seletor de transição global (fade / deslizamento / corte) — salva via CMS
- Lista de camadas com ícone de visibilidade (toggle `visible`)

**Painel central — Canvas:**
- Exibe a imagem de fundo do slide
- Camadas renderizadas como elementos `absolute` arrastáveis via `pointermove` nativo
- Drag: `pointerdown` → captura → `pointermove` → converte posição para `%` → `pointerup` → solta
- Handle de redimensionamento no canto inferior direito da camada logo (altera `width`)
- Nenhuma biblioteca adicional necessária

**Painel direito — Propriedades da camada selecionada:**

Para camada **logo**:
- Upload de imagem (reutiliza `/api/upload`)
- Campo `width` (px)
- Chips de animação (fade / ↑ up / ⊙ zoom / ← left / nenhuma)
- Campo `delay` (segundos)

Para camada **cta**:
- Campo texto do botão
- Campo link (URL relativa)
- Chips de animação
- Campo `delay`

**Salvar:** botão fixo no topo direito — chama `PUT /api/admin/hero-slides/:id` com `{ animado, layers }`.

---

## Migrations

```
server/migrations/004_slide_builder.sql
```

```sql
ALTER TABLE hero_slides
  ADD COLUMN IF NOT EXISTS animado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS layers  JSONB   NOT NULL DEFAULT '{}';

INSERT INTO page_content (page, key, value, type)
VALUES ('carousel', 'transition', 'fade', 'text')
ON CONFLICT (page, key) DO NOTHING;
```

---

## Mapa de arquivos

| Arquivo | Ação |
|---------|------|
| `server/migrations/004_slide_builder.sql` | Criar |
| `server/src/routes/admin-hero-slides.js` | Modificar — adicionar `PUT /:id` |
| `server/src/routes/hero-slides.js` | Modificar — retornar `animado` e `layers` |
| `server/src/routes/admin-products.js` | — |
| `src/components/HeroCarousel.jsx` | Modificar — transições + camadas animadas |
| `src/pages/admin/AdminHeroSlidesPage.jsx` | Modificar — adicionar botão "Editar" |
| `src/pages/admin/AdminSlideBuilderPage.jsx` | Criar |
| `src/App.jsx` | Modificar — adicionar rota `/admin/hero-slides/:id/editar` |
| `src/index.css` | Modificar — adicionar classes `anim-*` e `transition-*` |
