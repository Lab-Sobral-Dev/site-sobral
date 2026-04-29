CREATE TABLE IF NOT EXISTS products (
  id              VARCHAR(100) PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  tag             VARCHAR(200),
  category_id     VARCHAR(50)  REFERENCES categories(id),
  brand           VARCHAR(100),
  image           VARCHAR(300),
  description     TEXT,
  caracteristicas TEXT[],
  apresentacao    TEXT,
  modo_uso        TEXT,
  precaucoes      TEXT,
  ingredientes    TEXT,
  disclaimer      TEXT,
  nutri_porcoes   TEXT,
  nutri_rows      JSONB,
  ativo           BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_ativo    ON products(ativo);
