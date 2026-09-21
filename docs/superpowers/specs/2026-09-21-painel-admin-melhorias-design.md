# Melhorias do Painel Admin — Design

Data: 2026-09-21
Status: aprovado para planejamento

## Problema

O painel admin (`/admin/*`) funciona, mas tem três classes de defeito que
aparecem no uso diário:

1. **Perda de trabalho.** A sessão expira em 8 h sem aviso; o formulário de
   produto tem 18 campos e 5 editores TipTap; não existe guarda de saída nem
   rascunho. Uma expiração no meio da edição descarta tudo.
2. **Campos que exigem o usuário pensar como programador.** `nutri_rows` é
   JSON cru digitado à mão, e o erro só aparece no submit.
3. **Nenhuma rastreabilidade.** Credencial única em variável de ambiente, sem
   histórico de alterações e sem como voltar atrás num texto sobrescrito.

Somam-se a isso trabalho repetitivo (sem duplicar produto, sem ação em massa),
lacunas de interface (sem empty state, ordenação inacessível por teclado) e
imagens órfãs acumulando no volume.

## Decisões tomadas

| Questão | Decisão |
|---|---|
| Acesso | Multiusuário com tabela `admin_users` e papéis `admin`/`editor` |
| Auditoria | Registrar tudo; restaurar apenas conteúdo de CMS |
| Imagens órfãs | Exclusão automática, com trava de referência |

## Restrições do ambiente

- `deploy.yml:51` roda as migrations com `|| true` — uma migration que falha
  não derruba o deploy. Qualquer mudança que torne o login dependente de tabela
  nova precisa degradar com segurança. (Recomendação separada: remover o
  `|| true`. Fora do escopo: o arquivo tem alteração não commitada do usuário.)
- Volume Docker sombreia `public/images/produtos` — a exclusão de órfãs opera
  sobre o caminho montado.
- Banco de desenvolvimento local está atrasado nas migrations; verificação de
  backend usa banco descartável.
- Jest + supertest já configurados em `server/` com 3 suítes. Todo backend novo
  entra com teste.

---

## Fase 0 — Fundação

Invisível ao usuário. Existe para as fases 4 e 5 não precisarem remexer no que
já estiver entregue.

### Migrations

`015_admin_users.sql`

```sql
CREATE TABLE admin_users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(160) NOT NULL UNIQUE,
  nome          VARCHAR(120) NOT NULL,
  senha_hash    VARCHAR(120) NOT NULL,
  papel         VARCHAR(20)  NOT NULL DEFAULT 'editor'
                CHECK (papel IN ('admin','editor')),
  ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
  ultimo_login  TIMESTAMPTZ,
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_admin_users_email_ativo ON admin_users(email) WHERE ativo;
```

O e-mail é comparado sempre em minúsculas (normalizado na aplicação, tanto na
escrita quanto na leitura), evitando a dependência da extensão `citext`.

A semeadura a partir do `.env` **não** vai no arquivo SQL, porque a migration
não tem acesso às variáveis de ambiente de forma confiável no runner. Vai num
passo de aplicação em `db/seed-admin.js`, idempotente, chamado pelo
`migrate.js` ao final: se `admin_users` estiver vazia e `ADMIN_EMAIL` +
`ADMIN_PASSWORD_HASH` existirem, cria o primeiro usuário com papel `admin`.

`016_audit_log.sql`

```sql
CREATE TABLE audit_log (
  id              BIGSERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  user_email      VARCHAR(160) NOT NULL,      -- snapshot: sobrevive à exclusão
  acao            VARCHAR(20)  NOT NULL,      -- create|update|delete|restore|login
  entidade        VARCHAR(30)  NOT NULL,      -- product|category|content|hero_slide|misturinha|image|user
  entidade_id     VARCHAR(160),
  campo           VARCHAR(80),
  valor_anterior  JSONB,
  valor_novo      JSONB,
  ip              VARCHAR(60),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_criado_em ON audit_log(criado_em DESC);
CREATE INDEX idx_audit_entidade  ON audit_log(entidade, entidade_id, criado_em DESC);
```

`user_email` é cópia, não junção: o histórico precisa continuar legível depois
que o usuário for excluído.

