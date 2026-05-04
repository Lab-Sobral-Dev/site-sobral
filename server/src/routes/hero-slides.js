const { Router } = require('express');
const pool = require('../db');
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, image_url, ordem FROM hero_slides WHERE ativo = true ORDER BY ordem ASC, id ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/hero-slides:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
