# Responsividade do Admin — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar todas as páginas do painel `/admin/*` responsivas a partir de 375px, mantendo o visual desktop intacto. Bloquear o SlideBuilder em mobile com tela de aviso.

**Architecture:** Desktop-first retrofit via Tailwind, mesmo padrão da spec do site público. Novo componente `AdminMobileDrawer` para a sidebar. Tabelas (Dashboard, Categorias) duplicadas como cards em mobile via `hidden md:block` / `md:hidden`. SlideBuilder envolto em wrapper `hidden lg:flex` com tela de aviso `lg:hidden` em paralelo.

**Tech Stack:** React 18, Vite, Tailwind CSS 3, React Router v6, @dnd-kit (DnD existente)

**Observações:**
- Projeto sem framework de testes — verificação visual em 3 breakpoints: 375px, 768px, 1280px
- Servidores dev devem estar rodando (`npm run dev` no root e em `server/`)
- Acessar admin: `/admin/login` → credenciais (já configuradas no banco)
- Cada tarefa: commit individual + push para `main`

---

## File Structure

**Novo:**
- `src/components/admin/AdminMobileDrawer.jsx` — drawer lateral da esquerda para nav admin

**Modificados:**
- `src/pages/admin/AdminLayout.jsx` — integra drawer, topbar mobile
- `src/pages/admin/AdminDashboardPage.jsx` — tabela + cards
- `src/pages/admin/AdminProductFormPage.jsx` — grids responsivos
- `src/pages/admin/AdminCategoriesPage.jsx` — form + tabela/cards
- `src/pages/admin/AdminContentPage.jsx` — padding + bloco de imagem
- `src/pages/admin/AdminHeroSlidesPage.jsx` — header + item de slide
- `src/pages/admin/AdminSlideBuilderPage.jsx` — wrapper + tela de bloqueio

---

## Task 1: Criar AdminMobileDrawer.jsx

**Files:**
- Create: `src/components/admin/AdminMobileDrawer.jsx`

- [ ] **Step 1: Criar o componente**

Crie o arquivo `src/components/admin/AdminMobileDrawer.jsx`:

```jsx
import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="4" y1="7"  x2="20" y2="7"  />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="6" y1="6"  x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6"  />
    </svg>
  );
}

const NAV_GROUPS = [
  {
    label: 'Catálogo',
    items: [
      { to: '/admin',            label: 'Produtos',  end: true },
      { to: '/admin/categorias', label: 'Categorias' },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { to: '/admin/conteudo/home',    label: 'Home' },
      { to: '/admin/conteudo/sobre',   label: 'Quem Somos' },
      { to: '/admin/conteudo/contato', label: 'Fale Conosco' },
      { to: '/admin/hero-slides',      label: 'Hero Slides' },
    ],
  },
];

export default function AdminMobileDrawer({ open, onClose, onLogout }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const linkClass = ({ isActive }) =>
    `block px-4 py-2.5 rounded-[8px] text-[14px] font-[600] transition-colors ${
      isActive ? 'bg-orange text-white' : 'text-ink-light hover:bg-[#FFF4EB] hover:text-orange'
    }`;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-200 lg:hidden ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[82%] max-w-[280px] bg-white z-[70] shadow-[4px_0_24px_rgba(0,0,0,.18)] transform transition-transform duration-300 lg:hidden flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-label="Menu admin"
      >
        <div className="bg-gradient-to-r from-[#F89B4D] to-[#E85A0C] px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
              <img src="/images/logo.png" alt="Sobral" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-[800] text-[13px] text-white leading-none">Painel Admin</p>
              <p className="text-[11px] text-white/85 leading-none mt-1">Laboratório Sobral</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white p-1.5" aria-label="Fechar menu">
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-2">
              <div className="px-3 pt-3 pb-1 text-[10px] font-[700] text-[#aaa] uppercase tracking-[.6px]">
                {group.label}
              </div>
              {group.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-line">
          <button
            onClick={() => { onLogout(); onClose(); }}
            className="w-full text-left px-4 py-2.5 rounded-[8px] text-[14px] font-[600] text-ink-light hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}

export { HamburgerIcon };
```

