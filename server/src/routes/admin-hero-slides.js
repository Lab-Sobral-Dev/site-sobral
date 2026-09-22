const { Router } = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { normalizeLayers } = require('../utils/normalizeLayers');
const { registrar } = require('../lib/audit');
const { removerVarias } = require('../lib/imagens');
const router = Router();

// As camadas são objetos; só as de imagem têm url.
function urlsDasCamadas(layers) {
  if (!Array.isArray(layers)) return [];
  return layers.filter(l => l && l.type === 'image' && l.url).map(l => l.url);
}
router.use(requireAuth);

// hero_slides.id é SERIAL (inteiro). Rejeita id não-numérico com 404 em vez de
// deixar o Postgres lançar 22P02 (que viraria 500).
router.param('id', (req, res, next, val) => {
  const id = Number(val);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Slide não encontrado.' });
  req.slideId = id;
  next();
});

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
  if (typeof image_url !== 'string' || image_url.trim() === '') {
    return res.status(400).json({ error: 'image_url é obrigatório.' });
  }
  if (layers !== undefined && !Array.isArray(layers)) return res.status(400).json({ error: 'layers deve ser array.' });
  const ordemNum = Number.isFinite(Number(ordem)) ? Number(ordem) : 99;
  try {
    const { rows } = await pool.query(
      'INSERT INTO hero_slides (image_url, ordem, layers) VALUES ($1, $2, $3) RETURNING *',
      [image_url, ordemNum, JSON.stringify(layers ?? [])]
    );
    await registrar(req, {
      acao: 'create', entidade: 'hero_slide', entidade_id: String(rows[0].id),
      valor_novo: rows[0],
    });
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
    await registrar(req, {
      acao: 'update', entidade: 'hero_slide', entidade_id: 'reorder',
      campo: 'ordem', valor_novo: ids,
    });
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
    const anterior = await pool.query('SELECT * FROM hero_slides WHERE id = $1', [req.slideId]);
    const { rows } = await pool.query(
      'UPDATE hero_slides SET layers = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(layers), req.slideId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Slide não encontrado.' });
    await registrar(req, {
      acao: 'update', entidade: 'hero_slide', entidade_id: String(req.slideId),
      valor_anterior: anterior.rows[0] ?? null, valor_novo: rows[0],
    });

    // Depois do UPDATE confirmado: consultar antes veria a própria linha
    // antiga como referência e nunca apagaria nada.
    const antes = anterior.rows[0];
    if (antes) {
      const antigas = [antes.image_url, ...urlsDasCamadas(antes.layers)];
      const atuais  = new Set([rows[0].image_url, ...urlsDasCamadas(rows[0].layers)]);
      await removerVarias(req, antigas.filter(u => u && !atuais.has(u)));
    }

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
      [req.slideId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Slide não encontrado.' });
    await registrar(req, {
      acao: 'update', entidade: 'hero_slide', entidade_id: String(req.slideId),
      campo: 'ativo', valor_novo: rows[0].ativo,
    });
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/admin/hero-slides/:id/ativo:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM hero_slides WHERE id = $1 RETURNING *', [req.slideId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Slide não encontrado.' });
    await registrar(req, {
      acao: 'delete', entidade: 'hero_slide', entidade_id: String(req.slideId),
      valor_anterior: rows[0],
    });
    await removerVarias(req, [rows[0].image_url, ...urlsDasCamadas(rows[0].layers)]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/hero-slides/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
