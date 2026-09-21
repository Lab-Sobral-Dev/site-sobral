import { useEffect } from 'react';

// Ctrl+S (Cmd+S no Mac) salva o formulário em vez de abrir o "salvar página"
// do navegador. Em formulários longos, poupa a rolagem até o botão.
export function useAtalhoSalvar(aoSalvar, ativo = true) {
  useEffect(() => {
    if (!ativo) return;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        aoSalvar();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aoSalvar, ativo]);
}
