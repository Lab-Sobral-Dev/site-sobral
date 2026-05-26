const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const cookie = req.cookies?.sobral_jwt;
  const header = req.headers.authorization;
  const token = cookie || (header?.startsWith('Bearer ') ? header.slice(7) : null);

  if (!token) {
    req.resume();
    return res.status(401).json({ error: 'Token não fornecido.' });
  }
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    req.resume();
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

module.exports = requireAuth;
