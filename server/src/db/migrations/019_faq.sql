-- Cria a tabela de Perguntas Frequentes (FAQ) da página Fale Conosco,
-- substituindo os 6 pares fixos que existiam em page_content (page='contato').
-- Sem isso o admin ficava limitado a exatamente 6 perguntas, sem poder
-- adicionar, remover ou reordenar.

CREATE TABLE IF NOT EXISTS faq_perguntas (
  id         SERIAL       PRIMARY KEY,
  pergunta   TEXT         NOT NULL,
  resposta   TEXT         NOT NULL,
  ordem      SMALLINT     DEFAULT 0,
  ativo      BOOLEAN      DEFAULT TRUE,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO faq_perguntas (pergunta, resposta, ordem) VALUES
  ('Como falo com o SAC do Laboratório Sobral?', '<p>Pelo telefone gratuito <strong>0800 979 5040</strong>, pelo WhatsApp <strong>(89) 99460-6485</strong> ou pelo e-mail <strong>sac@laboratoriosobral.com.br</strong>. Você também pode usar o formulário no fim desta página.</p>', 1),
  ('Onde encontro os produtos Sobral?', '<p>Nossos produtos são distribuídos em farmácias e drogarias de todo o Brasil. Se não encontrar um item na sua região, fale com o SAC que indicamos o ponto de venda mais próximo.</p>', 2),
  ('O Laboratório Sobral ainda fabrica medicamentos?', '<p>Hoje o Sobral está focado em <strong>suplementos alimentares</strong> — em especial vitaminas e minerais — e em <strong>cosméticos</strong>, com a mesma tradição e qualidade de sempre, agora com foco na prevenção e no bem-estar.</p>', 3),
  ('Como agendo uma visita à indústria?', '<p>Fale com a gente pelo WhatsApp <strong>(89) 99927-0207</strong> e combinamos a melhor data para receber você ou seu grupo.</p>', 4),
  ('Como envio meu currículo para trabalhar no Sobral?', '<p>Envie seu currículo para <strong>rh@laboratoriosobral.com.br</strong>. As vagas abertas também são divulgadas nas nossas redes sociais.</p>', 5),
  ('Onde consulto o Relatório de Transparência Salarial?', '<p>O relatório fica disponível publicamente. Acesse pelo menu <strong>Fale Conosco → Relatório de Transparência Salarial</strong>, no topo do site.</p>', 6);

DELETE FROM page_content WHERE page = 'contato' AND key IN (
  'faq_1_p','faq_1_r','faq_2_p','faq_2_r','faq_3_p','faq_3_r',
  'faq_4_p','faq_4_r','faq_5_p','faq_5_r','faq_6_p','faq_6_r'
);