- [ ] **Step 2: Verificar que Vite compila**

Olhe o terminal do Vite — deve aparecer um HMR sem erros. Nada deve estar quebrado (o componente ainda não é usado).

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/AdminMobileDrawer.jsx
git commit -m "feat(admin): cria AdminMobileDrawer para menu mobile"
git push origin main
```

---

## Task 2: Integrar drawer no AdminLayout

**Files:**
- Modify: `src/pages/admin/AdminLayout.jsx`

- [ ] **Step 1: Substituir conteúdo de AdminLayout.jsx**

Substitua todo o conteúdo do arquivo por:

```jsx
import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import AdminMobileDrawer, { HamburgerIcon } from '../../components/admin/AdminMobileDrawer';

export default function AdminLayout() {
  const { isAuthenticated, token, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login', { replace: true }); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (r.status === 401) { logout(); navigate('/admin/login', { replace: true }); } })
      .catch(() => {});
  }, []);

  if (!isAuthenticated) return null;

  const navClass = ({ isActive }) =>
    `block px-4 py-2.5 rounded-[8px] text-[14px] font-[600] transition-colors ${
      isActive
        ? 'bg-orange text-white'
        : 'text-ink-light hover:bg-[#FFF4EB] hover:text-orange'
    }`;

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="min-h-screen bg-[#F5F5F5] lg:flex">
      {/* Topbar mobile */}
      <div className="lg:hidden bg-white border-b border-line px-4 py-3 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <img src="/images/logo.png" alt="Sobral" className="w-8 h-8 rounded-full" />
          <div>
            <p className="font-[800] text-[13px] text-ink leading-none">Painel Admin</p>
            <p className="text-[10px] text-muted leading-none mt-0.5">Laboratório Sobral</p>
          </div>
        </div>
        <button onClick={() => setDrawerOpen(true)} className="text-ink p-2" aria-label="Abrir menu">
          <HamburgerIcon />
        </button>
      </div>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-[220px] bg-white border-r border-line flex-col flex-shrink-0">
        <div className="p-6 border-b border-line">
          <img src="/images/logo.png" alt="Sobral" className="w-10 h-10 rounded-full mb-2" />
          <p className="font-[800] text-[14px] text-ink">Painel Admin</p>
          <p className="text-[12px] text-muted">Laboratório Sobral</p>
        </div>
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
        <div className="p-3 border-t border-line">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 rounded-[8px] text-[14px] font-[600] text-ink-light hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      <AdminMobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={handleLogout}
      />
      <Toaster position="bottom-right" richColors duration={3000} />
    </div>
  );
}
```

- [ ] **Step 2: Verificar em desktop (≥1024px)**

Acesse `/admin/login`, entre. O layout deve estar igual ao atual: sidebar à esquerda + main à direita.

- [ ] **Step 3: Verificar em mobile (375px)**

No DevTools em 375px:
- Topbar branca com logo + texto "Painel Admin" + hamburguer
- Sidebar desktop oculta
- Clica no hamburguer → drawer abre da esquerda
- Header laranja com logo + ✕
- 2 grupos de links (Catálogo, Conteúdo) + botão "Sair"
- Click num link → navega e fecha drawer
- Click no overlay → fecha
- Esc → fecha
- Body com scroll bloqueado enquanto aberto

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminLayout.jsx
git commit -m "feat(admin): topbar mobile + integração do drawer"
git push origin main
```

---

## Task 3: AdminDashboardPage — tabela + cards

**Files:**
- Modify: `src/pages/admin/AdminDashboardPage.jsx`

- [ ] **Step 1: Substituir o JSX do return inteiro**

Localize o `return (` da função `AdminDashboardPage` (linha 55) e substitua **tudo do `return (` até o `);` final** por:

