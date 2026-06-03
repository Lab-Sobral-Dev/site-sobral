import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';

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
          <div className="text-[12px] tracking-[3px] font-[900] text-orange mb-[18px]">FOLDER · ÓLEOS SOBRAL</div>
          <h1 className="font-display text-[48px] lg:text-[72px] font-[900] leading-[.95] mb-6 text-ink tracking-[-2px]">
            Misturinhas<br/>
            <em className="text-orange not-italic-only italic font-[700]">que mudam tudo.</em>
          </h1>
          <p className="text-[18px] leading-[1.55] text-ink-light max-w-[480px]">
            Combinações dos <strong className="text-ink font-[800]">Óleos Sobral</strong> para turbinar sua rotina de pele e cabelo.
            Use sozinhos ou misturados — sua beleza agradece.
          </p>
        </div>

        <div className="rounded-[24px] overflow-hidden shadow-[0_12px_40px_rgba(232,90,12,.22)] w-full max-w-[700px] aspect-[16/9]">
          <img
            src="/images/misturinhas-hero-panel.png"
            alt="Dicas de Misturinhas Óleos Sobral"
            className="w-full h-full object-cover block"
          />
        </div>
      </section>

      {/* CARROSSEL */}
      <section ref={refCarrosel} className="reveal max-w-content mx-auto px-10 mt-[60px] mb-10">
        {loadingMix ? (
          <div className="py-16 text-center text-muted text-[15px]">Carregando misturinhas...</div>
        ) : misturinhas.length === 0 ? (
          <div className="py-16 text-center text-muted text-[15px]">Nenhuma misturinha cadastrada.</div>
        ) : (
          <>
            {/* Tabs dinâmicas */}
            <div className="flex gap-3 justify-center mb-9 flex-wrap">
              {categories.map(cat => {
                const count = misturinhas.filter(m => m.categoria === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setTab(cat)}
                    className={`border-2 rounded-full px-6 py-3 flex items-center gap-2 transition-all font-sans text-left
                      ${tab === cat ? 'border-orange !text-white shadow-[0_4px_14px_rgba(232,90,12,.3)]' : 'border-line text-ink hover:border-orange hover:text-orange'}`}
                    style={tab === cat ? { background: 'var(--orange)', color: 'white' } : {}}
                  >
                    <div>
                      <div className="font-[900] text-[16px] leading-none mb-0.5 capitalize">{cat}</div>
                      <div className="text-[11px] opacity-80 font-semibold">{count} misturinha{count !== 1 ? 's' : ''}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Recipe stage */}
            {current && (
              <div className="relative">
                <div className="bg-gradient-to-br from-[#FAF5EC] to-orange-50 rounded-[28px] p-8 lg:px-20 lg:py-14 relative overflow-hidden min-h-[460px]">
                  <div className="absolute -top-[120px] -right-[120px] w-[320px] h-[320px] rounded-full bg-orange opacity-[.07] pointer-events-none" />
                  <div className="absolute -bottom-[80px] -left-[80px] w-[220px] h-[220px] rounded-full border-[10px] border-orange/10 pointer-events-none" />

                  <button onClick={prev} aria-label="Anterior"
                    className="absolute top-1/2 -translate-y-1/2 left-2 lg:left-6 w-[52px] h-[52px] rounded-full border-none bg-white shadow-[0_6px_18px_rgba(0,0,0,.12)] text-orange text-[28px] font-[900] z-10 transition-all grid place-items-center pb-1 hover:bg-orange hover:text-white hover:scale-110">‹</button>
                  <button onClick={next} aria-label="Próxima"
                    className="absolute top-1/2 -translate-y-1/2 right-2 lg:right-6 w-[52px] h-[52px] rounded-full border-none bg-white shadow-[0_6px_18px_rgba(0,0,0,.12)] text-orange text-[28px] font-[900] z-10 transition-all grid place-items-center pb-1 hover:bg-orange hover:text-white hover:scale-110">›</button>

                  <div
                    key={`${tab}-${idx}`}
                    className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-[60px] items-center relative z-[1] animate-[m2FadeIn_.45s_ease]"
                  >
                    {/* Bottles */}
                    <div className="flex justify-center items-end gap-3.5 flex-wrap">
                      {(Array.isArray(current.ingredientes) ? current.ingredientes : []).map((ing, i) => {
                        const p = findP(ing.product_id);
                        return (
                          <div
                            key={i}
                            onClick={() => p && navigate(`/produtos/${p.id}`)}
                            style={{ animationDelay: `${i * 80}ms` }}
                            className="flex flex-col items-center cursor-pointer transition-transform w-[110px] animate-[m2BottleIn_.5s_ease_both] hover:-translate-y-1.5"
                          >
                            <div className="w-[110px] h-[150px] bg-white rounded-[14px] grid place-items-center shadow-[0_6px_18px_rgba(232,90,12,.12)] p-3 mb-2.5">
                              {p?.image && <img src={p.image} alt={ing.nome} className="max-w-full max-h-full object-contain" />}
                            </div>
                            <div className="bg-orange text-white text-[11px] font-[900] px-2.5 py-1 rounded-full mb-1.5 tracking-[.3px]">{ing.qty}</div>
                            <div className="text-[12px] font-bold text-ink text-center leading-tight text-balance">{ing.nome}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Text */}
                    <div>
                      <div className="font-display text-[14px] font-bold text-orange mb-2.5 tracking-[1px]">
                        <span>{String(idx + 1).padStart(2, '0')}</span>
                        <span className="mx-1 opacity-50">/</span>
                        <span>{String(list.length).padStart(2, '0')}</span>
                      </div>
                      <h2 className="font-display text-[30px] lg:text-[42px] font-[900] leading-[1.05] mb-7 text-ink tracking-[-.5px] text-balance">
                        {current.titulo}
                      </h2>

                      <div className="mb-6 pl-[18px] border-l-[3px] border-orange-light">
                        <div className="text-[11px] tracking-[2px] font-[900] text-orange mb-1.5">COMO APLICAR</div>
                        <p className="text-[15px] leading-[1.6] text-ink-light m-0">{current.aplicacao}</p>
                      </div>

                      <div className="bg-white p-4 rounded-[14px] shadow-[0_4px_14px_rgba(232,90,12,.08)]">
                        <div className="text-[11px] tracking-[2px] font-[900] text-orange mb-1.5">O RESULTADO</div>
                        <p className="text-[14.5px] leading-[1.5] text-ink m-0 font-semibold">{current.resultado}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-2 mt-6">
                  {list.map((_, i) => (
                    <button
                      key={i}
                      aria-label={`Ir para ${i + 1}`}
                      onClick={() => setIdx(i)}
                      className={`h-2.5 rounded-full border-none transition-all p-0 cursor-pointer
                        ${i === idx ? 'bg-orange w-8 rounded-[6px]' : 'bg-orange/25 w-2.5 hover:bg-orange/50'}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* GUIA */}
      <section ref={refGuia} className="reveal max-w-content mx-auto px-10 mt-10">
        <div className="text-center mb-8">
          <h2 className="font-display text-[38px] font-[900] tracking-[-.5px] m-0 mb-2">12 óleos. Uma rotina.</h2>
          <p className="text-[15px] text-ink-light m-0">Conheça rapidamente para que serve cada óleo da linha Sobral.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {GUIA_OLEOS.map(o => {
            const p = findP(o.id);
            return (
              <div
                key={o.id}
                onClick={() => p && navigate(`/produtos/${p.id}`)}
                className="bg-white rounded-[12px] p-3.5 flex items-center gap-3 border border-line cursor-pointer transition-all hover:border-orange hover:translate-x-0.5 hover:shadow-[0_4px_12px_rgba(243,112,33,.1)]"
              >
                <div className="w-[52px] h-[68px] bg-orange-50 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center p-1.5">
                  {p?.image && <img src={p.image} alt={o.nome} className="w-full h-full object-contain" />}
                </div>
                <div>
                  <div className="font-[800] text-[14px] text-ink mb-0.5">{o.nome}</div>
                  <div className="text-[11.5px] text-ink-light leading-tight">{o.tag}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section ref={refCta} className="reveal max-w-content mx-auto px-10 mt-[60px] mb-[60px]">
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
