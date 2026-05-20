# Responsividade do Site Público — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o site público (Header, Home, Quem Somos, Produto, Fale Conosco, Hero, Footer) totalmente responsivo em telas a partir de 375px, mantendo o visual desktop atual intacto.

**Architecture:** Desktop-first retrofit via Tailwind. Cada grid/layout fixo recebe `grid-cols-1` como base e o layout atual fica atrás do prefixo `md:` (ou `lg:` no Header). Um novo componente `MobileDrawer.jsx` é criado para o menu mobile. Nenhuma biblioteca adicional.

**Tech Stack:** React 18, Vite, Tailwind CSS 3, React Router v6

**Observações:**
- O projeto não tem framework de testes. Verificação é por inspeção visual no browser em 3 breakpoints: **375px** (iPhone SE), **768px** (limite md), **1280px** (desktop).
- Servidores dev devem estar rodando (`npm run dev` no root e `npm run dev` em `server/`).
- Use o DevTools do navegador (responsive mode) para verificar cada breakpoint.
- Commits seguem Conventional Commits + push após cada tarefa (regra do CLAUDE.md).

---

## File Structure

**Novo:**
- `src/components/MobileDrawer.jsx` — drawer lateral mobile

**Modificados:**
- `src/components/Header.jsx` — integra MobileDrawer, esconde nav/busca em mobile
- `src/components/HeroCarousel.jsx` — aspect-ratio responsivo
- `src/components/Footer.jsx` — grid responsivo
- `src/pages/HomePage.jsx` — 3 grids responsivos
- `src/pages/QuemSomosPage.jsx` — MVV e história responsivos
- `src/pages/ProdutoPage.jsx` — galeria/info + ingredientes responsivos
- `src/pages/FaleConoscoPage.jsx` — info + formulário responsivos

---

## Task 1: Criar MobileDrawer.jsx

**Files:**
- Create: `src/components/MobileDrawer.jsx`

- [ ] **Step 1: Criar o componente MobileDrawer**

Crie o arquivo `src/components/MobileDrawer.jsx` com este conteúdo:

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="4" y1="7"  x2="20" y2="7"  />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="6" y1="6"  x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6"  />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"/>
      <line x1="21" y1="21" x2="16.5" y2="16.5"/>
    </svg>
  );
}

const NAV_SECTIONS = [
  {
    id: 'sobral',
    label: 'O Sobral',
    items: [
      { label: 'Quem Somos',         to: '/quem-somos' },
      { label: 'Nossa História',     to: '/quem-somos' },
      { label: 'Trabalhe Conosco',   to: '/fale-conosco' },
    ],
  },
  {
    id: 'produtos',
    label: 'Produtos',
    items: [
      { label: 'Todos os produtos',         to: '/produtos' },
      { label: 'Suplementos',               to: '/produtos?cat=suplementos' },
      { label: 'Tradicionais',              to: '/produtos?cat=tradicionais' },
      { label: 'Cosméticos',                to: '/produtos?cat=cosmeticos' },
      { label: 'Dicas de Misturinhas ✨',   to: '/misturinhas' },
    ],
  },
  {
    id: 'vendidos',
    label: 'Mais Vendidos',
    items: [
      { label: 'Aqualemã Sobral',             to: '/produtos/aqualema' },
      { label: 'Calciolax Articule',          to: '/produtos/calciolax-articule' },
      { label: 'Saludoz Ômega AZ',            to: '/produtos/saludoz' },
      { label: 'Extrato de Própolis Verde',   to: '/produtos/propolis-verde' },
    ],
  },
];

