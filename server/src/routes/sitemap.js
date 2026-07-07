const { Router } = require('express');
const pool = require('../db');

const router = Router();

const STATIC_PATHS = [
  { path: '/',            priority: '1.0', freq: 'weekly'  },
  { path: '/quem-somos',  priority: '0.7', freq: 'monthly' },
  { path: '/produtos',    priority: '0.9', freq: 'weekly'  },
  { path: '/misturinhas', priority: '0.7', freq: 'monthly' },
  { path: '/fale-conosco', priority: '0.5', freq: 'yearly' },
  { path: '/privacidade', priority: '0.3', freq: 'yearly'  },
];

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// GET /sitemap.xml — inclui páginas fixas + produtos ativos.
router.get('/', async (req, res) => {
  // Usa a origem configurada em produção; senão, deriva do host da requisição.
  const base = (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const urls = [...STATIC_PATHS.map(p => ({ loc: base + p.path, priority: p.priority, freq: p.freq }))];

  try {
    const { rows } = await pool.query(
      'SELECT id, updated_at FROM products WHERE ativo = TRUE ORDER BY name ASC'
    );
    for (const r of rows) {
      urls.push({
        loc: `${base}/produtos/${encodeURIComponent(r.id)}`,
        lastmod: r.updated_at ? new Date(r.updated_at).toISOString().slice(0, 10) : null,
        priority: '0.6',
        freq: 'monthly',
      });
    }
  } catch (err) {
    console.error('GET /sitemap.xml:', err.message);
    // Segue com as páginas estáticas mesmo se o banco falhar.
  }

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u =>
      '  <url>\n' +
      `    <loc>${esc(u.loc)}</loc>\n` +
      (u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : '') +
      `    <changefreq>${u.freq}</changefreq>\n` +
      `    <priority>${u.priority}</priority>\n` +
      '  </url>'
    ).join('\n') +
    '\n</urlset>\n';

  res.set('Content-Type', 'application/xml');
  res.send(body);
});

module.exports = router;
