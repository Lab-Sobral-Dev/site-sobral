import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import AdminMobileDrawer, { HamburgerIcon } from '../../components/admin/AdminMobileDrawer';

export default function AdminLayout() {
  const { isAuthenticated, logout, user, setUser } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/admin/login', { replace: true }); return; }
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { logout(); navigate('/admin/login', { replace: true }); return null; }
        return r.json();
      })
      .then(data => { if (data?.email) setUser({ email: data.email }); })
      .catch(() => { logout(); navigate('/admin/login', { replace: true }); });
  }, [isAuthenticated, logout, navigate]); // setUser é estável (useCallback), mas não pertence às deps — evita loop

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
          {user?.email && (
            <p className="text-[11px] text-orange font-[600] truncate mt-1" title={user.email}>{user.email}</p>
          )}
        </div>
        <nav className="flex flex-col p-3 gap-1 flex-1">
          <div className="px-3 pt-2 pb-1 text-[10px] font-[700] text-[#aaa] uppercase tracking-[.6px]">Catálogo</div>
          <NavLink to="/admin" end className={navClass}>Produtos</NavLink>
          <NavLink to="/admin/categorias" className={navClass}>Categorias</NavLink>
          <div className="px-3 pt-3 pb-1 text-[10px] font-[700] text-[#aaa] uppercase tracking-[.6px]">Conteúdo</div>
          <NavLink to="/admin/conteudo/home" className={navClass}>Home</NavLink>
          <NavLink to="/admin/conteudo/sobre" className={navClass}>Quem Somos</NavLink>
          <NavLink to="/admin/conteudo/contato" className={navClass}>Fale Conosco</NavLink>
          <NavLink to="/admin/conteudo/produtos" className={navClass}>Produtos</NavLink>
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
