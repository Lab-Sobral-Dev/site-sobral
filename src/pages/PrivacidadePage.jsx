import { Helmet } from 'react-helmet-async';

export default function PrivacidadePage() {
  return (
    <>
      <Helmet>
        <title>Política de Privacidade e Cookies | Laboratório Sobral</title>
        <meta name="description" content="Política de privacidade e cookies do Laboratório Sobral em conformidade com a LGPD. Saiba como coletamos, usamos e protegemos seus dados pessoais." />
        <meta property="og:title" content="Política de Privacidade e Cookies | Laboratório Sobral" />
        <meta property="og:description" content="Política de privacidade e cookies do Laboratório Sobral em conformidade com a LGPD." />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="bg-gradient-to-b from-orange to-[#E85A0C] text-white text-center py-[22px] px-5 text-[26px] font-[800] tracking-[.3px]">
        Privacidade e Proteção de Dados
      </div>

      <section className="max-w-[920px] mx-auto px-10 mt-10 pb-16">

        {/* POLÍTICA DE PRIVACIDADE */}
        <h1 className="text-[22px] font-[800] text-orange mb-4">Política de Privacidade</h1>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-4">
          A Política tem como prioridade a proteção dos dados pessoais, mantendo todos os aspectos devidos de segurança e privacidade.
          O comprometimento engloba, também, a transparência do processo de tratamento de dados pessoais dos stakeholders. Por isso,
          a presente Política de Privacidade estabelece como é feita a coleta, uso e transferência de informações de clientes e terceiros
          que acessam ou usam o site da organização.
        </p>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-4">
          Ao utilizar serviços da organização, as informações pessoais são coletadas e utilizadas nas formas descritas nesta Política,
          conforme as normas da <strong>Lei Geral de Proteção de Dados n° 13.709/2018</strong>, combinadas com as disposições consumeristas
          da <strong>Lei 8.078/1990</strong> e as demais normas do ordenamento jurídico brasileiro aplicáveis.
        </p>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-8">
          No papel de Controladora de Dados, obriga-se ao disposto na presente Política de Privacidade.
        </p>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">1. Quais dados são coletados sobre você e para qual finalidade?</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-3">
          O site da organização coleta e utiliza alguns dos seus dados pessoais, de forma a viabilizar a prestação de serviços e aprimorar a experiência de uso.
        </p>
        <p className="text-[15px] font-semibold text-ink mb-2">Dados pessoais fornecidos pelo titular:</p>
        <ul className="list-disc pl-6 text-[15px] leading-[1.85] text-ink-light mb-5">
          <li>Dados fornecidos pelos usuários (ex.: informações de contato, dados profissionais, informações financeiras ou técnicas)</li>
          <li>Dados de navegação (ex.: endereço IP, localização, país, tempo de navegação, tempo de acesso) ou dados que surjam de sua interação com o site</li>
          <li>Cookies e sistemas de rastreamento da Internet</li>
          <li>Informações sobre a convicção religiosa do usuário são coletadas quando o cadastro é preenchido</li>
        </ul>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">2. Consentimento</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-4">
          É a partir do seu consentimento que a organização pode tratar os seus dados pessoais. O consentimento é a manifestação livre e inequívoca
          pela qual você nos autoriza a tratar seus dados.
        </p>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-4">
          Assim, em consonância com a Lei Geral de Proteção de Dados nº 13.709/18, seus dados só serão coletados, tratados e armazenados mediante prévio e expresso consentimento.
        </p>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-4">
          O seu consentimento será obtido de forma específica para cada finalidade acima descrita, evidenciando o compromisso de transparência e boa-fé
          para com seus usuários/clientes, seguindo as regulações legislativas pertinentes.
        </p>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-4">
          Ao utilizar os serviços e fornecer seus dados pessoais, você está ciente e consentindo com as disposições desta Política de Privacidade,
          além de conhecer seus direitos e como exercê-los.
        </p>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-4">
          <strong>A qualquer tempo e sem nenhum custo, você poderá revogar seu consentimento.</strong>
        </p>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
          É importante destacar que a revogação do consentimento para o tratamento dos dados pode implicar a impossibilidade da performance
          adequada de alguma funcionalidade do site que dependa da operação. Tais consequências serão informadas previamente.
        </p>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">3. Quais são os seus direitos?</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-3">
          A organização assegura a seus usuários/clientes seus direitos de titular previstos no art. 18 da Lei Geral de Proteção de Dados nº 13.709/18.
          Dessa forma, você pode, de maneira gratuita e a qualquer tempo:
        </p>
        <ul className="list-disc pl-6 text-[15px] leading-[1.85] text-ink-light mb-5">
          <li>Confirmar a existência de tratamento de dados, de maneira simplificada ou em formato claro e completo</li>
          <li>Acessar seus dados, podendo solicitá-los em uma cópia legível sob forma impressa ou por meio eletrônico, seguro e idôneo</li>
          <li>Corrigir seus dados, ao solicitar a edição, correção ou atualização</li>
          <li>Limitar seus dados quando desnecessários, excessivos ou tratados em desconformidade com a legislação através da anonimização, bloqueio ou eliminação</li>
          <li>Solicitar a portabilidade de seus dados, através de um relatório de dados cadastrais</li>
          <li>Eliminar seus dados tratados a partir de seu consentimento, exceto nos casos previstos em lei</li>
          <li>Revogar seu consentimento, desautorizando o tratamento de seus dados</li>
          <li>Informar-se sobre a possibilidade de não fornecer seu consentimento e sobre as consequências da negativa</li>
        </ul>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">4. Como você pode exercer seus direitos de titular?</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-3">
          Para exercer seus direitos de titular, você deve entrar em contato através dos seguintes meios disponíveis:
        </p>
        <ul className="list-disc pl-6 text-[15px] leading-[1.85] text-ink-light mb-4">
          <li>E-mail: <span className="text-orange font-bold">marketing@laboratoriosobral.com.br</span></li>
          <li>Telefone: <span className="font-bold">(89) 2101-2202</span></li>
        </ul>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
          De forma a garantir a sua correta identificação como titular dos dados pessoais objeto da solicitação, é possível que a organização
          solicite documentos ou demais comprovações que possam comprovar sua identidade. Nessa hipótese, você será informado previamente.
        </p>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">5. Como e por quanto tempo seus dados serão armazenados?</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-4">
          Seus dados pessoais coletados serão utilizados e armazenados durante o tempo necessário para a prestação do serviço ou para que as
          finalidades elencadas na presente Política de Privacidade sejam atingidas, considerando os direitos dos titulares dos dados e dos controladores.
        </p>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-3">
          De modo geral, seus dados serão mantidos enquanto a relação contratual perdurar. Findado o período de armazenamento dos dados pessoais,
          estes serão excluídos das bases de dados ou anonimizados, ressalvadas as hipóteses legalmente previstas, especialmente as dispostas no
          art. 16 da Lei Geral de Proteção de Dados nº 13.709/18:
        </p>
        <ul className="list-disc pl-6 text-[15px] leading-[1.85] text-ink-light mb-4">
          <li>Cumprimento de obrigação legal ou regulatória pelo controlador</li>
          <li>Estudo por órgão de pesquisa, garantida, sempre que possível, a anonimização dos dados pessoais</li>
          <li>Transferência a terceiro, desde que respeitados os requisitos de tratamento de dados dispostos nesta Lei</li>
          <li>Uso exclusivo do controlador, vedado seu acesso por terceiro, e desde que anonimizados os dados</li>
        </ul>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
          Suas informações pessoais imprescindíveis para o cumprimento de determinações legais, judiciais e administrativas e/ou para o exercício
          do direito de defesa em processos judiciais e administrativos serão mantidas, a despeito da exclusão dos demais dados.
          O armazenamento de dados coletados reflete o compromisso com a segurança e privacidade dos seus dados. A organização emprega medidas e
          soluções técnicas de proteção aptas a garantir a confidencialidade, integridade e inviolabilidade dos seus dados, além de controle de
          acesso às informações armazenadas.
        </p>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">6. O que a organização faz para manter seus dados seguros?</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-3">
          Para a manutenção das suas informações pessoais seguras, a organização usa ferramentas físicas, eletrônicas e gerenciais orientadas
          para a proteção da sua privacidade, levando em consideração a natureza dos dados pessoais coletados, o contexto e a finalidade do
          tratamento, bem como os riscos que eventuais violações podem gerar. Entre as medidas adotadas:
        </p>
        <ul className="list-disc pl-6 text-[15px] leading-[1.85] text-ink-light mb-4">
          <li>Apenas pessoas autorizadas têm acesso a seus dados pessoais</li>
          <li>O acesso a seus dados pessoais é feito somente após o compromisso de confidencialidade</li>
          <li>Seus dados pessoais são armazenados em ambiente seguro e idôneo</li>
        </ul>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
          A organização compromete-se em adotar as melhores posturas para evitar incidentes de segurança. Contudo, é necessário destacar que
          nenhuma página virtual é inteiramente segura e livre de riscos. Em caso de incidentes de segurança que possam gerar risco ou dano
          relevante, a organização comunicará os afetados e a Autoridade Nacional de Proteção de Dados (ANPD), em consonância com a LGPD.
        </p>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">7. Com quem seus dados podem ser compartilhados?</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-4">
          Tendo em vista a preservação de sua privacidade, não compartilharemos seus dados pessoais com nenhum terceiro não autorizado.
          Seus dados poderão ser compartilhados com parceiros comerciais, caso em que a organização informará quais dados serão compartilhados
          e com quem. Os terceiros receberão apenas os dados restritos aos necessários para a prestação dos serviços contratados.
        </p>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-3">
          Além disso, também existem outras hipóteses em que seus dados poderão ser compartilhados:
        </p>
        <ul className="list-disc pl-6 text-[15px] leading-[1.85] text-ink-light mb-5">
          <li>Determinação legal, requerimento, requisição ou ordem judicial, com autoridades judiciais, administrativas ou governamentais competentes</li>
          <li>Caso de movimentações societárias, como fusão, aquisição e incorporação, de forma automática</li>
          <li>Proteção dos direitos da empresa em qualquer tipo de conflito, inclusive os de teor judicial</li>
        </ul>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">8. Transferência internacional de dados</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
          Alguns dos terceiros com quem a organização compartilha seus dados podem estar localizados em países estrangeiros. Nessas condições,
          seus dados pessoais estarão sujeitos à Lei Geral de Proteção de Dados nº 13.709/18 e às demais legislações brasileiras de proteção de dados.
          Ao concordar com esta Política de Privacidade, você concorda com esse compartilhamento, que se dará conforme as finalidades descritas no presente instrumento.
        </p>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">9. Cookies ou dados de navegação</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-4">
          A organização faz uso de Cookies, que são arquivos de texto enviados pela plataforma ao seu computador e que nele se armazenam,
          contendo informações relacionadas à navegação do site. Os Cookies são utilizados para aprimorar a experiência de uso.
        </p>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
          Ao acessar o site e consentir com o uso de Cookies, você manifesta conhecer e aceitar a utilização de um sistema de coleta de dados
          de navegação com o uso de Cookies em seu dispositivo. Você pode, a qualquer tempo e sem nenhum custo, alterar as permissões, bloquear
          ou recusar os Cookies diretamente nas configurações do seu navegador.
        </p>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">10. Alteração desta Política de Privacidade</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
          A organização reserva o direito de modificar esta Política de Privacidade a qualquer tempo, principalmente em função da adequação
          a eventuais alterações feitas no site ou em âmbito legislativo. Eventuais alterações entrarão em vigor a partir de sua publicação no site
          e a organização notificará acerca das mudanças ocorridas. Ao utilizar os serviços e fornecer seus dados pessoais após tais modificações, você as consente.
        </p>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">11. Responsabilidade</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
          A organização se responsabiliza pelos agentes que atuam nos processos de tratamento de dados, em conformidade com os arts. 42 ao 45 da
          Lei Geral de Proteção de Dados nº 13.709/18, comprometendo-se a manter esta Política de Privacidade atualizada, observando suas disposições
          e zelando por seu cumprimento.
        </p>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">12. Isenção de Responsabilidade</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-3">
          Embora a organização adote elevados padrões de segurança a fim de evitar incidentes, não há nenhuma página virtual inteiramente livre de riscos.
          A organização não se responsabiliza por:
        </p>
        <ul className="list-disc pl-6 text-[15px] leading-[1.85] text-ink-light mb-5">
          <li>Culpa exclusiva dos clientes/usuários, incluindo quaisquer consequências decorrentes de negligência, imprudência ou imperícia em relação a seus dados individuais</li>
          <li>Culpa de terceiros, como ações maliciosas de hackers, exceto se comprovada conduta culposa ou deliberada da empresa</li>
          <li>Inveracidade das informações inseridas pelo usuário/cliente nos registros necessários para a utilização dos serviços</li>
          <li>Quaisquer consequências decorrentes de informações falsas ou inseridas de má-fé</li>
        </ul>

        <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">13. Encarregado de Proteção de Dados</h3>
        <p className="text-[15px] leading-[1.7] text-ink-light mb-8">
          Caso tenha dúvidas sobre esta Política de Privacidade ou sobre os dados pessoais que a organização trata, você pode entrar em contato
          com o Encarregado de Proteção de Dados Pessoais pelo e-mail{' '}
          <span className="text-orange font-bold">marketing@laboratoriosobral.com.br</span>{' '}
          ou pelo telefone <span className="font-bold">(89) 2101-2202</span>.
        </p>

        {/* POLÍTICA DE COOKIES */}
        <div className="border-t border-line pt-8 mt-4">
          <h2 className="text-[22px] font-[800] text-orange mb-4">Política de Cookies</h2>
          <p className="text-[15px] leading-[1.7] text-ink-light mb-4">
            Considerando que a organização preza pela transparência e honestidade sobre a coleta e utilização dos dados relativos a você,
            a presente Política de Cookies é aplicada a todos os produtos e serviços relacionados. Utiliza-se cookies e tecnologias semelhantes
            para coletar e utilizar dados como parte dos serviços.
          </p>
          <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
            Cookies são pequenos arquivos de texto que armazenam por um determinado período as atividades do usuário — como histórico de navegação,
            logins e preferências — permitindo que o navegador reconheça você sem que precise inserir seus dados a cada acesso.
          </p>

          <h3 className="text-[17px] font-[800] text-ink mb-3 mt-7">Tecnologias usadas</h3>

          <h4 className="text-[15px] font-[800] text-ink mb-1 mt-4">Cookies</h4>
          <p className="text-[15px] leading-[1.7] text-ink-light mb-4">
            Um cookie é um pequeno arquivo adicionado ao seu dispositivo que permite ativar recursos e funcionalidades. Utiliza-se dois tipos:
            <strong> cookies persistentes</strong> (permanecem além da sessão atual, facilitando seu retorno sem necessidade de novo login) e
            <strong> cookies de sessão</strong> (duram apenas durante a visita ao site).
          </p>

          <h4 className="text-[15px] font-[800] text-ink mb-1 mt-4">Pixels</h4>
          <p className="text-[15px] leading-[1.7] text-ink-light mb-4">
            Um pixel é uma pequena imagem encontrada em páginas da web e e-mails que fornece informações sobre o dispositivo e sobre a visita.
            Utiliza-se pixels para saber mais sobre suas interações com o conteúdo, como se você interagiu com anúncios ou publicações.
          </p>

          <h4 className="text-[15px] font-[800] text-ink mb-1 mt-4">Armazenamento local</h4>
          <p className="text-[15px] leading-[1.7] text-ink-light mb-4">
            O armazenamento local permite que um site armazene informações localmente nos seus dispositivos para melhorar a experiência,
            habilitando recursos e lembrando suas preferências.
          </p>

          <h3 className="text-[17px] font-[800] text-ink mb-3 mt-7">Como essas tecnologias são utilizadas</h3>
          <ul className="list-disc pl-6 text-[15px] leading-[1.85] text-ink-light mb-5">
            <li><strong>Autenticação:</strong> reconhecer quando você acessa os serviços e personalizar sua experiência.</li>
            <li><strong>Segurança:</strong> tornar a interação mais ágil e segura e detectar atividades mal-intencionadas.</li>
            <li><strong>Preferências e recursos:</strong> habilitar funcionalidades e lembrar informações do seu navegador.</li>
            <li><strong>Publicidade personalizada:</strong> mostrar conteúdo relevante e medir o desempenho de anúncios.</li>
            <li><strong>Análise e pesquisa:</strong> entender, melhorar e pesquisar produtos, recursos e serviços.</li>
          </ul>

          <h3 className="text-[17px] font-[800] text-ink mb-2 mt-7">Categorias de cookies</h3>
          <ul className="list-disc pl-6 text-[15px] leading-[1.85] text-ink-light mb-5">
            <li><strong>Necessários:</strong> essenciais para o funcionamento adequado do site, como segurança e funcionalidades básicas.</li>
            <li><strong>Funcionais:</strong> ajudam em funcionalidades como compartilhamento em redes sociais e coleta de feedback.</li>
            <li><strong>Desempenho:</strong> usados para analisar os principais índices de desempenho do site.</li>
            <li><strong>Analíticos:</strong> entendem como os visitantes interagem com o site (visitantes, taxa de rejeição, origem do tráfego).</li>
            <li><strong>Propaganda:</strong> fornecem anúncios e campanhas de marketing relevantes com base no comportamento de navegação.</li>
          </ul>

          <p className="text-[15px] leading-[1.7] text-ink-light mb-5">
            Você pode, a qualquer tempo, alterar as permissões, bloquear ou recusar os Cookies diretamente nas configurações do seu navegador.
            Esteja ciente de que a desativação de determinados cookies pode afetar sua experiência de navegação em algumas funcionalidades do site.
          </p>
        </div>

        <p className="text-[13px] text-muted mt-8 border-t border-line pt-5">
          Última atualização: junho de 2026.
        </p>
      </section>
    </>
  );
}
