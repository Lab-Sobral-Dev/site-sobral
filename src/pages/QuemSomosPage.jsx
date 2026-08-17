import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import { usePageContent } from '../hooks/usePageContent';
import { useScrollReveal } from '../hooks/useScrollReveal';

const safe = (html) => parse(DOMPurify.sanitize(html));

const SOBRE_DEFAULTS = {
  missao:  '<p>Contribuir com a saúde e a qualidade de vida das famílias brasileiras.</p>',
  visao:   '<p>Continuar a expansão do negócio, tornando-se referência nos segmentos de suplementos alimentares e cosméticos.</p>',
  valores: '<p>Compromisso, qualidade, respeito, entusiasmo, credibilidade, perseverança e orgulho nordestino.</p>',

  historia_eyebrow:      'UMA HISTÓRIA BRASILEIRA',
  historia_intro_titulo: 'Da cura à prevenção: uma tradição centenária que sempre se renova',
  historia_intro_sub:    'Conheça a história do Laboratório Sobral',
  historia_intro_texto:  `<p>Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos brasileiros. Estamos nas casas das famílias levando mais saúde e proporcionando leveza e bem-estar ao dia a dia. Mais que uma indústria, somos um símbolo da luta do povo brasileiro. Essa é nossa essência e isso nunca vai mudar.</p>`,

  historia_b1_titulo: 'Um pouco de história…',
  historia_b1_texto: `<p>A história do Laboratório Sobral começou a ser contada em 1911, com a abertura de uma botica na cidade de Amarante – Piauí, a Pharmacia Sobral. Em 1919 foi transferida pra Floriano, e aqui fixada. Em 1925 foi para sede própria onde está até hoje.</p><p>Ao longo dos anos o pequeno negócio cresceu e, além da Pharmacia, que comercializava produtos próprios e de outras marcas, a botica transformou-se em um laboratório e pequena (e artesanal) indústria de medicamentos.</p><p>Até que, em 1973, sob a gestão do economista e empreendedor Teodoro Ferreira Sobral Neto, a fábrica passou a ser continuamente ampliada e modernizada até chegar aos dias de hoje, em que é uma referência no cuidado da saúde dos brasileiros.</p><p>Nessa história centenária, observamos duas guerras mundiais e uma pandemia mudarem o mundo, vimos o Brasil ser comandado por dezenas de presidentes diferentes, comercializamos nossos produtos em nove moedas, superamos dezenas de crises e passamos por grandes transformações.</p>`,

  historia_destaque: 'Se hoje somos uma indústria referência, isso é resultado de muita dedicação e trabalho das pessoas que fazem o Sobral acontecer, dia após dia.',

  historia_b2_texto: `<p>Agora, você concorda que se um laboratório do interior do Piauí existe, resiste e se destaca há mais de 100 anos, é porque muito já foi feito… E o nosso grande segredo é muito simples: a gente cuida de gente!</p><p>Nós desenvolvemos e comercializamos produtos que contribuem para a saúde dos brasileiros e, além disso, cuidamos da nossa gente. Tanto que em nosso quadro de funcionários temos dezenas de pessoas com décadas de empresa. O mais antigo, Sr. Anísio Teixeira, da contabilidade, trabalha conosco há mais de 45 anos!</p><p>Além dele, centenas de pessoas construíram suas vidas junto com o Sobral.</p><p>Se pessoas que conhecem o Sobral forem questionadas sobre o que a empresa representa para elas, certamente surgirão palavras como tradição, segurança, respeito, honestidade, integridade, família, superação, confiança, credibilidade e determinação.</p>`,

  historia_b3_titulo: 'O novo capítulo da nossa história',
  historia_b3_texto: `<p>Temos muito orgulho de contribuir há tantas décadas para o cuidado da nossa gente e da saúde dos brasileiros.</p><p>Ao longo de todo esse período, acreditamos ter adentrado em muitos lares, cativando a confiança dos nossos consumidores e é como muitos dizem “O Sobral é como um patrimônio da família! É passado de geração para geração”.</p><p>Esse tipo de relato resume a admiração de milhares de brasileiros que consomem os nossos produtos. E esse é um dos nossos maiores patrimônios. Afinal, nós existimos para que você viva melhor!</p><p>Em 2020, o mundo mudou! E esse contexto histórico que vivemos nos motivou a refletir que era possível contribuir ainda mais para o bem-estar de nossos consumidores, atuando com foco na prevenção. Por isso, estamos ressignificando o papel do Laboratório Sobral enquanto agente provedor de saúde.</p><p>Amparados por um olhar atento sobre o futuro e por um desejo de estar mais próximo das pessoas – estamos passando por mais transformações com o objetivo de ser uma empresa melhor para nosso consumidor final e, naturalmente, para todos que trabalham conosco direta ou indiretamente.</p><p>Por essa razão, o Sobral deixa de existir para “apenas” remediar e passa a ser uma empresa provedora de cuidado e apoio através da prevenção. Vamos ajudar você e a sua família a cuidarem da saúde, fortalecendo a imunidade e prevenindo assim o adoecimento.</p>`,

  historia_b4_titulo: 'Mas, na prática, o que isso significa?',
  historia_b4_texto: `<p>É simples: estamos focados 100% no mercado de suplementos alimentares, em especial vitaminas e minerais, além de cosméticos. Ou seja, agora você pode contar com a tradição e a qualidade que sempre encontrou nos produtos Sobral, mas com a vantagem extra de fortalecer a sua saúde de forma preventiva, ou de cuidar da beleza usando os produtos de cosméticos.</p><p>Mudar nunca é fácil. Requer ainda mais dedicação de toda a equipe. Porém, saber se reinventar é uma das grandes virtudes das empresas longevas. Além disso, a certeza de que vamos impactar positivamente a vida dos brasileiros em maior escala também nos inspira a seguir.</p>`,

  historia_b5_titulo: 'Os novos produtos do Laboratório Sobral',
  historia_b5_texto: `<p>Esse é um momento de constante evolução e inovação, e sempre com a mesma qualidade que você conhece, confia e merece.</p><p>O novo Laboratório Sobral já possui linhas de novos produtos, que serão constantemente atualizadas com lançamentos pensados sob medida para proporcionar ainda mais saúde e bem-estar a você e a quem você ama:</p><ol><li><strong>Linha Sobral Tradicionais:</strong> Dentre vários produtos desta linha, destacam-se os campeões de venda e tradicionalíssimos Agualemã Sobral e Inglesa Quina Sobral, com fórmulas novas e aprimoradas;</li><li><strong>Linha Calciolax:</strong> Linha de produtos com cálcio, vitamina D3 e colágeno e especialmente para articulações, ossos, dentes e músculos.</li><li><strong>Linha Movimex:</strong> Linha de produtos com colágeno e zinco, com foco nas articulações e manutenção dos ossos.</li><li><strong>Linha Óleos Sobral:</strong> Uma linha com óleos 100% puros e naturais, que vão desde os cuidados necessários a pele até a vitalidade dos cabelos.</li></ol>`,

  historia_b6_titulo: 'Nossa história não acaba aqui…',
  historia_b6_texto: `<p>Se em 1973 Teodoro Sobral Neto foi ousado e visionário ao dar os primeiros passos para construir uma indústria de medicamentos que conquistou a confiança e a preferência de milhões de consumidores nos quatro cantos do Brasil; hoje, um novo salto para o futuro se desenha.</p><p>A empresa está sob o comando da quarta geração da família. Dessa vez, a missão é “virar a chave”, adaptar o modelo de negócio às tendências de mercado e seguir contribuindo para a saúde dos brasileiros. “Meu sonho é que meu filho (tataraneto do fundador do Sobral) possa, no futuro, seguir escrevendo a história de uma família que sempre esteve voltada a contribuir para a saúde e bem-estar das pessoas”, conta Wilber da Silveira Lucio, Diretor Operacional do laboratório e genro de Teodoro Sobral Neto.</p><p>Um de nossos principais objetivos ao promover essa mudança é fazer com que as pessoas possam contar com o Sobral não só quando estiverem com algum problema de saúde, mas sempre que quiserem se sentir bem e investir em qualidade de vida. Afinal, prevenir sempre será o melhor remédio.</p><p>As principais tendências de mercado apontam um forte crescimento do chamado “mercado do bem-estar” no Brasil e no mundo nos próximos anos, justamente porque as pessoas entenderam que cuidar da saúde vai muito além de tomar remédios. E é exatamente isso que o novo Sobral proporciona: saúde em forma de prevenção.</p><p>Este é um novo capítulo de uma história que continuará a ser escrita com base em honestidade, respeito aos clientes, consumidores, funcionários, representantes, distribuidores farmacêuticos e fornecedores, mas principalmente no compromisso de levar saúde para as famílias brasileiras. “Contudo, independente das mudanças, uma coisa jamais vai mudar: o Sobral sempre vai existir para cuidar de você e de sua família. Essa foi, é e sempre será a nossa missão”, finaliza Paula Sobral, Diretora Administrativa e Financeira e membro da quarta geração da família Sobral a comandar nossa história centenária.</p>`,

  historia_imagem: '/images/historia/fachada-lab-sobral.jpg',
};

