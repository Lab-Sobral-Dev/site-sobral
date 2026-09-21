// Barra quem não tem o papel exigido. Usado nas rotas de usuários (fase 5).
// Esconder o item no menu não é controle de acesso — a decisão é aqui.
function requirePapel(...papeis) {
  return (req, res, next) => {
    if (!req.admin || !papeis.includes(req.admin.papel)) {
      return res.status(403).json({ error: 'Permissão insuficiente.' });
    }
    next();
  };
}

module.exports = requirePapel;
