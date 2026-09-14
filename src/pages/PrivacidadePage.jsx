import { Helmet } from 'react-helmet-async';

// Links de gestão de cookies por navegador — mesmos destinos do site antigo.
const BROWSER_LINKS = [
  ['Se você usa o Internet Explorer.', 'https://support.microsoft.com/pt-br/windows/gerenciar-cookies-no-microsoft-edge-exibir-permitir-bloquear-excluir-e-usar-168dab11-0753-043d-7c16-ede5947fc64d'],
  ['Se você usa o Firefox.',           'https://support.mozilla.org/pt-BR/kb/gerencie-configuracoes-de-armazenamento-local-de-s'],
  ['Se você usa o Safari.',            'https://support.apple.com/pt-br/guide/safari/sfri11471/mac'],
  ['Se você usa o Google Chrome.',     'https://support.google.com/chrome/answer/95647?co=GENIE.Platform%3DDesktop&oco=1&hl=pt-BR'],
  ['Se você usa o Microsoft Edge.',    'https://support.microsoft.com/pt-br/windows/gerenciar-cookies-no-microsoft-edge-exibir-permitir-bloquear-excluir-e-usar-168dab11-0753-043d-7c16-ede5947fc64d'],
  ['Se você usa o Opera.',             'https://support.microsoft.com/pt-br/windows/gerenciar-cookies-no-microsoft-edge-exibir-permitir-bloquear-excluir-e-usar-168dab11-0753-043d-7c16-ede5947fc64d'],
];

const TECNOLOGIAS = [
  ['Cookies', 'Um cookie é um pequeno arquivo adicionado ao seu dispositivo ou computador que permite ativar os recursos e as funcionalidades. Qualquer navegador que acesse os sites pode receber cookies da organização ou de terceiros. Também pode-se colocar cookies em seu navegador, a organização ou terceiros, quando você visitar sites que não sejam o site atual e que exibam anúncios ou que hospedem os plug-ins ou tags. Utiliza-se dois tipos de cookies: cookies persistentes e cookies de sessão. Uma cookie persistente dura além da sessão atual e é usada para muitas finalidades, como reconhecer você como usuário, facilitando seu retorno e sua interação com os serviços sem a necessidade de entrar novamente na sua conta. Como o cookie persistente permanece no seu navegador, ele será lido sempre que você retornar a um dos sites ou visitar um site de terceiros que utiliza os serviços. Os cookies de sessão duram apenas até o término da sessão (geralmente, durante a visita a um site ou durante uma sessão do navegador).'],
  ['Pixels', 'Um pixel é uma pequena imagem que pode ser encontrada em páginas da web e em e-mails e que exige uma chamada (que fornece informações sobre o dispositivo e sobre a visita) aos servidores para que o pixel apareça nestas páginas da web e em e-mails. Utiliza-se pixels para saber mais sobre suas interações com o conteúdo de e-mails ou da web, por exemplo, se você interagiu com anúncios ou publicações. Pixels também permitem que a organização e terceiros instalem cookies no seu navegador.'],
  ['Armazenamento local', 'O armazenamento local permite que um site ou aplicativo armazene informações localmente nos seus dispositivos. O armazenamento local pode ser utilizado para melhorar a experiência no site, por exemplo, habilitando recursos, lembrando as suas preferências e acelerando a funcionalidade do site.'],
  ['Outras tecnologias', 'Também se utiliza outras tecnologias de rastreamento, como identificadores e marcadores para publicidade em dispositivos móveis para fins semelhantes, conforme descrito nesta Política de Cookies.'],
];

