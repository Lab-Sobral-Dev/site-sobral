const { Router }   = require('express');
const bcrypt       = require('bcryptjs');
const pool         = require('../db');
const requireAuth  = require('../middleware/requireAuth');
const requirePapel = require('../middleware/requirePapel');
const validate     = require('../middleware/validate');
const { registrar } = require('../lib/audit');

const router = Router();
router.use(requireAuth);

const SENHA_MINIMA = 8;
const CAMPOS = 'id, email, nome, papel, ativo, ultimo_login, criado_em';

// Troca da própria senha: qualquer papel. Declarada ANTES do requirePapel
// abaixo (senão um editor não conseguiria trocar a própria senha) e antes de
// /:id (senão o Express leria "me" como id).
router.put('/me/senha', validate(['senha_atual', 'senha_nova']), async (req, res) => {
  const { senha_atual, senha_nova } = req.body;

  if (String(senha_nova).length < SENHA_MINIMA) {
    return res.status(400).json({ error: `A nova senha precisa de ao menos ${SENHA_MINIMA} caracteres.` });
  }
  if (!req.admin.id) {
    return res.status(400).json({ error: 'Sessão de recuperação não permite trocar senha. Crie um usuário primeiro.' });
  }

  try {
    const { rows } = await pool.query('SELECT senha_hash FROM admin_users WHERE id = $1', [req.admin.id]);
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const ok = await bcrypt.compare(senha_atual, rows[0].senha_hash);
    if (!ok) return res.status(401).json({ error: 'Senha atual incorreta.' });

    await pool.query('UPDATE admin_users SET senha_hash = $1 WHERE id = $2',
      [bcrypt.hashSync(senha_nova, 10), req.admin.id]);

    // A senha em si nunca entra no histórico.
    await registrar(req, {
      acao: 'update', entidade: 'user', entidade_id: String(req.admin.id), campo: 'senha',
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/admin/users/me/senha:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// Daqui para baixo, só papel admin.
router.use(requirePapel('admin'));

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${CAMPOS} FROM admin_users ORDER BY criado_em ASC`);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/admin/users:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/', validate(['email', 'nome', 'senha']), async (req, res) => {
  const email = String(req.body.email).trim().toLowerCase();
  const { nome, senha } = req.body;
  const papel = req.body.papel === 'admin' ? 'admin' : 'editor';

  if (String(senha).length < SENHA_MINIMA) {
    return res.status(400).json({ error: `A senha precisa de ao menos ${SENHA_MINIMA} caracteres.` });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO admin_users (email, nome, senha_hash, papel, ativo)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING ${CAMPOS}`,
      [email, nome, bcrypt.hashSync(senha, 10), papel]
    );
    await registrar(req, {
      acao: 'create', entidade: 'user', entidade_id: String(rows[0].id), valor_novo: rows[0],
    });
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Já existe um usuário com esse e-mail.' });
    console.error('POST /api/admin/users:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.put('/:id', validate(['nome']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const { nome } = req.body;
  const papel = req.body.papel === 'admin' ? 'admin' : 'editor';
  const ativo = req.body.ativo !== false;

  // Desativar a si mesmo é sempre proibido. Rebaixar-se é permitido desde que
  // sobre outro administrador ativo — quem garante isso é a trava dentro da
  // transação, mais abaixo.
  if (id === req.admin.id && !ativo) {
    return res.status(400).json({ error: 'Você não pode desativar a si mesmo.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const anterior = await client.query(`SELECT ${CAMPOS} FROM admin_users WHERE id = $1 FOR UPDATE`, [id]);
    if (!anterior.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const { rows } = await client.query(
      `UPDATE admin_users SET nome = $1, papel = $2, ativo = $3 WHERE id = $4 RETURNING ${CAMPOS}`,
      [nome, papel, ativo, id]
    );

    // Trava verificada DENTRO da transação: nunca pode sobrar zero admin ativo.
    const { rows: cont } = await client.query(
      "SELECT COUNT(*)::int AS n FROM admin_users WHERE ativo AND papel = 'admin'"
    );
    if (cont[0].n === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'É preciso manter ao menos um administrador ativo.' });
    }

    await client.query('COMMIT');
    await registrar(req, {
      acao: 'update', entidade: 'user', entidade_id: String(id),
      valor_anterior: anterior.rows[0], valor_novo: rows[0],
    });
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('PUT /api/admin/users/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(404).json({ error: 'Usuário não encontrado.' });
  if (id === req.admin.id) {
    return res.status(400).json({ error: 'Você não pode excluir a si mesmo.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `DELETE FROM admin_users WHERE id = $1 RETURNING ${CAMPOS}`, [id]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const { rows: cont } = await client.query(
      "SELECT COUNT(*)::int AS n FROM admin_users WHERE ativo AND papel = 'admin'"
    );
    if (cont[0].n === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'É preciso manter ao menos um administrador ativo.' });
    }

    await client.query('COMMIT');
    await registrar(req, {
      acao: 'delete', entidade: 'user', entidade_id: String(id), valor_anterior: rows[0],
    });
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('DELETE /api/admin/users/:id:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  } finally {
    client.release();
  }
});

module.exports = router;
