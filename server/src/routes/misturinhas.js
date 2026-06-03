const { Router } = require('express');
const pool = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const params = [];
    const where  = ['ativo = TRUE'];

    if (req.query.categoria) {
      params.push(req.query.categoria);
      where.push(`categoria = $${params.length}`);
    }
    if (req.query.oleo) {
      params.push(JSON.stringify([{ product_id: req.query.oleo }]));
      where.push(`ingredientes @> $${params.length}::jsonb`);
    }

    const { rows } = await pool.query(
      `SELECT * FROM misturinhas WHERE ${where.join(' AND ')} ORDER BY categoria, ordem ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/misturinhas:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
