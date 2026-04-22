/* ============ Página: Home ============ */

function HomePage({ onNavigate, products }) {
  const [carouselIdx, setCarouselIdx] = React.useState(0);

  const brands = [
    { img: 'images/brand-tradicionais.png', label: 'Linha Tradicionais' },
    { img: 'images/brand-calciolax.png',    label: 'Família Calciolax' },
    { img: 'images/brand-movimex.png',      label: 'Movimex' },
    { img: 'images/brand-oleos.png',        label: 'Óleos Sobral' },
  ];

  const featured = products.filter(p => ['aqualema','calciolax-articule','saludoz','propolis-verde','movimex','calciolax-kids','rosa-mosqueta-spray','propzinco'].includes(p.id));
  const visibleProducts = featured.slice(carouselIdx, carouselIdx + 4);

  return (
    <>
      {/* HERO — banner oficial */}
      <section className="hero-banner">
        <img src="images/hero-banner.png" alt="Laboratório Sobral — há mais de 100 anos cuidando da saúde das famílias brasileiras" />
      </section>

      {/* MARCAS / LINHAS */}
      <section className="container" style={{marginTop: 60}}>
        <h2 className="section-heading">Nossas Linhas</h2>
        <div className="brands-grid">
          {brands.map((b, i) => (
            <div key={i} className="brand-card" onClick={() => onNavigate('produtos')}>
              <div className="brand-img-wrap">
                <img src={b.img} alt={b.label} />
              </div>
              <div className="brand-label">{b.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUTOS MAIS VENDIDOS */}
      <section className="container" style={{marginTop: 70}}>
        <h2 className="section-heading">Produtos mais vendidos</h2>
        <div style={{position: 'relative'}}>
          <button className="carousel-arrow prev"
                  onClick={() => setCarouselIdx(Math.max(0, carouselIdx - 1))}
                  disabled={carouselIdx === 0}>‹</button>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 18, padding: '0 20px'}}>
            {visibleProducts.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => onNavigate('produto', p)} />
            ))}
          </div>
          <button className="carousel-arrow next"
                  onClick={() => setCarouselIdx(Math.min(featured.length - 4, carouselIdx + 1))}
                  disabled={carouselIdx >= featured.length - 4}>›</button>
        </div>
      </section>

      {/* HISTÓRIA */}
      <section className="container" style={{marginTop: 80}}>
        <div style={{display:'grid', gridTemplateColumns: '1.1fr 1fr', gap: 48, alignItems: 'center'}}>
          <div>
            <div className="title-with-rule">
              <h2>
                Conheça a história do
                <span className="accent">Laboratório Sobral</span>
              </h2>
              <div className="rule"></div>
            </div>
            <p style={{fontSize:15.5, lineHeight:1.7, color:'var(--ink-light)', marginBottom: 28}}>
              Há mais de 100 anos, o Laboratório Sobral faz parte
              da vida dos brasileiros. Estamos nas casas das famílias
              levando mais saúde e proporcionando leveza e
              bem-estar ao dia a dia. Mais que uma indústria,
              somos um símbolo da luta do povo brasileiro.
              Essa é nossa essência e isso nunca vai mudar.
            </p>
            <button className="btn btn-primary" onClick={() => onNavigate('quem-somos')}>
              VEJA MAIS
            </button>
          </div>
          <div className="fachada-frame">
            <img src="images/fachada.png" alt="Fachada do Laboratório Sobral"/>
          </div>
        </div>
      </section>
    </>
  );
}

window.HomePage = HomePage;
