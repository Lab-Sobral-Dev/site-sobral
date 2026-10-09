import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import { usePageContent } from '../hooks/usePageContent';

const safe = (html) => parse(DOMPurify.sanitize(html));

// Números 0800 viram tel: puro; os demais recebem o DDI +55.
const telHref = (phone) => {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('0800') ? `tel:${digits}` : `tel:+55${digits}`;
};

// Os links de navegador vêm de um campo de texto livre editável no admin;
// restringe a http(s) para não abrir brecha de XSS via esquema javascript:.
const safeUrl = (url) => {
  try {
    const parsed = new URL(url, window.location.origin);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '#';
  } catch {
    return '#';
  }
};

const PRIVACIDADE_DEFAULTS = {
  titulo_pagina: 'Privacidade e Proteção de Dados',

  privacidade_titulo: 'POLÍTICA DE PRIVACIDADE',
  privacidade_intro: `<p>A Política tem como prioridade a proteção dos dados pessoais, mantendo todos os aspectos devidos de segurança e privacidade. O comprometimento engloba, também, a transparência do processo de tratamento de dados pessoais dos stakeholders. Por isso, a presente Política de Privacidade estabelece como é feita a coleta, uso e transferência de informações de clientes e terceiros que acessam ou usam o site da organização.</p><p>Ao utilizar serviços da organização, as informações pessoais são coletadas e utilizadas nas formas descritas nesta Política, conforme as normas da <strong>Lei Geral de Proteção de Dados n° 13.709/2018</strong>, combinadas com as disposições consumeristas da <strong>Lei 8.078/1990</strong>. e as demais normas do ordenamento jurídico brasileiro aplicáveis.</p><p>No papel de Controladora de Dados, obriga-se ao disposto na presente Política de Privacidade.</p>`,

  sec1_titulo: '1. Quais dados são coletados sobre você e para qual finalidade?',
  sec1_texto: `<p>O site da organização coleta e utiliza alguns dos seus dados pessoais, de forma a viabilizar a prestação de serviços e aprimorar a experiência de uso.</p><p><strong>Dados pessoais fornecidos pelo titular:</strong></p><ul><li>Dados fornecidos pelos usuários (ex.: informações de contato, dados profissionais, informações financeiras ou técnicas);</li><li>Dados de navegação (ex.: endereço IP, localização, país, tempo de navegação, tempo de acesso) ou dados que surjam de sua interação com o site;</li><li>Cookies e sistemas de rastreamento da Internet;</li><li>Informações sobre a convicção religiosa do usuário são coletadas quando o cadastro é preenchido.</li></ul>`,

  sec2_titulo: '2. Consentimento',
  sec2_texto: `<p>É a partir do seu consentimento que a organização pode tratar os seus dados pessoais. O consentimento é a manifestação livre e inequívoca pela qual você nos autoriza a tratar seus dados.</p><p>Assim, em consonância com a Lei Geral de Proteção de Dados nº 13.709/18, seus dados só serão coletados, tratados e armazenados mediante prévio e expresso consentimento.</p><p>O seu consentimento será obtido de forma específica para cada finalidade acima descrita, evidenciando o compromisso de transparência e boa-fé para com seus usuários/clientes, seguindo as regulações legislativas pertinentes.</p><p>Ao utilizar os serviços e fornecer seus dados pessoais, você está ciente e consentindo com as disposições desta Política de Privacidade, além de conhecer seus direitos e como exercê-los.</p><p><strong>A qualquer tempo e sem nenhum custo, você poderá revogar seu consentimento.</strong></p><p>É importante destacar que a revogação do consentimento para o tratamento dos dados pode implicar a impossibilidade da performance adequada de alguma funcionalidade do site que dependa da operação. Tais consequências serão informadas previamente.</p>`,

  sec3_titulo: '3. Quais são os seus direitos?',
  sec3_texto: `<p>A organização assegura a seus usuários/clientes seus direitos de titular previstos no art. 18 da Lei Geral de Proteção de Dados nº 13.709/18. Dessa forma, você pode, de maneira gratuita e a qualquer tempo:</p><ul><li>Confirmar a existência de tratamento de dados, de maneira simplificada ou em formato claro e completo;</li><li>Acessar seus dados, podendo solicitá-los em uma cópia legível sob forma impressa ou por meio eletrônico, seguro e idôneo;</li><li>Corrigir seus dados, ao solicitar a edição, correção ou atualização;</li><li>Limitar seus dados quando desnecessários, excessivos ou tratados em desconformidade com a legislação através da anonimização, bloqueio ou eliminação;</li><li>Solicitar a portabilidade de seus dados, através de um relatório de dados cadastrais;</li><li>Eliminar seus dados tratados a partir de seu consentimento, exceto nos casos previstos em lei;</li><li>Revogar seu consentimento, desautorizando o tratamento de seus dados;</li><li>Informar-se sobre a possibilidade de não fornecer seu consentimento e sobre as consequências da negativa.</li></ul>`,

  sec4_titulo: '4. Como você pode exercer seus direitos de titular?',
  sec4_texto_intro: `<p>Para exercer seus direitos de titular, você deve entrar em contato através dos seguintes meios disponíveis:</p>`,
  direitos_email: 'marketing@laboratoriosobral.com.br',
  direitos_telefone: '(89) 2101-2202',
  sec4_texto_fechamento: `<p>De forma a garantir a sua correta identificação como titular dos dados pessoais objeto da solicitação, é possível que as organizações solicitem os documentos ou demais comprovações que possam comprovar sua identidade. Nessa hipótese, você será informado previamente.</p>`,

  sec5_titulo: '5. Como e por quanto tempo seus dados serão armazenados?',
  sec5_texto: `<p>Seus dados pessoais coletados serão utilizados e armazenados durante o tempo necessário para a prestação do serviço ou para que as finalidades elencadas na presente Política de Privacidade sejam atingidas, considerando os direitos dos titulares dos dados e dos controladores.</p><p>De modo geral, seus dados serão mantidos enquanto a relação contratual perdurar. Findado o período de armazenamento dos dados pessoais, estes serão excluídos das bases de dados ou anonimizados, ressalvadas as hipóteses legalmente previstas. Especialmente as hipóteses dispostas no art. 16 da Lei Geral de Proteção de Dados nº 13.709/18, a saber:</p><ul><li>Cumprimento de obrigação legal ou regulatória pelo controlador;</li><li>Estudo por órgão de pesquisa, garantida, sempre que possível, a anonimização dos dados pessoais;</li><li>Transferência a terceiro, desde que respeitados os requisitos de tratamento de dados dispostos nesta Lei; ou</li><li>Uso exclusivo do controlador, vedado seu acesso por terceiro, e desde que anonimizados os dados.</li></ul><p>Isto é, suas informações pessoais, que sejam imprescindíveis para o cumprimento de determinações legais, judiciais e administrativas e/ou para o exercício do direito de defesa em processos judiciais e administrativos serão mantidas, a despeito da exclusão dos demais dados.</p><p>O armazenamento de dados coletados reflete o compromisso com a segurança e privacidade dos seus dados. A organização emprega medidas e soluções técnicas de proteção aptas a garantir a confidencialidade, integridade e inviolabilidade dos seus dados. Além disso, a organização conta com medidas de segurança apropriadas aos riscos e com controle de acesso às informações armazenadas.</p>`,

  sec6_titulo: '6. O que a organização faz para manter seus dados seguros?',
  sec6_texto: `<p>Para a manutenção das suas informações pessoais seguras, a organização usa ferramentas físicas, eletrônicas e gerenciais orientadas para a proteção da sua privacidade.</p><p>Aplica-se essas ferramentas levando em consideração a natureza dos dados pessoais coletados, o contexto e a finalidade do tratamento, bem como os riscos que eventuais violações podem gerar para os direitos e liberdades do titular dos dados coletados e tratados.</p><p>Entre as medidas que a organização adota destaca-se as seguintes:</p><ul><li>Apenas pessoas autorizadas têm acesso a seus dados pessoais;</li><li>O acesso a seus dados pessoais é feito somente após o compromisso de confidencialidade;</li><li>Seus dados pessoais são armazenados em ambiente seguro e idôneo.</li></ul><p>A organização compromete-se em adotar as melhores posturas para evitar incidentes de segurança. Contudo, é necessário destacar que nenhuma página virtual é inteiramente segura e livre de riscos. É possível que, apesar de todos os protocolos de segurança adotados, problemas de culpa exclusivamente de terceiros ocorram, como ataques cibernéticos de hackers e, também, em decorrência da negligência ou imprudência do próprio usuário/cliente.</p><p>Em caso de incidentes de segurança que possam gerar risco ou dano relevante para você ou qualquer um dos usuários/clientes, a organização comunicará os afetados e a Autoridade Nacional de Proteção de Dados (ANPD), em consonância com as disposições da Lei Geral de Proteção de Dados nº 13.709/18.</p>`,

  sec7_titulo: '7. Com quem seus dados podem ser compartilhados?',
  sec7_texto: `<p>Tendo em vista a preservação de sua privacidade, não compartilhar-se-á seus dados pessoais com nenhum terceiro não autorizado.</p><p>Seus dados poderão ser compartilhados com parceiros comerciais, nesta hipótese, a organização informará quais dados serão compartilhados e com quem irá compartilhar. Ressalvado o compartilhamento dos dados sensíveis referente a saúde com o objetivo de obter vantagem econômica, conforme vedação imposta pelo art. 11, §4º da Lei Geral de Proteção de Dados nº 13.709/18.</p><p>Os terceiros interessados e parceiros comerciais receberão seus dados restritos aos necessários para a prestação dos serviços contratados. Destaca-se que os contratos são orientados pelas normas de proteção de dados do ordenamento jurídico brasileiro.</p><p>Todavia, os parceiros da organização têm suas próprias Políticas de Privacidade, que podem divergir desta. Recomenda-se a leitura desses documentos.</p><p>Além disso, também existem outras hipóteses em que seus dados poderão ser compartilhados, que são:</p><ul><li>Determinação legal, requerimento, requisição ou ordem judicial, com autoridades judiciais, administrativas ou governamentais competentes;</li><li>Caso de movimentações societárias, como fusão, aquisição e incorporação, de forma automática;</li><li>Proteção dos direitos da empresa em qualquer tipo de conflito, inclusive os de teor judicial.</li></ul>`,

  sec8_titulo: '8. Transferência internacional de dados;',
  sec8_texto: `<p>Alguns dos terceiros com quem a organização compartilha seus dados podem ser localizados ou possuir instalações localizadas em países estrangeiros. Nessas condições, de toda forma, seus dados pessoais estarão sujeitos à Lei Geral de Proteção de Dados nº 13.709/18 e às demais legislações brasileiras de proteção de dados.</p><p>Nesse sentido, se compromete a sempre adotar eficientes padrões de segurança cibernética e de proteção de dados, nos melhores esforços de garantir e cumprir as exigências legislativas.</p><p>Ao concordar com essa Política de Privacidade, você concorda com esse compartilhamento, que se dará conforme as finalidades descritas no presente instrumento.</p>`,

  sec9_titulo: '9. Cookies ou dados de navegação',
  sec9_texto: `<p>A organização faz uso de Cookies, que são arquivos de texto enviados pela plataforma ao seu computador e que nele se armazenam, que contém informações relacionadas à navegação do site. Em suma, os Cookies são utilizados para aprimorar a experiência de uso.</p><p>Ao acessar o site e consentir com o uso de Cookies, você manifesta conhecer e aceitar a utilização de um sistema de coleta de dados de navegação com o uso de Cookies em seu dispositivo.</p><p>Você pode, a qualquer tempo e sem nenhum custo, alterar as permissões, bloquear ou recusar os Cookies. Todavia, a revogação do consentimento de determinados Cookies pode inviabilizar o funcionamento correto de alguns recursos da plataforma.</p><p>Para gerenciar os cookies do seu navegador, basta fazê-lo diretamente nas configurações do navegador, na área de gestão de Cookies. Você pode acessar tutoriais sobre o tema diretamente nos links abaixo:</p>`,

  sec10_titulo: '10. Alteração desta Política de Privacidade',
  sec10_texto: `<p>A organização reserva o direito de modificar essa Política de Privacidade a qualquer tempo, principalmente em função da adequação a eventuais alterações feitas no site ou em âmbito legislativo.</p><p>Eventuais alterações entrarão em vigor a partir de sua publicação no site e sempre, a organização, lhe notificará acerca das mudanças ocorridas.</p><p>Ao utilizar os serviços e fornecer seus dados pessoais após tais modificações, você às consente.</p>`,

  sec11_titulo: '11. Responsabilidade',
  sec11_texto: `<p>A organização se responsabiliza pelos agentes que atuam nos processos de tratamento de dados, em conformidade aos arts. 42 ao 45 da Lei Geral de Proteção de Dados nº 13.709/18. Comprometendo-se a manter esta Política de Privacidade atualizada, observando suas disposições e zelando por seu cumprimento.</p><p>Além disso, a organização assume o compromisso de buscar condições técnicas e organizativas seguras aptas a proteger todo o processo de tratamento de dados.</p><p>Caso a Autoridade Nacional de Proteção de Dados (ANPD) exija a adoção de providências em relação ao tratamento de dados realizado pela organização, está se compromete a segui-las.</p>`,

  sec12_titulo: '12. Isenção de Responsabilidade',
  sec12_texto: `<p>Conforme mencionado no item 6, embora a organização adote elevados padrões de segurança a fim de evitar incidentes, não há nenhuma página virtual inteiramente livre de riscos. A organização não se responsabiliza por:</p><ul><li>Culpa exclusiva dos clientes/usuários, incluindo quaisquer consequências decorrentes da negligência, imprudência ou imperícia dos clientes/usuários em relação a seus dados individuais. A organização garante e se responsabiliza apenas pela segurança dos processos de tratamento de dados e do cumprimento das finalidades descritas no presente instrumento.</li><li>Culpa de terceiros, como ações maliciosas de estranhos à relação, como ataques de hackers, exceto se comprovada conduta culposa ou deliberada da empresa;</li><li>Inveracidade das informações inseridas pelo usuário/cliente nos registros necessários para a utilização dos serviços;</li><li>Quaisquer consequências decorrentes de informações falsas ou inseridas de má-fé são de inteira responsabilidade do usuário/cliente.</li></ul><p>Destaca-se que em caso de incidentes de segurança que possam gerar risco ou dano relevante para você ou qualquer um dos usuários/clientes, a organização comunicará aos afetados e à Autoridade Nacional de Proteção de Dados (ANPD) sobre o ocorrido e cumprirá as providências necessárias.</p>`,

  sec13_titulo: '13. Encarregado de Proteção de Dados',
  sec13_texto: `<p>Caso tenha dúvidas sobre esta Política de Privacidade ou sobre os dados pessoais que a organização trata, você pode entrar em contato com o Encarregado de Proteção de Dados Pessoais.</p>`,

  cookies_titulo: 'POLÍTICA DE COOKIES',
  cookies_intro: `<p>Considerando que a organização preza pela transparência e honestidade sobre a coleta e utilização dos dados relativos a você. A presente Política de Cookies é aplicada a todos os produtos e serviços relacionados ou incorporados pela própria Política à organização. Utiliza-se cookies e tecnologias semelhantes, para coletar e utilizar dados como parte dos serviços, conforme definidos nesta Política de Privacidade.</p><p>Cookies são pequenos arquivos de texto que armazenam por um determinado período as atividades do usuário. Cookies armazenam seu histórico de navegação, bem como logins e senhas. É por causa deles que você pode acessar a sua conta sem precisar sempre digitar seus dados cadastrais novamente, pois o navegador utiliza os cookies e faz isso por você. Além de vários aspectos funcionais, os cookies também cumprem um excelente serviço em sistemas bastante conhecidos como o Google Drive, por exemplo.</p>`,

  cookies_tec_titulo: 'Tecnologias usadas',
  tec_1_titulo: 'Cookies',
  tec_1_texto: `<p>Um cookie é um pequeno arquivo adicionado ao seu dispositivo ou computador que permite ativar os recursos e as funcionalidades. Qualquer navegador que acesse os sites pode receber cookies da organização ou de terceiros. Também pode-se colocar cookies em seu navegador, a organização ou terceiros, quando você visitar sites que não sejam o site atual e que exibam anúncios ou que hospedem os plug-ins ou tags. Utiliza-se dois tipos de cookies: cookies persistentes e cookies de sessão. Uma cookie persistente dura além da sessão atual e é usada para muitas finalidades, como reconhecer você como usuário, facilitando seu retorno e sua interação com os serviços sem a necessidade de entrar novamente na sua conta. Como o cookie persistente permanece no seu navegador, ele será lido sempre que você retornar a um dos sites ou visitar um site de terceiros que utiliza os serviços. Os cookies de sessão duram apenas até o término da sessão (geralmente, durante a visita a um site ou durante uma sessão do navegador).</p>`,
  tec_2_titulo: 'Pixels',
  tec_2_texto: `<p>Um pixel é uma pequena imagem que pode ser encontrada em páginas da web e em e-mails e que exige uma chamada (que fornece informações sobre o dispositivo e sobre a visita) aos servidores para que o pixel apareça nestas páginas da web e em e-mails. Utiliza-se pixels para saber mais sobre suas interações com o conteúdo de e-mails ou da web, por exemplo, se você interagiu com anúncios ou publicações. Pixels também permitem que a organização e terceiros instalem cookies no seu navegador.</p>`,
  tec_3_titulo: 'Armazenamento local',
  tec_3_texto: `<p>O armazenamento local permite que um site ou aplicativo armazene informações localmente nos seus dispositivos. O armazenamento local pode ser utilizado para melhorar a experiência no site, por exemplo, habilitando recursos, lembrando as suas preferências e acelerando a funcionalidade do site.</p>`,
  tec_4_titulo: 'Outras tecnologias',
  tec_4_texto: `<p>Também se utiliza outras tecnologias de rastreamento, como identificadores e marcadores para publicidade em dispositivos móveis para fins semelhantes, conforme descrito nesta Política de Cookies.</p>`,

  cookies_tec_nota: `<p>As tabelas de cookies listam alguns dos cookies usados pela organização e por terceiros como parte dos Serviços. Observe que essas tabelas podem ser atualizadas de tempos em tempos para fornecer a você as informações mais recentes.</p>`,

  cookies_fin_titulo: 'Como essas tecnologias são utilizadas',
  cookies_fin_intro: 'Abaixo, descreve-se as maneiras como pode usar cookies:',

  fin_1_titulo: 'Autenticação',
  fin_1_texto: `<p>Utiliza-se os cookies para reconhecer quando você acessa os serviços. Quando você entra no site, os cookies ajudam a exibir as informações corretas e a personalizar sua experiência de acordo com as suas configurações.</p>`,
  fin_2_titulo: 'Segurança',
  fin_2_texto: `<p>Utiliza-se os cookies para tornar a sua interação com os serviços mais ágil, mais segura e para ajudar a organização a detectar atividades mal-intencionadas.</p>`,
  fin_3_titulo: 'Preferências, recursos e serviços',
  fin_3_texto: `<p>Utiliza-se cookies para habilitar a funcionalidade dos serviços e a fornecer recursos, estatísticas e conteúdo personalizado. Também, essas tecnologias são usadas para lembrar informações sobre seu navegador e suas preferências.</p>`,
  fin_4_titulo: 'Funcional',
  fin_4_texto: `<p>Utiliza-se cookies para melhorar sua experiência nos serviços prestados pela organização.</p>`,
  fin_5_titulo: 'Plugins dentro e fora',
  fin_5_texto: `<p>Utiliza-se cookies para habilitar plugins do site dentro e fora dos sites. Os plug-ins podem ser encontrados no site ou em sites de terceiros e parceiros. Se você interagir com um plugin, ele utilizará cookies para identificar você e iniciar sua solicitação.</p>`,
  fin_6_titulo: 'Publicidade personalizada',
  fin_6_texto: `<p>Os cookies ajudam a mostrar publicidade relevante para você, tanto dentro como fora dos serviços, a medir o desempenho de tais anúncios e a fornecer relatórios sobre eles. Utiliza-se cookies para saber se o conteúdo foi exibido a você ou se alguém que visualizou um anúncio voltou depois e realizou uma ação (por ex.: baixou um documento técnico ou fez uma compra) em outro site. Do mesmo modo, os parceiros ou prestadores de serviços podem utilizar cookies para determinar se exibimos um anúncio ou uma publicação, e qual foi o desempenho desse anúncio ou publicação, ou nos fornece informações sobre como você interagiu com o anúncio. Trabalhar com os parceiros para apresentar um anúncio a você dentro e fora do site, como por exemplo, após você visitar o site ou o aplicativo interno ou do parceiro.</p>`,
  fin_7_titulo: 'Análise e pesquisa',
  fin_7_texto: `<p>Cookies ajudam a saber mais sobre o desempenho dos serviços e plugins em diferentes locais. A organização ou prestadores de serviços usam cookies para entender, melhorar e pesquisar produtos, recursos e serviços, inclusive enquanto você navega nos sites ou quando acessa o site a partir de outros sites, aplicativos ou dispositivos. Utiliza-se os cookies para determinar e analisar o desempenho de anúncios ou publicações dentro e fora do site e para saber se você interagiu com os sites ou com sites externos, conteúdo ou e-mails e fornecer análises com base nessas interações. Os cookies são utilizados para fornecer informações agregadas para os usuários e parceiros como parte dos serviços. Se você for um usuário do site, mas tiver saído da sua conta em um navegador, o site pode continuar registrando suas interações com os serviços naquele navegador por até 30 dias, para gerar análises de utilização dos serviços. A organização pode compartilhar essas análises de forma agregada com os usuários.</p>`,

  cookies_fechamento: `<p>Além disso, seu navegador ou dispositivo pode ter configurações que permitam a você escolher se quer definir cookies ou não e excluí-los. Estes controles variam de acordo com o navegador, e os fabricantes podem, a qualquer momento, alterar as configurações e a forma como funcionam.</p><p>Você poderá encontrar nos links abaixo informações adicionais sobre os controles que navegadores populares oferecem. Determinadas partes dos Produtos do site poderão não funcionar corretamente se o uso de cookies do navegador tiver sido desativado. Esteja ciente de que esses controles são diferentes daqueles oferecidos pelo site.</p>`,

  browserlink_1_label: 'Se você usa o Internet Explorer.',
  browserlink_1_url:   'https://support.microsoft.com/pt-br/windows/gerenciar-cookies-no-microsoft-edge-exibir-permitir-bloquear-excluir-e-usar-168dab11-0753-043d-7c16-ede5947fc64d',
  browserlink_2_label: 'Se você usa o Firefox.',
  browserlink_2_url:   'https://support.mozilla.org/pt-BR/kb/gerencie-configuracoes-de-armazenamento-local-de-s',
  browserlink_3_label: 'Se você usa o Safari.',
  browserlink_3_url:   'https://support.apple.com/pt-br/guide/safari/sfri11471/mac',
  browserlink_4_label: 'Se você usa o Google Chrome.',
  browserlink_4_url:   'https://support.google.com/chrome/answer/95647?co=GENIE.Platform%3DDesktop&oco=1&hl=pt-BR',
  browserlink_5_label: 'Se você usa o Microsoft Edge.',
  browserlink_5_url:   'https://support.microsoft.com/pt-br/windows/gerenciar-cookies-no-microsoft-edge-exibir-permitir-bloquear-excluir-e-usar-168dab11-0753-043d-7c16-ede5947fc64d',
  browserlink_6_label: 'Se você usa o Opera.',
  browserlink_6_url:   'https://support.microsoft.com/pt-br/windows/gerenciar-cookies-no-microsoft-edge-exibir-permitir-bloquear-excluir-e-usar-168dab11-0753-043d-7c16-ede5947fc64d',

  contato_nome: 'Laboratório Sobral',
  contato_endereco: `<p>Rua Bento Leão, 25 - Centro<br>64.800-062 - Floriano-PI.</p>`,
  contato_sac_numero: '0800-979-5040',
  contato_telefone: '(89) 2101-2202',
};

