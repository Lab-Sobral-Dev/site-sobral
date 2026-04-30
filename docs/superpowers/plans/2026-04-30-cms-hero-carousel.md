# CMS de Páginas + Carrossel Hero — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir edição de textos e imagens de todas as páginas pelo admin, e substituir o hero estático por um carrossel gerenciável.

**Architecture:** Tabela `page_content` (chave-valor com tipo) e `hero_slides` no PostgreSQL. Rotas públicas retornam conteúdo; frontend hidrata com fallback para defaults hardcoded. Admin tem seção "Conteúdo" com editor híbrido (inputs simples + TipTap rich text) e gerenciador de slides com DnD.

**Tech Stack:** Node.js/Express + pg, React 18, @tiptap/react, @tiptap/starter-kit, @dnd-kit/core, @dnd-kit/sortable

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `server/migrations/003_cms.sql` | Criar |
| `server/migrations/run.js` | Criar |
| `server/src/routes/content.js` | Criar |
| `server/src/routes/hero-slides.js` | Criar |
| `server/src/routes/admin-content.js` | Criar |
| `server/src/routes/admin-hero-slides.js` | Criar |
| `server/src/app.js` | Modificar |
| `src/hooks/usePageContent.js` | Criar |
| `src/components/HeroCarousel.jsx` | Criar |
| `src/components/admin/RichTextEditor.jsx` | Criar |
| `src/pages/admin/AdminContentPage.jsx` | Criar |
| `src/pages/admin/AdminHeroSlidesPage.jsx` | Criar |
| `src/pages/HomePage.jsx` | Modificar |
| `src/pages/QuemSomosPage.jsx` | Modificar |
| `src/pages/FaleConoscoPage.jsx` | Modificar |
| `src/pages/admin/AdminLayout.jsx` | Modificar |
| `src/App.jsx` | Modificar |

---

## Task 1: DB — Criar tabelas e seed inicial

**Files:**
- Create: `server/migrations/003_cms.sql`
- Create: `server/migrations/run.js`

- [ ] **Step 1: Criar `server/migrations/003_cms.sql`**

```sql
CREATE TABLE IF NOT EXISTS page_content (
  id         SERIAL PRIMARY KEY,
  page       TEXT NOT NULL,
  key        TEXT NOT NULL,
  value      TEXT,
  type       TEXT NOT NULL DEFAULT 'text',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (page, key)
);

CREATE TABLE IF NOT EXISTS hero_slides (
  id         SERIAL PRIMARY KEY,
  image_url  TEXT NOT NULL,
  ordem      INT NOT NULL DEFAULT 99,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed home
INSERT INTO page_content (page, key, value, type) VALUES
  ('home','historia_titulo','Conheça a história do','text'),
  ('home','historia_subtitulo','Laboratório Sobral','text'),
  ('home','historia_texto_1','<p>Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos brasileiros. Estamos nas casas das famílias levando mais saúde e proporcionando leveza e bem-estar ao dia a dia. Mais que uma indústria, somos um símbolo da luta do povo brasileiro. Essa é nossa essência e isso nunca vai mudar.</p>','richtext'),
  ('home','historia_imagem','/images/fachada.png','image'),
  ('home','marca_tradicionais_imagem','/images/brand-tradicionais.png','image'),
  ('home','marca_calciolax_imagem','/images/brand-calciolax.png','image'),
  ('home','marca_movimex_imagem','/images/brand-movimex.png','image'),
  ('home','marca_oleos_imagem','/images/brand-oleos.png','image')
ON CONFLICT (page, key) DO NOTHING;

-- Seed sobre
INSERT INTO page_content (page, key, value, type) VALUES
  ('sobre','missao','<p>Contribuir com a saúde e a qualidade de vida das famílias brasileiras.</p>','richtext'),
  ('sobre','visao','<p>Continuar a expansão do negócio, tornando-se referência nos segmentos de suplementos alimentares e cosméticos.</p>','richtext'),
  ('sobre','valores','<p>Compromisso, qualidade, respeito, entusiasmo, credibilidade, perseverança e orgulho nordestino.</p>','richtext'),
  ('sobre','historia_titulo','Da cura à prevenção:','text'),
  ('sobre','historia_subtitulo','Uma tradição centenária que sempre se renova!','text'),
  ('sobre','historia_texto_1','<p>Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos brasileiros. Estamos nas casas das famílias levando mais saúde e proporcionando leveza e bem-estar ao dia a dia. Mais que uma indústria, somos um símbolo da luta do povo brasileiro. Essa é nossa essência e isso nunca vai mudar.</p>','richtext'),
  ('sobre','historia_subtitulo_2','Um pouco de história...','text'),
  ('sobre','historia_texto_2','<p>A história do Laboratório Sobral começou a ser contada em 1911, com a abertura de uma botica na cidade de Amarante – Piauí, a Pharmacia Sobral. Em 1919 foi transferida pra Floriano, e aqui fixada. Em 1925 foi para sede própria onde está até hoje.</p>','richtext'),
  ('sobre','historia_texto_3','<p>Ao longo dos anos o pequeno negócio cresceu e, além da Pharmacia, que comercializava produtos próprios e de outras marcas, a botica transformou-se em um laboratório e pequena (e artesanal) indústria de medicamentos.</p>','richtext'),
  ('sobre','historia_texto_4','<p>Até que, em 1973, sob a gestão do economista e empreendedor Teodoro Ferreira Sobral Neto, a fábrica passou a ser continuamente ampliada e modernizada até chegar aos dias de hoje, em que é uma referência no cuidado da saúde dos brasileiros.</p>','richtext'),
  ('sobre','historia_imagem','/images/fachada.png','image')
ON CONFLICT (page, key) DO NOTHING;

-- Seed contato
INSERT INTO page_content (page, key, value, type) VALUES
  ('contato','unidade_fabril','<p><strong>Rua Bento Leão, 25, Centro</strong><br>Floriano | PI | CEP 64800-062.<br>Telefone: (89) 2101-2202</p>','richtext'),
  ('contato','escritorio_comercial','<p><strong>Avenida Elias João Tajra, 1601, Fátima</strong><br>Teresina | PI | CEP 64049-300<br>Telefone: (89) 99921-0283</p>','richtext'),
  ('contato','marketing_telefone','(89) 99999-9999','text'),
  ('contato','marketing_email','marketing@laboratoriosobral.com.br','text'),
  ('contato','atendimento_telefone','(89) 99999-9999','text'),
  ('contato','sac','0800 979 5040','text')
ON CONFLICT (page, key) DO NOTHING;

-- Slide inicial
INSERT INTO hero_slides (image_url, ordem, ativo)
SELECT '/images/hero-banner.png', 1, true
WHERE NOT EXISTS (SELECT 1 FROM hero_slides);
```

