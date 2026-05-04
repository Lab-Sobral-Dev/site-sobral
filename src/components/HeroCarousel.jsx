import { useState, useEffect, useCallback } from 'react';

function SlideLayer({ layer, type, animado }) {
  if (!layer?.visible) return null;

  const posStyle = {
    position: 'absolute',
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    transform: 'translate(-50%, -50%)',
  };

  const animClass = animado && layer.animation && layer.animation !== 'none'
    ? `layer-anim-${layer.animation}`
    : '';

  const animStyle = animado ? { animationDelay: `${layer.delay ?? 0}s` } : {};

  if (type === 'logo' && layer.image_url) {
    return (
      <div style={posStyle}>
        <img
          src={layer.image_url}
          alt=""
          className={animClass}
          style={{ width: `${layer.width ?? 80}px`, display: 'block', ...animStyle }}
        />
      </div>
    );
  }

  if (type === 'cta' && layer.text) {
    return (
      <div style={posStyle}>
        <a
          href={layer.link || '/produtos'}
          className={`block bg-orange text-white font-[800] text-[14px] px-6 py-3 rounded-full shadow-lg whitespace-nowrap hover:bg-[#E0580A] transition-colors ${animClass}`}
          style={animStyle}
        >
          {layer.text}
        </a>
      </div>
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

  if (!slides.length) {
    return (
      <section className="w-full bg-bg leading-[0]">
        <img src="/images/hero-banner.png" alt="Laboratório Sobral" className="w-full h-auto block" />
      </section>
    );
  }

  const slide = slides[idx];

  return (
    <section
      className="w-full bg-bg leading-[0] relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div key={`${idx}-${animKey}`} className={`relative slide-enter-${transition}`}>
        <img
          src={slide.image_url}
          alt={`Slide ${idx + 1}`}
          className="w-full h-auto block"
        />

        {slide.layers && (
          <>
            <SlideLayer layer={slide.layers.logo} type="logo" animado={slide.animado} />
            <SlideLayer layer={slide.layers.cta}  type="cta"  animado={slide.animado} />
          </>
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Slide anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-orange flex items-center justify-center text-[22px] shadow transition-all z-10 leading-none"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Próximo slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-orange flex items-center justify-center text-[22px] shadow transition-all z-10 leading-none"
          >
            ›
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
