import { useEffect, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

// Impede que uma navegação interna ou o fechamento da aba descartem edição
// em andamento. Devolve o bloqueio pendente para a página desenhar o modal.
export function useUnsavedChanges(dirty) {
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        dirty && currentLocation.pathname !== nextLocation.pathname,
      [dirty]
    )
  );

  useEffect(() => {
    if (!dirty) return;
    const aviso = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [dirty]);

  const bloqueio = blocker.state === 'blocked'
    ? { confirmar: () => blocker.proceed(), cancelar: () => blocker.reset() }
    : null;

  return { bloqueio };
}
