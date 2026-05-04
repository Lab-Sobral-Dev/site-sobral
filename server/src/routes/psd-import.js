const { Router } = require('express');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const PSD        = require('psd');
const requireAuth = require('../middleware/requireAuth');

const router = Router();
router.use(requireAuth);

const tmpDir = path.join(__dirname, '..', '..', 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const publicImgDir = path.join(__dirname, '..', '..', '..', 'public', 'images', 'produtos');
if (!fs.existsSync(publicImgDir)) fs.mkdirSync(publicImgDir, { recursive: true });

const upload = multer({
  dest: tmpDir,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ext === '.psd');
  },
});

function slugify(str) {
  return (str || 'layer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'layer';
}

router.post('/', (req, res) => {
  upload.single('psd')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Arquivo ausente ou extensão inválida (apenas .psd).' });

    const tmpPath = req.file.path;
    try {
      const psd = PSD.fromFile(tmpPath);
      await psd.parse();

      const canvasW = psd.header.width;
      const canvasH = psd.header.height;
      const layers  = [];

      for (const layer of psd.layers) {
        const w = layer.width();
        const h = layer.height();
        if (!w || !h) continue;
        const slug     = slugify(layer.name);
        const filename = `psd-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.png`;
        const outPath  = path.join(publicImgDir, filename);
        if (typeof layer.image.saveAsPng === 'function') {
          await layer.image.saveAsPng(outPath);
        } else {
          const buf = layer.image.toPng();
          fs.writeFileSync(outPath, buf);
        }
        layers.push({
          name:   layer.name || 'Camada',
          url:    `/images/produtos/${filename}`,
          x:      Math.round((layer.left / canvasW) * 1000) / 10,
          y:      Math.round((layer.top  / canvasH) * 1000) / 10,
          width:  w,
          height: h,
        });
      }

      res.json({ layers });
    } catch (e) {
      console.error('POST /api/admin/psd-import:', e.message);
      res.status(422).json({ error: 'Não foi possível processar o PSD.' });
    } finally {
      fs.unlink(tmpPath, () => {});
    }
  });
});

module.exports = router;
