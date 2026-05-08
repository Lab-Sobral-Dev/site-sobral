# Slide Builder v2 — N Camadas Arbitrárias Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reformular o slide builder para suportar N camadas arbitrárias (em vez de 2 slots fixos `logo`/`cta`). Cada camada é `image` ou `button`, com posição/tamanho em pixels (ref. 1920×600), animação opcional, drag e 8 handles de resize no canvas, lista lateral com reorder por z-index e modal de preview.

**Architecture:** `hero_slides.layers` passa de objeto `{ logo, cta }` para array `[{ id, type, x, y, width, height, ... }]`. Coluna `animado` é removida — animação agora é por camada. PSD import devolve diretamente o array no formato final (sem papéis Fundo/Logo/CTA). `HeroCarousel.jsx`, `AdminHeroSlidesPage.jsx` e `AdminSlideBuilderPage.jsx` são reescritos. Backend ganha helper `normalizeLayers()` para converter slides salvos no formato antigo na leitura (compatibilidade retroativa).

**Tech Stack:** Node.js 20 + Express 4 + PostgreSQL 16 (driver `pg`) + biblioteca `psd` (já instalada) | React 18 + Vite + Tailwind CSS + React Router v6

**Reference spec:** `docs/superpowers/specs/2026-05-04-n-layers-slide-builder.md`

**Project conventions:** sem framework de testes — verificação manual via `npm run dev` + curl/Invoke-RestMethod + queries SQL diretas. Commits em pt-BR, padrão Conventional Commits, push para `main` ao final de cada task.

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `src/index.css` | Modificar — adicionar `.layer-anim-slide-right` |
| `server/src/utils/normalizeLayers.js` | Criar — converte formato antigo para array novo |
| `server/src/routes/admin-hero-slides.js` | Modificar — POST aceita `layers`, PUT só requer `layers`, GET aplica `normalizeLayers` |
| `server/src/routes/hero-slides.js` | Modificar — remove `animado` do SELECT, aplica `normalizeLayers` |
| `server/src/routes/psd-import.js` | Reescrever — retorna array no formato novo (px ref. 1920×600) |
| `src/components/HeroCarousel.jsx` | Reescrever — renderiza array genérico (image/button) |
| `src/pages/admin/AdminHeroSlidesPage.jsx` | Modificar — remove `PsdModal`, `ROLES`, `assignments`; simplifica `handlePsdUpload`; remove badge animado/estático |
| `src/pages/admin/AdminSlideBuilderPage.jsx` | Reescrever — 3 painéis, drag+resize, modal preview |
| `server/migrations/005_drop_animado.sql` | Criar — `ALTER TABLE hero_slides DROP COLUMN animado` |

---

## Task 1: CSS — Adicionar animação `slide-right`

**Files:**
- Modify: `src/index.css:159-166`

- [ ] **Step 1: Adicionar a classe `.layer-anim-slide-right` logo abaixo de `.layer-anim-slide-left`**

Localizar este bloco em `src/index.css` (linha ~159):

```css
  .layer-anim-slide-left {
    animation: layerSlideLeft 0.6s ease both;
  }
  @keyframes layerSlideLeft {
    from { opacity: 0; transform: translateX(30px); }
    to   { opacity: 1; transform: translateX(0);    }
  }

  .layer-anim-none {}
```

Substituir por:

```css
  .layer-anim-slide-left {
    animation: layerSlideLeft 0.6s ease both;
  }
  @keyframes layerSlideLeft {
    from { opacity: 0; transform: translateX(30px); }
    to   { opacity: 1; transform: translateX(0);    }
  }

  .layer-anim-slide-right {
    animation: layerSlideRight 0.6s ease both;
  }
  @keyframes layerSlideRight {
    from { opacity: 0; transform: translateX(-30px); }
    to   { opacity: 1; transform: translateX(0);     }
  }

  .layer-anim-none {}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "style: adicionar animação layer-anim-slide-right"
git push origin main
```

---

## Task 2: Backend — Helper `normalizeLayers` (compat retroativo)

**Files:**
- Create: `server/src/utils/normalizeLayers.js`

- [ ] **Step 1: Criar `server/src/utils/normalizeLayers.js`**

Conteúdo completo:

```js
const crypto = require('crypto');

// Canvas de referência usado por todo o sistema.
const CANVAS_W = 1920;
const CANVAS_H = 600;

function newId() {
  return crypto.randomUUID();
}

/**
 * Converte qualquer formato de `layers` para o array novo:
 *   [{ id, type, name, url|text/href/bgColor/textColor, x, y, width, height, visible, animation }]
 *
 * - Se já for array, devolve sem mudança.
 * - Se for objeto antigo `{ logo, cta }`, converte para array.
 * - imageUrl é a coluna `image_url` do slide; se presente e o objeto antigo for usado,
 *   vira a primeira camada (fundo).
 */
function normalizeLayers(raw, imageUrl) {
  if (Array.isArray(raw)) return raw;

  const layers = [];

  if (imageUrl) {
    layers.push({
      id: newId(),
      type: 'image',
      name: 'fundo',
      url: imageUrl,
      x: 0, y: 0,
      width: CANVAS_W, height: CANVAS_H,
      visible: true,
      animation: null,
    });
  }

  if (raw && typeof raw === 'object') {
    if (raw.logo && raw.logo.image_url) {
      // formato antigo: x/y em %, width em px (sem ref de canvas).
      const x = Math.round(((raw.logo.x ?? 50) / 100) * CANVAS_W);
      const y = Math.round(((raw.logo.y ?? 50) / 100) * CANVAS_H);
      const width = raw.logo.width || 160;
      const height = raw.logo.width || 160; // builder antigo usava largura como altura.
      layers.push({
        id: newId(),
        type: 'image',
        name: 'logo',
        url: raw.logo.image_url,
        x: Math.max(0, x - Math.round(width / 2)),
        y: Math.max(0, y - Math.round(height / 2)),
        width, height,
        visible: raw.logo.visible !== false,
        animation: raw.logo.animation && raw.logo.animation !== 'none'
          ? { type: raw.logo.animation, delay: raw.logo.delay ?? 0 }
          : null,
      });
    }
    if (raw.cta) {
      const width = 220, height = 56;
      const x = Math.round(((raw.cta.x ?? 50) / 100) * CANVAS_W);
      const y = Math.round(((raw.cta.y ?? 78) / 100) * CANVAS_H);
      layers.push({
        id: newId(),
        type: 'button',
        name: 'cta',
        text: raw.cta.text || 'Ver catálogo',
        href: raw.cta.link || '/produtos',
        bgColor: '#F37021',
        textColor: '#FFFFFF',
        x: Math.max(0, x - Math.round(width / 2)),
        y: Math.max(0, y - Math.round(height / 2)),
        width, height,
        visible: raw.cta.visible !== false,
        animation: raw.cta.animation && raw.cta.animation !== 'none'
          ? { type: raw.cta.animation, delay: raw.cta.delay ?? 0 }
          : null,
      });
    }
  }

  return layers;
}

module.exports = { normalizeLayers, newId, CANVAS_W, CANVAS_H };
```

- [ ] **Step 2: Verificação manual rápida via Node REPL**

Rodar a partir de `server/`:

```powershell
cd server
node -e "const { normalizeLayers } = require('./src/utils/normalizeLayers'); console.log(JSON.stringify(normalizeLayers([{ id:'x', type:'image' }], '/img.png'), null, 2));"
```

Esperado: imprime o array `[{ id:'x', type:'image' }]` sem alteração (entrada já é array).

```powershell
node -e "const { normalizeLayers } = require('./src/utils/normalizeLayers'); console.log(JSON.stringify(normalizeLayers({ logo:{ image_url:'/l.png', x:75, y:12, width:80 }, cta:{ x:50, y:78, text:'Ver' } }, '/bg.png'), null, 2));"
```

Esperado: imprime array com 3 camadas (`fundo`, `logo`, `cta`) em coordenadas px com `id` UUID.

- [ ] **Step 3: Commit**

```bash
git add server/src/utils/normalizeLayers.js
git commit -m "feat: adicionar helper normalizeLayers para compat com formato antigo"
git push origin main
```

---

## Task 3: Backend — `admin-hero-slides.js` aceita `layers` no POST/PUT e normaliza GET

**Files:**
- Modify: `server/src/routes/admin-hero-slides.js`

- [ ] **Step 1: Substituir o conteúdo de `server/src/routes/admin-hero-slides.js`**

Conteúdo completo do arquivo após a mudança:

