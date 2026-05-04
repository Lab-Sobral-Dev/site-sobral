const { Router } = require('express');
const pool = require('../db');
const router = Router();

router.get('/:page', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT key, value FROM page_content WHERE page = $1',
      [req.params.page]
    );
    const result = {};
    rows.forEach(r => { result[r.key] = r.value; });
    res.json(result);
  } catch (err) {
    console.error('GET /api/content/:page:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
