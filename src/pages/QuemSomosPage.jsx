import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import { usePageContent } from '../hooks/usePageContent';
import { useScrollReveal } from '../hooks/useScrollReveal';

const safe = (html) => parse(DOMPurify.sanitize(html));

const SOBRE_DEFAULTS = {
  missao:             '<p>Contribuir com a saúde e a qualidade de vida das famílias brasileiras.</p>',
  visao:              '<p>Continuar a expansão do negócio, tornando-se referência nos segmentos de suplementos alimentares e cosméticos.</p>',
  valores:            '<p>Compromisso, qualidade, respeito, entusiasmo, credibilidade, perseverança e orgulho nordestino.</p>',
  historia_eyebrow:   'UMA HISTÓRIA BRASILEIRA',
  historia_heading:   'Da botica de 1911 à indústria do amanhã.',
  historia_texto_1:   '<p>A história do Laboratório Sobral começou a ser contada em 1911, com a abertura de uma botica na cidade de Amarante – Piauí, a Pharmacia Sobral. Em 1919 foi transferida para Floriano, e aqui fixada. Em 1925 foi para sede própria, onde está até hoje.</p>',
  historia_texto_2:   '<p>Ao longo dos anos o pequeno negócio cresceu e, além da Pharmacia, a botica transformou-se em um laboratório e pequena indústria de medicamentos.</p>',
  historia_texto_3:   '<p>Em 1973, sob a gestão do economista e empreendedor Teodoro Ferreira Sobral Neto, a fábrica passou a ser continuamente ampliada e modernizada — até chegar aos dias de hoje, referência no cuidado da saúde dos brasileiros.</p>',
  historia_imagem:    '/images/fachada.png',
};

const MVV_ITEMS = [
  { key: 'missao',  tag: 'O QUE FAZEMOS',   title: 'Missão',  accent: 'border-orange-light',  text: 'text-orange-light' },
  { key: 'visao',   tag: 'PARA ONDE VAMOS', title: 'Visão',   accent: 'border-orange',        text: 'text-orange'       },
  { key: 'valores', tag: 'COMO SOMOS',      title: 'Valores', accent: 'border-orange-dark',   text: 'text-orange-dark'  },
];

export default function QuemSomosPage() {
  const content = usePageContent('sobre', SOBRE_DEFAULTS);
  const refMVV      = useScrollReveal();
  const refHistoria = useScrollReveal();

  return (
    <>
      <Helmet>
        <title>Quem Somos | Laboratório Sobral</title>
        <meta name="description" content="Conheça a história do Laboratório Sobral: mais de 100 anos cuidando da saúde dos brasileiros. Missão, visão, valores e trajetória desde 1911." />
        <meta property="og:title" content="Quem Somos | Laboratório Sobral" />
        <meta property="og:description" content="Mais de 100 anos cuidando da saúde dos brasileiros. Conheça nossa história, missão, visão e valores." />
        <meta property="og:type" content="website" />
      </Helmet>
      <h1 className="bg-gradient-to-b from-orange to-[#E85A0C] text-white text-center py-7 px-5 font-display text-[32px] font-[900] tracking-[-.3px]">
        Quem Somos
      </h1>

      {/* MVV — Stack horizontal editorial */}
      <section ref={refMVV} className="reveal max-w-content mx-auto px-4 md:px-10 mt-10">
        <div className="bg-white rounded p-6 md:p-[36px_50px] shadow-sm flex flex-col gap-2">
          {MVV_ITEMS.map((item, i) => (
            <div
              key={item.key}
              className={`grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3 md:gap-8 items-start py-[22px] ${i < MVV_ITEMS.length - 1 ? 'border-b border-line' : ''}`}
            >
              <div>
                <div className={`text-[11px] tracking-[2px] font-[900] mb-1.5 ${item.text}`}>{item.tag}</div>
                <div className="font-display text-[28px] md:text-[32px] font-[900] text-ink leading-none">{item.title}</div>
              </div>
              <div className={`text-[15.5px] text-ink-light leading-[1.65] py-1.5 pl-4 md:pl-6 border-l-[3px] ${item.accent}`}>
                {safe(content[item.key])}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* História — Magazine com pull-quote */}
      <section ref={refHistoria} className="reveal max-w-content mx-auto px-4 md:px-10 mt-12 md:mt-20 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-[60px] items-stretch">
          <div className="flex flex-col justify-center order-2 md:order-1">
            <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-[18px]">{content.historia_eyebrow}</div>
            <h2 className="font-display text-[32px] md:text-[46px] font-[900] leading-[1.05] mb-6 text-ink tracking-[-.5px] text-balance">
              {content.historia_heading}
            </h2>
            <div className="text-[15px] text-ink-light leading-[1.7] mb-4">{safe(content.historia_texto_1)}</div>
            <div className="text-[15px] text-ink-light leading-[1.7] mb-4">{safe(content.historia_texto_2)}</div>
            <div className="text-[15px] text-ink-light leading-[1.7]">{safe(content.historia_texto_3)}</div>
          </div>

          <div className="order-1 md:order-2">
            <div className="aspect-[16/9] rounded-[20px] bg-[#EAEAEA] overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,.12)]">
              <img src={content.historia_imagem} alt="Fachada do Laboratório Sobral" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
