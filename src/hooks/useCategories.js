import { useState, useEffect } from 'react';

// Cache do módulo: Header, menu mobile e catálogo dividem uma única requisição
// e, em navegações internas, as categorias já chegam prontas (sem salto).
let cache = null;
let pending = null;

function load() {
  if (!pending) {
    pending = fetch('/api/categories')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(data => { cache = Array.isArray(data) ? data : []; return cache; })
      .catch(() => { pending = null; return []; });
  }
  return pending;
}

export function useCategories() {
  const [categories, setCategories] = useState(cache || []);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    load().then(data => { if (alive) setCategories(data); });
    return () => { alive = false; };
  }, []);

  return categories;
}
