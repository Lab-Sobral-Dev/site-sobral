const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const validate  = require('../middleware/validate');
const transporter = require('../email/mailer');
const { contactEmailHtml } = require('../email/templates/contact');

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em 1 hora.' },
});

const requiredFields = ['nome', 'sobrenome', 'email', 'celular', 'assunto', 'mensagem'];

router.post(
  '/',
  contactLimiter,
  validate(requiredFields),
  async (req, res) => {
    const { nome, sobrenome, email, celular, assunto, mensagem, endereco, estado } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    try {
      await transporter.sendMail({
        from:    `"${nome} ${sobrenome}" <${process.env.SMTP_USER}>`,
        replyTo: email,
        to:      process.env.CONTACT_TO,
        subject: `[Contato] ${assunto}`,
        html:    contactEmailHtml({ nome, sobrenome, email, celular, assunto, mensagem, endereco, estado }),
      });
      res.json({ ok: true });
    } catch (err) {
      console.error('POST /api/contact (SMTP):', err.message);
      res.status(500).json({ error: 'Não foi possível enviar a mensagem. Tente novamente.' });
    }
  }
);

module.exports = router;
