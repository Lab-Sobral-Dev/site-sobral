const { Router }  = require('express');
const pool        = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { registrar } = require('../lib/audit');

const router = Router();
router.use(requireAuth);

// GET /api/admin/audit — histórico paginado, do mais recente para o mais antigo
router.get('/', async (req, res) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(req.query.per_page) || 25));
    const offset  = (page - 1) * perPage;

    const params = [];
    const where  = [];
    const filtro = (coluna, valor) => {
      if (!valor) return;
      params.push(valor);
      where.push(`${coluna} = $${params.length}`);
    };

    filtro('entidade',    req.query.entidade);
    filtro('entidade_id', req.query.entidade_id);
    filtro('campo',       req.query.campo);
    filtro('user_email',  req.query.user_email);
    filtro('acao',        req.query.acao);

    if (req.query.de)  { params.push(req.query.de);  where.push(`criado_em >= $${params.length}`); }
    if (req.query.ate) { params.push(req.query.ate); where.push(`criado_em <= $${params.length}`); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countRes = await pool.query(`SELECT COUNT(*) FROM audit_log ${whereClause}`, params);
    const total    = parseInt(countRes.rows[0].count);

    params.push(perPage, offset);
    const dataRes = await pool.query(
      `SELECT id, user_id, user_email, acao, entidade, entidade_id, campo,
              valor_anterior, valor_novo, ip, criado_em
       FROM audit_log ${whereClause}
       ORDER BY criado_em DESC, id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const totalPages = Math.ceil(total / perPage) || 1;
    res.json({ data: dataRes.rows, total, page: Math.min(page, totalPages), totalPages });
  } catch (err) {
    console.error('GET /api/admin/audit:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/admin/audit/:id/restore
// Só conteúdo de CMS. Produto, categoria e slide têm vínculos e estado demais
// para uma restauração cega ser segura — foi decisão explícita do escopo.
router.post('/:id/restore', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Registro não encontrado.' });

  try {
    const { rows } = await pool.query('SELECT * FROM audit_log WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Registro não encontrado.' });

    const log = rows[0];
    if (log.entidade !== 'content') {
      return res.status(400).json({
        error: 'Só é possível restaurar campos de conteúdo das páginas.',
      });
    }
    if (!log.campo) {
      return res.status(400).json({ error: 'Registro sem campo identificado.' });
    }

    const pagina = log.entidade_id;
    const chave  = log.campo;
    const alvo   = log.valor_anterior ?? '';

    const atual = await pool.query(
      'SELECT value FROM page_content WHERE page = $1 AND key = $2', [pagina, chave]
    );

    await pool.query(
      `INSERT INTO page_content (page, key, value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (page, key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = NOW()`,
      [pagina, chave, alvo]
    );

    // A própria restauração vira histórico: dá para desfazer a desfeita.
    await registrar(req, {
      acao: 'restore', entidade: 'content', entidade_id: pagina, campo: chave,
      valor_anterior: atual.rows[0]?.value ?? null,
      valor_novo: alvo,
    });

    res.json({ ok: true, page: pagina, key: chave, value: alvo });
  } catch (err) {
    console.error('POST /api/admin/audit/:id/restore:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;
