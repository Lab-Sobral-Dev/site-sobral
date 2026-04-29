const { Router } = require('express');
const pool = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, label, ordem FROM categories ORDER BY ordem ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/categories:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