### Helper de auditoria

`server/src/lib/audit.js` expõe `registrar(req, dados)`. Regras:

- Nunca lança. Falha de log vira `console.error` e a requisição segue. Perder
  uma linha de histórico não pode derrubar um salvamento.
- Lê autor e IP de `req.admin` e `req.ip`.
- Trunca `valor_anterior`/`valor_novo` acima de 100 KB, guardando um marcador
  `{ truncado: true }` — evita que um campo de CMS gigante inche a tabela.

### Autenticação

- O JWT passa a carregar `{ sub: <id>, email, papel }`.
- `requireAuth` decodifica e então confere no banco que o usuário existe e está
  ativo, populando `req.admin = { id, email, papel, nome }`. Uma query indexada
  por requisição administrativa; o volume é baixo e o ganho é revogação
  imediata ao desativar alguém.
- Middleware novo `requirePapel('admin')` para as rotas de usuários.

### Testes

`server/tests/audit.test.js` — o log grava; o log falhando não quebra a rota
auditada; `requireAuth` rejeita usuário desativado; `requirePapel` barra editor.

---

## Fase 1 — Não perder trabalho

### Sessão

- `POST /api/auth/refresh` (requer auth) reemite o cookie com mais 8 h e
  devolve o novo `expiresAt`.
- `GET /api/auth/me` passa a devolver `{ email, nome, papel, expiresAt }`.
- `AuthContext` guarda `expiresAt` e agenda dois gatilhos:
  - **T‑30 min**: na próxima requisição bem-sucedida, renova em silêncio.
  - **T‑5 min sem atividade**: modal "Sua sessão expira em 4:59" com contagem
    regressiva e botão "Continuar conectado".
- Expirando de fato, o comportamento atual (logout + redirect) permanece, mas
  agora o rascunho local preserva o formulário.

### Guarda de saída

Hook `src/hooks/useUnsavedChanges.js`, recebendo um booleano `dirty`:

- `useBlocker` do React Router para navegação interna (o projeto usa
  `createBrowserRouter`, então o hook está disponível).
- `beforeunload` para fechar aba e recarregar.
- Modal de confirmação reaproveitando `ConfirmModal`, com `danger={false}`.

Aplicado em `AdminProductFormPage`, `AdminMisturinhasPage` (formulário aberto)
e `AdminContentPage` (qualquer campo `dirty` ou em `erro`).

### Rascunho local do produto

- Chave `sobral_draft_produto_<id|novo>` em `localStorage`, gravada com debounce
  de 1 s a cada mudança do formulário.
- Ao abrir, se existir rascunho, uma faixa oferece "Recuperar rascunho de
  <data/hora>" ou "Descartar". Nada é aplicado sem o usuário mandar.
- Limpo ao salvar com sucesso e ao descartar.
- Toda leitura e escrita em `try/catch`: modo privativo ou storage cheio não
  pode quebrar o formulário.

### Estado por campo no CMS

`AdminContentPage` troca os dois mapas atuais (`saving`, `saved`) por um mapa
`status[key]` com `idle | dirty | saving | salvo | erro`, e passa a guardar
`valorSalvo[key]` para saber o que de fato está no servidor.

- `erro` é persistente: borda vermelha, texto "Não salvo" e botão "Tentar de
  novo" ao lado do campo. Some só quando um salvamento tiver sucesso.
- `dirty` aparece quando o valor diverge do último salvo.
- O `onBlur` continua salvando, mas deixa de ser a única indicação de sucesso.

### Testes

Backend: `refresh` renova; `refresh` sem cookie dá 401; `me` devolve
`expiresAt`. Frontend não tem runner configurado — a verificação é manual, com
roteiro descrito no plano de implementação.

---

## Fase 2 — Tirar o técnico da frente do usuário

### Editor de tabela nutricional

`src/components/admin/NutriTableEditor.jsx` substitui o textarea de
`nutri_rows`:

- Grade editável; cada linha é um array de strings. Colunas detectadas a partir
  do dado existente, com 3 como padrão (nutriente, quantidade, %VD).
- Botões de adicionar/remover linha e coluna; reordenação de linhas por
  arrastar reaproveitando `@dnd-kit`, já no projeto.
