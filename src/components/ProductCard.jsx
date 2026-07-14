export default function ProductCard({ product, onClick }) {
  return (
    <div
      className="bg-white rounded p-[18px_18px_22px] flex flex-col items-center cursor-pointer group transition-[transform,box-shadow] duration-[220ms] ease-out hover:-translate-y-[5px] hover:shadow-[0_10px_28px_rgba(243,112,33,.14)]"
      onClick={onClick}
    >
      <div className="w-full aspect-square bg-[#EAEAEA] rounded-sm flex items-center justify-center mb-4 overflow-hidden">
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
      <div className="font-[800] text-[15px] text-orange mb-1 text-center">{product.name}</div>
      <div className="text-[12.5px] text-ink-light text-center mb-[14px] min-h-[36px]">{product.tag}</div>
      <button
        className="btn-outline btn-ripple inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-orange bg-white text-orange font-bold text-[14px] transition-colors hover:bg-orange-50"
        onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      >
        Saber Mais
      </button>
    </div>
  );
}
