# Responsividade — Site Público

**Data:** 2026-05-20
**Escopo:** Apenas o site público (admin excluído desta iteração)
**Abordagem:** Desktop-first retrofit — manter estilos desktop intactos, adicionar breakpoints mobile por cima

---

## Breakpoints

| Prefixo Tailwind | Largura | Uso |
|---|---|---|
| _(sem prefixo)_ | 0–767px | mobile (base) |
| `md:` | ≥768px | desktop para a maioria das seções |
| `sm:` | ≥640px | footer (2 colunas intermediárias) |
| `lg:` | ≥1024px | header (nav desktop visível) |

---

## 1. Header + MobileDrawer

**Arquivo:** `src/components/Header.jsx`
**Novo componente:** `src/components/MobileDrawer.jsx`

### Comportamento

- **Desktop (≥ lg / 1024px):** sem nenhuma mudança visual. Nav com dropdowns e busca permanecem como estão.
- **Mobile (< lg):** nav e busca ficam ocultos (`hidden lg:flex` / `hidden lg:block`). Aparece ícone hamburguer (`lg:hidden`) à direita do logo.

### MobileDrawer

- Drawer deslizante da direita com transição `translate-x-full → translate-x-0` (CSS transition, sem biblioteca externa)
- Overlay escuro semitransparente (`bg-black/50`) cobre o restante da tela
- Cabeçalho do drawer usa gradiente laranja da identidade (`from-[#F89B4D] to-[#E85A0C]`) com logo e botão ✕
- Busca fica no topo do corpo do drawer (mesmo comportamento de `Enter` para navegar)
- Itens de menu: O Sobral, Produtos, Mais Vendidos, Fale Conosco
- Cada item com submenu (O Sobral, Produtos, Mais Vendidos) expande inline como accordion dentro do drawer
- Fecha com: clique no ✕, clique no overlay, tecla `Escape`
- Bloqueia scroll do body enquanto aberto (`overflow-hidden` no `document.body`)
- Estado `isOpen` gerenciado dentro do `Header.jsx` com `useState`

---

## 2. HeroCarousel

**Arquivo:** `src/components/HeroCarousel.jsx`

- Desktop: aspect ratio `1920/600` mantido via `style={{ aspectRatio: '1920/600' }}`
- Mobile: substituir por classe Tailwind `aspect-[4/3] max-h-[280px]` abaixo de `md`
- Implementação: trocar o `style` inline por uma classe condicional via Tailwind (`md:` para o ratio wide)
- Botões ‹ › e pontos de navegação permanecem iguais — já funcionam em qualquer largura

---

## 3. HomePage

**Arquivo:** `src/pages/HomePage.jsx`

### Nossas Linhas (4 marcas)
- Desktop: `grid grid-cols-4`
- Mobile: `grid grid-cols-2 md:grid-cols-4`
- Padding: `px-4 md:px-10`

### Mais Vendidos (carrossel)
- Desktop: exibe 4 produtos (`visible = featured.slice(idx, idx + 4)`) — sem mudança
- Mobile: os 4 items continuam no DOM; items 3 e 4 ficam ocultos com `hidden md:block` (CSS puro, sem JS de viewport)
- Grid: `grid grid-cols-2 md:grid-cols-4`
- Botões ‹ › ficam com `w-8 h-8` em mobile vs `w-10 h-10` atual

### Seção História
- Desktop: `grid grid-cols-[1.1fr_1fr] gap-12`
- Mobile: `grid grid-cols-1 md:grid-cols-[1.1fr_1fr]`; foto aparece **acima** do texto em mobile (`order-first md:order-last`)
- Padding: `px-4 md:px-10`

---

## 4. Footer

**Arquivo:** `src/components/Footer.jsx`

- Desktop: `grid grid-cols-[1.2fr_1fr_1.2fr_1fr] gap-10`
- Mobile: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.2fr_1fr_1.2fr_1fr]`
- Padding: `px-4 md:px-10`

---

## 5. QuemSomosPage

**Arquivo:** `src/pages/QuemSomosPage.jsx`

### MVV (Missão / Visão / Valores)
- Desktop: `grid grid-cols-[220px_1fr] gap-8`
- Mobile: `grid grid-cols-1 md:grid-cols-[220px_1fr]`; título e texto empilhados, borda esquerda laranja mantida
- Padding do card: `p-6 md:p-[36px_50px]`

### Seção História
- Desktop: `grid grid-cols-2 gap-[60px]`
- Mobile: `grid grid-cols-1 md:grid-cols-2`
- Pull-quote: em desktop usa `absolute bottom-[38px] -left-[30px]`; em mobile perde o offset negativo: `md:-left-[30px] left-0 relative md:absolute`
- Padding: `px-4 md:px-10`

---

## 6. ProdutoPage

**Arquivo:** `src/pages/ProdutoPage.jsx`

### Galeria + Info do produto
- Desktop: `grid grid-cols-[1fr_1.1fr] gap-16`
- Mobile: `grid grid-cols-1 md:grid-cols-[1fr_1.1fr]`; galeria aparece primeiro
- Padding: `px-4 md:px-10`

### Seção Ingredientes + Nutricional
- Desktop: `grid grid-cols-2 gap-12`
- Mobile: `grid grid-cols-1 md:grid-cols-2`
- `border-l` da tabela nutricional: `md:border-l`; em mobile sem borda lateral, sem `pl-12`
- Padding: `px-4 md:px-10`

---

## 7. FaleConoscoPage

**Arquivo:** `src/pages/FaleConoscoPage.jsx`

### Bloco de informações de contato
- Desktop: `grid grid-cols-[1.4fr_1fr] gap-12`
- Mobile: `grid grid-cols-1 md:grid-cols-[1.4fr_1fr]`

### Formulário
- Desktop: `grid grid-cols-2 gap-[14px]`
- Mobile: `grid grid-cols-1 md:grid-cols-2`
- Campos que hoje são `col-span-2` mantêm esse comportamento em desktop; em mobile já ocupam a coluna única naturalmente
- Padding: `px-4 md:px-10`

---

## Arquivos fora de escopo (já responsivos)

- `src/pages/ProdutosPage.jsx` — já usa `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- `src/pages/MisturinhasPage.jsx` — já usa breakpoints `lg:` em todas as seções
- `src/pages/PrivacidadePage.jsx` — apenas texto, sem grid complexo
- `src/pages/admin/*` — fora do escopo desta iteração

---

## Ordem de implementação

1. `MobileDrawer.jsx` (novo componente) + `Header.jsx`
2. `HeroCarousel.jsx`
3. `HomePage.jsx`
4. `Footer.jsx`
5. `QuemSomosPage.jsx`
6. `ProdutoPage.jsx`
7. `FaleConoscoPage.jsx`

Cada arquivo recebe um commit individual seguindo Conventional Commits.

---

## Critérios de aceitação

- Nenhuma regressão visual em desktop (≥1024px)
- Em 375px (iPhone SE): sem scroll horizontal, sem conteúdo cortado, sem texto sobreposto
- Header mobile: drawer abre/fecha corretamente, submenus expansíveis, scroll bloqueado quando aberto
- HeroCarousel: visível e proporcionado em mobile
- Formulário Fale Conosco: utilizável com teclado virtual em mobile
