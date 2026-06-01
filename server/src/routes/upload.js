const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

const ALLOWED_TYPES = ['produtos', 'hero', 'cms'];
const allowedExts  = ['.jpg', '.jpeg', '.png', '.webp'];
const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

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
    if (!req.file) return res.status(400).json({ error: 'Arquivo ausente ou tipo inválido (jpg/png/webp).' });

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

    const realMime = detectMime(header);
    if (!realMime || !allowedMimes.includes(realMime)) {
      try { fs.unlinkSync(filePath); } catch {}
      return res.status(400).json({ error: 'Tipo de arquivo inválido.' });
    }

    // PERF-03: converter para WebP com sharp (max 800px, qualidade 85)
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const webpPath = path.join(dir, `${baseName}.webp`);
    const tmpPath  = path.join(dir, `${baseName}-tmp.webp`);

    try {
      await sharp(filePath)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(tmpPath);

      fs.renameSync(tmpPath, webpPath);
      if (filePath !== webpPath) {
        try { fs.unlinkSync(filePath); } catch {}
      }

      return res.json({ url: `/images/${type}/${baseName}.webp` });
    } catch (sharpErr) {
      console.error('sharp conversion failed:', sharpErr.message);
      return res.json({ url: `/images/${type}/${path.basename(filePath)}` });
    }
  });
});

module.exports = router;