const H3 = 'text-[17px] font-[800] text-ink mb-2 mt-8';
const P = 'text-[15px] leading-[1.75] text-ink-light mb-4';
const UL = 'list-disc pl-6 text-[15px] leading-[1.85] text-ink-light mb-5 space-y-1.5';
const PROSE = 'text-[15px] leading-[1.75] text-ink-light [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:leading-[1.85] [&_ul]:mb-5 [&_ul]:space-y-1.5 [&_strong]:text-ink [&_strong]:font-[800]';
const PROSE_CELULA = 'text-[14.5px] leading-[1.7] text-ink-light [&_p]:mb-0';

// Monta o array de linhas de uma tabela a partir das chaves do CMS
// ({prefixo}_{i}_titulo / _texto).
function linhasTabela(content, prefixo, total) {
  return Array.from({ length: total }, (_, i) => {
    const idx = i + 1;
    return { nome: content[`${prefixo}_${idx}_titulo`], texto: content[`${prefixo}_${idx}_texto`] };
  });
}

// Monta o array de links de navegador a partir das chaves do CMS
// (browserlink_{i}_label / _url).
function linksNavegadores(content, total) {
  return Array.from({ length: total }, (_, i) => {
    const idx = i + 1;
    return { label: content[`browserlink_${idx}_label`], href: safeUrl(content[`browserlink_${idx}_url`]) };
  });
}

