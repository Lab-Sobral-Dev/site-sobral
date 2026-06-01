ALTER TABLE products ADD COLUMN IF NOT EXISTS destaque BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_destaque ON products(destaque) WHERE destaque = TRUE;