const MVV_ITEMS = [
  { key: 'missao',  tag: 'O QUE FAZEMOS',   title: 'Missão',  accent: 'border-orange-light',  text: 'text-orange-light' },
  { key: 'visao',   tag: 'PARA ONDE VAMOS', title: 'Visão',   accent: 'border-orange',        text: 'text-orange'       },
  { key: 'valores', tag: 'COMO SOMOS',      title: 'Valores', accent: 'border-orange-dark',   text: 'text-orange-dark'  },
];

// Galerias na mesma ordem e posição do site antigo (fotos baixadas de lá).
const GALERIA_1 = [
  { src: '/images/historia/img-lab-sobral-nossa-historia-00.jpeg', alt: 'Fachada histórica da Pharmacia Sobral' },
  { src: '/images/historia/img-lab-sobral-nossa-historia-1.jpg',   alt: 'Registro histórico do Laboratório Sobral' },
];

const GALERIA_2 = [
  { src: '/images/historia/img-lab-sobral-nossa-historia-0-3.jpg', alt: 'Equipe do Laboratório Sobral ao longo dos anos' },
  { src: '/images/historia/img-lab-sobral-nossa-historia-0-4.jpg', alt: 'Produção do Laboratório Sobral' },
  { src: '/images/historia/img-lab-sobral-nossa-historia-3.jpg',   alt: 'Colaboradores do Laboratório Sobral' },
  { src: '/images/historia/img-nossa-historia.jpg',                alt: 'Laboratório Sobral hoje' },
];

