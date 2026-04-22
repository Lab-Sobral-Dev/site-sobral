/* ============ App principal ============ */

function App() {
  const [page, setPage] = React.useState(() => {
    try { return localStorage.getItem('sobral-page') || 'home'; } catch(e) { return 'home'; }
  });
  const [currentProduct, setCurrentProduct] = React.useState(null);

  React.useEffect(() => {
    try { localStorage.setItem('sobral-page', page); } catch(e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const navigate = (newPage, data) => {
    if (newPage === 'produto' && data) setCurrentProduct(data);
    setPage(newPage);
  };

  const PRODUCTS = window.CATALOG || [];

  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage onNavigate={navigate} products={PRODUCTS} />;
      case 'quem-somos': return <QuemSomosPage />;
      case 'produtos': return <ProdutosPage products={PRODUCTS} onNavigate={navigate} />;
      case 'produto': return <ProdutoPage product={currentProduct} onNavigate={navigate} />;
      case 'medicamentos': return <MedicamentosPage />;
      case 'fale-conosco': return <FaleConoscoPage onNavigate={navigate} />;
      case 'privacidade': return <PrivacidadePage />;
      default: return <HomePage onNavigate={navigate} products={PRODUCTS} />;
    }
  };

  return (
    <div data-screen-label={page}>
      <Header currentPage={page} onNavigate={navigate} />
      <main>{renderPage()}</main>
      <Footer onNavigate={navigate} />
      <Tweaks />
    </div>
  );
}

/* ================== Tweaks ================== */
const DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "orange-classic",
  "typography": "nunito",
  "productCardStyle": "pill-outline",
  "heroVariant": "split"
}/*EDITMODE-END*/;

function Tweaks() {
  const [visible, setVisible] = React.useState(false);
  const [config, setConfig] = React.useState(DEFAULTS);

  React.useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === '__activate_edit_mode') setVisible(true);
      if (e.data?.type === '__deactivate_edit_mode') setVisible(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    // Theme
    if (config.theme === 'orange-classic') {
      root.style.setProperty('--orange', '#F37021');
      root.style.setProperty('--orange-dark', '#E0580A');
      root.style.setProperty('--orange-light', '#F89B4D');
      root.style.setProperty('--orange-50', '#FFF4EB');
    } else if (config.theme === 'deep-clinical') {
      root.style.setProperty('--orange', '#0E6DAA');
      root.style.setProperty('--orange-dark', '#084E80');
      root.style.setProperty('--orange-light', '#3E9AD2');
      root.style.setProperty('--orange-50', '#EBF4FA');
    } else if (config.theme === 'nature-green') {
      root.style.setProperty('--orange', '#2E8540');
      root.style.setProperty('--orange-dark', '#1F5E2C');
      root.style.setProperty('--orange-light', '#5AAE6B');
      root.style.setProperty('--orange-50', '#EBF5ED');
    }

    // Typography
    if (config.typography === 'nunito') {
      document.body.style.fontFamily = "'Nunito', system-ui, sans-serif";
    } else if (config.typography === 'serif') {
      document.body.style.fontFamily = "'Source Serif 4', Georgia, serif";
    } else if (config.typography === 'dm-sans') {
      document.body.style.fontFamily = "'DM Sans', system-ui, sans-serif";
    }

    // Product card style
    document.body.dataset.cardStyle = config.productCardStyle;
    document.body.dataset.heroVariant = config.heroVariant;
  }, [config]);

  const set = (key, val) => {
    const next = { ...config, [key]: val };
    setConfig(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
  };

  if (!visible) return null;

  return (
    <div className="tweaks-panel">
      <h5>Tweaks</h5>
      <div className="tweak-row">
        <label>Paleta</label>
        <select value={config.theme} onChange={(e) => set('theme', e.target.value)}>
          <option value="orange-classic">Laranja clássico</option>
          <option value="deep-clinical">Azul clínico</option>
          <option value="nature-green">Verde natural</option>
        </select>
      </div>
      <div className="tweak-row">
        <label>Tipografia</label>
        <select value={config.typography} onChange={(e) => set('typography', e.target.value)}>
          <option value="nunito">Nunito (atual)</option>
          <option value="dm-sans">DM Sans (geométrica)</option>
          <option value="serif">Serifada (sofisticada)</option>
        </select>
      </div>
      <div className="tweak-row">
        <label>Card do produto</label>
        <select value={config.productCardStyle} onChange={(e) => set('productCardStyle', e.target.value)}>
          <option value="pill-outline">Pílula laranja (atual)</option>
          <option value="filled">Botão sólido</option>
          <option value="minimal">Minimalista</option>
        </select>
      </div>
      <div className="tweak-row">
        <label>Hero</label>
        <select value={config.heroVariant} onChange={(e) => set('heroVariant', e.target.value)}>
          <option value="split">Split laranja (atual)</option>
          <option value="bold">Gradiente amplo</option>
          <option value="clean">Clean minimalista</option>
        </select>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
