const { Router } = require('express');
const jwt         = require('jsonwebtoken');
const bcrypt      = require('bcryptjs');
const rateLimit   = require('express-rate-limit');
const pool        = require('../db');
const requireAuth = require('../middleware/requireAuth');
const { registrar } = require('../lib/audit');
const validate    = require('../middleware/validate');

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});

const COOKIE_NAME = 'sobral_jwt';
const DURACAO_HORAS = 8;
const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 8 * 60 * 60 * 1000,
  path: '/',
};

// Emite (ou renova) a sessão e devolve o instante de vencimento em ms.
// Centralizado para login e refresh não divergirem na duração do cookie.
function emitirSessao(res, admin) {
  const token = jwt.sign(
    { sub: admin.id ?? undefined, email: admin.email, papel: admin.papel ?? 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: `${DURACAO_HORAS}h` }
  );
  res.cookie(COOKIE_NAME, token, cookieOpts);
  return Date.now() + DURACAO_HORAS * 60 * 60 * 1000;
}

router.post('/login', loginLimiter, validate(['email', 'password']), async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const { password } = req.body;

  try {
    const { rows } = await pool.query(
      `SELECT id, email, nome, senha_hash, papel
       FROM admin_users
       WHERE lower(email) = $1 AND ativo
       LIMIT 1`,
      [email]
    );

    let admin = rows[0];

    if (admin) {
      const ok = await bcrypt.compare(password, admin.senha_hash);
      if (!ok) return res.status(401).json({ error: 'Credenciais inválidas.' });
    } else {
      // Recuperação: só quando NÃO existe nenhum usuário ativo. Qualquer
      // usuário ativo fecha esse caminho sozinho.
      const { rows: cont } = await pool.query(
        'SELECT COUNT(*)::int AS n FROM admin_users WHERE ativo'
      );
      const doEnv = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
      const ok = cont[0].n === 0
        && email === doEnv
        && await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || '');
      if (!ok) return res.status(401).json({ error: 'Credenciais inválidas.' });
      console.warn('login: nenhum usuário ativo; aceitando credencial do .env');
      admin = { id: null, email, nome: 'Administrador', papel: 'admin' };
    }

    if (admin.id) {
      await pool.query('UPDATE admin_users SET ultimo_login = NOW() WHERE id = $1', [admin.id]);
    }

    const expiresAt = emitirSessao(res, admin);
    req.admin = admin;   // para a auditoria saber quem entrou
    await registrar(req, {
      acao: 'login', entidade: 'user', entidade_id: String(admin.id ?? admin.email),
    });

    res.json({ ok: true, email: admin.email, expiresAt });
  } catch (err) {
    console.error('POST /api/auth/login:', err.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

router.post('/refresh', requireAuth, (req, res) => {
  const expiresAt = emitirSessao(res, req.admin);
  res.json({ ok: true, expiresAt });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({
    email:     req.admin.email,
    nome:      req.admin.nome,
    papel:     req.admin.papel,
    expiresAt: req.tokenExp ? req.tokenExp * 1000 : null,
  });
});

module.exports = router;