const GALERIA_3 = [
  { src: '/images/historia/img-lab-sobral-nossa-historia-4-3.jpg', alt: 'Linha de produção do Laboratório Sobral' },
  { src: '/images/historia/FIGURA01.jpeg',                         alt: 'Produtos do Laboratório Sobral' },
];

function Galeria({ fotos, colunas }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${colunas} gap-4 md:gap-5 my-10`}>
      {fotos.map(({ src, alt }) => (
        <div key={src} className="aspect-[4/3] rounded-[16px] overflow-hidden bg-[#EAEAEA] shadow-[0_8px_24px_rgba(0,0,0,.10)]">
          <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
}

// Estilos de tipografia aplicados ao HTML vindo do CMS.
const PROSE = 'text-[15.5px] text-ink-light leading-[1.75] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:text-ink';

function Bloco({ titulo, texto }) {
  return (
    <div className="mb-10">
      {titulo && (
        <h2 className="font-display text-[24px] md:text-[30px] font-[900] text-ink tracking-[-.3px] mb-4 text-balance">
          {titulo}
        </h2>
      )}
      <div className={PROSE}>{safe(texto)}</div>
    </div>
  );
}

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

      {/* Nossa História — texto e fotos do site institucional */}
      <section ref={refHistoria} className="reveal max-w-[860px] mx-auto px-4 md:px-10 mt-14 md:mt-20 pb-20">
        <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-[18px]">{content.historia_eyebrow}</div>

        <h2 className="font-display text-[30px] md:text-[42px] font-[900] leading-[1.1] mb-4 text-ink tracking-[-.5px] text-balance">
          {content.historia_intro_titulo}
        </h2>
        <p className="font-display text-[19px] md:text-[22px] font-[700] text-orange mb-6">
          {content.historia_intro_sub}
        </p>
        <div className={PROSE}>{safe(content.historia_intro_texto)}</div>

        <Galeria fotos={GALERIA_1} colunas="lg:grid-cols-2" />

        <Bloco titulo={content.historia_b1_titulo} texto={content.historia_b1_texto} />

        <blockquote className="border-l-[4px] border-orange pl-5 md:pl-7 my-10">
          <p className="font-display text-[20px] md:text-[26px] font-[800] text-ink leading-[1.35] tracking-[-.2px] text-balance">
            {content.historia_destaque}
          </p>
        </blockquote>

        <div className={`${PROSE} mb-10`}>{safe(content.historia_b2_texto)}</div>

        <Galeria fotos={GALERIA_2} colunas="lg:grid-cols-4" />

        <Bloco titulo={content.historia_b3_titulo} texto={content.historia_b3_texto} />
        <Bloco titulo={content.historia_b4_titulo} texto={content.historia_b4_texto} />

        <Galeria fotos={GALERIA_3} colunas="lg:grid-cols-2" />

        <figure className="my-10">
          <div className="aspect-[16/9] rounded-[20px] overflow-hidden bg-[#EAEAEA] shadow-[0_12px_32px_rgba(0,0,0,.12)]">
            <img
              src={content.historia_imagem}
              alt="Fachada do Laboratório Sobral"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        </figure>

        <Bloco titulo={content.historia_b5_titulo} texto={content.historia_b5_texto} />
        <Bloco titulo={content.historia_b6_titulo} texto={content.historia_b6_texto} />
      </section>
    </>
  );
}