```js
const { Router } = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { normalizeLayers } = require('../utils/normalizeLayers');
const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, image_url, ordem, ativo, created_at, layers FROM hero_slides ORDER BY ordem ASC, id ASC');
    const out = rows.map(r => ({ ...r, layers: normalizeLayers(r.layers, r.image_url) }));
    res.json(out);
  } catch (err) {
    console.error('GET /api/admin/hero-slides:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/', async (req, res) => {
  const { image_url, ordem, layers } = req.body;
  if (typeof image_url !== 'string') return res.status(400).json({ error: 'image_url deve ser string.' });
  if (layers !== undefined && !Array.isArray(layers)) return res.status(400).json({ error: 'layers deve ser array.' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO hero_slides (image_url, ordem, layers) VALUES ($1, $2, $3) RETURNING *',
      [image_url, ordem ?? 99, JSON.stringify(layers ?? [])]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/admin/hero-slides:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /reorder deve vir ANTES de PATCH /:id/ativo para evitar conflito de rota
router.put('/reorder', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids deve ser array.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await Promise.all(
      ids.map((id, index) =>
        client.query('UPDATE hero_slides SET ordem = $1 WHERE id = $2', [index + 1, id])
      )
    );
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('PUT /api/admin/hero-slides/reorder:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const { layers } = req.body;
  if (!Array.isArray(layers)) return res.status(400).json({ error: 'layers deve ser array.' });
  try {
    const { rows } = await pool.query(
      'UPDATE hero_slides SET layers = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(layers), req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Slide não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/admin/hero-slides/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.patch('/:id/ativo', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE hero_slides SET ativo = NOT ativo WHERE id = $1 RETURNING id, ativo',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Slide não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/admin/hero-slides/:id/ativo:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM hero_slides WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Slide não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/hero-slides/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
```

Mudanças-chave:
- GET: `SELECT` explícito (omite `animado`) + aplica `normalizeLayers` no map.
- POST: aceita `layers` (array opcional), inserindo no DB. Validação em `image_url` agora é tipo, não vazio.
- PUT `/:id`: removeu campo `animado`. Aceita só `layers` (array obrigatório).

- [ ] **Step 2: Verificar — backend ainda sobe**

Rodar a partir da raiz do projeto:

```powershell
cd server
npm run dev
```

Esperado: log `Server rodando na porta 3001` (ou similar). Sem erros de require.

