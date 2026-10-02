-- Lançamento passa a ser escolha do cadastro: o produto fica marcado até
-- lancamento_ate (30 dias após a marcação) ou até desmarcarem no painel.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS lancamento_ate TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lancamento_cor TEXT;

-- Preserva o comportamento anterior: quem ainda estava nos 30 dias após o
-- cadastro continua como lançamento até completar a janela.
UPDATE products
SET lancamento_ate = created_at + INTERVAL '30 days'
WHERE created_at + INTERVAL '30 days' > NOW() AND lancamento_ate IS NULL;
