import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATALOG } from '../data/catalog';
import { useScrollReveal } from '../hooks/useScrollReveal';

const MISTURINHAS_CABELO = [
  {
    titulo: 'Cabelo com brilho natural',
    aplicacao: 'Aplique no couro cabeludo com massagens suaves, espalhe ao longo dos fios, deixe agir durante a noite e enxágue no dia seguinte.',
    resultado: 'Fios mais nutridos, macios e com um brilho de arrasar.',
    ingredientes: [
      { qty: '1 tampa',  id: 'oleo-coco',    nome: 'Óleo de Coco' },
      { qty: '1 tampa',  id: 'oleo-ricino',  nome: 'Óleo de Rícino' },
      { qty: '7 gotas',  id: 'oleo-alecrim', nome: 'Óleo de Alecrim' },
    ],
  },
  {
    titulo: 'Hidratação nutritiva',
    aplicacao: 'Aplique nos fios úmidos evitando a raiz. Deixe agir por 20–30 minutos com touca e enxágue.',
    resultado: 'Cabelos mais fortes, hidratados e brilhantes.',
    ingredientes: [
      { qty: '1 colher', id: 'oleo-abacate', nome: 'Óleo de Abacate' },
      { qty: '1 colher', id: 'oleo-coco',    nome: 'Óleo de Coco' },
      { qty: '1 colher', id: 'glicerina',    nome: 'Glicerina Sobral' },
    ],
  },
  {
    titulo: 'Lavagem revitalizante',
    aplicacao: 'Adicione ao seu shampoo favorito. Massageie o couro cabeludo durante a lavagem.',
    resultado: 'Lavagem que nutre, estimula o crescimento e deixa o cabelo com mais brilho.',
    ingredientes: [
      { qty: '1 tampa',  id: 'oleo-babosa',  nome: 'Óleo de Babosa' },
      { qty: '1 tampa',  id: 'oleo-alecrim', nome: 'Óleo de Alecrim' },
    ],
  },
  {
    titulo: 'Pré-hidratação potente',
    aplicacao: 'Aplique nos fios úmidos antes da máscara. Deixe 3 min, depois aplique a máscara por cima.',
    resultado: 'Cabelos nutridos, macios e com brilho duradouro.',
    ingredientes: [
      { qty: '1 colher', id: 'oleo-abacate', nome: 'Óleo de Abacate' },
      { qty: '1 colher', id: 'oleo-uva',     nome: 'Óleo de Semente de Uva' },
    ],
  },
  {
    titulo: 'Umectação fortalecedora',
    aplicacao: 'Misture e aplique nos cabelos secos, enluvando mecha por mecha. Deixe agir durante a noite.',
    resultado: 'Fios mais fortes, nutridos e com mais brilho.',
    ingredientes: [
      { qty: 'A gosto',  id: 'oleo-ricino', nome: 'Óleo de Rícino' },
      { qty: 'A gosto',  id: 'oleo-coco',   nome: 'Óleo de Coco' },
      { qty: 'A gosto',  id: 'oleo-argan',  nome: 'Óleo de Argan' },
    ],
  },
];

