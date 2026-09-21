CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(160) NOT NULL UNIQUE,
  nome          VARCHAR(120) NOT NULL,
  senha_hash    VARCHAR(120) NOT NULL,
  papel         VARCHAR(20)  NOT NULL DEFAULT 'editor'
                CHECK (papel IN ('admin','editor')),
  ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
  ultimo_login  TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email_ativo
  ON admin_users(email) WHERE ativo;
