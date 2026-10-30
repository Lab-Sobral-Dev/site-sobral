import { Link } from 'react-router-dom';
import LancamentoBadge from './LancamentoBadge';

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/produtos/${product.id}`}
      className="h-full bg-white rounded p-[12px_12px_16px] sm:p-[18px_18px_22px] flex flex-col items-center cursor-pointer group transition-[transform,box-shadow] duration-[220ms] ease-out hover:-translate-y-[5px] hover:shadow-[0_10px_28px_rgba(243,112,33,.14)]"
    >
      <div className="relative w-full aspect-square bg-[#EAEAEA] rounded-sm flex items-center justify-center mb-4 overflow-hidden">
        {product.lancamento && <LancamentoBadge cor={product.lancamento_cor} className="absolute top-2 left-2 z-10" />}
        {product.image
          ? <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="max-w-[82%] max-h-[88%] object-contain transition-transform duration-[300ms] ease-out group-hover:scale-[1.08]"
            />
          : <span className="text-[11px] text-muted font-mono text-center p-3 leading-snug">[ foto: {product.name} ]</span>
        }
      </div>
      <div className="w-full font-[800] text-[14px] sm:text-[15px] leading-[1.3] text-orange mb-1 text-center break-words line-clamp-2 min-h-[2.6em]">{product.name}</div>
      <div className="w-full text-[12px] sm:text-[12.5px] leading-[1.4] text-ink-light text-center mb-[14px] break-words line-clamp-2 min-h-[2.8em]">{product.tag}</div>
      <span className="btn-outline btn-ripple mt-auto inline-flex items-center justify-center whitespace-nowrap px-4 sm:px-6 py-2.5 rounded-full border border-orange bg-white text-orange font-bold text-[13px] sm:text-[14px] transition-colors group-hover:bg-orange-50">
        Saber Mais
      </span>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="h-full bg-white rounded p-[12px_12px_16px] sm:p-[18px_18px_22px] flex flex-col items-center animate-pulse">
      <div className="w-full aspect-square bg-[#EAEAEA] rounded-sm mb-4" />
      <div className="h-[2.6em] text-[14px] sm:text-[15px] w-3/4 mb-1 flex items-center"><div className="h-[18px] w-full bg-line rounded" /></div>
      <div className="h-[2.8em] text-[12px] sm:text-[12.5px] w-1/2 mb-[14px] flex items-center"><div className="h-3 w-full bg-line rounded" /></div>
      <div className="mt-auto h-[39px] sm:h-[41px] w-[112px] sm:w-[132px] rounded-full bg-line" />
    </div>
  );
}
