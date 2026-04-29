require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const productsRouter   = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const contactRouter    = require('./routes/contact');
const authRouter       = require('./routes/auth');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN
    : 'http://localhost:5173',
  optionsSuccessStatus: 200,
}));
app.use(express.json());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em breve.' },
}));

app.use('/api/products',   productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/contact',    contactRouter);
app.use('/api/auth',       authRouter);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

app.use((err, req, res, _next) => {
  console.error('Erro não tratado:', err.message);
  res.status(500).json({ error: 'Erro interno.' });
});

module.exports = app;
