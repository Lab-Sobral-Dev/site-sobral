const jwt  = require('jsonwebtoken');
const pool = require('../db');

// Resolve o usuário do token contra a tabela admin_users.
// Recuperação: se NÃO houver nenhum usuário ativo (tabela vazia, ou a migration
// ainda não rodou), a credencial do .env volta a valer. Existindo qualquer
// usuário ativo, esse caminho se fecha sozinho.
async function resolverAdmin(email) {
  const alvo = String(email || '').trim().toLowerCase();
  if (!alvo) return null;

  try {
    const { rows } = await pool.query(
      `SELECT id, email, nome, papel
       FROM admin_users
       WHERE lower(email) = $1 AND ativo
       LIMIT 1`,
      [alvo]
    );
    if (rows.length) return rows[0];

    const { rows: cont } = await pool.query(
      'SELECT COUNT(*)::int AS n FROM admin_users WHERE ativo'
    );
    if (cont[0].n === 0) return adminDoEnv(alvo);
    return null;
  } catch (err) {
    // 42P01 = tabela inexistente: migration não aplicada. Não trancar o painel.
    if (err.code === '42P01') return adminDoEnv(alvo);
    throw err;
  }
}

function adminDoEnv(alvo) {
  const doEnv = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!doEnv || alvo !== doEnv) return null;
  console.warn('requireAuth: nenhum usuário ativo em admin_users; aceitando credencial do .env');
  return { id: null, email: doEnv, nome: 'Administrador', papel: 'admin' };
}

async function requireAuth(req, res, next) {
  const cookie = req.cookies?.sobral_jwt;
  const header = req.headers.authorization;
  const token  = cookie || (header?.startsWith('Bearer ') ? header.slice(7) : null);

  if (!token) {
    req.resume();
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    req.resume();
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  let admin;
  try {
    admin = await resolverAdmin(payload.email);
  } catch (err) {
    console.error('requireAuth:', err.message);
    req.resume();
    return res.status(500).json({ error: 'Erro interno.' });
  }

  if (!admin) {
    req.resume();
    return res.status(401).json({ error: 'Usuário sem acesso ao painel.' });
  }

  req.admin    = admin;
  req.tokenExp = payload.exp;
  next();
}

module.exports = requireAuth;
