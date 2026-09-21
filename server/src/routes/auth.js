const { Router } = require('express');
const jwt         = require('jsonwebtoken');
const bcrypt      = require('bcryptjs');
const rateLimit   = require('express-rate-limit');
const requireAuth = require('../middleware/requireAuth');
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
  const { email, password } = req.body;

  const emailOk    = email === process.env.ADMIN_EMAIL;
  const passwordOk = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || '');

  if (!emailOk || !passwordOk) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const expiresAt = emitirSessao(res, { id: null, email, papel: 'admin' });
  res.json({ ok: true, email, expiresAt });
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
