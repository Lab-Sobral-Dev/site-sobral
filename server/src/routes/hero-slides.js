const { Router } = require('express');
const pool = require('../db');
const { normalizeLayers } = require('../utils/normalizeLayers');
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, image_url, ordem, layers FROM hero_slides WHERE ativo = true ORDER BY ordem ASC, id ASC'
    );
    const out = rows.map(r => ({ ...r, layers: normalizeLayers(r.layers, r.image_url) }));
    res.json(out);
  } catch (err) {
    console.error('GET /api/hero-slides:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
