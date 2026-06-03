# Time de Agentes para Desenvolvimento

Setup pessoal de agentes reutilizáveis em todo projeto novo, baseado em:

- **agnostic-core** — biblioteca de skills, agents e workflows em markdown
- **Claude Code** — runtime que executa os agentes
- **Pixel Agents** — visualização lúdica do que os agentes estão fazendo

---

## 1. Visão geral

A ideia é separar três coisas que costumam virar bagunça quando misturadas:

| Camada | Ferramenta | O que faz |
|---|---|---|
| Conhecimento | `agnostic-core` (clonado em `~/dev/agnostic-core`) | Catálogo de skills, agents e workflows em markdown |
| Execução | Claude Code | Lê os agents/skills do projeto e executa tarefas |
| Visualização | Pixel Agents (extensão VS Code) | Mostra cada agente como personagem em pixel art |

A vantagem dessa separação é poder **trocar qualquer camada** sem refazer as outras. Se amanhã sair um runtime melhor que Claude Code, você troca só a camada do meio. Se quiser usar Cursor em paralelo, basta um adaptador.

### Fluxo desejado

```
Projeto novo criado
    ↓
agnostic init  (script de bootstrap)
    ↓
.claude/ populado com agents, skills e commands relevantes
    ↓
Abre VS Code → terminal Claude Code
    ↓
Pixel Agents detecta sozinho e anima os personagens
```

---

## 2. Arquitetura

### 2.1 Estrutura no diretório home

```
~/dev/agnostic-core/             ← clone do repo, fonte da verdade
├── agents/
├── skills/
├── commands/
└── templates/

~/.config/agnostic/              ← config pessoal (criado pelo CLI)
├── profile.json                  ← preferências, stack default, perfis
└── presets/
    ├── node-api.json             ← "preset" por tipo de projeto
    ├── react-spa.json
    └── python-cli.json
```

### 2.2 Estrutura num projeto novo (depois do bootstrap)

```
meu-projeto/
├── .claude/
│   ├── agents/                   ← copiados/linkados do agnostic-core
│   │   ├── security-reviewer.md
│   │   ├── code-inspector.md
│   │   └── ...
│   ├── skills/
│   │   ├── testing/SKILL.md
│   │   ├── security/SKILL.md
│   │   └── ...
│   └── commands/
│       ├── debug.md
│       └── deploy.md
├── CLAUDE.md                     ← instruções específicas do projeto
└── ... (código do projeto)
```

### 2.3 Por que symlinks > cópias

Se você fizer `cp` toda vez, cada projeto fica com uma versão estática. Quando você melhorar uma skill em `agnostic-core`, projetos antigos ficam pra trás. Com `ln -s`, todo projeto pega a versão mais recente automaticamente.

Exceção: quando o agente/skill precisa ser ajustado para o projeto específico — aí cópia faz sentido.

**Regra prática**: bootstrap por padrão usa symlink; flag `--copy` força cópia.

---

## 3. Adaptação do agnostic-core ao formato Claude Code

O agnostic-core hoje é um catálogo de "ideias em markdown". O Claude Code espera frontmatter específico em cada arquivo. Antes do bootstrap funcionar, você precisa de uma camada de adaptação.

### 3.1 Frontmatter esperado em agents

```markdown
---
name: security-reviewer
description: Revisa código procurando vulnerabilidades OWASP Top 10. Usar quando o usuário pedir review de segurança ou antes de deploy.
tools: Read, Grep, Glob, Bash
---

# System prompt do agente

Você é um especialista em segurança de aplicações...
```

Campos críticos:
- `name`: kebab-case, sem espaços
- `description`: o que faz E quando ativar (Claude Code usa isso pra decidir delegar)
- `tools` (opcional): se omitir, herda todas as ferramentas

### 3.2 Frontmatter esperado em skills

Cada skill é uma **pasta** com `SKILL.md`:

```markdown
---
name: security
description: Use quando o usuário pedir hardening, audit de segurança, ou review de OWASP Top 10. Cobre validação de input, SQLi, XSS, CSRF, secrets management.
---

# Conteúdo da skill

Quando aplicar esta skill...
```

A descrição é o gatilho — se estiver vaga, o Claude Code não vai saber quando carregar.

### 3.3 Script de adaptação

Antes do `agnostic init`, rodar uma vez:

```bash
agnostic adapt   # transforma o agnostic-core em formato Claude Code
```

Esse comando:
1. Lê cada arquivo de `~/dev/agnostic-core/agents/` e `skills/`
2. Verifica se já tem frontmatter válido
3. Se não tem, gera um stub que você revisa manualmente

Não tente automatizar 100% — descrições escritas com cuidado fazem diferença gigante na qualidade do roteamento dos agentes.

---

## 4. Implementação faseada

### Fase 1 — Setup base (1-2 horas)

**Objetivo**: ter os três pilares instalados e conversando.

```bash
# 1. Clonar a biblioteca
mkdir -p ~/dev
git clone https://github.com/paulinett1508-dev/agnostic-core.git ~/dev/agnostic-core

# 2. Instalar Claude Code (se ainda não tem)
# https://docs.claude.com/claude-code

# 3. Instalar Pixel Agents
# VS Code → Marketplace → buscar "Pixel Agents" → Install

# 4. Testar o fluxo manual num projeto qualquer
mkdir teste-agentes && cd teste-agentes
mkdir -p .claude/agents
cp ~/dev/agnostic-core/agents/reviewers/code-inspector.md .claude/agents/
# (se precisar, ajustar frontmatter)
claude    # abrir Claude Code, testar
```

