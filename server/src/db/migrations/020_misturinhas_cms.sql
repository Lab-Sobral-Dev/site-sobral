-- Torna editáveis os textos estáticos da página pública Misturinhas (hero,
-- guia de óleos e chamada para o Instagram), que até aqui ficavam hardcoded
-- no componente. O site já usa os mesmos valores como fallback no código.

INSERT INTO page_content (page, key, value, type) VALUES
  ('misturinhas','hero_titulo','Misturinhas','text'),
  ('misturinhas','hero_titulo_destaque','que mudam tudo.','text'),
  ('misturinhas','hero_subtitulo','<p>Combinações dos <strong>Óleos Sobral</strong> para turbinar sua rotina de pele e cabelo. Use sozinhos ou misturados — sua beleza agradece.</p>','richtext'),
  ('misturinhas','guia_titulo','12 óleos. Uma rotina.','text'),
  ('misturinhas','guia_subtitulo','Conheça rapidamente para que serve cada óleo da linha Sobral.','text'),
  ('misturinhas','cta_eyebrow','SUA RECEITA · NOSSO INSTAGRAM','text'),
  ('misturinhas','cta_titulo','Faça a sua e marque','text'),
  ('misturinhas','cta_titulo_destaque','@labsobral','text'),
  ('misturinhas','cta_texto','Mostre suas combinações no Instagram — quem sabe sua receita não vira a próxima dica oficial.','richtext'),
  ('misturinhas','cta_botao_label','@labsobral no Instagram','text'),
  ('misturinhas','cta_botao_url','https://instagram.com/labsobral','text'),
  ('misturinhas','cta_imagem','/images/misturinhas-hero-panel.png','image')
ON CONFLICT (page, key) DO NOTHING;
