export default function LancamentoBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-br from-orange to-orange-dark text-white text-[9px] font-[800] uppercase tracking-[.06em] leading-none px-2 py-[4px] shadow-[0_2px_6px_rgba(243,112,33,.3)] ${className}`}
    >
      Lançamento
    </span>
  );
}
