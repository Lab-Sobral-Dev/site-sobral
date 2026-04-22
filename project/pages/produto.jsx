/* ============ Página: Detalhe do Produto ============ */

function ProdutoPage({ product, onNavigate }) {
  const [openAccordion, setOpenAccordion] = React.useState('caracteristicas');
  const [variant, setVariant] = React.useState(0);
  const p = product || window.CATALOG?.find(x => x.id === 'aqualema') || {
    id: 'aqualema',
    name: 'Aqualemã Sobral',
    tag: 'Vitamina C + Magnésio',
    description: 'Fonte de vitamina C e magnésio, auxiliando o sistema imune, o metabolismo de proteínas, carboidratos e gorduras, além do bom funcionamento muscular.',
    caracteristicas: [
      'Sabor aguardente; não contém glúten;',
      'Sua dose de vitalidade na terceira idade!'
    ],
    apresentacao: 'Frascos de 150ml, 300ml e 500ml. Caixa com 1 unidade.',
    modoUso: 'Adultos: tomar 15ml (1 colher de sopa) ao dia, de preferência pela manhã, ou conforme orientação médica.',
    precaucoes: 'Manter fora do alcance de crianças. Conservar em temperatura ambiente, em local seco e arejado. Não ultrapassar a recomendação diária.',
    ingredientes: 'Água, álcool etílico, cloreto de magnésio hexahidratado, ácido ascórbico, agente de massa glicerina, corante caramelo I, aromatizante, conservador para hidroxibenzoato de metila e regulador de acidez hidróxido de sódio. NÃO CONTÉM GLÚTEN',
    disclaimer: 'ESTE PRODUTO NÃO É UM MEDICAMENTO. MANTENHA FORA DO ALCANCE DE CRIANÇAS. NÃO EXCEDER A RECOMENDAÇÃO DIÁRIA DE CONSUMO INDICADA NA EMBALAGEM.',
    nutri: {
      porcoes: 'Porções por embalagem: 2\nPorção: 15ml (1 colher de sopa)',
      rows: [
        ['Valor energético (kcal)', '6', '0'],
        ['Carboidratos (g)', '1,5', '1'],
        ['Vitamina C (mg)', '90', '90'],
        ['Magnésio (mg)', '104', '25'],
      ]
    }
  };

  const accordionData = [
    { id: 'caracteristicas', title: 'Caraterísticas do produto',
      content: (<>{p.caracteristicas?.map((c, i) => <div key={i}>{c}</div>)}</>) },
    { id: 'apresentacao', title: 'Apresentação', content: p.apresentacao },
    { id: 'modouso', title: 'Modo de Uso', content: p.modoUso },
    { id: 'precaucoes', title: 'Precauções', content: p.precaucoes },
  ];

  return (
    <>
      <Breadcrumb trail={[
        { label: '🏠 Home', page: 'home' },
        { label: 'Produtos', page: 'produtos' },
        { label: 'Tradicionais' }
      ]} onNavigate={onNavigate} />

      <section className="container" style={{marginTop: 44}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1.1fr', gap: 64, alignItems:'start'}}>
          {/* GALERIA */}
          <div>
            <div style={{
              aspectRatio:'1/1', background:'white',
              border:'1px solid var(--line)', borderRadius:'var(--radius)',
              display:'grid', placeItems:'center',
              position:'relative', overflow:'hidden',
              padding: 30
            }}>
              {p.image ? (
                <img src={p.image} alt={p.name} style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain'}}/>
              ) : (
                <div className="placeholder-label">[ foto principal: {p.name} — frente ]</div>
              )}
            </div>
            <div style={{display:'flex', gap:14, marginTop: 18, justifyContent:'center'}}>
              {[0,1,2].map(i => (
                <div key={i}
                     onClick={() => setVariant(i)}
                     style={{
                       width: 72, height: 72,
                       background: 'white',
                       border: variant === i ? '2px solid var(--orange)' : '1px solid var(--line)',
                       borderRadius: 8,
                       display:'grid', placeItems:'center',
                       cursor:'pointer', padding: 6,
                       fontSize: 10, color:'#bbb', fontFamily:'monospace'
                     }}>
                  {p.image
                    ? <img src={p.image} alt="" style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain'}}/>
                    : `[ angle ${i + 1} ]`}
                </div>
              ))}
            </div>
          </div>

          {/* INFO */}
          <div>
            <h1 style={{fontSize: 36, fontWeight: 700, marginBottom: 14, color:'var(--ink-light)'}}>{p.name}</h1>
            <p style={{fontSize: 15, lineHeight: 1.6, color:'var(--ink-light)', marginBottom: 28}}>
              {p.description}
            </p>

            <div className="accordion">
              {accordionData.map(item => (
                <div key={item.id} className={`accordion-item ${openAccordion === item.id ? 'open' : ''}`}>
                  <button className="accordion-trigger"
                          onClick={() => setOpenAccordion(openAccordion === item.id ? null : item.id)}>
                    {item.title}
                    <span className="arrow">▾</span>
                  </button>
                  <div className="accordion-content">
                    <div className="accordion-content-inner">{item.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INGREDIENTES + NUTRICIONAL */}
      <section style={{
        background: 'linear-gradient(180deg, #C5D11E, #A8B410)',
        color: 'white',
        marginTop: 60,
        padding: '48px 40px'
      }}>
        <div className="container" style={{padding: 0}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 48}}>
            <div>
              <h2 style={{fontSize: 26, fontWeight: 800, textAlign:'center', marginBottom: 22, color:'white'}}>Ingredientes</h2>
              <p style={{fontSize: 13.5, lineHeight: 1.65, marginBottom: 18}}>{p.ingredientes}</p>
              <p style={{fontSize: 13.5, lineHeight: 1.65, fontWeight: 700}}>{p.disclaimer}</p>
            </div>
            <div style={{borderLeft: '1px solid rgba(255,255,255,.3)', paddingLeft: 48}}>
              <h2 style={{fontSize: 26, fontWeight: 800, textAlign:'center', marginBottom: 22, color:'white'}}>Informação nutricional</h2>
              <pre style={{fontFamily:'inherit', fontSize: 13.5, margin: 0, whiteSpace:'pre-wrap', marginBottom: 14}}>{p.nutri.porcoes}</pre>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize: 13.5}}>
                <thead>
                  <tr style={{borderBottom:'1px solid rgba(255,255,255,.4)'}}>
                    <th></th>
                    <th style={{textAlign:'right', padding:'6px 0', fontWeight:700}}>15 ml</th>
                    <th style={{textAlign:'right', padding:'6px 0', fontWeight:700}}>%VD*</th>
                  </tr>
                </thead>
                <tbody>
                  {p.nutri.rows.map((r, i) => (
                    <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,.2)'}}>
                      <td style={{padding:'8px 0'}}>{r[0]}</td>
                      <td style={{textAlign:'right'}}>{r[1]}</td>
                      <td style={{textAlign:'right'}}>{r[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{fontSize: 12, marginTop: 14, lineHeight: 1.55}}>
                Não contém quantidades significativas de açúcares totais, açúcares adicionados,
                proteínas, gorduras totais, gorduras saturadas, gorduras trans, fibras alimentares e sódio.
              </p>
              <p style={{fontSize: 11, marginTop: 10, fontStyle: 'italic'}}>
                *Percentual de valores diários fornecidos pela porção.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

window.ProdutoPage = ProdutoPage;
