import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import { CATALOG } from '../data/catalog';
import ProductCard from '../components/ProductCard';
import HeroCarousel from '../components/HeroCarousel';
import { usePageContent } from '../hooks/usePageContent';
import { useScrollReveal } from '../hooks/useScrollReveal';

const FEATURED_IDS = ['aqualema','calciolax-articule','saludoz','propolis-verde','movimex','calciolax-kids','rosa-mosqueta-spray','propzinco'];

const BRAND_LABELS = ['Linha Tradicionais', 'Família Calciolax', 'Movimex', 'Óleos Sobral'];
const BRAND_KEYS   = ['marca_tradicionais_imagem', 'marca_calciolax_imagem', 'marca_movimex_imagem', 'marca_oleos_imagem'];

const HOME_DEFAULTS = {
  historia_titulo:    'Conheça a história do',
  historia_subtitulo: 'Laboratório Sobral',
  historia_texto_1:   '<p>Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos brasileiros. Estamos nas casas das famílias levando mais saúde e proporcionando leveza e bem-estar ao dia a dia. Mais que uma indústria, somos um símbolo da luta do povo brasileiro. Essa é nossa essência e isso nunca vai mudar.</p>',
  historia_imagem:             '/images/fachada.png',
  marca_tradicionais_imagem:   '/images/brand-tradicionais.png',
  marca_calciolax_imagem:      '/images/brand-calciolax.png',
  marca_movimex_imagem:        '/images/brand-movimex.png',
  marca_oleos_imagem:          '/images/brand-oleos.png',
};

export default function HomePage() {
  const navigate = useNavigate();
  const [carouselIdx, setCarouselIdx] = useState(0);
  const content = usePageContent('home', HOME_DEFAULTS);

  const featured = CATALOG.filter(p => FEATURED_IDS.includes(p.id));
  const visible  = featured.slice(carouselIdx, carouselIdx + 4);

  const refLinhas   = useScrollReveal();
  const refVendidos = useScrollReveal();
  const refHistoria = useScrollReveal();

  return (
    <>
      <HeroCarousel />

      {/* NOSSAS LINHAS */}
      <section ref={refLinhas} className="reveal max-w-content mx-auto px-10 mt-[60px]">
        <h2 className="text-[28px] font-[800] text-center mt-10 mb-7">Nossas Linhas</h2>
        <div className="grid grid-cols-4 gap-5 max-w-[960px] mx-auto">
          {BRAND_KEYS.map((key, i) => (
            <div
              key={key}
              className="bg-white rounded p-5 flex flex-col items-center justify-between gap-3 cursor-pointer shadow-sm h-[220px] transition-[transform,box-shadow] duration-[220ms] hover:-translate-y-1 hover:shadow"
              onClick={() => navigate('/produtos')}
            >
              <div className="flex-1 w-full flex items-center justify-center min-h-0">
                <img src={content[key]} alt={BRAND_LABELS[i]} className="max-w-full max-h-full w-auto h-auto object-contain block" />
              </div>
              <div className="font-[800] text-[13.5px] text-ink text-center flex-shrink-0">{BRAND_LABELS[i]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MAIS VENDIDOS */}
      <section ref={refVendidos} className="reveal max-w-content mx-auto px-10 mt-[70px]">
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
      <section ref={refHistoria} className="reveal max-w-content mx-auto px-10 mt-[80px]">
        <div className="grid grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <div className="mt-12 mb-6">
              <h2 className="text-[36px] font-[800] leading-[1.15] mb-2.5">
                {content.historia_titulo}
                <span className="text-orange block">{content.historia_subtitulo}</span>
              </h2>
              <div className="h-[2px] bg-gradient-to-r from-orange to-transparent mt-2.5" />
            </div>
            <div className="text-[15.5px] leading-[1.7] text-ink-light mb-7">
              {parse(DOMPurify.sanitize(content.historia_texto_1))}
            </div>
            <button
              className="btn-ripple inline-flex items-center justify-center px-6 py-2.5 rounded-full border-none font-bold text-[14px] tracking-[.3px] text-white bg-gradient-to-b from-[#F89B4D] to-[#E85A0C] shadow-[0_2px_8px_rgba(232,90,12,.3)] transition-all hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(232,90,12,.42)]"
              onClick={() => navigate('/quem-somos')}
            >
              VEJA MAIS
            </button>
          </div>
          <div className="aspect-[4/3] rounded overflow-hidden shadow">
            <img src={content.historia_imagem} alt="Fachada do Laboratório Sobral" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>
    </>
  );
}
