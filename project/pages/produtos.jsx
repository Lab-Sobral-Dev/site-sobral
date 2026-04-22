/* ============ Página: Produtos (catálogo com filtro + busca) ============ */

function ProdutosPage({ products, onNavigate }) {
  const [page, setPage] = React.useState(1);
  const [cat, setCat] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const perPage = 12;

  const filtered = React.useMemo(() => {
    let list = products;
    if (cat !== 'all') list = list.filter(p => p.category === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, cat, query]);

  React.useEffect(() => { setPage(1); }, [cat, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <>
      <SectionTitleBar>Produtos</SectionTitleBar>

      <section className="container" style={{marginTop: 36}}>
        {/* Banner com logo e chamada */}
        <div className="produtos-banner">
          <div>
            <h2 style={{fontSize: 30, fontWeight: 800, color: 'white', marginBottom: 6}}>
              Todo o catálogo Sobral
            </h2>
            <p style={{fontSize: 15, opacity: .95, margin: 0, maxWidth: 520}}>
              Suplementos, tradicionais, óleos e cosméticos — toda nossa linha em um só lugar.
            </p>
          </div>
          <img src="images/logo.png" alt="" style={{width: 110, height: 110, borderRadius: '50%'}}/>
        </div>

        {/* Toolbar: filtros + busca */}
        <div className="catalog-toolbar">
          <div className="catalog-filters">
            {CATEGORIES.map(c => (
              <button key={c.id}
                      className={`cat-pill ${cat === c.id ? 'active' : ''}`}
                      onClick={() => setCat(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="catalog-search">
            <SearchIcon />
            <input type="text" placeholder="Buscar produto..."
                   value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        <div style={{fontSize: 13, color:'var(--ink-light)', marginBottom: 18}}>
          {filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
        </div>

        {pageItems.length === 0 ? (
          <div style={{padding: 60, textAlign:'center', color:'var(--muted)', fontSize: 15}}>
            Nenhum produto encontrado com estes filtros.
          </div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 20}}>
            {pageItems.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => onNavigate('produto', p)} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({length: totalPages}, (_, i) => i + 1).map(n => (
              <button key={n} className={page === n ? 'active' : ''} onClick={() => setPage(n)}>
                {n}
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

window.ProdutosPage = ProdutosPage;
