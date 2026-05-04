# Importação de PSD no Slide Builder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o admin faça upload de um arquivo `.psd`, veja as camadas extraídas em um modal, atribua papéis (Fundo / Logo / CTA / Ignorar) e abra o builder com as camadas pré-posicionadas.

**Architecture:** Nova rota `POST /api/admin/psd-import` usa a lib `psd` (npm) para extrair camadas do Photoshop como PNGs e retornar posições percentuais. O frontend exibe um modal de atribuição em `AdminHeroSlidesPage`; após confirmar, cria o slide e navega para o builder passando as camadas via `location.state`. O builder detecta `location.state.psdImport` e pré-preenche logo e CTA.

**Tech Stack:** Node.js/Express + multer + `psd` (npm); React 18 + React Router v6 `useLocation`

---

## Mapa de arquivos

| Arquivo | Ação |
|---------|------|
| `server/src/routes/psd-import.js` | Criar |
| `server/src/app.js` | Modificar — montar rota `/api/admin/psd-import` |
| `src/pages/admin/AdminHeroSlidesPage.jsx` | Modificar — botão + modal PSD |
| `src/pages/admin/AdminSlideBuilderPage.jsx` | Modificar — detectar `location.state.psdImport` |

---

## Task 1: Backend — Rota psd-import

**Files:**
- Create: `server/src/routes/psd-import.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: Instalar a lib `psd` no servidor**

```bash
cd server && npm install psd
```

Esperado: `added N packages` sem erros.

- [ ] **Step 2: Criar `server/src/routes/psd-import.js`**

```js
const { Router } = require('express');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const PSD        = require('psd');
const requireAuth = require('../middleware/requireAuth');

const router = Router();
router.use(requireAuth);

const tmpDir = path.join(__dirname, '..', '..', 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const publicImgDir = path.join(__dirname, '..', '..', '..', 'public', 'images', 'produtos');

const upload = multer({
  dest: tmpDir,
  limits: { fileSize: 50 * 1024 * 1024 },
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

      const canvasW = psd.header.width;
      const canvasH = psd.header.height;
      const layers  = [];

      for (const layer of psd.layers) {
        const w = layer.width();
        const h = layer.height();
        if (!w || !h) continue;
        const slug     = slugify(layer.name);
        const filename = `psd-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.png`;
        const outPath  = path.join(publicImgDir, filename);
        await layer.image.saveAsPng(outPath);
        layers.push({
          name:   layer.name || 'Camada',
          url:    `/images/produtos/${filename}`,
          x:      Math.round((layer.left / canvasW) * 1000) / 10,
          y:      Math.round((layer.top  / canvasH) * 1000) / 10,
          width:  w,
          height: h,
        });
      }

      res.json({ layers });
    } catch (e) {
      console.error('psd-import:', e.message);
      res.status(422).json({ error: 'Não foi possível processar o PSD.' });
    } finally {
      fs.unlink(tmpPath, () => {});
    }
  });
});

module.exports = router;
```

- [ ] **Step 3: Montar a rota em `server/src/app.js`**

Adicionar após a linha `const uploadRouter = require('./routes/upload');`:

```js
const psdImportRouter = require('./routes/psd-import');
```

Adicionar após a linha `app.use('/api/upload', uploadRouter);`:

```js
app.use('/api/admin/psd-import', psdImportRouter);
```

- [ ] **Step 4: Verificar que o servidor carrega sem erros**

```bash
cd server && node -e "require('./src/app'); console.log('OK')"
```

Esperado: `OK` sem erros.

- [ ] **Step 5: Adicionar `server/tmp` ao `.gitignore`**

Abrir `server/.gitignore` (ou criar se não existir) e adicionar:

```
tmp/
```

- [ ] **Step 6: Commit**

```bash
git add server/src/routes/psd-import.js server/src/app.js server/package.json server/package-lock.json
git commit -m "feat: criar rota POST /api/admin/psd-import para extração de camadas PSD"
```

---

## Task 2: Frontend — Modal de importação em AdminHeroSlidesPage

**Files:**
- Modify: `src/pages/admin/AdminHeroSlidesPage.jsx`

- [ ] **Step 1: Substituir conteúdo completo de `src/pages/admin/AdminHeroSlidesPage.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  { value: 'fundo',  label: 'Fundo'   },
  { value: 'logo',   label: 'Logo'    },
  { value: 'cta',    label: 'CTA'     },
  { value: 'ignore', label: 'Ignorar' },
];

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

