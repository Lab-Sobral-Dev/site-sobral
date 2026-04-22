Laboratório Sobral — Site institucional / catálogo de produtos

Stack: React 18 (UMD via CDN) + Babel Standalone + CSS puro
Sem bundler, sem Node.js, sem framework de backend.
Submodulo: .agnostic-core/

---

REGRAS OBRIGATÓRIAS (seguir sempre):

1. Antes de qualquer alteração, consultar este CLAUDE.md e os skills relevantes do .agnostic-core/
2. Após toda alteração de código: git add → git commit (Conventional Commits) → git push origin main
3. Nunca commitar .claude/settings.json ou .claude/settings.local.json
4. Idioma do projeto: pt-BR (textos da UI em português)

---

Arquitetura do projeto:

  project/
    Site Laboratorio Sobral.html  ← entrada principal (abre no browser)
    app.jsx                       ← roteador + componente Tweaks (tema/tipografia)
    components.jsx                ← Header, Footer, LogoSVG, ícones compartilhados
    styles.css                    ← design tokens, layout base, componentes globais
    styles-app.css                ← estilos específicos de páginas e variações
    pages/
      catalog-data.jsx            ← array CATALOG com todos os produtos
      home.jsx                    ← página inicial (hero, destaques, marcas)
      quem-somos.jsx              ← institucional
      produtos.jsx                ← listagem de produtos com filtro
      produto.jsx                 ← detalhe de produto
      medicamentos.jsx            ← página de medicamentos
      fale-conosco.jsx            ← formulário de contato
      privacidade.jsx             ← política de privacidade
    images/                       ← logos, hero, fotos de produtos
    uploads/                      ← assets brutos do design original

Convenções do projeto:

  Frontend:    React 18.3.1 (UMD) + JSX transpilado por Babel Standalone 7.29
  CSS:         Custom CSS com variáveis CSS (--orange, --orange-dark, etc.), sem Tailwind
  Fontes:      Nunito (padrão), DM Sans, Source Serif 4, Pacifico — via Google Fonts
  Roteamento:  State machine em app.jsx via React.useState (sem React Router)
  Dados:       catalog-data.jsx exporta window.CATALOG (array global, sem API)
  Temas:       Tweaks panel em app.jsx controla paleta e tipografia via CSS vars
  Backend:     Nenhum — site estático
  Banco:       Nenhum
  Auth:        Nenhum
  Cache:       localStorage para persistência de página atual
  Testes:      Nenhum framework configurado
  CI/CD:       Não configurado
  Deploy:      A definir
  Commits:     Conventional Commits (feat:, fix:, chore:, style:, refactor:, docs:)
  Branch:      main (único branch — sempre push para main)

---

Antes de implementar — skills obrigatórios por tipo de tarefa:

Frontend / UI:
  HTML e CSS:          .agnostic-core/skills/frontend/html-css-audit.md
  Acessibilidade:      .agnostic-core/skills/frontend/accessibility.md
  UX Guidelines:       .agnostic-core/skills/frontend/ux-guidelines.md
  CSS Governance:      .agnostic-core/skills/frontend/css-governance.md
  SEO:                 .agnostic-core/skills/frontend/seo-checklist.md
  Performance:         .agnostic-core/skills/performance/performance-audit.md
  Anti-Frankenstein:   .agnostic-core/skills/frontend/anti-frankenstein.md

Git / entrega:
  Commits:             .agnostic-core/skills/git/commit-conventions.md
  Debugging:           .agnostic-core/skills/audit/systematic-debugging.md
  Validação:           .agnostic-core/skills/audit/validation-checklist.md
  Revisão de texto:    .agnostic-core/skills/audit/revisao-texto-ptbr.md

Antes de deploy:
  .agnostic-core/skills/devops/pre-deploy-checklist.md
  .agnostic-core/skills/devops/deploy-procedures.md

---

Workflow padrão para cada alteração:

  1. Ler CLAUDE.md (este arquivo)
  2. Ler skill(s) relevante(s) do .agnostic-core/
  3. Implementar a mudança
  4. git add <arquivos>
  5. git commit -m "tipo: descrição curta"
  6. git push origin main
