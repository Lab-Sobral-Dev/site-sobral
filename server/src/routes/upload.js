const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const requireAuth = require('../middleware/requireAuth');

const router = Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', '..', 'public', 'images', 'produtos'),
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

const allowedExts  = ['.jpg', '.jpeg', '.png', '.webp'];
const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedExts.includes(ext) && allowedMimes.includes(file.mimetype));
  },
});

router.post('/', requireAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Arquivo ausente ou tipo inválido (jpg/png/webp).' });
    res.json({ url: `/images/produtos/${req.file.filename}` });
  });
});

module.exports = router;
