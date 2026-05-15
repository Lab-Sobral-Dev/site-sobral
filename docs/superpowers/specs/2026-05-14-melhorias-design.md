# Melhorias de Design — Spec

**Goal:** Melhorar o acabamento visual do site com footer mais completo e micro-interações que transmitem polimento sem alterar a identidade da marca.

**Direção:** Clean & Profissional — fundo claro, tipografia Nunito (sem alteração), laranja como cor primária.

---

## 1. Footer — Conteúdo Completo

**Arquivo:** `src/components/Footer.jsx`

### O que muda

| Coluna | Hoje | Depois |
|---|---|---|
| Logo + endereço | Endereço parcial | Endereço completo + CEP + tagline "EMPRESA BRASILEIRA DESDE 1911" |
| (nova) Fale Conosco | Não existe | Telefone, celular, email SAC, número SAC |
| Institucional | Home, Quem Somos, Privacidade, Fale Conosco | + Produtos, + Trabalhe Conosco (link próprio) |
| Redes Sociais | Links `href="#"` | Sem mudança estrutural (URLs reais a definir pelo cliente) |

### Layout

Grid de 4 colunas mantido: `[1.2fr 1fr 1.2fr 1fr]`. A coluna de contato ocupa o slot atual de "Links Rápidos" (que só tinha 1 item). "Links Rápidos" é removido e seu item "Trabalhe Conosco" vai para a coluna Institucional.

Nova estrutura de colunas:
1. Logo + endereço + tagline
2. Fale Conosco (telefone, celular, email, SAC)
3. Institucional (Home, Quem Somos, Produtos, Fale Conosco, Trabalhe Conosco, Privacidade)
4. Redes Sociais

### Tagline

```
EMPRESA BRASILEIRA DESDE 1911
```

Posicionada abaixo do endereço, em `font-size: 10px`, `letter-spacing: 2px`, `opacity: 0.65`, caixa alta.

### Dados de contato

```
(89) 2101-2202
(89) 99921-0283
sac@laboratoriosobral.com.br
SAC 0800 979 5040
```

---

## 2. Scroll Reveal — Seções da Home

**Arquivos:**
- Criar: `src/hooks/useScrollReveal.js`
- Modificar: `src/pages/HomePage.jsx`
- Criar: `src/index.css` ou `src/styles/animations.css` (classes CSS)

### Comportamento

Cada seção entra com fade + slide-up ao cruzar o viewport pela primeira vez. A animação dispara uma única vez por sessão (não repete ao rolar para cima e voltar).

- `opacity: 0 → 1`
- `transform: translateY(24px) → translateY(0)`
- Duração: `600ms`
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out suave)
- Delay escalonado entre elementos filhos: `0ms`, `100ms`, `200ms`

### Hook

```js
// src/hooks/useScrollReveal.js
// Retorna uma ref para anexar ao elemento.
// Quando o elemento entra no viewport, adiciona a classe 'revealed'.
// threshold: 0.12 (12% visível dispara)
// rootMargin: '0px 0px -40px 0px' (antecipa ligeiramente)
```

### Seções que recebem o efeito na Home

- Faixa "Nossas Linhas"
- Faixa "Mais Vendidos"
- Seção "Nossa História"

O hero (HeroCarousel) **não** recebe reveal — já está visível no carregamento.

### CSS

```css
.reveal { opacity: 0; transform: translateY(24px); transition: opacity 600ms cubic-bezier(0.16,1,0.3,1), transform 600ms cubic-bezier(0.16,1,0.3,1); }
.reveal.revealed { opacity: 1; transform: translateY(0); }
.reveal-delay-1 { transition-delay: 100ms; }
.reveal-delay-2 { transition-delay: 200ms; }
```

---

## 3. Fade Entre Páginas

**Arquivos:**
- Modificar: `src/App.jsx`
- Modificar: `src/main.jsx` (ou arquivo de layout global)
- CSS em `src/index.css`

### Comportamento

Ao navegar entre rotas, o wrapper do conteúdo faz:
1. Fade-out: `opacity: 1 → 0` em `150ms`
2. Troca de rota (React Router atualiza)
3. Fade-in: `opacity: 0 → 1` em `200ms`

Implementado com `key` no `<Routes>` baseado no `pathname` atual + classe CSS controlada por estado.

### Alternativa sem estado

Usar a prop `key={location.pathname}` no wrapper das rotas + CSS animation:

```css
@keyframes pageFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-wrapper { animation: pageFadeIn 200ms ease both; }
```

Cada mudança de `key` remonta o wrapper → animação dispara automaticamente. Sem estado extra, sem setTimeout.

---

## 4. Hover Elevado nos Cards de Produto

**Arquivo:** `src/components/ProductCard.jsx`

### Comportamento

```css
transition: transform 220ms ease, box-shadow 220ms ease;

/* hover */
transform: translateY(-5px);
box-shadow: 0 10px 28px rgba(243, 112, 33, 0.14);
```

A imagem do produto recebe `transition: transform 300ms ease` com `hover: scale(1.04)` dentro do container com `overflow: hidden`.

### Restrição

`will-change: transform` aplicado apenas no hover (via JS ou classe condicional) para não impactar performance de cards fora da viewport.

---

## 5. Feedback Visual nos Botões

**Arquivos:**
- `src/index.css` — adicionar classe `.btn-ripple` e keyframe
- Componentes que usam botões primários: `HomePage.jsx`, `ProdutosPage.jsx`, `FaleConoscoPage.jsx`, botões do admin

### Efeito ripple

Implementado via pseudo-elemento CSS `::after` + animação ao `:active`:

```css
.btn-ripple { position: relative; overflow: hidden; }
.btn-ripple::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  width: 120%;
  padding-top: 120%;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) scale(0);
  background: rgba(255, 255, 255, 0.35);
  pointer-events: none;
}
.btn-ripple:active::after {
  animation: ripple-effect 500ms ease-out;
}
@keyframes ripple-effect {
  from { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  to   { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}
```

A classe `btn-ripple` é adicionada nos botões primários (gradiente laranja). Botões secundários (outlined) recebem apenas o hover padrão existente, sem ripple.

---

## Fora do Escopo

- Alteração de tipografia (Nunito mantido integralmente)
- Dark mode
- Alteração de paleta de cores
- Redesign do header/navegação
- Novos cards de categoria na home

---

## Ordem de Implementação Sugerida

1. Footer (mudança isolada, sem risco de regressão)
2. Hover nos cards (mudança isolada em um componente)
3. Feedback nos botões (CSS global + classe)
4. Scroll reveal (hook + CSS + HomePage)
5. Fade entre páginas (App.jsx + CSS)
