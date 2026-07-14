-- Define missão, visão e valores oficiais da página "Quem Somos" (texto do site antigo).
-- O upsert força o conteúdo correto no banco mesmo que o CMS tenha sido editado antes.
INSERT INTO page_content (page, key, value, type) VALUES
  ('sobre','missao','<p>Contribuir com a saúde e a qualidade de vida das famílias brasileiras.</p>','richtext'),
  ('sobre','visao','<p>Continuar a expansão do negócio, tornando-se referência nos segmentos de suplementos alimentares e cosméticos.</p>','richtext'),
  ('sobre','valores','<p>Compromisso, qualidade, respeito, entusiasmo, credibilidade, perseverança e orgulho nordestino.</p>','richtext')
ON CONFLICT (page, key) DO UPDATE SET
  value      = EXCLUDED.value,
  type       = EXCLUDED.type,
  updated_at = NOW();
