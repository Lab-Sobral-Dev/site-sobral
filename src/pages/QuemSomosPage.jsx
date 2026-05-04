import { usePageContent } from '../hooks/usePageContent';

const SOBRE_DEFAULTS = {
  missao:             '<p>Contribuir com a saúde e a qualidade de vida das famílias brasileiras.</p>',
  visao:              '<p>Continuar a expansão do negócio, tornando-se referência nos segmentos de suplementos alimentares e cosméticos.</p>',
  valores:            '<p>Compromisso, qualidade, respeito, entusiasmo, credibilidade, perseverança e orgulho nordestino.</p>',
  historia_titulo:    'Da cura à prevenção:',
  historia_subtitulo: 'Uma tradição centenária que sempre se renova!',
  historia_texto_1:   '<p>Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos brasileiros. Estamos nas casas das famílias levando mais saúde e proporcionando leveza e bem-estar ao dia a dia. Mais que uma indústria, somos um símbolo da luta do povo brasileiro. Essa é nossa essência e isso nunca vai mudar.</p>',
  historia_subtitulo_2: 'Um pouco de história...',
  historia_texto_2:   '<p>A história do Laboratório Sobral começou a ser contada em 1911, com a abertura de uma botica na cidade de Amarante – Piauí, a Pharmacia Sobral. Em 1919 foi transferida pra Floriano, e aqui fixada. Em 1925 foi para sede própria onde está até hoje.</p>',
  historia_texto_3:   '<p>Ao longo dos anos o pequeno negócio cresceu e, além da Pharmacia, que comercializava produtos próprios e de outras marcas, a botica transformou-se em um laboratório e pequena (e artesanal) indústria de medicamentos.</p>',
  historia_texto_4:   '<p>Até que, em 1973, sob a gestão do economista e empreendedor Teodoro Ferreira Sobral Neto, a fábrica passou a ser continuamente ampliada e modernizada até chegar aos dias de hoje, em que é uma referência no cuidado da saúde dos brasileiros.</p>',
  historia_imagem:    '/images/fachada.png',
};

export default function QuemSomosPage() {
  const content = usePageContent('sobre', SOBRE_DEFAULTS);

  return (
    <>
      <div className="bg-gradient-to-b from-orange to-[#E85A0C] text-white text-center py-[22px] px-5 text-[26px] font-[800] tracking-[.3px]">
        Quem Somos
      </div>

      <section className="max-w-content mx-auto px-10 mt-10">
        <div className="bg-gradient-to-br from-[#F89B4D] via-orange to-[#E0580A] rounded-lg p-[32px_28px] text-white grid grid-cols-[1fr_1px_1fr_1px_1fr] gap-6 shadow-[0_4px_18px_rgba(232,90,12,.22)]">
          <div className="text-center px-2.5">
            <h3 className="text-white text-[22px] font-[800] mb-2 tracking-[.3px]">Missão</h3>
            <div
              className="text-[14.5px] leading-[1.55] m-0 font-semibold opacity-[.96]"
              dangerouslySetInnerHTML={{ __html: content.missao }}
            />
          </div>
          <div className="bg-white/40 w-px" />
          <div className="text-center px-2.5">
            <h3 className="text-white text-[22px] font-[800] mb-2 tracking-[.3px]">Visão</h3>
            <div
              className="text-[14.5px] leading-[1.55] m-0 font-semibold opacity-[.96]"
              dangerouslySetInnerHTML={{ __html: content.visao }}
            />
          </div>
          <div className="bg-white/40 w-px" />
          <div className="text-center px-2.5">
            <h3 className="text-white text-[22px] font-[800] mb-2 tracking-[.3px]">Valores</h3>
            <div
              className="text-[14.5px] leading-[1.55] m-0 font-semibold opacity-[.96]"
              dangerouslySetInnerHTML={{ __html: content.valores }}
            />
          </div>
        </div>
      </section>

      <section className="max-w-content mx-auto px-10 mt-[60px] pb-16">
        <div className="grid grid-cols-[1.35fr_1fr] gap-14 items-start">
          <div>
            <div className="mt-12 mb-9">
              <h2 className="text-[36px] font-[800] leading-[1.15] mb-2.5">
                {content.historia_titulo}
                <span className="text-orange block">{content.historia_subtitulo}</span>
              </h2>
              <div className="h-[2px] bg-gradient-to-r from-orange to-transparent mt-2.5" />
            </div>
            <div
              className="text-[15px] leading-[1.7] text-ink-light mb-9"
              dangerouslySetInnerHTML={{ __html: content.historia_texto_1 }}
            />
            <h2 className="text-[30px] font-[800] mb-[18px]">{content.historia_subtitulo_2}</h2>
            <div
              className="text-[15px] leading-[1.7] text-ink-light mb-[18px]"
              dangerouslySetInnerHTML={{ __html: content.historia_texto_2 }}
            />
            <div
              className="text-[15px] leading-[1.7] text-ink-light mb-[18px]"
              dangerouslySetInnerHTML={{ __html: content.historia_texto_3 }}
            />
            <div
              className="text-[15px] leading-[1.7] text-ink-light"
              dangerouslySetInnerHTML={{ __html: content.historia_texto_4 }}
            />
          </div>

          <div className="flex flex-col gap-6 pt-[60px]">
            <div className="aspect-[4/5] bg-[#DCDCDC] rounded-[18px_18px_28px_28px] relative overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,.1)] -rotate-1">
              <img src={content.historia_imagem} alt="Fachada do Laboratório Sobral" className="absolute inset-0 w-full h-full object-cover z-[2]" />
            </div>
            <div className="aspect-[4/3.6] bg-[#DCDCDC] rounded-[18px_18px_28px_28px] relative overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,.1)] rotate-[1.2deg]">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,#D1D1D1_0_10px,#DCDCDC_10px_20px)]" />
              <div className="absolute inset-0 flex items-center justify-center text-[11px] text-[#999] font-mono text-center p-3 leading-snug z-[2]">
                [ foto histórica: linha de produção ]
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
