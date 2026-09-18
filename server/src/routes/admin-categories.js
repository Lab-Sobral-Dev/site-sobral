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

// DELETE /api/admin/categories/:id[?move_to=<id>]
// Sem move_to: só remove categorias sem produtos vinculados (FK barra o resto).
// Com move_to: move os produtos para a categoria de destino e remove, em transação.
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const moveTo = String(req.query.move_to || '').trim();

  if (id === 'all') {
    return res.status(403).json({ error: 'A categoria "Todos" é reservada e não pode ser removida.' });
  }
  if (moveTo === id) {
    return res.status(400).json({ error: 'A categoria de destino deve ser diferente da que será removida.' });
  }
  if (moveTo === 'all') {
    return res.status(400).json({ error: 'A categoria "Todos" é reservada e não pode receber produtos.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const origem = await client.query('SELECT id FROM categories WHERE id = $1 FOR UPDATE', [id]);
    if (!origem.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }

    let moved = 0;
    if (moveTo) {
      const destino = await client.query('SELECT id FROM categories WHERE id = $1', [moveTo]);
      if (!destino.rowCount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Categoria de destino não encontrada.' });
      }
      const upd = await client.query(
        'UPDATE products SET category_id = $1, updated_at = NOW() WHERE category_id = $2',
        [moveTo, id]
      );
      moved = upd.rowCount;
    }

    await client.query('DELETE FROM categories WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ ok: true, moved });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Categoria possui produtos vinculados. Escolha uma categoria de destino para eles.' });
    }
    console.error('DELETE /api/admin/categories/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    client.release();
  }
});

module.exports = router;
