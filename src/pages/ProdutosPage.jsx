import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CATALOG, CATEGORIES } from '../data/catalog';
import ProductCard from '../components/ProductCard';

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/>
    </svg>
  );
}

const PER_PAGE = 12;

export default function ProdutosPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);

  const cat = searchParams.get('cat') || 'all';
  const query = searchParams.get('q') || '';

  const setCat = (val) => {
    const p = new URLSearchParams(searchParams);
    if (val === 'all') p.delete('cat'); else p.set('cat', val);
    p.delete('q');
    setSearchParams(p);
  };

  const setQuery = (val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set('q', val); else p.delete('q');
    setSearchParams(p);
  };

  useEffect(() => { setPage(1); }, [cat, query]);

  const filtered = useMemo(() => {
    let list = CATALOG;
    if (cat !== 'all') list = list.filter(p => p.category === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [cat, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <div className="bg-gradient-to-b from-orange to-[#E85A0C] text-white text-center py-[22px] px-5 text-[26px] font-[800] tracking-[.3px]">
        Produtos
      </div>

      <section className="max-w-content mx-auto px-10 mt-9 pb-16">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#F89B4D] via-orange to-[#E0580A] rounded flex items-center justify-between gap-6 p-[32px_40px] mb-8 shadow-[0_4px_18px_rgba(232,90,12,.2)]">
          <div>
            <h2 className="text-[30px] font-[800] text-white mb-1.5">Todo o catálogo Sobral</h2>
            <p className="text-[15px] opacity-95 m-0 max-w-[520px] text-white">
              Suplementos, tradicionais, óleos e cosméticos — toda nossa linha em um só lugar.
            </p>
          </div>
          <img src="/images/logo.png" alt="" className="w-[110px] h-[110px] rounded-full flex-shrink-0" />
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center gap-5 mb-2.5 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className={`px-[18px] py-2 rounded-full border text-[13px] font-bold transition-all ${cat === c.id ? 'bg-orange border-orange text-white' : 'bg-white border-line text-ink-light hover:border-orange hover:text-orange'}`}
                onClick={() => setCat(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="relative w-[240px]">
            <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-muted pointer-events-none"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Buscar produto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full py-[9px] pl-[38px] pr-4 rounded-full border border-line bg-white text-[13px] outline-none focus:border-orange focus:shadow-[0_0_0_3px_rgba(243,112,33,.12)]"
            />
          </div>
        </div>

        <div className="text-[13px] text-ink-light mb-[18px]">
          {filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
        </div>

        {pageItems.length === 0 ? (
          <div className="py-[60px] text-center text-muted text-[15px]">Nenhum produto encontrado com estes filtros.</div>
        ) : (
          <div className="grid grid-cols-4 gap-5">
            {pageItems.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => navigate(`/produtos/${p.id}`)} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-9">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={`w-8 h-8 rounded-[6px] border text-[13px] font-bold transition-all ${page === n ? 'bg-orange border-orange text-white' : 'bg-white border-line text-ink-light hover:border-orange hover:text-orange'}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
