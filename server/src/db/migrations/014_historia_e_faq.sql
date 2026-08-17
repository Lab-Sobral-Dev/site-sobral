-- Popula o CMS com:
--   1) o texto integral de "Nossa História" do site institucional antigo;
--   2) as perguntas frequentes da página Fale Conosco.
-- Sem isso os campos aparecem vazios no painel /admin/conteudo (o site já usa
-- os mesmos valores como fallback no código).
-- O upsert força o conteúdo oficial mesmo que o CMS tenha sido editado antes.

INSERT INTO page_content (page, key, value, type) VALUES

  -- ── Quem Somos — abertura ──
  ('sobre','historia_eyebrow','UMA HISTÓRIA BRASILEIRA','text'),
  ('sobre','historia_intro_titulo','Da cura à prevenção: uma tradição centenária que sempre se renova','text'),
  ('sobre','historia_intro_sub','Conheça a história do Laboratório Sobral','text'),
  ('sobre','historia_intro_texto','<p>Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos brasileiros. Estamos nas casas das famílias levando mais saúde e proporcionando leveza e bem-estar ao dia a dia. Mais que uma indústria, somos um símbolo da luta do povo brasileiro. Essa é nossa essência e isso nunca vai mudar.</p>','richtext'),

  -- ── Quem Somos — corpo ──
  ('sobre','historia_b1_titulo','Um pouco de história…','text'),
  ('sobre','historia_b1_texto','<p>A história do Laboratório Sobral começou a ser contada em 1911, com a abertura de uma botica na cidade de Amarante – Piauí, a Pharmacia Sobral. Em 1919 foi transferida pra Floriano, e aqui fixada. Em 1925 foi para sede própria onde está até hoje.</p><p>Ao longo dos anos o pequeno negócio cresceu e, além da Pharmacia, que comercializava produtos próprios e de outras marcas, a botica transformou-se em um laboratório e pequena (e artesanal) indústria de medicamentos.</p><p>Até que, em 1973, sob a gestão do economista e empreendedor Teodoro Ferreira Sobral Neto, a fábrica passou a ser continuamente ampliada e modernizada até chegar aos dias de hoje, em que é uma referência no cuidado da saúde dos brasileiros.</p><p>Nessa história centenária, observamos duas guerras mundiais e uma pandemia mudarem o mundo, vimos o Brasil ser comandado por dezenas de presidentes diferentes, comercializamos nossos produtos em nove moedas, superamos dezenas de crises e passamos por grandes transformações.</p>','richtext'),
  ('sobre','historia_destaque','Se hoje somos uma indústria referência, isso é resultado de muita dedicação e trabalho das pessoas que fazem o Sobral acontecer, dia após dia.','text'),
  ('sobre','historia_b2_texto','<p>Agora, você concorda que se um laboratório do interior do Piauí existe, resiste e se destaca há mais de 100 anos, é porque muito já foi feito… E o nosso grande segredo é muito simples: a gente cuida de gente!</p><p>Nós desenvolvemos e comercializamos produtos que contribuem para a saúde dos brasileiros e, além disso, cuidamos da nossa gente. Tanto que em nosso quadro de funcionários temos dezenas de pessoas com décadas de empresa. O mais antigo, Sr. Anísio Teixeira, da contabilidade, trabalha conosco há mais de 45 anos!</p><p>Além dele, centenas de pessoas construíram suas vidas junto com o Sobral.</p><p>Se pessoas que conhecem o Sobral forem questionadas sobre o que a empresa representa para elas, certamente surgirão palavras como tradição, segurança, respeito, honestidade, integridade, família, superação, confiança, credibilidade e determinação.</p>','richtext'),

  ('sobre','historia_b3_titulo','O novo capítulo da nossa história','text'),
  ('sobre','historia_b3_texto','<p>Temos muito orgulho de contribuir há tantas décadas para o cuidado da nossa gente e da saúde dos brasileiros.</p><p>Ao longo de todo esse período, acreditamos ter adentrado em muitos lares, cativando a confiança dos nossos consumidores e é como muitos dizem “O Sobral é como um patrimônio da família! É passado de geração para geração”.</p><p>Esse tipo de relato resume a admiração de milhares de brasileiros que consomem os nossos produtos. E esse é um dos nossos maiores patrimônios. Afinal, nós existimos para que você viva melhor!</p><p>Em 2020, o mundo mudou! E esse contexto histórico que vivemos nos motivou a refletir que era possível contribuir ainda mais para o bem-estar de nossos consumidores, atuando com foco na prevenção. Por isso, estamos ressignificando o papel do Laboratório Sobral enquanto agente provedor de saúde.</p><p>Amparados por um olhar atento sobre o futuro e por um desejo de estar mais próximo das pessoas – estamos passando por mais transformações com o objetivo de ser uma empresa melhor para nosso consumidor final e, naturalmente, para todos que trabalham conosco direta ou indiretamente.</p><p>Por essa razão, o Sobral deixa de existir para “apenas” remediar e passa a ser uma empresa provedora de cuidado e apoio através da prevenção. Vamos ajudar você e a sua família a cuidarem da saúde, fortalecendo a imunidade e prevenindo assim o adoecimento.</p>','richtext'),

  ('sobre','historia_b4_titulo','Mas, na prática, o que isso significa?','text'),
  ('sobre','historia_b4_texto','<p>É simples: estamos focados 100% no mercado de suplementos alimentares, em especial vitaminas e minerais, além de cosméticos. Ou seja, agora você pode contar com a tradição e a qualidade que sempre encontrou nos produtos Sobral, mas com a vantagem extra de fortalecer a sua saúde de forma preventiva, ou de cuidar da beleza usando os produtos de cosméticos.</p><p>Mudar nunca é fácil. Requer ainda mais dedicação de toda a equipe. Porém, saber se reinventar é uma das grandes virtudes das empresas longevas. Além disso, a certeza de que vamos impactar positivamente a vida dos brasileiros em maior escala também nos inspira a seguir.</p>','richtext'),

  ('sobre','historia_b5_titulo','Os novos produtos do Laboratório Sobral','text'),
  ('sobre','historia_b5_texto','<p>Esse é um momento de constante evolução e inovação, e sempre com a mesma qualidade que você conhece, confia e merece.</p><p>O novo Laboratório Sobral já possui linhas de novos produtos, que serão constantemente atualizadas com lançamentos pensados sob medida para proporcionar ainda mais saúde e bem-estar a você e a quem você ama:</p><ol><li><strong>Linha Sobral Tradicionais:</strong> Dentre vários produtos desta linha, destacam-se os campeões de venda e tradicionalíssimos Agualemã Sobral e Inglesa Quina Sobral, com fórmulas novas e aprimoradas;</li><li><strong>Linha Calciolax:</strong> Linha de produtos com cálcio, vitamina D3 e colágeno e especialmente para articulações, ossos, dentes e músculos.</li><li><strong>Linha Movimex:</strong> Linha de produtos com colágeno e zinco, com foco nas articulações e manutenção dos ossos.</li><li><strong>Linha Óleos Sobral:</strong> Uma linha com óleos 100% puros e naturais, que vão desde os cuidados necessários a pele até a vitalidade dos cabelos.</li></ol>','richtext'),

  ('sobre','historia_b6_titulo','Nossa história não acaba aqui…','text'),
  ('sobre','historia_b6_texto','<p>Se em 1973 Teodoro Sobral Neto foi ousado e visionário ao dar os primeiros passos para construir uma indústria de medicamentos que conquistou a confiança e a preferência de milhões de consumidores nos quatro cantos do Brasil; hoje, um novo salto para o futuro se desenha.</p><p>A empresa está sob o comando da quarta geração da família. Dessa vez, a missão é “virar a chave”, adaptar o modelo de negócio às tendências de mercado e seguir contribuindo para a saúde dos brasileiros. “Meu sonho é que meu filho (tataraneto do fundador do Sobral) possa, no futuro, seguir escrevendo a história de uma família que sempre esteve voltada a contribuir para a saúde e bem-estar das pessoas”, conta Wilber da Silveira Lucio, Diretor Operacional do laboratório e genro de Teodoro Sobral Neto.</p><p>Um de nossos principais objetivos ao promover essa mudança é fazer com que as pessoas possam contar com o Sobral não só quando estiverem com algum problema de saúde, mas sempre que quiserem se sentir bem e investir em qualidade de vida. Afinal, prevenir sempre será o melhor remédio.</p><p>As principais tendências de mercado apontam um forte crescimento do chamado “mercado do bem-estar” no Brasil e no mundo nos próximos anos, justamente porque as pessoas entenderam que cuidar da saúde vai muito além de tomar remédios. E é exatamente isso que o novo Sobral proporciona: saúde em forma de prevenção.</p><p>Este é um novo capítulo de uma história que continuará a ser escrita com base em honestidade, respeito aos clientes, consumidores, funcionários, representantes, distribuidores farmacêuticos e fornecedores, mas principalmente no compromisso de levar saúde para as famílias brasileiras. “Contudo, independente das mudanças, uma coisa jamais vai mudar: o Sobral sempre vai existir para cuidar de você e de sua família. Essa foi, é e sempre será a nossa missão”, finaliza Paula Sobral, Diretora Administrativa e Financeira e membro da quarta geração da família Sobral a comandar nossa história centenária.</p>','richtext'),

  ('sobre','historia_imagem','/images/historia/fachada-lab-sobral.jpg','image'),

  -- ── Fale Conosco — contatos (substituem a chave antiga 'sac') ──
  ('contato','sac_telefone','0800 979 5040','text'),
  ('contato','sac_email','sac@laboratoriosobral.com.br','text'),

  -- ── Fale Conosco — Perguntas Frequentes ──
  ('contato','faq_titulo','Perguntas Frequentes','text'),
  ('contato','faq_1_p','Como falo com o SAC do Laboratório Sobral?','text'),
  ('contato','faq_1_r','<p>Pelo telefone gratuito <strong>0800 979 5040</strong>, pelo WhatsApp <strong>(89) 99460-6485</strong> ou pelo e-mail <strong>sac@laboratoriosobral.com.br</strong>. Você também pode usar o formulário no fim desta página.</p>','richtext'),
  ('contato','faq_2_p','Onde encontro os produtos Sobral?','text'),
  ('contato','faq_2_r','<p>Nossos produtos são distribuídos em farmácias e drogarias de todo o Brasil. Se não encontrar um item na sua região, fale com o SAC que indicamos o ponto de venda mais próximo.</p>','richtext'),
  ('contato','faq_3_p','O Laboratório Sobral ainda fabrica medicamentos?','text'),
  ('contato','faq_3_r','<p>Hoje o Sobral está focado em <strong>suplementos alimentares</strong> — em especial vitaminas e minerais — e em <strong>cosméticos</strong>, com a mesma tradição e qualidade de sempre, agora com foco na prevenção e no bem-estar.</p>','richtext'),
  ('contato','faq_4_p','Como agendo uma visita à indústria?','text'),
  ('contato','faq_4_r','<p>Fale com a gente pelo WhatsApp <strong>(89) 99927-0207</strong> e combinamos a melhor data para receber você ou seu grupo.</p>','richtext'),
  ('contato','faq_5_p','Como envio meu currículo para trabalhar no Sobral?','text'),
  ('contato','faq_5_r','<p>Envie seu currículo para <strong>rh@laboratoriosobral.com.br</strong>. As vagas abertas também são divulgadas nas nossas redes sociais.</p>','richtext'),
  ('contato','faq_6_p','Onde consulto o Relatório de Transparência Salarial?','text'),
  ('contato','faq_6_r','<p>O relatório fica disponível publicamente. Acesse pelo menu <strong>Fale Conosco → Relatório de Transparência Salarial</strong>, no topo do site.</p>','richtext')

ON CONFLICT (page, key) DO UPDATE SET
  value      = EXCLUDED.value,
  type       = EXCLUDED.type,
  updated_at = NOW();

-- Chaves substituídas pela nova estrutura de "Nossa História" e pelos endereços
-- que saíram da página Fale Conosco.
DELETE FROM page_content WHERE (page, key) IN (
  ('sobre','historia_heading'),
  ('sobre','historia_titulo'),
  ('sobre','historia_subtitulo'),
  ('sobre','historia_subtitulo_2'),
  ('sobre','historia_texto_1'),
  ('sobre','historia_texto_2'),
  ('sobre','historia_texto_3'),
  ('sobre','historia_texto_4'),
  ('sobre','historia_pullquote'),
  ('contato','unidade_fabril'),
  ('contato','escritorio_comercial'),
  ('contato','atendimento_telefone'),
  ('contato','sac')
);
