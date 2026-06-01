const { Router } = require('express');
const pool = require('../db');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page)     || 1);
    const perPage  = Math.min(50, Math.max(1, parseInt(req.query.per_page) || 12));
    const cat      = req.query.cat;
    const q        = req.query.q ? String(req.query.q).trim() : null;
    const offset   = (page - 1) * perPage;

    const params = [];
    const where  = ['ativo = TRUE'];

    if (cat && cat !== 'all') {
      params.push(cat);
      where.push(`category_id = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      where.push(`(name ILIKE $${params.length} OR tag ILIKE $${params.length} OR brand ILIKE $${params.length})`);
    }
    const ids = req.query.ids
      ? String(req.query.ids).split(',').map(s => s.trim()).filter(Boolean)
      : null;
    if (ids && ids.length) {
      params.push(ids);
      where.push(`id = ANY($${params.length})`);
    }
    if (req.query.destaque === 'true') {
      where.push('destaque = TRUE');
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM products ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);

    params.push(perPage, offset);
    const dataRes = await pool.query(
      `SELECT id, name, tag, category_id, brand, image, description,
              caracteristicas, apresentacao, modo_uso, precaucoes,
              ingredientes, disclaimer, nutri_porcoes, nutri_rows, ativo, destaque
       FROM products ${whereClause}
       ORDER BY name ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const totalPages = Math.ceil(total / perPage) || 1;
    res.json({
      data:       dataRes.rows,
      total,
      page:       Math.min(page, totalPages),
      totalPages,
    });
  } catch (err) {
    console.error('GET /api/products:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, tag, category_id, brand, image, description,
              caracteristicas, apresentacao, modo_uso, precaucoes,
              ingredientes, disclaimer, nutri_porcoes, nutri_rows, ativo, destaque
       FROM products WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/products/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
