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
      <div className="h-[6px] bg-gradient-to-r from-[#FFB46B] via-orange to-[#FFB46B]" />
      <header className="bg-white px-4 md:px-10 py-[14px] flex items-center gap-4 lg:gap-10 shadow-sm sticky top-0 z-50">
        <div
          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex-shrink-0 overflow-hidden cursor-pointer"
          onClick={() => navigate('/')}
          title="Laboratório Sobral"
        >
          <img src="/images/logo.png" alt="Laboratório Sobral" width={56} height={56} className="w-full h-full object-cover rounded-full" />
        </div>

        <nav className="hidden lg:flex gap-7 items-center flex-1">
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
          <NavDropdown
            id="vendidos" label="Mais Vendidos" open={openDropdown === 'vendidos'}
            onToggle={setOpenDropdown} onNavigate={navigate}
            items={[
              { label: 'Aqualemã Sobral', to: '/produtos/aqualema' },
              { label: 'Calciolax Articule', to: '/produtos/calciolax-articule' },
              { label: 'Saludoz Ômega AZ', to: '/produtos/saludoz' },
              { label: 'Extrato de Própolis Verde', to: '/produtos/propolis-verde' },
            ]}
          />
          <div
            className={`font-bold text-[15px] py-2.5 cursor-pointer transition-colors hover:text-orange ${isFaleConosco ? 'text-orange' : 'text-ink'}`}
            onClick={() => navigate('/fale-conosco')}
          >
            Fale Conosco
          </div>
        </nav>

        <div className="hidden lg:block relative w-[260px]">
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

        <button
          className="lg:hidden ml-auto text-ink p-2"
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menu"
        >
          <HamburgerIcon />
        </button>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