const MISTURINHAS_PELE = [
  {
    titulo: 'Pele mais radiante',
    aplicacao: 'Adicione ao seu creme clareador favorito. Use diariamente conforme orientação do creme base.',
    resultado: 'Tom da pele uniforme, marcas suavizadas e mais viço.',
    ingredientes: [
      { qty: 'Algumas gotas', id: 'rosa-mosqueta-gotas', nome: 'Óleo de Rosa Mosqueta' },
    ],
  },
  {
    titulo: 'Pós-barba suavizante',
    aplicacao: 'Após o barbear, aplique na pele limpa ou no creme pós-barba.',
    resultado: 'Pele calma, macia, sem irritações.',
    ingredientes: [
      { qty: 'A gosto', id: 'oleo-karite', nome: 'Óleo de Karité' },
      { qty: 'A gosto', id: 'oleo-coco',   nome: 'Óleo de Coco' },
    ],
  },
  {
    titulo: 'Hidratação para as mamães',
    aplicacao: 'Misture em frasco limpo. Aplique na barriga, seios e coxas 1–2 vezes ao dia.',
    resultado: 'Pele elástica, hidratada, com prevenção de estrias.',
    ingredientes: [
      { qty: '1 tampa', id: 'oleo-amendoas', nome: 'Óleo de Amêndoas' },
      { qty: '1 tampa', id: 'oleo-girassol', nome: 'Óleo de Girassol' },
    ],
  },
  {
    titulo: 'Super óleo de banho',
    aplicacao: 'Agite bem em frasco limpo e aplique na pele úmida após ou durante o banho.',
    resultado: 'Hidratação intensa com toque suave de perfume.',
    ingredientes: [
      { qty: '2 tampas', id: 'oleo-amendoas', nome: 'Óleo de Amêndoas' },
      { qty: '1 tampa',  id: 'oleo-uva',      nome: 'Óleo de Semente de Uva' },
    ],
  },
  {
    titulo: 'Calmante natural',
    aplicacao: 'Aplique direto na pele após depilação ou em áreas com coceira.',
    resultado: 'Alívio rápido para irritações e coceiras.',
    ingredientes: [
      { qty: '1 colher', id: 'oleo-coco',    nome: 'Óleo de Coco' },
      { qty: '1 colher', id: 'oleo-copaiba', nome: 'Óleo de Copaíba' },
    ],
  },
];

const GUIA_OLEOS = [
  { id:'oleo-alecrim',        nome:'Alecrim',        tag:'Fortalecimento capilar' },
  { id:'oleo-uva',            nome:'Semente de Uva', tag:'Peles acneicas, cicatrizes' },
  { id:'oleo-coco',           nome:'Coco',           tag:'Hidratação + demaquilante' },
  { id:'oleo-girassol',       nome:'Girassol',       tag:'Vitamina E, elasticidade' },
  { id:'oleo-amendoas',       nome:'Amêndoas Doce',  tag:'Estrias e ressecamento' },
  { id:'oleo-ricino',         nome:'Rícino',         tag:'Umectação capilar' },
  { id:'rosa-mosqueta-gotas', nome:'Rosa Mosqueta',  tag:'Antienvelhecimento' },
  { id:'oleo-copaiba',        nome:'Copaíba',        tag:'Cicatrizes e manchas' },
  { id:'oleo-babosa',         nome:'Babosa',         tag:'Couro cabeludo, sol' },
  { id:'oleo-abacate',        nome:'Abacate',        tag:'Couro cabeludo + pele' },
  { id:'oleo-argan',          nome:'Argan',          tag:'Anti-friz, circulação' },
  { id:'glicerina',           nome:'Glicerina',      tag:'Hidratante universal' },
];

function findP(id) {
  return CATALOG.find(p => p.id === id);
}

