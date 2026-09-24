import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';

function ChevronIcon({ dir = 'left' }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={dir === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  );
}

const GUIA_OLEOS = [
  { id:'oleo-alecrim',        nome:'Óleo de Alecrim',        tag:'Fortalecimento capilar' },
  { id:'oleo-uva',            nome:'Óleo de Semente de Uva', tag:'Peles acneicas, cicatrizes' },
  { id:'oleo-coco',           nome:'Óleo de Coco',           tag:'Hidratação + demaquilante' },
  { id:'oleo-girassol',       nome:'Óleo de Girassol',       tag:'Vitamina E, elasticidade' },
  { id:'oleo-amendoas',       nome:'Óleo de Amêndoas Doce',  tag:'Estrias e ressecamento' },
  { id:'oleo-ricino',         nome:'Óleo de Rícino',         tag:'Umectação capilar' },
  { id:'rosa-mosqueta-gotas', nome:'Óleo de Rosa Mosqueta',  tag:'Antienvelhecimento' },
  { id:'oleo-copaiba',        nome:'Óleo de Copaíba',        tag:'Cicatrizes e manchas' },
  { id:'oleo-babosa',         nome:'Óleo de Babosa',         tag:'Couro cabeludo, sol' },
  { id:'oleo-abacate',        nome:'Óleo de Abacate',        tag:'Couro cabeludo + pele' },
  { id:'oleo-argan',          nome:'Óleo de Argan',          tag:'Anti-friz, circulação' },
  { id:'glicerina',           nome:'Glicerina Sobral',       tag:'Hidratante universal' },
];

