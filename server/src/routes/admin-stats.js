const { Router }  = require('express');
const pool        = require('../db');
const requireAuth = require('../middleware/requireAuth');

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const [active, inactive, byCategory, semCategoria, slides] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS n FROM products WHERE ativo = true'),
      pool.query('SELECT COUNT(*)::int AS n FROM products WHERE ativo = false'),
      pool.query(`
        SELECT c.id, c.label, COUNT(p.id)::int AS total
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id
        WHERE c.id != 'all'
        GROUP BY c.id, c.label, c.ordem
        ORDER BY c.ordem ASC
      `),
      pool.query('SELECT COUNT(*)::int AS n FROM products WHERE category_id IS NULL'),
      pool.query('SELECT COUNT(*)::int AS n FROM hero_slides WHERE ativo = true'),
    ]);
    // Produtos sem categoria entram como linha extra para o total continuar fechando.
    const porCategoria = [...byCategory.rows];
    if (semCategoria.rows[0].n > 0) {
      porCategoria.push({ id: '__sem_categoria', label: 'Sem categoria', total: semCategoria.rows[0].n });
    }

    res.json({
      totalActive:   active.rows[0].n,
      totalInactive: inactive.rows[0].n,
      byCategory:    porCategoria,
      slidesActive:  slides.rows[0].n,
    });
  } catch (err) {
    console.error('GET /api/admin/stats:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
