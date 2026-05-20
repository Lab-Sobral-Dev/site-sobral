# Responsividade — Painel Admin

**Data:** 2026-05-20
**Escopo:** Páginas `/admin/*` (continuação da responsividade do site público)
**Abordagem:** Desktop-first retrofit via Tailwind, mesmo padrão da spec anterior

---

## Decisões-chave

| Decisão | Escolha |
|---|---|
| **AdminSlideBuilder em mobile** | Bloquear com tela de aviso (editor visual de pixels é desktop-only por natureza) |
| **Tabelas em mobile** | Converter em cards empilhados (não scroll horizontal) |
| **Padrão de sidebar** | Drawer da esquerda, igual ao site público mas componente separado |

---

## Breakpoints

| Prefixo | Largura | Uso |
|---|---|---|
| _(base)_ | 0–767px | mobile: cards, formulários 1-col, drawer |
| `md:` | ≥768px | tabelas voltam, formulários 2-col |
| `lg:` | ≥1024px | sidebar fixa, SlideBuilder disponível |

---

## 1. AdminLayout + AdminMobileDrawer

**Arquivos:**
- Modify: `src/pages/admin/AdminLayout.jsx`
- Create: `src/components/admin/AdminMobileDrawer.jsx`

### Comportamento

- **Desktop (≥ lg / 1024px):** sidebar fixa 220px, sem mudança visual
- **Mobile (< lg):**
  - Topbar branca fixa com logo "Painel Admin" + hamburguer
  - Sidebar oculta (`hidden lg:flex`)
  - Drawer da **esquerda** com transição `translate-x-[-100%] → translate-x-0`
  - Cabeçalho do drawer com gradiente laranja (igual ao público)
  - Mesmos links de navegação + botão "Sair"
  - Fecha com: ✕, overlay, Esc, ou clique em qualquer link
  - Body com `overflow-hidden` enquanto drawer aberto

### Diferenças do MobileDrawer público

- Posição: esquerda (não direita)
- Conteúdo: links do admin (Catálogo, Conteúdo, Sair)
- NavLink ativo destacado em laranja (igual atual)
- Sem campo de busca (admin não tem busca global)

---

## 2. AdminLoginPage

**Arquivo:** `src/pages/admin/AdminLoginPage.jsx`

**Nenhuma mudança.** Já é responsivo (`max-w-sm` centralizado, `min-h-screen`).

---

## 3. AdminDashboardPage — Tabela vira cards

**Arquivo:** `src/pages/admin/AdminDashboardPage.jsx`

### Header

- Desktop: `flex justify-between` (título à esquerda, botão "+ Novo produto" à direita)
- Mobile: `flex-col gap-3`, botão `w-full`

### Filtros

- Já usa `flex-wrap`, mas `input` busca tem `w-[220px]` fixo
- Mobile: input busca `w-full`, select `w-full`

### Listagem

- Desktop: tabela atual (5 colunas)
- Mobile: tabela ocultada (`hidden md:block` no wrapper), lista de cards renderizada (`md:hidden`)

### Estrutura do card mobile

```jsx
<div className="md:hidden flex flex-col gap-2">
  {products.map(p => (
    <div key={p.id} className="bg-white rounded-[10px] border border-line p-4">
      <div className="flex gap-3 mb-3">
        {p.image && <img src={p.image} className="w-14 h-14 object-contain rounded border border-line flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="font-[700] text-ink truncate">{p.name}</p>
          <p className="text-muted text-[12px] truncate">{p.tag}</p>
        </div>
      </div>
      <div className="flex gap-3 text-[12px] text-ink-light mb-3">
        <span><b>Cat:</b> {p.category_id}</span>
        <span><b>Marca:</b> {p.brand}</span>
      </div>
      <div className="flex justify-between items-center">
        <button onClick={() => toggleAtivo(p.id)} className={...}>
          {p.ativo ? 'Ativo' : 'Inativo'}
        </button>
        <button onClick={() => navigate(`/admin/produtos/${p.id}/editar`)} className="text-orange font-[600]">
          Editar
        </button>
      </div>
    </div>
  ))}
</div>
```

### Padding e container

- `p-8` → `p-4 md:p-8`

---

## 4. AdminProductFormPage

**Arquivo:** `src/pages/admin/AdminProductFormPage.jsx`

- Container: `p-8 max-w-[860px]` → `p-4 md:p-8 max-w-[860px]`
- Grids `grid-cols-2` (ID/Nome, Tag/Marca) → `grid-cols-1 md:grid-cols-2`
- Bloco de imagem `flex gap-3 items-start` → `flex-col md:flex-row gap-3` (preview pode virar abaixo do input em mobile)
- Botões "Salvar" + "Cancelar" no rodapé:
  - Desktop: `flex gap-3` lado a lado
  - Mobile: `flex-col gap-2`, ambos `w-full`