export default function MobileDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setExpanded(null);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const go = (to) => {
    navigate(to);
    onClose();
    setQuery('');
  };

  const onSearchKey = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/produtos?q=${encodeURIComponent(query.trim())}`);
      onClose();
      setQuery('');
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-200 lg:hidden ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[82%] max-w-[340px] bg-white z-[70] shadow-[-4px_0_24px_rgba(0,0,0,.18)] transform transition-transform duration-300 lg:hidden flex flex-col ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Menu principal"
      >
        <div className="bg-gradient-to-r from-[#F89B4D] to-[#E85A0C] px-5 py-4 flex justify-between items-center">
          <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
            <img src="/images/logo.png" alt="Laboratório Sobral" className="w-full h-full object-cover" />
          </div>
          <button onClick={onClose} className="text-white p-1.5" aria-label="Fechar menu">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="relative mb-4">
            <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Pesquisar produto"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              className="w-full py-2.5 pl-[38px] pr-4 rounded-full border border-line bg-white text-[14px] text-ink outline-none focus:border-orange focus:shadow-[0_0_0_3px_rgba(243,112,33,.12)] placeholder:text-muted"
            />
          </div>

          <div className="text-[11px] tracking-[2px] font-[900] text-orange mb-2">MENU</div>

          {NAV_SECTIONS.map((section) => {
            const isOpen = expanded === section.id;
            return (
              <div key={section.id} className="border-b border-line">
                <button
                  onClick={() => setExpanded(isOpen ? null : section.id)}
                  className="w-full flex justify-between items-center py-3.5 text-left font-bold text-[15px] text-ink"
                  aria-expanded={isOpen}
                >
                  {section.label}
                  <span className={`text-orange text-[13px] transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
                </button>
                {isOpen && (
                  <div className="pb-3 pl-3 flex flex-col gap-1.5">
                    {section.items.map((it) => (
                      <button
                        key={it.label}
                        onClick={() => go(it.to)}
                        className="text-left text-[14px] font-semibold text-ink-light py-1.5 hover:text-orange"
                      >
                        {it.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={() => go('/fale-conosco')}
            className="w-full text-left py-3.5 font-bold text-[15px] text-ink border-b border-line"
          >
            Fale Conosco
          </button>
        </div>
      </aside>
    </>
  );
}

export { HamburgerIcon };
```

- [ ] **Step 2: Verificar que não há erros de sintaxe**

O Vite faz hot-reload automático. Verifique no terminal do dev server se não apareceram erros. A página atual deve continuar funcionando (o componente ainda não está integrado em lugar nenhum).

- [ ] **Step 3: Commit**

```bash
git add src/components/MobileDrawer.jsx
git commit -m "feat(header): cria MobileDrawer para menu mobile"
git push origin main
```

---

## Task 2: Integrar MobileDrawer no Header

**Files:**
- Modify: `src/components/Header.jsx`

- [ ] **Step 1: Substituir todo o conteúdo de Header.jsx**

Substitua o conteúdo completo do arquivo por:

```jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileDrawer, { HamburgerIcon } from './MobileDrawer';

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"/>
      <line x1="21" y1="21" x2="16.5" y2="16.5"/>
    </svg>
  );
}

function NavDropdown({ id, label, items, open, onToggle, onNavigate }) {
  return (
    <div
      className={`nav-item relative font-bold text-[15px] py-2.5 flex items-center gap-1.5 cursor-pointer select-none transition-colors hover:text-orange ${open ? 'open text-orange' : 'text-ink'}`}
      onClick={(e) => { e.stopPropagation(); onToggle(open ? null : id); }}
    >
      {label}
      <span className="caret" />
      <div className="nav-dropdown">
        {items.map((it) => (
          <a
            key={it.label}
            className="block px-4 py-2 text-[14px] font-semibold text-ink-light transition-all hover:bg-orange-50 hover:text-orange cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onNavigate(it.to); onToggle(null); }}
          >
            {it.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onClick = (e) => {
      if (!e.target.closest('.nav-item')) setOpenDropdown(null);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/produtos?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  const isFaleConosco = location.pathname === '/fale-conosco';

  return (
    <>
      <div className="h-[6px] bg-gradient-to-r from-[#FFB46B] via-orange to-[#FFB46B]" />
      <header className="bg-white px-4 md:px-10 py-[14px] flex items-center gap-4 lg:gap-10 shadow-sm sticky top-0 z-50">
        <div
          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex-shrink-0 overflow-hidden cursor-pointer"
          onClick={() => navigate('/')}
          title="Laboratório Sobral"
        >
          <img src="/images/logo.png" alt="Laboratório Sobral" width={56} height={56} className="w-full h-full object-cover rounded-full" />
        </div>

        <nav className="hidden lg:flex gap-7 items-center flex-1">
          <NavDropdown
            id="sobral" label="O Sobral" open={openDropdown === 'sobral'}
            onToggle={setOpenDropdown} onNavigate={navigate}
            items={[
              { label: 'Quem Somos', to: '/quem-somos' },
              { label: 'Nossa História', to: '/quem-somos' },
              { label: 'Trabalhe Conosco', to: '/fale-conosco' },
            ]}
          />
          <NavDropdown
            id="produtos" label="Produtos" open={openDropdown === 'produtos'}
            onToggle={setOpenDropdown} onNavigate={navigate}
            items={[
              { label: 'Todos os produtos', to: '/produtos' },
              { label: 'Suplementos', to: '/produtos?cat=suplementos' },
              { label: 'Tradicionais', to: '/produtos?cat=tradicionais' },
              { label: 'Cosméticos', to: '/produtos?cat=cosmeticos' },
              { label: 'Dicas de Misturinhas ✨', to: '/misturinhas' },
            ]}
          />
          <NavDropdown
            id="vendidos" label="Mais Vendidos" open={openDropdown === 'vendidos'}
            onToggle={setOpenDropdown} onNavigate={navigate}
            items={[
              { label: 'Aqualemã Sobral', to: '/produtos/aqualema' },
              { label: 'Calciolax Articule', to: '/produtos/calciolax-articule' },
              { label: 'Saludoz Ômega AZ', to: '/produtos/saludoz' },
              { label: 'Extrato de Própolis Verde', to: '/produtos/propolis-verde' },
            ]}
          />
          <div
            className={`font-bold text-[15px] py-2.5 cursor-pointer transition-colors hover:text-orange ${isFaleConosco ? 'text-orange' : 'text-ink'}`}
            onClick={() => navigate('/fale-conosco')}
          >
            Fale Conosco
          </div>
        </nav>

        <div className="hidden lg:block relative w-[260px]">
          <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Pesquisar produto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full py-[9px] pl-[38px] pr-4 rounded-full border border-line bg-white text-[13px] text-ink outline-none transition-[border-color,box-shadow] focus:border-orange focus:shadow-[0_0_0_3px_rgba(243,112,33,.12)] placeholder:text-muted"
          />
        </div>

        <button
          className="lg:hidden ml-auto text-ink p-2"
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menu"
        >
          <HamburgerIcon />
        </button>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
```

- [ ] **Step 2: Verificar em desktop (≥1024px)**

Abra `http://localhost:5173` em uma janela ≥1024px de largura.

Expected:
- Logo, nav com 4 itens e busca visíveis (idêntico ao antes)
- Hamburguer NÃO visível
- Hover nos dropdowns funciona

- [ ] **Step 3: Verificar em mobile (375px)**

Use DevTools (F12) → responsive mode → 375x667 (iPhone SE).

Expected:
- Logo à esquerda, hamburguer à direita
- Nav e busca desktop ocultos
- Click no hamburguer → drawer desliza da direita
- Header do drawer com gradiente laranja e botão ✕
- Busca + 3 seções expansíveis + Fale Conosco
- Click numa seção (ex: Produtos) → expande lista de subitens
- Click num item → navega e fecha drawer
- Click no overlay → fecha drawer
- Tecla Esc → fecha drawer
- Body scroll bloqueado enquanto drawer aberto

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.jsx
git commit -m "feat(header): adiciona menu mobile com drawer lateral"
git push origin main
```

---

## Task 3: HeroCarousel responsivo

**Files:**
- Modify: `src/components/HeroCarousel.jsx`

- [ ] **Step 1: Trocar aspect-ratio inline por classe responsiva**

No arquivo `src/components/HeroCarousel.jsx`, localize a tag `<section>` (linha 77-82) que está assim:

```jsx
<section
  className="w-full bg-bg relative overflow-hidden"
  style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
  onMouseEnter={() => setPaused(true)}
  onMouseLeave={() => setPaused(false)}
>
```

Substitua por:

```jsx
<section
  className="w-full bg-bg relative overflow-hidden aspect-[4/3] max-h-[280px] md:aspect-[1920/600] md:max-h-none"
  onMouseEnter={() => setPaused(true)}
  onMouseLeave={() => setPaused(false)}
>
```

- [ ] **Step 2: Verificar em desktop (1280px)**

Recarregue `http://localhost:5173`. O hero deve manter o aspect ratio largo (1920/600) como antes.

- [ ] **Step 3: Verificar em mobile (375px)**

No DevTools, redimensione para 375px. O hero agora tem aspect ratio 4:3 com altura máxima de 280px. Não fica achatado/inutilizável.

- [ ] **Step 4: Commit**

```bash
git add src/components/HeroCarousel.jsx
git commit -m "feat(hero): aspect ratio 4:3 em mobile, 1920/600 em desktop"
git push origin main
```

---

## Task 4: HomePage responsiva

**Files:**
- Modify: `src/pages/HomePage.jsx`

- [ ] **Step 1: Tornar a seção "Nossas Linhas" responsiva**

Localize o bloco da seção "NOSSAS LINHAS". Substitua:

```jsx
{/* NOSSAS LINHAS */}
<section ref={refLinhas} className="reveal max-w-content mx-auto px-10 mt-[60px]">
  <div className="text-center mt-10 mb-7">
    <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-1.5">{content.linhas_eyebrow}</div>
    <h2 className="font-display text-[36px] font-[900] tracking-[-.5px] leading-none">{content.linhas_titulo}</h2>
  </div>
  <div className="grid grid-cols-4 gap-5 max-w-[960px] mx-auto">
```

Por:

```jsx
{/* NOSSAS LINHAS */}
<section ref={refLinhas} className="reveal max-w-content mx-auto px-4 md:px-10 mt-[60px]">
  <div className="text-center mt-10 mb-7">
    <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-1.5">{content.linhas_eyebrow}</div>
    <h2 className="font-display text-[28px] md:text-[36px] font-[900] tracking-[-.5px] leading-none">{content.linhas_titulo}</h2>
  </div>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-[960px] mx-auto">
```

- [ ] **Step 2: Tornar a seção "Mais Vendidos" responsiva**

Localize o bloco "MAIS VENDIDOS". Substitua:

```jsx
{/* MAIS VENDIDOS */}
<section ref={refVendidos} className="reveal max-w-content mx-auto px-10 mt-[70px]">
  <div className="text-center mt-10 mb-7">
    <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-1.5">{content.vendidos_eyebrow}</div>
    <h2 className="font-display text-[36px] font-[900] tracking-[-.5px] leading-none">{content.vendidos_titulo}</h2>
  </div>
  <div className="relative">
    <button
      className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-none bg-white shadow text-orange flex items-center justify-center text-[22px] z-[5] transition-all hover:bg-orange hover:text-white disabled:opacity-30"
      onClick={() => setCarouselIdx(Math.max(0, carouselIdx - 1))}
      disabled={carouselIdx === 0}
    >‹</button>
    <div className="grid grid-cols-4 gap-[18px] px-5">
      {visible.map(p => (
        <ProductCard key={p.id} product={p} onClick={() => navigate(`/produtos/${p.id}`)} />
      ))}
    </div>
    <button
      className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-none bg-white shadow text-orange flex items-center justify-center text-[22px] z-[5] transition-all hover:bg-orange hover:text-white disabled:opacity-30"
      onClick={() => setCarouselIdx(Math.min(featured.length - 4, carouselIdx + 1))}
      disabled={carouselIdx >= featured.length - 4}
    >›</button>
  </div>
</section>
```

Por:

```jsx
{/* MAIS VENDIDOS */}
<section ref={refVendidos} className="reveal max-w-content mx-auto px-4 md:px-10 mt-[70px]">
  <div className="text-center mt-10 mb-7">
    <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-1.5">{content.vendidos_eyebrow}</div>
    <h2 className="font-display text-[28px] md:text-[36px] font-[900] tracking-[-.5px] leading-none">{content.vendidos_titulo}</h2>
  </div>
  <div className="relative">
    <button
      className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full border-none bg-white shadow text-orange flex items-center justify-center text-[18px] md:text-[22px] z-[5] transition-all hover:bg-orange hover:text-white disabled:opacity-30"
      onClick={() => setCarouselIdx(Math.max(0, carouselIdx - 1))}
      disabled={carouselIdx === 0}
    >‹</button>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-[18px] px-2 md:px-5">
      {visible.map((p, i) => (
        <div key={p.id} className={i >= 2 ? 'hidden md:block' : ''}>
          <ProductCard product={p} onClick={() => navigate(`/produtos/${p.id}`)} />
        </div>
      ))}
    </div>
    <button
      className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full border-none bg-white shadow text-orange flex items-center justify-center text-[18px] md:text-[22px] z-[5] transition-all hover:bg-orange hover:text-white disabled:opacity-30"
      onClick={() => setCarouselIdx(Math.min(featured.length - 4, carouselIdx + 1))}
      disabled={carouselIdx >= featured.length - 4}
    >›</button>
  </div>
</section>
```

- [ ] **Step 3: Tornar a seção "História" responsiva**

Localize o bloco "HISTÓRIA". Substitua:

```jsx
{/* HISTÓRIA */}
<section ref={refHistoria} className="reveal max-w-content mx-auto px-10 mt-[80px]">
  <div className="grid grid-cols-[1.1fr_1fr] gap-12 items-center">
    <div>
      <div className="mt-12 mb-6">
        <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-[14px]">{content.historia_eyebrow}</div>
        <h2 className="font-display text-[42px] font-[900] leading-[1.05] mb-2.5 tracking-[-.5px] text-balance">
          {content.historia_titulo}
          <span className="text-orange block italic">{content.historia_subtitulo}</span>
        </h2>
        <div className="h-[2px] w-20 bg-gradient-to-r from-orange to-transparent mt-3.5" />
      </div>
      <div className="text-[15.5px] leading-[1.7] text-ink-light mb-7">
        {parse(DOMPurify.sanitize(content.historia_texto_1))}
      </div>
      <button
        className="btn-ripple inline-flex items-center justify-center px-6 py-2.5 rounded-full border-none font-bold text-[14px] tracking-[.3px] text-white bg-gradient-to-b from-[#F89B4D] to-[#E85A0C] shadow-[0_2px_8px_rgba(232,90,12,.3)] transition-all hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(232,90,12,.42)]"
        onClick={() => navigate('/quem-somos')}
      >
        VEJA MAIS
      </button>
    </div>
    <div className="aspect-[4/3] rounded overflow-hidden shadow">
      <img src={content.historia_imagem} alt="Fachada do Laboratório Sobral" className="w-full h-full object-cover" />
    </div>
  </div>
</section>
```

Por:

```jsx
{/* HISTÓRIA */}
<section ref={refHistoria} className="reveal max-w-content mx-auto px-4 md:px-10 mt-[80px]">
  <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-8 md:gap-12 items-center">
    <div className="order-2 md:order-1">
      <div className="mt-6 md:mt-12 mb-6">
        <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-[14px]">{content.historia_eyebrow}</div>
        <h2 className="font-display text-[32px] md:text-[42px] font-[900] leading-[1.05] mb-2.5 tracking-[-.5px] text-balance">
          {content.historia_titulo}
          <span className="text-orange block italic">{content.historia_subtitulo}</span>
        </h2>
        <div className="h-[2px] w-20 bg-gradient-to-r from-orange to-transparent mt-3.5" />
      </div>
      <div className="text-[15.5px] leading-[1.7] text-ink-light mb-7">
        {parse(DOMPurify.sanitize(content.historia_texto_1))}
      </div>
      <button
        className="btn-ripple inline-flex items-center justify-center px-6 py-2.5 rounded-full border-none font-bold text-[14px] tracking-[.3px] text-white bg-gradient-to-b from-[#F89B4D] to-[#E85A0C] shadow-[0_2px_8px_rgba(232,90,12,.3)] transition-all hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(232,90,12,.42)]"
        onClick={() => navigate('/quem-somos')}
      >
        VEJA MAIS
      </button>
    </div>
    <div className="aspect-[4/3] rounded overflow-hidden shadow order-1 md:order-2">
      <img src={content.historia_imagem} alt="Fachada do Laboratório Sobral" className="w-full h-full object-cover" />
    </div>
  </div>
</section>
```

- [ ] **Step 4: Verificar nos 3 breakpoints**

- **1280px:** Layout idêntico ao atual — 4 linhas em grid 4 cols, 4 produtos no carrossel, história em 2 cols com texto à esquerda
- **768px:** Já no md, comportamento desktop
- **375px:** 2 linhas em grid 2 cols, 2 produtos visíveis no carrossel, história empilhada com foto acima do texto

- [ ] **Step 5: Commit**

```bash
git add src/pages/HomePage.jsx
git commit -m "feat(home): grids responsivos em linhas, vendidos e história"
git push origin main
```

---

## Task 5: Footer responsivo

**Files:**
- Modify: `src/components/Footer.jsx`

- [ ] **Step 1: Tornar grid responsivo**

Localize a linha 5-6:

```jsx
<footer className="mt-[60px] bg-gradient-to-br from-[#F89B4D] via-[#E85A0C] to-[#F89B4D] text-white pt-12 px-10 pb-0">
  <div className="max-w-content mx-auto grid grid-cols-[1.2fr_1fr_1.2fr_1fr] gap-10">
```

Substitua por:

```jsx
<footer className="mt-[60px] bg-gradient-to-br from-[#F89B4D] via-[#E85A0C] to-[#F89B4D] text-white pt-12 px-4 md:px-10 pb-0">
  <div className="max-w-content mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.2fr_1fr_1.2fr_1fr] gap-8 md:gap-10">
```

- [ ] **Step 2: Verificar nos 3 breakpoints**

- **1280px:** 4 colunas (logo+endereço | contato | links | redes)
- **768px:** 4 colunas (já no md)
- **640px (sm):** 2 colunas — logo+endereço e contato na primeira linha, links e redes na segunda
- **375px:** 1 coluna empilhada

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.jsx
git commit -m "feat(footer): grid responsivo 1/2/4 colunas"
git push origin main
```

---

## Task 6: QuemSomosPage responsiva

**Files:**
- Modify: `src/pages/QuemSomosPage.jsx`

- [ ] **Step 1: Tornar a seção MVV responsiva**

Localize o bloco MVV (`<section ref={refMVV}...>`). Substitua:

```jsx
{/* MVV — Stack horizontal editorial */}
<section ref={refMVV} className="reveal max-w-content mx-auto px-10 mt-10">
  <div className="bg-white rounded p-[36px_50px] shadow-sm flex flex-col gap-2">
    {MVV_ITEMS.map((item, i) => (
      <div
        key={item.key}
        className={`grid grid-cols-[220px_1fr] gap-8 items-start py-[22px] ${i < MVV_ITEMS.length - 1 ? 'border-b border-line' : ''}`}
      >
        <div>
          <div className={`text-[11px] tracking-[2px] font-[900] mb-1.5 ${item.text}`}>{item.tag}</div>
          <div className="font-display text-[32px] font-[900] text-ink leading-none">{item.title}</div>
        </div>
        <div className={`text-[15.5px] text-ink-light leading-[1.65] py-1.5 pl-6 border-l-[3px] ${item.accent}`}>
          {safe(content[item.key])}
        </div>
      </div>
    ))}
  </div>
</section>
```

Por:

```jsx
{/* MVV — Stack horizontal editorial */}
<section ref={refMVV} className="reveal max-w-content mx-auto px-4 md:px-10 mt-10">
  <div className="bg-white rounded p-6 md:p-[36px_50px] shadow-sm flex flex-col gap-2">
    {MVV_ITEMS.map((item, i) => (
      <div
        key={item.key}
        className={`grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3 md:gap-8 items-start py-[22px] ${i < MVV_ITEMS.length - 1 ? 'border-b border-line' : ''}`}
      >
        <div>
          <div className={`text-[11px] tracking-[2px] font-[900] mb-1.5 ${item.text}`}>{item.tag}</div>
          <div className="font-display text-[28px] md:text-[32px] font-[900] text-ink leading-none">{item.title}</div>
        </div>
        <div className={`text-[15.5px] text-ink-light leading-[1.65] py-1.5 pl-4 md:pl-6 border-l-[3px] ${item.accent}`}>
          {safe(content[item.key])}
        </div>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Tornar a seção História responsiva**

Localize o bloco "História — Magazine com pull-quote". Substitua:

```jsx
{/* História — Magazine com pull-quote */}
<section ref={refHistoria} className="reveal max-w-content mx-auto px-10 mt-20 pb-16">
  <div className="grid grid-cols-2 gap-[60px] items-stretch">
    <div className="flex flex-col justify-center">
      <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-[18px]">{content.historia_eyebrow}</div>
      <h2 className="font-display text-[46px] font-[900] leading-[1.05] mb-6 text-ink tracking-[-.5px] text-balance">
        {content.historia_heading}
      </h2>
      <div className="text-[15px] text-ink-light leading-[1.7] mb-4">{safe(content.historia_texto_1)}</div>
      <div className="text-[15px] text-ink-light leading-[1.7] mb-4">{safe(content.historia_texto_2)}</div>
      <div className="text-[15px] text-ink-light leading-[1.7]">{safe(content.historia_texto_3)}</div>
    </div>

    <div className="relative">
      <div className="aspect-[4/5] rounded-[4px] bg-[#EAEAEA] overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,.12)]">
        <img src={content.historia_imagem} alt="Fachada do Laboratório Sobral" className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-[38px] -left-[30px] right-[40px] bg-orange text-white px-[26px] py-[22px] font-display text-[20px] font-bold leading-[1.3] italic shadow-[0_8px_24px_rgba(232,90,12,.28)]">
        "{content.historia_pullquote}"
      </div>
    </div>
  </div>
</section>
```

Por:

```jsx
{/* História — Magazine com pull-quote */}
<section ref={refHistoria} className="reveal max-w-content mx-auto px-4 md:px-10 mt-12 md:mt-20 pb-16">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-[60px] items-stretch">
    <div className="flex flex-col justify-center order-2 md:order-1">
      <div className="text-[12px] tracking-[3px] text-orange font-[900] mb-[18px]">{content.historia_eyebrow}</div>
      <h2 className="font-display text-[32px] md:text-[46px] font-[900] leading-[1.05] mb-6 text-ink tracking-[-.5px] text-balance">
        {content.historia_heading}
      </h2>
      <div className="text-[15px] text-ink-light leading-[1.7] mb-4">{safe(content.historia_texto_1)}</div>
      <div className="text-[15px] text-ink-light leading-[1.7] mb-4">{safe(content.historia_texto_2)}</div>
      <div className="text-[15px] text-ink-light leading-[1.7]">{safe(content.historia_texto_3)}</div>
    </div>

    <div className="relative order-1 md:order-2">
      <div className="aspect-[4/5] max-h-[420px] md:max-h-none rounded-[4px] bg-[#EAEAEA] overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,.12)]">
        <img src={content.historia_imagem} alt="Fachada do Laboratório Sobral" className="w-full h-full object-cover" />
      </div>
      <div className="relative md:absolute mt-4 md:mt-0 md:bottom-[38px] md:-left-[30px] md:right-[40px] bg-orange text-white px-5 md:px-[26px] py-4 md:py-[22px] font-display text-[17px] md:text-[20px] font-bold leading-[1.3] italic shadow-[0_8px_24px_rgba(232,90,12,.28)]">
        "{content.historia_pullquote}"
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Verificar nos 3 breakpoints**

- **1280px:** MVV com tag/título à esquerda, texto à direita (idêntico ao atual). História em 2 colunas com pull-quote sobreposto à foto.
- **375px:** MVV empilhado (tag/título acima, texto abaixo com borda esquerda). História empilhada com foto acima (com altura máxima), pull-quote abaixo da foto, fora da posição absoluta.

- [ ] **Step 4: Commit**

```bash
git add src/pages/QuemSomosPage.jsx
git commit -m "feat(quem-somos): MVV e história responsivos"
git push origin main
```

---

## Task 7: ProdutoPage responsiva

**Files:**
- Modify: `src/pages/ProdutoPage.jsx`

- [ ] **Step 1: Tornar a seção galeria + info responsiva**

Localize a primeira `<section>` (linha 61-110). Substitua:

```jsx
<section className="max-w-content mx-auto px-10 mt-11">
  <div className="grid grid-cols-[1fr_1.1fr] gap-16 items-start">
```

Por:

```jsx
<section className="max-w-content mx-auto px-4 md:px-10 mt-8 md:mt-11">
  <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-8 md:gap-16 items-start">
```

E também, dentro do bloco `<div>` que contém o `<h1>` do nome do produto, substitua:

```jsx
<div>
  <h1 className="text-[36px] font-bold mb-[14px] text-ink-light">{p.name}</h1>
```

Por:

```jsx
<div>
  <h1 className="text-[28px] md:text-[36px] font-bold mb-[14px] text-ink-light">{p.name}</h1>
```

- [ ] **Step 2: Tornar a seção ingredientes + nutricional responsiva**

Localize a segunda `<section>` (Ingredientes + Nutricional). Substitua:

```jsx
{/* Ingredientes + Nutricional */}
<section className="bg-gradient-to-b from-[#C5D11E] to-[#A8B410] text-white mt-[60px] py-12 px-10">
  <div className="max-w-content mx-auto grid grid-cols-2 gap-12">
    <div>
      <h2 className="text-[26px] font-[800] text-center mb-[22px] text-white">Ingredientes</h2>
      <p className="text-[13.5px] leading-[1.65] mb-[18px]">{p.ingredientes || 'Informações não disponíveis para este produto.'}</p>
      {p.disclaimer && <p className="text-[13.5px] leading-[1.65] font-bold">{p.disclaimer}</p>}
    </div>
    {p.nutri_rows ? (
      <div className="border-l border-white/30 pl-12">
```

Por:

```jsx
{/* Ingredientes + Nutricional */}
<section className="bg-gradient-to-b from-[#C5D11E] to-[#A8B410] text-white mt-[60px] py-10 md:py-12 px-4 md:px-10">
  <div className="max-w-content mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
    <div>
      <h2 className="text-[24px] md:text-[26px] font-[800] text-center mb-[22px] text-white">Ingredientes</h2>
      <p className="text-[13.5px] leading-[1.65] mb-[18px]">{p.ingredientes || 'Informações não disponíveis para este produto.'}</p>
      {p.disclaimer && <p className="text-[13.5px] leading-[1.65] font-bold">{p.disclaimer}</p>}
    </div>
    {p.nutri_rows ? (
      <div className="md:border-l border-white/30 md:pl-12 pt-8 md:pt-0 border-t md:border-t-0">
```

E na linha do fallback (sem nutri_rows), substitua:

```jsx
) : (
  <div className="border-l border-white/30 pl-12 flex items-center justify-center text-white/70 text-[14px]">
    Informações nutricionais não disponíveis para este produto.
  </div>
)}
```

Por:

```jsx
) : (
  <div className="md:border-l border-white/30 md:pl-12 pt-8 md:pt-0 border-t md:border-t-0 flex items-center justify-center text-white/70 text-[14px]">
    Informações nutricionais não disponíveis para este produto.
  </div>
)}
```

- [ ] **Step 3: Verificar nos 3 breakpoints**

Abra um produto qualquer, ex: `http://localhost:5173/produtos/aqualema`

- **1280px:** Galeria à esquerda, info à direita (idêntico ao atual). Ingredientes à esquerda, nutricional à direita com borda vertical.
- **375px:** Galeria acima, info abaixo. Ingredientes acima, nutricional abaixo com borda horizontal de separação (não vertical).

- [ ] **Step 4: Commit**

```bash
git add src/pages/ProdutoPage.jsx
git commit -m "feat(produto): galeria, info e nutricional responsivos"
git push origin main
```

---

## Task 8: FaleConoscoPage responsiva

**Files:**
- Modify: `src/pages/FaleConoscoPage.jsx`

- [ ] **Step 1: Tornar a seção de info de contato responsiva**

Localize a `<section>` (linha 74-100). Substitua:

```jsx
<section className="max-w-content mx-auto px-10 mt-10 pb-16">
  <div className="grid grid-cols-[1.4fr_1fr] gap-12 mb-12">
```

Por:

```jsx
<section className="max-w-content mx-auto px-4 md:px-10 mt-10 pb-16">
  <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 md:gap-12 mb-12">
```

- [ ] **Step 2: Tornar o formulário responsivo**

Localize o `<form>` (linha 116). Substitua:

```jsx
<form className="grid grid-cols-2 gap-[14px] bg-[#EEEEEE] p-7 rounded" onSubmit={handleSubmit}>
```

Por:

```jsx
<form className="grid grid-cols-1 md:grid-cols-2 gap-[14px] bg-[#EEEEEE] p-5 md:p-7 rounded" onSubmit={handleSubmit}>
```

- [ ] **Step 3: Verificar nos 3 breakpoints**

Abra `http://localhost:5173/fale-conosco`

- **1280px:** Info de contato em 2 colunas (endereços à esquerda, cards à direita). Formulário em 2 colunas com Assunto e Mensagem ocupando linha inteira (já fazem `col-span-2`).
- **375px:** Info de contato empilhada (endereços acima, cards abaixo). Formulário em 1 coluna, todos os campos um abaixo do outro.

- [ ] **Step 4: Commit**

```bash
git add src/pages/FaleConoscoPage.jsx
git commit -m "feat(fale-conosco): info e formulário responsivos"
git push origin main
```

---

## Task 9: Verificação final

- [ ] **Step 1: Smoke test completo em mobile (375px)**

No DevTools em modo responsive a 375px, navegue por:
- `/` — hero + linhas + vendidos + história
- `/quem-somos` — MVV + história com pull-quote
- `/produtos` — listagem (já responsiva)
- `/produtos/aqualema` (ou qualquer) — galeria + nutricional
- `/misturinhas` — (já responsiva)
- `/fale-conosco` — info + formulário

Em todas as páginas:
- Sem scroll horizontal
- Texto legível, nenhum elemento cortado
- Menu hamburguer funciona em qualquer página
- Drawer abre e fecha corretamente

- [ ] **Step 2: Smoke test em desktop (1280px)**

Confira as mesmas páginas em 1280px. Nada deve estar diferente do que era antes do plano.

- [ ] **Step 3 (opcional): Verificar em tablet (768px)**

Em 768px exato, todas as páginas já devem estar no layout desktop (md:).

---

## Critérios de aceitação atendidos

- [x] Nenhuma regressão visual em desktop (≥1024px) — verificado em cada task
- [x] Em 375px (iPhone SE): sem scroll horizontal, sem conteúdo cortado — Task 9
- [x] Header mobile: drawer abre/fecha, submenus expansíveis, scroll bloqueado — Task 2
- [x] HeroCarousel: visível e proporcionado em mobile — Task 3
- [x] Formulário Fale Conosco: utilizável em mobile — Task 8
