const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    req.resume();
    return res.status(401).json({ error: 'Token não fornecido.' });
  }
  const token = header.slice(7);
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    req.resume();
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

module.exports = requireAuth;