---

## 5. AdminCategoriesPage — Tabela + form

**Arquivo:** `src/pages/admin/AdminCategoriesPage.jsx`

### Container

- `p-8 max-w-[640px]` → `p-4 md:p-8 max-w-[640px]`

### Formulário "Nova categoria"

- Grid `[1fr_2fr_80px]` (ID, Label, Ordem) → `grid-cols-1 md:grid-cols-[1fr_2fr_80px]`
- Em mobile cada campo ocupa linha inteira

### Tabela

- Mesma estratégia do Dashboard: tabela `hidden md:table` (no `<table>` ou wrapper), cards `md:hidden` com ID + Label + Ordem + botão Deletar

---

## 6. AdminContentPage

**Arquivo:** `src/pages/admin/AdminContentPage.jsx`

- Container: `p-8 max-w-[720px]` → `p-4 md:p-8 max-w-[720px]`
- Bloco de campo `image` usa `flex gap-3 items-start` → `flex-col md:flex-row gap-3` (preview vai abaixo em mobile)
- Demais campos já são empilhados verticalmente — sem mudança
- `RichTextEditor`: verificar toolbar overflow em mobile (provavelmente já wrappea)

---

## 7. AdminHeroSlidesPage

**Arquivo:** `src/pages/admin/AdminHeroSlidesPage.jsx`

### Container

- `p-8 max-w-[700px]` → `p-4 md:p-8 max-w-[700px]`

### Header com 2 botões

- Desktop: `flex justify-between` (título + botões à direita)
- Mobile: `flex-col gap-3`, botões empilhados, cada um `w-full`

### Item de slide (SortableSlide)

- Desktop atual: `flex items-center gap-3` com 6 elementos inline (drag, thumb, texto, 3 botões)
- Mobile: continua `flex` mas com `flex-wrap` e:
  - Drag handle + thumb + texto: linha 1 (`w-full` no texto)
  - Botões Editar / Status / Excluir: linha 2, justificados à direita

Implementação: o wrapper externo continua `flex items-center`, mas em mobile usa `flex-wrap` e o div de texto recebe `w-full md:w-auto md:flex-1`. Os botões mantêm tamanho atual.

---

## 8. AdminSlideBuilderPage — Bloqueio em mobile

**Arquivo:** `src/pages/admin/AdminSlideBuilderPage.jsx`

### Estratégia

No início do `return`, adicionar um bloco que mostra **só abaixo de `lg`**:

```jsx
<div className="lg:hidden p-6 min-h-[60vh] flex items-center justify-center">
  <div className="bg-white rounded-[12px] border border-line p-8 text-center max-w-[400px]">
    <div className="text-[48px] mb-3">🖥️</div>
    <h2 className="text-[18px] font-[800] text-ink mb-2">Editor requer desktop</h2>
    <p className="text-[14px] text-ink-light leading-[1.55] mb-6">
      O editor visual de slides usa drag-and-drop pixel-perfect que não funciona bem em telas pequenas. Abra em um computador para editar este slide.
    </p>
    <button
      onClick={() => navigate('/admin/hero-slides')}
      className="bg-orange hover:bg-[#E0580A] text-white font-[700] px-5 py-2.5 rounded-[8px] text-[14px]"
    >
      ← Voltar para Hero Slides
    </button>
  </div>
</div>
```

E envolver o editor atual em `<div className="hidden lg:flex h-full overflow-hidden">...</div>` (substituindo o atual `<div className="flex h-full overflow-hidden">`).

Sem mudanças no comportamento desktop.

---

## Ordem de implementação

1. `AdminMobileDrawer.jsx` (novo) + `AdminLayout.jsx`
2. `AdminDashboardPage.jsx` (tabela → cards)
3. `AdminProductFormPage.jsx`
4. `AdminCategoriesPage.jsx` (form + tabela → cards)
5. `AdminContentPage.jsx`
6. `AdminHeroSlidesPage.jsx`
7. `AdminSlideBuilderPage.jsx` (warning + wrapper)

Cada arquivo: commit individual + push para `main`.

---

## Critérios de aceitação

- Sem regressão em desktop (≥1024px) em nenhuma tela admin
- Em 375px: sem scroll horizontal em nenhuma tela
- AdminLayout drawer: abre/fecha pelo hamburguer, overlay, Esc, ou clique em link
- Tabelas: cards renderizam todas as ações que a tabela tem (status toggle, editar, deletar)
- Formulários: todos os campos acessíveis e utilizáveis com teclado virtual
- SlideBuilder: tela de aviso amigável, com botão de voltar para a listagem
