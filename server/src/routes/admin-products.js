const { Router }  = require('express');
const pool        = require('../db');
const requireAuth = require('../middleware/requireAuth');
const validate    = require('../middleware/validate');

const router = Router();
router.use(requireAuth);

// GET /api/admin/products — todos os produtos, inclusive inativos
router.get('/', async (req, res) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(req.query.per_page) || 20));
    const q       = req.query.q ? String(req.query.q).trim() : null;
    const cat     = req.query.cat;
    const offset  = (page - 1) * perPage;

    const params = [];
    const where  = [];

    if (cat && cat !== 'all') {
      params.push(cat);
      where.push(`category_id = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      where.push(`(name ILIKE $${params.length} OR tag ILIKE $${params.length} OR brand ILIKE $${params.length})`);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countRes = await pool.query(`SELECT COUNT(*) FROM products ${whereClause}`, params);
    const total    = parseInt(countRes.rows[0].count);

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
    res.json({ data: dataRes.rows, total, page: Math.min(page, totalPages), totalPages });
  } catch (err) {
    console.error('GET /api/admin/products:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /api/admin/products/:id
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
    console.error('GET /api/admin/products/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/admin/products
router.post('/', validate(['id', 'name', 'category_id']), async (req, res) => {
  const { id, name, tag, category_id, brand, image, description,
          caracteristicas, apresentacao, modo_uso, precaucoes,
          ingredientes, disclaimer, nutri_porcoes, nutri_rows, destaque } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO products(id, name, tag, category_id, brand, image, description,
                            caracteristicas, apresentacao, modo_uso, precaucoes,
                            ingredientes, disclaimer, nutri_porcoes, nutri_rows, destaque)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        id, name, tag || null, category_id, brand || null, image || null, description || null,
        caracteristicas || null, apresentacao || null, modo_uso || null, precaucoes || null,
        ingredientes || null, disclaimer || null, nutri_porcoes || null,
        nutri_rows ? JSON.stringify(nutri_rows) : null,
        destaque === true,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'ID já existe.' });
    console.error('POST /api/admin/products:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /api/admin/products/:id
router.put('/:id', validate(['name', 'category_id']), async (req, res) => {
  const { name, tag, category_id, brand, image, description,
          caracteristicas, apresentacao, modo_uso, precaucoes,
          ingredientes, disclaimer, nutri_porcoes, nutri_rows, ativo, destaque } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE products SET
         name=$1, tag=$2, category_id=$3, brand=$4, image=$5, description=$6,
         caracteristicas=$7, apresentacao=$8, modo_uso=$9, precaucoes=$10,
         ingredientes=$11, disclaimer=$12, nutri_porcoes=$13, nutri_rows=$14,
         ativo=$15, destaque=$16, updated_at=NOW()
       WHERE id=$17 RETURNING *`,
      [
        name, tag || null, category_id, brand || null, image || null, description || null,
        caracteristicas || null, apresentacao || null, modo_uso || null, precaucoes || null,
        ingredientes || null, disclaimer || null, nutri_porcoes || null,
        nutri_rows ? JSON.stringify(nutri_rows) : null,
        ativo !== undefined ? ativo : true,
        destaque === true,
        req.params.id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/admin/products/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PATCH /api/admin/products/:id/ativo — toggle ativo/inativo
router.patch('/:id/ativo', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE products SET ativo = NOT ativo, updated_at = NOW()
       WHERE id = $1 RETURNING id, ativo`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/admin/products/:id/ativo:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/products/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
