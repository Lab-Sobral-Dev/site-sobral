const { workerData, parentPort } = require('worker_threads');
const path = require('path');
const fs   = require('fs');
const PSD  = require('psd');
const { newId, CANVAS_W, CANVAS_H } = require('../utils/normalizeLayers');

const { tmpPath, publicImgDir, targetRatio } = workerData;

function slugify(str) {
  return (str || 'layer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'layer';
}

async function run() {
  const psd = PSD.fromFile(tmpPath);
  await psd.parse();

  const psdW = psd.header.width;
  const psdH = psd.header.height;

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

  const layers = [];

  try {
    const tree = psd.tree();
    if (typeof tree.toPng === 'function') {
      const composite = tree.toPng();
      if (composite) {
        const bgFilename = `psd-bg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.png`;
        fs.writeFileSync(path.join(publicImgDir, bgFilename), composite);
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
  }

  for (const layer of [...psd.layers].reverse()) {
    if (!layer.image) continue;
    const w = typeof layer.width  === 'function' ? layer.width()  : layer.width;
    const h = typeof layer.height === 'function' ? layer.height() : layer.height;
    if (!w || !h) continue;

    try {
      const slug     = slugify(layer.name);
      const filename = `psd-${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.png`;
      const outPath  = path.join(publicImgDir, filename);

      let saved = false;
      if (typeof layer.image.saveAsPng === 'function') {
        try { await Promise.resolve(layer.image.saveAsPng(outPath)); saved = true; }
        catch (e) { console.warn(`psd-worker: saveAsPng falhou para "${layer.name}" —`, e.message); }
      }
      if (!saved && typeof layer.image.toPng === 'function') {
        try {
          const buf = layer.image.toPng();
          if (buf) { fs.writeFileSync(outPath, buf); saved = true; }
        } catch (e) { console.warn(`psd-worker: toPng falhou para "${layer.name}" —`, e.message); }
      }
      if (!saved) continue;

      layers.push({
        id: newId(),
        type: 'image',
        name: layer.name || 'Camada',
        url: `/images/produtos/${filename}`,
        x:      Math.round((layer.left / psdW) * CANVAS_W),
        y:      Math.round((layer.top  / psdH) * CANVAS_H),
        width:  Math.round((w / psdW) * CANVAS_W),
        height: Math.round((h / psdH) * CANVAS_H),
        visible: true,
        animation: null,
      });
    } catch (layerErr) {
      console.warn(`psd-worker: camada "${layer.name}" ignorada —`, layerErr.message);
    }
  }

  parentPort.postMessage({ layers });
}

run().catch(err => parentPort.postMessage({ error: err.message }));
