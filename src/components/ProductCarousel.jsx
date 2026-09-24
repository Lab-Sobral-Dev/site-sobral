import { useState, useEffect } from 'react';
import ProductCardCarousel from './ProductCardCarousel';

export default function ProductCarousel() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products?random=true&per_page=8')
      .then(r => r.json())
      .then(json => setProducts(json.data || []))
      .catch(() => {});
  }, []);

  if (!products.length) return null;

  return (
    <section className="max-w-content mx-auto px-4 md:px-10 mt-[60px]">
      <div className="text-center mt-10 mb-7">
        <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-1.5">PRODUTOS EM DESTAQUE</div>
        <h2 className="font-display text-[28px] md:text-[36px] font-[900] tracking-[-.5px] leading-none">Conheça nossos produtos</h2>
      </div>

      <ProductCardCarousel products={products} />
    </section>
  );
}
