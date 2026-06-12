# Paleta de Cores — Laboratório Sobral

Documentação da paleta de cores do site institucional/catálogo.

As cores são definidas em dois lugares:
- **CSS Variables** (`src/index.css`) — cores de marca (laranja), usadas em runtime e pelo painel Tweaks.
- **Tailwind config** (`tailwind.config.js`) — mapeia as variáveis e define cores neutras fixas.

---

## Cores de marca (laranja)

Tema padrão (`orange-classic`). Definidas como CSS variables em `:root` para permitir troca de tema em runtime.

| Token Tailwind  | CSS Variable     | HEX        | Uso |
|-----------------|------------------|------------|-----|
| `orange`        | `--orange`       | `#F37021`  | Cor primária da marca — botões, links ativos, destaques |
| `orange-dark`   | `--orange-dark`  | `#E0580A`  | Hover/estado pressionado, gradientes |
| `orange-light`  | `--orange-light` | `#F89B4D`  | Realces suaves, gradientes |
| `orange-50`     | `--orange-50`    | `#FFF4EB`  | Fundo de seções/badges, áreas de destaque leve |

```
#F37021  ███  orange         (primária)
#E0580A  ███  orange-dark     (hover)
#F89B4D  ███  orange-light    (realce)
#FFF4EB  ███  orange-50       (fundo claro)
```

---

## Cores neutras

Valores fixos em `tailwind.config.js` (não trocam com o tema).

| Token Tailwind | HEX        | Uso |
|----------------|------------|-----|
| `ink`          | `#3D3D3D`  | Texto principal, títulos (h1–h3) |
| `ink-light`    | `#6B6B6B`  | Texto secundário |
| `muted`        | `#9A9A9A`  | Texto desabilitado, legendas |
| `line`         | `#E5E5E5`  | Bordas, divisórias |
| `bg`           | `#F5F5F5`  | Fundo geral da página (`body`) |
| —              | `#FFFFFF`  | Fundo de cards, painéis e dropdowns |

```
#3D3D3D  ███  ink         (texto principal)
#6B6B6B  ███  ink-light   (texto secundário)
#9A9A9A  ███  muted       (legendas)
#E5E5E5  ███  line        (bordas)
#F5F5F5  ███  bg          (fundo)
#FFFFFF  ███  white       (cards)
```

---

## Temas alternativos

O painel **Tweaks** (modo de edição) permite trocar o tema em runtime sobrescrevendo as variáveis `--orange*`. Definidos em `src/App.jsx`.

### `orange-classic` (padrão)
| Variable         | HEX        |
|------------------|------------|
| `--orange`       | `#F37021`  |
| `--orange-dark`  | `#E0580A`  |
| `--orange-light` | `#F89B4D`  |
| `--orange-50`    | `#FFF4EB`  |

### `deep-clinical` (azul)
| Variable         | HEX        |
|------------------|------------|
| `--orange`       | `#0E6DAA`  |
| `--orange-dark`  | `#084E80`  |
| `--orange-light` | `#3E9AD2`  |
| `--orange-50`    | `#EBF4FA`  |

### `nature-green` (verde)
| Variable         | HEX        |
|------------------|------------|
| `--orange`       | `#2E8540`  |
| `--orange-dark`  | `#1F5E2C`  |
| `--orange-light` | `#5AAE6B`  |
| `--orange-50`    | `#EBF5ED`  |

> **Observação:** os tokens mantêm o nome `orange` por compatibilidade, mesmo nos temas azul/verde. O nome reflete o tema padrão, não a cor literal.

---

## Sombras (referência)

Definidas em `tailwind.config.js`:

| Token       | Valor |
|-------------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,.04), 0 2px 6px rgba(0,0,0,.04)` |
| `shadow`    | `0 4px 14px rgba(0,0,0,.06)` |

---

## Como usar

```jsx
// Tailwind (recomendado)
<button className="bg-orange text-white hover:bg-orange-dark">Comprar</button>
<p className="text-ink-light">Texto secundário</p>
<div className="bg-orange-50 border border-line">...</div>

// CSS variable direta (quando necessário inline)
<div style={{ color: 'var(--orange)' }}>...</div>
```
