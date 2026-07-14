import { useState, useEffect, useCallback } from 'react';

const CANVAS_W = 1920;
const CANVAS_H = 600;

function ChevronIcon({ dir = 'left' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={dir === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  );
}

function Layer({ layer }) {
  if (!layer.visible) return null;

  const style = {
    position: 'absolute',
    left:   `${(layer.x / CANVAS_W) * 100}%`,
    top:    `${(layer.y / CANVAS_H) * 100}%`,
    width:  `${(layer.width  / CANVAS_W) * 100}%`,
    height: `${(layer.height / CANVAS_H) * 100}%`,
    animationDelay: layer.animation ? `${layer.animation.delay ?? 0}s` : undefined,
  };

  const animClass = layer.animation ? `layer-anim-${layer.animation.type}` : '';

  if (layer.type === 'image') {
    return (
      <img
        src={layer.url}
        alt={layer.name || ''}
        // objectFit cover: sem isto o padrão do <img> é "fill" e estica a
        // imagem para a caixa 1920×600, distorcendo o que não for 16:5
        style={{ ...style, objectFit: 'cover' }}
        className={animClass}
        draggable={false}
      />
    );
  }

  if (layer.type === 'button') {
    return (
      <a
        href={layer.href || '/produtos'}
        style={{ ...style, backgroundColor: layer.bgColor, color: layer.textColor }}
        className={`flex items-center justify-center rounded-lg font-bold text-sm px-4 whitespace-nowrap shadow-lg ${animClass}`}
      >
        {layer.text}
      </a>
    );
  }

  return null;
}

export default function HeroCarousel() {
  const [slides,     setSlides]     = useState([]);
  const [idx,        setIdx]        = useState(0);
  const [animKey,    setAnimKey]    = useState(0);
  const [paused,     setPaused]     = useState(false);
  const [transition, setTransition] = useState('fade');

  useEffect(() => {
    fetch('/api/hero-slides').then(r => r.json()).then(setSlides).catch(() => {});
    fetch('/api/content/carousel').then(r => r.json()).then(d => setTransition(d.transition ?? 'fade')).catch(() => {});
  }, []);

  const goTo = useCallback((i) => {
    setIdx(i);
    setAnimKey(k => k + 1);
  }, []);

  const next = useCallback(() => goTo((idx + 1) % slides.length), [idx, slides.length, goTo]);
  const prev = useCallback(() => goTo((idx - 1 + slides.length) % slides.length), [idx, slides.length, goTo]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [slides.length, paused, next]);

  const slide = slides[idx] ?? null;
  const layers = slide && Array.isArray(slide.layers) ? slide.layers : [];

  return (
    <section
      className="w-full bg-bg relative overflow-hidden aspect-[1920/600]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* camada base: inline styles garantem position:absolute antes do CSS carregar,
          evitando que a img ocupe fluxo e cause reflow ao ser removida */}
      <img
        src="/images/hero-banner.png"
        alt="Laboratório Sobral"
        fetchpriority="high"
        decoding="async"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {slide && (
        <div
          key={`${idx}-${animKey}`}
          className={`absolute inset-0 slide-enter-${transition}`}
        >
          {layers.map(layer => <Layer key={layer.id} layer={layer} />)}
        </div>
      )}

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Slide anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-orange flex items-center justify-center shadow transition-all z-10"
          >
            <ChevronIcon dir="left" />
          </button>
          <button
            onClick={next}
            aria-label="Próximo slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-orange flex items-center justify-center shadow transition-all z-10"
          >
            <ChevronIcon dir="right" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full border-none transition-all ${i === idx ? 'bg-orange scale-125' : 'bg-white/70 hover:bg-white'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
