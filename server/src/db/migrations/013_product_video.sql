-- Vídeo do produto (URL de embed do YouTube), exibido na página de detalhe.
ALTER TABLE products ADD COLUMN IF NOT EXISTS video VARCHAR(300);

-- Vídeos migrados do site institucional antigo (laboratoriosobral.com.br).
-- Só preenche onde ainda está vazio, para não sobrescrever edição feita no admin.
UPDATE products SET video = v.url, updated_at = NOW()
FROM (VALUES
  ('aqualema',           'https://www.youtube.com/embed/56rFNfbPOyU'),
  ('calciolax-articule', 'https://www.youtube.com/embed/K6Fdd_2_id8'),
  ('calciolax-fixa',     'https://www.youtube.com/embed/csq00dd1S8g'),
  ('laxdose',            'https://www.youtube.com/embed/eL3L09OILvg'),
  ('laxdose-kids',       'https://www.youtube.com/embed/eL3L09OILvg'),
  ('oleo-girassol-age',  'https://www.youtube.com/embed/EvUP5dfTwFk')
) AS v(id, url)
WHERE products.id = v.id AND (products.video IS NULL OR products.video = '');
