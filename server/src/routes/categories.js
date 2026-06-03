const { Router } = require('express');
const pool = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.label, c.ordem, COUNT(p.id)::int AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id, c.label, c.ordem
      ORDER BY c.ordem ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/categories:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
