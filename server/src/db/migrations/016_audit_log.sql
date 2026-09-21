CREATE TABLE IF NOT EXISTS audit_log (
  id              BIGSERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  user_email      VARCHAR(160) NOT NULL,
  acao            VARCHAR(20)  NOT NULL,
  entidade        VARCHAR(30)  NOT NULL,
  entidade_id     VARCHAR(160),
  campo           VARCHAR(80),
  valor_anterior  JSONB,
  valor_novo      JSONB,
  ip              VARCHAR(60),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_criado_em
  ON audit_log(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entidade
  ON audit_log(entidade, entidade_id, criado_em DESC);
