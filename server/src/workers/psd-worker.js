const { workerData, parentPort } = require('worker_threads');
const path  = require('path');
const fs    = require('fs');
const PSD   = require('psd');
const sharp = require('sharp');
const { newId, CANVAS_W, CANVAS_H } = require('../utils/normalizeLayers');

const { tmpPath, publicImgDir, targetRatio } = workerData;

function slugify(str) {
  return (str || 'layer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'layer';
}

// Salva um buffer de imagem usando sharp, redimensionado para (targetW × targetH).
// Retorna o caminho final salvo.
async function saveResized(srcBuffer, outPath, targetW, targetH) {
  await sharp(srcBuffer)
    .resize(Math.round(targetW), Math.round(targetH), { fit: 'cover', withoutEnlargement: false })
    .webp({ quality: 92 })
    .toFile(outPath);
}

async function run() {
  const psd = PSD.fromFile(tmpPath);
  await psd.parse();

  const psdW = psd.header.width;
  const psdH = psd.header.height;

  // Guarda anti-exaustão de memória: um PSD pode declarar dimensões enormes
  // e explodir a memória antes de qualquer resize.
  const MAX_PIXELS = 50 * 1000 * 1000; // 50 megapixels
  if (!psdW || !psdH || psdW * psdH > MAX_PIXELS) {
    parentPort.postMessage({
      error: `PSD com dimensões inválidas ou grandes demais (${psdW} × ${psdH} px). Máximo: 50 MP.`,
    });
    return;
  }

  const actualRatio = psdW / psdH;
  const deviation   = Math.abs(actualRatio - targetRatio) / targetRatio;
  if (deviation > 0.05) {
    parentPort.postMessage({
      error:
        `Proporção incompatível: o PSD tem ${psdW} × ${psdH} px ` +
        `(${actualRatio.toFixed(2)}:1), mas o hero usa proporção 16:5 ` +
        `(${CANVAS_W} × ${CANVAS_H} px). ` +
        `Redimensione o PSD para ${CANVAS_W} × ${CANVAS_H} px antes de importar.`,
      psdWidth:      psdW,
      psdHeight:     psdH,
      expectedWidth:  CANVAS_W,
      expectedHeight: CANVAS_H,
    });
    return;
  }

  // Fator de escala do PSD para o canvas (pode ser < 1 ou > 1)
  const scaleX = CANVAS_W / psdW;
  const scaleY = CANVAS_H / psdH;

  const layers = [];
  const skipped = []; // camadas descartadas: { name, reason }

  // 1. Composite (fundo) — redimensionado para exatamente CANVAS_W × CANVAS_H
  try {
    const tree = psd.tree();
    if (typeof tree.toPng === 'function') {
      const composite = tree.toPng();
      if (composite) {
        const bgFilename = `psd-bg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.webp`;
        const bgPath = path.join(publicImgDir, bgFilename);
        await saveResized(composite, bgPath, CANVAS_W, CANVAS_H);
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
    }
  } catch (compErr) {
    console.warn('psd-worker: composite ignorado —', compErr.message);
    skipped.push({ name: 'fundo', reason: compErr.message });
  }

  // 2. Camadas individuais — cada uma redimensionada para suas dimensões no canvas
  for (const layer of [...psd.layers].reverse()) {
    if (!layer.image) continue;
    const w = typeof layer.width  === 'function' ? layer.width()  : layer.width;
    const h = typeof layer.height === 'function' ? layer.height() : layer.height;
    if (!w || !h) continue;

    // Dimensões de exibição no canvas 1920×600
    const displayW = Math.round(w * scaleX);
    const displayH = Math.round(h * scaleY);
    if (displayW < 1 || displayH < 1) continue;

    try {
      const slug     = slugify(layer.name);
      const filename = `psd-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.webp`;
      const outPath  = path.join(publicImgDir, filename);

      // Obtém o buffer da camada
      let srcBuffer = null;
      let bufferErr = null;
      if (typeof layer.image.toPng === 'function') {
        try { srcBuffer = layer.image.toPng(); } catch (e) { bufferErr = e.message; }
      }
      if (!srcBuffer && typeof layer.image.saveAsPng === 'function') {
        const tmpLayer = outPath.replace('.webp', '_tmp.png');
        try {
          await Promise.resolve(layer.image.saveAsPng(tmpLayer));
          srcBuffer = fs.readFileSync(tmpLayer);
          fs.unlink(tmpLayer, () => {});
        } catch (e) { bufferErr = e.message; }
      }
      if (!srcBuffer) {
        skipped.push({ name: layer.name || 'Camada', reason: bufferErr || 'buffer de imagem indisponível' });
        continue;
      }

      // Salva redimensionado para o tamanho de exibição exato
      await saveResized(srcBuffer, outPath, displayW, displayH);

      layers.push({
        id: newId(),
        type: 'image',
        name: layer.name || 'Camada',
        url: `/images/produtos/${filename}`,
        x:      Math.round((layer.left / psdW) * CANVAS_W),
        y:      Math.round((layer.top  / psdH) * CANVAS_H),
        width:  displayW,
        height: displayH,
        visible: true,
        animation: null,
      });
    } catch (layerErr) {
      console.warn(`psd-worker: camada "${layer.name}" ignorada —`, layerErr.message);
      skipped.push({ name: layer.name || 'Camada', reason: layerErr.message });
    }
  }

  parentPort.postMessage({ layers, skipped });
}

run().catch(err => parentPort.postMessage({ error: err.message }));