Encerrar com `Ctrl+C`.

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/admin-hero-slides.js
git commit -m "feat: admin-hero-slides aceita layers como array e normaliza no GET"
git push origin main
```

---

## Task 4: Backend — `hero-slides.js` (público) usa `normalizeLayers`

**Files:**
- Modify: `server/src/routes/hero-slides.js`

- [ ] **Step 1: Substituir o conteúdo de `server/src/routes/hero-slides.js`**

Conteúdo completo:

```js
const { Router } = require('express');
const pool = require('../db');
const { normalizeLayers } = require('../utils/normalizeLayers');
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, image_url, ordem, layers FROM hero_slides WHERE ativo = true ORDER BY ordem ASC, id ASC'
    );
    const out = rows.map(r => ({ ...r, layers: normalizeLayers(r.layers, r.image_url) }));
    res.json(out);
  } catch (err) {
    console.error('GET /api/hero-slides:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
```

Mudanças-chave: removeu `animado` do `SELECT`; aplica `normalizeLayers`.

- [ ] **Step 2: Verificar resposta da rota pública**

Com o backend rodando (`cd server; npm run dev`), em outro terminal:

```powershell
Invoke-RestMethod -Uri http://localhost:3001/api/hero-slides | ConvertTo-Json -Depth 6
```

Esperado: JSON com slides; o campo `layers` é um array (vazio `[]` se nenhum slide foi configurado, ou contém objetos com `id`, `type`, `x`, `y`, `width`, `height`, `visible`, `animation`).

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/hero-slides.js
git commit -m "feat: rota pública hero-slides aplica normalizeLayers e omite animado"
git push origin main
```

---

## Task 5: Backend — `psd-import.js` retorna array no formato novo

**Files:**
- Modify: `server/src/routes/psd-import.js`

- [ ] **Step 1: Substituir o conteúdo completo de `server/src/routes/psd-import.js`**

Conteúdo completo:

```js
const { Router } = require('express');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const PSD        = require('psd');
const requireAuth = require('../middleware/requireAuth');
const { newId, CANVAS_W, CANVAS_H } = require('../utils/normalizeLayers');

const router = Router();
router.use(requireAuth);

const tmpDir = path.join(__dirname, '..', '..', 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const publicImgDir = path.join(__dirname, '..', '..', '..', 'public', 'images', 'produtos');
if (!fs.existsSync(publicImgDir)) fs.mkdirSync(publicImgDir, { recursive: true });

const upload = multer({
  dest: tmpDir,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ext === '.psd');
  },
});

function slugify(str) {
  return (str || 'layer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'layer';
}

router.post('/', (req, res) => {
  upload.single('psd')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Arquivo ausente ou extensão inválida (apenas .psd).' });

    const tmpPath = req.file.path;
    try {
      const psd = PSD.fromFile(tmpPath);
      await psd.parse();

      const psdW = psd.header.width;
      const psdH = psd.header.height;
      const layers = [];

      // Camada de fundo: o canvas do PSD inteiro renderizado.
      const bgFilename = `psd-bg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.png`;
      const bgOutPath = path.join(publicImgDir, bgFilename);
      const tree = psd.tree();
      const composite = typeof tree.toPng === 'function' ? tree.toPng() : null;
      if (composite) {
        fs.writeFileSync(bgOutPath, composite);
        layers.push({
          id: newId(),
          type: 'image',
          name: 'fundo',
          url: `/images/produtos/${bgFilename}`,
          x: 0, y: 0,
          width: CANVAS_W, height: CANVAS_H,
          visible: true,
          animation: null,
        });
      }

      // Camadas individuais
      for (const layer of psd.layers) {
        const w = typeof layer.width  === 'function' ? layer.width()  : layer.width;
        const h = typeof layer.height === 'function' ? layer.height() : layer.height;
        if (!w || !h) continue;
        const slug     = slugify(layer.name);
        const filename = `psd-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.png`;
        const outPath  = path.join(publicImgDir, filename);
        if (typeof layer.image.saveAsPng === 'function') {
          await layer.image.saveAsPng(outPath);
        } else {
          const buf = layer.image.toPng();
          fs.writeFileSync(outPath, buf);
        }
        layers.push({
          id: newId(),
          type: 'image',
          name: layer.name || 'Camada',
          url: `/images/produtos/${filename}`,
          x: Math.round((layer.left / psdW) * CANVAS_W),
          y: Math.round((layer.top  / psdH) * CANVAS_H),
          width: Math.round((w / psdW) * CANVAS_W),
          height: Math.round((h / psdH) * CANVAS_H),
          visible: true,
          animation: null,
        });
      }

      res.json({ layers });
    } catch (e) {
      console.error('POST /api/admin/psd-import:', e.message);
      res.status(422).json({ error: 'Não foi possível processar o PSD.' });
    } finally {
      fs.unlink(tmpPath, () => {});
    }
  });
});

module.exports = router;
```

Mudanças-chave:
- Importa `newId`, `CANVAS_W`, `CANVAS_H` do helper.
- Gera camada de **fundo** automática (composição do PSD inteiro) como primeira camada.
- Cada camada do PSD é convertida para coordenadas px **referenciadas a 1920×600** (multiplicador `CANVAS_W/psdW`).
- Cada camada tem `id` UUID, `type: 'image'`, `visible: true`, `animation: null`.

- [ ] **Step 2: Commit**

```bash
git add server/src/routes/psd-import.js
git commit -m "feat: psd-import retorna array de camadas no formato novo (px ref. 1920x600)"
git push origin main
```

---

## Task 6: Frontend — `HeroCarousel.jsx` renderiza array genérico

**Files:**
- Modify: `src/components/HeroCarousel.jsx`

- [ ] **Step 1: Substituir o conteúdo completo de `src/components/HeroCarousel.jsx`**

Conteúdo completo:

```jsx
import { useState, useEffect, useCallback } from 'react';

const CANVAS_W = 1920;
const CANVAS_H = 600;

function Layer({ layer }) {
  if (!layer.visible) return null;

  const style = {
    position: 'absolute',
    left:   `${(layer.x / CANVAS_W) * 100}%`,
    top:    `${(layer.y / CANVAS_H) * 100}%`,
    width:  `${(layer.width  / CANVAS_W) * 100}%`,
    height: `${(layer.height / CANVAS_H) * 100}%`,
    animationDelay: layer.animation ? `${layer.animation.delay ?? 0}s` : undefined,
  };

  const animClass = layer.animation ? `layer-anim-${layer.animation.type}` : '';

  if (layer.type === 'image') {
    return (
      <img
        src={layer.url}
        alt={layer.name || ''}
        style={style}
        className={animClass}
        draggable={false}
      />
    );
  }

  if (layer.type === 'button') {
    return (
      <a
        href={layer.href || '/produtos'}
        style={{ ...style, backgroundColor: layer.bgColor, color: layer.textColor }}
        className={`flex items-center justify-center rounded-lg font-bold text-sm px-4 whitespace-nowrap shadow-lg ${animClass}`}
      >
        {layer.text}
      </a>
    );
  }

  return null;
}

export default function HeroCarousel() {
  const [slides,     setSlides]     = useState([]);
  const [idx,        setIdx]        = useState(0);
  const [animKey,    setAnimKey]    = useState(0);
  const [paused,     setPaused]     = useState(false);
  const [transition, setTransition] = useState('fade');

  useEffect(() => {
    fetch('/api/hero-slides').then(r => r.json()).then(setSlides).catch(() => {});
    fetch('/api/content/carousel').then(r => r.json()).then(d => setTransition(d.transition ?? 'fade')).catch(() => {});
  }, []);

  const goTo = useCallback((i) => {
    setIdx(i);
    setAnimKey(k => k + 1);
  }, []);

  const next = useCallback(() => goTo((idx + 1) % slides.length), [idx, slides.length, goTo]);
  const prev = useCallback(() => goTo((idx - 1 + slides.length) % slides.length), [idx, slides.length, goTo]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [slides.length, paused, next]);

  if (!slides.length) {
    return (
      <section className="w-full bg-bg leading-[0]">
        <img src="/images/hero-banner.png" alt="Laboratório Sobral" className="w-full h-auto block" />
      </section>
    );
  }

  const slide = slides[idx];
  const layers = Array.isArray(slide.layers) ? slide.layers : [];

  return (
    <section
      className="w-full bg-bg leading-[0] relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        key={`${idx}-${animKey}`}
        className={`relative slide-enter-${transition}`}
        style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
      >
        {layers.map(layer => <Layer key={layer.id} layer={layer} />)}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Slide anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-orange flex items-center justify-center text-[22px] shadow transition-all z-10 leading-none"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Próximo slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-orange flex items-center justify-center text-[22px] shadow transition-all z-10 leading-none"
          >
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full border-none transition-all ${i === idx ? 'bg-orange scale-125' : 'bg-white/70 hover:bg-white'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
```

Mudanças-chave:
- Removeu `SlideLayer` antigo (logo/cta hardcoded) e substituiu por `Layer` genérico.
- Removeu o fallback `<img src={slide.image_url}>` — agora a imagem de fundo é a primeira camada.
- Container do slide tem `aspect-ratio: 1920/600` para escalar corretamente.
- Não usa mais `slide.animado`; cada `layer.animation` é independente.

- [ ] **Step 2: Verificar visualmente**

```powershell
npm run dev
```

Abrir `http://localhost:5173/`. Esperado: o carrossel renderiza usando o slide existente. Se o slide foi salvo no formato antigo com `image_url` apontando para `/images/hero-banner.png`, o `normalizeLayers` no backend deve produzir uma camada de fundo equivalente, e o carrossel mostra a imagem.

Se o carrossel exibir uma área vazia, abrir DevTools → Network → `api/hero-slides`: confirmar que o array `layers` veio populado. Se vazio, há um slide no DB sem `image_url` nem `layers` — pular esse passo, ele será corrigido na Task 7 quando criarmos novos slides.

Encerrar dev server com `Ctrl+C`.

- [ ] **Step 3: Commit**

```bash
git add src/components/HeroCarousel.jsx
git commit -m "feat: HeroCarousel renderiza array genérico de camadas (image/button)"
git push origin main
```

---

## Task 7: Frontend — `AdminHeroSlidesPage.jsx` simplificada

**Files:**
- Modify: `src/pages/admin/AdminHeroSlidesPage.jsx`

- [ ] **Step 1: Substituir o conteúdo completo do arquivo**

Conteúdo completo:

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../context/AuthContext';

function SortableSlide({ slide, onToggle, onDelete, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slide.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const layerCount = Array.isArray(slide.layers) ? slide.layers.length : 0;
  const thumb = slide.image_url || (slide.layers?.find(l => l.type === 'image')?.url) || '';

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-line rounded-[10px] px-4 py-3 flex items-center gap-3">
      <span {...attributes} {...listeners} className="text-[#ccc] text-[20px] cursor-grab select-none">⠿</span>
      {thumb ? (
        <img
          src={thumb}
          alt=""
          className="w-14 h-10 object-cover rounded border border-line flex-shrink-0"
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <div className="w-14 h-10 rounded border border-line flex-shrink-0 bg-gray-100" />
      )}
      <div className="flex-1 text-[13px] text-ink font-[600] truncate">
        Slide #{slide.id} · {layerCount} {layerCount === 1 ? 'camada' : 'camadas'}
      </div>
      <button
        onClick={() => onEdit(slide.id)}
        className="px-3 py-1 rounded-full text-[12px] font-[600] bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0"
      >
        Editar
      </button>
      <button
        onClick={() => onToggle(slide.id)}
        className={`px-3 py-1 rounded-full text-[12px] font-[600] transition-colors flex-shrink-0 ${
          slide.ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100'
        }`}
      >
        {slide.ativo ? 'Ativo' : 'Inativo'}
      </button>
      <button onClick={() => onDelete(slide.id)} className="text-red-400 hover:underline text-[13px] font-[600] flex-shrink-0">
        Excluir
      </button>
    </div>
  );
}

export default function AdminHeroSlidesPage() {
  const { token } = useAuth();
  const navigate   = useNavigate();
  const [slides,       setSlides]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const [psdUploading, setPsdUploading] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };
  const sensors     = useSensors(useSensor(PointerSensor));

  const fetchSlides = () => {
    setLoading(true);
    fetch('/api/admin/hero-slides', { headers: authHeaders })
      .then(r => r.json())
      .then(setSlides)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSlides(); }, []);

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex  = slides.findIndex(s => s.id === active.id);
    const newIndex  = slides.findIndex(s => s.id === over.id);
    const reordered = arrayMove(slides, oldIndex, newIndex);
    const previous  = slides;
    setSlides(reordered);
    try {
      const res = await fetch('/api/admin/hero-slides/reorder', {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: reordered.map(s => s.id) }),
      });
      if (!res.ok) throw new Error('Falha ao reordenar');
    } catch {
      setSlides(previous);
    }
  };

  const handleToggle = async (id) => {
    const res = await fetch(`/api/admin/hero-slides/${id}/ativo`, { method: 'PATCH', headers: authHeaders });
    if (!res.ok) { alert('Erro ao alterar status.'); return; }
    fetchSlides();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Excluir slide #${id}?`)) return;
    const res = await fetch(`/api/admin/hero-slides/${id}`, { method: 'DELETE', headers: authHeaders });
    if (!res.ok) { alert('Erro ao excluir slide.'); return; }
    fetchSlides();
  };

  const handleUpload = async (file) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res  = await fetch('/api/upload', { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const layers = [{
        id: crypto.randomUUID(),
        type: 'image',
        name: 'fundo',
        url: data.url,
        x: 0, y: 0, width: 1920, height: 600,
        visible: true,
        animation: null,
      }];
      const create = await fetch('/api/admin/hero-slides', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: data.url, ordem: slides.length + 1, layers }),
      });
      if (!create.ok) throw new Error('Falha ao criar slide.');
      fetchSlides();
    } catch (err) {
      alert(`Erro ao enviar imagem: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePsdUpload = async (file) => {
    setPsdUploading(true);
    const fd = new FormData();
    fd.append('psd', file);
    try {
      const res  = await fetch('/api/admin/psd-import', { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const layers = data.layers || [];
      const bg = layers.find(l => l.name === 'fundo' && l.type === 'image');
      const create = await fetch('/api/admin/hero-slides', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: bg?.url || '', ordem: slides.length + 1, layers }),
      });
      if (!create.ok) throw new Error('Falha ao criar slide.');
      const slide = await create.json();
      navigate(`/admin/hero-slides/${slide.id}/editar`);
    } catch (err) {
      alert(`Erro ao processar PSD: ${err.message}`);
    } finally {
      setPsdUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-[700px]">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-[24px] font-[800] text-ink">Hero Slides</h1>
        <div className="flex gap-2">
          <label className={`cursor-pointer border border-orange text-orange font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors hover:bg-orange-50 ${psdUploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {psdUploading ? 'Processando...' : 'Importar PSD'}
            <input type="file" accept=".psd" className="hidden" onChange={e => { if (e.target.files[0]) { handlePsdUpload(e.target.files[0]); e.target.value = ''; } }} />
          </label>
          <label className={`cursor-pointer bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {uploading ? 'Enviando...' : '+ Novo slide'}
            <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={e => { if (e.target.files[0]) { handleUpload(e.target.files[0]); e.target.value = ''; } }} />
          </label>
        </div>
      </div>
      <p className="text-[13px] text-muted mb-6">Arraste para reordenar. Clique em "Editar" para abrir o builder.</p>

      {loading ? (
        <div className="py-10 text-center text-muted text-[14px]">Carregando...</div>
      ) : slides.length === 0 ? (
        <div className="py-10 text-center text-muted text-[14px]">Nenhum slide. Adicione o primeiro!</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {slides.map(slide => (
                <SortableSlide
                  key={slide.id}
                  slide={slide}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={id => navigate(`/admin/hero-slides/${id}/editar`)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
```

Mudanças-chave:
- Removido: `PsdModal` inteiro, constante `ROLES`, estados `psdLayers/psdModal/assignments/creating`, função `assign`, função `handleOpenBuilder`.
- Removido: badge Animado/Estático no `SortableSlide`. Substituído por contador de camadas.
- `handleUpload` (botão "+ Novo slide"): agora cria o slide já com uma camada de fundo no array `layers`.
- `handlePsdUpload`: cria o slide direto com o array completo de `layers` retornado pela API e navega para o builder.
- Não passa mais `psdImport` via `location.state` — as camadas já estão no DB.

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/AdminHeroSlidesPage.jsx
git commit -m "refactor: simplificar AdminHeroSlidesPage (remover modal de papéis e badge animado)"
git push origin main
```

---

## Task 8: Builder — Scaffold (estado, load/save, layout 3 painéis, lista esquerda, canvas básico)

**Files:**
- Modify: `src/pages/admin/AdminSlideBuilderPage.jsx` (reescrita completa)

- [ ] **Step 1: Substituir o arquivo completo pelo scaffold inicial**

```jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CANVAS_W = 1920;
const CANVAS_H = 600;

const ANIMATION_OPTS = [
  { value: '',            label: 'Nenhuma'     },
  { value: 'fade',        label: 'Fade'        },
  { value: 'slide-up',    label: '↑ Slide Up'  },
  { value: 'slide-left',  label: '← Slide Esq.'},
  { value: 'slide-right', label: '→ Slide Dir.'},
];

export default function AdminSlideBuilderPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { token } = useAuth();

  const canvasRef = useRef(null);
  const [slide,      setSlide]      = useState(null);
  const [layers,     setLayers]     = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [preview,    setPreview]    = useState(false);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    fetch('/api/admin/hero-slides', { headers: authHeaders })
      .then(r => r.json())
      .then(slides => {
        const s = slides.find(sl => sl.id === parseInt(id));
        if (!s) { navigate('/admin/hero-slides'); return; }
        setSlide(s);
        setLayers(Array.isArray(s.layers) ? s.layers : []);
      })
      .catch(() => navigate('/admin/hero-slides'));
  }, [id, authHeaders, navigate]);

  const updateLayer = useCallback((layerId, patch) => {
    setLayers(ls => ls.map(l => l.id === layerId ? { ...l, ...patch } : l));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/hero-slides/${id}`, {
        method:  'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ layers }),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      navigate('/admin/hero-slides');
    } catch (err) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!slide) return <div className="p-8 text-muted text-[14px]">Carregando...</div>;

  // Lista é exibida do topo (último do array = z-index maior) para baixo.
  const reversedLayers = [...layers].reverse();
  const selected = layers.find(l => l.id === selectedId) || null;

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── PAINEL ESQUERDO — LISTA DE CAMADAS ── */}
      <div className="w-[220px] bg-white border-r border-line flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-line text-[11px] font-[800] text-ink uppercase tracking-[.4px] bg-[#fafafa]">
          Camadas ({layers.length})
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {reversedLayers.length === 0 ? (
            <div className="px-4 py-6 text-center text-muted text-[12px]">
              Nenhuma camada. Importe um PSD para começar.
            </div>
          ) : reversedLayers.map(layer => (
            <button
              key={layer.id}
              onClick={() => setSelectedId(layer.id)}
              className={`w-full px-4 py-2 flex items-center gap-2 text-left ${
                selectedId === layer.id ? 'bg-orange-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-[14px]">{layer.type === 'button' ? '🔘' : '🖼'}</span>
              <span className="text-[12px] font-[600] text-ink flex-1 truncate">{layer.name || 'Camada'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CANVAS CENTRAL ── */}
      <div className="flex-1 flex flex-col bg-[#e5e7eb] min-w-0">
        <div className="bg-[#1f2937] px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <span className="text-[11px] text-white/40 flex-1 truncate">Slide #{slide.id}</span>
          <button
            onClick={() => setPreview(true)}
            className="text-white/80 hover:text-white border border-white/20 px-3 py-1 rounded-[6px] text-[12px] font-[600]"
          >
            Pré-visualizar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-1.5 rounded-[7px] text-[12px] transition-colors disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={() => navigate('/admin/hero-slides')}
            className="text-white/50 hover:text-white text-[12px] font-[600]"
          >
            Cancelar
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <div
            ref={canvasRef}
            className="relative w-full max-w-[960px] bg-gray-800 rounded-[8px] overflow-hidden shadow-lg select-none"
            style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
            onPointerDown={e => { if (e.target === e.currentTarget) setSelectedId(null); }}
          >
            {layers.filter(l => l.visible).map((layer) => {
              const style = {
                position: 'absolute',
                left:   `${(layer.x / CANVAS_W) * 100}%`,
                top:    `${(layer.y / CANVAS_H) * 100}%`,
                width:  `${(layer.width  / CANVAS_W) * 100}%`,
                height: `${(layer.height / CANVAS_H) * 100}%`,
              };
              const isSel = layer.id === selectedId;
              const ringClass = isSel ? 'outline outline-2 outline-blue-500' : '';

              if (layer.type === 'image') {
                return (
                  <img
                    key={layer.id}
                    src={layer.url}
                    alt={layer.name || ''}
                    style={style}
                    draggable={false}
                    className={`cursor-move ${ringClass}`}
                    onPointerDown={e => { e.stopPropagation(); setSelectedId(layer.id); }}
                  />
                );
              }
              return (
                <div
                  key={layer.id}
                  style={{ ...style, backgroundColor: layer.bgColor, color: layer.textColor }}
                  className={`flex items-center justify-center rounded-lg font-bold text-sm cursor-move ${ringClass}`}
                  onPointerDown={e => { e.stopPropagation(); setSelectedId(layer.id); }}
                >
                  {layer.text || 'Botão'}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── PAINEL DIREITO — PROPRIEDADES (vazio nesta task) ── */}
      <div className="w-[260px] bg-white border-l border-line flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="px-4 py-3 border-b border-line text-[11px] font-[800] text-ink uppercase tracking-[.4px] bg-[#fafafa]">
          Propriedades
        </div>
        {selected ? (
          <div className="px-4 py-3 text-[12px] text-muted">
            <div className="font-[700] text-ink mb-1">{selected.name}</div>
            <div>Tipo: {selected.type}</div>
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-muted text-[12px]">
            Selecione uma camada.
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar visualmente**

```powershell
npm run dev
```

Abrir `http://localhost:5173/admin/hero-slides` (após login admin), clicar "Editar" em algum slide. Esperado: tela com 3 painéis, lista de camadas à esquerda, canvas com as camadas no centro, painel direito mostrando "Selecione uma camada". Clicar numa camada → painel direito mostra nome e tipo.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/AdminSlideBuilderPage.jsx
git commit -m "feat: builder v2 scaffold (3 painéis, lista de camadas, canvas, save)"
git push origin main
```

---

## Task 9: Builder — Drag para mover camadas no canvas

**Files:**
- Modify: `src/pages/admin/AdminSlideBuilderPage.jsx`

- [ ] **Step 1: Adicionar lógica de drag no canvas**

Localizar no arquivo:

```jsx
  const canvasRef = useRef(null);
  const [slide,      setSlide]      = useState(null);
  const [layers,     setLayers]     = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [preview,    setPreview]    = useState(false);
```

Substituir por:

```jsx
  const canvasRef = useRef(null);
  const dragRef   = useRef(null);
  const [slide,      setSlide]      = useState(null);
  const [layers,     setLayers]     = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [preview,    setPreview]    = useState(false);
```

Localizar:

```jsx
  const updateLayer = useCallback((layerId, patch) => {
    setLayers(ls => ls.map(l => l.id === layerId ? { ...l, ...patch } : l));
  }, []);
```

Adicionar logo abaixo:

```jsx
  function getCanvasScale() {
    if (!canvasRef.current) return 1;
    return canvasRef.current.getBoundingClientRect().width / CANVAS_W;
  }

  const handleLayerPointerDown = (e, layer) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(layer.id);
    dragRef.current = {
      mode: 'move',
      layerId: layer.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: layer.x,
      origY: layer.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const scale = getCanvasScale();
    const dx = (e.clientX - d.startClientX) / scale;
    const dy = (e.clientY - d.startClientY) / scale;
    if (d.mode === 'move') {
      updateLayer(d.layerId, {
        x: Math.round(d.origX + dx),
        y: Math.round(d.origY + dy),
      });
    }
  };

  const handleCanvasPointerUp = () => { dragRef.current = null; };
```

Localizar no JSX o `<div ref={canvasRef} ...>` e substituir os atributos:

```jsx
          <div
            ref={canvasRef}
            className="relative w-full max-w-[960px] bg-gray-800 rounded-[8px] overflow-hidden shadow-lg select-none"
            style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
            onPointerDown={e => { if (e.target === e.currentTarget) setSelectedId(null); }}
          >
```

por:

```jsx
          <div
            ref={canvasRef}
            className="relative w-full max-w-[960px] bg-gray-800 rounded-[8px] overflow-hidden shadow-lg select-none"
            style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
            onPointerDown={e => { if (e.target === e.currentTarget) setSelectedId(null); }}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
          >
```

Localizar no `.map(layer => ...)` interno do canvas a `<img>` e o `<div>` da camada e substituir o `onPointerDown` deles.

Da `<img>`:

```jsx
                    onPointerDown={e => { e.stopPropagation(); setSelectedId(layer.id); }}
```

por:

```jsx
                    onPointerDown={e => handleLayerPointerDown(e, layer)}
```

Do `<div>` (botão):

```jsx
                  onPointerDown={e => { e.stopPropagation(); setSelectedId(layer.id); }}
```

por:

```jsx
                  onPointerDown={e => handleLayerPointerDown(e, layer)}
```

- [ ] **Step 2: Verificar visualmente**

`npm run dev`, abrir builder de um slide, arrastar uma camada com o mouse. Esperado: a camada acompanha o cursor, sua posição (`layer.x`, `layer.y`) é atualizada e ao soltar permanece no novo lugar. Salvar, recarregar — a posição persiste.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/AdminSlideBuilderPage.jsx
git commit -m "feat: builder permite arrastar camadas no canvas (escala-aware)"
git push origin main
```

---

## Task 10: Builder — 8 handles de resize na camada selecionada

**Files:**
- Modify: `src/pages/admin/AdminSlideBuilderPage.jsx`

- [ ] **Step 1: Adicionar a função de resize no handler do canvas**

Localizar:

```jsx
  const handleCanvasPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const scale = getCanvasScale();
    const dx = (e.clientX - d.startClientX) / scale;
    const dy = (e.clientY - d.startClientY) / scale;
    if (d.mode === 'move') {
      updateLayer(d.layerId, {
        x: Math.round(d.origX + dx),
        y: Math.round(d.origY + dy),
      });
    }
  };
```

Substituir por:

```jsx
  const MIN_SIZE = 12;

  const handleCanvasPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const scale = getCanvasScale();
    const dx = (e.clientX - d.startClientX) / scale;
    const dy = (e.clientY - d.startClientY) / scale;

    if (d.mode === 'move') {
      updateLayer(d.layerId, {
        x: Math.round(d.origX + dx),
        y: Math.round(d.origY + dy),
      });
      return;
    }

    if (d.mode === 'resize') {
      let { origX, origY, origW, origH } = d;
      let x = origX, y = origY, w = origW, h = origH;
      const dir = d.dir;
      if (dir.includes('e')) w = Math.max(MIN_SIZE, origW + dx);
      if (dir.includes('s')) h = Math.max(MIN_SIZE, origH + dy);
      if (dir.includes('w')) {
        const newW = Math.max(MIN_SIZE, origW - dx);
        x = origX + (origW - newW);
        w = newW;
      }
      if (dir.includes('n')) {
        const newH = Math.max(MIN_SIZE, origH - dy);
        y = origY + (origH - newH);
        h = newH;
      }
      updateLayer(d.layerId, { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) });
    }
  };

  const handleResizeHandlePointerDown = (e, layer, dir) => {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = {
      mode: 'resize',
      dir,
      layerId: layer.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: layer.x,
      origY: layer.y,
      origW: layer.width,
      origH: layer.height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
```

- [ ] **Step 2: Adicionar componente `ResizeHandles` ao final do arquivo (antes do `export default`)**

Inserir esta declaração de componente acima da declaração `export default function AdminSlideBuilderPage()`:

```jsx
const HANDLES = [
  { dir: 'nw', x: '0%',   y: '0%',   cursor: 'nwse-resize' },
  { dir: 'n',  x: '50%',  y: '0%',   cursor: 'ns-resize'   },
  { dir: 'ne', x: '100%', y: '0%',   cursor: 'nesw-resize' },
  { dir: 'e',  x: '100%', y: '50%',  cursor: 'ew-resize'   },
  { dir: 'se', x: '100%', y: '100%', cursor: 'nwse-resize' },
  { dir: 's',  x: '50%',  y: '100%', cursor: 'ns-resize'   },
  { dir: 'sw', x: '0%',   y: '100%', cursor: 'nesw-resize' },
  { dir: 'w',  x: '0%',   y: '50%',  cursor: 'ew-resize'   },
];

function ResizeHandles({ onPointerDown }) {
  return (
    <>
      {HANDLES.map(h => (
        <div
          key={h.dir}
          onPointerDown={e => onPointerDown(e, h.dir)}
          className="absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-[2px]"
          style={{
            left: h.x, top: h.y,
            transform: 'translate(-50%, -50%)',
            cursor: h.cursor,
            zIndex: 10,
          }}
        />
      ))}
    </>
  );
}
```

- [ ] **Step 3: Adicionar handles no canvas para a camada selecionada**

Localizar a parte do canvas onde os layers são mapeados. Logo após o `</div>` de fechamento do canvas (ou após o `.map(...)`), inserir o overlay de handles. A forma mais simples é envolver a camada selecionada num wrapper que segura tanto a camada quanto os handles. Reescrever o `.filter(l => l.visible).map(...)`:

Localizar:

```jsx
            {layers.filter(l => l.visible).map((layer) => {
              const style = {
                position: 'absolute',
                left:   `${(layer.x / CANVAS_W) * 100}%`,
                top:    `${(layer.y / CANVAS_H) * 100}%`,
                width:  `${(layer.width  / CANVAS_W) * 100}%`,
                height: `${(layer.height / CANVAS_H) * 100}%`,
              };
              const isSel = layer.id === selectedId;
              const ringClass = isSel ? 'outline outline-2 outline-blue-500' : '';

              if (layer.type === 'image') {
                return (
                  <img
                    key={layer.id}
                    src={layer.url}
                    alt={layer.name || ''}
                    style={style}
                    draggable={false}
                    className={`cursor-move ${ringClass}`}
                    onPointerDown={e => handleLayerPointerDown(e, layer)}
                  />
                );
              }
              return (
                <div
                  key={layer.id}
                  style={{ ...style, backgroundColor: layer.bgColor, color: layer.textColor }}
                  className={`flex items-center justify-center rounded-lg font-bold text-sm cursor-move ${ringClass}`}
                  onPointerDown={e => handleLayerPointerDown(e, layer)}
                >
                  {layer.text || 'Botão'}
                </div>
              );
            })}
```

Substituir por:

```jsx
            {layers.filter(l => l.visible).map((layer) => {
              const wrapStyle = {
                position: 'absolute',
                left:   `${(layer.x / CANVAS_W) * 100}%`,
                top:    `${(layer.y / CANVAS_H) * 100}%`,
                width:  `${(layer.width  / CANVAS_W) * 100}%`,
                height: `${(layer.height / CANVAS_H) * 100}%`,
              };
              const isSel = layer.id === selectedId;
              const ringClass = isSel ? 'outline outline-2 outline-blue-500' : '';

              return (
                <div
                  key={layer.id}
                  style={wrapStyle}
                  className={`cursor-move ${ringClass}`}
                  onPointerDown={e => handleLayerPointerDown(e, layer)}
                >
                  {layer.type === 'image' ? (
                    <img
                      src={layer.url}
                      alt={layer.name || ''}
                      draggable={false}
                      className="w-full h-full pointer-events-none"
                    />
                  ) : (
                    <div
                      style={{ backgroundColor: layer.bgColor, color: layer.textColor }}
                      className="w-full h-full flex items-center justify-center rounded-lg font-bold text-sm pointer-events-none"
                    >
                      {layer.text || 'Botão'}
                    </div>
                  )}
                  {isSel && (
                    <ResizeHandles onPointerDown={(e, dir) => handleResizeHandlePointerDown(e, layer, dir)} />
                  )}
                </div>
              );
            })}
```

- [ ] **Step 2: Verificar**

`npm run dev`. Selecionar camada — 8 quadrados azuis aparecem nos cantos/meios. Arrastar cada um — a camada redimensiona. Tamanho mínimo de 12px (não inverte). Salvar e recarregar — tamanho persiste.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/AdminSlideBuilderPage.jsx
git commit -m "feat: builder permite redimensionar camadas via 8 handles"
git push origin main
```

---

## Task 11: Builder — Reorder na lista (drag), toggle visibilidade, nome editável

**Files:**
- Modify: `src/pages/admin/AdminSlideBuilderPage.jsx`

- [ ] **Step 1: Adicionar estados e handlers de reorder/edit no topo do componente**

Localizar:

```jsx
  const canvasRef = useRef(null);
  const dragRef   = useRef(null);
  const [slide,      setSlide]      = useState(null);
  const [layers,     setLayers]     = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [preview,    setPreview]    = useState(false);
```

Substituir por:

```jsx
  const canvasRef = useRef(null);
  const dragRef   = useRef(null);
  const [slide,      setSlide]      = useState(null);
  const [layers,     setLayers]     = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [preview,    setPreview]    = useState(false);
  const [editingName, setEditingName] = useState(null); // layer.id em edição
  const [reorderDrag, setReorderDrag] = useState(null); // { id, overId }
```

- [ ] **Step 2: Adicionar funções de reorder e edição inline acima do `if (!slide)`**

Localizar:

```jsx
  if (!slide) return <div className="p-8 text-muted text-[14px]">Carregando...</div>;
```

Inserir imediatamente acima:

```jsx
  const moveLayer = (fromId, toId) => {
    setLayers(ls => {
      const fromIdx = ls.findIndex(l => l.id === fromId);
      const toIdx   = ls.findIndex(l => l.id === toId);
      if (fromIdx === -1 || toIdx === -1) return ls;
      const next = [...ls];
      const [m] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, m);
      return next;
    });
  };

  const handleListItemPointerDown = (e, layerId) => {
    setReorderDrag({ id: layerId, overId: layerId });
  };

  const handleListItemPointerEnter = (layerId) => {
    setReorderDrag(d => d ? { ...d, overId: layerId } : null);
  };

  const handleListPointerUp = () => {
    if (reorderDrag && reorderDrag.id !== reorderDrag.overId) {
      moveLayer(reorderDrag.id, reorderDrag.overId);
    }
    setReorderDrag(null);
  };
```

- [ ] **Step 3: Reescrever o painel esquerdo (lista de camadas)**

Localizar o bloco completo do painel esquerdo:

```jsx
      {/* ── PAINEL ESQUERDO — LISTA DE CAMADAS ── */}
      <div className="w-[220px] bg-white border-r border-line flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-line text-[11px] font-[800] text-ink uppercase tracking-[.4px] bg-[#fafafa]">
          Camadas ({layers.length})
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {reversedLayers.length === 0 ? (
            <div className="px-4 py-6 text-center text-muted text-[12px]">
              Nenhuma camada. Importe um PSD para começar.
            </div>
          ) : reversedLayers.map(layer => (
            <button
              key={layer.id}
              onClick={() => setSelectedId(layer.id)}
              className={`w-full px-4 py-2 flex items-center gap-2 text-left ${
                selectedId === layer.id ? 'bg-orange-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-[14px]">{layer.type === 'button' ? '🔘' : '🖼'}</span>
              <span className="text-[12px] font-[600] text-ink flex-1 truncate">{layer.name || 'Camada'}</span>
            </button>
          ))}
        </div>
      </div>
```

Substituir por:

```jsx
      {/* ── PAINEL ESQUERDO — LISTA DE CAMADAS ── */}
      <div className="w-[240px] bg-white border-r border-line flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-line text-[11px] font-[800] text-ink uppercase tracking-[.4px] bg-[#fafafa]">
          Camadas ({layers.length})
        </div>
        <div
          className="flex-1 overflow-y-auto py-2"
          onPointerUp={handleListPointerUp}
          onPointerLeave={() => setReorderDrag(null)}
        >
          {reversedLayers.length === 0 ? (
            <div className="px-4 py-6 text-center text-muted text-[12px]">
              Nenhuma camada. Importe um PSD para começar.
            </div>
          ) : reversedLayers.map(layer => {
            const isOver = reorderDrag && reorderDrag.overId === layer.id && reorderDrag.id !== layer.id;
            return (
              <div
                key={layer.id}
                onPointerEnter={() => reorderDrag && handleListItemPointerEnter(layer.id)}
                className={`relative flex items-center gap-2 px-3 py-2 mx-2 mb-1 rounded-[6px] cursor-pointer ${
                  selectedId === layer.id ? 'bg-orange-50' : 'hover:bg-gray-50'
                } ${isOver ? 'ring-2 ring-blue-400' : ''}`}
                onClick={() => setSelectedId(layer.id)}
              >
                <span
                  onPointerDown={e => handleListItemPointerDown(e, layer.id)}
                  className="text-[#bbb] text-[14px] cursor-grab select-none"
                  title="Arrastar para reordenar"
                >
                  ⠿
                </span>
                <span className="text-[14px]">{layer.type === 'button' ? '🔘' : '🖼'}</span>
                {editingName === layer.id ? (
                  <input
                    autoFocus
                    type="text"
                    defaultValue={layer.name || ''}
                    onBlur={e => { updateLayer(layer.id, { name: e.target.value }); setEditingName(null); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { updateLayer(layer.id, { name: e.target.value }); setEditingName(null); }
                      if (e.key === 'Escape') setEditingName(null);
                    }}
                    onClick={e => e.stopPropagation()}
                    className="text-[12px] font-[600] flex-1 border border-orange rounded px-1 py-0.5 outline-none"
                  />
                ) : (
                  <span
                    onDoubleClick={e => { e.stopPropagation(); setEditingName(layer.id); }}
                    className="text-[12px] font-[600] text-ink flex-1 truncate"
                    title="Clique duplo para renomear"
                  >
                    {layer.name || 'Camada'}
                  </span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
                  className="text-[14px] leading-none opacity-60 hover:opacity-100"
                  title={layer.visible ? 'Ocultar' : 'Mostrar'}
                >
                  {layer.visible ? '👁' : '🙈'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
```

- [ ] **Step 4: Verificar**

`npm run dev`, abrir o builder. Esperado:
- Clicar duplo no nome da camada → vira input. Editar, Enter ou blur → salva o nome localmente.
- Clicar no ícone de olho 👁 → camada some do canvas. Clicar em 🙈 → reaparece.
- Arrastar o `⠿` de uma linha para cima/baixo de outra → as camadas trocam de posição (z-index muda).

Salvar e recarregar — todas as mudanças persistem.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminSlideBuilderPage.jsx
git commit -m "feat: builder permite reordenar, renomear e ocultar camadas na lista"
git push origin main
```

---

## Task 12: Builder — Painel direito (propriedades, image/button, animação)

**Files:**
- Modify: `src/pages/admin/AdminSlideBuilderPage.jsx`

- [ ] **Step 1: Substituir o painel direito completo**

Localizar:

```jsx
      {/* ── PAINEL DIREITO — PROPRIEDADES (vazio nesta task) ── */}
      <div className="w-[260px] bg-white border-l border-line flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="px-4 py-3 border-b border-line text-[11px] font-[800] text-ink uppercase tracking-[.4px] bg-[#fafafa]">
          Propriedades
        </div>
        {selected ? (
          <div className="px-4 py-3 text-[12px] text-muted">
            <div className="font-[700] text-ink mb-1">{selected.name}</div>
            <div>Tipo: {selected.type}</div>
          </div>
        ) : (
          <div className="px-4 py-6 text-center text-muted text-[12px]">
            Selecione uma camada.
          </div>
        )}
      </div>
```

Substituir por:

```jsx
      {/* ── PAINEL DIREITO — PROPRIEDADES ── */}
      <div className="w-[260px] bg-white border-l border-line flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="px-4 py-3 border-b border-line text-[11px] font-[800] text-ink uppercase tracking-[.4px] bg-[#fafafa]">
          Propriedades
        </div>
        {!selected ? (
          <div className="px-4 py-6 text-center text-muted text-[12px]">
            Selecione uma camada.
          </div>
        ) : (
          <>
            {/* Posição/tamanho */}
            <div className="px-4 py-3 border-b border-line">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Posição (px)</div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] font-[600] text-muted">
                  X
                  <input
                    type="number"
                    value={selected.x}
                    onChange={e => updateLayer(selected.id, { x: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full border border-line rounded-[6px] px-2 py-1 text-[12px] text-ink outline-none focus:border-orange"
                  />
                </label>
                <label className="text-[10px] font-[600] text-muted">
                  Y
                  <input
                    type="number"
                    value={selected.y}
                    onChange={e => updateLayer(selected.id, { y: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full border border-line rounded-[6px] px-2 py-1 text-[12px] text-ink outline-none focus:border-orange"
                  />
                </label>
                <label className="text-[10px] font-[600] text-muted">
                  Largura
                  <input
                    type="number"
                    value={selected.width}
                    min={MIN_SIZE}
                    onChange={e => updateLayer(selected.id, { width: Math.max(MIN_SIZE, parseInt(e.target.value) || MIN_SIZE) })}
                    className="mt-1 w-full border border-line rounded-[6px] px-2 py-1 text-[12px] text-ink outline-none focus:border-orange"
                  />
                </label>
                <label className="text-[10px] font-[600] text-muted">
                  Altura
                  <input
                    type="number"
                    value={selected.height}
                    min={MIN_SIZE}
                    onChange={e => updateLayer(selected.id, { height: Math.max(MIN_SIZE, parseInt(e.target.value) || MIN_SIZE) })}
                    className="mt-1 w-full border border-line rounded-[6px] px-2 py-1 text-[12px] text-ink outline-none focus:border-orange"
                  />
                </label>
              </div>
            </div>

            {/* Tipo + conversão */}
            <div className="px-4 py-3 border-b border-line">
              {selected.type === 'image' ? (
                <button
                  onClick={() => updateLayer(selected.id, {
                    type: 'button',
                    text: 'Ver catálogo',
                    href: '/produtos',
                    bgColor: '#F37021',
                    textColor: '#FFFFFF',
                  })}
                  className="w-full text-[11px] font-[700] py-1.5 rounded-[6px] border border-line hover:border-orange hover:text-orange"
                >
                  Converter para botão
                </button>
              ) : (
                <button
                  onClick={() => updateLayer(selected.id, {
                    type: 'image',
                    url: selected.url || '',
                  })}
                  className="w-full text-[11px] font-[700] py-1.5 rounded-[6px] border border-line hover:border-orange hover:text-orange"
                >
                  Converter para imagem
                </button>
              )}
            </div>

            {/* Campos específicos */}
            {selected.type === 'image' && (
              <div className="px-4 py-3 border-b border-line">
                <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">URL da imagem</div>
                <input
                  type="text"
                  value={selected.url || ''}
                  onChange={e => updateLayer(selected.id, { url: e.target.value })}
                  className="w-full border border-line rounded-[6px] px-2 py-1 text-[11px] text-ink outline-none focus:border-orange"
                  placeholder="/images/..."
                />
                {selected.url && (
                  <img src={selected.url} alt="" className="mt-2 max-h-20 mx-auto object-contain" />
                )}
              </div>
            )}

            {selected.type === 'button' && (
              <>
                <div className="px-4 py-3 border-b border-line">
                  <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Texto</div>
                  <input
                    type="text"
                    value={selected.text || ''}
                    onChange={e => updateLayer(selected.id, { text: e.target.value })}
                    className="w-full border border-line rounded-[6px] px-2 py-1 text-[12px] text-ink outline-none focus:border-orange"
                  />
                </div>
                <div className="px-4 py-3 border-b border-line">
                  <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">URL (href)</div>
                  <input
                    type="text"
                    value={selected.href || ''}
                    onChange={e => updateLayer(selected.id, { href: e.target.value })}
                    className="w-full border border-line rounded-[6px] px-2 py-1 text-[12px] text-ink outline-none focus:border-orange"
                  />
                </div>
                <div className="px-4 py-3 border-b border-line grid grid-cols-2 gap-2">
                  <label className="text-[10px] font-[600] text-muted">
                    Cor de fundo
                    <input
                      type="color"
                      value={selected.bgColor || '#F37021'}
                      onChange={e => updateLayer(selected.id, { bgColor: e.target.value })}
                      className="mt-1 w-full h-7 border border-line rounded-[6px] outline-none"
                    />
                  </label>
                  <label className="text-[10px] font-[600] text-muted">
                    Cor do texto
                    <input
                      type="color"
                      value={selected.textColor || '#FFFFFF'}
                      onChange={e => updateLayer(selected.id, { textColor: e.target.value })}
                      className="mt-1 w-full h-7 border border-line rounded-[6px] outline-none"
                    />
                  </label>
                </div>
              </>
            )}

            {/* Animação */}
            <div className="px-4 py-3 border-b border-line">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Animação</div>
              <select
                value={selected.animation?.type || ''}
                onChange={e => {
                  const t = e.target.value;
                  if (!t) updateLayer(selected.id, { animation: null });
                  else updateLayer(selected.id, { animation: { type: t, delay: selected.animation?.delay ?? 0 } });
                }}
                className="w-full border border-line rounded-[6px] px-2 py-1 text-[12px] text-ink bg-white outline-none focus:border-orange"
              >
                {ANIMATION_OPTS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              {selected.animation && (
                <div className="mt-2">
                  <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-1">Delay (s)</div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={selected.animation.delay ?? 0}
                    onChange={e => updateLayer(selected.id, {
                      animation: { ...selected.animation, delay: parseFloat(e.target.value) || 0 },
                    })}
                    className="w-full border border-line rounded-[6px] px-2 py-1 text-[12px] outline-none focus:border-orange"
                  />
                </div>
              )}
            </div>

            {/* Visibilidade */}
            <div className="px-4 py-3">
              <label className="flex items-center gap-2 text-[12px] font-[600] text-ink">
                <input
                  type="checkbox"
                  checked={selected.visible}
                  onChange={e => updateLayer(selected.id, { visible: e.target.checked })}
                />
                Visível
              </label>
            </div>
          </>
        )}
      </div>
```

- [ ] **Step 2: Verificar**

`npm run dev`, abrir builder. Selecionar camada — todos os campos aparecem (posição, conversão de tipo, URL/texto/cores conforme tipo, seleção de animação + delay, checkbox de visibilidade). Editar valores, salvar, recarregar — persistem.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/AdminSlideBuilderPage.jsx
git commit -m "feat: builder painel direito com propriedades completas (image/button, animação)"
git push origin main
```

---

## Task 13: Builder — Modal de pré-visualização

**Files:**
- Modify: `src/pages/admin/AdminSlideBuilderPage.jsx`

- [ ] **Step 1: Adicionar estado `previewKey` e componente `PreviewModal` no arquivo**

Localizar no topo do componente:

```jsx
  const [editingName, setEditingName] = useState(null); // layer.id em edição
  const [reorderDrag, setReorderDrag] = useState(null); // { id, overId }
```

Adicionar logo abaixo:

```jsx
  const [previewKey,  setPreviewKey]  = useState(0);
```

- [ ] **Step 2: Adicionar o componente `PreviewModal` antes do `export default`**

Inserir acima de `export default function AdminSlideBuilderPage()`:

```jsx
function PreviewModal({ layers, onClose, onReplay, replayKey }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
      <div className="relative w-full max-w-[1200px]" style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}>
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute -top-4 -right-4 w-9 h-9 rounded-full bg-white text-ink hover:bg-orange hover:text-white flex items-center justify-center text-[20px] leading-none shadow-lg z-10"
        >
          ×
        </button>
        <button
          onClick={onReplay}
          className="absolute -top-4 right-8 px-4 h-9 rounded-full bg-white text-ink hover:bg-orange hover:text-white text-[12px] font-[700] shadow-lg z-10"
        >
          ↻ Repetir
        </button>
        <div key={replayKey} className="relative w-full h-full bg-gray-800 rounded-[8px] overflow-hidden">
          {layers.filter(l => l.visible).map((layer) => {
            const style = {
              position: 'absolute',
              left:   `${(layer.x / CANVAS_W) * 100}%`,
              top:    `${(layer.y / CANVAS_H) * 100}%`,
              width:  `${(layer.width  / CANVAS_W) * 100}%`,
              height: `${(layer.height / CANVAS_H) * 100}%`,
              animationDelay: layer.animation ? `${layer.animation.delay ?? 0}s` : undefined,
            };
            const animClass = layer.animation ? `layer-anim-${layer.animation.type}` : '';
            if (layer.type === 'image') {
              return <img key={layer.id} src={layer.url} alt={layer.name || ''} style={style} className={animClass} draggable={false} />;
            }
            return (
              <div
                key={layer.id}
                style={{ ...style, backgroundColor: layer.bgColor, color: layer.textColor }}
                className={`flex items-center justify-center rounded-lg font-bold text-sm shadow-lg ${animClass}`}
              >
                {layer.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Renderizar o modal e ajustar o handler do botão "Pré-visualizar"**

Localizar:

```jsx
          <button
            onClick={() => setPreview(true)}
            className="text-white/80 hover:text-white border border-white/20 px-3 py-1 rounded-[6px] text-[12px] font-[600]"
          >
            Pré-visualizar
          </button>
```

Substituir por:

```jsx
          <button
            onClick={() => { setPreview(true); setPreviewKey(k => k + 1); }}
            className="text-white/80 hover:text-white border border-white/20 px-3 py-1 rounded-[6px] text-[12px] font-[600]"
          >
            Pré-visualizar
          </button>
```

Adicionar logo antes do `</div>` que fecha o componente raiz (último fechamento). Localizar o último `}` antes de `}` no fim do componente; o render JSX termina com `</div>` do wrapper externo. Inserir antes desse `</div>`:

```jsx
      {preview && (
        <PreviewModal
          layers={layers}
          onClose={() => setPreview(false)}
          onReplay={() => setPreviewKey(k => k + 1)}
          replayKey={previewKey}
        />
      )}
```

- [ ] **Step 4: Verificar**

`npm run dev`, abrir builder, clicar "Pré-visualizar". Esperado: overlay preto cobre a tela; o slide é mostrado proporcionalmente; camadas com animação executam suas animações ao abrir; botão "↻ Repetir" reinicia as animações; "×" fecha o modal.

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminSlideBuilderPage.jsx
git commit -m "feat: builder modal de pré-visualização com replay de animações"
git push origin main
```

---

## Task 14: DB — Migration 005 (`DROP COLUMN animado`)

**Files:**
- Create: `server/migrations/005_drop_animado.sql`

- [ ] **Step 1: Criar `server/migrations/005_drop_animado.sql`**

Conteúdo completo:

```sql
ALTER TABLE hero_slides DROP COLUMN IF EXISTS animado;
```

- [ ] **Step 2: Aplicar a migration**

```powershell
cd server
node migrations/run.js 005_drop_animado.sql
```

Esperado: log `Migration aplicada: 005_drop_animado.sql`.

- [ ] **Step 3: Confirmar via SQL que a coluna sumiu**

A partir de `server/`:

```powershell
node -e "require('dotenv').config(); const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query(\"SELECT column_name FROM information_schema.columns WHERE table_name='hero_slides' ORDER BY ordinal_position\").then(r => { console.log(r.rows.map(x => x.column_name)); pool.end(); })"
```

Esperado: lista de colunas SEM `animado`. Lista esperada: `id`, `image_url`, `ordem`, `ativo`, `created_at`, `layers`.

- [ ] **Step 4: Commit**

```bash
git add server/migrations/005_drop_animado.sql
git commit -m "feat: migration 005 dropa coluna animado de hero_slides"
git push origin main
```

---

## Task 15: Verificação E2E final

**Files:**
- Verify: fluxo completo funciona

- [ ] **Step 1: Subir backend e frontend**

Em terminais separados:

```powershell
# Terminal 1 — backend
cd server
npm run dev
```

```powershell
# Terminal 2 — frontend
npm run dev
```

- [ ] **Step 2: Verificar listagem pública e admin**

Abrir `http://localhost:5173/`. Esperado: o carrossel renderiza os slides existentes (formato antigo migrado em runtime via `normalizeLayers`).

Abrir `http://localhost:5173/admin/login` → logar → ir em "Hero Slides". Esperado: lista de slides aparece, cada um com contador de camadas (sem badge animado/estático).

- [ ] **Step 3: Criar slide via "+ Novo slide" (upload de imagem simples)**

Clicar "+ Novo slide", selecionar JPG/PNG. Esperado: novo slide aparece na lista com 1 camada (fundo).

- [ ] **Step 4: Editar slide no builder**

Clicar "Editar" no slide novo. Esperado:
- Painel esquerdo lista 1 camada chamada "fundo".
- Canvas mostra a imagem ocupando todo o espaço.
- Selecionar a camada → painel direito mostra propriedades.

Adicionar uma camada de botão: como o builder atual não tem ação "adicionar camada manual", isso só é possível via PSD ou editando JSON direto. Ok — esta versão limita criação manual de camadas (fora do escopo). Pular para o próximo passo se não houver PSD à mão. Se houver PSD, testar via "Importar PSD".

- [ ] **Step 5: Testar drag, resize, conversão para botão, animação, preview**

Com pelo menos 1 camada na lista:
- Arrastar a camada no canvas → posição muda.
- Selecionar → 8 handles aparecem → arrastar canto → tamanho muda.
- Painel direito → "Converter para botão" → camada vira botão laranja com texto "Ver catálogo".
- Painel direito → Animação → escolher "Fade" → delay 0.3.
- Toolbar → "Pré-visualizar" → overlay aparece, camada faz fade-in.
- Fechar preview → "Salvar".

- [ ] **Step 6: Confirmar persistência**

Voltar para `http://localhost:5173/`. Esperado: o slide editado renderiza no carrossel público com a animação configurada.

- [ ] **Step 7: Commit final**

```bash
git add -A
git commit --allow-empty -m "feat: slide builder v2 com N camadas arbitrárias concluído"
git push origin main
```

---

## Self-Review

**Spec coverage check:**

| Spec section | Task |
|---|---|
| Modelo de dados array (`id`, `type`, `name`, `x/y/w/h`, `visible`, `animation`) | Task 2 (helper define formato), Tasks 3–5 (rotas) |
| Animações disponíveis (`fade`, `slide-left`, `slide-right`, `slide-up`) | Task 1 (slide-right) + classes existentes |
| Canvas 1920×600 | Tasks 5, 6, 8 (constantes `CANVAS_W`/`CANVAS_H`) |
| Migration 005 drop animado | Task 14 |
| `POST /api/admin/psd-import` retorna array | Task 5 |
| `POST /api/admin/hero-slides` aceita layers | Task 3 |
| `PUT /api/admin/hero-slides/:id` aceita layers | Task 3 |
| AdminHeroSlidesPage simplificada (sem modal de papéis) | Task 7 |
| AdminSlideBuilderPage 3 painéis | Tasks 8, 11, 12 |
| Lista de camadas (drag-reorder, toggle olho, nome editável) | Task 11 |
| Canvas com drag para mover | Task 9 |
| 8 handles de resize | Task 10 |
| Painel direito (X, Y, largura, altura, conversão tipo, animação, delay) | Task 12 |
| Modal de pré-visualização com replay | Task 13 |
| HeroCarousel render genérico | Task 6 |
| `normalizeLayers` para compat retroativa | Task 2 (helper) + Tasks 3, 4 (uso) |

**Note de escopo:** O spec lista como "Fora do Escopo" a adição manual de camadas no builder — este plano respeita esse limite. Camadas só vêm do PSD ou do upload simples (que cria 1 camada de fundo).
