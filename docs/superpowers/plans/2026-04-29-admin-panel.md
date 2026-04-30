# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar painel administrativo para gestão de produtos e categorias, com autenticação JWT, CRUD completo e upload de imagens.

**Architecture:** Backend Express com novas rotas protegidas em `/api/admin/*`. Frontend React em `/admin/*` com layout próprio (sidebar, sem Header/Footer público). AuthContext (React Context) gerencia token JWT via localStorage e envolve toda a árvore de componentes a partir de `main.jsx`.

**Tech Stack:** Node.js/Express + multer (upload), React 18, React Router v6, Tailwind CSS, JWT via localStorage

---

## Mapa de arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `server/src/routes/admin-products.js` | Criar | GET/POST/PUT/PATCH/DELETE `/api/admin/products` |
| `server/src/routes/admin-categories.js` | Criar | POST/PUT/DELETE `/api/admin/categories` |
| `server/src/routes/upload.js` | Criar | POST `/api/upload` (multer, requer auth) |
| `server/src/app.js` | Modificar | Montar as 3 novas rotas |
| `src/context/AuthContext.jsx` | Criar | Estado auth global + token JWT + login/logout |
| `src/main.jsx` | Modificar | Envolver `<App>` com `<AuthProvider>` |
| `src/pages/admin/AdminLoginPage.jsx` | Criar | Formulário de login (rota pública) |
| `src/pages/admin/AdminLayout.jsx` | Criar | Sidebar + guarda de rota (redireciona se não auth) |
| `src/pages/admin/AdminDashboardPage.jsx` | Criar | Listagem de todos os produtos (inclusive inativos) |
| `src/pages/admin/AdminProductFormPage.jsx` | Criar | Formulário criar / editar produto com upload de imagem |
| `src/pages/admin/AdminCategoriesPage.jsx` | Criar | Listar, criar e deletar categorias |
| `src/App.jsx` | Modificar | Adicionar rotas `/admin/login`, `/admin/*` fora do Layout público |

---

## Task 1: Backend — Instalar multer + rota de upload

**Files:**
- Modify: `server/package.json` (add multer)
- Create: `server/src/routes/upload.js`

- [ ] **Step 1: Instalar multer**

```bash
cd server && npm install multer
```

Verificar que `server/package.json` agora lista `"multer"` em `dependencies`.

- [ ] **Step 2: Criar `server/src/routes/upload.js`**

```js
const { Router } = require('express');
const multer     = require('multer');
const path       = require('path');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', '..', 'public', 'images', 'produtos'),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

router.post('/', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo ausente ou tipo inválido (jpg/png/webp).' });
  }
  res.json({ url: `/images/produtos/${req.file.filename}` });
});

module.exports = router;
```

---

## Task 2: Backend — Rotas admin/products

**Files:**
- Create: `server/src/routes/admin-products.js`

- [ ] **Step 1: Criar `server/src/routes/admin-products.js`**

