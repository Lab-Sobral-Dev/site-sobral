import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useDebounce } from '../hooks/useDebounce';

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

  const cat   = searchParams.get('cat') || 'all';
  const query = searchParams.get('q')   || '';
  const page  = Math.max(1, parseInt(searchParams.get('page')) || 1);

  const [inputValue, setInputValue] = useState(query);
  const debouncedQuery = useDebounce(inputValue, 300);
  const isFirstRender  = useRef(true);

  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, per_page: PER_PAGE });
    if (cat   && cat !== 'all') params.set('cat', cat);
    if (query.trim())           params.set('q',   query.trim());

    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(json => {
        setFetchError(false);
        setProducts(json.data || []);
        setTotal(json.total || 0);
        setTotalPages(json.totalPages || 1);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [cat, query, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const p = new URLSearchParams(searchParams);
    if (debouncedQuery.trim()) p.set('q', debouncedQuery.trim()); else p.delete('q');
    p.delete('page');
    setSearchParams(p, { replace: true });
  }, [debouncedQuery]);

  const setCat = (val) => {
    const p = new URLSearchParams();
    if (val !== 'all') p.set('cat', val);
    setInputValue('');
    setSearchParams(p);
  };

  const setQuery = (val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set('q', val); else p.delete('q');
    p.delete('page');
    setSearchParams(p);
  };

  const setPage = (n) => {
    const p = new URLSearchParams(searchParams);
    if (n === 1) p.delete('page'); else p.set('page', n);
    setSearchParams(p);
  };

  return (
    <>
      <div className="bg-gradient-to-b from-orange to-[#E85A0C] text-white text-center py-7 px-5 font-display text-[32px] font-[900] tracking-[-.3px]">
        Produtos
      </div>

      <section className="max-w-content mx-auto px-10 mt-9 pb-16">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#F89B4D] via-orange to-[#E0580A] rounded flex items-center justify-between gap-6 p-[32px_40px] mb-8 shadow-[0_4px_18px_rgba(232,90,12,.2)]">
          <div>
            <div className="text-[12px] tracking-[3px] font-[900] opacity-90 mb-2 text-white">CATÁLOGO COMPLETO</div>
            <h2 className="font-display text-[38px] font-[900] text-white mb-2 leading-[1.05] tracking-[-.5px]">Todo o catálogo Sobral</h2>
            <p className="text-[15px] opacity-95 m-0 max-w-[520px] text-white leading-[1.5]">
              Suplementos, tradicionais, óleos e cosméticos — toda nossa linha em um só lugar.
            </p>
          </div>
          <img src="/images/logo.png" alt="" className="w-[110px] h-[110px] rounded-full flex-shrink-0" />
        </div>

        {/* Toolbar */}
        <div className="flex justify-between items-center gap-5 mb-2.5 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full py-[9px] pl-[38px] pr-4 rounded-full border border-line bg-white text-[13px] outline-none focus:border-orange focus:shadow-[0_0_0_3px_rgba(243,112,33,.12)]"
            />
          </div>
        </div>

        <div className="text-[13px] text-ink-light mb-[18px]">
          {loading ? 'Carregando...' : `${total} ${total === 1 ? 'produto encontrado' : 'produtos encontrados'}`}
        </div>

        {loading ? (
          <div className="py-[60px] text-center text-muted text-[15px]">Carregando produtos...</div>
        ) : fetchError ? (
          <div className="py-[60px] text-center text-muted text-[15px]">Erro ao carregar produtos. Tente novamente.</div>
        ) : products.length === 0 ? (
          <div className="py-[60px] text-center text-muted text-[15px]">Nenhum produto encontrado com estes filtros.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map(p => (
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
