CREATE TABLE IF NOT EXISTS page_content (
  id         SERIAL PRIMARY KEY,
  page       TEXT NOT NULL,
  key        TEXT NOT NULL,
  value      TEXT,
  type       TEXT NOT NULL DEFAULT 'text',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (page, key)
);

CREATE TABLE IF NOT EXISTS hero_slides (
  id         SERIAL PRIMARY KEY,
  image_url  TEXT NOT NULL,
  ordem      INT NOT NULL DEFAULT 99,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed home
INSERT INTO page_content (page, key, value, type) VALUES
  ('home','historia_titulo','Conheça a história do','text'),
  ('home','historia_subtitulo','Laboratório Sobral','text'),
  ('home','historia_texto_1','<p>Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos brasileiros. Estamos nas casas das famílias levando mais saúde e proporcionando leveza e bem-estar ao dia a dia. Mais que uma indústria, somos um símbolo da luta do povo brasileiro. Essa é nossa essência e isso nunca vai mudar.</p>','richtext'),
  ('home','historia_imagem','/images/fachada.png','image'),
  ('home','marca_tradicionais_imagem','/images/brand-tradicionais.png','image'),
  ('home','marca_calciolax_imagem','/images/brand-calciolax.png','image'),
  ('home','marca_movimex_imagem','/images/brand-movimex.png','image'),
  ('home','marca_oleos_imagem','/images/brand-oleos.png','image')
ON CONFLICT (page, key) DO NOTHING;

-- Seed sobre
INSERT INTO page_content (page, key, value, type) VALUES
  ('sobre','missao','<p>Contribuir com a saúde e a qualidade de vida das famílias brasileiras.</p>','richtext'),
  ('sobre','visao','<p>Continuar a expansão do negócio, tornando-se referência nos segmentos de suplementos alimentares e cosméticos.</p>','richtext'),
  ('sobre','valores','<p>Compromisso, qualidade, respeito, entusiasmo, credibilidade, perseverança e orgulho nordestino.</p>','richtext'),
  ('sobre','historia_titulo','Da cura à prevenção:','text'),
  ('sobre','historia_subtitulo','Uma tradição centenária que sempre se renova!','text'),
  ('sobre','historia_texto_1','<p>Há mais de 100 anos, o Laboratório Sobral faz parte da vida dos brasileiros. Estamos nas casas das famílias levando mais saúde e proporcionando leveza e bem-estar ao dia a dia. Mais que uma indústria, somos um símbolo da luta do povo brasileiro. Essa é nossa essência e isso nunca vai mudar.</p>','richtext'),
  ('sobre','historia_subtitulo_2','Um pouco de história...','text'),
  ('sobre','historia_texto_2','<p>A história do Laboratório Sobral começou a ser contada em 1911, com a abertura de uma botica na cidade de Amarante – Piauí, a Pharmacia Sobral. Em 1919 foi transferida pra Floriano, e aqui fixada. Em 1925 foi para sede própria onde está até hoje.</p>','richtext'),
  ('sobre','historia_texto_3','<p>Ao longo dos anos o pequeno negócio cresceu e, além da Pharmacia, que comercializava produtos próprios e de outras marcas, a botica transformou-se em um laboratório e pequena (e artesanal) indústria de medicamentos.</p>','richtext'),
  ('sobre','historia_texto_4','<p>Até que, em 1973, sob a gestão do economista e empreendedor Teodoro Ferreira Sobral Neto, a fábrica passou a ser continuamente ampliada e modernizada até chegar aos dias de hoje, em que é uma referência no cuidado da saúde dos brasileiros.</p>','richtext'),
  ('sobre','historia_imagem','/images/fachada.png','image')
ON CONFLICT (page, key) DO NOTHING;

-- Seed contato
INSERT INTO page_content (page, key, value, type) VALUES
  ('contato','unidade_fabril','<p><strong>Rua Bento Leão, 25, Centro</strong><br>Floriano | PI | CEP 64800-062.<br>Telefone: (89) 2101-2202</p>','richtext'),
  ('contato','escritorio_comercial','<p><strong>Avenida Elias João Tajra, 1601, Fátima</strong><br>Teresina | PI | CEP 64049-300<br>Telefone: (89) 99921-0283</p>','richtext'),
  ('contato','marketing_telefone','(89) 99999-9999','text'),
  ('contato','marketing_email','marketing@laboratoriosobral.com.br','text'),
  ('contato','atendimento_telefone','(89) 99999-9999','text'),
  ('contato','sac','0800 979 5040','text')
ON CONFLICT (page, key) DO NOTHING;

-- Slide inicial
INSERT INTO hero_slides (image_url, ordem, ativo)
SELECT '/images/hero-banner.png', 1, true
WHERE NOT EXISTS (SELECT 1 FROM hero_slides);
