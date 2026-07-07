const { Router }    = require('express');
const multer         = require('multer');
const path           = require('path');
const fs             = require('fs');
const { Worker }     = require('worker_threads');
const requireAuth    = require('../middleware/requireAuth');
const { CANVAS_W, CANVAS_H } = require('../utils/normalizeLayers');

const router = Router();
router.use(requireAuth);

const tmpDir = path.join(__dirname, '..', '..', 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const publicImgDir = path.join(__dirname, '..', '..', '..', 'public', 'images', 'produtos');
if (!fs.existsSync(publicImgDir)) fs.mkdirSync(publicImgDir, { recursive: true });

const upload = multer({
  dest: tmpDir,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ext === '.psd');
  },
});

const WORKER_PATH    = path.join(__dirname, '..', 'workers', 'psd-worker.js');
const TARGET_RATIO   = CANVAS_W / CANVAS_H;
const TIMEOUT_MS     = 60_000; // 60 segundos

function parsePsdInWorker(tmpPath) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, {
      workerData: { tmpPath, publicImgDir, targetRatio: TARGET_RATIO },
    });

    const timer = setTimeout(() => {
      worker.terminate();
      reject(Object.assign(new Error('Tempo limite excedido (60 s). Use um arquivo PSD menor.'), { status: 408 }));
    }, TIMEOUT_MS);

    worker.on('message', (msg) => {
      clearTimeout(timer);
      worker.terminate();
      if (msg.error) {
        const err = Object.assign(new Error(msg.error), { status: 422, extra: msg });
        reject(err);
      } else {
        resolve({ layers: msg.layers, skipped: msg.skipped || [] });
      }
    });

    worker.on('error', (err) => { clearTimeout(timer); reject(err); });
    worker.on('exit',  (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`Worker encerrado com código ${code}`));
    });
  });
}

router.post('/', (req, res) => {
  upload.single('psd')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Arquivo ausente ou extensão inválida (apenas .psd).' });

    const tmpPath = req.file.path;
    try {
      const { layers, skipped } = await parsePsdInWorker(tmpPath);
      res.json({ layers, skipped });
    } catch (e) {
      console.error('POST /api/admin/psd-import:', e.message);
      const { status = 422, extra = {} } = e;
      res.status(status).json({ error: e.message, ...extra });
    } finally {
      fs.unlink(tmpPath, () => {});
    }
  });
});

module.exports = router;