function BrowserList({ links }) {
  return (
    <ul className={UL}>
      {links.map(({ label, href }) => (
        <li key={label}>
          <a href={href} target="_blank" rel="noreferrer" className="text-orange font-semibold hover:underline">
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Tabela({ head, rows }) {
  return (
    <div className="overflow-x-auto mb-6 rounded-sm border border-line">
      <table className="w-full min-w-[560px] border-collapse text-[14.5px] leading-[1.7] text-ink-light">
        <thead>
          <tr className="bg-orange-50">
            {head.map((h) => (
              <th key={h} className="text-left font-[800] text-ink px-4 py-3 border-b border-line align-top">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ nome, texto }) => (
            <tr key={nome} className="border-b border-line last:border-0 align-top">
              <th scope="row" className="text-left font-[800] text-ink px-4 py-3 w-[200px] align-top">{nome}</th>
              <td className={`px-4 py-3 ${PROSE_CELULA}`}>{safe(texto)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Secao({ titulo, texto }) {
  return (
    <>
      <h3 className={H3}>{titulo}</h3>
      <div className={PROSE}>{safe(texto)}</div>
    </>
  );
}

export default function PrivacidadePage() {
  const content = usePageContent('privacidade', PRIVACIDADE_DEFAULTS);

  const tecnologias = linhasTabela(content, 'tec', 4);
  const finalidades = linhasTabela(content, 'fin', 7);
  const linksBrowser = linksNavegadores(content, 6);

  return (
    <>
      <Helmet>
        <title>Privacidade e Proteção de Dados | Laboratório Sobral</title>
        <meta name="description" content="Política de Privacidade e Política de Cookies do Laboratório Sobral, em conformidade com a Lei Geral de Proteção de Dados nº 13.709/2018." />
        <meta property="og:title" content="Privacidade e Proteção de Dados | Laboratório Sobral" />
        <meta property="og:description" content="Política de Privacidade e Política de Cookies do Laboratório Sobral, em conformidade com a LGPD." />
        <meta property="og:type" content="website" />
      </Helmet>

      <h1 className="bg-gradient-to-b from-orange to-[#E85A0C] text-white text-center py-[22px] px-5 text-[26px] font-[800] tracking-[.3px]">
        {content.titulo_pagina}
      </h1>

      <section className="max-w-content mx-auto px-4 md:px-10 mt-10 pb-16">

        {/* ── POLÍTICA DE PRIVACIDADE ── */}
        <h2 className="text-[22px] font-[800] text-orange mb-5">{content.privacidade_titulo}</h2>
        <div className={PROSE}>{safe(content.privacidade_intro)}</div>

        <Secao titulo={content.sec1_titulo} texto={content.sec1_texto} />
        <Secao titulo={content.sec2_titulo} texto={content.sec2_texto} />
        <Secao titulo={content.sec3_titulo} texto={content.sec3_texto} />

        <h3 className={H3}>{content.sec4_titulo}</h3>
        <div className={PROSE}>{safe(content.sec4_texto_intro)}</div>
        <ul className={UL}>
          <li>
            E-mail:{' '}
            <a href={`mailto:${content.direitos_email}`} className="text-orange font-bold hover:underline">
              {content.direitos_email}
            </a>
          </li>
          <li>
            Telefone:{' '}
            <a href={telHref(content.direitos_telefone)} className="font-bold text-ink hover:underline">{content.direitos_telefone}</a>
          </li>
        </ul>
        <div className={PROSE}>{safe(content.sec4_texto_fechamento)}</div>

        <Secao titulo={content.sec5_titulo} texto={content.sec5_texto} />
        <Secao titulo={content.sec6_titulo} texto={content.sec6_texto} />
        <Secao titulo={content.sec7_titulo} texto={content.sec7_texto} />
        <Secao titulo={content.sec8_titulo} texto={content.sec8_texto} />
        <Secao titulo={content.sec9_titulo} texto={content.sec9_texto} />
        <BrowserList links={linksBrowser} />
        <Secao titulo={content.sec10_titulo} texto={content.sec10_texto} />
        <Secao titulo={content.sec11_titulo} texto={content.sec11_texto} />
        <Secao titulo={content.sec12_titulo} texto={content.sec12_texto} />
        <Secao titulo={content.sec13_titulo} texto={content.sec13_texto} />

        {/* ── POLÍTICA DE COOKIES ── */}
        <div className="border-t border-line pt-8 mt-10">
          <h2 className="text-[22px] font-[800] text-orange mb-5">{content.cookies_titulo}</h2>
          <div className={PROSE}>{safe(content.cookies_intro)}</div>

          <h3 className={H3}>{content.cookies_tec_titulo}</h3>
          <Tabela head={['Tipo de tecnologia', 'Descrição']} rows={tecnologias} />
          <div className={PROSE}>{safe(content.cookies_tec_nota)}</div>

          <h3 className={H3}>{content.cookies_fin_titulo}</h3>
          <p className={P}>{content.cookies_fin_intro}</p>
          <Tabela head={['Finalidade', 'Descrição']} rows={finalidades} />

          <div className={PROSE}>{safe(content.cookies_fechamento)}</div>
          <BrowserList links={linksBrowser} />
        </div>

        {/* ── Contato ── */}
        <div className="border-t border-line pt-6 mt-6 text-[14.5px] leading-[1.8] text-ink-light">
          <p className="font-[800] text-ink mb-1">{content.contato_nome}</p>
          <div className="mb-3 [&_p]:mb-0">{safe(content.contato_endereco)}</div>
          <p>
            SAC{' '}
            <a href={telHref(content.contato_sac_numero)} className="font-bold text-ink hover:underline">
              {content.contato_sac_numero}
            </a>
            <br />
            <a href={telHref(content.contato_telefone)} className="font-bold text-ink hover:underline">
              {content.contato_telefone}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
