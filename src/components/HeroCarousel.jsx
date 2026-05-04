import { useState, useEffect, useCallback } from 'react';

export default function HeroCarousel() {
  const [slides, setSlides] = useState([]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch('/api/hero-slides')
      .then(r => r.json())
      .then(setSlides)
      .catch(() => {});
  }, []);

  const next = useCallback(() => setIdx(i => (i + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setIdx(i => (i - 1 + slides.length) % slides.length), [slides.length]);

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

  if (slides.length === 1) {
    return (
      <section className="w-full bg-bg leading-[0]">
        <img src={slides[0].image_url} alt="Laboratório Sobral" className="w-full h-auto block" />
      </section>
    );
  }

  return (
    <section
      className="w-full bg-bg leading-[0] relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <img
        src={slides[idx].image_url}
        alt={`Slide ${idx + 1}`}
        className="w-full h-auto block"
      />

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
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
            className={`w-2.5 h-2.5 rounded-full border-none transition-all ${
              i === idx ? 'bg-orange scale-125' : 'bg-white/70 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
