const { Router } = require('express');
const jwt = require('jsonwebtoken');
const requireAuth = require('../middleware/requireAuth');
const validate    = require('../middleware/validate');

const router = Router();

router.post('/login', validate(['email', 'password']), (req, res) => {
  const { email, password } = req.body;

  if (
    email    !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
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
