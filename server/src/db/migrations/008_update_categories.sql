-- Insere as novas categorias (calciolax e movimex) se ainda não existirem
INSERT INTO categories(id, label, ordem) VALUES
  ('calciolax', 'Calciolax', 2),
  ('movimex',   'Movimex',   3)
ON CONFLICT(id) DO NOTHING;

-- Ajusta a ordem das categorias mantidas
UPDATE categories SET ordem = 1 WHERE id = 'tradicionais';
UPDATE categories SET ordem = 4 WHERE id = 'oleos';

-- Reatribui produtos por marca antes do catch-all
UPDATE products SET category_id = 'calciolax' WHERE brand = 'Calciolax';
UPDATE products SET category_id = 'movimex'   WHERE brand = 'Movimex';

-- Move todos os produtos remanescentes das categorias removidas para tradicionais
UPDATE products SET category_id = 'tradicionais'
WHERE category_id IN ('suplementos', 'infantil', 'cosmeticos');

-- Remove as categorias que não existem mais (sem produtos vinculados agora)
DELETE FROM categories WHERE id IN ('suplementos', 'infantil', 'cosmeticos');
