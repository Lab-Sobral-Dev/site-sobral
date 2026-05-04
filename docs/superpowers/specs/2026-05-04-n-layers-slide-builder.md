# Design: Slide Builder com N Camadas Arbitrárias

**Data:** 2026-05-04
**Status:** Aprovado — pronto para implementação

---

## Objetivo

Reformular o slide builder para suportar N camadas arbitrárias em vez de 2 slots fixos (logo + cta). Cada camada pode ser do tipo `image` (PNG exportado do PSD) ou `button` (botão clicável com texto, URL e cores). O admin manipula as camadas diretamente no canvas com drag, resize handles, reordenação por z-index e preview com animações antes de salvar.

---

## Fora do Escopo

- Adição manual de camadas no builder (camadas só vêm do PSD)
- Suporte a camadas de texto puro (texto editável sem ser botão)
- Blend modes, sombras ou efeitos de ajuste do Photoshop
- Múltiplas imagens de fundo por slide
- Histórico de undo/redo

---

## Modelo de Dados

### `hero_slides.layers` (JSONB)

**Antes:**
```json
{ "logo": { "image_url": "...", "x": 5, "y": 10, "width": 160 }, "cta": { "x": 48, "y": 75 } }
```

**Depois:**
```json
[
  {
    "id": "a1b2c3",
    "type": "image",
    "name": "background",
    "url": "/images/produtos/psd-background.png",
    "x": 0, "y": 0, "width": 1920, "height": 600,
    "visible": true,
    "animation": null
  },
  {
    "id": "d4e5f6",
    "type": "image",
    "name": "logo",
    "url": "/images/produtos/psd-logo.png",
    "x": 80, "y": 40, "width": 200, "height": 80,
    "visible": true,
    "animation": { "type": "fade", "delay": 0.3 }
  },
  {
    "id": "g7h8i9",
    "type": "button",
    "name": "cta",
    "text": "Ver catálogo",
    "href": "/produtos",
    "bgColor": "#FF6600",
    "textColor": "#FFFFFF",
    "x": 480, "y": 420, "width": 220, "height": 56,
    "visible": true,
    "animation": { "type": "slide-up", "delay": 0.6 }
  }
]
```

### Propriedades comuns a todos os tipos

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string (UUID v4 curto) | Identificador único da camada |
| `type` | `"image"` \| `"button"` | Discriminador de tipo |
| `name` | string | Nome da camada (editável no builder) |
| `x` | number (px) | Posição horizontal em pixels (ref. 1920px) |
| `y` | number (px) | Posição vertical em pixels (ref. 600px) |
| `width` | number (px) | Largura em pixels |
| `height` | number (px) | Altura em pixels |
| `visible` | boolean | Visibilidade da camada |
| `animation` | `null` \| `{ type, delay }` | Animação de entrada opcional |

### Propriedades específicas de `image`

| Campo | Tipo | Descrição |
|---|---|---|
| `url` | string | URL pública da imagem |

### Propriedades específicas de `button`

| Campo | Tipo | Descrição |
|---|---|---|
| `text` | string | Texto do botão |
| `href` | string | URL de destino |
| `bgColor` | string (hex) | Cor de fundo |
| `textColor` | string (hex) | Cor do texto |

### Animações disponíveis

- `"fade"` — aparece com opacidade 0 → 1
- `"slide-left"` — entra pela direita, desliza para esquerda
- `"slide-right"` — entra pela esquerda, desliza para direita
- `"slide-up"` — entra de baixo, sobe para posição final

### Canvas de referência

- **Largura:** 1920 px
- **Altura:** 600 px
- **Z-index:** posição no array (índice 0 = fundo, último = topo)
- **Renderização CSS:** `left: (x/1920)*100%`, `top: (y/600)*100%`, `width: (w/1920)*100%`, `height: (h/600)*100%`

---

## Backend

### Migration

O campo `layers` já é `JSONB` — nenhuma alteração de schema necessária para o array.

O campo `animado` (BOOLEAN) adicionado na migration 004 é **removido** — a animação agora é controlada por camada via `animation` no JSONB. Criar `server/migrations/005_drop_animado.sql`:

