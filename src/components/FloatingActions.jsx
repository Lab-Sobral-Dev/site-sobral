import { useEffect, useState } from 'react';

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="19" x2="12" y2="6" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

export default function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };

  const base =
    'w-12 h-12 rounded-full grid place-items-center text-white shadow-[0_4px_14px_rgba(0,0,0,.22)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,.28)]';

  return (
    <div className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-[80] flex flex-col gap-3 print:hidden">
      <a
        href="https://instagram.com/labsobral"
        target="_blank"
        rel="noreferrer"
        title="Siga @labsobral no Instagram"
        aria-label="Siga o Laboratório Sobral no Instagram: @labsobral"
        className={`${base} bg-gradient-to-br from-[#F89B4D] via-[#E85A0C] to-[#C13584]`}
      >
        <InstagramIcon />
      </a>

      <button
        type="button"
        onClick={toTop}
        title="Voltar ao topo da página"
        aria-label="Voltar ao topo da página"
        className={`${base} bg-gradient-to-b from-[#F89B4D] to-[#E85A0C] ${showTop ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
      >
        <ArrowUpIcon />
      </button>
    </div>
  );
}
