function validate(fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => req.body[f] == null || String(req.body[f]).trim() === '');
    if (missing.length > 0) {
      return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missing.join(', ')}.` });
    }
    next();
  };
}

module.exports = validate;