const FINALIDADES = [
  ['Autenticação', 'Utiliza-se os cookies para reconhecer quando você acessa os serviços. Quando você entra no site, os cookies ajudam a exibir as informações corretas e a personalizar sua experiência de acordo com as suas configurações.'],
  ['Segurança', 'Utiliza-se os cookies para tornar a sua interação com os serviços mais ágil, mais segura e para ajudar a organização a detectar atividades mal-intencionadas.'],
  ['Preferências, recursos e serviços', 'Utiliza-se cookies para habilitar a funcionalidade dos serviços e a fornecer recursos, estatísticas e conteúdo personalizado. Também, essas tecnologias são usadas para lembrar informações sobre seu navegador e suas preferências.'],
  ['Funcional', 'Utiliza-se cookies para melhorar sua experiência nos serviços prestados pela organização.'],
  ['Plugins dentro e fora', 'Utiliza-se cookies para habilitar plugins do site dentro e fora dos sites. Os plug-ins podem ser encontrados no site ou em sites de terceiros e parceiros. Se você interagir com um plugin, ele utilizará cookies para identificar você e iniciar sua solicitação.'],
  ['Publicidade personalizada', 'Os cookies ajudam a mostrar publicidade relevante para você, tanto dentro como fora dos serviços, a medir o desempenho de tais anúncios e a fornecer relatórios sobre eles. Utiliza-se cookies para saber se o conteúdo foi exibido a você ou se alguém que visualizou um anúncio voltou depois e realizou uma ação (por ex.: baixou um documento técnico ou fez uma compra) em outro site. Do mesmo modo, os parceiros ou prestadores de serviços podem utilizar cookies para determinar se exibimos um anúncio ou uma publicação, e qual foi o desempenho desse anúncio ou publicação, ou nos fornece informações sobre como você interagiu com o anúncio. Trabalhar com os parceiros para apresentar um anúncio a você dentro e fora do site, como por exemplo, após você visitar o site ou o aplicativo interno ou do parceiro.'],
  ['Análise e pesquisa', 'Cookies ajudam a saber mais sobre o desempenho dos serviços e plugins em diferentes locais. A organização ou prestadores de serviços usam cookies para entender, melhorar e pesquisar produtos, recursos e serviços, inclusive enquanto você navega nos sites ou quando acessa o site a partir de outros sites, aplicativos ou dispositivos. Utiliza-se os cookies para determinar e analisar o desempenho de anúncios ou publicações dentro e fora do site e para saber se você interagiu com os sites ou com sites externos, conteúdo ou e-mails e fornecer análises com base nessas interações. Os cookies são utilizados para fornecer informações agregadas para os usuários e parceiros como parte dos serviços. Se você for um usuário do site, mas tiver saído da sua conta em um navegador, o site pode continuar registrando suas interações com os serviços naquele navegador por até 30 dias, para gerar análises de utilização dos serviços. A organização pode compartilhar essas análises de forma agregada com os usuários.'],
];

const H3 = 'text-[17px] font-[800] text-ink mb-2 mt-8';
const P = 'text-[15px] leading-[1.75] text-ink-light mb-4';
const UL = 'list-disc pl-6 text-[15px] leading-[1.85] text-ink-light mb-5 space-y-1.5';