export default function MisturinhasPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('cabelo');
  const [idx, setIdx] = useState(0);

  const list = tab === 'cabelo' ? MISTURINHAS_CABELO : MISTURINHAS_PELE;
  const current = list[idx];

  useEffect(() => { setIdx(0); }, [tab]);

  const next = () => setIdx((idx + 1) % list.length);
  const prev = () => setIdx((idx - 1 + list.length) % list.length);

  const refHero    = useScrollReveal();
  const refCarrosel = useScrollReveal();
  const refGuia    = useScrollReveal();
  const refCta     = useScrollReveal();

  return (
    <>
      {/* HERO */}
      <section
        ref={refHero}
        className="reveal bg-[#FAF5EC] grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-9 lg:gap-[60px] items-stretch px-8 py-12 lg:px-20 lg:py-[60px] relative overflow-hidden"
      >
        <div className="absolute -bottom-[100px] -left-[60px] w-[280px] h-[280px] rounded-full border-[14px] border-orange/10 pointer-events-none" />

        <div className="relative flex flex-col justify-center max-w-[560px]">
          <div className="text-[12px] tracking-[3px] font-[900] text-orange mb-[18px]">FOLDER · ÓLEOS SOBRAL</div>
          <h1 className="font-display text-[56px] lg:text-[76px] font-[900] leading-[.95] mb-6 text-ink tracking-[-2px] text-balance">
            Misturinhas<br/>
            <em className="text-orange not-italic-only italic font-[700]">que mudam tudo.</em>
          </h1>
          <p className="text-[18px] leading-[1.55] text-ink-light mb-8 max-w-[480px]">
            10 combinações dos <strong className="text-ink font-[800]">Óleos Sobral</strong> para turbinar sua rotina de pele e cabelo.
            Use sozinhos ou misturados — sua beleza agradece.
          </p>
          <div className="flex gap-10 pt-6 border-t border-black/10">
            {[['10','receitas'],['12','óleos'],['2','linhas']].map(([n, lbl]) => (
              <div key={lbl} className="flex flex-col">
                <b className="font-display text-[44px] font-[900] text-orange leading-none mb-1">{n}</b>
                <span className="text-[12px] font-bold text-ink-light tracking-[1px] uppercase">{lbl}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] overflow-hidden shadow-[0_12px_40px_rgba(232,90,12,.22)] h-[400px] lg:h-auto">
          <img
            src="/images/misturinhas-hero-panel.png"
            alt="Dicas de Misturinhas Óleos Sobral"
            className="w-full h-full object-cover block"
          />
        </div>
      </section>

      {/* CARROSSEL */}
      <section ref={refCarrosel} className="reveal max-w-content mx-auto px-10 mt-[60px] mb-10">
        {/* Tabs */}
        <div className="flex gap-3 justify-center mb-9">
          {[
            { id: 'cabelo', label: 'Cabelo', count: '5 misturinhas', svg: <path d="M12 3 C7 3 4 7 5 13 L6 21 M12 3 C17 3 20 7 19 13 L18 21 M9 15 L9 21 M15 15 L15 21"/> },
            { id: 'pele',   label: 'Pele',   count: '5 misturinhas', svg: <><path d="M5 12 Q5 6 12 6 Q19 6 19 12 Q19 19 12 19 Q5 19 5 12 Z"/><circle cx="10" cy="11" r=".8" fill="currentColor"/><circle cx="14" cy="13" r=".8" fill="currentColor"/><circle cx="11" cy="15" r=".8" fill="currentColor"/></> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`bg-white border-2 rounded-full pl-5 pr-[26px] py-3 flex items-center gap-3 transition-all font-sans text-left
                ${tab === t.id ? 'bg-orange border-orange !text-white shadow-[0_4px_14px_rgba(232,90,12,.3)]' : 'border-line text-ink hover:border-orange hover:text-orange'}`}
              style={tab === t.id ? { background: 'var(--orange)', color: 'white' } : {}}
            >
              <span className={`w-[38px] h-[38px] rounded-full grid place-items-center flex-shrink-0
                ${tab === t.id ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange'}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{t.svg}</svg>
              </span>
              <div>
                <div className="font-[900] text-[16px] leading-none mb-0.5">{t.label}</div>
                <div className="text-[11px] opacity-80 font-semibold">{t.count}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Recipe stage */}
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
                {current.ingredientes.map((ing, i) => {
                  const p = findP(ing.id);
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

                <div className="flex gap-3.5 items-start bg-white p-4 rounded-[14px] shadow-[0_4px_14px_rgba(232,90,12,.08)]">
                  <span className="text-[28px] flex-shrink-0 leading-none">✨</span>
                  <div>
                    <div className="text-[11px] tracking-[2px] font-[900] text-orange mb-1.5">O RESULTADO</div>
                    <p className="text-[14.5px] leading-[1.5] text-ink m-0 font-semibold">{current.resultado}</p>
                  </div>
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
                <div className="w-12 h-12 bg-orange-50 rounded-lg grid place-items-center flex-shrink-0 p-1">
                  {p?.image && <img src={p.image} alt={o.nome} className="max-w-full max-h-full object-contain" />}
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
              <button onClick={() => navigate('/produtos')}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-transparent text-white border-[1.5px] border-white/50 font-bold text-[14px] tracking-[.3px] transition-all hover:bg-white/10">
                Ver todos os óleos →
              </button>
            </div>
          </div>
          <div className="relative z-[1] rounded-[20px] overflow-hidden aspect-[3/4] shadow-[0_12px_32px_rgba(0,0,0,.18)] max-h-[320px] lg:max-h-none">
            <img src="/images/misturinhas-girl.jpg" alt="" className="w-full h-full object-cover block" />
          </div>
        </div>
      </section>

      {/* Animações inline para Tailwind via keyframes globais */}
      <style>{`
        @keyframes m2FadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes m2BottleIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
