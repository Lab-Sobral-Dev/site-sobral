/* ============ Página: Quem Somos ============ */

function QuemSomosPage() {
  return (
    <>
      <SectionTitleBar>Quem Somos</SectionTitleBar>

      <section className="container" style={{marginTop: 40}}>
        {/* Missão / Visão / Valores */}
        <div className="mvv-card">
          <div className="mvv-item">
            <h3>Missão</h3>
            <p>Contribuir com a saúde e a qualidade de vida das famílias brasileiras.</p>
          </div>
          <div className="mvv-divider"></div>
          <div className="mvv-item">
            <h3>Visão</h3>
            <p>Continuar a expansão do negócio, tornando-se referência nos segmentos de suplementos alimentares e cosméticos.</p>
          </div>
          <div className="mvv-divider"></div>
          <div className="mvv-item">
            <h3>Valores</h3>
            <p>Compromisso, qualidade, respeito, entusiasmo, credibilidade, perseverança e orgulho nordestino.</p>
          </div>
        </div>
      </section>

      <section className="container" style={{marginTop: 60}}>
        <div style={{display:'grid', gridTemplateColumns:'1.35fr 1fr', gap: 56, alignItems:'start'}}>
          <div>
            <div className="title-with-rule">
              <h2>
                Da cura à prevenção:
                <span className="accent">Uma tradição centenária que sempre se renova!</span>
              </h2>
              <div className="rule"></div>
            </div>
            <p style={{fontSize:15, lineHeight:1.7, color:'var(--ink-light)', marginBottom: 36}}>
              Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos
              brasileiros. Estamos nas casas das famílias levando mais saúde e
              proporcionando leveza e bem-estar ao dia a dia. Mais que uma
              indústria, somos um símbolo da luta do povo brasileiro.
              Essa é nossa essência e isso nunca vai mudar.
            </p>

            <h2 style={{fontSize: 30, fontWeight: 800, marginBottom: 18}}>Um pouco de história...</h2>
            <p style={{fontSize:15, lineHeight:1.7, color:'var(--ink-light)', marginBottom: 18}}>
              A história do Laboratório Sobral começou a ser contada em 1911,
              com a abertura de uma botica na cidade de Amarante – Piauí, a
              Pharmacia Sobral. Em 1919 foi transferida pra Floriano, e aqui
              fixada. Em 1925 foi para sede própria onde está até hoje.
            </p>
            <p style={{fontSize:15, lineHeight:1.7, color:'var(--ink-light)', marginBottom: 18}}>
              Ao longo dos anos o pequeno negócio cresceu e, além da Pharmacia,
              que comercializava produtos próprios e de outras marcas, a botica
              transformou-se em um laboratório e pequena (e artesanal) indústria
              de medicamentos.
            </p>
            <p style={{fontSize:15, lineHeight:1.7, color:'var(--ink-light)'}}>
              Até que, em 1973, sob a gestão do economista e empreendedor
              Teodoro Ferreira Sobral Neto, a fábrica passou a ser continuamente
              ampliada e modernizada até chegar aos dias de hoje, em que é uma
              referência no cuidado da saúde dos brasileiros.
            </p>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap: 24, paddingTop: 60}}>
            <div className="history-photo history-photo-1">
              <img src="images/fachada.png" alt="Fachada do Laboratório Sobral"/>
            </div>
            <div className="history-photo history-photo-2">
              <div className="placeholder-label">[ foto histórica: linha de produção ]</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

window.QuemSomosPage = QuemSomosPage;
