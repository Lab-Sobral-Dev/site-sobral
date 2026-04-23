export default function ProductCard({ product, onClick }) {
  return (
    <div
      className="bg-white rounded p-[18px_18px_22px] flex flex-col items-center transition-[transform,box-shadow] duration-[220ms] hover:-translate-y-1 hover:shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="w-full aspect-square bg-[#EAEAEA] rounded-sm flex items-center justify-center mb-4 overflow-hidden">
        {product.image
          ? <img src={product.image} alt={product.name} className="max-w-[82%] max-h-[88%] object-contain" />
          : <span className="text-[11px] text-muted font-mono text-center p-3 leading-snug">[ foto: {product.name} ]</span>
        }
      </div>
      <div className="font-[800] text-[15px] text-ink mb-1 text-center">{product.name}</div>
      <div className="text-[12.5px] text-ink-light text-center mb-[14px] min-h-[36px]">{product.tag}</div>
      <button
        className="btn-outline inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-orange bg-white text-orange font-bold text-[14px] transition-colors hover:bg-orange-50"
        onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      >
        Saber Mais
      </button>
    </div>
  );
}
