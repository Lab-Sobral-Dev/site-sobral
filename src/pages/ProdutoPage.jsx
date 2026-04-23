import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CATALOG } from '../data/catalog';
import Breadcrumb from '../components/Breadcrumb';

export default function ProdutoPage() {
  const { id } = useParams();
  const [openAccordion, setOpenAccordion] = useState('caracteristicas');
  const [variant, setVariant] = useState(0);

  const p = CATALOG.find(x => x.id === id) || CATALOG[0];

  const accordionData = [
    { id: 'caracteristicas', title: 'Características do produto', content: p.caracteristicas?.join(' ') || p.description },
    { id: 'apresentacao',    title: 'Apresentação',               content: p.apresentacao || '—' },
    { id: 'modouso',         title: 'Modo de Uso',                content: p.modoUso || '—' },
    { id: 'precaucoes',      title: 'Precauções',                 content: p.precaucoes || '—' },
  ];

  return (
    <>
      <Breadcrumb trail={[
        { label: '🏠 Home', to: '/' },
        { label: 'Produtos', to: '/produtos' },
        { label: p.name },
      ]} />

      <section className="max-w-content mx-auto px-10 mt-11">
        <div className="grid grid-cols-[1fr_1.1fr] gap-16 items-start">
          {/* Galeria */}
          <div>
            <div className="aspect-square bg-white border border-line rounded flex items-center justify-center overflow-hidden p-[30px]">
              {p.image
                ? <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" />
                : <span className="text-[11px] text-muted font-mono text-center">[ foto: {p.name} ]</span>
              }
            </div>
            <div className="flex gap-[14px] mt-[18px] justify-center">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  onClick={() => setVariant(i)}
                  className={`w-[72px] h-[72px] bg-white rounded-[8px] flex items-center justify-center cursor-pointer p-1.5 ${variant === i ? 'border-2 border-orange' : 'border border-line'}`}
                >
                  {p.image
                    ? <img src={p.image} alt="" className="max-w-full max-h-full object-contain" />
                    : <span className="text-[10px] text-[#bbb] font-mono">angle {i + 1}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <h1 className="text-[36px] font-bold mb-[14px] text-ink-light">{p.name}</h1>
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
                    <div className="pb-4 text-[14px] text-ink-light leading-[1.6]">{item.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ingredientes + Nutricional */}
      <section className="bg-gradient-to-b from-[#C5D11E] to-[#A8B410] text-white mt-[60px] py-12 px-10">
        <div className="max-w-content mx-auto grid grid-cols-2 gap-12">
          <div>
            <h2 className="text-[26px] font-[800] text-center mb-[22px] text-white">Ingredientes</h2>
            <p className="text-[13.5px] leading-[1.65] mb-[18px]">{p.ingredientes || 'Informações não disponíveis para este produto.'}</p>
            {p.disclaimer && <p className="text-[13.5px] leading-[1.65] font-bold">{p.disclaimer}</p>}
          </div>
          {p.nutri ? (
            <div className="border-l border-white/30 pl-12">
              <h2 className="text-[26px] font-[800] text-center mb-[22px] text-white">Informação nutricional</h2>
              <pre className="font-sans text-[13.5px] m-0 whitespace-pre-wrap mb-[14px]">{p.nutri.porcoes}</pre>
              <table className="w-full border-collapse text-[13.5px]">
                <thead>
                  <tr className="border-b border-white/40">
                    <th className="text-left"></th>
                    <th className="text-right py-1.5 font-bold">15 ml</th>
                    <th className="text-right py-1.5 font-bold">%VD*</th>
                  </tr>
                </thead>
                <tbody>
                  {p.nutri.rows.map((r, i) => (
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
            <div className="border-l border-white/30 pl-12 flex items-center justify-center text-white/70 text-[14px]">
              Informações nutricionais não disponíveis para este produto.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
