const { Router } = require('express');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const PSD        = require('psd');
const requireAuth = require('../middleware/requireAuth');
const { newId, CANVAS_W, CANVAS_H } = require('../utils/normalizeLayers');

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

      const psdW = psd.header.width;
      const psdH = psd.header.height;
      const layers = [];

      // Camada de fundo: o canvas do PSD inteiro renderizado.
      const bgFilename = `psd-bg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.png`;
      const bgOutPath = path.join(publicImgDir, bgFilename);
      const tree = psd.tree();
      const composite = typeof tree.toPng === 'function' ? tree.toPng() : null;
      if (composite) {
        fs.writeFileSync(bgOutPath, composite);
        layers.push({
          id: newId(),
          type: 'image',
          name: 'fundo',
          url: `/images/produtos/${bgFilename}`,
          x: 0, y: 0,
          width: CANVAS_W, height: CANVAS_H,
          visible: true,
          animation: null,
        });
      }

      // Camadas individuais
      for (const layer of psd.layers) {
        const w = typeof layer.width  === 'function' ? layer.width()  : layer.width;
        const h = typeof layer.height === 'function' ? layer.height() : layer.height;
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
          id: newId(),
          type: 'image',
          name: layer.name || 'Camada',
          url: `/images/produtos/${filename}`,
          x: Math.round((layer.left / psdW) * CANVAS_W),
          y: Math.round((layer.top  / psdH) * CANVAS_H),
          width: Math.round((w / psdW) * CANVAS_W),
          height: Math.round((h / psdH) * CANVAS_H),
          visible: true,
          animation: null,
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
