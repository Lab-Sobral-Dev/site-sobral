const { Router }  = require('express');
const pool        = require('../db');
const requireAuth = require('../middleware/requireAuth');
const validate    = require('../middleware/validate');
const { registrar } = require('../lib/audit');

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

    const SORT_MAP = { name: 'name', brand: 'brand', category_id: 'category_id' };
    const sortField = SORT_MAP[req.query.sort] || 'name';
    const sortDir   = req.query.dir === 'desc' ? 'DESC' : 'ASC';

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
      `SELECT id, name, tag, category_id, brand, image, gallery, description,
              caracteristicas, apresentacao, modo_uso, precaucoes,
              ingredientes, disclaimer, nutri_porcoes, nutri_rows, ativo, destaque, video
       FROM products ${whereClause}
       ORDER BY ${sortField} ${sortDir}
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

const ACOES_BULK = ['ativar', 'desativar', 'mover_categoria', 'excluir'];
const LIMITE_BULK = 100;

// POST /api/admin/products/bulk
// Tudo numa transação: ou aplica em todos os ids, ou em nenhum. Um erro no
// meio de uma exclusão de 40 produtos não pode deixar metade pelo caminho.
router.post('/bulk', async (req, res) => {
  const { ids, acao, valor } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Informe ao menos um produto.' });
  }
  if (ids.length > LIMITE_BULK) {
    return res.status(400).json({ error: `No máximo ${LIMITE_BULK} produtos por vez.` });
  }
  if (!ACOES_BULK.includes(acao)) {
    return res.status(400).json({ error: 'Ação inválida.' });
  }

  const client = await pool.connect();
  try {
    // Validar o destino ANTES de abrir a transação evita rollback inútil.
    if (acao === 'mover_categoria') {
      if (!valor) return res.status(400).json({ error: 'Escolha a categoria de destino.' });
      const dst = await client.query('SELECT id FROM categories WHERE id = $1', [valor]);
      if (!dst.rowCount) return res.status(400).json({ error: 'Categoria de destino não encontrada.' });
    }

    await client.query('BEGIN');

    let afetados;
    if (acao === 'excluir') {
      const r = await client.query('DELETE FROM products WHERE id = ANY($1) RETURNING id', [ids]);
      afetados = r.rows;
    } else if (acao === 'mover_categoria') {
      const r = await client.query(
        'UPDATE products SET category_id = $1, updated_at = NOW() WHERE id = ANY($2) RETURNING id',
        [valor, ids]
      );
      afetados = r.rows;
    } else {
      const novo = acao === 'ativar';
      const r = await client.query(
        'UPDATE products SET ativo = $1, updated_at = NOW() WHERE id = ANY($2) RETURNING id',
        [novo, ids]
      );
      afetados = r.rows;
    }

    await client.query('COMMIT');

    // Auditoria fora da transação: falhar aqui não pode desfazer a operação.
    for (const linha of afetados) {
      await registrar(req, {
        acao: acao === 'excluir' ? 'delete' : 'update',
        entidade: 'product',
        entidade_id: linha.id,
        campo: `bulk:${acao}`,
        valor_novo: acao === 'mover_categoria' ? valor : (acao === 'ativar'),
      });
    }

    res.json({ ok: true, afetados: afetados.length });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Algum produto não pôde ser alterado por vínculo no banco.' });
    }
    console.error('POST /api/admin/products/bulk:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    client.release();
  }
});

// POST /api/admin/products/:id/duplicate
// A cópia referencia a MESMA imagem e galeria do original: nada é copiado em
// disco. É por isso que a limpeza de imagens órfãs precisa varrer todas as
// linhas antes de apagar um arquivo.
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { rows: orig } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!orig.length) return res.status(404).json({ error: 'Produto não encontrado.' });
    const p = orig[0];

    // Procura o primeiro sufixo livre: -copia, -copia-2, -copia-3…
    const base = `${p.id}-copia`;
    const { rows: usados } = await pool.query(
      'SELECT id FROM products WHERE id = $1 OR id LIKE $2',
      [base, `${base}-%`]
    );
    const tomados = new Set(usados.map(r => r.id));
    let novoId = base;
    for (let n = 2; tomados.has(novoId); n++) novoId = `${base}-${n}`;

    const { rows } = await pool.query(
      `INSERT INTO products(id, name, tag, category_id, brand, image, gallery, description,
                            caracteristicas, apresentacao, modo_uso, precaucoes,
                            ingredientes, disclaimer, nutri_porcoes, nutri_rows,
                            ativo, destaque, video)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,false,false,$17)
       RETURNING *`,
      [
        novoId, `${p.name} (cópia)`, p.tag, p.category_id, p.brand, p.image,
        JSON.stringify(p.gallery ?? []), p.description,
        p.caracteristicas, p.apresentacao, p.modo_uso, p.precaucoes,
        p.ingredientes, p.disclaimer, p.nutri_porcoes,
        p.nutri_rows ? JSON.stringify(p.nutri_rows) : null,
        p.video,
      ]
    );

    await registrar(req, {
      acao: 'create', entidade: 'product', entidade_id: novoId,
      campo: 'duplicate', valor_anterior: { origem: p.id }, valor_novo: rows[0],
    });
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Já existe um produto com esse ID.' });
    console.error('POST /api/admin/products/:id/duplicate:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /api/admin/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, tag, category_id, brand, image, gallery, description,
              caracteristicas, apresentacao, modo_uso, precaucoes,
              ingredientes, disclaimer, nutri_porcoes, nutri_rows, ativo, destaque, video
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
router.post('/', validate(['id', 'name']), async (req, res) => {
  const { id, name, tag, category_id, brand, image, gallery, description,
          caracteristicas, apresentacao, modo_uso, precaucoes,
          ingredientes, disclaimer, nutri_porcoes, nutri_rows, destaque, video } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO products(id, name, tag, category_id, brand, image, gallery, description,
                            caracteristicas, apresentacao, modo_uso, precaucoes,
                            ingredientes, disclaimer, nutri_porcoes, nutri_rows, destaque, video)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [
        id, name, tag || null, category_id || null, brand || null, image || null,
        Array.isArray(gallery) ? JSON.stringify(gallery) : '[]',
        description || null,
        caracteristicas || null, apresentacao || null, modo_uso || null, precaucoes || null,
        ingredientes || null, disclaimer || null, nutri_porcoes || null,
        nutri_rows ? JSON.stringify(nutri_rows) : null,
        destaque === true,
        video || null,
      ]
    );
    await registrar(req, {
      acao: 'create', entidade: 'product', entidade_id: rows[0].id,
      valor_novo: rows[0],
    });
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'ID já existe.' });
    if (err.code === '23503') return res.status(400).json({ error: 'Categoria informada não existe.' });
    console.error('POST /api/admin/products:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// PUT /api/admin/products/:id
router.put('/:id', validate(['name']), async (req, res) => {
  const { name, tag, category_id, brand, image, gallery, description,
          caracteristicas, apresentacao, modo_uso, precaucoes,
          ingredientes, disclaimer, nutri_porcoes, nutri_rows, ativo, destaque, video } = req.body;
  try {
    const anterior = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    const { rows } = await pool.query(
      `UPDATE products SET
         name=$1, tag=$2, category_id=$3, brand=$4, image=$5, gallery=$6, description=$7,
         caracteristicas=$8, apresentacao=$9, modo_uso=$10, precaucoes=$11,
         ingredientes=$12, disclaimer=$13, nutri_porcoes=$14, nutri_rows=$15,
         ativo=$16, destaque=$17, video=$18, updated_at=NOW()
       WHERE id=$19 RETURNING *`,
      [
        name, tag || null, category_id || null, brand || null, image || null,
        Array.isArray(gallery) ? JSON.stringify(gallery) : '[]',
        description || null,
        caracteristicas || null, apresentacao || null, modo_uso || null, precaucoes || null,
        ingredientes || null, disclaimer || null, nutri_porcoes || null,
        nutri_rows ? JSON.stringify(nutri_rows) : null,
        ativo !== undefined ? ativo : true,
        destaque === true,
        video || null,
        req.params.id,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'Produto não encontrado.' });
    await registrar(req, {
      acao: 'update', entidade: 'product', entidade_id: req.params.id,
      valor_anterior: anterior.rows[0] ?? null, valor_novo: rows[0],
    });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: 'Categoria informada não existe.' });
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
    await registrar(req, {
      acao: 'update', entidade: 'product', entidade_id: req.params.id,
      campo: 'ativo', valor_novo: rows[0].ativo,
    });
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/admin/products/:id/ativo:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Produto não encontrado.' });
    await registrar(req, {
      acao: 'delete', entidade: 'product', entidade_id: req.params.id,
      valor_anterior: rows[0],
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/products/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