export default function MisturinhasPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oleoParam = searchParams.get('oleo');

  const [misturinhas,  setMisturinhas]  = useState([]);
  const [loadingMix,   setLoadingMix]   = useState(true);
  const [tab,          setTab]          = useState('');
  const [idx,          setIdx]          = useState(0);
  const [productMap,   setProductMap]   = useState({});

  // Busca misturinhas da API
  useEffect(() => {
    setLoadingMix(true);
    fetch('/api/misturinhas')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setMisturinhas(list);
        // Define tab inicial
        const cats = [...new Set(list.map(m => m.categoria))].sort();
        if (cats.length) setTab(prev => prev || cats[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingMix(false));
  }, []);

  // Deep link: ?oleo=X → abre diretamente a misturinha com esse ingrediente
  useEffect(() => {
    if (!oleoParam || !misturinhas.length) return;
    const found = misturinhas.find(m =>
      Array.isArray(m.ingredientes) &&
      m.ingredientes.some(i => i.product_id === oleoParam)
    );
    if (!found) return;
    const cats   = [...new Set(misturinhas.map(m => m.categoria))].sort();
    const byTab  = misturinhas.filter(m => m.categoria === found.categoria);
    const tabIdx = byTab.findIndex(m => m.id === found.id);
    setTab(found.categoria);
    setIdx(Math.max(0, tabIdx));
  }, [oleoParam, misturinhas]);

  // Reset idx ao trocar de tab
  useEffect(() => { setIdx(0); }, [tab]);

  // Categorias únicas ordenadas
  const categories = useMemo(() =>
    [...new Set(misturinhas.map(m => m.categoria))].sort(),
  [misturinhas]);

  // Lista da tab atual
  const list = useMemo(() =>
    misturinhas.filter(m => m.categoria === tab),
  [misturinhas, tab]);

  const current = list[idx] || null;

  const next = () => setIdx(i => (i + 1) % list.length);
  const prev = () => setIdx(i => (i - 1 + list.length) % list.length);

  // Carrega imagens dos produtos
  const allIds = useMemo(() => {
    const ids = new Set();
    misturinhas.forEach(m => (Array.isArray(m.ingredientes) ? m.ingredientes : []).forEach(i => ids.add(i.product_id)));
    GUIA_OLEOS.forEach(o => ids.add(o.id));
    return [...ids].filter(Boolean);
  }, [misturinhas]);

  useEffect(() => {
    if (!allIds.length) return;
    fetch(`/api/products?ids=${allIds.join(',')}&per_page=50`)
      .then(r => r.json())
      .then(json => {
        const map = {};
        (json.data || []).forEach(p => { map[p.id] = p; });
        setProductMap(map);
      })
      .catch(() => {});
  }, [allIds]);

  const findP = (id) => productMap[id];

  const refHero     = useScrollReveal();
  const refCarrosel = useScrollReveal();
  const refGuia     = useScrollReveal();
  const refCta      = useScrollReveal();

  return (
    <>
      {/* HERO */}
      <section
        ref={refHero}
        className="reveal bg-[#FAF5EC] flex flex-col items-center text-center px-8 py-12 lg:px-20 lg:py-[60px] relative overflow-hidden gap-9"
      >
        <div className="absolute -bottom-[100px] -left-[60px] w-[280px] h-[280px] rounded-full border-[14px] border-orange/10 pointer-events-none" />

        <div className="relative flex flex-col items-center max-w-[700px]">
          <h1 className="font-display text-[48px] lg:text-[72px] font-[900] leading-[.95] mb-6 text-ink tracking-[-2px]">
            Misturinhas<br/>
            <em className="text-orange not-italic-only italic font-[700]">que mudam tudo.</em>
          </h1>
          <p className="text-[18px] leading-[1.55] text-ink-light max-w-[480px]">
            Combinações dos <strong className="text-ink font-[800]">Óleos Sobral</strong> para turbinar sua rotina de pele e cabelo.
            Use sozinhos ou misturados — sua beleza agradece.
          </p>
        </div>
      </section>

      {/* CARROSSEL */}
      <section ref={refCarrosel} className="reveal max-w-content mx-auto px-4 md:px-10 mt-[60px] mb-10">
        {loadingMix ? (
          <div className="py-16 text-center text-muted text-[15px]">Carregando misturinhas...</div>
        ) : misturinhas.length === 0 ? (
          <div className="py-16 text-center text-muted text-[15px]">Nenhuma misturinha cadastrada.</div>
        ) : (
          <>
            {/* Abas de categoria — divisórias de pasta */}
            <div className="flex gap-1 justify-center">
              {categories.map(cat => {
                const count = misturinhas.filter(m => m.categoria === cat).length;
                const active = tab === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setTab(cat)}
                    className={`font-display font-[800] text-[14px] px-6 sm:px-8 pt-3.5 pb-4 rounded-t-[10px] transition-colors relative z-10
                      ${active ? 'bg-[#FFFDF9] text-ink shadow-[0_-2px_10px_rgba(0,0,0,.05)]' : 'bg-[#EAEAEA] text-muted hover:text-ink'}`}
                  >
                    <span className="capitalize">{cat}</span>
                    <span className="block text-[10px] font-semibold opacity-60 mt-0.5">{count} ficha{count !== 1 ? 's' : ''}</span>
                  </button>
                );
              })}
            </div>

            {/* Ficha da receita */}
            {current && (
              <div className="relative">
                <button onClick={prev} aria-label="Anterior"
                  className="absolute top-1/2 -translate-y-1/2 -left-[19px] w-[42px] h-[42px] rounded-full border-none bg-white shadow-[0_6px_18px_rgba(0,0,0,.14)] text-orange z-20 transition-all grid place-items-center hover:bg-orange hover:text-white hover:scale-110"><ChevronIcon dir="left" /></button>
                <button onClick={next} aria-label="Próxima"
                  className="absolute top-1/2 -translate-y-1/2 -right-[19px] w-[42px] h-[42px] rounded-full border-none bg-white shadow-[0_6px_18px_rgba(0,0,0,.14)] text-orange z-20 transition-all grid place-items-center hover:bg-orange hover:text-white hover:scale-110"><ChevronIcon dir="right" /></button>

                <div className="bg-[#FFFDF9] rounded-tr-[18px] rounded-b-[18px] shadow-[0_10px_36px_rgba(61,61,61,.1)] pl-8 pr-7 py-8 sm:pl-10 sm:pr-9 lg:pl-14 lg:pr-14 lg:py-12 relative overflow-hidden min-h-[440px]">
                <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-orange" />

                <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3.5 mb-7">
                  <div className="font-display text-[11px] sm:text-[12px] font-[800] text-orange tracking-[.4px] whitespace-nowrap overflow-hidden text-ellipsis">
                    FICHA <span className="text-[16px]">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="opacity-50 mx-1">/</span>
                    {String(list.length).padStart(2, '0')}
                    <span className="mx-2 opacity-30">·</span>
                    <span className="capitalize">{tab}</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {list.map((_, i) => (
                      <button
                        key={i}
                        aria-label={`Ir para ${i + 1}`}
                        onClick={() => setIdx(i)}
                        className={`h-[5px] rounded-full border-none transition-all p-0 cursor-pointer
                          ${i === idx ? 'bg-orange w-4' : 'bg-line w-[5px] hover:bg-orange/40'}`}
                      />
                    ))}
                  </div>
                </div>

                <div
                  key={`${tab}-${idx}`}
                  className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.4fr] gap-9 lg:gap-12 items-start relative z-[1] animate-[m2FadeIn_.45s_ease]"
                >
                  {/* Frascos sobre a régua de medidas */}
                  <div className="relative pt-2">
                    <div
                      className="absolute left-4 right-4 top-[74px] h-px pointer-events-none"
                      style={{ backgroundImage: 'repeating-linear-gradient(90deg,#D8D8D8 0 4px,transparent 4px 8px)' }}
                    />
                    <div className="flex justify-around items-start flex-wrap gap-x-2 gap-y-6 relative">
                      {(Array.isArray(current.ingredientes) ? current.ingredientes : []).map((ing, i) => {
                        const p = findP(ing.product_id);
                        return (
                          <div
                            key={i}
                            onClick={() => p && navigate(`/produtos/${p.id}`)}
                            style={{ animationDelay: `${i * 80}ms` }}
                            className="flex flex-col items-center cursor-pointer transition-transform w-[84px] animate-[m2BottleIn_.5s_ease_both] hover:-translate-y-1.5"
                          >
                            <div className="w-[72px] h-[96px] bg-white rounded-[10px] grid place-items-center shadow-[0_4px_14px_rgba(0,0,0,.08)] p-2.5 mb-2">
                              {p?.image && <img src={p.image} alt={ing.nome} className="max-w-full max-h-full object-contain" />}
                            </div>
                            <div className="text-[11px] font-[800] text-orange mb-1 tracking-[.2px]">{ing.qty}</div>
                            <div className="text-[11.5px] font-bold text-ink text-center leading-tight text-balance">{ing.nome}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Texto */}
                  <div>
                    <h2 className="font-display text-[28px] lg:text-[38px] font-[900] leading-[1.05] mb-6 text-ink tracking-[-.5px] text-balance">
                      {current.titulo}
                    </h2>

                    <div className="mb-5">
                      <div className="text-[10.5px] tracking-[1.5px] font-[800] text-[#B45A18] mb-1.5">MODO DE PREPARO</div>
                      <p className="text-[15px] leading-[1.6] text-ink-light m-0">{current.aplicacao}</p>
                    </div>

                    <div className="bg-orange-50 rounded-[10px] px-4 py-3.5">
                      <p className="text-[14px] leading-[1.5] text-ink m-0 font-[800]">{current.resultado}</p>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* GUIA */}
      <section ref={refGuia} className="reveal max-w-content mx-auto px-4 md:px-10 mt-10">
        <div className="text-center mb-8">
          <h2 className="font-display text-[38px] font-[900] tracking-[-.5px] m-0 mb-2">12 óleos. Uma rotina.</h2>
          <p className="text-[15px] text-ink-light m-0">Conheça rapidamente para que serve cada óleo da linha Sobral.</p>
        </div>
        <div className="bg-[#FFFDF9] rounded-[14px] overflow-hidden shadow-[0_4px_20px_rgba(61,61,61,.06)]">
          {GUIA_OLEOS.map((o, i) => {
            const p = findP(o.id);
            return (
              <div
                key={o.id}
                onClick={() => p && navigate(`/produtos/${p.id}`)}
                className={`grid grid-cols-[28px_48px_1fr] sm:grid-cols-[36px_56px_1fr_auto] items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 cursor-pointer transition-colors border-b border-[#EFEFEF] last:border-b-0 hover:bg-orange-50
                  ${i % 2 === 1 ? 'bg-[#FCFAF6]' : ''}`}
              >
                <div className="font-display text-[11px] font-[800] text-[#D8A876]">{String(i + 1).padStart(2, '0')}</div>
                <div className="w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] bg-orange-50 rounded-lg overflow-hidden flex items-center justify-center p-1.5 flex-shrink-0">
                  {p?.image && <img src={p.image} alt={o.nome} className="w-full h-full object-contain" />}
                </div>
                <div className="min-w-0">
                  <div className="font-[800] text-[13.5px] text-ink truncate">{o.nome}</div>
                  <div className="text-[11.5px] text-ink-light leading-tight truncate sm:hidden">{o.tag}</div>
                </div>
                <div className="hidden sm:block text-[12.5px] text-ink-light text-right whitespace-nowrap">{o.tag}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section ref={refCta} className="reveal max-w-content mx-auto px-4 md:px-10 mt-[60px] mb-[60px]">
        <div className="bg-gradient-to-r from-[#F89B4D] via-orange to-[#E0580A] rounded-[28px] p-10 lg:px-16 lg:py-14 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 items-center text-white shadow-[0_12px_32px_rgba(232,90,12,.28)] relative overflow-hidden">
          <div className="absolute -top-[80px] right-[40%] w-[280px] h-[280px] rounded-full bg-white/10 pointer-events-none" />
          <div className="relative z-[1]">
            <div className="text-[12px] tracking-[3px] font-[900] opacity-90 mb-3.5">SUA RECEITA · NOSSO INSTAGRAM</div>
            <h2 className="font-display text-[36px] lg:text-[46px] font-[900] leading-[1.05] m-0 mb-4 tracking-[-1px]">
              Faça a sua e marque<br/><em className="italic">@labsobral</em>
            </h2>
            <p className="text-[16px] leading-[1.55] opacity-95 max-w-[460px] m-0">
              Mostre suas combinações no Instagram — quem sabe sua receita não vira a próxima dica oficial.
            </p>
            <div className="flex gap-3 flex-wrap mt-6">
              <a href="https://instagram.com/labsobral" target="_blank" rel="noreferrer"
                 className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white text-orange font-[900] text-[14px] tracking-[.3px] transition-all hover:-translate-y-px hover:shadow-lg">
                @labsobral no Instagram
              </a>
            </div>
          </div>
          <div className="relative z-[1] rounded-[20px] overflow-hidden aspect-[3/4] shadow-[0_12px_32px_rgba(0,0,0,.18)] max-h-[320px] lg:max-h-none bg-[#F37021]">
            <img src="/images/misturinhas-hero-panel.png" alt="" className="w-full h-full object-contain block" />
          </div>
        </div>
      </section>

      <style>{`
        @keyframes m2FadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes m2BottleIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
