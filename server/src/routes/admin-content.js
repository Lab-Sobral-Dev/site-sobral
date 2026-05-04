const { Router } = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');
const router = Router();
router.use(requireAuth);

router.get('/:page', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT key, value, type FROM page_content WHERE page = $1 ORDER BY id ASC',
      [req.params.page]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/content/:page:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.put('/:page/:key', async (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'Campo "value" obrigatório.' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO page_content (page, key, value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (page, key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = NOW()
       RETURNING *`,
      [req.params.page, req.params.key, value]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/admin/content/:page/:key:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
