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
      { label: 'Trabalhe Conosco',   to: '/fale-conosco' },
    ],
  },
  {
    id: 'produtos',
    label: 'Produtos',
    items: [
      { label: 'Todos os produtos',         to: '/produtos' },
      { label: 'Tradicionais',              to: '/produtos?cat=tradicionais' },
      { label: 'Calciolax',                 to: '/produtos?cat=calciolax' },
      { label: 'Movimex',                   to: '/produtos?cat=movimex' },
      { label: 'Óleos',                     to: '/produtos?cat=oleos' },
      { label: 'Dicas de Misturinhas',      to: '/misturinhas' },
    ],
  },
  {
    id: 'contato',
    label: 'Fale Conosco',
    items: [
      { label: 'Fale Conosco', to: '/fale-conosco' },
      { label: 'Relatório de Transparência Salarial', to: 'https://drive.google.com/file/d/1JWe_OkLG8Ro6jCGAaRdOBIsynoj3Rped/view', external: true },
    ],
  },
];

export default function MobileDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setExpanded(null);
      setSuggestions([]);
      setShowSuggestions(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query)}&per_page=5`);
        const json = await res.json();
        setSuggestions(Array.isArray(json.data) ? json.data : []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

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
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const onSearchKey = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/produtos?q=${encodeURIComponent(query.trim())}`);
      onClose();
      setQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
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
            <span className="absolute left-[14px] top-[13px] text-muted pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              aria-label="Pesquisar produto"
              placeholder="Pesquisar produto"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              className="w-full py-2.5 pl-[38px] pr-4 rounded-full border border-line bg-white text-[14px] text-ink outline-none focus:border-orange focus:shadow-[0_0_0_3px_rgba(243,112,33,.12)] placeholder:text-muted"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-line rounded-[14px] shadow-[0_8px_24px_rgba(0,0,0,.12)] z-10 overflow-hidden">
                {suggestions.map(prod => (
                  <div
                    key={prod.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-orange-50 active:bg-orange-100 cursor-pointer transition-colors"
                    onClick={() => go(`/produtos/${prod.id}`)}
                  >
                    {prod.image
                      ? <img src={prod.image} alt="" className="w-8 h-8 object-contain flex-shrink-0 rounded" />
                      : <div className="w-8 h-8 bg-[#f5f5f5] rounded flex-shrink-0" />
                    }
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-ink truncate">{prod.name}</div>
                      {prod.brand && <div className="text-[11px] text-muted">{prod.brand}</div>}
                    </div>
                  </div>
                ))}
                <div
                  className="px-3 py-2 text-[12px] text-orange font-[700] hover:bg-orange-50 cursor-pointer border-t border-line"
                  onClick={() => go(`/produtos?q=${encodeURIComponent(query.trim())}`)}
                >
                  Ver todos os resultados
                </div>
              </div>
            )}
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
                    {section.items.map((it) => it.external ? (
                      <a
                        key={it.label}
                        href={it.to}
                        target="_blank"
                        rel="noreferrer"
                        onClick={onClose}
                        className="text-left text-[14px] font-semibold text-ink-light py-1.5 hover:text-orange"
                      >
                        {it.label}
                      </a>
                    ) : (
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

          {/* Redes sociais */}
          <div className="pt-5 pb-2">
            <div className="text-[11px] tracking-[2px] font-[900] text-orange mb-3">REDES SOCIAIS</div>
            <div className="flex flex-col gap-2">
              <a href="https://instagram.com/labsobral" target="_blank" rel="noreferrer" className="flex items-center gap-3 py-2 text-[14px] font-semibold text-ink-light hover:text-orange transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
                @labsobral
              </a>
              <a href="https://facebook.com/labsobral" target="_blank" rel="noreferrer" className="flex items-center gap-3 py-2 text-[14px] font-semibold text-ink-light hover:text-orange transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
                Laboratório Sobral
              </a>
              <a href="https://www.youtube.com/channel/UCUEAkwfnRsBmRm3An6Vhb2g" target="_blank" rel="noreferrer" className="flex items-center gap-3 py-2 text-[14px] font-semibold text-ink-light hover:text-orange transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                  <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
                </svg>
                YouTube
              </a>
              <a href="https://www.linkedin.com/in/labsobral/" target="_blank" rel="noreferrer" className="flex items-center gap-3 py-2 text-[14px] font-semibold text-ink-light hover:text-orange transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
                LinkedIn
              </a>
              <a href="https://www.tiktok.com/@labsobral" target="_blank" rel="noreferrer" className="flex items-center gap-3 py-2 text-[14px] font-semibold text-ink-light hover:text-orange transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                </svg>
                TikTok
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export { HamburgerIcon };