```jsx
  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
        <div>
          <h1 className="text-[22px] md:text-[24px] font-[800] text-ink">Produtos</h1>
          <p className="text-[13px] text-muted">{total} produtos no catálogo</p>
        </div>
        <button
          onClick={() => navigate('/admin/produtos/novo')}
          className="w-full md:w-auto bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors"
        >
          + Novo produto
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar..."
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
          className="border border-line rounded-[8px] px-4 py-2 text-[13px] w-full md:w-[220px] outline-none focus:border-orange"
        />
        <select
          value={cat}
          onChange={e => { setCat(e.target.value); setPage(1); }}
          className="border border-line rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-orange bg-white w-full md:w-auto"
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
          {/* Desktop: tabela */}
          <div className="hidden md:block bg-white rounded-[10px] border border-line overflow-hidden">
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
                      <button
                        onClick={() => navigate(`/admin/produtos/${p.id}/editar`)}
                        className="text-orange hover:underline font-[600]"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="md:hidden flex flex-col gap-3">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-[10px] border border-line p-4">
                <div className="flex gap-3 mb-3">
                  {p.image && (
                    <img src={p.image} alt="" className="w-14 h-14 object-contain rounded border border-line flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-[700] text-ink truncate">{p.name}</p>
                    <p className="text-muted text-[12px] truncate">{p.tag}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-[12px] text-ink-light mb-3 flex-wrap">
                  <span><b className="text-ink">Cat:</b> {p.category_id}</span>
                  <span><b className="text-ink">Marca:</b> {p.brand}</span>
                </div>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => toggleAtivo(p.id)}
                    className={`px-3 py-1 rounded-full text-[12px] font-[600] transition-colors ${
                      p.ativo ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    onClick={() => navigate(`/admin/produtos/${p.id}/editar`)}
                    className="text-orange font-[600] text-[13px]"
                  >
                    Editar →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6 flex-wrap">
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
```

- [ ] **Step 2: Verificar em desktop (1280px)**

`/admin` deve mostrar tabela igual ao atual.

- [ ] **Step 3: Verificar em mobile (375px)**

`/admin` deve mostrar:
- Título "Produtos" + botão "+ Novo produto" w-full empilhados
- Busca + select empilhados, ambos w-full
- Lista de cards (não tabela)
- Cada card: imagem + nome + tag + Cat/Marca + status pill + link "Editar →"
- Paginação no rodapé

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminDashboardPage.jsx
git commit -m "feat(admin): dashboard com cards em mobile"
git push origin main
```

---

## Task 4: AdminProductFormPage

**Files:**
- Modify: `src/pages/admin/AdminProductFormPage.jsx`

- [ ] **Step 1: Container padding**

Localize a linha 159: `<div className="p-8 max-w-[860px]">` e substitua por:

```jsx
    <div className="p-4 md:p-8 max-w-[860px]">
```

- [ ] **Step 2: Grids dos campos**

Localize as duas ocorrências de `<div className="grid grid-cols-2 gap-5">` (linhas ~176 e ~181) e substitua **ambas** por:

```jsx
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
```

- [ ] **Step 3: Bloco de imagem responsivo**

Localize o bloco de label "Imagem" (linha ~201) que começa com:

```jsx
        <div>
          <label className="block text-[13px] font-[600] text-ink-light mb-1">Imagem</label>
          <div className="flex gap-3 items-start">
```

Substitua somente o `<div className="flex gap-3 items-start">` por:

```jsx
          <div className="flex flex-col md:flex-row gap-3 md:items-start">
```

- [ ] **Step 4: Botões do rodapé**

Localize o bloco de botões finais (linha ~254):

```jsx
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
```

Substitua por:

```jsx
        <div className="flex flex-col md:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full md:w-auto bg-orange hover:bg-[#E0580A] text-white font-[700] px-6 py-2.5 rounded-[8px] text-[14px] transition-colors disabled:opacity-60"
          >
            {saving || uploading ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar produto'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="w-full md:w-auto border border-line text-ink-light font-[600] px-6 py-2.5 rounded-[8px] text-[14px] hover:border-orange hover:text-orange transition-colors"
          >
            Cancelar
          </button>
        </div>
```

- [ ] **Step 5: Verificar nos 2 breakpoints**

`/admin/produtos/novo` (ou editar um existente):

- **Desktop (1280px):** ID/Nome lado a lado, Tag/Marca lado a lado, imagem com input + file + preview inline. Botões "Salvar" e "Cancelar" lado a lado.
- **Mobile (375px):** todos os campos em coluna única. Imagem com input acima e preview abaixo. Botões `w-full` empilhados.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/AdminProductFormPage.jsx
git commit -m "feat(admin): formulário de produto responsivo"
git push origin main
```

---

## Task 5: AdminCategoriesPage

**Files:**
- Modify: `src/pages/admin/AdminCategoriesPage.jsx`

- [ ] **Step 1: Container padding**

Localize a linha 64: `<div className="p-8 max-w-[640px]">` e substitua por:

```jsx
    <div className="p-4 md:p-8 max-w-[640px]">
```

- [ ] **Step 2: Grid do formulário "Nova categoria"**

Localize na linha ~76: `<div className="grid grid-cols-[1fr_2fr_80px] gap-3">` e substitua por:

```jsx
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_80px] gap-3">
```

- [ ] **Step 3: Substituir bloco da tabela por tabela+cards**

Localize todo o bloco `{loading ? (...) : (<div className="bg-white border border-line rounded-[10px] overflow-hidden">...</div>)}` (a partir da linha ~118 até o fim do componente, antes do `</div>` que fecha o container).

Substitua somente o conteúdo do `else` (o `<div className="bg-white border border-line rounded-[10px] overflow-hidden">...</div>`) por:

```jsx
        <>
          {/* Desktop: tabela */}
          <div className="hidden md:block bg-white border border-line rounded-[10px] overflow-hidden">
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

          {/* Mobile: cards */}
          <div className="md:hidden flex flex-col gap-3">
            {categories.map(c => (
              <div key={c.id} className="bg-white rounded-[10px] border border-line p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-[700] text-ink mb-0.5">{c.label}</p>
                    <p className="font-mono text-[12px] text-muted truncate">{c.id}</p>
                  </div>
                  <span className="text-[11px] text-ink-light bg-[#FAFAFA] rounded px-2 py-1 ml-2">
                    Ordem: {c.ordem}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(c.id, c.label)}
                  className="text-red-400 hover:underline font-[600] text-[13px]"
                >
                  Deletar
                </button>
              </div>
            ))}
          </div>
        </>
