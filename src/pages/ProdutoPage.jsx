import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Breadcrumb from '../components/Breadcrumb';
import ProductCard from '../components/ProductCard';

export default function ProdutoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [openAccordion, setOpenAccordion] = useState('caracteristicas');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setOpenAccordion('caracteristicas');
    fetch(`/api/products/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setProduct(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetch('/api/products?per_page=5')
      .then(r => r.json())
      .then(json => {
        if (Array.isArray(json.data)) {
          setRelated(json.data.filter(p => p.id !== id).slice(0, 4));
        }
      })
      .catch(() => {});
  }, [id]);

  if (loading) {
    return <div className="py-[80px] text-center text-muted text-[15px]">Carregando produto...</div>;
  }

  if (notFound || !product) {
    return (
      <div className="py-[80px] text-center">
        <p className="text-muted text-[15px] mb-4">Produto não encontrado.</p>
        <button onClick={() => navigate('/produtos')} className="text-orange font-bold text-[14px] underline">
          Ver todos os produtos
        </button>
      </div>
    );
  }

  const p = product;

  const accordionData = [
    {
      id: 'caracteristicas',
      title: 'Características do produto',
      render: Array.isArray(p.caracteristicas) && p.caracteristicas.length
        ? (
            <ul className="list-disc list-inside space-y-1">
              {p.caracteristicas.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          )
        : <span className="whitespace-pre-wrap">{p.description}</span>,
    },
    { id: 'apresentacao', title: 'Apresentação', render: <span className="whitespace-pre-wrap">{p.apresentacao || '—'}</span> },
    { id: 'modouso',      title: 'Modo de Uso',  render: <span className="whitespace-pre-wrap">{p.modo_uso    || '—'}</span> },
  ];

  return (
    <>
      <Helmet>
        <title>{p.name} | Laboratório Sobral</title>
        <meta name="description" content={p.description ? p.description.slice(0, 155) : `Conheça ${p.name}, produto do Laboratório Sobral.`} />
        <meta property="og:title" content={`${p.name} | Laboratório Sobral`} />
        <meta property="og:description" content={p.description ? p.description.slice(0, 155) : `Conheça ${p.name}, produto do Laboratório Sobral.`} />
        {p.image && <meta property="og:image" content={p.image} />}
        <meta property="og:type" content="product" />
      </Helmet>
      <Breadcrumb trail={[
        { label: 'Home', to: '/' },
        { label: 'Produtos', to: '/produtos' },
        { label: p.name },
      ]} />

      <section className="max-w-content mx-auto px-4 md:px-10 mt-8 md:mt-11">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-8 md:gap-16 items-start">
          {/* Galeria */}
          <div>
            <div className="aspect-square bg-white border border-line rounded flex items-center justify-center overflow-hidden p-[30px]">
              {p.image
                ? <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" />
                : <span className="text-[11px] text-muted font-mono text-center">[ foto: {p.name} ]</span>
              }
            </div>
          </div>

          {/* Info */}
          <div>
            <h1 className="text-[28px] md:text-[36px] font-bold mb-[14px] text-ink-light">{p.name}</h1>
            <p className="text-[15px] leading-[1.6] text-ink-light mb-7 whitespace-pre-wrap">{p.description}</p>

            <div>
              {accordionData.map(item => (
                <div key={item.id} className={`accordion-item border-b border-line ${openAccordion === item.id ? 'open' : ''}`}>
                  <button
                    className="flex justify-between items-center w-full py-[14px] bg-transparent border-none text-left font-bold text-[15px] text-ink cursor-pointer"
                    onClick={() => setOpenAccordion(openAccordion === item.id ? null : item.id)}
                  >
                    {item.title}
                    <span className="arrow text-orange text-[18px]">▾</span>
                  </button>
                  <div className="accordion-content">
                    <div className="pb-4 text-[14px] text-ink-light leading-[1.6]">{item.render}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="max-w-content mx-auto px-4 md:px-10 mt-[60px] mb-16">
          <h2 className="font-display text-[24px] md:text-[30px] font-[900] tracking-[-.3px] mb-7">
            Outros Produtos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[18px]">
            {related.map(prod => (
              <ProductCard
                key={prod.id}
                product={prod}
                onClick={() => navigate(`/produtos/${prod.id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