- [ ] **Step 2: Criar `server/migrations/run.js`**

```js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const file = process.argv[2];
  if (!file) { console.error('Uso: node migrations/run.js <arquivo.sql>'); process.exit(1); }
  const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
  await pool.query(sql);
  console.log('Migration aplicada:', file);
  await pool.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
```

- [ ] **Step 3: Rodar a migration**

```bash
cd server && node migrations/run.js 003_cms.sql
```

Esperado: `Migration aplicada: 003_cms.sql`

- [ ] **Step 4: Commit**

```bash
git add server/migrations/
git commit -m "feat: adicionar migration CMS (page_content + hero_slides) com seed inicial"
```

---

## Task 2: Backend — Rotas públicas

**Files:**
- Create: `server/src/routes/content.js`
- Create: `server/src/routes/hero-slides.js`

- [ ] **Step 1: Criar `server/src/routes/content.js`**

```js
const { Router } = require('express');
const pool = require('../db');
const router = Router();

router.get('/:page', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT key, value FROM page_content WHERE page = $1',
      [req.params.page]
    );
    const result = {};
    rows.forEach(r => { result[r.key] = r.value; });
    res.json(result);
  } catch (err) {
    console.error('GET /api/content/:page:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
```

- [ ] **Step 2: Criar `server/src/routes/hero-slides.js`**

```js
const { Router } = require('express');
const pool = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, image_url, ordem FROM hero_slides WHERE ativo = true ORDER BY ordem ASC, id ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/hero-slides:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
```

---

## Task 3: Backend — Rotas admin content

**Files:**
- Create: `server/src/routes/admin-content.js`

- [ ] **Step 1: Criar `server/src/routes/admin-content.js`**

```js
const { Router } = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');
const router = Router();
router.use(requireAuth);

router.get('/:page', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT key, value, type FROM page_content WHERE page = $1 ORDER BY id ASC',
      [req.params.page]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/content/:page:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.put('/:page/:key', async (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'Campo "value" obrigatório.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO page_content (page, key, value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (page, key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = NOW()
       RETURNING *`,
      [req.params.page, req.params.key, value]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/admin/content/:page/:key:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
