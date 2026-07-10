const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

const ALLOWED_TYPES = ['produtos', 'hero', 'cms'];
const allowedExts  = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

// SEC-01: detecção por magic bytes (ignora MIME informado pelo browser)
function detectMime(buffer) {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'image/png';
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return 'image/webp';
  return null;
}

// SVG não tem magic bytes binários: verifica se o conteúdo real contém um <svg>.
// Lê só o início do arquivo (SVG válido declara a tag logo após um prólogo curto).
function looksLikeSvg(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(65536);
    const read = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    return /<svg[\s>]/i.test(buf.toString('utf8', 0, read));
  } catch {
    return false;
  }
}

// PERF-04: destino dinâmico por tipo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = ALLOWED_TYPES.includes(req.query.type) ? req.query.type : 'produtos';
    const dir = path.join(__dirname, '..', '..', '..', 'public', 'images', type);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedExts.includes(ext) && allowedMimes.includes(file.mimetype));
  },
});

router.post('/', requireAuth, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Arquivo muito grande. Tamanho máximo: 20 MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'Arquivo ausente ou tipo inválido (jpg/png/webp/svg).' });

    const filePath = req.file.path;
    const type = ALLOWED_TYPES.includes(req.query.type) ? req.query.type : 'produtos';

    // SEC-01: validar conteúdo real via magic bytes
    let header;
    try {
      const fd = fs.openSync(filePath, 'r');
      header = Buffer.alloc(12);
      fs.readSync(fd, header, 0, 12, 0);
      fs.closeSync(fd);
    } catch {
      try { fs.unlinkSync(filePath); } catch {}
      return res.status(400).json({ error: 'Não foi possível verificar o arquivo.' });
    }

    // SVG não é detectado por magic bytes: cai no sniff de conteúdo.
    const realMime = detectMime(header) || (looksLikeSvg(filePath) ? 'image/svg+xml' : null);
    if (!realMime || !allowedMimes.includes(realMime)) {
      try { fs.unlinkSync(filePath); } catch {}
      return res.status(400).json({ error: 'Tipo de arquivo inválido.' });
    }
    const isSvg = realMime === 'image/svg+xml';

    // PERF-03: converter para WebP com sharp (largura e qualidade por tipo)
    // hero: 2560px cobre telas retina/2x (o hero é full-bleed); demais mantêm 1x
    const MAX_WIDTH = { hero: 2560, cms: 1400, produtos: 900 };
    const QUALITY   = { hero: 92,   cms: 88,   produtos: 85  };
    const maxWidth  = MAX_WIDTH[type]  || 900;
    const quality   = QUALITY[type]    || 85;

    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const webpPath = path.join(dir, `${baseName}.webp`);
    const tmpPath  = path.join(dir, `${baseName}-tmp.webp`);

    try {
      let input = sharp(filePath);

      // SVG é vetorial: rasteriza com densidade calculada p/ atingir a largura
      // alvo com nitidez (senão librsvg renderiza no tamanho natural e borra ao
      // ampliar). Densidade limitada p/ não estourar memória com SVGs minúsculos.
      if (isSvg) {
        const meta = await input.metadata();
        const svgWidth = meta.width || maxWidth;
        const density = Math.min(2400, Math.max(72, Math.round((72 * maxWidth) / svgWidth)));
        input = sharp(filePath, { density });
      }

      await input
        .resize({ width: maxWidth, withoutEnlargement: !isSvg })
        // effort:6 = melhor compressão; smartSubsample evita borrar bordas de
        // texto/cores chapadas (4:4:4) — preserva nitidez em banners
        .webp({ quality, effort: 6, smartSubsample: true })
        .toFile(tmpPath);

      fs.renameSync(tmpPath, webpPath);
      if (filePath !== webpPath) {
        try { fs.unlinkSync(filePath); } catch {}
      }

      return res.json({ url: `/images/${type}/${baseName}.webp` });
    } catch (sharpErr) {
      console.error('sharp conversion failed:', sharpErr.message);
      try { fs.unlinkSync(tmpPath); } catch {}
      // SVG cru pode conter <script> (XSS): nunca é servido sem rasterizar.
      if (isSvg) {
        try { fs.unlinkSync(filePath); } catch {}
        return res.status(400).json({ error: 'Não foi possível processar o SVG. Verifique o arquivo.' });
      }
      return res.json({ url: `/images/${type}/${path.basename(filePath)}` });
    }
  });
});

module.exports = router;
