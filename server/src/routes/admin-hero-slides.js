const { Router } = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');
const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM hero_slides ORDER BY ordem ASC, id ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/hero-slides:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/', async (req, res) => {
  const { image_url, ordem } = req.body;
  if (!image_url) return res.status(400).json({ error: 'image_url obrigatório.' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO hero_slides (image_url, ordem) VALUES ($1, $2) RETURNING *',
      [image_url, ordem ?? 99]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/admin/hero-slides:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /reorder deve vir ANTES de PATCH /:id/ativo para evitar conflito de rota
router.put('/reorder', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids deve ser array.' });
  try {
    await Promise.all(
      ids.map((id, index) =>
        pool.query('UPDATE hero_slides SET ordem = $1 WHERE id = $2', [index + 1, id])
      )
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/admin/hero-slides/reorder:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.patch('/:id/ativo', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE hero_slides SET ativo = NOT ativo WHERE id = $1 RETURNING id, ativo',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Slide não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/admin/hero-slides/:id/ativo:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM hero_slides WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Slide não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/hero-slides/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
