import { useState, useEffect } from 'react';

export function usePageContent(page, defaults) {
  const [content, setContent] = useState(defaults);

  useEffect(() => {
    fetch(`/api/content/${page}`)
      .then(r => r.json())
      .then(data => setContent(prev => ({ ...prev, ...data })))
      .catch(() => {});
  }, [page]);

  return content;
}
