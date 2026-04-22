/* ============ Componentes compartilhados ============ */

const LogoSVG = ({ size = 36 }) => (
  <img src="images/logo.png" alt="Laboratório Sobral" width={size} height={size}
       style={{width: size, height: size, objectFit: 'cover', borderRadius: '50%'}} />
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/>
    <line x1="21" y1="21" x2="16.5" y2="16.5"/>
  </svg>
);

const SocialIcon = ({ name }) => {
  const icons = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    youtube: 'Youtube',
    linkedin: 'LinkedIn',
    tiktok: 'Tiktok'
  };
  return <span>{icons[name] || name}</span>;
};

function Header({ currentPage, onNavigate }) {
  const [openDropdown, setOpenDropdown] = React.useState(null);
  const [query, setQuery] = React.useState('');

  const closeAll = () => setOpenDropdown(null);

  React.useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest('.nav-item')) closeAll();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const go = (page) => {
    onNavigate(page);
    closeAll();
  };

  const NavDropdown = ({ id, label, items }) => (
    <div className={`nav-item ${openDropdown === id ? 'open' : ''}`}
         onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === id ? null : id); }}>
      {label}
      <span className="caret"></span>
      <div className="nav-dropdown">
        {items.map((it) => (
          <a key={it.label} onClick={(e) => { e.stopPropagation(); go(it.page); }}>{it.label}</a>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="top-bar"></div>
      <header className="header">
        <div className="logo" onClick={() => go('home')} title="Laboratório Sobral"
             style={{background: 'transparent', boxShadow: 'none'}}>
          <LogoSVG size={56} />
        </div>
        <nav className="nav">
          <NavDropdown id="sobral" label="O Sobral" items={[
            { label: 'Quem Somos', page: 'quem-somos' },
            { label: 'Nossa História', page: 'quem-somos' },
            { label: 'Trabalhe Conosco', page: 'fale-conosco' },
          ]}/>
          <NavDropdown id="produtos" label="Produtos" items={[
            { label: 'Todos os produtos', page: 'produtos' },
            { label: 'Suplementos', page: 'produtos' },
            { label: 'Tradicionais', page: 'produtos' },
            { label: 'Cosméticos', page: 'produtos' },
            { label: 'Medicamentos (descontinuados)', page: 'medicamentos' },
          ]}/>
          <NavDropdown id="vendidos" label="Mais Vendidos" items={[
            { label: 'Aqualemã Sobral', page: 'produto' },
            { label: 'Calciolax Articule', page: 'produto' },
            { label: 'Saludar Ômega AZ', page: 'produto' },
            { label: 'Extrato de Própolis Verde', page: 'produto' },
          ]}/>
          <div className={`nav-item ${currentPage === 'fale-conosco' ? 'active' : ''}`}
               onClick={() => go('fale-conosco')}>
            Fale Conosco
          </div>
        </nav>
        <div className="search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Pesquisar produto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>
    </>
  );
}

function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="footer-logo" style={{border: 'none', background: 'white', padding: 0}}>
            <LogoSVG size={68} />
          </div>
          <div className="footer-address">
            Rua Bento Leão,<br/>
            25, Centro,<br/>
            Floriano–PI.
          </div>
        </div>
        <div>
          <h4>Redes sociais</h4>
          <ul>
            <li><a href="#">Facebook</a></li>
            <li><a href="#">Instagram</a></li>
            <li><a href="#">Youtube</a></li>
            <li><a href="#">LinkedIn</a></li>
            <li><a href="#">Tiktok</a></li>
          </ul>
        </div>
        <div>
          <h4>Institucional</h4>
          <ul>
            <li><a onClick={() => onNavigate('home')}>Home</a></li>
            <li><a onClick={() => onNavigate('quem-somos')}>Quem Somos</a></li>
            <li><a onClick={() => onNavigate('privacidade')}>Privacidade e Proteção de Dados</a></li>
            <li><a onClick={() => onNavigate('fale-conosco')}>Fale Conosco</a></li>
          </ul>
        </div>
        <div>
          <h4>Links Rápidos</h4>
          <ul>
            <li><a onClick={() => onNavigate('fale-conosco')}>Trabalhe Conosco</a></li>
            <li><a onClick={() => onNavigate('medicamentos')}>Medicamentos Sobral</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        Copyright © 2025 Laboratório Sobral. Todos os direitos reservados |
        <a onClick={() => onNavigate('privacidade')}> Política de Privacidade </a>|
        <a onClick={() => onNavigate('privacidade')}> Política de Cookies </a>
      </div>
    </footer>
  );
}

function ProductCard({ product, onClick, showButton = true }) {
  return (
    <div className="product-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
          <div className="product-img-frame">
            {product.image ? (
              <img src={product.image} alt={product.name} />
            ) : (
              <div className="placeholder-label">[ foto: {product.name} ]</div>
            )}
          </div>
      <div className="product-name">{product.name}</div>
      <div className="product-tag">{product.tag}</div>
      {showButton && (
        <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}>
          Saber Mais
        </button>
      )}
    </div>
  );
}

function SectionTitleBar({ children }) {
  return <div className="section-title-bar">{children}</div>;
}

function Breadcrumb({ trail, onNavigate }) {
  return (
    <div className="breadcrumb-bar">
      <div style={{maxWidth:'var(--content-w)', margin:'0 auto'}}>
        {trail.map((item, i) => (
          <React.Fragment key={i}>
            {item.page
              ? <a onClick={() => onNavigate(item.page)} style={{cursor:'pointer'}}>{item.label}</a>
              : <span>{item.label}</span>}
            {i < trail.length - 1 && <span className="sep">&gt;</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  LogoSVG, SearchIcon, Header, Footer, ProductCard, SectionTitleBar, Breadcrumb
});
