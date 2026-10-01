export default function LancamentoBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-orange to-orange-dark text-white text-[11px] font-[800] uppercase tracking-[.08em] leading-none pl-2 pr-3 py-[7px] shadow-[0_4px_12px_rgba(243,112,33,.35)] ring-1 ring-white/40 ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
        <path d="M12 2l1.9 5.6a3 3 0 0 0 1.9 1.9L21.4 11.4a.7.7 0 0 1 0 1.3l-5.6 1.9a3 3 0 0 0-1.9 1.9L12 22l-1.9-5.5a3 3 0 0 0-1.9-1.9L2.6 12.7a.7.7 0 0 1 0-1.3l5.6-1.9a3 3 0 0 0 1.9-1.9L12 2z" />
      </svg>
      Lançamento
    </span>
  );
}
