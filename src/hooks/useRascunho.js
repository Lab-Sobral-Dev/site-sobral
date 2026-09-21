import { useEffect, useRef, useState } from 'react';

const PREFIXO = 'sobral_draft_';

// Guarda o formulário em localStorage enquanto se digita, para que uma sessão
// expirada, um fechamento acidental ou uma queda não levem o trabalho junto.
// Toda leitura/escrita é protegida: modo privativo ou storage cheio não podem
// quebrar o formulário.
export function useRascunho(chave, valor, { ativo = true } = {}) {
  const storageKey = PREFIXO + chave;
  const [rascunho, setRascunho] = useState(null);
  const primeiraCarga = useRef(true);

  // Na montagem, procura um rascunho anterior.
  useEffect(() => {
    try {
      const bruto = localStorage.getItem(storageKey);
      if (bruto) setRascunho(JSON.parse(bruto));
    } catch { /* storage indisponível: segue sem rascunho */ }
  }, [storageKey]);

  // Grava com debounce a cada mudança, menos na primeira renderização.
  useEffect(() => {
    if (!ativo) return;
    if (primeiraCarga.current) { primeiraCarga.current = false; return; }
    const id = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          dados: valor,
          salvoEm: new Date().toISOString(),
        }));
      } catch { /* sem espaço: o formulário continua funcionando */ }
    }, 1000);
    return () => clearTimeout(id);
  }, [valor, ativo, storageKey]);

  const limpar = () => {
    try { localStorage.removeItem(storageKey); } catch {}
    setRascunho(null);
  };

  return { rascunho, descartar: limpar, limpar };
}