- Emite exatamente o formato atual (`[["Vitamina C (mg)","90","90"], …]`), então
  o backend não muda.
- **Degradação:** se o JSON existente não for um array de arrays de escalares,
  o componente não tenta adivinhar — mostra o textarea JSON atual com um aviso
  explicando por que a grade não pôde ser usada. Nenhuma capacidade se perde e
  nenhum dado é reinterpretado.
- Um link "editar como JSON" permite alternar de propósito.

### Slug automático

No modo criação, digitar o nome preenche o campo ID com o slug
(minúsculas, sem acento, hífens). Um cadeado ao lado indica que está seguindo o
nome; ao editar o ID à mão, o vínculo se desfaz e não volta sozinho. Em edição o
campo segue desabilitado, como hoje.

---

## Fase 3 — Produtividade e polimento

### Duplicar produto

`POST /api/admin/products/:id/duplicate`:

- Copia todos os campos, gera `<id>-copia` (e `-copia-2`, `-copia-3`… se já
  existir), acrescenta " (cópia)" ao final do nome e força `ativo = false` e
  `destaque = false`.
- A imagem e a galeria são **referenciadas**, não copiadas em disco. Isso
  interage com a exclusão automática da fase 6: por isso a trava de referência
  daquela fase varre todas as linhas, não só a que está sendo alterada.
- Responde com o produto criado; o front navega para o editor dele.

### Ações em massa

`POST /api/admin/products/bulk` com `{ ids: string[], acao, valor? }`, onde
`acao ∈ ativar | desativar | mover_categoria | excluir`:

- Tudo numa transação: ou aplica em todos os ids, ou em nenhum.
- Limite de 100 ids por chamada.
- `mover_categoria` valida a categoria destino antes de abrir a transação.
- Uma linha de auditoria por produto afetado.

Na interface: checkbox por linha (e no cabeçalho, para a página inteira), barra
flutuante no rodapé com "N selecionados" e as quatro ações. Excluir passa pelo
`ConfirmModal` nomeando a quantidade.

### Polimento da listagem

- **Empty state**: busca sem resultado mostra mensagem e botão "limpar filtros";
  catálogo vazio mostra chamada para criar o primeiro produto.
- **Skeletons** no lugar de "Carregando...".
- **Paginação em janela**: primeira, última, vizinhas e reticências.
- **Ordenação acessível**: `<th>` passa a conter `<button>` com `aria-sort` no
  cabeçalho, navegável por teclado.
- **Preview do arquivo escolhido** com `URL.createObjectURL`, revogado ao trocar
  de arquivo e ao desmontar.
- **Ctrl+S / Cmd+S** salva nos formulários de produto e misturinha.

---

## Fase 4 — Auditoria com restauração no CMS

### API

- `GET /api/admin/audit` — paginado, filtros `entidade`, `entidade_id`,
  `user_id`, `de`, `ate`. Ordena por `criado_em DESC`.
- `POST /api/admin/audit/:id/restore` — **aceita apenas `entidade = 'content'`**.
  Qualquer outra entidade responde 400 com explicação. Restaurar grava uma nova
  linha com `acao = 'restore'`, de modo que a própria restauração é reversível.

### Interface

- Página `/admin/historico` (item novo na sidebar, seção "Sistema"): lista com
  data, autor, ação, entidade, campo e um resumo do valor anterior. Filtros no
  topo. Clicar numa linha abre o comparativo antes/depois.
- Em `AdminContentPage`, cada campo ganha um ícone de histórico que abre um
  painel com os últimos 10 valores daquele campo, cada um com "restaurar".
- Restaurar pede confirmação e recarrega o valor na tela.

### Testes

Log criado em create/update/delete de produto e conteúdo; restauração de
conteúdo funciona e é auditada; restauração de produto é recusada com 400.

---

## Fase 5 — Usuários

### API

- `GET /api/admin/users` — lista (sem hash). Requer papel `admin`.
- `POST /api/admin/users` — cria com senha inicial; hash com bcrypt, custo 10,
  como no login atual.
- `PUT /api/admin/users/:id` — nome, papel, ativo.
- `DELETE /api/admin/users/:id`.
- `PUT /api/admin/users/me/senha` — exige a senha atual; qualquer usuário.

