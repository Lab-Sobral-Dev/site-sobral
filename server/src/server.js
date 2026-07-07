require('dotenv').config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET ausente ou muito curto (mínimo 32 caracteres). Abortando.');
  process.exit(1);
}

const app  = require('./app');

const PORT = process.env.PORT || 3001;

process.on('uncaughtException', (err) => {
  console.error('uncaughtException — servidor mantido:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection — servidor mantido:', reason);
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
