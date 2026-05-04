# Slide Builder com Camadas Animadas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o admin componha slides do hero com camadas posicionáveis (logo e botão CTA) via drag-and-drop, com modo estático ou animado por slide e transição global configurável.

**Architecture:** Migration adiciona `animado` e `layers` (JSONB) à tabela `hero_slides` e seed da transição em `page_content`. Backend ganha `PUT /:id` em admin-hero-slides. Frontend: `HeroCarousel` renderiza camadas com animações CSS; `AdminSlideBuilderPage` é o editor de três painéis com drag nativo via `pointermove`.

**Tech Stack:** Node.js/Express + pg, React 18, React Router v6, Tailwind CSS, CSS @keyframes (sem lib extra)

---

## Mapa de arquivos

| Arquivo | Ação |
|---------|------|
| `server/migrations/004_slide_builder.sql` | Criar |
| `server/src/routes/hero-slides.js` | Modificar — retornar `animado` + `layers` |
| `server/src/routes/admin-hero-slides.js` | Modificar — adicionar `PUT /:id` |
| `src/index.css` | Modificar — classes `slide-enter-*` e `layer-anim-*` |
| `src/components/HeroCarousel.jsx` | Modificar — transições + renderização de camadas |
| `src/pages/admin/AdminHeroSlidesPage.jsx` | Modificar — botão "Editar" por slide |
| `src/pages/admin/AdminSlideBuilderPage.jsx` | Criar |
| `src/App.jsx` | Modificar — import + rota `/admin/hero-slides/:id/editar` |

---

## Task 1: DB — Migration

**Files:**
- Create: `server/migrations/004_slide_builder.sql`

- [ ] **Step 1: Criar `server/migrations/004_slide_builder.sql`**

```sql
ALTER TABLE hero_slides
  ADD COLUMN IF NOT EXISTS animado BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS layers  JSONB   NOT NULL DEFAULT '{}';

INSERT INTO page_content (page, key, value, type)
VALUES ('carousel', 'transition', 'fade', 'text')
ON CONFLICT (page, key) DO NOTHING;
```

- [ ] **Step 2: Rodar a migration**

```bash
cd server && node migrations/run.js 004_slide_builder.sql
```

Esperado: `Migration aplicada: 004_slide_builder.sql`

- [ ] **Step 3: Verificar colunas no banco**

```bash
cd server && node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT column_name FROM information_schema.columns WHERE table_name=\\'hero_slides\\'')
  .then(r => { console.log(r.rows.map(c => c.column_name)); pool.end(); });
"
```

Esperado: array contendo `animado` e `layers`.

- [ ] **Step 4: Commit**

```bash
git add server/migrations/004_slide_builder.sql
git commit -m "feat: migration slide builder (animado + layers JSONB + transition seed)"
```

---

## Task 2: Backend — Rota pública retorna animado + layers

**Files:**
- Modify: `server/src/routes/hero-slides.js`

- [ ] **Step 1: Atualizar SELECT em `server/src/routes/hero-slides.js`**

Substituir o conteúdo completo do arquivo:

```js
const { Router } = require('express');
const pool = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, image_url, ordem, animado, layers FROM hero_slides WHERE ativo = true ORDER BY ordem ASC, id ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/hero-slides:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
```

- [ ] **Step 2: Verificar rota**

```bash
cd server && node -e "require('./src/app'); console.log('OK')"
```

