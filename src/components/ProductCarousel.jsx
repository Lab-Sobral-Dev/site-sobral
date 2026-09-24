import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';

// Mesmo corte do grid (grid-cols-2 md:grid-cols-4): sem isto, com poucos
// produtos em destaque a página cabe inteira numa linha em telas maiores e
// o carrossel "some" (sem setas/pontos) só no mobile, onde o grid-cols-2
// ainda empacota tudo num bloco 2×2 estático.
const MOBILE_QUERY = '(max-width: 767px)';

function ChevronIcon({ dir = 'left' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={dir === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  );
}

export default function ProductCarousel() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [pageIdx, setPageIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    fetch('/api/products?destaque=true&per_page=50')
      .then(r => r.json())
      .then(json => setProducts(json.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const cardsPerPage = isMobile ? 2 : 4;
  const totalPages = Math.ceil(products.length / cardsPerPage);

  // Muda o corte (resize entre mobile/desktop): garante que a página atual
  // continue existindo no novo total.
  useEffect(() => {
    setPageIdx(i => Math.min(i, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  const next = useCallback(() => setPageIdx(i => (i + 1) % totalPages), [totalPages]);
  const prev = useCallback(() => setPageIdx(i => (i - 1 + totalPages) % totalPages), [totalPages]);

  // Avanço automático das páginas ("passar sozinho"); pausa ao passar o mouse
  useEffect(() => {
    if (totalPages <= 1 || paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [totalPages, paused, next]);

  if (!products.length) return null;

  const visible = products.slice(pageIdx * cardsPerPage, (pageIdx + 1) * cardsPerPage);
  const showControls = totalPages > 1;

  return (
    <section
      className="max-w-content mx-auto px-4 md:px-10 mt-[60px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="text-center mt-10 mb-7">
        <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-1.5">PRODUTOS EM DESTAQUE</div>
        <h2 className="font-display text-[28px] md:text-[36px] font-[900] tracking-[-.5px] leading-none">Conheça nossos produtos</h2>
      </div>

      <div className="relative">
        <div key={pageIdx} className="grid grid-cols-2 md:grid-cols-4 gap-5 slide-enter-fade">
          {visible.map(p => (
            <ProductCard key={p.id} product={p} onClick={() => navigate(`/produtos/${p.id}`)} />
          ))}
        </div>

        {showControls && (
          <>
            <button
              onClick={prev}
              aria-label="Produtos anteriores"
              className="absolute left-[-18px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border-2 border-orange text-orange flex items-center justify-center shadow transition-all hover:bg-orange hover:text-white z-10"
            >
              <ChevronIcon dir="left" />
            </button>
            <button
              onClick={next}
              aria-label="Próximos produtos"
              className="absolute right-[-18px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border-2 border-orange text-orange flex items-center justify-center shadow transition-all hover:bg-orange hover:text-white z-10"
            >
              <ChevronIcon dir="right" />
            </button>
          </>
        )}
      </div>

      {showControls && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPageIdx(i)}
              aria-label={`Página ${i + 1}`}
              className={`w-2.5 h-2.5 rounded-full border-none transition-all ${i === pageIdx ? 'bg-orange scale-125' : 'bg-[#ccc] hover:bg-orange'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