```js
const { Router }  = require('express');
const pool        = require('../db');
const requireAuth = require('../middleware/requireAuth');
const validate    = require('../middleware/validate');

const router = Router();
router.use(requireAuth);

// GET /api/admin/products — todos os produtos, inclusive inativos
router.get('/', async (req, res) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(req.query.per_page) || 20));
    const q       = req.query.q ? String(req.query.q).trim() : null;
    const cat     = req.query.cat;
    const offset  = (page - 1) * perPage;

    const params = [];
    const where  = [];

    if (cat && cat !== 'all') {
      params.push(cat);
      where.push(`category_id = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      where.push(`(name ILIKE $${params.length} OR tag ILIKE $${params.length} OR brand ILIKE $${params.length})`);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countRes = await pool.query(`SELECT COUNT(*) FROM products ${whereClause}`, params);
    const total    = parseInt(countRes.rows[0].count);

    params.push(perPage, offset);
    const dataRes = await pool.query(
      `SELECT id, name, tag, category_id, brand, image, description,
              caracteristicas, apresentacao, modo_uso, precaucoes,
              ingredientes, disclaimer, nutri_porcoes, nutri_rows, ativo
       FROM products ${whereClause}
       ORDER BY name ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: dataRes.rows, total, page, totalPages: Math.ceil(total / perPage) });
  } catch (err) {
    console.error('GET /api/admin/products:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/admin/products
router.post('/', validate(['id', 'name', 'category_id']), async (req, res) => {
  const { id, name, tag, category_id, brand, image, description,
          caracteristicas, apresentacao, modo_uso, precaucoes,
          ingredientes, disclaimer, nutri_porcoes, nutri_rows } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO products(id, name, tag, category_id, brand, image, description,
                            caracteristicas, apresentacao, modo_uso, precaucoes,
                            ingredientes, disclaimer, nutri_porcoes, nutri_rows)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        id, name, tag || null, category_id, brand || null, image || null, description || null,
        caracteristicas || null, apresentacao || null, modo_uso || null, precaucoes || null,
        ingredientes || null, disclaimer || null, nutri_porcoes || null,
        nutri_rows ? JSON.stringify(nutri_rows) : null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'ID já existe.' });
    console.error('POST /api/admin/products:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /api/admin/products/:id
router.put('/:id', validate(['name', 'category_id']), async (req, res) => {
  const { name, tag, category_id, brand, image, description,
          caracteristicas, apresentacao, modo_uso, precaucoes,
          ingredientes, disclaimer, nutri_porcoes, nutri_rows, ativo } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE products SET
         name=$1, tag=$2, category_id=$3, brand=$4, image=$5, description=$6,
         caracteristicas=$7, apresentacao=$8, modo_uso=$9, precaucoes=$10,
         ingredientes=$11, disclaimer=$12, nutri_porcoes=$13, nutri_rows=$14,
         ativo=$15, updated_at=NOW()
       WHERE id=$16 RETURNING *`,
      [
        name, tag || null, category_id, brand || null, image || null, description || null,
        caracteristicas || null, apresentacao || null, modo_uso || null, precaucoes || null,
        ingredientes || null, disclaimer || null, nutri_porcoes || null,
        nutri_rows ? JSON.stringify(nutri_rows) : null,
        ativo !== undefined ? ativo : true,
        req.params.id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/admin/products/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PATCH /api/admin/products/:id/ativo — toggle ativo/inativo
router.patch('/:id/ativo', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE products SET ativo = NOT ativo, updated_at = NOW()
       WHERE id = $1 RETURNING id, ativo`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/admin/products/:id/ativo:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/products/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
```

---

## Task 3: Backend — Rotas admin/categories

**Files:**
- Create: `server/src/routes/admin-categories.js`

- [ ] **Step 1: Criar `server/src/routes/admin-categories.js`**

```js
const { Router }  = require('express');
const pool        = require('../db');
const requireAuth = require('../middleware/requireAuth');
const validate    = require('../middleware/validate');

const router = Router();
router.use(requireAuth);

// POST /api/admin/categories
router.post('/', validate(['id', 'label']), async (req, res) => {
  const { id, label, ordem } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO categories(id, label, ordem) VALUES($1,$2,$3) RETURNING *',
      [id, label, ordem ?? 99]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'ID já existe.' });
    console.error('POST /api/admin/categories:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /api/admin/categories/:id
router.put('/:id', validate(['label']), async (req, res) => {
  const { label, ordem } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE categories SET label=$1, ordem=$2 WHERE id=$3 RETURNING *',
      [label, ordem ?? 0, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Categoria não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/admin/categories/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// DELETE /api/admin/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM categories WHERE id = $1',
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Categoria não encontrada.' });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Categoria possui produtos vinculados. Remova-os primeiro.' });
    }
    console.error('DELETE /api/admin/categories/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
```

---

## Task 4: Backend — Montar novas rotas em app.js + commit

**Files:**
- Modify: `server/src/app.js`

- [ ] **Step 1: Adicionar os três novos imports e mounts em `server/src/app.js`**

Adicionar após a linha `const authRouter = require('./routes/auth');`:

```js
const adminProductsRouter   = require('./routes/admin-products');
const adminCategoriesRouter = require('./routes/admin-categories');
const uploadRouter          = require('./routes/upload');
```

Adicionar após `app.use('/api/auth', authRouter);`:

```js
app.use('/api/admin/products',   adminProductsRouter);
app.use('/api/admin/categories', adminCategoriesRouter);
app.use('/api/upload',           uploadRouter);
```

O arquivo `server/src/app.js` completo após a edição:

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
const adminProductsRouter   = require('./routes/admin-products');
const adminCategoriesRouter = require('./routes/admin-categories');
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

app.use('/api/products',         productsRouter);
app.use('/api/categories',       categoriesRouter);
app.use('/api/contact',          contactRouter);
app.use('/api/auth',             authRouter);
app.use('/api/admin/products',   adminProductsRouter);
app.use('/api/admin/categories', adminCategoriesRouter);
app.use('/api/upload',           uploadRouter);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

app.use((err, req, res, _next) => {
  console.error('Erro não tratado:', err.message);
  res.status(500).json({ error: 'Erro interno.' });
});

module.exports = app;
```

- [ ] **Step 2: Commit backend**

```bash
git add server/
git commit -m "feat: adicionar rotas admin (CRUD produtos/categorias) e upload de imagem"
```

---

## Task 5: Frontend — AuthContext + AdminLoginPage

**Files:**
- Create: `src/context/AuthContext.jsx`
- Modify: `src/main.jsx`
- Create: `src/pages/admin/AdminLoginPage.jsx`

- [ ] **Step 1: Criar `src/context/AuthContext.jsx`**

```jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const TOKEN_KEY = 'sobral_admin_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const login = (t) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 2: Modificar `src/main.jsx` para envolver App com AuthProvider**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
```

- [ ] **Step 3: Criar pasta `src/pages/admin/`**

A pasta será criada automaticamente ao salvar o primeiro arquivo abaixo.

- [ ] **Step 4: Criar `src/pages/admin/AdminLoginPage.jsx`**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  if (isAuthenticated) {
    navigate('/admin', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Credenciais inválidas.');
      login(data.token);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/images/logo.png" alt="Sobral" className="w-16 h-16 rounded-full mx-auto mb-3" />
          <h1 className="text-[22px] font-[800] text-ink">Painel Admin</h1>
          <p className="text-[13px] text-muted">Laboratório Sobral</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange"
          />
          {error && <p className="text-red-500 text-[13px]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-orange hover:bg-[#E0580A] text-white font-[700] py-2.5 rounded-[8px] text-[15px] transition-colors disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## Task 6: Frontend — AdminLayout + rotas em App.jsx

**Files:**
- Create: `src/pages/admin/AdminLayout.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Criar `src/pages/admin/AdminLayout.jsx`**

```jsx
import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate('/admin/login', { replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const navClass = ({ isActive }) =>
    `block px-4 py-2.5 rounded-[8px] text-[14px] font-[600] transition-colors ${
      isActive
        ? 'bg-orange text-white'
        : 'text-ink-light hover:bg-[#FFF4EB] hover:text-orange'
    }`;

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      <aside className="w-[220px] bg-white border-r border-line flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-line">
          <img src="/images/logo.png" alt="Sobral" className="w-10 h-10 rounded-full mb-2" />
          <p className="font-[800] text-[14px] text-ink">Painel Admin</p>
          <p className="text-[12px] text-muted">Laboratório Sobral</p>
        </div>
        <nav className="flex flex-col p-3 gap-1 flex-1">
          <NavLink to="/admin" end className={navClass}>Produtos</NavLink>
          <NavLink to="/admin/categorias" className={navClass}>Categorias</NavLink>
        </nav>
        <div className="p-3 border-t border-line">
          <button
            onClick={() => { logout(); navigate('/admin/login'); }}
            className="w-full text-left px-4 py-2.5 rounded-[8px] text-[14px] font-[600] text-ink-light hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Adicionar imports e rotas admin em `src/App.jsx`**

No topo do arquivo, adicionar após os imports existentes:

```js
import AdminLoginPage        from './pages/admin/AdminLoginPage';
import AdminLayout           from './pages/admin/AdminLayout';
import AdminDashboardPage    from './pages/admin/AdminDashboardPage';
import AdminProductFormPage  from './pages/admin/AdminProductFormPage';
import AdminCategoriesPage   from './pages/admin/AdminCategoriesPage';
```

Na chamada `createBrowserRouter([...])`, adicionar dois novos objetos no array raiz (depois do objeto `path: '/'`):

```js
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true,           element: <HomePage /> },
      { path: 'quem-somos',   element: <QuemSomosPage /> },
      { path: 'produtos',     element: <ProdutosPage /> },
      { path: 'produtos/:id', element: <ProdutoPage /> },
      { path: 'fale-conosco', element: <FaleConoscoPage /> },
      { path: 'privacidade',   element: <PrivacidadePage /> },
      { path: 'medicamentos',  element: <MedicamentosPage /> },
    ],
  },
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true,                       element: <AdminDashboardPage /> },
      { path: 'produtos/novo',             element: <AdminProductFormPage /> },
      { path: 'produtos/:id/editar',       element: <AdminProductFormPage /> },
      { path: 'categorias',                element: <AdminCategoriesPage /> },
    ],
  },
]);
```

---

## Task 7: Frontend — AdminDashboardPage

**Files:**
- Create: `src/pages/admin/AdminDashboardPage.jsx`

- [ ] **Step 1: Criar `src/pages/admin/AdminDashboardPage.jsx`**

```jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const navigate  = useNavigate();

  const [products,   setProducts]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [query,      setQuery]      = useState('');
  const [cat,        setCat]        = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, per_page: 20 });
    if (cat !== 'all') params.set('cat', cat);
    if (query.trim())  params.set('q',   query.trim());

    fetch(`/api/admin/products?${params}`, { headers: authHeaders })
      .then(r => r.json())
      .then(json => {
        setProducts(json.data || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, query, cat, token]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleAtivo = async (id) => {
    await fetch(`/api/admin/products/${id}/ativo`, { method: 'PATCH', headers: authHeaders });
    fetchProducts();
  };

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Deletar "${name}" permanentemente? Esta ação não pode ser desfeita.`)) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers: authHeaders });
    fetchProducts();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[24px] font-[800] text-ink">Produtos</h1>
          <p className="text-[13px] text-muted">{total} produtos no catálogo</p>
        </div>
        <button
          onClick={() => navigate('/admin/produtos/novo')}
          className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors"
        >
          + Novo produto
        </button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="text"
          placeholder="Buscar..."
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
          className="border border-line rounded-[8px] px-4 py-2 text-[13px] w-[220px] outline-none focus:border-orange"
        />
        <select
          value={cat}
          onChange={e => { setCat(e.target.value); setPage(1); }}
          className="border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange bg-white"
        >
          <option value="all">Todas as categorias</option>
          {categories.filter(c => c.id !== 'all').map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-muted text-[14px]">Carregando...</div>
      ) : (
        <>
          <div className="bg-white rounded-[10px] border border-line overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-[#FAFAFA] text-left">
                  <th className="px-4 py-3 font-[700] text-ink-light">Produto</th>
                  <th className="px-4 py-3 font-[700] text-ink-light">Categoria</th>
                  <th className="px-4 py-3 font-[700] text-ink-light">Marca</th>
                  <th className="px-4 py-3 font-[700] text-ink-light">Status</th>
                  <th className="px-4 py-3 font-[700] text-ink-light">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image && (
                          <img src={p.image} alt="" className="w-10 h-10 object-contain rounded border border-line flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-[600] text-ink">{p.name}</p>
                          <p className="text-muted text-[12px]">{p.tag}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-light">{p.category_id}</td>
                    <td className="px-4 py-3 text-ink-light">{p.brand}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAtivo(p.id)}
                        className={`px-3 py-1 rounded-full text-[12px] font-[600] transition-colors ${
                          p.ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100'
                        }`}
                      >
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate(`/admin/produtos/${p.id}/editar`)}
                          className="text-orange hover:underline font-[600]"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id, p.name)}
                          className="text-red-400 hover:underline font-[600]"
                        >
                          Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-[6px] border text-[13px] font-bold transition-all ${
                    page === n ? 'bg-orange border-orange text-white' : 'bg-white border-line text-ink-light hover:border-orange hover:text-orange'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

---

## Task 8: Frontend — AdminProductFormPage

**Files:**
- Create: `src/pages/admin/AdminProductFormPage.jsx`

- [ ] **Step 1: Criar `src/pages/admin/AdminProductFormPage.jsx`**

A página funciona em dois modos: criação (sem `:id` na URL) e edição (com `:id`). O campo `id` do produto só é editável na criação.

Para `caracteristicas` (TEXT[]), o formulário usa uma textarea onde cada linha é um item. Na submissão, é feito split por `\n` e filtro de linhas vazias.

Para `nutri_rows` (JSONB), o formulário usa uma textarea de JSON livre.

O upload de imagem chama `POST /api/upload` (multipart) antes de submeter o produto, e preenche o campo `image` com a URL retornada.

```jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = {
  id: '', name: '', tag: '', category_id: '', brand: '', image: '',
  description: '', caracteristicas: '', apresentacao: '', modo_uso: '',
  precaucoes: '', ingredientes: '', disclaimer: '', nutri_porcoes: '',
  nutri_rows: '', ativo: true,
};

export default function AdminProductFormPage() {
  const { id }      = useParams();
  const isEdit      = !!id;
  const { token }   = useAuth();
  const navigate    = useNavigate();

  const [form,       setForm]       = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(isEdit);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [imageFile,  setImageFile]  = useState(null);
  const [uploading,  setUploading]  = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    fetch(`/api/admin/products/${id}`, { headers: authHeaders })
      .then(r => r.json())
      .then(p => {
        setForm({
          id:             p.id,
          name:           p.name           ?? '',
          tag:            p.tag            ?? '',
          category_id:    p.category_id    ?? '',
          brand:          p.brand          ?? '',
          image:          p.image          ?? '',
          description:    p.description    ?? '',
          caracteristicas: Array.isArray(p.caracteristicas) ? p.caracteristicas.join('\n') : (p.caracteristicas ?? ''),
          apresentacao:   p.apresentacao   ?? '',
          modo_uso:       p.modo_uso       ?? '',
          precaucoes:     p.precaucoes     ?? '',
          ingredientes:   p.ingredientes   ?? '',
          disclaimer:     p.disclaimer     ?? '',
          nutri_porcoes:  p.nutri_porcoes  ?? '',
          nutri_rows:     p.nutri_rows     ? JSON.stringify(p.nutri_rows, null, 2) : '',
          ativo:          p.ativo,
        });
      })
      .catch(() => setError('Erro ao carregar produto.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const uploadImage = async () => {
    if (!imageFile) return null;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', imageFile);
    try {
      const res  = await fetch('/api/upload', { method: 'POST', headers: authHeaders, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro no upload.');
      return data.url;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    let imageUrl = form.image;
    if (imageFile) {
      const uploaded = await uploadImage();
      if (!uploaded) { setSaving(false); return; }
      imageUrl = uploaded;
    }

    let nutriRows = undefined;
    if (form.nutri_rows.trim()) {
      try {
        nutriRows = JSON.parse(form.nutri_rows);
      } catch {
        setError('nutri_rows: JSON inválido.');
        setSaving(false);
        return;
      }
    }

    const body = {
      ...form,
      image:          imageUrl,
      caracteristicas: form.caracteristicas
        ? form.caracteristicas.split('\n').map(s => s.trim()).filter(Boolean)
        : null,
      nutri_rows:     nutriRows ?? null,
    };
    if (!isEdit) delete body.ativo;

    const url    = isEdit ? `/api/admin/products/${id}` : '/api/admin/products';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res  = await fetch(url, {
        method,
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-muted text-[14px]">Carregando produto...</div>;

  const field = (label, key, type = 'text', opts = {}) => (
    <div>
      <label className="block text-[13px] font-[600] text-ink-light mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={form[key]}
          onChange={e => set(key, e.target.value)}
          rows={opts.rows || 3}
          className="w-full border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange resize-y"
          placeholder={opts.placeholder}
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => set(key, type === 'checkbox' ? e.target.checked : e.target.value)}
          disabled={opts.disabled}
          className="w-full border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange disabled:bg-[#F5F5F5] disabled:text-muted"
          placeholder={opts.placeholder}
        />
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-[860px]">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin')} className="text-orange text-[13px] font-[600] hover:underline">
          ← Produtos
        </button>
        <h1 className="text-[22px] font-[800] text-ink">
          {isEdit ? 'Editar produto' : 'Novo produto'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-[8px] px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-5">
          {field('ID (slug)', 'id', 'text', { disabled: isEdit, placeholder: 'ex: calciolax-articule' })}
          {field('Nome *', 'name', 'text', { placeholder: 'Nome do produto' })}
        </div>

        <div className="grid grid-cols-2 gap-5">
          {field('Tag / subtítulo', 'tag', 'text', { placeholder: 'ex: Cálcio + Vitamina D 240ml' })}
          {field('Marca', 'brand', 'text', { placeholder: 'ex: Calciolax' })}
        </div>

        <div>
          <label className="block text-[13px] font-[600] text-ink-light mb-1">Categoria *</label>
          <select
            value={form.category_id}
            onChange={e => set('category_id', e.target.value)}
            required
            className="w-full border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange bg-white"
          >
            <option value="">Selecione...</option>
            {categories.filter(c => c.id !== 'all').map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Imagem */}
        <div>
          <label className="block text-[13px] font-[600] text-ink-light mb-1">Imagem</label>
          <div className="flex gap-3 items-start">
            <input
              type="text"
              value={form.image}
              onChange={e => set('image', e.target.value)}
              placeholder="/images/produtos/nome.png"
              className="flex-1 border border-line rounded-[8px] px-4 py-2.5 text-[14px] outline-none focus:border-orange"
            />
            <div className="flex flex-col gap-1.5">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={e => setImageFile(e.target.files[0] || null)}
                className="text-[13px] text-ink-light"
              />
              {imageFile && (
                <p className="text-[12px] text-muted">{imageFile.name} — será enviado ao salvar</p>
              )}
            </div>
            {form.image && (
              <img src={form.image} alt="" className="w-16 h-16 object-contain rounded border border-line" />
            )}
          </div>
        </div>

        {field('Descrição', 'description', 'textarea', { rows: 3, placeholder: 'Descrição resumida do produto' })}
        {field('Características (1 por linha)', 'caracteristicas', 'textarea', { rows: 4, placeholder: 'Cada linha vira um item da lista' })}
        {field('Apresentação', 'apresentacao', 'textarea', { rows: 2 })}
        {field('Modo de uso', 'modo_uso', 'textarea', { rows: 2 })}
        {field('Precauções', 'precaucoes', 'textarea', { rows: 2 })}
        {field('Ingredientes', 'ingredientes', 'textarea', { rows: 3 })}
        {field('Disclaimer', 'disclaimer', 'textarea', { rows: 2 })}
        {field('Porções (nutri_porcoes)', 'nutri_porcoes', 'textarea', { rows: 2, placeholder: 'Porções por embalagem: 2\nPorção: 15ml' })}
        {field('Tabela nutricional — JSON (nutri_rows)', 'nutri_rows', 'textarea', {
          rows: 4,
          placeholder: '[["Vitamina C (mg)", "90", "90"], ["Magnésio (mg)", "104", "25"]]',
        })}

        {isEdit && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ativo"
              checked={form.ativo}
              onChange={e => set('ativo', e.target.checked)}
              className="w-4 h-4 accent-orange"
            />
            <label htmlFor="ativo" className="text-[14px] font-[600] text-ink">Produto ativo (visível no site)</label>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-6 py-2.5 rounded-[8px] text-[14px] transition-colors disabled:opacity-60"
          >
            {saving || uploading ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar produto'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="border border-line text-ink-light font-[600] px-6 py-2.5 rounded-[8px] text-[14px] hover:border-orange hover:text-orange transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## Task 9: Frontend — AdminCategoriesPage + commit final

**Files:**
- Create: `src/pages/admin/AdminCategoriesPage.jsx`

- [ ] **Step 1: Criar `src/pages/admin/AdminCategoriesPage.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminCategoriesPage() {
  const { token } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [newId,      setNewId]      = useState('');
  const [newLabel,   setNewLabel]   = useState('');
  const [newOrdem,   setNewOrdem]   = useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const fetchCategories = () => {
    setLoading(true);
    fetch('/api/categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res  = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ id: newId.trim(), label: newLabel.trim(), ordem: Number(newOrdem) || 99 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar.');
      setNewId(''); setNewLabel(''); setNewOrdem('');
      fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Deletar categoria "${label}"? Só é possível se não houver produtos vinculados.`)) return;
    try {
      const res  = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE', headers: authHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao deletar.');
      fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-8 max-w-[640px]">
      <h1 className="text-[24px] font-[800] text-ink mb-6">Categorias</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-[8px] px-4 py-3">
          {error}
        </div>
      )}

      {/* Nova categoria */}
      <div className="bg-white border border-line rounded-[10px] p-5 mb-6">
        <h2 className="text-[15px] font-[700] text-ink mb-4">Nova categoria</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div className="grid grid-cols-[1fr_2fr_80px] gap-3">
            <div>
              <label className="block text-[12px] font-[600] text-ink-light mb-1">ID (slug)</label>
              <input
                value={newId}
                onChange={e => setNewId(e.target.value)}
                required
                placeholder="ex: fitoterapia"
                className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange"
              />
            </div>
            <div>
              <label className="block text-[12px] font-[600] text-ink-light mb-1">Label</label>
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                required
                placeholder="ex: Fitoterapia"
                className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange"
              />
            </div>
            <div>
              <label className="block text-[12px] font-[600] text-ink-light mb-1">Ordem</label>
              <input
                type="number"
                value={newOrdem}
                onChange={e => setNewOrdem(e.target.value)}
                placeholder="99"
                className="w-full border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="self-start bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2 rounded-[8px] text-[13px] transition-colors disabled:opacity-60"
          >
            {saving ? 'Criando...' : '+ Criar'}
          </button>
        </form>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-muted text-[14px]">Carregando...</div>
      ) : (
        <div className="bg-white border border-line rounded-[10px] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-[#FAFAFA] text-left">
                <th className="px-4 py-3 font-[700] text-ink-light">ID</th>
                <th className="px-4 py-3 font-[700] text-ink-light">Label</th>
                <th className="px-4 py-3 font-[700] text-ink-light">Ordem</th>
                <th className="px-4 py-3 font-[700] text-ink-light"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-[#FAFAFA]">
                  <td className="px-4 py-3 font-mono text-ink-light">{c.id}</td>
                  <td className="px-4 py-3 font-[600] text-ink">{c.label}</td>
                  <td className="px-4 py-3 text-ink-light">{c.ordem}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(c.id, c.label)}
                      className="text-red-400 hover:underline font-[600]"
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

Esperado: `✓ built in X.XXs` sem erros de TypeScript/ESLint.

- [ ] **Step 3: Commit final do frontend**

```bash
git add src/
git commit -m "feat: adicionar painel admin (login, produtos, categorias, upload)"
git push origin main
```

---

## Self-Review

**Cobertura da spec:**
- ✅ CRUD produtos (GET/POST/PUT/DELETE + toggle ativo)
- ✅ CRUD categorias (POST/PUT/DELETE)
- ✅ Upload de imagem (multer → public/images/produtos/)
- ✅ Auth JWT protegendo todas as rotas admin
- ✅ Login page + AuthContext + logout
- ✅ AdminLayout com sidebar e guarda de rota
- ✅ Dashboard com lista, busca e filtro por categoria
- ✅ Formulário de produto (criar/editar) com upload integrado
- ✅ Página de categorias

**Inconsistências verificadas:**
- `authHeaders` usado em AdminDashboardPage e AdminProductFormPage sem `Content-Type` para GETs (correto — body-less)
- `nutri_rows` serializado como `JSON.stringify` na submissão do form e no backend — consistente
- `caracteristicas` array: split/join por `\n` em form ↔ `TEXT[]` no DB — consistente
- `modo_uso` (DB) vs `modoUso` (antigo UMD): novo form usa `modo_uso` — correto
