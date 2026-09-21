import { useEffect, useState } from 'react';

const AVISO_MS = 5 * 60 * 1000;

function formatar(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const min = String(Math.floor(total / 60)).padStart(2, '0');
  const seg = String(total % 60).padStart(2, '0');
  return `${min}:${seg}`;
}

// Avisa quando faltam 5 minutos para a sessão vencer e oferece renovar.
// Sem isso, o token morre no meio de uma edição longa e o trabalho se perde.
export default function SessionExpiryModal({ expiresAt, onRenovar, onSair }) {
  const [restante, setRestante] = useState(null);

  useEffect(() => {
    if (!expiresAt) { setRestante(null); return; }
    const tick = () => setRestante(expiresAt - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (restante === null || restante > AVISO_MS) return null;

  const venceu = restante <= 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sessao-title"
        className="bg-white rounded-[14px] shadow-xl p-6 w-full max-w-sm"
      >
        <h3 id="sessao-title" className="font-[800] text-[17px] text-ink mb-2">
          {venceu ? 'Sua sessão expirou' : 'Sua sessão está expirando'}
        </h3>
        <p className="text-[14px] text-ink-light mb-6 leading-[1.5]">
          {venceu ? (
            'Entre novamente para continuar. O que você digitou foi guardado como rascunho.'
          ) : (
            <>
              Faltam <b className="text-orange">{formatar(restante)}</b> para o fim da sessão.
              Continue conectado para não perder o que está editando.
            </>
          )}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onSair}
            className="px-4 py-2 text-[14px] font-[600] text-ink-light border border-line rounded-[8px] hover:border-orange hover:text-orange transition-colors"
          >
            Sair
          </button>
          {!venceu && (
            <button
              onClick={onRenovar}
              className="px-4 py-2 text-[14px] font-[700] text-white bg-orange hover:bg-[#E0580A] rounded-[8px] transition-colors"
            >
              Continuar conectado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
