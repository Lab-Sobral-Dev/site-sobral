import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Breadcrumb from '../components/Breadcrumb';

export default function ProdutoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [openAccordion, setOpenAccordion] = useState('caracteristicas');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  const nutriUnidade = (() => {
    if (!p.nutri_porcoes) return '—';
    const match = p.nutri_porcoes.match(/Porção:\s*([^\n(]+)/i);
    return match ? match[1].trim() : p.nutri_porcoes.split('\n')[0];
  })();

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
        : <span>{p.description}</span>,
    },
    { id: 'apresentacao', title: 'Apresentação', render: <span>{p.apresentacao || '—'}</span> },
    { id: 'modouso',      title: 'Modo de Uso',  render: <span>{p.modo_uso    || '—'}</span> },
    { id: 'precaucoes',   title: 'Precauções',   render: <span>{p.precaucoes  || '—'}</span> },
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
            <p className="text-[15px] leading-[1.6] text-ink-light mb-7">{p.description}</p>

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

      {/* Ingredientes + Nutricional */}
      <section className="bg-gradient-to-b from-[#C5D11E] to-[#A8B410] text-white mt-[60px] py-10 md:py-12 px-4 md:px-10">
        <div className="max-w-content mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
          <div>
            <h2 className="text-[24px] md:text-[26px] font-[800] text-center mb-[22px] text-white">Ingredientes</h2>
            <p className="text-[13.5px] leading-[1.65] mb-[18px]">{p.ingredientes || 'Informações não disponíveis para este produto.'}</p>
            {p.disclaimer && <p className="text-[13.5px] leading-[1.65] font-bold">{p.disclaimer}</p>}
          </div>
          {p.nutri_rows ? (
            <div className="md:border-l border-white/30 md:pl-12 pt-8 md:pt-0 border-t md:border-t-0">
              <h2 className="text-[26px] font-[800] text-center mb-[22px] text-white">Informação nutricional</h2>
              {p.nutri_porcoes && <pre className="font-sans text-[13.5px] m-0 whitespace-pre-wrap mb-[14px]">{p.nutri_porcoes}</pre>}
              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr className="border-b border-white/40">
                    <th className="text-left"></th>
                    <th className="text-right py-1.5 font-bold">{nutriUnidade}</th>
                    <th className="text-right py-1.5 font-bold">%VD*</th>
                  </tr>
                </thead>
                <tbody>
                  {p.nutri_rows.map((r, i) => (
                    <tr key={i} className="border-b border-white/20">
                      <td className="py-2">{r[0]}</td>
                      <td className="text-right">{r[1]}</td>
                      <td className="text-right">{r[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[12px] mt-[14px] leading-[1.55]">
                Não contém quantidades significativas de açúcares totais, açúcares adicionados, proteínas, gorduras totais, gorduras saturadas, gorduras trans, fibras alimentares e sódio.
              </p>
              <p className="text-[11px] mt-2.5 italic">*Percentual de valores diários fornecidos pela porção.</p>
            </div>
          ) : (
            <div className="md:border-l border-white/30 md:pl-12 pt-8 md:pt-0 border-t md:border-t-0 flex items-center justify-center text-white/70 text-[14px]">
              Informações nutricionais não disponíveis para este produto.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
