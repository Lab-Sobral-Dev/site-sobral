// Larguras extras geradas pro srcset do hero (routes/upload.js), além do
// arquivo principal (que sai na largura de MAX_WIDTH.hero). Isolado aqui
// porque a limpeza de imagens órfãs (lib/imagens.js) precisa conhecer os
// mesmos nomes de arquivo pra apagar as variantes junto com o principal —
// um só lugar de verdade evita as duas pontas saírem do sincronismo.
const HERO_SRCSET_WIDTHS = [960, 1920, 2560];

// "banner-foo-123.webp" -> "banner-foo-123-1920w.webp"
function heroVariantFilename(baseFilename, width) {
  return baseFilename.replace(/\.webp$/i, `-${width}w.webp`);
}

module.exports = { HERO_SRCSET_WIDTHS, heroVariantFilename };