```

- [ ] **Step 4: Verificar**

- **Desktop:** form de criação em 3 colunas (ID/Label/Ordem), tabela com 4 colunas
- **Mobile:** form em coluna única, cards com label + id + ordem + botão deletar

- [ ] **Step 5: Commit**

```bash
git add src/pages/admin/AdminCategoriesPage.jsx
git commit -m "feat(admin): categorias com cards em mobile"
git push origin main
```

---

## Task 6: AdminContentPage

**Files:**
- Modify: `src/pages/admin/AdminContentPage.jsx`

- [ ] **Step 1: Container padding**

Localize a linha 144: `<div className="p-8 max-w-[720px]">` e substitua por:

```jsx
    <div className="p-4 md:p-8 max-w-[720px]">
```

- [ ] **Step 2: Bloco de imagem responsivo**

Localize a linha ~192 do bloco `field.type === 'image'`: `<div className="flex gap-3 items-start">` e substitua por:

```jsx
                  <div className="flex flex-col md:flex-row gap-3 md:items-start">
```

- [ ] **Step 3: Verificar**

`/admin/conteudo/home` (ou `/sobre`, `/contato`):

- **Desktop:** layout atual
- **Mobile:** padding menor; campos de imagem com preview abaixo do input

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminContentPage.jsx
git commit -m "feat(admin): content editor com padding responsivo"
git push origin main
```

---

## Task 7: AdminHeroSlidesPage

**Files:**
- Modify: `src/pages/admin/AdminHeroSlidesPage.jsx`

