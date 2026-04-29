const { Router }  = require('express');
const pool        = require('../db');
const requireAuth = require('../middleware/requireAuth');
const validate    = require('../middleware/validate');

const router = Router();
router.use(requireAuth);

// POST /api/admin/categories
router.post('/', validate(['id', 'label']), async (req, res) => {
  const { id, label, ordem } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO categories(id, label, ordem) VALUES($1,$2,$3) RETURNING *',
      [id, label, ordem ?? 99]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'ID já existe.' });
    console.error('POST /api/admin/categories:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /api/admin/categories/:id
router.put('/:id', validate(['label']), async (req, res) => {
  const { label, ordem } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE categories SET label=$1, ordem=$2 WHERE id=$3 RETURNING *',
      [label, ordem ?? 0, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Categoria não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/admin/categories/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// DELETE /api/admin/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM categories WHERE id = $1',
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Categoria não encontrada.' });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Categoria possui produtos vinculados. Remova-os primeiro.' });
    }
    console.error('DELETE /api/admin/categories/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
