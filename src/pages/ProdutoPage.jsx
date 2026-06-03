import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import Breadcrumb from '../components/Breadcrumb';
import ProductCard from '../components/ProductCard';

const safe = (html) => html ? parse(DOMPurify.sanitize(html)) : '—';
const stripTags = (html) => (html || '').replace(/<[^>]*>/g, '');

export default function ProdutoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [openAccordion, setOpenAccordion] = useState('caracteristicas');
  const [product,       setProduct]       = useState(null);
  const [mainImage,     setMainImage]     = useState(null);
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
      .then(data => { if (data) { setProduct(data); setMainImage(null); } })
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
        : <div className="[&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">{safe(p.description)}</div>,
    },
    { id: 'apresentacao', title: 'Apresentação', render: <div className="[&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">{safe(p.apresentacao)}</div> },
    {
      id: 'modouso',
      title: 'Modo de Uso',
      render: (
        <div>
          <div className="[&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">{safe(p.modo_uso)}</div>
          {p.category_id === 'oleos' && (
            <a
              href={`/misturinhas?oleo=${p.id}`}
              className="inline-flex items-center gap-1.5 text-[13px] font-[700] text-orange hover:underline mt-4"
            >
              <span>✦</span> Ver receitas com este óleo
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>{p.name} | Laboratório Sobral</title>
        <meta name="description" content={p.description ? stripTags(p.description).slice(0, 155) : `Conheça ${p.name}, produto do Laboratório Sobral.`} />
        <meta property="og:title" content={`${p.name} | Laboratório Sobral`} />
        <meta property="og:description" content={p.description ? stripTags(p.description).slice(0, 155) : `Conheça ${p.name}, produto do Laboratório Sobral.`} />
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
              {(mainImage || p.image)
                ? <img src={mainImage || p.image} alt={p.name} className="max-w-full max-h-full object-contain" />
                : <span className="text-[11px] text-muted font-mono text-center">[ foto: {p.name} ]</span>
              }
            </div>
            {p.image && Array.isArray(p.gallery) && p.gallery.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {[p.image, ...p.gallery].map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImage(url)}
                    className={`w-14 h-14 rounded border-2 overflow-hidden bg-white flex-shrink-0 transition-colors ${
                      (mainImage || p.image) === url ? 'border-orange' : 'border-line hover:border-orange'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-[28px] md:text-[36px] font-sans font-[800] mb-[14px] text-orange">{p.name}</h1>
            <div className="text-[15px] leading-[1.6] text-ink-light mb-7 whitespace-pre-wrap [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">{safe(p.description)}</div>

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