```sql
ALTER TABLE hero_slides DROP COLUMN IF EXISTS animado;
```

### `POST /api/admin/psd-import`

**Mudança:** retorna o array de camadas já no formato final, sem papéis.

**Resposta:**
```json
{
  "layers": [
    { "id": "uuid", "type": "image", "name": "background", "url": "/images/...", "x": 0, "y": 0, "width": 1920, "height": 600, "visible": true, "animation": null },
    { "id": "uuid", "type": "image", "name": "logo", "url": "/images/...", "x": 80, "y": 40, "width": 200, "height": 80, "visible": true, "animation": null }
  ]
}
```

A geração de `id` usa `crypto.randomUUID()` (Node 14.17+, sem dependência extra).

### `POST /api/admin/hero-slides`

Aceita `layers` como array JSON no body. Nenhuma mudança de rota necessária — o campo já é JSONB.

### `PUT /api/admin/hero-slides/:id`

Aceita `layers` como array JSON no body. Nenhuma mudança de rota necessária.

---

## Frontend

### AdminHeroSlidesPage.jsx

- **Remove:** `PsdModal` (chips Fundo/Logo/CTA/Ignorar), `assignments`, `psdLayers`, `handleOpenBuilder`
- **Simplifica `handlePsdUpload`:**
  1. Envia PSD para `POST /api/admin/psd-import`
  2. Recebe `{ layers }`
  3. Cria slide via `POST /api/admin/hero-slides` com `{ image_url: '', layers, ordem: slides.length + 1 }`
  4. Navega para `/admin/hero-slides/${slide.id}/editar`

### AdminSlideBuilderPage.jsx (reescrito)

**Layout:** 3 painéis — lista de camadas (esquerda), canvas (centro), propriedades (direita).

**Estado principal:**
```js
const [layers, setLayers] = useState([]);   // array de camadas
const [selectedId, setSelectedId] = useState(null); // id da camada selecionada
const [preview, setPreview] = useState(false); // modal de preview aberto
```

**Painel esquerdo — Lista de camadas:**
- Renderiza `layers` de cima para baixo (último no array = topo = aparece no início da lista)
- Drag-and-drop para reordenar via native pointer events (`pointerdown` na linha → `pointermove` mostra placeholder de destino → `pointerup` confirma reposicionamento no array)
- Toggle de olho (altera `visible`)
- Nome editável inline (clique duplo)
- Ícone diferente para `image` vs `button`
- Clique seleciona a camada (destaca em laranja)

**Painel central — Canvas:**
- `div` com `position: relative`, proporção 1920:600, escalado com `transform: scale()` para caber na tela
- Cada camada renderizada com `position: absolute`, coordenadas convertidas de px para `%`
- Clique em camada: `setSelectedId(layer.id)`
- **Drag para mover:** `pointerdown` na camada → `pointermove` no documento → atualiza `x`, `y`. O delta do pointer em px de tela deve ser dividido pelo `scale` do canvas antes de somar às coordenadas da camada (`scale = canvasEl.getBoundingClientRect().width / 1920`)
- **8 handles de resize:** `pointerdown` no handle → `pointermove` → atualiza `x`, `y`, `width`, `height` conforme direção do handle, dividindo o delta pelo mesmo `scale`. Handles: `n`, `ne`, `e`, `se`, `s`, `sw`, `w`, `nw`
- Camada selecionada: borda azul + 8 handles visíveis
- Toolbar: botão "Salvar" + botão "Pré-visualizar"

**Painel direito — Propriedades:**
- Campos numéricos: X, Y, Largura, Altura (em px)
- Toggle de visibilidade
- Se `type === 'image'`: botão "Converter para botão" (muda type, adiciona campos text/href/bgColor/textColor com valores padrão)
- Se `type === 'button'`: campos Texto, URL, color picker Cor de Fundo, color picker Cor do Texto
- Seção Animação: `<select>` com opções (Nenhuma / Fade / Slide Esquerda / Slide Direita / Slide Para Cima) + input de delay (segundos, step 0.1)

