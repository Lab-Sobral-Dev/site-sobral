export const CATEGORIES = [
  { id: 'all',          label: 'Todos'        },
  { id: 'suplementos',  label: 'Suplementos'  },
  { id: 'tradicionais', label: 'Tradicionais' },
  { id: 'oleos',        label: 'Óleos'        },
  { id: 'cosmeticos',   label: 'Cosméticos'   },
  { id: 'infantil',     label: 'Infantil'     },
];

export const CATALOG = [
  // Linha Calciolax
  { id: 'calciolax-articule', name: 'Calciolax Articule', tag: 'Cálcio + Vitamina D + Colágeno tipo II', category: 'suplementos', brand: 'Calciolax', image: '/images/produtos/calciolax-articule.png', description: 'Suplemento alimentar com cálcio, vitamina D e colágeno tipo II para mobilidade articular e saúde óssea.' },
  { id: 'calciolax-b12', name: 'Calciolax B12', tag: 'Cálcio + Vitamina B12 240ml', category: 'suplementos', brand: 'Calciolax', image: '/images/produtos/calciolax-b12.png', description: 'Solução oral de cálcio enriquecida com vitamina B12, auxilia no metabolismo energético e saúde óssea.' },
  { id: 'calciolax-d3', name: 'Calciolax D3', tag: 'Cálcio + Vitamina D3 240ml', category: 'suplementos', brand: 'Calciolax', image: '/images/produtos/calciolax-d3.png', description: 'Suplemento de cálcio com vitamina D3 para absorção otimizada.' },
  { id: 'calciolax-fixa', name: 'Calciolax Fixa', tag: 'Cálcio de alta absorção', category: 'suplementos', brand: 'Calciolax', image: '/images/produtos/calciolax-fixa.png', description: 'Fórmula exclusiva de cálcio com alta biodisponibilidade para reposição diária.' },
  { id: 'calciolax-kids', name: 'Calciolax Kids', tag: 'Cálcio + Vitamina D3 sabor morango', category: 'infantil', brand: 'Calciolax', image: '/images/produtos/calciolax-kids.png', description: 'Suplemento infantil de cálcio e vitamina D3 em sabor agradável, para o crescimento saudável.' },
  // Tradicionais
  { id: 'aqualema', name: 'Aqualemã Sobral', tag: 'Vitamina C + Magnésio 200ml', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/aqualema-200.png', description: 'Fonte de vitamina C e magnésio, auxiliando o sistema imune, o metabolismo de proteínas, carboidratos e gorduras, além do bom funcionamento muscular.', ingredientes: 'Água, álcool etílico, cloreto de magnésio hexahidratado, ácido ascórbico, agente de massa glicerina, corante caramelo I, aromatizante, conservador para hidroxibenzoato de metila e regulador de acidez hidróxido de sódio. NÃO CONTÉM GLÚTEN', disclaimer: 'ESTE PRODUTO NÃO É UM MEDICAMENTO. MANTENHA FORA DO ALCANCE DE CRIANÇAS. NÃO EXCEDER A RECOMENDAÇÃO DIÁRIA DE CONSUMO INDICADA NA EMBALAGEM.', nutri: { porcoes: 'Porções por embalagem: 2\nPorção: 15ml (1 colher de sopa)', rows: [['Valor energético (kcal)', '6', '0'], ['Carboidratos (g)', '1,5', '1'], ['Vitamina C (mg)', '90', '90'], ['Magnésio (mg)', '104', '25']] } },
  { id: 'amargofig', name: 'Amargofig', tag: 'Colina + B6 + B12', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/amargofig.png', description: 'Solução com colina, vitamina B6 e B12 que auxilia no metabolismo de gorduras e no funcionamento do sistema nervoso.' },
  { id: 'inglesa-quina', name: 'Inglesa Quina Sobral', tag: 'Tônico fortificante 430ml', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/inglesa-quina.png', description: 'Tônico tradicional à base de quina, fortificante natural que auxilia no apetite e disposição.' },
  { id: 'magnesia', name: 'Magnésia Sobral', tag: 'Tradicional 300ml', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/magnesia.png', description: 'Solução oral tradicional para auxiliar no trato digestivo. Clássico do Laboratório Sobral.' },
  { id: 'magnesia-hortela', name: 'Magnésia Sobral Hortelã', tag: 'Sabor hortelã 100ml', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/magnesia-hortela.png', description: 'Magnésia Sobral com sabor refrescante de hortelã para auxiliar na digestão.' },
  { id: 'soralyt', name: 'Soralyt Tradicional', tag: 'Solução de reidratação oral', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/soralyt.png', description: 'Solução de reidratação oral para repor eletrólitos em casos de desidratação leve.' },
  { id: 'soralyt-laranja', name: 'Soralyt Laranja', tag: 'Reidratação sabor laranja', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/soralyt-laranja.png', description: 'Solução de reidratação em sabor laranja, para consumo mais agradável.' },
  { id: 'soralyt-uva', name: 'Soralyt Uva', tag: 'Reidratação sabor uva', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/soralyt-uva.png', description: 'Solução de reidratação em sabor uva.' },
  { id: 'soralyt-morango', name: 'Soralyt Morango', tag: 'Reidratação sabor morango', category: 'infantil', brand: 'Tradicionais', image: '/images/produtos/soralyt-morango.png', description: 'Solução de reidratação em sabor morango, ideal para crianças.' },
  { id: 'tintura-arnica', name: 'Tintura de Arnica', tag: 'Uso externo', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/tintura-arnica.png', description: 'Tintura tradicional de arnica para uso externo, auxiliar no alívio de dores musculares.' },
  { id: 'xaropvitan', name: 'Xaropvitan', tag: 'Xarope tradicional', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/xaropvitan.png', description: 'Xarope tradicional com vitaminas, auxiliar na dieta da família.' },
  { id: 'theogorico', name: 'Theogórico B6', tag: 'Vitamina B6 + Ativos', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/theogorico.png', description: 'Solução tradicional à base de vitamina B6, fortificante clássico.' },
  { id: 'laxdose', name: 'Laxdose Fibras', tag: 'Fibras alimentares', category: 'tradicionais', brand: 'Tradicionais', image: '/images/produtos/laxdose.png', description: 'Suplemento de fibras alimentares para o bom funcionamento intestinal.' },
  { id: 'laxdose-kids', name: 'Laxdose Kids', tag: 'Fibras para crianças', category: 'infantil', brand: 'Tradicionais', image: '/images/produtos/laxdose-kids.png', description: 'Suplemento de fibras em versão infantil, sabor agradável.' },
  { id: 'manafibras', name: 'Manáfibras', tag: 'Fonte de fibras naturais', category: 'suplementos', brand: 'Tradicionais', image: '/images/produtos/manafibras.jpeg', description: 'Suplemento natural à base de fibras solúveis para auxílio intestinal.' },
  // Movimex + Saludoz
  { id: 'movimex', name: 'Movimex 60 comp', tag: 'Mobilidade articular', category: 'suplementos', brand: 'Movimex', image: '/images/produtos/movimex-60.png', description: 'Suplemento alimentar para mobilidade e conforto articular, com ação em longa duração.' },
  { id: 'movimex-30', name: 'Movimex 30 comp', tag: 'Mobilidade articular', category: 'suplementos', brand: 'Movimex', image: '/images/produtos/movimex-30.png', description: 'Versão com 30 comprimidos do suplemento Movimex.' },
  { id: 'saludoz', name: 'Saludoz Ômega AZ', tag: 'Vitaminas de A a Z + Ômega 3', category: 'suplementos', brand: 'Saludoz', image: '/images/produtos/saludoz.png', description: 'Polivitamínico completo com vitaminas de A a Z enriquecido com ômega 3 em cápsulas.' },
  // Vitaminas
  { id: 'vitamina-d', name: 'Vitamina D Sobral', tag: '20ml em gotas', category: 'suplementos', brand: 'Sobral', image: '/images/produtos/vitamina-d.png', description: 'Vitamina D em gotas, de fácil administração, para toda a família.' },
  { id: 'vitamina-d-7m', name: 'Vitamina D 7 Meses', tag: 'Para bebês a partir de 7 meses', category: 'infantil', brand: 'Sobral', image: '/images/produtos/vitamina-d-7m.png', description: 'Vitamina D em gotas formulada para bebês a partir de 7 meses de idade.' },
  // Própolis
  { id: 'propolis-verde', name: 'Extrato de Própolis Verde', tag: 'Fonte de compostos fenólicos', category: 'suplementos', brand: 'Sobral', image: '/images/produtos/propolis-verde.png', description: 'Extrato concentrado de própolis verde brasileira, fonte de flavonoides e compostos fenólicos.' },
  { id: 'propzinco', name: 'PropZinco', tag: 'Própolis + Zinco 100ml', category: 'suplementos', brand: 'PropZinco', image: '/images/produtos/propzinco-frasco.png', description: 'Solução oral de própolis enriquecida com zinco, aliado do sistema imune.' },
  { id: 'propzinco-spray', name: 'PropZinco Spray', tag: 'Spray 30ml', category: 'suplementos', brand: 'PropZinco', image: '/images/produtos/propzinco-spray.png', description: 'Spray de própolis com zinco para uso prático no dia a dia.' },
  { id: 'propzinco-menta', name: 'PropZinco Menta', tag: 'Spray sabor menta', category: 'suplementos', brand: 'PropZinco', image: '/images/produtos/propzinco-menta.png', description: 'Spray de própolis sabor menta refrescante.' },
  { id: 'propzinco-roma', name: 'PropZinco Romã', tag: 'Spray sabor romã', category: 'suplementos', brand: 'PropZinco', image: '/images/produtos/propzinco-roma.png', description: 'Spray de própolis sabor romã.' },
  { id: 'propzinco-gengibre', name: 'PropZinco Gengibre', tag: 'Spray sabor gengibre', category: 'suplementos', brand: 'PropZinco', image: '/images/produtos/propzinco-gengibre.png', description: 'Spray de própolis sabor gengibre, ideal para a garganta.' },
  // Cosmético
  { id: 'glicerina', name: 'Glicerina Sobral', tag: '100% glicerina', category: 'cosmeticos', brand: 'Sobral', image: '/images/produtos/glicerina.png', description: 'Glicerina pura para múltiplos usos, tradição do Laboratório Sobral.' },
  // Óleos
  { id: 'oleo-girassol-age', name: 'Óleo de Girassol AGE', tag: '100ml — uso adulto e infantil', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-girassol-age.png', description: 'Óleo de girassol enriquecido com AGE, hidratação e cuidado da pele.' },
  { id: 'rosa-mosqueta-spray', name: 'Óleo de Rosa Mosqueta Spray', tag: 'Aplicação em spray', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/rosa-mosqueta-spray.jpg', description: 'Óleo de rosa mosqueta em spray para cuidado da pele, fácil aplicação.' },
  { id: 'rosa-mosqueta-gotas', name: 'Óleo de Rosa Mosqueta Gotas', tag: 'Conta-gotas', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/rosa-mosqueta-gotas.jpg', description: 'Óleo de rosa mosqueta em conta-gotas, aplicação precisa.' },
  { id: 'oleo-coco', name: 'Óleo de Coco', tag: '50ml — 100% natural', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-coco.png', description: 'Óleo de coco puro e natural para cabelos e pele.' },
  { id: 'oleo-argan', name: 'Óleo de Argan', tag: '50ml — puro e natural', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-argan.png', description: 'Óleo de argan 100% puro, nutrição profunda para cabelos.' },
  { id: 'oleo-abacate', name: 'Óleo de Abacate', tag: '50ml — cabelos e pele', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-abacate.png', description: 'Óleo de abacate nutritivo para cabelos e pele.' },
  { id: 'oleo-amendoas', name: 'Óleo de Amêndoas Doce', tag: '30ml — hidratação', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-amendoas.png', description: 'Óleo de amêndoas doce, hidratação suave para pele sensível.' },
  { id: 'oleo-babosa', name: 'Óleo de Babosa', tag: '50ml', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-babosa.png', description: 'Óleo de babosa para cuidado dos fios e hidratação.' },
  { id: 'oleo-ricino', name: 'Óleo de Rícino', tag: '50ml', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-ricino.png', description: 'Óleo de rícino tradicional, cuidado dos cabelos e cílios.' },
  { id: 'oleo-copaiba', name: 'Óleo de Copaíba', tag: '30ml', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-copaiba.png', description: 'Óleo de copaíba para uso cosmético.' },
  { id: 'oleo-alecrim', name: 'Óleo de Alecrim', tag: '50ml', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-alecrim.png', description: 'Óleo de alecrim, aliado dos cuidados capilares.' },
  { id: 'oleo-karite', name: 'Óleo de Karité Preto', tag: '50ml', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-karite.png', description: 'Óleo de karité preto, nutrição intensa para pele e cabelos.' },
  { id: 'oleo-uva', name: 'Óleo de Semente de Uva', tag: '50ml', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-uva.png', description: 'Óleo de semente de uva, rico em antioxidantes naturais.' },
  { id: 'oleo-girassol', name: 'Óleo de Girassol', tag: '50ml', category: 'oleos', brand: 'Óleos Sobral', image: '/images/produtos/oleo-girassol.png', description: 'Óleo de girassol puro, múltiplos usos cosméticos.' },
];
