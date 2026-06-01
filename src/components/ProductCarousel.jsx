import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';

const CARDS_PER_PAGE = 4;

export default function ProductCarousel() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [pageIdx, setPageIdx] = useState(0);

  useEffect(() => {
    fetch('/api/products?destaque=true&per_page=50')
      .then(r => r.json())
      .then(json => setProducts(json.data || []))
      .catch(() => {});
  }, []);

  const totalPages = Math.ceil(products.length / CARDS_PER_PAGE);

  const next = useCallback(() => setPageIdx(i => (i + 1) % totalPages), [totalPages]);
  const prev = useCallback(() => setPageIdx(i => (i - 1 + totalPages) % totalPages), [totalPages]);

  if (!products.length) return null;

  const visible = products.slice(pageIdx * CARDS_PER_PAGE, (pageIdx + 1) * CARDS_PER_PAGE);
  const showControls = totalPages > 1;

  return (
    <section className="max-w-content mx-auto px-4 md:px-10 mt-[60px]">
      <div className="text-center mt-10 mb-7">
        <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-1.5">PRODUTOS EM DESTAQUE</div>
        <h2 className="font-display text-[28px] md:text-[36px] font-[900] tracking-[-.5px] leading-none">Conheça nossos produtos</h2>
      </div>

      <div className="relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {visible.map(p => (
            <ProductCard key={p.id} product={p} onClick={() => navigate(`/produtos/${p.id}`)} />
          ))}
        </div>

        {showControls && (
          <>
            <button
              onClick={prev}
              aria-label="Produtos anteriores"
              className="absolute left-[-18px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border-2 border-orange text-orange flex items-center justify-center text-[20px] shadow transition-all hover:bg-orange hover:text-white z-10 leading-none"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Próximos produtos"
              className="absolute right-[-18px] top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border-2 border-orange text-orange flex items-center justify-center text-[20px] shadow transition-all hover:bg-orange hover:text-white z-10 leading-none"
            >
              ›
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
