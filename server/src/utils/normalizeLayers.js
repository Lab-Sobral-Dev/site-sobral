const crypto = require('crypto');

// Canvas de referência usado por todo o sistema.
const CANVAS_W = 1920;
const CANVAS_H = 600;

function newId() {
  return crypto.randomUUID();
}

/**
 * Converte qualquer formato de `layers` para o array novo:
 *   [{ id, type, name, url|text/href/bgColor/textColor, x, y, width, height, visible, animation }]
 *
 * - Se já for array, devolve sem mudança.
 * - Se for objeto antigo `{ logo, cta }`, converte para array.
 * - imageUrl é a coluna `image_url` do slide; se presente e o objeto antigo for usado,
 *   vira a primeira camada (fundo).
 */
function normalizeLayers(raw, imageUrl) {
  if (Array.isArray(raw)) return raw;

  const layers = [];

  if (imageUrl) {
    layers.push({
      id: newId(),
      type: 'image',
      name: 'fundo',
      url: imageUrl,
      x: 0, y: 0,
      width: CANVAS_W, height: CANVAS_H,
      visible: true,
      animation: null,
    });
  }

  if (raw && typeof raw === 'object') {
    if (raw.logo && raw.logo.image_url) {
      // formato antigo: x/y em %, width em px (sem ref de canvas).
      const x = Math.round(((raw.logo.x ?? 50) / 100) * CANVAS_W);
      const y = Math.round(((raw.logo.y ?? 50) / 100) * CANVAS_H);
      const width = raw.logo.width || 160;
      const height = raw.logo.width || 160; // builder antigo usava largura como altura.
      layers.push({
        id: newId(),
        type: 'image',
        name: 'logo',
        url: raw.logo.image_url,
        x: Math.max(0, x - Math.round(width / 2)),
        y: Math.max(0, y - Math.round(height / 2)),
        width, height,
        visible: raw.logo.visible !== false,
        animation: raw.logo.animation && raw.logo.animation !== 'none'
          ? { type: raw.logo.animation, delay: raw.logo.delay ?? 0 }
          : null,
      });
    }
    if (raw.cta) {
      const width = 220, height = 56;
      const x = Math.round(((raw.cta.x ?? 50) / 100) * CANVAS_W);
      const y = Math.round(((raw.cta.y ?? 78) / 100) * CANVAS_H);
      layers.push({
        id: newId(),
        type: 'button',
        name: 'cta',
        text: raw.cta.text || 'Ver catálogo',
        href: raw.cta.link || '/produtos',
        bgColor: '#F37021',
        textColor: '#FFFFFF',
        x: Math.max(0, x - Math.round(width / 2)),
        y: Math.max(0, y - Math.round(height / 2)),
        width, height,
        visible: raw.cta.visible !== false,
        animation: raw.cta.animation && raw.cta.animation !== 'none'
          ? { type: raw.cta.animation, delay: raw.cta.delay ?? 0 }
          : null,
      });
    }
  }

  return layers;
}

module.exports = { normalizeLayers, newId, CANVAS_W, CANVAS_H };
