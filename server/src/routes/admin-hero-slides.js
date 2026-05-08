const { Router } = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { normalizeLayers } = require('../utils/normalizeLayers');
const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, image_url, ordem, ativo, created_at, layers FROM hero_slides ORDER BY ordem ASC, id ASC');
    const out = rows.map(r => ({ ...r, layers: normalizeLayers(r.layers, r.image_url) }));
    res.json(out);
  } catch (err) {
    console.error('GET /api/admin/hero-slides:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/', async (req, res) => {
  const { image_url, ordem, layers } = req.body;
  if (typeof image_url !== 'string') return res.status(400).json({ error: 'image_url deve ser string.' });
  if (layers !== undefined && !Array.isArray(layers)) return res.status(400).json({ error: 'layers deve ser array.' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO hero_slides (image_url, ordem, layers) VALUES ($1, $2, $3) RETURNING *',
      [image_url, ordem ?? 99, JSON.stringify(layers ?? [])]
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await Promise.all(
      ids.map((id, index) =>
        client.query('UPDATE hero_slides SET ordem = $1 WHERE id = $2', [index + 1, id])
      )
    );
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('PUT /api/admin/hero-slides/reorder:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const { layers } = req.body;
  if (!Array.isArray(layers)) return res.status(400).json({ error: 'layers deve ser array.' });
  try {
    const { rows } = await pool.query(
      'UPDATE hero_slides SET layers = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(layers), req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Slide não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/admin/hero-slides/:id:', err.message);
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