- [ ] **Step 1: Container padding + header**

Localize a linha 179 que começa com `<div className="p-8 max-w-[700px]">` e o bloco completo do header (linhas 179-193). Substitua:

```jsx
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
```

Por:

```jsx
    <div className="p-4 md:p-8 max-w-[700px]">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-2">
        <h1 className="text-[22px] md:text-[24px] font-[800] text-ink">Hero Slides</h1>
        <div className="flex flex-col md:flex-row gap-2">
          <label className={`cursor-pointer text-center border border-orange text-orange font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors hover:bg-orange-50 ${psdUploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {psdUploading ? 'Processando...' : 'Importar PSD'}
            <input type="file" accept=".psd" className="hidden" onChange={e => { if (e.target.files[0]) { handlePsdUpload(e.target.files[0]); e.target.value = ''; } }} />
          </label>
          <label className={`cursor-pointer text-center bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px] transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {uploading ? 'Enviando...' : '+ Novo slide'}
            <input type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={e => { if (e.target.files[0]) { handleUpload(e.target.files[0]); e.target.value = ''; } }} />
          </label>
        </div>
      </div>
      <p className="text-[13px] text-muted mb-6">Arraste para reordenar. Clique em "Editar" para abrir o builder.</p>
```

- [ ] **Step 2: SortableSlide item responsivo**

Localize a definição do `SortableSlide` (linhas 9-51) e dentro dela, no `return`, substitua tudo do `<div ref={setNodeRef}` até o `</div>` final por:

```jsx
    <div ref={setNodeRef} style={style} className="bg-white border border-line rounded-[10px] px-4 py-3 flex flex-wrap items-center gap-3">
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
      <div className="flex-1 min-w-0 text-[13px] text-ink font-[600] truncate basis-full md:basis-auto md:order-none order-1">
        Slide #{slide.id} · {layerCount} {layerCount === 1 ? 'camada' : 'camadas'}
      </div>
      <div className="flex gap-2 items-center ml-auto flex-shrink-0">
        <button
          onClick={() => onEdit(slide.id)}
          className="px-3 py-1 rounded-full text-[12px] font-[600] bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
        >
          Editar
        </button>
        <button
          onClick={() => onToggle(slide.id)}
          className={`px-3 py-1 rounded-full text-[12px] font-[600] transition-colors ${
            slide.ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100'
          }`}
        >
          {slide.ativo ? 'Ativo' : 'Inativo'}
        </button>
        <button onClick={() => onDelete(slide.id)} className="text-red-400 hover:underline text-[13px] font-[600]">
          Excluir
        </button>
      </div>
    </div>
```

- [ ] **Step 3: Verificar**

`/admin/hero-slides`:

- **Desktop:** linha única com drag handle + thumb + texto + 3 botões à direita (igual ao atual)
- **Mobile:** drag + thumb + texto truncado em uma linha, botões "Editar/Status/Excluir" em linha abaixo

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminHeroSlidesPage.jsx
git commit -m "feat(admin): hero slides responsivo"
git push origin main
```

---

## Task 8: AdminSlideBuilderPage — bloqueio mobile

**Files:**
- Modify: `src/pages/admin/AdminSlideBuilderPage.jsx`

- [ ] **Step 1: Envolver editor com wrapper desktop + adicionar warning mobile**

Localize a linha 253 (o JSX principal do componente). O bloco atual começa com:

```jsx
  return (
    <div className="flex h-full overflow-hidden">
```

Substitua a linha 253-254 por:

```jsx
  return (
    <>
      {/* Mobile: tela de aviso */}
      <div className="lg:hidden p-6 min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-[12px] border border-line p-8 text-center max-w-[400px]">
          <div className="text-[48px] mb-3">🖥️</div>
          <h2 className="text-[18px] font-[800] text-ink mb-2">Editor requer desktop</h2>
          <p className="text-[14px] text-ink-light leading-[1.55] mb-6">
            O editor visual de slides usa drag-and-drop pixel-perfect que não funciona bem em telas pequenas. Abra em um computador para editar este slide.
          </p>
          <button
            onClick={() => navigate('/admin/hero-slides')}
            className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px]"
          >
            ← Voltar para Hero Slides
          </button>
        </div>
      </div>

      {/* Desktop: editor */}
      <div className="hidden lg:flex h-full overflow-hidden">
```

E no final do componente, localize o último `</div>` que fecha o `<div className="flex h-full overflow-hidden">` e substitua aquele `</div>` final por:

```jsx
      </div>
    </>
```

**Para confirmar:** o arquivo termina com `);}` (fim do `return` e fim da função). Antes desse `);}` deve haver agora `</></>` (com o fragment fechando). Concretamente, as últimas linhas devem ficar:

```jsx
        </>
      </div>
    </>
  );
}
```

(Onde o primeiro `</>` é do PreviewModal ou painel atual interno, o `</div>` fecha o wrapper desktop novo, e o último `</>` fecha o Fragment.)

> **Importante:** Se houver dificuldade em identificar o último `</div>` correto, use a busca para encontrar a linha onde o componente principal `AdminSlideBuilderPage` termina (procure por `);` seguido de `}` no final). O editor visual ocupa o range do antigo `<div className="flex h-full overflow-hidden">` até o `</div>` correspondente — esse div agora vira `<div className="hidden lg:flex h-full overflow-hidden">` e precisa estar dentro do Fragment.

- [ ] **Step 2: Verificar em desktop (1280px)**

Acesse `/admin/hero-slides`, clique em "Editar" em um slide. Editor visual deve abrir igual ao atual.

- [ ] **Step 3: Verificar em mobile (375px)**

No mesmo URL no DevTools a 375px:
- Em vez do editor, aparece tela centralizada com 🖥️ + "Editor requer desktop" + texto explicativo + botão "← Voltar para Hero Slides"
- Click no botão volta para `/admin/hero-slides`

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminSlideBuilderPage.jsx
git commit -m "feat(admin): bloqueia slide builder em mobile com aviso"
git push origin main
```

