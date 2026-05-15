# Admin — Fundação: Toast + Interceptor 401

**Goal:** Eliminar código duplicado de autenticação em todas as páginas admin e adicionar feedback visual em todas as ações que hoje são silenciosas.

**Direção:** Duas peças independentes — um hook `useAdminFetch` e a lib `sonner` — integradas cirurgicamente nas páginas existentes sem redesign.

---

## 1. Dependência nova

Instalar `sonner` (toast notifications):

```bash
npm install sonner
```

Nenhuma outra dependência nova. Zero mudança de stack.

---

## 2. Hook `useAdminFetch`

**Arquivo:** `src/hooks/useAdminFetch.js`

```js
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export function useAdminFetch() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const request = useCallback(async (url, options = {}) => {
    const { headers: extraHeaders, ...rest } = options;
    const isFormData = rest.body instanceof FormData;

    const res = await fetch(url, {
      ...rest,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...extraHeaders,
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      logout();
      navigate('/admin/login');
      return null;
    }

    return res;
  }, [token, logout, navigate]);

  return { request };
}
```

### Contrato

- `request(url, options)` — mesma assinatura do `fetch` nativo, exceto:
  - `Authorization` é injetado automaticamente (não precisa passar)
  - `Content-Type: application/json` é padrão (pode ser sobrescrito em FormData)
  - Se a resposta for 401 → faz logout + redirect para `/admin/login` + retorna `null`
- O caller verifica se `res` é `null` antes de continuar
- Leitura do body (`.json()`, `.text()`) é responsabilidade do caller
- Toasts de sucesso/erro são chamados pelo caller após a request

### Caso especial: upload de arquivo

Quando o `body` for uma instância de `FormData`, o hook **omite `Content-Type` automaticamente** — o browser define `multipart/form-data` com o boundary correto. O caller não precisa fazer nada especial:

```js
const res = await request('/api/upload', {
  method: 'POST',
  body: formData, // hook detecta FormData e não seta Content-Type
});
```

---

## 3. Toaster no AdminLayout

**Arquivo:** `src/pages/admin/AdminLayout.jsx`

Adicionar import e componente:

```jsx
import { Toaster } from 'sonner';

// Dentro do JSX do layout, antes do fechamento do div raiz:
<Toaster position="bottom-right" richColors duration={3000} />
```

`richColors` ativa cores semânticas automáticas (verde para success, vermelho para error). `duration: 3000` fecha após 3 segundos.

---

## 4. Atualização por página

### 4.1 AdminDashboardPage

Substituir `authHeaders` + fetch direto por `useAdminFetch`. Adicionar toasts nos dois pontos de ação:

**Toggle ativo:**
```js
const toggleAtivo = async (id) => {
  const res = await request(`/api/admin/products/${id}/ativo`, { method: 'PATCH' });
  if (!res) return;
  if (res.ok) {
    toast.success('Status atualizado');
    fetchProducts();
  } else {
    toast.error('Erro ao atualizar status');
  }
};
```

**fetchProducts** — sem toast (listagem silenciosa, erros de rede ficam como lista vazia).

### 4.2 AdminProductFormPage

**Salvar produto (criar ou editar):**
```js
if (res.ok) {
  toast.success(isEdit ? 'Produto atualizado' : 'Produto criado');
  navigate('/admin');
} else {
  const data = await res.json();
  toast.error(data.error || 'Erro ao salvar produto');
}
```

**Upload de imagem** — sem toast (é etapa interna do save, o toast do save cobre).

### 4.3 AdminCategoriesPage

**Criar categoria:**
```js
if (res.ok) {
  toast.success('Categoria criada');
  // reset form + refetch
} else {
  const data = await res.json();
  toast.error(data.error || 'Erro ao criar categoria');
}
```

**Deletar categoria:**
```js
if (res.ok) {
  toast.success('Categoria removida');
  fetchCategories();
} else {
  const data = await res.json();
  toast.error(data.error || 'Não foi possível remover a categoria');
}
```

### 4.4 AdminContentPage

O auto-save atual já exibe um indicador inline ("✓ Salvo") — ele é mantido. O toast é adicionado **apenas no caso de erro** (hoje o catch é silencioso):

```js
try {
  const res = await request(`/api/admin/content/...`, { method: 'PUT', body: ... });
  if (!res || !res.ok) throw new Error();
  setSaved(s => ({ ...s, [key]: true }));
  // timeout para limpar indicador
} catch {
  toast.error('Erro ao salvar. Verifique a conexão.');
}
```

### 4.5 AdminHeroSlidesPage

**Toggle ativo do slide:**
```js
if (res.ok) toast.success('Slide atualizado');
else toast.error('Erro ao atualizar slide');
```

**Reordenar:**
```js
// mantém optimistic update; em caso de falha:
catch { setSlides(previous); toast.error('Erro ao reordenar. Tente novamente.'); }
```

**Deletar slide:**
```js
if (res.ok) { toast.success('Slide removido'); fetchSlides(); }
else toast.error('Erro ao remover slide');
```

**Upload de novo slide / import PSD:**
```js
if (res.ok) { toast.success('Slide criado'); fetchSlides(); }
else toast.error('Erro ao criar slide');
```

### 4.6 AdminSlideBuilderPage

**Salvar slide:**
```js
if (res.ok) { toast.success('Slide salvo'); navigate('/admin/hero-slides'); }
else toast.error('Erro ao salvar slide');
```

---

## 5. O que NÃO muda

- `AdminLoginPage` — não usa `useAdminFetch` (não há token ainda no login)
- Lógica de negócio de cada página — apenas o padrão de fetch e o feedback mudam
- Layout visual do admin — nenhuma mudança de UI além dos toasts e remoção do 401 inline

---

## Ordem de implementação sugerida

1. `npm install sonner`
2. Criar `src/hooks/useAdminFetch.js`
3. Adicionar `<Toaster />` em `AdminLayout.jsx`
4. Atualizar `AdminDashboardPage.jsx`
5. Atualizar `AdminProductFormPage.jsx`
6. Atualizar `AdminCategoriesPage.jsx`
7. Atualizar `AdminContentPage.jsx`
8. Atualizar `AdminHeroSlidesPage.jsx`
9. Atualizar `AdminSlideBuilderPage.jsx`
