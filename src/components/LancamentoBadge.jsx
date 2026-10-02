const COR_PADRAO = '#F37021';

// Cor da tag vem do cadastro (hex); estilo inline porque o Tailwind purga
// classes montadas em runtime.
export default function LancamentoBadge({ cor, className = '' }) {
  const base = /^#[0-9a-fA-F]{6}$/.test(cor || '') ? cor : COR_PADRAO;
  return (
    <span
      style={{
        backgroundImage: `linear-gradient(to bottom right, ${base}, color-mix(in srgb, ${base} 75%, black))`,
        boxShadow: `0 2px 6px color-mix(in srgb, ${base} 40%, transparent)`,
      }}
      className={`inline-flex items-center rounded-full text-white text-[9px] font-[800] uppercase tracking-[.06em] leading-none px-2 py-[4px] ${className}`}
    >
      Lançamento
    </span>
  );
}
