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