Esperado: `OK` sem erros.

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/hero-slides.js
git commit -m "feat: rota pública hero-slides retorna animado e layers"
```

---

## Task 3: Backend — PUT /:id para salvar builder

**Files:**
- Modify: `server/src/routes/admin-hero-slides.js`

- [ ] **Step 1: Adicionar `PUT /:id` em `server/src/routes/admin-hero-slides.js`**

Adicionar após o bloco `router.put('/reorder', ...)` e antes do `router.patch('/:id/ativo', ...)`:

```js
router.put('/:id', async (req, res) => {
  const { animado, layers } = req.body;
  if (typeof animado !== 'boolean') return res.status(400).json({ error: 'animado deve ser boolean.' });
  if (typeof layers !== 'object' || layers === null) return res.status(400).json({ error: 'layers deve ser objeto.' });
  try {
    const { rows } = await pool.query(
      'UPDATE hero_slides SET animado = $1, layers = $2 WHERE id = $3 RETURNING *',
      [animado, JSON.stringify(layers), req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Slide não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/admin/hero-slides/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});
```

- [ ] **Step 2: Verificar que não quebrou as rotas existentes**

```bash
cd server && node -e "require('./src/app'); console.log('OK')"
```

Esperado: `OK` sem erros.

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/admin-hero-slides.js
git commit -m "feat: adicionar PUT /api/admin/hero-slides/:id para salvar builder"
```

---

## Task 4: CSS — Classes de transição e animação de camadas

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Adicionar classes ao final de `src/index.css`**

```css
/* ── Hero Carousel — transições entre slides ── */
.slide-enter-fade {
  animation: slideEnterFade 0.6s ease forwards;
}
@keyframes slideEnterFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.slide-enter-slide {
  animation: slideEnterSlide 0.5s ease forwards;
}
@keyframes slideEnterSlide {
  from { transform: translateX(8%); opacity: 0; }
  to   { transform: translateX(0);  opacity: 1; }
}

/* slide-enter-cut: sem animação — classe existe mas fica vazia */
.slide-enter-cut {}

/* ── Hero Carousel — animações de entrada das camadas ── */
.layer-anim-fade {
  animation: layerFade 0.6s ease both;
}
@keyframes layerFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.layer-anim-slide-up {
  animation: layerSlideUp 0.6s ease both;
}
@keyframes layerSlideUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0);    }
}

.layer-anim-zoom {
  animation: layerZoom 0.6s ease both;
}
@keyframes layerZoom {
  from { opacity: 0; transform: scale(0.7); }
  to   { opacity: 1; transform: scale(1);   }
}

.layer-anim-slide-left {
  animation: layerSlideLeft 0.6s ease both;
}
@keyframes layerSlideLeft {
  from { opacity: 0; transform: translateX(30px); }
  to   { opacity: 1; transform: translateX(0);    }
}

.layer-anim-none {}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: adicionar classes CSS de transição e animação do slide builder"
```

---

## Task 5: Frontend — Atualizar HeroCarousel.jsx

**Files:**
- Modify: `src/components/HeroCarousel.jsx`

- [ ] **Step 1: Substituir conteúdo completo de `src/components/HeroCarousel.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react';

function SlideLayer({ layer, type, animado }) {
  if (!layer?.visible) return null;

  const posStyle = {
    position: 'absolute',
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    transform: 'translate(-50%, -50%)',
  };

  const animClass = animado && layer.animation && layer.animation !== 'none'
    ? `layer-anim-${layer.animation}`
    : '';

  const animStyle = animado ? { animationDelay: `${layer.delay ?? 0}s` } : {};

  if (type === 'logo' && layer.image_url) {
    return (
      <div style={posStyle}>
        <img
          src={layer.image_url}
          alt=""
          className={animClass}
          style={{ width: `${layer.width ?? 80}px`, display: 'block', ...animStyle }}
        />
      </div>
    );
  }

  if (type === 'cta' && layer.text) {
    return (
      <div style={posStyle}>
        <a
          href={layer.link || '/produtos'}
          className={`block bg-orange text-white font-[800] text-[14px] px-6 py-3 rounded-full shadow-lg whitespace-nowrap hover:bg-[#E0580A] transition-colors ${animClass}`}
          style={animStyle}
        >
          {layer.text}
        </a>
      </div>
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

  return (
    <section
      className="w-full bg-bg leading-[0] relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div key={`${idx}-${animKey}`} className={`relative slide-enter-${transition}`}>
        <img
          src={slide.image_url}
          alt={`Slide ${idx + 1}`}
          className="w-full h-auto block"
        />

        {slide.layers && (
          <>
            <SlideLayer layer={slide.layers.logo} type="logo" animado={slide.animado} />
            <SlideLayer layer={slide.layers.cta}  type="cta"  animado={slide.animado} />
          </>
        )}
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

- [ ] **Step 2: Commit**

```bash
git add src/components/HeroCarousel.jsx
git commit -m "feat: HeroCarousel com transições configuráveis e camadas animadas"
```

---

## Task 6: Admin — Botão "Editar" na lista de slides

**Files:**
- Modify: `src/pages/admin/AdminHeroSlidesPage.jsx`

- [ ] **Step 1: Adicionar `useNavigate` e prop `onEdit` em `AdminHeroSlidesPage.jsx`**

Substituir o conteúdo completo do arquivo:

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

  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-line rounded-[10px] px-4 py-3 flex items-center gap-3">
      <span {...attributes} {...listeners} className="text-[#ccc] text-[20px] cursor-grab select-none">⠿</span>
      <img
        src={slide.image_url}
        alt=""
        className="w-14 h-10 object-cover rounded border border-line flex-shrink-0"
        onError={e => { e.currentTarget.style.display = 'none'; }}
      />
      <div className="flex-1 text-[13px] text-ink font-[600] truncate">{slide.image_url}</div>
      <span className={`text-[11px] font-[600] px-2 py-0.5 rounded-full flex-shrink-0 ${slide.animado ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
        {slide.animado ? 'Animado' : 'Estático'}
      </span>
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
      <button onClick={() => onDelete(slide.id, slide.image_url)} className="text-red-400 hover:underline text-[13px] font-[600] flex-shrink-0">
        Excluir
      </button>
    </div>
  );
}

export default function AdminHeroSlidesPage() {
  const { token } = useAuth();
  const navigate   = useNavigate();
  const [slides,    setSlides]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);

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
    setSlides(reordered);
    try {
      const res = await fetch('/api/admin/hero-slides/reorder', {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: reordered.map(s => s.id) }),
      });
      if (!res.ok) throw new Error('Falha ao reordenar');
    } catch {
      setSlides(slides);
    }
  };

  const handleToggle = async (id) => {
    await fetch(`/api/admin/hero-slides/${id}/ativo`, { method: 'PATCH', headers: authHeaders });
    fetchSlides();
  };

  const handleDelete = async (id, url) => {
    if (!window.confirm(`Excluir slide "${url}"?`)) return;
    await fetch(`/api/admin/hero-slides/${id}`, { method: 'DELETE', headers: authHeaders });
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
      await fetch('/api/admin/hero-slides', {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: data.url, ordem: slides.length + 1 }),
      });
      fetchSlides();
    } catch { /* silent */ } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-[700px]">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-[24px] font-[800] text-ink">Hero Slides</h1>
        <label className={`cursor-pointer bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
          {uploading ? 'Enviando...' : '+ Novo slide'}
          <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
        </label>
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

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/AdminHeroSlidesPage.jsx
git commit -m "feat: adicionar botão Editar e badge Animado/Estático na lista de slides"
```

---

## Task 7: Admin — Criar AdminSlideBuilderPage.jsx

**Files:**
- Create: `src/pages/admin/AdminSlideBuilderPage.jsx`

- [ ] **Step 1: Criar `src/pages/admin/AdminSlideBuilderPage.jsx`**

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ANIMATIONS = [
  { value: 'none',       label: 'Nenhuma'  },
  { value: 'fade',       label: 'Fade'     },
  { value: 'slide-up',   label: '↑ Up'     },
  { value: 'zoom',       label: '⊙ Zoom'   },
  { value: 'slide-left', label: '← Left'   },
];

const TRANSITIONS = [
  { value: 'fade',  label: 'Fade suave'    },
  { value: 'slide', label: 'Deslizamento'  },
  { value: 'cut',   label: 'Corte direto'  },
];

const DEFAULT_LAYERS = {
  logo: { image_url: '', x: 75, y: 12, width: 80, animation: 'fade',     delay: 0.3, visible: true },
  cta:  { text: 'Ver produtos', link: '/produtos', x: 50, y: 78, animation: 'slide-up', delay: 0.5, visible: true },
};

export default function AdminSlideBuilderPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { token } = useAuth();
  const canvasRef = useRef(null);
  const drag      = useRef(null);

  const [slide,      setSlide]      = useState(null);
  const [animado,    setAnimado]    = useState(false);
  const [layers,     setLayers]     = useState(DEFAULT_LAYERS);
  const [transition, setTransition] = useState('fade');
  const [selected,   setSelected]   = useState('logo');
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch('/api/admin/hero-slides', { headers: authHeaders })
      .then(r => r.json())
      .then(slides => {
        const s = slides.find(sl => sl.id === parseInt(id));
        if (!s) { navigate('/admin/hero-slides'); return; }
        setSlide(s);
        setAnimado(s.animado ?? false);
        setLayers(s.layers && Object.keys(s.layers).length > 0 ? s.layers : DEFAULT_LAYERS);
      })
      .catch(() => navigate('/admin/hero-slides'));

    fetch('/api/content/carousel')
      .then(r => r.json())
      .then(d => setTransition(d.transition ?? 'fade'))
      .catch(() => {});
  }, [id]);

  const updateLayer = useCallback((key, field, value) =>
    setLayers(l => ({ ...l, [key]: { ...l[key], [field]: value } })), []);

  const handleLayerPointerDown = (e, layerKey) => {
    e.stopPropagation();
    setSelected(layerKey);
    drag.current = {
      layer:  layerKey,
      startX: e.clientX,
      startY: e.clientY,
      origX:  layers[layerKey].x,
      origY:  layers[layerKey].y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e) => {
    if (!drag.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.startX) / rect.width)  * 100;
    const dy = ((e.clientY - drag.current.startY) / rect.height) * 100;
    const x  = Math.min(95, Math.max(5, drag.current.origX + dx));
    const y  = Math.min(95, Math.max(5, drag.current.origY + dy));
    setLayers(l => ({ ...l, [drag.current.layer]: { ...l[drag.current.layer], x, y } }));
  };

  const saveTransition = async (val) => {
    setTransition(val);
    await fetch('/api/admin/content/carousel/transition', {
      method:  'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ value: val }),
    }).catch(() => {});
  };

  const handleLogoUpload = async (file) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res  = await fetch('/api/upload', { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateLayer('logo', 'image_url', data.url);
    } catch { /* silent */ } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/hero-slides/${id}`, {
        method:  'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ animado, layers }),
      });
      navigate('/admin/hero-slides');
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  };

  if (!slide) return <div className="p-8 text-muted text-[14px]">Carregando...</div>;

  const selLayer = layers[selected];

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── PAINEL ESQUERDO ── */}
      <div className="w-[188px] bg-white border-r border-line flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-line text-[11px] font-[800] text-ink uppercase tracking-[.4px] bg-[#fafafa]">
          Slide
        </div>

        <div className="px-4 py-3 border-b border-line">
          <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Transição global</div>
          <select
            value={transition}
            onChange={e => saveTransition(e.target.value)}
            className="w-full border border-line rounded-[6px] px-2 py-1.5 text-[12px] text-ink bg-white"
          >
            {TRANSITIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setAnimado(a => !a)}
              className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${animado ? 'bg-orange' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${animado ? 'right-0.5' : 'left-0.5'}`} />
            </button>
            <span className="text-[12px] font-[600] text-ink">{animado ? 'Animado' : 'Estático'}</span>
          </div>
        </div>

        <div className="px-4 py-3 flex-1">
          <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Camadas</div>
          {[
            { key: 'logo', label: 'Logo',      color: '#F37021' },
            { key: 'cta',  label: 'Botão CTA', color: '#10b981' },
          ].map(({ key, label, color }) => (
            <div
              key={key}
              onClick={() => setSelected(key)}
              className={`flex items-center gap-2 py-2 px-2 rounded-[6px] cursor-pointer mb-1 ${selected === key ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[12px] font-[600] text-ink flex-1">{label}</span>
              <button
                onClick={e => { e.stopPropagation(); updateLayer(key, 'visible', !layers[key].visible); }}
                className="text-[14px] leading-none opacity-60 hover:opacity-100"
                title={layers[key].visible ? 'Ocultar' : 'Mostrar'}
              >
                {layers[key].visible ? '👁' : '🙈'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── CANVAS CENTRAL ── */}
      <div className="flex-1 flex flex-col bg-[#e5e7eb] min-w-0">
        <div className="bg-[#1f2937] px-4 py-2 flex items-center gap-3 flex-shrink-0">
          <span className="text-[11px] text-white/40 flex-1 truncate">{slide.image_url}</span>
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
            className="relative w-full max-w-[720px] aspect-[16/7] bg-gray-800 rounded-[8px] overflow-hidden shadow-lg select-none"
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={() => { drag.current = null; }}
          >
            <img src={slide.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />

            {/* Logo layer */}
            {layers.logo?.visible && (
              <div
                className={`absolute cursor-move rounded-[6px] border-2 overflow-hidden ${selected === 'logo' ? 'border-orange shadow-[0_0_0_2px_rgba(243,112,33,0.3)]' : 'border-white/50'}`}
                style={{
                  left:      `${layers.logo.x}%`,
                  top:       `${layers.logo.y}%`,
                  width:     `${layers.logo.width ?? 80}px`,
                  height:    `${layers.logo.width ?? 80}px`,
                  transform: 'translate(-50%,-50%)',
                }}
                onPointerDown={e => handleLayerPointerDown(e, 'logo')}
              >
                {layers.logo.image_url
                  ? <img src={layers.logo.image_url} alt="" className="w-full h-full object-contain" draggable={false} />
                  : <div className="w-full h-full flex items-center justify-center bg-white/20 text-white text-[9px] font-[700]">LOGO</div>
                }
              </div>
            )}

            {/* CTA layer */}
            {layers.cta?.visible && (
              <div
                className={`absolute cursor-move rounded-full border-2 ${selected === 'cta' ? 'border-orange shadow-[0_0_0_2px_rgba(243,112,33,0.3)]' : 'border-white/50'}`}
                style={{
                  left:      `${layers.cta.x}%`,
                  top:       `${layers.cta.y}%`,
                  transform: 'translate(-50%,-50%)',
                }}
                onPointerDown={e => handleLayerPointerDown(e, 'cta')}
              >
                <div className="bg-orange text-white font-[800] text-[11px] px-4 py-2 rounded-full whitespace-nowrap">
                  {layers.cta.text || 'Botão CTA'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PAINEL DIREITO ── */}
      <div className="w-[172px] bg-white border-l border-line flex flex-col flex-shrink-0 overflow-y-auto">
        <div className="px-4 py-3 border-b border-line text-[11px] font-[800] text-ink uppercase tracking-[.4px] bg-[#fafafa]">
          {selected === 'logo' ? 'Logo' : 'Botão CTA'}
        </div>

        {selected === 'logo' && (
          <>
            <div className="px-4 py-3 border-b border-line">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Imagem</div>
              {layers.logo.image_url && (
                <img src={layers.logo.image_url} alt="" className="w-full h-14 object-contain rounded border border-line mb-2" />
              )}
              <label className={`block text-center border border-dashed border-line rounded-[6px] py-2 text-[11px] text-muted cursor-pointer hover:border-orange hover:text-orange transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                {uploading ? 'Enviando...' : 'Trocar imagem'}
                <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={e => e.target.files[0] && handleLogoUpload(e.target.files[0])} />
              </label>
            </div>
            <div className="px-4 py-3 border-b border-line">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Tamanho (px)</div>
              <input
                type="number"
                min="20"
                max="300"
                value={layers.logo.width ?? 80}
                onChange={e => updateLayer('logo', 'width', parseInt(e.target.value) || 80)}
                className="w-full border border-line rounded-[6px] px-3 py-1.5 text-[12px] outline-none focus:border-orange"
              />
            </div>
          </>
        )}

        {selected === 'cta' && (
          <>
            <div className="px-4 py-3 border-b border-line">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Texto</div>
              <input
                type="text"
                value={layers.cta.text}
                onChange={e => updateLayer('cta', 'text', e.target.value)}
                className="w-full border border-line rounded-[6px] px-3 py-1.5 text-[12px] outline-none focus:border-orange"
                placeholder="Ver produtos"
              />
            </div>
            <div className="px-4 py-3 border-b border-line">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Link</div>
              <input
                type="text"
                value={layers.cta.link}
                onChange={e => updateLayer('cta', 'link', e.target.value)}
                className="w-full border border-line rounded-[6px] px-3 py-1.5 text-[12px] outline-none focus:border-orange"
                placeholder="/produtos"
              />
            </div>
          </>
        )}

        {animado && (
          <>
            <div className="px-4 py-3 border-b border-line">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Animação</div>
              <div className="flex flex-wrap gap-1">
                {ANIMATIONS.map(a => (
                  <button
                    key={a.value}
                    onClick={() => updateLayer(selected, 'animation', a.value)}
                    className={`px-2 py-1 rounded-full text-[10px] font-[700] border transition-colors ${
                      selLayer?.animation === a.value
                        ? 'bg-orange text-white border-orange'
                        : 'bg-white text-muted border-line hover:border-orange hover:text-orange'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[10px] font-[700] text-muted uppercase tracking-[.4px] mb-2">Delay (s)</div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="3"
                value={selLayer?.delay ?? 0}
                onChange={e => updateLayer(selected, 'delay', parseFloat(e.target.value) || 0)}
                className="w-full border border-line rounded-[6px] px-3 py-1.5 text-[12px] outline-none focus:border-orange"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/AdminSlideBuilderPage.jsx
git commit -m "feat: criar AdminSlideBuilderPage com drag nativo e painel de animações"
```

---

## Task 8: Frontend — Registrar rota e import em App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Adicionar import após a linha `import AdminHeroSlidesPage`**

```jsx
import AdminSlideBuilderPage from './pages/admin/AdminSlideBuilderPage';
```

- [ ] **Step 2: Adicionar rota no array `children` do path `/admin`**

Adicionar após `{ path: 'hero-slides', element: <AdminHeroSlidesPage /> }`:

```jsx
{ path: 'hero-slides/:id/editar', element: <AdminSlideBuilderPage /> },
```

- [ ] **Step 3: Verificar build sem erros**

```bash
npm run build
```

Esperado: `✓ built in X.XXs` sem erros de TypeScript/lint.

- [ ] **Step 4: Commit e push final**

```bash
git add src/App.jsx
git commit -m "feat: registrar rota /admin/hero-slides/:id/editar"
git push origin main
```

---

## Self-Review

**Cobertura do spec:**
- ✅ Migration `animado` + `layers` JSONB + seed `carousel.transition`
- ✅ `GET /api/hero-slides` retorna `animado` e `layers`
- ✅ `PUT /api/admin/hero-slides/:id` salva `animado` e `layers`
- ✅ Transição global via `page_content` (reutiliza CMS existente)
- ✅ `HeroCarousel` renderiza camadas logo e CTA com animações CSS
- ✅ Fallback: slides sem `layers` exibem só a imagem (compatibilidade)
- ✅ `AdminHeroSlidesPage` com botão "Editar" e badge Animado/Estático
- ✅ `AdminSlideBuilderPage` com 3 painéis, drag nativo, toggle, animações, upload
- ✅ Rota registrada em `App.jsx`
- ✅ Classes CSS `slide-enter-*` e `layer-anim-*` em `index.css`