Travas, verificadas dentro da transação:

- Ninguém se desativa nem se exclui.
- Precisa restar ao menos um usuário `admin` ativo depois da operação.
- E-mail é único e normalizado em minúsculas.

### Login

`POST /api/auth/login` consulta `admin_users` por e-mail normalizado e ativo.
Mantém o `loginLimiter` atual e a mesma resposta genérica para credencial
inválida, sem revelar se o e-mail existe.

**Recuperação:** se — e somente se — não houver **nenhum** usuário ativo na
tabela, o login volta a aceitar `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` do `.env`
e registra `console.warn`. Existindo qualquer usuário ativo, o caminho do `.env`
fica desligado. Isso cobre o cenário da migration engolida pelo `|| true` sem
deixar uma porta dos fundos permanente.

### Interface

- `/admin/usuarios` — visível apenas para papel `admin`; lista, criar, editar,
  desativar, excluir.
- `/admin/conta` — trocar a própria senha, disponível a todos.
- A sidebar esconde "Usuários" para `editor`; o backend barra
  independentemente, já que esconder no front não é controle de acesso.

---

## Fase 6 — Imagens órfãs e manutenção

### Exclusão com trava de referência

`server/src/lib/imagens.js`:

```
removerSeOrfa(caminhoPublico) →
  1. Normaliza e resolve o caminho absoluto.
  2. Recusa se o resultado não estiver sob public/images/{produtos,hero,cms}.
  3. Recusa se for symlink (lstat).
  4. Consulta, numa só query, se o caminho aparece em:
       products.image, products.gallery (jsonb),
       hero_slides.image_url, hero_slides.layers (jsonb),
       page_content.value
  5. Só apaga se nenhuma referência sobrar. Registra no audit_log
     (entidade 'image', acao 'delete').
  6. Nunca lança: erro vira console.error.
```

Acionada **depois** do commit da alteração no banco, em:

- `DELETE /api/admin/products/:id` — imagem principal e galeria.
- `PUT /api/admin/products/:id` — arquivos que saíram de `image`/`gallery`.
- `DELETE` e `PUT` de hero slides — `image_url` e urls dentro de `layers`.

A ordem importa: consultar antes do commit veria a própria linha antiga como
referência e nunca apagaria nada.

### Decomposição do slide builder

`AdminSlideBuilderPage.jsx` (623 linhas) vira:

- `SlideBuilderCanvas.jsx` — a área de desenho e o arrastar de camadas.
- `SlideLayerList.jsx` — a lista lateral, ordenação e visibilidade.
- `SlideLayerInspector.jsx` — o painel de propriedades da camada selecionada.
- A página fica com o estado, o carregamento e o salvamento.

Refatoração sem mudança de comportamento, feita por último para não conflitar
com as fases anteriores.

### CLAUDE.md

Atualizar: a linha "Testes: nenhum framework configurado" está errada (Jest +
supertest, `npm test` em `server/`); acrescentar as páginas, rotas, migrations e
helpers criados aqui.

---

## Sequenciamento e risco

As fases são independentes entre si, exceto pelas dependências abaixo:

- Fase 4 e Fase 5 dependem da Fase 0 (tabelas e helper).
- Fase 6 é a última por tocar arquivos que as outras fases editam.

Cada fase termina com `git add` → commit em Conventional Commits → push para
`main`, conforme o CLAUDE.md. Isso significa que cada fase vai a produção pelo
deploy automático assim que for empurrada — então cada uma precisa estar
completa e verificada por si só, e é por isso que a ordem começa pela que
elimina perda de trabalho.

Pontos de risco assumidos:

1. **Login dependente de tabela nova** (Fase 5) — mitigado pela recuperação via
   `.env` quando não há usuário ativo.
2. **Exclusão automática de imagem** (Fase 6) — mitigada pela trava de
   referência, pela restrição de diretório e pelo registro em auditoria. O
   usuário foi avisado do risco e optou por ela conscientemente.
3. **Query extra por requisição admin** (Fase 0) — aceita em troca de revogação
   imediata; volume de painel torna o custo irrelevante.
