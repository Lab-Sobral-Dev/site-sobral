import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import HeroCarousel from '../components/HeroCarousel';
import ProductCarousel from '../components/ProductCarousel';
import { usePageContent } from '../hooks/usePageContent';
import { useScrollReveal } from '../hooks/useScrollReveal';

const HOME_DEFAULTS = {
  historia_eyebrow:     'DESDE 1911',
  historia_titulo:      'Conheça a nossa história',
  historia_subtitulo:   '',
  historia_texto_1:     '<p>Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos brasileiros. Estamos nas casas das famílias levando mais saúde e proporcionando leveza e bem-estar ao dia a dia. Mais que uma indústria, somos um símbolo da luta do povo brasileiro. Essa é nossa essência e isso nunca vai mudar.</p>',
  historia_imagem:             '/images/fachada.png',
};

export default function HomePage() {
  const navigate = useNavigate();
  const content = usePageContent('home', HOME_DEFAULTS);

  const refHistoria = useScrollReveal();

  return (
    <>
      <Helmet>
        <title>Laboratório Sobral | Saúde e bem-estar para sua família</title>
        <meta name="description" content="Há mais de 100 anos o Laboratório Sobral cuida da saúde dos brasileiros. Conheça nossas linhas de suplementos, tradicionais, óleos e cosméticos." />
        <meta property="og:title" content="Laboratório Sobral | Saúde e bem-estar para sua família" />
        <meta property="og:description" content="Há mais de 100 anos o Laboratório Sobral cuida da saúde dos brasileiros. Conheça nossas linhas de suplementos, tradicionais, óleos e cosméticos." />
        <meta property="og:type" content="website" />
      </Helmet>
      <HeroCarousel />

      <ProductCarousel />

      {/* REDES SOCIAIS */}
      <section className="max-w-content mx-auto px-4 md:px-10 mt-[70px]">
        <div className="text-center mb-8">
          <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-1.5">SIGA A GENTE</div>
          <h2 className="font-display text-[28px] md:text-[36px] font-[900] tracking-[-.5px] leading-none">Nossas Redes Sociais</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="https://instagram.com/labsobral"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 bg-white border border-line rounded-full px-6 py-3 font-bold text-[15px] text-ink shadow-sm transition-all hover:-translate-y-px hover:border-orange hover:text-orange"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
            @labsobral
          </a>
          <a
            href="https://facebook.com/labsobral"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 bg-white border border-line rounded-full px-6 py-3 font-bold text-[15px] text-ink shadow-sm transition-all hover:-translate-y-px hover:border-orange hover:text-orange"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
            Laboratório Sobral
          </a>
          <a
            href="https://wa.me/558921012202"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 bg-white border border-line rounded-full px-6 py-3 font-bold text-[15px] text-ink shadow-sm transition-all hover:-translate-y-px hover:border-orange hover:text-orange"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section ref={refHistoria} className="reveal max-w-content mx-auto px-4 md:px-10 mt-[80px]">
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-8 md:gap-12 items-center">
          <div className="order-2 md:order-1">
            <div className="mt-6 md:mt-12 mb-6">
              <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-[14px]">{content.historia_eyebrow}</div>
              <h2 className="font-display text-[32px] md:text-[42px] font-[900] leading-[1.05] mb-2.5 tracking-[-.5px] text-balance">
                {content.historia_titulo}
                <span className="text-orange block italic">{content.historia_subtitulo}</span>
              </h2>
              <div className="h-[2px] w-20 bg-gradient-to-r from-orange to-transparent mt-3.5" />
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
          <div className="aspect-[4/3] rounded overflow-hidden shadow order-1 md:order-2">
            <img src={content.historia_imagem} alt="Fachada do Laboratório Sobral" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>
    </>
  );
}
