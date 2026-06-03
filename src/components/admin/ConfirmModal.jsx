export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', danger = true }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-[14px] shadow-xl p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-[800] text-[17px] text-ink mb-2">{title}</h3>
        <p className="text-[14px] text-ink-light mb-6 leading-[1.5]">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[14px] font-[600] text-ink-light border border-line rounded-[8px] hover:border-orange hover:text-orange transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-[14px] font-[700] text-white rounded-[8px] transition-colors ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-orange hover:bg-[#E0580A]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