---

## Task 9: Verificação final

- [ ] **Step 1: Smoke test mobile (375px)**

No DevTools em 375px, percorra todas as telas admin com usuário logado:

1. `/admin/login` — card centralizado, campos OK
2. `/admin` (após login) — topbar + drawer + cards de produtos
3. `/admin/produtos/novo` — form em coluna única, botões w-full
4. `/admin/produtos/<id>/editar` — mesma coisa, com checkbox "ativo"
5. `/admin/categorias` — form 1 coluna + cards de categorias
6. `/admin/conteudo/home` — campos empilhados
7. `/admin/conteudo/sobre` — idem
8. `/admin/conteudo/contato` — idem
9. `/admin/hero-slides` — header empilhado, item de slide com botões em linha extra
10. `/admin/hero-slides/<id>/editar` — tela de aviso "use desktop"

Em todas:
- Sem scroll horizontal
- Drawer abre/fecha pelo hamburguer
- Logout funciona

- [ ] **Step 2: Smoke test desktop (1280px)**

Mesmas telas a 1280px. Nada deve ter mudado em relação ao layout anterior.

- [ ] **Step 3: Smoke test tablet (768px / md)**

Em 768px, todas as telas já devem estar no layout desktop (md:), com exceção da sidebar que só aparece em lg (≥1024px). Entre 768 e 1024px:
- Topbar mobile com hamburguer ainda visível
- Conteúdo em layout md (tabela, grids 2 col, etc)

---

## Critérios de aceitação atendidos

- [x] AdminLayout: drawer abre/fecha, scroll bloqueado, sair funciona — Task 2
- [x] Dashboard tabela vira cards em mobile — Task 3
- [x] Formulários em coluna única em mobile — Tasks 4, 5
- [x] AdminContent com padding responsivo — Task 6
- [x] Hero Slides item adaptado em mobile — Task 7
- [x] SlideBuilder bloqueado em mobile com aviso amigável — Task 8
- [x] Sem regressão desktop — verificado por task
