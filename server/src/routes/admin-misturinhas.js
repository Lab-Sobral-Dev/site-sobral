const { Router }  = require('express');
const pool        = require('../db');
const requireAuth = require('../middleware/requireAuth');
const validate    = require('../middleware/validate');

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM misturinhas ORDER BY categoria, ordem ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/misturinhas:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/', validate(['titulo', 'categoria']), async (req, res) => {
  const { titulo, categoria, aplicacao, resultado, ingredientes, ordem } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO misturinhas (titulo, categoria, aplicacao, resultado, ingredientes, ordem)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [titulo, categoria, aplicacao || null, resultado || null,
       JSON.stringify(Array.isArray(ingredientes) ? ingredientes : []),
       Number(ordem) || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/admin/misturinhas:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.put('/:id', validate(['titulo', 'categoria']), async (req, res) => {
  const { titulo, categoria, aplicacao, resultado, ingredientes, ordem, ativo } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE misturinhas SET titulo=$1, categoria=$2, aplicacao=$3, resultado=$4,
         ingredientes=$5, ordem=$6, ativo=$7
       WHERE id=$8 RETURNING *`,
      [titulo, categoria, aplicacao || null, resultado || null,
       JSON.stringify(Array.isArray(ingredientes) ? ingredientes : []),
       Number(ordem) || 0, ativo !== false, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/admin/misturinhas/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.patch('/:id/ativo', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE misturinhas SET ativo = NOT ativo WHERE id=$1 RETURNING id, ativo',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/admin/misturinhas/:id/ativo:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM misturinhas WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Não encontrada.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/misturinhas/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
