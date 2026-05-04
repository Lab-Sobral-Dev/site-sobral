# Design: Importação de PSD no Slide Builder

**Data:** 2026-05-04
**Status:** Aprovado — pronto para implementação

---

## Objetivo

Permitir que o admin faça upload de um arquivo `.psd` na lista de hero slides, veja todas as camadas extraídas com thumbnails, atribua papéis (Fundo / Logo / CTA / Ignorar) e abra o builder com as camadas pré-posicionadas conforme o layout original do PSD.

---

## Fora do escopo

- Preservação de blend modes, sombras e efeitos de ajuste do Photoshop (camadas exportadas como pixel base)
- Suporte a mais de um logo ou mais de um CTA por slide
- Extração de texto de camadas de texto do Photoshop
- Preview do PSD composto antes da atribuição de camadas

---

## Fluxo completo

1. Admin clica em **"Importar PSD"** na `AdminHeroSlidesPage`
2. Seleciona arquivo `.psd` (limite 50 MB)
3. Frontend envia para `POST /api/admin/psd-import`
4. Backend extrai camadas visíveis como PNG, retorna lista
5. Modal abre com grade de thumbnails — cada camada começa como "Ignorar"
6. Admin atribui: **Fundo** (obrigatório), **Logo** (opcional), **CTA** (opcional)
7. Admin clica **"Abrir no builder"**
8. Frontend cria slide via `POST /api/admin/hero-slides` com a URL do fundo
9. Navega para `/admin/hero-slides/{id}/editar` com `location.state = { psdImport: { logo, cta } }`
10. Builder detecta o state e pré-preenche as camadas

---

## Backend

### Nova dependência

```
psd (npm)
```

### Nova rota

**`POST /api/admin/psd-import`** — requer auth

**Arquivo:** `server/src/routes/psd-import.js`

**Multer config:**
- Campo: `psd`
- Extensão aceita: `.psd`
- MIME aceito: `image/vnd.adobe.photoshop` ou `application/octet-stream`
- Limite: 50 MB
- Destino temporário: `server/tmp/` (criado se não existir)

**Processamento:**
```js
const PSD = require('psd');
const psd = PSD.fromFile(tmpPath);
await psd.parse();

const canvasW = psd.header.width;
const canvasH = psd.header.height;

const layers = [];
for (const layer of psd.layers) {
  if (!layer.visible || !layer.width() || !layer.height()) continue;
  const filename = `psd-layer-${slugify(layer.name)}-${Date.now()}.png`;
  const outPath = path.join(publicImgDir, filename);
  await layer.image.saveAsPng(outPath);
  layers.push({
    name:   layer.name,
    url:    `/images/produtos/${filename}`,
    x:      Math.round((layer.left / canvasW) * 100 * 10) / 10,
    y:      Math.round((layer.top  / canvasH) * 100 * 10) / 10,
    width:  layer.width(),
    height: layer.height(),
  });
}
fs.unlinkSync(tmpPath); // remove PSD temporário
res.json({ layers });
```

**Resposta de sucesso (200):**
```json
{
  "layers": [
    { "name": "background", "url": "/images/produtos/psd-layer-background-1234.png", "x": 0, "y": 0, "width": 1920, "height": 600 },
    { "name": "logo",       "url": "/images/produtos/psd-layer-logo-1235.png",       "x": 72.5, "y": 10.2, "width": 160, "height": 80 },
    { "name": "btn-cta",    "url": "/images/produtos/psd-layer-btn-cta-1236.png",    "x": 48.0, "y": 75.0, "width": 200, "height": 50 }
  ]
}
```

**Erros:**
- `400` — arquivo ausente ou extensão inválida
- `422` — falha ao parsear o PSD (arquivo corrompido ou formato incompatível)
- `500` — erro interno

**Mount em `app.js`:**
```js
app.use('/api/admin/psd-import', require('./routes/psd-import'));
```

---

## Frontend

### AdminHeroSlidesPage.jsx (modificado)

**Novos estados:**
```js
const [psdLayers,     setPsdLayers]     = useState([]);   // camadas extraídas
const [psdModal,      setPsdModal]      = useState(false); // modal aberto
const [assignments,   setAssignments]   = useState({});    // { layerIndex: 'fundo'|'logo'|'cta'|'ignore' }
const [psdUploading,  setPsdUploading]  = useState(false);
const [creatingSlide, setCreatingSlide] = useState(false);
```

**Botão "Importar PSD"** ao lado de "+ Novo slide":
```jsx
<label className={`cursor-pointer border border-orange text-orange font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors hover:bg-orange-50 ${psdUploading ? 'opacity-60 pointer-events-none' : ''}`}>
  {psdUploading ? 'Processando...' : 'Importar PSD'}
  <input type="file" accept=".psd" className="hidden" onChange={e => e.target.files[0] && handlePsdUpload(e.target.files[0])} />
</label>
```

**handlePsdUpload:**
```js
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
```

**assign(index, role):** garante unicidade de fundo/logo/cta:
```js
const assign = (index, role) => {
  setAssignments(prev => {
    const next = { ...prev };
    // remove papel de quem tinha antes (exceto ignore)
    if (role !== 'ignore') {
      Object.keys(next).forEach(k => { if (next[k] === role) next[k] = 'ignore'; });
    }
    next[index] = role;
    return next;
  });
};
```

**handleOpenBuilder:**
```js
const handleOpenBuilder = async () => {
  const fundoIdx = Object.keys(assignments).find(k => assignments[k] === 'fundo');
  if (fundoIdx == null) return alert('Selecione a camada de fundo.');
  setCreatingSlide(true);
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
    setCreatingSlide(false);
  }
};
```

**Modal:** overlay com grade de thumbnails. Cada camada mostra:
- Thumbnail (`<img>` com `object-contain`)
- Nome da camada
- Chips: Fundo / Logo / CTA / Ignorar (chip ativo em laranja)

### AdminSlideBuilderPage.jsx (modificado)

Adicionar import de `useLocation`:
```js
import { useParams, useNavigate, useLocation } from 'react-router-dom';
```

No `useEffect` de carregamento, após preencher `layers` com os dados do banco:
```js
const location = useLocation();
if (location.state?.psdImport) {
  const { psdImport } = location.state;
  setLayers(prev => ({
    ...prev,
    ...(psdImport.logo ? { logo: { ...prev.logo, ...psdImport.logo } } : {}),
    ...(psdImport.cta  ? { cta:  { ...prev.cta,  ...psdImport.cta  } } : {}),
  }));
}
```

---

## Mapa de arquivos

| Arquivo | Ação |
|---------|------|
| `server/src/routes/psd-import.js` | Criar |
| `server/src/app.js` | Modificar — montar rota `/api/admin/psd-import` |
| `src/pages/admin/AdminHeroSlidesPage.jsx` | Modificar — botão + modal PSD |
| `src/pages/admin/AdminSlideBuilderPage.jsx` | Modificar — detectar `location.state.psdImport` |

---

## Dependências novas

| Pacote | Onde | Motivo |
|--------|------|--------|
| `psd` | `server/` | Parsear e exportar camadas do PSD |
