import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
      { to: '/admin/conteudo/home',     label: 'Home' },
      { to: '/admin/conteudo/sobre',    label: 'Quem Somos' },
      { to: '/admin/conteudo/contato',  label: 'Fale Conosco' },
      { to: '/admin/conteudo/produtos', label: 'Produtos' },
      { to: '/admin/hero-slides',       label: 'Hero Slides' },
    ],
  },
];

export default function AdminMobileDrawer({ open, onClose, onLogout }) {
  const { user } = useAuth();

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
              <p className="text-[11px] text-white/85 leading-none mt-0.5">Laboratório Sobral</p>
              {user?.email && (
                <p className="text-[11px] text-white/70 leading-none mt-0.5 truncate max-w-[160px]">{user.email}</p>
              )}
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
