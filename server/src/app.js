require('dotenv').config();
const path       = require('path');
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const productsRouter        = require('./routes/products');
const categoriesRouter      = require('./routes/categories');
const contactRouter         = require('./routes/contact');
const authRouter            = require('./routes/auth');
const contentRouter         = require('./routes/content');
const heroSlidesRouter      = require('./routes/hero-slides');

const adminProductsRouter   = require('./routes/admin-products');
const adminCategoriesRouter = require('./routes/admin-categories');
const adminContentRouter    = require('./routes/admin-content');
const adminHeroSlidesRouter = require('./routes/admin-hero-slides');
const uploadRouter          = require('./routes/upload');
const psdImportRouter       = require('./routes/psd-import');

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
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em breve.' },
}));

app.use('/api/products',            productsRouter);
app.use('/api/categories',          categoriesRouter);
app.use('/api/contact',             contactRouter);
app.use('/api/auth',                authRouter);
app.use('/api/content',             contentRouter);
app.use('/api/hero-slides',         heroSlidesRouter);

app.use('/api/admin/products',      adminProductsRouter);
app.use('/api/admin/categories',    adminCategoriesRouter);
app.use('/api/admin/content',       adminContentRouter);
app.use('/api/admin/hero-slides',   adminHeroSlidesRouter);
app.use('/api/upload',              uploadRouter);
app.use('/api/admin/psd-import',    psdImportRouter);

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
}

app.use((err, req, res, _next) => {
  console.error('Erro não tratado:', err.message);
  res.status(500).json({ error: 'Erro interno.' });
});

module.exports = app;