function BrowserList() {
  return (
    <ul className={UL}>
      {BROWSER_LINKS.map(([label, href]) => (
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
          {rows.map(([nome, desc]) => (
            <tr key={nome} className="border-b border-line last:border-0 align-top">
              <th scope="row" className="text-left font-[800] text-ink px-4 py-3 w-[200px] align-top">{nome}</th>
              <td className="px-4 py-3">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacidadePage() {
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
        Privacidade e Proteção de Dados
      </h1>

      <section className="max-w-content mx-auto px-4 md:px-10 mt-10 pb-16">

        {/* ── POLÍTICA DE PRIVACIDADE ── */}
        <h2 className="text-[22px] font-[800] text-orange mb-5">POLÍTICA DE PRIVACIDADE</h2>

        <p className={P}>
          A Política tem como prioridade a proteção dos dados pessoais, mantendo todos os aspectos devidos de
          segurança e privacidade. O comprometimento engloba, também, a transparência do processo de tratamento
          de dados pessoais dos stakeholders. Por isso, a presente Política de Privacidade estabelece como é
          feita a coleta, uso e transferência de informações de clientes e terceiros que acessam ou usam o site
          da organização.
        </p>
        <p className={P}>
          Ao utilizar serviços da organização, as informações pessoais são coletadas e utilizadas nas formas
          descritas nesta Política, conforme as normas da{' '}
          <strong className="text-ink">Lei Geral de Proteção de Dados n° 13.709/2018</strong>, combinadas com as
          disposições consumeristas da <strong className="text-ink">Lei 8.078/1990</strong>. e as demais normas
          do ordenamento jurídico brasileiro aplicáveis.
        </p>
        <p className={P}>
          No papel de Controladora de Dados, obriga-se ao disposto na presente Política de Privacidade.
        </p>

        <h3 className={H3}>1. Quais dados são coletados sobre você e para qual finalidade?</h3>
        <p className={P}>
          O site da organização coleta e utiliza alguns dos seus dados pessoais, de forma a viabilizar a
          prestação de serviços e aprimorar a experiência de uso.
        </p>
        <p className="text-[15px] leading-[1.75] text-ink mb-2 font-semibold">Dados pessoais fornecidos pelo titular:</p>
        <ul className={UL}>
          <li>Dados fornecidos pelos usuários (ex.: informações de contato, dados profissionais, informações financeiras ou técnicas);</li>
          <li>Dados de navegação (ex.: endereço IP, localização, país, tempo de navegação, tempo de acesso) ou dados que surjam de sua interação com o site;</li>
          <li>Cookies e sistemas de rastreamento da Internet;</li>
          <li>Informações sobre a convicção religiosa do usuário são coletadas quando o cadastro é preenchido.</li>
        </ul>

        <h3 className={H3}>2. Consentimento</h3>
        <p className={P}>
          É a partir do seu consentimento que a organização pode tratar os seus dados pessoais. O consentimento
          é a manifestação livre e inequívoca pela qual você nos autoriza a tratar seus dados.
        </p>
        <p className={P}>
          Assim, em consonância com a Lei Geral de Proteção de Dados nº 13.709/18, seus dados só serão
          coletados, tratados e armazenados mediante prévio e expresso consentimento.
        </p>
        <p className={P}>
          O seu consentimento será obtido de forma específica para cada finalidade acima descrita, evidenciando
          o compromisso de transparência e boa-fé para com seus usuários/clientes, seguindo as regulações
          legislativas pertinentes.
        </p>
        <p className={P}>
          Ao utilizar os serviços e fornecer seus dados pessoais, você está ciente e consentindo com as
          disposições desta Política de Privacidade, além de conhecer seus direitos e como exercê-los.
        </p>
        <p className="text-[15px] leading-[1.75] text-ink font-[800] mb-4">
          A qualquer tempo e sem nenhum custo, você poderá revogar seu consentimento.
        </p>
        <p className={P}>
          É importante destacar que a revogação do consentimento para o tratamento dos dados pode implicar a
          impossibilidade da performance adequada de alguma funcionalidade do site que dependa da operação.
          Tais consequências serão informadas previamente.
        </p>

        <h3 className={H3}>3. Quais são os seus direitos?</h3>
        <p className={P}>
          A organização assegura a seus usuários/clientes seus direitos de titular previstos no art. 18 da Lei
          Geral de Proteção de Dados nº 13.709/18. Dessa forma, você pode, de maneira gratuita e a qualquer tempo:
        </p>
        <ul className={UL}>
          <li>Confirmar a existência de tratamento de dados, de maneira simplificada ou em formato claro e completo;</li>
          <li>Acessar seus dados, podendo solicitá-los em uma cópia legível sob forma impressa ou por meio eletrônico, seguro e idôneo;</li>
          <li>Corrigir seus dados, ao solicitar a edição, correção ou atualização;</li>
          <li>Limitar seus dados quando desnecessários, excessivos ou tratados em desconformidade com a legislação através da anonimização, bloqueio ou eliminação;</li>
          <li>Solicitar a portabilidade de seus dados, através de um relatório de dados cadastrais;</li>
          <li>Eliminar seus dados tratados a partir de seu consentimento, exceto nos casos previstos em lei;</li>
          <li>Revogar seu consentimento, desautorizando o tratamento de seus dados;</li>
          <li>Informar-se sobre a possibilidade de não fornecer seu consentimento e sobre as consequências da negativa.</li>
        </ul>

        <h3 className={H3}>4. Como você pode exercer seus direitos de titular?</h3>
        <p className={P}>
          Para exercer seus direitos de titular, você deve entrar em contato através dos seguintes meios disponíveis:
        </p>
        <ul className={UL}>
          {/* O site antigo lista apenas "E-mail" e "Telefone" sem valores; mantidos
              aqui os contatos que já constavam nesta página. */}
          <li>
            E-mail:{' '}
            <a href="mailto:marketing@laboratoriosobral.com.br" className="text-orange font-bold hover:underline">
              marketing@laboratoriosobral.com.br
            </a>
          </li>
          <li>
            Telefone:{' '}
            <a href="tel:+558921012202" className="font-bold text-ink hover:underline">(89) 2101-2202</a>
          </li>
        </ul>
        <p className={P}>
          De forma a garantir a sua correta identificação como titular dos dados pessoais objeto da solicitação,
          é possível que as organizações solicitem os documentos ou demais comprovações que possam comprovar sua
          identidade. Nessa hipótese, você será informado previamente.
        </p>

        <h3 className={H3}>5. Como e por quanto tempo seus dados serão armazenados?</h3>
        <p className={P}>
          Seus dados pessoais coletados serão utilizados e armazenados durante o tempo necessário para a
          prestação do serviço ou para que as finalidades elencadas na presente Política de Privacidade sejam
          atingidas, considerando os direitos dos titulares dos dados e dos controladores.
        </p>
        <p className={P}>
          De modo geral, seus dados serão mantidos enquanto a relação contratual perdurar. Findado o período de
          armazenamento dos dados pessoais, estes serão excluídos das bases de dados ou anonimizados,
          ressalvadas as hipóteses legalmente previstas. Especialmente as hipóteses dispostas no art. 16 da Lei
          Geral de Proteção de Dados nº 13.709/18, a saber:
        </p>
        <ul className={UL}>
          <li>Cumprimento de obrigação legal ou regulatória pelo controlador;</li>
          <li>Estudo por órgão de pesquisa, garantida, sempre que possível, a anonimização dos dados pessoais;</li>
          <li>Transferência a terceiro, desde que respeitados os requisitos de tratamento de dados dispostos nesta Lei; ou</li>
          <li>Uso exclusivo do controlador, vedado seu acesso por terceiro, e desde que anonimizados os dados.</li>
        </ul>
        <p className={P}>
          Isto é, suas informações pessoais, que sejam imprescindíveis para o cumprimento de determinações
          legais, judiciais e administrativas e/ou para o exercício do direito de defesa em processos judiciais
          e administrativos serão mantidas, a despeito da exclusão dos demais dados.
        </p>
        <p className={P}>
          O armazenamento de dados coletados reflete o compromisso com a segurança e privacidade dos seus dados.
          A organização emprega medidas e soluções técnicas de proteção aptas a garantir a confidencialidade,
          integridade e inviolabilidade dos seus dados. Além disso, a organização conta com medidas de segurança
          apropriadas aos riscos e com controle de acesso às informações armazenadas.
        </p>

        <h3 className={H3}>6. O que a organização faz para manter seus dados seguros?</h3>
        <p className={P}>
          Para a manutenção das suas informações pessoais seguras, a organização usa ferramentas físicas,
          eletrônicas e gerenciais orientadas para a proteção da sua privacidade.
        </p>
        <p className={P}>
          Aplica-se essas ferramentas levando em consideração a natureza dos dados pessoais coletados, o
          contexto e a finalidade do tratamento, bem como os riscos que eventuais violações podem gerar para os
          direitos e liberdades do titular dos dados coletados e tratados.
        </p>
        <p className={P}>Entre as medidas que a organização adota destaca-se as seguintes:</p>
        <ul className={UL}>
          <li>Apenas pessoas autorizadas têm acesso a seus dados pessoais;</li>
          <li>O acesso a seus dados pessoais é feito somente após o compromisso de confidencialidade;</li>
          <li>Seus dados pessoais são armazenados em ambiente seguro e idôneo.</li>
        </ul>
        <p className={P}>
          A organização compromete-se em adotar as melhores posturas para evitar incidentes de segurança.
          Contudo, é necessário destacar que nenhuma página virtual é inteiramente segura e livre de riscos. É
          possível que, apesar de todos os protocolos de segurança adotados, problemas de culpa exclusivamente
          de terceiros ocorram, como ataques cibernéticos de hackers e, também, em decorrência da negligência ou
          imprudência do próprio usuário/cliente.
        </p>
        <p className={P}>
          Em caso de incidentes de segurança que possam gerar risco ou dano relevante para você ou qualquer um
          dos usuários/clientes, a organização comunicará os afetados e a Autoridade Nacional de Proteção de
          Dados (ANPD), em consonância com as disposições da Lei Geral de Proteção de Dados nº 13.709/18.
        </p>

        <h3 className={H3}>7. Com quem seus dados podem ser compartilhados?</h3>
        <p className={P}>
          Tendo em vista a preservação de sua privacidade, não compartilhar-se-á seus dados pessoais com nenhum
          terceiro não autorizado.
        </p>
        <p className={P}>
          Seus dados poderão ser compartilhados com parceiros comerciais, nesta hipótese, a organização
          informará quais dados serão compartilhados e com quem irá compartilhar. Ressalvado o compartilhamento
          dos dados sensíveis referente a saúde com o objetivo de obter vantagem econômica, conforme vedação
          imposta pelo art. 11, §4º da Lei Geral de Proteção de Dados nº 13.709/18.
        </p>
        <p className={P}>
          Os terceiros interessados e parceiros comerciais receberão seus dados restritos aos necessários para a
          prestação dos serviços contratados. Destaca-se que os contratos são orientados pelas normas de
          proteção de dados do ordenamento jurídico brasileiro.
        </p>
        <p className={P}>
          Todavia, os parceiros da organização têm suas próprias Políticas de Privacidade, que podem divergir
          desta. Recomenda-se a leitura desses documentos.
        </p>
        <p className={P}>
          Além disso, também existem outras hipóteses em que seus dados poderão ser compartilhados, que são:
        </p>
        <ul className={UL}>
          <li>Determinação legal, requerimento, requisição ou ordem judicial, com autoridades judiciais, administrativas ou governamentais competentes;</li>
          <li>Caso de movimentações societárias, como fusão, aquisição e incorporação, de forma automática;</li>
          <li>Proteção dos direitos da empresa em qualquer tipo de conflito, inclusive os de teor judicial.</li>
        </ul>

        <h3 className={H3}>8. Transferência internacional de dados;</h3>
        <p className={P}>
          Alguns dos terceiros com quem a organização compartilha seus dados podem ser localizados ou possuir
          instalações localizadas em países estrangeiros. Nessas condições, de toda forma, seus dados pessoais
          estarão sujeitos à Lei Geral de Proteção de Dados nº 13.709/18 e às demais legislações brasileiras de
          proteção de dados.
        </p>
        <p className={P}>
          Nesse sentido, se compromete a sempre adotar eficientes padrões de segurança cibernética e de proteção
          de dados, nos melhores esforços de garantir e cumprir as exigências legislativas.
        </p>
        <p className={P}>
          Ao concordar com essa Política de Privacidade, você concorda com esse compartilhamento, que se dará
          conforme as finalidades descritas no presente instrumento.
        </p>

        <h3 className={H3}>9. Cookies ou dados de navegação</h3>
        <p className={P}>
          A organização faz uso de Cookies, que são arquivos de texto enviados pela plataforma ao seu computador
          e que nele se armazenam, que contém informações relacionadas à navegação do site. Em suma, os Cookies
          são utilizados para aprimorar a experiência de uso.
        </p>
        <p className={P}>
          Ao acessar o site e consentir com o uso de Cookies, você manifesta conhecer e aceitar a utilização de
          um sistema de coleta de dados de navegação com o uso de Cookies em seu dispositivo.
        </p>
        <p className={P}>
          Você pode, a qualquer tempo e sem nenhum custo, alterar as permissões, bloquear ou recusar os Cookies.
          Todavia, a revogação do consentimento de determinados Cookies pode inviabilizar o funcionamento
          correto de alguns recursos da plataforma.
        </p>
        <p className={P}>
          Para gerenciar os cookies do seu navegador, basta fazê-lo diretamente nas configurações do navegador,
          na área de gestão de Cookies. Você pode acessar tutoriais sobre o tema diretamente nos links abaixo:
        </p>
        <BrowserList />

        <h3 className={H3}>10. Alteração desta Política de Privacidade</h3>
        <p className={P}>
          A organização reserva o direito de modificar essa Política de Privacidade a qualquer tempo,
          principalmente em função da adequação a eventuais alterações feitas no site ou em âmbito legislativo.
        </p>
        <p className={P}>
          Eventuais alterações entrarão em vigor a partir de sua publicação no site e sempre, a organização, lhe
          notificará acerca das mudanças ocorridas.
        </p>
        <p className={P}>
          Ao utilizar os serviços e fornecer seus dados pessoais após tais modificações, você às consente.
        </p>

        <h3 className={H3}>11. Responsabilidade</h3>
        <p className={P}>
          A organização se responsabiliza pelos agentes que atuam nos processos de tratamento de dados, em
          conformidade aos arts. 42 ao 45 da Lei Geral de Proteção de Dados nº 13.709/18. Comprometendo-se a
          manter esta Política de Privacidade atualizada, observando suas disposições e zelando por seu
          cumprimento.
        </p>
        <p className={P}>
          Além disso, a organização assume o compromisso de buscar condições técnicas e organizativas seguras
          aptas a proteger todo o processo de tratamento de dados.
        </p>
        <p className={P}>
          Caso a Autoridade Nacional de Proteção de Dados (ANPD) exija a adoção de providências em relação ao
          tratamento de dados realizado pela organização, está se compromete a segui-las.
        </p>

        <h3 className={H3}>12. Isenção de Responsabilidade</h3>
        <p className={P}>
          Conforme mencionado no item 6, embora a organização adote elevados padrões de segurança a fim de
          evitar incidentes, não há nenhuma página virtual inteiramente livre de riscos. A organização não se
          responsabiliza por:
        </p>
        <ul className={UL}>
          <li>Culpa exclusiva dos clientes/usuários, incluindo quaisquer consequências decorrentes da negligência, imprudência ou imperícia dos clientes/usuários em relação a seus dados individuais. A organização garante e se responsabiliza apenas pela segurança dos processos de tratamento de dados e do cumprimento das finalidades descritas no presente instrumento.</li>
          <li>Culpa de terceiros, como ações maliciosas de estranhos à relação, como ataques de hackers, exceto se comprovada conduta culposa ou deliberada da empresa;</li>
          <li>Inveracidade das informações inseridas pelo usuário/cliente nos registros necessários para a utilização dos serviços;</li>
          <li>Quaisquer consequências decorrentes de informações falsas ou inseridas de má-fé são de inteira responsabilidade do usuário/cliente.</li>
        </ul>
        <p className={P}>
          Destaca-se que em caso de incidentes de segurança que possam gerar risco ou dano relevante para você
          ou qualquer um dos usuários/clientes, a organização comunicará aos afetados e à Autoridade Nacional de
          Proteção de Dados (ANPD) sobre o ocorrido e cumprirá as providências necessárias.
        </p>

        <h3 className={H3}>13. Encarregado de Proteção de Dados</h3>
        <p className={P}>
          Caso tenha dúvidas sobre esta Política de Privacidade ou sobre os dados pessoais que a organização
          trata, você pode entrar em contato com o Encarregado de Proteção de Dados Pessoais.
        </p>

        {/* ── POLÍTICA DE COOKIES ── */}
        <div className="border-t border-line pt-8 mt-10">
          <h2 className="text-[22px] font-[800] text-orange mb-5">POLÍTICA DE COOKIES</h2>

          <p className={P}>
            Considerando que a organização preza pela transparência e honestidade sobre a coleta e utilização
            dos dados relativos a você. A presente Política de Cookies é aplicada a todos os produtos e serviços
            relacionados ou incorporados pela própria Política à organização. Utiliza-se cookies e tecnologias
            semelhantes, para coletar e utilizar dados como parte dos serviços, conforme definidos nesta
            Política de Privacidade.
          </p>
          <p className={P}>
            Cookies são pequenos arquivos de texto que armazenam por um determinado período as atividades do
            usuário. Cookies armazenam seu histórico de navegação, bem como logins e senhas. É por causa deles
            que você pode acessar a sua conta sem precisar sempre digitar seus dados cadastrais novamente, pois
            o navegador utiliza os cookies e faz isso por você. Além de vários aspectos funcionais, os cookies
            também cumprem um excelente serviço em sistemas bastante conhecidos como o Google Drive, por exemplo.
          </p>

          <h3 className={H3}>Tecnologias usadas</h3>
          <Tabela head={['Tipo de tecnologia', 'Descrição']} rows={TECNOLOGIAS} />
          <p className={P}>
            As tabelas de cookies listam alguns dos cookies usados pela organização e por terceiros como parte
            dos Serviços. Observe que essas tabelas podem ser atualizadas de tempos em tempos para fornecer a
            você as informações mais recentes.
          </p>

          <h3 className={H3}>Como essas tecnologias são utilizadas</h3>
          <p className={P}>Abaixo, descreve-se as maneiras como pode usar cookies:</p>
          <Tabela head={['Finalidade', 'Descrição']} rows={FINALIDADES} />

          <p className={P}>
            Além disso, seu navegador ou dispositivo pode ter configurações que permitam a você escolher se quer
            definir cookies ou não e excluí-los. Estes controles variam de acordo com o navegador, e os
            fabricantes podem, a qualquer momento, alterar as configurações e a forma como funcionam.
          </p>
          <p className={P}>
            Você poderá encontrar nos links abaixo informações adicionais sobre os controles que navegadores
            populares oferecem. Determinadas partes dos Produtos do site poderão não funcionar corretamente se o
            uso de cookies do navegador tiver sido desativado. Esteja ciente de que esses controles são
            diferentes daqueles oferecidos pelo site.
          </p>
          <BrowserList />
        </div>

        {/* ── Contato ── */}
        <div className="border-t border-line pt-6 mt-6 text-[14.5px] leading-[1.8] text-ink-light">
          <p className="font-[800] text-ink mb-1">Laboratório Sobral</p>
          <p className="mb-3">
            Rua Bento Leão, 25 - Centro<br />
            64.800-062 - Floriano-PI.
          </p>
          <p>
            SAC <a href="tel:08009795040" className="font-bold text-ink hover:underline">0800-979-5040</a><br />
            <a href="tel:+558921012202" className="font-bold text-ink hover:underline">(89) 2101-2202</a>
          </p>
        </div>
      </section>
    </>
  );
}