```

---

## Task 4: Backend — Rotas admin hero-slides

**Files:**
- Create: `server/src/routes/admin-hero-slides.js`

- [ ] **Step 1: Criar `server/src/routes/admin-hero-slides.js`**

```js
const { Router } = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');
const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM hero_slides ORDER BY ordem ASC, id ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/hero-slides:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/', async (req, res) => {
  const { image_url, ordem } = req.body;
  if (!image_url) return res.status(400).json({ error: 'image_url obrigatório.' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO hero_slides (image_url, ordem) VALUES ($1, $2) RETURNING *',
      [image_url, ordem ?? 99]
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
  try {
    await Promise.all(
      ids.map((id, index) =>
        pool.query('UPDATE hero_slides SET ordem = $1 WHERE id = $2', [index + 1, id])
      )
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/admin/hero-slides/reorder:', err.message);
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

---

## Task 5: Backend — Montar rotas em app.js + commit

**Files:**
- Modify: `server/src/app.js`

- [ ] **Step 1: Atualizar `server/src/app.js`**

Substituir o conteúdo completo do arquivo:

```js
require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const productsRouter        = require('./routes/products');
const categoriesRouter      = require('./routes/categories');
const contactRouter         = require('./routes/contact');
const authRouter            = require('./routes/auth');
const contentRouter         = require('./routes/content');
const heroSlidesRouter      = require('./routes/hero-slides');

const adminProductsRouter   = require('./routes/admin-products');
const adminCategoriesRouter = require('./routes/admin-categories');
const adminContentRouter    = require('./routes/admin-content');
const adminHeroSlidesRouter = require('./routes/admin-hero-slides');
const uploadRouter          = require('./routes/upload');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN
    : 'http://localhost:5173',
  optionsSuccessStatus: 200,
}));
app.use(express.json());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em breve.' },
}));

app.use('/api/products',            productsRouter);
app.use('/api/categories',          categoriesRouter);
app.use('/api/contact',             contactRouter);
app.use('/api/auth',                authRouter);
app.use('/api/content',             contentRouter);
app.use('/api/hero-slides',         heroSlidesRouter);

app.use('/api/admin/products',      adminProductsRouter);
app.use('/api/admin/categories',    adminCategoriesRouter);
app.use('/api/admin/content',       adminContentRouter);
app.use('/api/admin/hero-slides',   adminHeroSlidesRouter);
app.use('/api/upload',              uploadRouter);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

app.use((err, req, res, _next) => {
  console.error('Erro não tratado:', err.message);
  res.status(500).json({ error: 'Erro interno.' });
});

module.exports = app;
```

- [ ] **Step 2: Verificar servidor**

```bash
cd server && node -e "require('./src/app'); console.log('OK')"
```

Esperado: `OK` sem erros.

- [ ] **Step 3: Commit backend**

```bash
git add server/src/routes/content.js server/src/routes/hero-slides.js server/src/routes/admin-content.js server/src/routes/admin-hero-slides.js server/src/app.js
git commit -m "feat: adicionar rotas CMS (content, hero-slides) e admin correspondentes"
```

---

## Task 6: Frontend — usePageContent hook + HeroCarousel

**Files:**
- Create: `src/hooks/usePageContent.js`
- Create: `src/components/HeroCarousel.jsx`

- [ ] **Step 1: Criar `src/hooks/usePageContent.js`**

```js
import { useState, useEffect } from 'react';

export function usePageContent(page, defaults) {
  const [content, setContent] = useState(defaults);

  useEffect(() => {
    fetch(`/api/content/${page}`)
      .then(r => r.json())
      .then(data => setContent(prev => ({ ...prev, ...data })))
      .catch(() => {});
  }, [page]);

  return content;
}
```

- [ ] **Step 2: Criar `src/components/HeroCarousel.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react';

export default function HeroCarousel() {
  const [slides, setSlides] = useState([]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch('/api/hero-slides')
      .then(r => r.json())
      .then(setSlides)
      .catch(() => {});
  }, []);

  const next = useCallback(() => setIdx(i => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setIdx(i => (i - 1 + slides.length) % slides.length), [slides.length]);

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

  if (slides.length === 1) {
    return (
      <section className="w-full bg-bg leading-[0]">
        <img src={slides[0].image_url} alt="Laboratório Sobral" className="w-full h-auto block" />
      </section>
    );
  }

  return (
    <section
      className="w-full bg-bg leading-[0] relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <img
        src={slides[idx].image_url}
        alt={`Slide ${idx + 1}`}
        className="w-full h-auto block"
      />

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
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
            className={`w-2.5 h-2.5 rounded-full border-none transition-all ${
              i === idx ? 'bg-orange scale-125' : 'bg-white/70 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
```

---

## Task 7: Frontend — Atualizar HomePage

**Files:**
- Modify: `src/pages/HomePage.jsx`

- [ ] **Step 1: Substituir o conteúdo completo de `src/pages/HomePage.jsx`**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATALOG } from '../data/catalog';
import ProductCard from '../components/ProductCard';
import HeroCarousel from '../components/HeroCarousel';
import { usePageContent } from '../hooks/usePageContent';

const FEATURED_IDS = ['aqualema','calciolax-articule','saludoz','propolis-verde','movimex','calciolax-kids','rosa-mosqueta-spray','propzinco'];

const BRAND_LABELS = ['Linha Tradicionais', 'Família Calciolax', 'Movimex', 'Óleos Sobral'];
const BRAND_KEYS   = ['marca_tradicionais_imagem', 'marca_calciolax_imagem', 'marca_movimex_imagem', 'marca_oleos_imagem'];

const HOME_DEFAULTS = {
  historia_titulo:    'Conheça a história do',
  historia_subtitulo: 'Laboratório Sobral',
  historia_texto_1:   '<p>Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos brasileiros. Estamos nas casas das famílias levando mais saúde e proporcionando leveza e bem-estar ao dia a dia. Mais que uma indústria, somos um símbolo da luta do povo brasileiro. Essa é nossa essência e isso nunca vai mudar.</p>',
  historia_imagem:             '/images/fachada.png',
  marca_tradicionais_imagem:   '/images/brand-tradicionais.png',
  marca_calciolax_imagem:      '/images/brand-calciolax.png',
  marca_movimex_imagem:        '/images/brand-movimex.png',
  marca_oleos_imagem:          '/images/brand-oleos.png',
};

export default function HomePage() {
  const navigate = useNavigate();
  const [carouselIdx, setCarouselIdx] = useState(0);
  const content = usePageContent('home', HOME_DEFAULTS);

  const featured = CATALOG.filter(p => FEATURED_IDS.includes(p.id));
  const visible  = featured.slice(carouselIdx, carouselIdx + 4);

  return (
    <>
      <HeroCarousel />

      {/* NOSSAS LINHAS */}
      <section className="max-w-content mx-auto px-10 mt-[60px]">
        <h2 className="text-[28px] font-[800] text-center mt-10 mb-7">Nossas Linhas</h2>
        <div className="grid grid-cols-4 gap-5 max-w-[960px] mx-auto">
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

      {/* MAIS VENDIDOS */}
      <section className="max-w-content mx-auto px-10 mt-[70px]">
        <h2 className="text-[28px] font-[800] text-center mt-10 mb-7">Produtos mais vendidos</h2>
        <div className="relative">
          <button
            className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-none bg-white shadow text-orange flex items-center justify-center text-[22px] z-[5] transition-all hover:bg-orange hover:text-white disabled:opacity-30"
            onClick={() => setCarouselIdx(Math.max(0, carouselIdx - 1))}
            disabled={carouselIdx === 0}
          >‹</button>
          <div className="grid grid-cols-4 gap-[18px] px-5">
            {visible.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => navigate(`/produtos/${p.id}`)} />
            ))}
          </div>
          <button
            className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-none bg-white shadow text-orange flex items-center justify-center text-[22px] z-[5] transition-all hover:bg-orange hover:text-white disabled:opacity-30"
            onClick={() => setCarouselIdx(Math.min(featured.length - 4, carouselIdx + 1))}
            disabled={carouselIdx >= featured.length - 4}
          >›</button>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section className="max-w-content mx-auto px-10 mt-[80px]">
        <div className="grid grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <div className="mt-12 mb-6">
              <h2 className="text-[36px] font-[800] leading-[1.15] mb-2.5">
                {content.historia_titulo}
                <span className="text-orange block">{content.historia_subtitulo}</span>
              </h2>
              <div className="h-[2px] bg-gradient-to-r from-orange to-transparent mt-2.5" />
            </div>
            <div
              className="text-[15.5px] leading-[1.7] text-ink-light mb-7"
              dangerouslySetInnerHTML={{ __html: content.historia_texto_1 }}
            />
            <button
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border-none font-bold text-[14px] tracking-[.3px] text-white bg-gradient-to-b from-[#F89B4D] to-[#E85A0C] shadow-[0_2px_8px_rgba(232,90,12,.3)] transition-all hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(232,90,12,.42)]"
              onClick={() => navigate('/quem-somos')}
            >
              VEJA MAIS
            </button>
          </div>
          <div className="aspect-[4/3] rounded overflow-hidden shadow">
            <img src={content.historia_imagem} alt="Fachada do Laboratório Sobral" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>
    </>
  );
}
```

---

## Task 8: Frontend — Atualizar QuemSomosPage

**Files:**
- Modify: `src/pages/QuemSomosPage.jsx`

- [ ] **Step 1: Substituir o conteúdo completo de `src/pages/QuemSomosPage.jsx`**

```jsx
import { usePageContent } from '../hooks/usePageContent';

const SOBRE_DEFAULTS = {
  missao:             '<p>Contribuir com a saúde e a qualidade de vida das famílias brasileiras.</p>',
  visao:              '<p>Continuar a expansão do negócio, tornando-se referência nos segmentos de suplementos alimentares e cosméticos.</p>',
  valores:            '<p>Compromisso, qualidade, respeito, entusiasmo, credibilidade, perseverança e orgulho nordestino.</p>',
  historia_titulo:    'Da cura à prevenção:',
  historia_subtitulo: 'Uma tradição centenária que sempre se renova!',
  historia_texto_1:   '<p>Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos brasileiros. Estamos nas casas das famílias levando mais saúde e proporcionando leveza e bem-estar ao dia a dia. Mais que uma indústria, somos um símbolo da luta do povo brasileiro. Essa é nossa essência e isso nunca vai mudar.</p>',
  historia_subtitulo_2: 'Um pouco de história...',
  historia_texto_2:   '<p>A história do Laboratório Sobral começou a ser contada em 1911, com a abertura de uma botica na cidade de Amarante – Piauí, a Pharmacia Sobral. Em 1919 foi transferida pra Floriano, e aqui fixada. Em 1925 foi para sede própria onde está até hoje.</p>',
  historia_texto_3:   '<p>Ao longo dos anos o pequeno negócio cresceu e, além da Pharmacia, que comercializava produtos próprios e de outras marcas, a botica transformou-se em um laboratório e pequena (e artesanal) indústria de medicamentos.</p>',
  historia_texto_4:   '<p>Até que, em 1973, sob a gestão do economista e empreendedor Teodoro Ferreira Sobral Neto, a fábrica passou a ser continuamente ampliada e modernizada até chegar aos dias de hoje, em que é uma referência no cuidado da saúde dos brasileiros.</p>',
  historia_imagem:    '/images/fachada.png',
};

export default function QuemSomosPage() {
  const content = usePageContent('sobre', SOBRE_DEFAULTS);

  return (
    <>
      <div className="bg-gradient-to-b from-orange to-[#E85A0C] text-white text-center py-[22px] px-5 text-[26px] font-[800] tracking-[.3px]">
        Quem Somos
      </div>

      <section className="max-w-content mx-auto px-10 mt-10">
        <div className="bg-gradient-to-br from-[#F89B4D] via-orange to-[#E0580A] rounded-lg p-[32px_28px] text-white grid grid-cols-[1fr_1px_1fr_1px_1fr] gap-6 shadow-[0_4px_18px_rgba(232,90,12,.22)]">
          <div className="text-center px-2.5">
            <h3 className="text-white text-[22px] font-[800] mb-2 tracking-[.3px]">Missão</h3>
            <div
              className="text-[14.5px] leading-[1.55] m-0 font-semibold opacity-[.96]"
              dangerouslySetInnerHTML={{ __html: content.missao }}
            />
          </div>
          <div className="bg-white/40 w-px" />
          <div className="text-center px-2.5">
            <h3 className="text-white text-[22px] font-[800] mb-2 tracking-[.3px]">Visão</h3>
            <div
              className="text-[14.5px] leading-[1.55] m-0 font-semibold opacity-[.96]"
              dangerouslySetInnerHTML={{ __html: content.visao }}
            />
          </div>
          <div className="bg-white/40 w-px" />
          <div className="text-center px-2.5">
            <h3 className="text-white text-[22px] font-[800] mb-2 tracking-[.3px]">Valores</h3>
            <div
              className="text-[14.5px] leading-[1.55] m-0 font-semibold opacity-[.96]"
              dangerouslySetInnerHTML={{ __html: content.valores }}
            />
          </div>
        </div>
      </section>

      <section className="max-w-content mx-auto px-10 mt-[60px] pb-16">
        <div className="grid grid-cols-[1.35fr_1fr] gap-14 items-start">
          <div>
            <div className="mt-12 mb-9">
              <h2 className="text-[36px] font-[800] leading-[1.15] mb-2.5">
                {content.historia_titulo}
                <span className="text-orange block">{content.historia_subtitulo}</span>
              </h2>
              <div className="h-[2px] bg-gradient-to-r from-orange to-transparent mt-2.5" />
            </div>
            <div
              className="text-[15px] leading-[1.7] text-ink-light mb-9"
              dangerouslySetInnerHTML={{ __html: content.historia_texto_1 }}
            />
            <h2 className="text-[30px] font-[800] mb-[18px]">{content.historia_subtitulo_2}</h2>
            <div
              className="text-[15px] leading-[1.7] text-ink-light mb-[18px]"
              dangerouslySetInnerHTML={{ __html: content.historia_texto_2 }}
            />
            <div
              className="text-[15px] leading-[1.7] text-ink-light mb-[18px]"
              dangerouslySetInnerHTML={{ __html: content.historia_texto_3 }}
            />
            <div
              className="text-[15px] leading-[1.7] text-ink-light"
              dangerouslySetInnerHTML={{ __html: content.historia_texto_4 }}
            />
          </div>

          <div className="flex flex-col gap-6 pt-[60px]">
            <div className="aspect-[4/5] bg-[#DCDCDC] rounded-[18px_18px_28px_28px] relative overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,.1)] -rotate-1">
              <img src={content.historia_imagem} alt="Fachada do Laboratório Sobral" className="absolute inset-0 w-full h-full object-cover z-[2]" />
            </div>
            <div className="aspect-[4/3.6] bg-[#DCDCDC] rounded-[18px_18px_28px_28px] relative overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,.1)] rotate-[1.2deg]">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#D1D1D1_0_10px,#DCDCDC_10px_20px)]" />
              <div className="absolute inset-0 flex items-center justify-center text-[11px] text-[#999] font-mono text-center p-3 leading-snug z-[2]">
                [ foto histórica: linha de produção ]
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
```

---

## Task 9: Frontend — Atualizar FaleConoscoPage

**Files:**
- Modify: `src/pages/FaleConoscoPage.jsx`

- [ ] **Step 1: Adicionar import e DEFAULTS no topo de `src/pages/FaleConoscoPage.jsx`**

Substituir a linha `import { useState } from 'react';` por:

```jsx
import { useState } from 'react';
import { usePageContent } from '../hooks/usePageContent';

const CONTATO_DEFAULTS = {
  unidade_fabril:       '<p><strong>Rua Bento Leão, 25, Centro</strong><br>Floriano | PI | CEP 64800-062.<br>Telefone: (89) 2101-2202</p>',
  escritorio_comercial: '<p><strong>Avenida Elias João Tajra, 1601, Fátima</strong><br>Teresina | PI | CEP 64049-300<br>Telefone: (89) 99921-0283</p>',
  marketing_telefone:   '(89) 99999-9999',
  marketing_email:      'marketing@laboratoriosobral.com.br',
  atendimento_telefone: '(89) 99999-9999',
  sac:                  '0800 979 5040',
};
```

- [ ] **Step 2: Adicionar hook dentro de `FaleConoscoPage` e substituir blocos de contato**

Logo após `const [errors, setErrors] = useState({});`, adicionar:

```jsx
const content = usePageContent('contato', CONTATO_DEFAULTS);
```

Substituir o bloco de contato (linhas 40–68 do original, `<div className="grid grid-cols-[1.4fr_1fr]...">`):

```jsx
<div className="grid grid-cols-[1.4fr_1fr] gap-12 mb-12">
  <div>
    <h2 className="text-[22px] font-[800] text-orange mb-[18px]">LABORATÓRIO SOBRAL</h2>
    <div className="mb-[22px] text-[14.5px] leading-[1.6]">
      <div className="font-[800] mb-1">Unidade Fabril</div>
      <div dangerouslySetInnerHTML={{ __html: content.unidade_fabril }} />
    </div>
    <div className="text-[14.5px] leading-[1.6]">
      <div className="font-[800] mb-1">Escritório Comercial</div>
      <div dangerouslySetInnerHTML={{ __html: content.escritorio_comercial }} />
    </div>
  </div>

  <div className="flex flex-col gap-3.5 items-start">
    <div className="bg-white rounded-[14px] py-[14px] px-[22px] w-full max-w-[360px] shadow-sm border border-line">
      <div className="bg-gradient-to-b from-[#F89B4D] to-[#E0580A] text-white font-[800] text-[14px] tracking-[.5px] py-2 px-[18px] rounded-full inline-block mb-1">MARKETING</div>
      <div className="text-[14px] text-ink-light mt-1">{content.marketing_telefone}</div>
      <div className="text-[14px] text-ink-light">{content.marketing_email}</div>
    </div>
    <div className="bg-white rounded-[14px] py-[14px] px-[22px] w-full max-w-[360px] shadow-sm border border-line">
      <div className="bg-gradient-to-b from-[#F89B4D] to-[#E0580A] text-white font-[800] text-[14px] tracking-[.5px] py-2 px-[18px] rounded-full inline-block mb-1">ATENDIMENTO</div>
      <div className="text-[14px] text-ink-light mt-1">{content.atendimento_telefone}</div>
    </div>
    <div className="mt-2.5 text-[18px] font-[800] text-orange">SAC {content.sac}</div>
  </div>
</div>
```

---

## Task 10: Admin — Instalar deps + RichTextEditor

**Files:**
- Create: `src/components/admin/RichTextEditor.jsx`

- [ ] **Step 1: Instalar dependências**

```bash
npm install @tiptap/react @tiptap/starter-kit @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Verificar que `package.json` lista os 5 pacotes em `dependencies`.

- [ ] **Step 2: Criar `src/components/admin/RichTextEditor.jsx`**

```jsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const btn = (action, label, active) => (
    <button
      type="button"
      onClick={action}
      className={`px-2 py-1 text-[12px] rounded font-[600] transition-colors ${
        active ? 'bg-orange text-white' : 'bg-[#f0f0f0] text-ink-light hover:bg-[#e0e0e0]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="border border-line rounded-[8px] overflow-hidden">
      <div className="flex gap-1.5 p-2 border-b border-line bg-[#fafafa] flex-wrap">
        {btn(() => editor.chain().focus().toggleBold().run(), 'N', editor.isActive('bold'))}
        {btn(() => editor.chain().focus().toggleItalic().run(), 'I', editor.isActive('italic'))}
        {btn(() => editor.chain().focus().toggleBulletList().run(), '• Lista', editor.isActive('bulletList'))}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), '1. Lista', editor.isActive('orderedList'))}
        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', editor.isActive('heading', { level: 2 }))}
      </div>
      <EditorContent
        editor={editor}
        className="p-3 text-[14px] min-h-[100px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_h2]:text-[20px] [&_.ProseMirror_h2]:font-[800] [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5"
      />
    </div>
  );
}
```

---

## Task 11: Admin — AdminContentPage

**Files:**
- Create: `src/pages/admin/AdminContentPage.jsx`

- [ ] **Step 1: Criar `src/pages/admin/AdminContentPage.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import RichTextEditor from '../../components/admin/RichTextEditor';

const PAGE_CONFIG = {
  home: {
    title: 'Home',
    sections: [
      {
        label: 'Seção História',
        fields: [
          { key: 'historia_titulo',    label: 'Título principal',       type: 'text' },
          { key: 'historia_subtitulo', label: 'Subtítulo (laranja)',    type: 'text' },
          { key: 'historia_texto_1',   label: 'Parágrafo de história',  type: 'richtext' },
          { key: 'historia_imagem',    label: 'Foto lateral',           type: 'image' },
        ],
      },
      {
        label: 'Nossas Linhas — imagens das marcas',
        fields: [
          { key: 'marca_tradicionais_imagem', label: 'Linha Tradicionais', type: 'image' },
          { key: 'marca_calciolax_imagem',    label: 'Família Calciolax',  type: 'image' },
          { key: 'marca_movimex_imagem',      label: 'Movimex',            type: 'image' },
          { key: 'marca_oleos_imagem',        label: 'Óleos Sobral',       type: 'image' },
        ],
      },
    ],
  },
  sobre: {
    title: 'Quem Somos',
    sections: [
      {
        label: 'Missão, Visão e Valores',
        fields: [
          { key: 'missao',  label: 'Missão',  type: 'richtext' },
          { key: 'visao',   label: 'Visão',   type: 'richtext' },
          { key: 'valores', label: 'Valores', type: 'richtext' },
        ],
      },
      {
        label: 'Seção História',
        fields: [
          { key: 'historia_titulo',      label: 'Título principal',                  type: 'text' },
          { key: 'historia_subtitulo',   label: 'Subtítulo (laranja)',               type: 'text' },
          { key: 'historia_texto_1',     label: 'Parágrafo introdutório',            type: 'richtext' },
          { key: 'historia_subtitulo_2', label: 'Subtítulo "Um pouco de história"',  type: 'text' },
          { key: 'historia_texto_2',     label: 'Parágrafo 2 (1911...)',             type: 'richtext' },
          { key: 'historia_texto_3',     label: 'Parágrafo 3 (negócio cresceu...)',  type: 'richtext' },
          { key: 'historia_texto_4',     label: 'Parágrafo 4 (1973...)',             type: 'richtext' },
          { key: 'historia_imagem',      label: 'Foto da fachada',                  type: 'image' },
        ],
      },
    ],
  },
  contato: {
    title: 'Fale Conosco',
    sections: [
      {
        label: 'Informações de contato',
        fields: [
          { key: 'unidade_fabril',       label: 'Unidade Fabril (endereço + telefone)',      type: 'richtext' },
          { key: 'escritorio_comercial', label: 'Escritório Comercial (endereço + telefone)', type: 'richtext' },
          { key: 'marketing_telefone',   label: 'Marketing — Telefone',                      type: 'text' },
          { key: 'marketing_email',      label: 'Marketing — E-mail',                        type: 'text' },
          { key: 'atendimento_telefone', label: 'Atendimento — Telefone',                    type: 'text' },
          { key: 'sac',                  label: 'SAC',                                       type: 'text' },
        ],
      },
    ],
  },
};

export default function AdminContentPage({ page }) {
  const { token } = useAuth();
  const [content,   setContent]   = useState({});
  const [saving,    setSaving]    = useState({});
  const [saved,     setSaved]     = useState({});
  const [uploading, setUploading] = useState({});

  const authHeaders = { Authorization: `Bearer ${token}` };
  const config = PAGE_CONFIG[page];

  useEffect(() => {
    fetch(`/api/admin/content/${page}`, { headers: authHeaders })
      .then(r => r.json())
      .then(rows => {
        const map = {};
        rows.forEach(r => { map[r.key] = r.value || ''; });
        setContent(map);
      })
      .catch(() => {});
  }, [page]);

  const saveField = async (key, value) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await fetch(`/api/admin/content/${page}/${key}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      setSaved(s => ({ ...s, [key]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 2000);
    } catch { /* silent */ } finally {
      setSaving(s => ({ ...s, [key]: false }));
    }
  };

  const handleImageUpload = async (key, file) => {
    setUploading(u => ({ ...u, [key]: true }));
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res  = await fetch('/api/upload', { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContent(c => ({ ...c, [key]: data.url }));
      await saveField(key, data.url);
    } catch { /* silent */ } finally {
      setUploading(u => ({ ...u, [key]: false }));
    }
  };

  if (!config) return <div className="p-8 text-muted">Página não configurada.</div>;

  return (
    <div className="p-8 max-w-[720px]">
      <h1 className="text-[24px] font-[800] text-ink mb-1">{config.title}</h1>
      <p className="text-[13px] text-muted mb-6">Alterações publicadas imediatamente no site.</p>

      {config.sections.map(section => (
        <div key={section.label} className="mb-8">
          <div className="text-[11px] font-[700] text-orange tracking-[.6px] uppercase mb-4">{section.label}</div>
          <div className="flex flex-col gap-4">
            {section.fields.map(field => (
              <div key={field.key} className="bg-white border border-line rounded-[10px] p-4">
                <label className="block text-[13px] font-[600] text-ink-light mb-2">{field.label}</label>

                {field.type === 'text' && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={content[field.key] || ''}
                      onChange={e => setContent(c => ({ ...c, [field.key]: e.target.value }))}
                      onBlur={e => saveField(field.key, e.target.value)}
                      className="flex-1 border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange"
                    />
                    {saving[field.key] && <span className="text-[12px] text-muted">Salvando...</span>}
                    {saved[field.key]  && <span className="text-[12px] text-green-600">✓ Salvo</span>}
                  </div>
                )}

                {field.type === 'richtext' && (
                  <div>
                    <RichTextEditor
                      value={content[field.key] || ''}
                      onChange={val => setContent(c => ({ ...c, [field.key]: val }))}
                    />
                    <div className="flex justify-end items-center gap-2 mt-2">
                      {saving[field.key] && <span className="text-[12px] text-muted">Salvando...</span>}
                      {saved[field.key]  && <span className="text-[12px] text-green-600">✓ Salvo</span>}
                      <button
                        type="button"
                        onClick={() => saveField(field.key, content[field.key] || '')}
                        disabled={saving[field.key]}
                        className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-4 py-1.5 rounded-[6px] text-[12px] transition-colors disabled:opacity-60"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                )}

                {field.type === 'image' && (
                  <div className="flex gap-3 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={content[field.key] || ''}
                        onChange={e => setContent(c => ({ ...c, [field.key]: e.target.value }))}
                        onBlur={e => saveField(field.key, e.target.value)}
                        placeholder="/images/..."
                        className="w-full border border-line rounded-[8px] px-4 py-2.5 text-[13px] outline-none focus:border-orange mb-2"
                      />
                      <div className="flex gap-2 items-center flex-wrap">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={e => e.target.files[0] && handleImageUpload(field.key, e.target.files[0])}
                          className="text-[12px] text-ink-light"
                        />
                        {uploading[field.key] && <span className="text-[12px] text-muted">Enviando...</span>}
                        {saved[field.key]     && <span className="text-[12px] text-green-600">✓ Salvo</span>}
                      </div>
                    </div>
                    {content[field.key] && (
                      <img src={content[field.key]} alt="" className="w-20 h-20 object-contain rounded border border-line flex-shrink-0" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Task 12: Admin — AdminHeroSlidesPage

**Files:**
- Create: `src/pages/admin/AdminHeroSlidesPage.jsx`

- [ ] **Step 1: Criar `src/pages/admin/AdminHeroSlidesPage.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../context/AuthContext';

function SortableSlide({ slide, onToggle, onDelete }) {
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
    await fetch('/api/admin/hero-slides/reorder', {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map(s => s.id) }),
    });
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
      <p className="text-[13px] text-muted mb-6">Arraste para reordenar. Carrossel aparece com 2+ slides ativos.</p>

      {loading ? (
        <div className="py-10 text-center text-muted text-[14px]">Carregando...</div>
      ) : slides.length === 0 ? (
        <div className="py-10 text-center text-muted text-[14px]">Nenhum slide. Adicione o primeiro!</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {slides.map(slide => (
                <SortableSlide key={slide.id} slide={slide} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
```

---

## Task 13: Admin — Sidebar + rotas + commit final

**Files:**
- Modify: `src/pages/admin/AdminLayout.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Atualizar sidebar em `src/pages/admin/AdminLayout.jsx`**

Substituir o bloco `<nav>` completo:

```jsx
<nav className="flex flex-col p-3 gap-1 flex-1">
  <div className="px-3 pt-2 pb-1 text-[10px] font-[700] text-[#aaa] uppercase tracking-[.6px]">Catálogo</div>
  <NavLink to="/admin" end className={navClass}>Produtos</NavLink>
  <NavLink to="/admin/categorias" className={navClass}>Categorias</NavLink>
  <div className="px-3 pt-3 pb-1 text-[10px] font-[700] text-[#aaa] uppercase tracking-[.6px]">Conteúdo</div>
  <NavLink to="/admin/conteudo/home" className={navClass}>Home</NavLink>
  <NavLink to="/admin/conteudo/sobre" className={navClass}>Quem Somos</NavLink>
  <NavLink to="/admin/conteudo/contato" className={navClass}>Fale Conosco</NavLink>
  <NavLink to="/admin/hero-slides" className={navClass}>Hero Slides</NavLink>
</nav>
```

- [ ] **Step 2: Atualizar imports e rotas em `src/App.jsx`**

Adicionar imports após a linha `import AdminCategoriesPage`:

```jsx
import AdminContentPage    from './pages/admin/AdminContentPage';
import AdminHeroSlidesPage from './pages/admin/AdminHeroSlidesPage';
```

Adicionar dentro do array `children` do objeto `path: '/admin'`:

```jsx
{ path: 'conteudo/home',    element: <AdminContentPage page="home" /> },
{ path: 'conteudo/sobre',   element: <AdminContentPage page="sobre" /> },
{ path: 'conteudo/contato', element: <AdminContentPage page="contato" /> },
{ path: 'hero-slides',      element: <AdminHeroSlidesPage /> },
```

- [ ] **Step 3: Verificar build**

```bash
npm run build
```

Esperado: `✓ built in X.XXs` sem erros.

- [ ] **Step 4: Commit final**

```bash
git add src/ 
git commit -m "feat: implementar CMS de páginas + carrossel hero"
git push origin main
```

---

## Self-Review

**Cobertura do spec:**
- ✅ Tabela `page_content` (chave-valor + tipo)
- ✅ Tabela `hero_slides` com seed do banner atual
- ✅ Rotas públicas: `GET /api/content/:page`, `GET /api/hero-slides`
- ✅ Rotas admin: GET + PUT content, CRUD hero-slides com reorder e toggle
- ✅ `usePageContent` hook com fallback para DEFAULTS
- ✅ `HeroCarousel` com autoplay 5s, setas, pontos; exibe estático se 1 slide
- ✅ `HomePage` hidratada com fallback
- ✅ `QuemSomosPage` hidratada com fallback (missão/visão/valores + 4 parágrafos)
- ✅ `FaleConoscoPage` hidratada com fallback (endereços + contatos)
- ✅ `RichTextEditor` com TipTap (negrito, itálico, listas, H2)
- ✅ `AdminContentPage` genérico com config por página (text/richtext/image)
- ✅ `AdminHeroSlidesPage` com DnD, toggle ativo, upload, delete
- ✅ Sidebar atualizada com seção "Conteúdo"
- ✅ Rotas admin adicionadas em App.jsx
- ✅ `PUT /reorder` definido ANTES de `PATCH /:id/ativo` para evitar conflito Express
