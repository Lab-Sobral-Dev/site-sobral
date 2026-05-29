import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileDrawer, { HamburgerIcon } from './MobileDrawer';

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"/>
      <line x1="21" y1="21" x2="16.5" y2="16.5"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  );
}

function NavDropdown({ id, label, items, open, onToggle, onNavigate }) {
  return (
    <div
      className={`nav-item relative font-bold text-[15px] py-2.5 flex items-center gap-1.5 cursor-pointer select-none transition-colors hover:text-orange ${open ? 'open text-orange' : 'text-ink'}`}
      onClick={(e) => { e.stopPropagation(); onToggle(open ? null : id); }}
    >
      {label}
      <span className="caret" />
      <div className="nav-dropdown">
        {items.map((it) => (
          <a
            key={it.label}
            className="block px-4 py-2 text-[14px] font-semibold text-ink-light transition-all hover:bg-orange-50 hover:text-orange cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onNavigate(it.to); onToggle(null); }}
          >
            {it.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest('.nav-item')) setOpenDropdown(null);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/produtos?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  const isFaleConosco = location.pathname === '/fale-conosco';

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="h-[6px] bg-gradient-to-r from-[#FFB46B] via-orange to-[#FFB46B]" />

        {/* Logo — centralizado */}
        <div className="flex items-center justify-center px-4 py-3 relative">
          <div
            className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex-shrink-0 overflow-hidden cursor-pointer"
            onClick={() => navigate('/')}
            title="Laboratório Sobral"
          >
            <img src="/images/logo.png" alt="Laboratório Sobral" width={56} height={56} className="w-full h-full object-cover rounded-full" />
          </div>
          <button
            className="lg:hidden absolute right-4 text-ink p-2"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menu"
          >
            <HamburgerIcon />
          </button>
        </div>

        {/* Nav + busca — desktop, centralizado */}
        <nav className="hidden lg:flex items-center justify-center gap-7 pb-[12px]">
          <NavDropdown
            id="sobral" label="O Sobral" open={openDropdown === 'sobral'}
            onToggle={setOpenDropdown} onNavigate={navigate}
            items={[
              { label: 'Quem Somos', to: '/quem-somos' },
              { label: 'Nossa História', to: '/quem-somos' },
              { label: 'Trabalhe Conosco', to: '/fale-conosco' },
            ]}
          />
          <NavDropdown
            id="produtos" label="Produtos" open={openDropdown === 'produtos'}
            onToggle={setOpenDropdown} onNavigate={navigate}
            items={[
              { label: 'Todos os produtos', to: '/produtos' },
              { label: 'Suplementos', to: '/produtos?cat=suplementos' },
              { label: 'Tradicionais', to: '/produtos?cat=tradicionais' },
              { label: 'Cosméticos', to: '/produtos?cat=cosmeticos' },
              { label: 'Dicas de Misturinhas ✨', to: '/misturinhas' },
            ]}
          />

          {/* Redes sociais */}
          <div className="flex items-center gap-1">
            <a href="https://instagram.com/labsobral" target="_blank" rel="noreferrer" aria-label="Instagram" className="p-2 text-ink-light transition-colors hover:text-orange">
              <InstagramIcon />
            </a>
            <a href="https://facebook.com/labsobral" target="_blank" rel="noreferrer" aria-label="Facebook" className="p-2 text-ink-light transition-colors hover:text-orange">
              <FacebookIcon />
            </a>
            <a href="https://wa.me/558921012202" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="p-2 text-ink-light transition-colors hover:text-orange">
              <WhatsAppIcon />
            </a>
          </div>

          <div
            className={`font-bold text-[15px] py-2.5 cursor-pointer transition-colors hover:text-orange ${isFaleConosco ? 'text-orange' : 'text-ink'}`}
            onClick={() => navigate('/fale-conosco')}
          >
            Fale Conosco
          </div>

          {/* Barra de busca — centralizada junto ao nav */}
          <div className="relative w-[240px]">
            <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Pesquisar produto"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full py-[9px] pl-[38px] pr-4 rounded-full border border-line bg-white text-[13px] text-ink outline-none transition-[border-color,box-shadow] focus:border-orange focus:shadow-[0_0_0_3px_rgba(243,112,33,.12)] placeholder:text-muted"
            />
          </div>
        </nav>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
