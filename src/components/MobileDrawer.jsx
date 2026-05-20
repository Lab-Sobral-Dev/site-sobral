import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"/>
      <line x1="21" y1="21" x2="16.5" y2="16.5"/>
    </svg>
  );
}

const NAV_SECTIONS = [
  {
    id: 'sobral',
    label: 'O Sobral',
    items: [
      { label: 'Quem Somos',         to: '/quem-somos' },
      { label: 'Nossa História',     to: '/quem-somos' },
      { label: 'Trabalhe Conosco',   to: '/fale-conosco' },
    ],
  },
  {
    id: 'produtos',
    label: 'Produtos',
    items: [
      { label: 'Todos os produtos',         to: '/produtos' },
      { label: 'Suplementos',               to: '/produtos?cat=suplementos' },
      { label: 'Tradicionais',              to: '/produtos?cat=tradicionais' },
      { label: 'Cosméticos',                to: '/produtos?cat=cosmeticos' },
      { label: 'Dicas de Misturinhas ✨',   to: '/misturinhas' },
    ],
  },
  {
    id: 'vendidos',
    label: 'Mais Vendidos',
    items: [
      { label: 'Aqualemã Sobral',             to: '/produtos/aqualema' },
      { label: 'Calciolax Articule',          to: '/produtos/calciolax-articule' },
      { label: 'Saludoz Ômega AZ',            to: '/produtos/saludoz' },
      { label: 'Extrato de Própolis Verde',   to: '/produtos/propolis-verde' },
    ],
  },
];

export default function MobileDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setExpanded(null);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const go = (to) => {
    navigate(to);
    onClose();
    setQuery('');
  };

  const onSearchKey = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/produtos?q=${encodeURIComponent(query.trim())}`);
      onClose();
      setQuery('');
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-200 lg:hidden ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[82%] max-w-[340px] bg-white z-[70] shadow-[-4px_0_24px_rgba(0,0,0,.18)] transform transition-transform duration-300 lg:hidden flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Menu principal"
      >
        <div className="bg-gradient-to-r from-[#F89B4D] to-[#E85A0C] px-5 py-4 flex justify-between items-center">
          <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
            <img src="/images/logo.png" alt="Laboratório Sobral" className="w-full h-full object-cover" />
          </div>
          <button onClick={onClose} className="text-white p-1.5" aria-label="Fechar menu">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="relative mb-4">
            <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Pesquisar produto"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              className="w-full py-2.5 pl-[38px] pr-4 rounded-full border border-line bg-white text-[14px] text-ink outline-none focus:border-orange focus:shadow-[0_0_0_3px_rgba(243,112,33,.12)] placeholder:text-muted"
            />
          </div>

          <div className="text-[11px] tracking-[2px] font-[900] text-orange mb-2">MENU</div>

          {NAV_SECTIONS.map((section) => {
            const isOpen = expanded === section.id;
            return (
              <div key={section.id} className="border-b border-line">
                <button
                  onClick={() => setExpanded(isOpen ? null : section.id)}
                  className="w-full flex justify-between items-center py-3.5 text-left font-bold text-[15px] text-ink"
                  aria-expanded={isOpen}
                >
                  {section.label}
                  <span className={`text-orange text-[13px] transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
                </button>
                {isOpen && (
                  <div className="pb-3 pl-3 flex flex-col gap-1.5">
                    {section.items.map((it) => (
                      <button
                        key={it.label}
                        onClick={() => go(it.to)}
                        className="text-left text-[14px] font-semibold text-ink-light py-1.5 hover:text-orange"
                      >
                        {it.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={() => go('/fale-conosco')}
            className="w-full text-left py-3.5 font-bold text-[15px] text-ink border-b border-line"
          >
            Fale Conosco
          </button>
        </div>
      </aside>
    </>
  );
}

export { HamburgerIcon };
