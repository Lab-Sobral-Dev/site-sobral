import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATALOG } from '../data/catalog';
import ProductCard from '../components/ProductCard';

const FEATURED_IDS = ['aqualema','calciolax-articule','saludoz','propolis-verde','movimex','calciolax-kids','rosa-mosqueta-spray','propzinco'];

const BRANDS = [
  { img: '/images/brand-tradicionais.png', label: 'Linha Tradicionais' },
  { img: '/images/brand-calciolax.png',    label: 'Família Calciolax'  },
  { img: '/images/brand-movimex.png',      label: 'Movimex'            },
  { img: '/images/brand-oleos.png',        label: 'Óleos Sobral'       },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [carouselIdx, setCarouselIdx] = useState(0);

  const featured = CATALOG.filter(p => FEATURED_IDS.includes(p.id));
  const visible = featured.slice(carouselIdx, carouselIdx + 4);

  return (
    <>
      {/* HERO */}
      <section className="w-full bg-bg leading-[0]">
        <img
          src="/images/hero-banner.png"
          alt="Laboratório Sobral — há mais de 100 anos cuidando da saúde das famílias brasileiras"
          className="w-full h-auto block"
        />
      </section>

      {/* NOSSAS LINHAS */}
      <section className="max-w-content mx-auto px-10 mt-[60px]">
        <h2 className="text-[28px] font-[800] text-center mt-10 mb-7">Nossas Linhas</h2>
        <div className="grid grid-cols-4 gap-5 max-w-[960px] mx-auto">
          {BRANDS.map((b, i) => (
            <div
              key={i}
              className="bg-white rounded p-5 flex flex-col items-center justify-between gap-3 cursor-pointer shadow-sm h-[220px] transition-[transform,box-shadow] duration-[220ms] hover:-translate-y-1 hover:shadow"
              onClick={() => navigate('/produtos')}
            >
              <div className="flex-1 w-full flex items-center justify-center min-h-0">
                <img src={b.img} alt={b.label} className="max-w-full max-h-full w-auto h-auto object-contain block" />
              </div>
              <div className="font-[800] text-[13.5px] text-ink text-center flex-shrink-0">{b.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MAIS VENDIDOS */}
      <section className="max-w-content mx-auto px-10 mt-[70px]">
        <h2 className="text-[28px] font-[800] text-center mt-10 mb-7">Produtos mais vendidos</h2>
        <div className="relative">
          <button
            className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-none bg-white shadow text-orange flex items-center justify-center text-[22px] z-[5] transition-all hover:bg-orange hover:text-white disabled:opacity-30"
            onClick={() => setCarouselIdx(Math.max(0, carouselIdx - 1))}
            disabled={carouselIdx === 0}
          >‹</button>
          <div className="grid grid-cols-4 gap-[18px] px-5">
            {visible.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => navigate(`/produtos/${p.id}`)} />
            ))}
          </div>
          <button
            className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-none bg-white shadow text-orange flex items-center justify-center text-[22px] z-[5] transition-all hover:bg-orange hover:text-white disabled:opacity-30"
            onClick={() => setCarouselIdx(Math.min(featured.length - 4, carouselIdx + 1))}
            disabled={carouselIdx >= featured.length - 4}
          >›</button>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section className="max-w-content mx-auto px-10 mt-[80px]">
        <div className="grid grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <div className="mt-12 mb-6">
              <h2 className="text-[36px] font-[800] leading-[1.15] mb-2.5">
                Conheça a história do
                <span className="text-orange block">Laboratório Sobral</span>
              </h2>
              <div className="h-[2px] bg-gradient-to-r from-orange to-transparent mt-2.5" />
            </div>
            <p className="text-[15.5px] leading-[1.7] text-ink-light mb-7">
              Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos brasileiros.
              Estamos nas casas das famílias levando mais saúde e proporcionando leveza e
              bem-estar ao dia a dia. Mais que uma indústria, somos um símbolo da luta do
              povo brasileiro. Essa é nossa essência e isso nunca vai mudar.
            </p>
            <button
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full border-none font-bold text-[14px] tracking-[.3px] text-white bg-gradient-to-b from-[#F89B4D] to-[#E85A0C] shadow-[0_2px_8px_rgba(232,90,12,.3)] transition-all hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(232,90,12,.42)]"
              onClick={() => navigate('/quem-somos')}
            >
              VEJA MAIS
            </button>
          </div>
          <div className="aspect-[4/3] rounded overflow-hidden shadow">
            <img src="/images/fachada.png" alt="Fachada do Laboratório Sobral" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>
    </>
  );
}
