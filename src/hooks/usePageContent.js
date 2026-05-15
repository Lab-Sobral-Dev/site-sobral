import { useState, useEffect } from 'react';

const cache = {};

export function usePageContent(page, defaults) {
  const [content, setContent] = useState(() => ({ ...defaults, ...(cache[page] || {}) }));

  useEffect(() => {
    if (cache[page]) return;
    fetch(`/api/content/${page}`)
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object' && !data.error) {
          cache[page] = data;
          setContent(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, [page]);

  return content;
}