function PsdModal({ layers, assignments, onAssign, onOpen, onClose, creating }) {
  const hasFundo = Object.values(assignments).includes('fundo');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[12px] w-full max-w-[680px] max-h-[80vh] flex flex-col shadow-xl">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-[800] text-ink">Camadas do PSD</h2>
            <p className="text-[12px] text-muted mt-0.5">Atribua o papel de cada camada. "Fundo" é obrigatório.</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink text-[22px] leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {layers.length === 0 ? (
            <p className="text-center text-muted text-[14px] py-8">Nenhuma camada foi extraída do arquivo.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {layers.map((layer, i) => (
                <div key={i} className="border border-line rounded-[8px] overflow-hidden">
                  <div className="bg-gray-50 h-28 flex items-center justify-center">
                    <img
                      src={layer.url}
                      alt={layer.name}
                      className="max-h-full max-w-full object-contain p-2"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-[12px] font-[600] text-ink truncate mb-1" title={layer.name}>{layer.name}</p>
                    <p className="text-[10px] text-muted mb-2">{layer.width}×{layer.height}px · x:{layer.x}% y:{layer.y}%</p>
                    <div className="flex flex-wrap gap-1">
                      {ROLES.map(r => (
                        <button
                          key={r.value}
                          onClick={() => onAssign(i, r.value)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-[700] border transition-colors ${
                            assignments[i] === r.value
                              ? 'bg-orange text-white border-orange'
                              : 'bg-white text-muted border-line hover:border-orange hover:text-orange'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-line flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-[600] text-muted hover:text-ink">
            Cancelar
          </button>
          <button
            onClick={onOpen}
            disabled={!hasFundo || creating}
            className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2 rounded-[8px] text-[13px] transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {creating ? 'Criando slide...' : 'Abrir no builder'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminHeroSlidesPage() {
  const { token } = useAuth();
  const navigate   = useNavigate();
  const [slides,       setSlides]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const [psdLayers,    setPsdLayers]    = useState([]);
  const [psdModal,     setPsdModal]     = useState(false);
  const [assignments,  setAssignments]  = useState({});
  const [psdUploading, setPsdUploading] = useState(false);
  const [creating,     setCreating]     = useState(false);

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

  const handlePsdUpload = async (file) => {
    setPsdUploading(true);
    const fd = new FormData();
    fd.append('psd', file);
    try {
      const res  = await fetch('/api/admin/psd-import', { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPsdLayers(data.layers);
      setAssignments(Object.fromEntries(data.layers.map((_, i) => [i, 'ignore'])));
      setPsdModal(true);
    } catch (err) {
      alert(`Erro ao processar PSD: ${err.message}`);
    } finally {
      setPsdUploading(false);
    }
  };

  const assign = (index, role) => {
    setAssignments(prev => {
      const next = { ...prev };
      if (role !== 'ignore') {
        Object.keys(next).forEach(k => { if (next[k] === role) next[k] = 'ignore'; });
      }
      next[index] = role;
      return next;
    });
  };

  const handleOpenBuilder = async () => {
    const fundoIdx = Object.keys(assignments).find(k => assignments[k] === 'fundo');
    if (fundoIdx == null) return;
    setCreating(true);
    try {
      const fundo = psdLayers[fundoIdx];
      const res   = await fetch('/api/admin/hero-slides', {
        method:  'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image_url: fundo.url, ordem: slides.length + 1 }),
      });
      const slide = await res.json();

      const logoIdx = Object.keys(assignments).find(k => assignments[k] === 'logo');
      const ctaIdx  = Object.keys(assignments).find(k => assignments[k] === 'cta');

      const psdImport = {};
      if (logoIdx != null) {
        const l = psdLayers[logoIdx];
        psdImport.logo = { image_url: l.url, x: l.x, y: l.y, width: l.width };
      }
      if (ctaIdx != null) {
        const c = psdLayers[ctaIdx];
        psdImport.cta = { x: c.x, y: c.y };
      }

      navigate(`/admin/hero-slides/${slide.id}/editar`, { state: { psdImport } });
    } catch {
      alert('Erro ao criar slide.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-[700px]">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-[24px] font-[800] text-ink">Hero Slides</h1>
        <div className="flex gap-2">
          <label className={`cursor-pointer border border-orange text-orange font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors hover:bg-orange-50 ${psdUploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {psdUploading ? 'Processando...' : 'Importar PSD'}
            <input type="file" accept=".psd" className="hidden" onChange={e => e.target.files[0] && handlePsdUpload(e.target.files[0])} />
          </label>
          <label className={`cursor-pointer bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {uploading ? 'Enviando...' : '+ Novo slide'}
            <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
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

      {psdModal && (
        <PsdModal
          layers={psdLayers}
          assignments={assignments}
          onAssign={assign}
          onOpen={handleOpenBuilder}
          onClose={() => setPsdModal(false)}
          creating={creating}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/admin/AdminHeroSlidesPage.jsx
git commit -m "feat: adicionar importação de PSD com modal de atribuição de camadas"
```

---

## Task 3: Frontend — Builder detecta psdImport via location.state

**Files:**
- Modify: `src/pages/admin/AdminSlideBuilderPage.jsx`

- [ ] **Step 1: Adicionar `useLocation` ao import do react-router-dom**

Linha 2 atual:
```js
import { useParams, useNavigate } from 'react-router-dom';
```

Substituir por:
```js
import { useParams, useNavigate, useLocation } from 'react-router-dom';
```

- [ ] **Step 2: Adicionar `const location` após `const { token } = useAuth()`**

Linha atual (aprox. linha 28):
```js
const { token } = useAuth();
const canvasRef = useRef(null);
```

Substituir por:
```js
const { token }  = useAuth();
const location   = useLocation();
const canvasRef  = useRef(null);
```

- [ ] **Step 3: Substituir o bloco de `setLayers` dentro do `useEffect`**

Bloco atual (dentro do `.then(slides => { ... })`):
```js
setSlide(s);
setAnimado(s.animado ?? false);
setLayers(s.layers && Object.keys(s.layers).length > 0 ? s.layers : DEFAULT_LAYERS);
```

Substituir por:
```js
setSlide(s);
setAnimado(s.animado ?? false);
const baseLayers = s.layers && Object.keys(s.layers).length > 0 ? s.layers : DEFAULT_LAYERS;
const psdImport  = location.state?.psdImport;
setLayers(psdImport ? {
  ...baseLayers,
  ...(psdImport.logo ? { logo: { ...baseLayers.logo, ...psdImport.logo } } : {}),
  ...(psdImport.cta  ? { cta:  { ...baseLayers.cta,  x: psdImport.cta.x, y: psdImport.cta.y } } : {}),
} : baseLayers);
```

- [ ] **Step 4: Verificar build sem erros**

```bash
cd .. && npm run build 2>&1 | tail -8
```

Esperado: `✓ built in X.XXs` sem erros.

- [ ] **Step 5: Commit e push**

```bash
git add src/pages/admin/AdminSlideBuilderPage.jsx
git commit -m "feat: builder detecta psdImport via location.state e pré-preenche camadas"
git push origin main
```

---

## Self-Review

**Cobertura da spec:**
- ✅ `POST /api/admin/psd-import` — extrai camadas como PNG, retorna nome/url/x/y/width/height
- ✅ Multer aceita `.psd`, limite 50 MB, salva em `server/tmp/`, deleta após processar
- ✅ Botão "Importar PSD" ao lado de "+ Novo slide" em `AdminHeroSlidesPage`
- ✅ Modal com grade de thumbnails e chips de atribuição (Fundo/Logo/CTA/Ignorar)
- ✅ `assign()` garante unicidade: selecionar um papel remove do anterior
- ✅ "Abrir no builder" desabilitado até "Fundo" ser selecionado
- ✅ `handleOpenBuilder` cria slide com fundo, navega com `location.state.psdImport`
- ✅ `AdminSlideBuilderPage` detecta `location.state.psdImport` e mescla logo/cta
- ✅ Posições CTA: apenas x/y transferidas (texto fica com padrão)
- ✅ Posições Logo: image_url, x, y, width transferidos

**Consistência de tipos:**
- `psdImport.logo` → `{ image_url, x, y, width }` — usado igual em Task 2 e Task 3 ✅
- `psdImport.cta`  → `{ x, y }` — usado igual em Task 2 e Task 3 ✅
- `layer.x` e `layer.y` → número float (porcentagem) — produzido no backend e consumido no builder ✅
