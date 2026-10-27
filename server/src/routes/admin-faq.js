const { Router }  = require('express');
const pool        = require('../db');
const requireAuth = require('../middleware/requireAuth');
const validate    = require('../middleware/validate');
const { registrar } = require('../lib/audit');

const router = Router();
router.use(requireAuth);

// faq_perguntas.id é SERIAL (inteiro). Rejeita id não-numérico com 404.
router.param('id', (req, res, next, val) => {
  const id = Number(val);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Pergunta não encontrada.' });
  req.faqId = id;
  next();
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM faq_perguntas ORDER BY ordem ASC, id ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/faq:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/', validate(['pergunta', 'resposta']), async (req, res) => {
  const { pergunta, resposta } = req.body;
  try {
    const { rows: max } = await pool.query('SELECT COALESCE(MAX(ordem), 0) AS max FROM faq_perguntas');
    const ordem = Number(max[0].max) + 1;
    const { rows } = await pool.query(
      'INSERT INTO faq_perguntas (pergunta, resposta, ordem) VALUES ($1, $2, $3) RETURNING *',
      [pergunta, resposta, ordem]
    );
    await registrar(req, {
      acao: 'create', entidade: 'faq', entidade_id: String(rows[0].id),
      valor_novo: rows[0],
    });
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/admin/faq:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /reorder deve vir ANTES de PUT /:id para evitar conflito de rota
router.put('/reorder', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids deve ser array.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await Promise.all(
      ids.map((id, index) =>
        client.query('UPDATE faq_perguntas SET ordem = $1 WHERE id = $2', [index + 1, id])
      )
    );
    await client.query('COMMIT');
    await registrar(req, {
      acao: 'update', entidade: 'faq', entidade_id: 'reorder',
      campo: 'ordem', valor_novo: ids,
    });
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('PUT /api/admin/faq/reorder:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    client.release();
  }
});

router.put('/:id', validate(['pergunta', 'resposta']), async (req, res) => {
  const { pergunta, resposta } = req.body;
  try {
    const anterior = await pool.query('SELECT * FROM faq_perguntas WHERE id = $1', [req.faqId]);
    if (!anterior.rows.length) return res.status(404).json({ error: 'Pergunta não encontrada.' });
    const { rows } = await pool.query(
      'UPDATE faq_perguntas SET pergunta = $1, resposta = $2 WHERE id = $3 RETURNING *',
      [pergunta, resposta, req.faqId]
    );
    await registrar(req, {
      acao: 'update', entidade: 'faq', entidade_id: String(req.faqId),
      valor_anterior: anterior.rows[0], valor_novo: rows[0],
    });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/admin/faq/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.patch('/:id/ativo', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE faq_perguntas SET ativo = NOT ativo WHERE id = $1 RETURNING id, ativo',
      [req.faqId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pergunta não encontrada.' });
    await registrar(req, {
      acao: 'update', entidade: 'faq', entidade_id: String(req.faqId),
      campo: 'ativo', valor_novo: rows[0].ativo,
    });
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/admin/faq/:id/ativo:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM faq_perguntas WHERE id = $1 RETURNING *', [req.faqId]);
    if (!rows.length) return res.status(404).json({ error: 'Pergunta não encontrada.' });
    await registrar(req, {
      acao: 'delete', entidade: 'faq', entidade_id: String(req.faqId),
      valor_anterior: rows[0],
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/faq/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
