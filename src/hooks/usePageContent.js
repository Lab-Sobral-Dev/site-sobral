import { useState, useEffect } from 'react';

const cache = {};
const TTL_MS = 5 * 60 * 1000;

export function usePageContent(page, defaults) {
  const [content, setContent] = useState(() => {
    const entry = cache[page];
    if (entry && Date.now() - entry.ts < TTL_MS) {
      return { ...defaults, ...entry.data };
    }
    return { ...defaults };
  });

  useEffect(() => {
    const entry = cache[page];
    if (entry && Date.now() - entry.ts < TTL_MS) return;
    fetch(`/api/content/${page}`)
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object' && !data.error) {
          cache[page] = { data, ts: Date.now() };
          setContent(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, [page]);

  return content;
}
