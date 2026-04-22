/* ============ Página: Política de Privacidade ============ */

function PrivacidadePage() {
  return (
    <>
      <SectionTitleBar>Privacidade e Proteção de Dados</SectionTitleBar>

      <section className="container" style={{marginTop: 40, maxWidth: 920}}>
        <h2 style={{
          fontSize: 26, fontWeight: 800,
          color: 'var(--ink)', textAlign: 'center',
          marginBottom: 30
        }}>
          Política de Privacidade
        </h2>

        <div style={{fontSize: 14.5, lineHeight: 1.75, color: 'var(--ink-light)'}}>
          <p style={{marginBottom: 18}}>
            A Política tem como prioridade a proteção dos dados pessoais, mantendo todos os aspectos devidos
            de segurança e privacidade. O comprometimento engloba, também, a transparência do processo de
            tratamento de dados pessoais dos stakeholders. Por isso, a presente Política de Privacidade
            estabelece como é feita a coleta, uso e transferência de informações de clientes e terceiros que
            acessam ou usam o site da organização.
          </p>
          <p style={{marginBottom: 18}}>
            Ao utilizar serviços da organização, as informações pessoais são coletadas e utilizadas nas formas
            descritas nesta Política, conforme as normas da{' '}
            <strong style={{color: 'var(--ink)'}}>Lei Geral de Proteção de Dados nº 13.709/2018</strong>,
            combinadas com as disposições consumeristas da{' '}
            <strong style={{color: 'var(--ink)'}}>Lei 8.078/1990</strong> e as demais normas do
            ordenamento jurídico brasileiro aplicáveis.
          </p>
          <p style={{marginBottom: 24}}>
            No papel de Controladora de Dados, obriga-se ao disposto na presente Política de Privacidade.
          </p>

          <h3 style={{fontSize: 16, fontWeight: 800, color:'var(--ink)', marginBottom: 8}}>
            1. Quais dados são coletados sobre você e para qual finalidade?
          </h3>
          <p style={{marginBottom: 14}}>
            O site da organização coleta e utiliza alguns dos seus dados pessoais, de forma a viabilizar a prestação
            de serviços e aprimorar a experiência de uso.
          </p>
          <p style={{marginBottom: 10}}>Dados pessoais fornecidos pelo titular:</p>
          <ol style={{paddingLeft: 28, marginBottom: 24, listStyle:'lower-alpha'}}>
            <li style={{marginBottom: 6}}>Dados fornecidos pelos usuários (ex.: informações de contato, dados profissionais, informações financeiras ou técnicas);</li>
            <li style={{marginBottom: 6}}>Dados de navegação (ex.: endereço IP, localização, país, tempo de navegação, tempo de acesso) ou dados que surjam de sua interação com o site;</li>
            <li style={{marginBottom: 6}}>Cookies e sistemas de rastreamento da Internet;</li>
            <li>Informações sobre a convicção religiosa do usuário só são coletadas quando o cadastro é preenchido.</li>
          </ol>

          <h3 style={{fontSize: 16, fontWeight: 800, color:'var(--ink)', marginBottom: 8}}>2. Consentimento</h3>
          <p style={{marginBottom: 16}}>
            É a partir do seu consentimento que a organização pode tratar os seus dados pessoais. O
            consentimento é a manifestação livre e inequívoca pela qual você nos autoriza a tratar seus dados.
            Assim, em consonância com a Lei Geral de Proteção de Dados nº 13.709/18, seus dados só serão
            coletados, tratados e armazenados mediante prévio e expresso consentimento.
          </p>
          <p style={{marginBottom: 16}}>
            O seu consentimento será obtido de forma específica para cada finalidade acima descrita,
            evidenciando o compromisso de transparência e boa-fé para com seus usuários/clientes, seguindo as
            regulações legislativas pertinentes.
          </p>
          <p>
            Ao utilizar os serviços e fornecer seus dados pessoais, você está ciente e consentindo com as
            disposições desta Política de Privacidade, além de conhecer seus direitos e como exercê-los.
            A qualquer tempo e sem nenhum custo, você poderá revogar seu consentimento.
          </p>
        </div>
      </section>
    </>
  );
}

window.PrivacidadePage = PrivacidadePage;