**Critério de saída da Fase 1**: você abre o Pixel Agents no VS Code, dispara um Claude Code com um agente do agnostic-core, e vê o personagem animar.

### Fase 2 — Adaptação do agnostic-core (2-4 horas)

**Objetivo**: ter os arquivos do agnostic-core em formato consumível pelo Claude Code.

Não tente adaptar tudo de uma vez. Escolha 4-6 agentes que você sabe que vai usar e foque neles primeiro.

Sugestão de prioridade inicial:

| Agente | Por quê |
|---|---|
| `code-inspector` | Útil em qualquer projeto |
| `security-reviewer` | Pega problemas que passam batido |
| `debug` (workflow) | Investigação sistemática vale ouro |
| `boilerplate-generator` | Acelera setup de projeto |
| 1-2 specialists da sua stack | Ex: `database-architect` se você lida com SQL |

Para cada um:
1. Abre o markdown original
2. Adiciona frontmatter Claude Code-compatível
3. Escreve uma `description` clara de quando ativar
4. Salva numa pasta `~/dev/agnostic-core/.adapted/` (não polui o repo original)

**Critério de saída da Fase 2**: rodar `claude` num projeto e conseguir invocar cada um desses agentes via Task tool ou menção direta.

### Fase 3 — Script de bootstrap (3-5 horas)

**Objetivo**: `agnostic init` num projeto novo deixar tudo pronto.

Estrutura mínima do script (Node ou Bash, à sua escolha):

```bash
agnostic init                      # interativo, pergunta o que incluir
agnostic init --preset node-api    # usa preset salvo
agnostic init --all                # tudo, sem perguntar
agnostic init --copy               # cópia em vez de symlink
```

Componentes:

1. **Detector de stack** (opcional, mas legal): lê `package.json`, `pyproject.toml`, `Cargo.toml` e sugere skills relevantes
2. **Seletor interativo**: lista de checkboxes com agents/skills disponíveis
3. **Linker/copiador**: cria `.claude/` no projeto e popula
4. **Gerador de CLAUDE.md base**: arquivo de instruções iniciais do projeto

Stack sugerida pra implementar: **Node + TypeScript** com `commander` (CLI) + `@inquirer/prompts` (interatividade) + `chalk` (cores). Compila pra binário com `pkg` ou roda direto com `bun`.

**Critério de saída da Fase 3**: `cd projeto-novo && agnostic init` em menos de 30 segundos deixa o projeto pronto para usar Claude Code.

### Fase 4 — Refinamento contínuo (sem prazo)

A partir daqui é uso real:

- Quando um agente erra, melhore a description ou o system prompt
- Quando faltar uma skill, escreva no `agnostic-core` (ele é seu também)
- Quando um padrão se repetir entre projetos, crie um preset

---

## 5. Pontos de atenção

### 5.1 Não criar 15 agentes de cara

O instinto vai ser povoar `.claude/agents/` com tudo. Resista. Comece com 3-4 e adicione novos quando sentir falta concreta. Agentes demais confundem o roteamento do Claude Code e poluem o Pixel Agents visualmente.

### 5.2 Descriptions são o trabalho real

Um agente com prompt brilhante e description ruim **não é invocado**. Reserve tempo pra escrever descriptions claras com gatilhos explícitos: "Usar quando X. Não usar quando Y."

### 5.3 Pixel Agents tem limitações conhecidas

- Sync entre terminal e personagem às vezes desincroniza
- Detecção de "esperando input" é heurística (pode atrasar)
- Foi testado principalmente em Windows 11 — Mac/Linux pode ter quirks de file-watching

Nada disso é bloqueante. Só não dependa do Pixel Agents pra saber o status real do agente — use a janela do Claude Code pra isso. O Pixel é entretenimento + visão geral.

### 5.4 Versionamento do agnostic-core

Se o `agnostic-core` é seu, tudo bem. Se você está consumindo o de outra pessoa, considere fazer um fork pra controlar quando atualizar — atualizações automáticas podem quebrar agentes que você adaptou.

### 5.5 Segurança de `--dangerously-skip-permissions`

O Pixel Agents oferece spawn com essa flag (bypassa todas as aprovações de tool). Útil pra dev rápido, mas **nunca rode em projeto com segredos reais ou capaz de fazer side effects irreversíveis** (deploy, deletar prod, etc).

---

## 6. Próximas decisões a tomar

Em ordem:

1. **Stack do CLI de bootstrap**: Node/TS, Bash puro ou Python? (Node/TS é o mais "casado" com o ecossistema VS Code)
2. **Lista dos 4-6 agentes prioritários** pra adaptar primeiro
3. **Onde guardar os adaptados**: pasta dentro do agnostic-core ou repositório separado seu?
4. **Se vai versionar presets** (`node-api.json`, etc) num repo próprio ou junto

---

## 7. Referências

- agnostic-core: https://github.com/paulinett1508-dev/agnostic-core
- Pixel Agents (repo): https://github.com/pablodelucca/pixel-agents
- Pixel Agents (site): https://pixelagent.space/
- Claude Code docs: https://docs.claude.com/claude-code
- Inspiração de estrutura semelhante: https://github.com/betagouv/agnostic-ai