**Modal de Pré-visualização:**
- Overlay `fixed inset-0 bg-black/80 z-50`
- Slide renderizado em tamanho real ou escalado para caber na viewport
- Animações disparam ao abrir o modal (usa `key` para remount quando reabre)
- Botão "Repetir" reinicia as animações (remount via key change)
- Botão "Fechar" no canto superior direito

**Salvar:**
- `PUT /api/admin/hero-slides/:id` com `{ layers }` (array completo)

### HeroCarousel.jsx

Remove lógica de `logo`/`cta` fixos. Renderiza o array genérico:

```jsx
{slide.layers.filter(l => l.visible).map((layer, i) => {
  const style = {
    position: 'absolute',
    left: `${(layer.x / 1920) * 100}%`,
    top: `${(layer.y / 600) * 100}%`,
    width: `${(layer.width / 1920) * 100}%`,
    height: `${(layer.height / 600) * 100}%`,
    zIndex: i + 10,
    animationDelay: layer.animation ? `${layer.animation.delay}s` : undefined,
  };

  if (layer.type === 'image') {
    return <img key={layer.id} src={layer.url} alt={layer.name}
      style={style}
      className={layer.animation ? `layer-anim-${layer.animation.type}` : ''} />;
  }

  if (layer.type === 'button') {
    return (
      <a key={layer.id} href={layer.href}
        style={{ ...style, backgroundColor: layer.bgColor, color: layer.textColor }}
        className={`flex items-center justify-center rounded-lg font-bold text-sm px-4${layer.animation ? ` layer-anim-${layer.animation.type}` : ''}`}>
        {layer.text}
      </a>
    );
  }
})}
```

### index.css

Adiciona classe `layer-anim-slide-up` (as demais já existem):

```css
.layer-anim-slide-up {
  animation: slideUp 0.6s ease both;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## Mapa de Arquivos

| Arquivo | Ação |
|---|---|
| `server/migrations/005_drop_animado.sql` | Criar — DROP COLUMN animado |
| `server/src/routes/psd-import.js` | Modificar — retornar array com `id` e sem papéis |
| `server/src/routes/admin-hero-slides.js` | Modificar — aplicar normalizeLayers na leitura |
| `src/pages/admin/AdminHeroSlidesPage.jsx` | Modificar — remover PsdModal, simplificar handlePsdUpload |
| `src/pages/admin/AdminSlideBuilderPage.jsx` | Reescrever — N camadas, drag+resize, preview modal |
| `src/components/HeroCarousel.jsx` | Modificar — renderizar array genérico |
| `src/index.css` | Modificar — adicionar `layer-anim-slide-up` |

---

## Compatibilidade com Dados Existentes

Slides existentes com `layers = { logo: {...}, cta: {...} }` precisam ser migrados. O backend deve normalizar na leitura:

```js
function normalizeLayers(raw, imageUrl) {
  if (Array.isArray(raw)) return raw;
  // migração de formato antigo (objeto com logo/cta)
  const layers = [];
  // se havia image_url no slide (fundo), vira a primeira camada
  if (imageUrl) layers.push({ id: randomId(), type: 'image', name: 'fundo', url: imageUrl, x: 0, y: 0, width: 1920, height: 600, visible: true, animation: null });
  if (raw?.logo?.image_url) layers.push({ id: randomId(), type: 'image', name: 'logo', url: raw.logo.image_url, x: Math.round((raw.logo.x / 100) * 1920), y: Math.round((raw.logo.y / 100) * 600), width: raw.logo.width || 160, height: raw.logo.height || 80, visible: true, animation: null });
  if (raw?.cta) layers.push({ id: randomId(), type: 'button', name: 'cta', text: 'Ver catálogo', href: '/produtos', bgColor: '#FF6600', textColor: '#FFFFFF', x: Math.round((raw.cta.x / 100) * 1920), y: Math.round((raw.cta.y / 100) * 600), width: 220, height: 56, visible: true, animation: null });
  return layers;
}
```

Chamada: `normalizeLayers(slide.layers, slide.image_url)`.

Essa normalização é feita no `GET /api/admin/hero-slides` e `GET /api/hero-slides` para compatibilidade retroativa. O formato antigo nunca é reescrito — ao salvar pelo builder o formato novo substitui permanentemente.
