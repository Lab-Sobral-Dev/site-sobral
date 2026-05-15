const { Router } = require('express');
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const rateLimit  = require('express-rate-limit');
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

router.post('/login', loginLimiter, validate(['email', 'password']), async (req, res) => {
  const { email, password } = req.body;

  const emailOk    = email === process.env.ADMIN_EMAIL;
  const passwordOk = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || '');

  if (!emailOk || !passwordOk) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({ token });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ email: req.admin.email });
});

module.exports = router;
