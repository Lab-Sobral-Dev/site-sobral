-- 011: otimização de índices e integridade
-- Remove índices redundantes e adiciona os que faltam para as consultas reais.

-- 1. Índice duplicado em products(category_id):
--    002 criou idx_products_category; 006 criou idx_products_category_id (mesma coluna).
DROP INDEX IF EXISTS idx_products_category_id;

-- 2. Índice redundante em page_content(page):
--    003 já tem UNIQUE (page, key), cujo B-tree composto atende WHERE page = $1.
DROP INDEX IF EXISTS idx_page_content_page;

-- 3. Índice composto para o filtro + ordenação principal do catálogo:
--    products.js -> WHERE ativo = TRUE ... ORDER BY name ASC
CREATE INDEX IF NOT EXISTS idx_products_ativo_name ON products(ativo, name);

-- 4. Ordenação/filtro por marca no admin.
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

-- 5. Busca textual (ILIKE '%q%') com curinga à esquerda: exige índice trigram.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm  ON products USING gin (name  gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON products USING gin (brand gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_tag_trgm   ON products USING gin (tag   gin_trgm_ops);

-- 6. Filtro + ordenação de misturinhas:
--    WHERE ativo = TRUE AND categoria = $1 ORDER BY categoria, ordem ASC
CREATE INDEX IF NOT EXISTS idx_misturinhas_cat_ordem ON misturinhas(categoria, ordem);

-- 7. Índice GIN para checar referências de product_id dentro de ingredientes (JSONB).
CREATE INDEX IF NOT EXISTS idx_misturinhas_ingredientes ON misturinhas USING gin (ingredientes);
