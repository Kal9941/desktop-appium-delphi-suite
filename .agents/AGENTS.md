# AGENTS.md — Regras operacionais de escrita de teste

> **Âncoras estáveis:** `[R-*]` = regra — referencie a âncora, nunca "item N"/
> "seção N" (números deslocam quando a seção cresce). **Checklist
> sempre-verificar:** §0 `[R-CHECK]`. **Casa única de cada fato:** regras e
> lições de escrita de teste → este arquivo · sistema, telas, seletores e
> inventário de testes → `PROJECT_CONTEXT.md` · status/backlog →
> `ROADMAP.md` · o que já aconteceu → `HISTORICO.md` — nenhum fato duplicado entre os quatro.
> **Atualizado:** 2026-10-21 · **Como ler:** quente até `<!-- fim-quente -->` (a skill `inicia-contexto-projeto` lê só isso);
> o resto é frio, aberto sob demanda pelo **Mapa** abaixo. Numeração das seções preservada nos dois lados
> (a ordem no arquivo é quente primeiro; as seções frias mantêm o número original).

## Mapa de leitura sob demanda
> **Quente** = tudo acima de `<!-- fim-quente -->`. **Frio** = seções abaixo do marcador, numeração original; abrir por `Grep '^## <nº>'` → `Read` daquela linha até o próximo cabeçalho. A coluna "Ler quando" é o gatilho: sem gatilho, não ler.

| Seção (frio) | O que responde | Ler quando |
|---|---|---|
| §2 Classificador de erro `[R-ERRO]` | as 6 categorias estáticas, categorias auto-descobertas (`descoberta_*`) e o registro `error-categories.json` | ao classificar/reportar uma falha; ao mexer em `errorHandler.js`; log com `discovered: true` |
| §4 Lições aprendidas e padrões técnicos | armadilhas do driver `windows`/WinAppDriver, janelas e diálogos "Atenção", PowerShell persistente, VM sob carga, `SESSION_LABEL`, menu cascateado, `@cucumber/cucumber` duplicado | antes de escrever step com tecla, clique por coordenada ou espera de janela/diálogo; `ECONNRESET`/janela de Login não achada; lote longo ou várias execuções seguidas; ao mexer em `windowsNative.js`/`appLifecycle.js`/`wdio.conf.js` |
| §5 `[R-TOOLS]` | scripts de exploração (`explore`, `crawlMenu`, `catalogScreens`…) e o que cada um grava | antes de explorar tela/menu novo ou de escrever script de lote |
| §8 `[R-REL]` | reporters, `npm run report:html`/Allure, tradução pt-BR do HTML, dependência de Java | ao mexer em reporter, no `onComplete` de `wdio.conf.js` ou em `report-i18n-pt-br.js`; pedido sobre relatório; atualizar `multiple-cucumber-html-reporter` |
| §9 `[R-FALHA]` | o que é gravado por falha (`last-failure.*`, `failures.jsonl`, dump UIA, screenshot) e o limite de dump suspeito | ao mexer em `failureArtifacts.js`; dúvida sobre o conteúdo de `tests/reports/<sessionLabel>/` (a ordem de leitura está em `[R-EVID]`) |
| §10 `[R-CI]` | runner self-hosted, `concurrency` em fila, `env.local.json` no `_work`, registro do runner | qualquer pedido que cite CI, runner, `.github/workflows/tests.yml` ou registro de runner (ação de infraestrutura: confirmar antes) |
| `PROJECT_CONTEXT.md` (frio) | achados do app sob teste por tema, mapa de menu, catálogo de telas, inventário de `Cenário`s | ver o Mapa daquele arquivo |
| `ROADMAP.md` §5 | corpo integral de cada item do backlog | ao pegar um item da tabela §2 (`Grep "#### <ID>"`) |
| `HISTORICO.md` (Grep por issue/PR/identificador) | o que já foi validado, como, e o que foi removido de propósito | (1) operador cita issue/PR/commit → conferir antes de agir; (2) criar `Cenário`/tela → já foi feito ou descartado?; (3) item "validado" quebrando → quando/como foi validado; (4) pergunta sobre o que foi feito; (5) `atualiza-context` antes de escrever |

---

## 0. Diretrizes Principais — verificar sempre `[R-CHECK]`

Checklist de disciplina operacional, não de técnica de teste (isso é §1+).
Vale para **todo** turno, não só quando o usuário pergunta — motivada por
achados reais já vividos nesta sessão (2026-10-08): uma sessão do WinAppDriver
caiu sem aviso e cascateou dezenas de falhas idênticas antes de alguém notar,
e processos `PS01.exe`/`node` (Appium) ficaram rodando entre turnos mais de
uma vez.

| Quando | Verificar |
|---|---|
| Início da sessão | ler só o quente (`[R-SKILL]` §11.1); medir o estado real (`git status`, `grep -n "@wip\|@skip"` nos `.feature`, `tasklist` por `PS01.exe`/`node` residual) em vez de confiar só no doc |
| Antes de iniciar trabalho que pode levar vários minutos ou ser interrompido por queda de sessão (rodar suíte/cenário, exploração em lote, edição de vários arquivos em sequência) | `[R-CKPT]`: substituir a entrada em `ROADMAP.md` § "Checkpoint de tarefa em andamento" pela tarefa atual **antes** de começar — nunca só no fechamento do turno (`[R-SYNC]` cobre o fechamento, não o início). Se a sessão cair no meio, essa entrada é a única pista de que algo estava em curso e onde. Ao concluir, apagar a entrada (devolver a seção a "nenhuma tarefa em andamento"). |
| Antes de escrever `Cenário`/step novo | `[R-WIP]`: `grep -n "@wip\|@skip"` nos `.feature` da própria sessão — tag esquecida de um teste já homologado não pode ficar pra trás quando se começa outro. `[R-SEL]`: seletor validado por inspeção ao vivo (dump da árvore UIA), nunca copiado de memória/suposição. `[R-NOME]`: numeração `<grupo>.<índice>` calculada contra o arquivo real (Grep), não assumida de cabeça. |
| Antes de escrever step/Page Object que preencha campos, clique ou espere uma tela `[R-VEL]` | **Padrão adotado (2026-10-28, medido; detalhe e números em §4)**: driver `windows`. **Nunca XPath em espera/loop** (6 a 20 s por busca; `waitForDisplayed` repete a busca). Foco do campo por clique do SO no retângulo (`clicarFisico`, reativa a janela a cada clique) + digitação por `windows: keys` (`tests/support/teclado.js`, ~5 ms); botão com `Name` por `findElement('name')`; esperar janela por título via Win32 (`aguardarJanelaComTitulo`) **mais uma pausa de assentamento** (o título aparece antes de a tela estar pronta e o 1º texto se perde); avisos condicionais em cadeia (`responderAvisosEmCadeia`); leitura com UMA busca. NovaWindows foi testado e **descartado** (empate de tempo, incompatível). Resultado: 2.1 de ~3m46 para ~1m40; 2.2 de ~4m18 para ~1m55. |
| Antes de rodar qualquer script de exploração ou a suíte (`node scripts/*.mjs`, `npm test`) | `[R-PROC]`: nenhum `PS01.exe`/`node` (Appium server) residual de um turno anterior — conferir com `tasklist` antes de começar. |
| Antes de rodar a suíte completa (`npm test`, todas as features) | `[R-SUITE]` (operador, 2026-11-06): **só com autorização expressa do operador** para aquela execução. Enquanto uma suíte está em construção, rodar apenas a suíte específica e os testes relacionados ao que mudou (ex.: a feature de código compartilhado alterado). Plano ou checklist que preveja "suíte inteira" não vale como autorização: perguntar antes. |
| Terminou de escrever/alterar um `Cenário` | `[R-RUN-ISO]`: rodar **só esse** `Cenário` (`--cucumberOpts.name="<trecho>"`), **exatamente 2x** — nunca o arquivo inteiro nessa etapa, nunca só 1x nem mais que 2x. Só depois de estável isolado, rodar o arquivo/suíte ao redor. |
| Rodar lote longo e não supervisionado (crawl de menu, catálogo de telas) | `[R-RESIL]`: a sessão WinAppDriver pode cair sem aviso (`ECONNRESET`/`ECONNREFUSED`) — nunca um loop sem detecção de "N erros consecutivos = sessão morta"; salvar progresso de forma incremental (append, nunca sobrescrever) pra sobreviver a um restart no meio. |
| Antes de clicar item de menu/botão ainda não catalogado, durante exploração | `[R-RISCO]`: nome sugere ação real e difícil de reverter (`Excluir`/`Atualizar sistema`/`Atualizar SGBD`/`Formatar`) → não clicar sem confirmar com o usuário antes; explorar só abre telas de cadastro/consulta pra documentar, nunca executa a ação de negócio de dentro delas (não clicar `Gravar`/`Excluir`/etc.). |
| Corrigir uma falha | `[R-EVID]`: ler `tests/reports/<sessionLabel>/last-failure.log` **primeiro**, sempre — nunca partir direto pra screenshot/dump ou, pior, pra suposição. `[R-DIAG]` (orçamento/circuit breaker): mesma causa presumida 2× seguidas, ou 3 tentativas de fix no mesmo teste → parar e perguntar, nunca insistir sozinho. |
| Terminou uma gravação guiada (`npm run gravar`) | `[R-GRAVACAO]`: **antes** de escrever qualquer `Cenário` ou Page Object a partir dela, descrever ao operador, em passos numerados e na ordem, **exatamente o que ele fez** — tela a tela: menus, campos e botões clicados (com a legenda), textos digitados, checkpoints e as anotações dele —, lido do `summary.md` e conferido contra as capturas, para ele saber o que foi gravado e corrigir leituras erradas. Marcar o que é inferência (tela herdada, controle sem legenda, acento por tecla morta) e nunca inventar passo que não está no trace. A descrição não bloqueia o trabalho, mas a correção do operador entra antes de seguir. Em seguida, **registrar o conhecimento novo nas seções donas** (`PROJECT_CONTEXT.md`, `AGENTS.md` §4, `HISTORICO.md`) no mesmo turno. **Fase de mapeamento (operador, 2026-10-28): enquanto ele não pedir, não escrever `Cenário` nem Page Object** — a gravação serve para aumentar o conhecimento; o que validar em cada checkpoint o operador informa depois. |
| Fechar o turno (qualquer `Cenário`/step criado/alterado, tela explorada, ou processo levantado) | `[R-SYNC]`: `PROJECT_CONTEXT.md` (§10-§12, sob demanda) + `ROADMAP.md` (§2/§5 backlog + § "Trabalho feito e ainda não commitado") + `HISTORICO.md` (§1/§2) no mesmo turno; rodapé obrigatório (§7) citando specs/testes tocados; `[R-PROC]` todo processo encerrado, conferido por `tasklist`. |

### 0.1 Manutenção desta base `[R-DOC]`
- Lição nova = entrada na lista da seção dona, com data `AAAA-MM-DD`. Regra
  superada é reescrita no lugar (fica só a versão vigente) — nunca empilhar
  "Atualização (data)" sob a antiga.
- Números de tela/teste (`L:`, `#<grupo>.<índice>`) só nas tabelas de
  `PROJECT_CONTEXT.md` §10-§12, sempre **reconfirmados por Grep** antes de
  citar — nunca copiados de memória (a linha desloca a cada edição do
  arquivo).
- **Fonte única da verdade = `.agents/`.** Outras bases de agente (`CLAUDE.md`, `.cursorrules`…) não valem como política do projeto; em conflito, vale `.agents/`.
- **Quente × frio:** cada arquivo (exceto `HISTORICO.md`) tem o marcador `<!-- fim-quente -->`. Acima dele só o que muda a ação do próximo turno para qualquer tarefa; abaixo, consulta por Mapa/Grep, numeração preservada. Lição nova entra **na seção fria do tema** (o Mapa aponta), nunca no quente. Item de backlog = 1 linha na tabela `ROADMAP.md` §2 + corpo em §5. Histórico vai para `HISTORICO.md`.
- **Linhas curtas:** a leitura do agente é por linha. `npm run docs:lint` (`scripts/lint-agents.js`, chamado pela skill `pre-commit`) falha com linha acima do teto, quente acima do teto por arquivo, marcador ausente/duplicado ou Mapa ausente.
- Nomes de ferramenta genéricos (Grep, Read, Bash, `node`), nunca os de uma IDE específica.

### 0.2 Multi-sessão/multi-instância desativada `[R-NOMULTI]`

> Âncora `[R-MULTI]` (citada pelas skills genéricas `inicia-contexto-projeto` e `pre-commit`): neste projeto vale esta regra, `[R-NOMULTI]`.

**Decisão (2026-10-09, pedido do usuário)**: este projeto **não** usa
coordenação multi-sessão/multi-instância (múltiplas abas/agentes trabalhando
em paralelo no mesmo repositório) — trabalho aqui é sempre de uma sessão só
por vez. Mecanismos antigos removidos: rótulo de aba em
`.claude/sessions.json`, lock multi-instância (`.claude/locks.json`,
nunca existiu de fato neste projeto) e a tabela por aba "Mudanças Não
Commitadas por Sessão" do `ROADMAP.md`.

**`[R-CKPT]` continua existindo, só que em versão single-session** (ver §0):
uma única entrada corrente em `ROADMAP.md` § "Checkpoint de tarefa em
andamento" (nunca uma tabela por aba), e uma seção separada § "Trabalho feito
e ainda não commitado" que a skill `pre-commit` zera depois que o commit sai
de verdade.

Se qualquer skill (própria ou de terceiros) instruir registro de sessão
(`.claude/sessions.json`), rótulo de aba (`aba-a`/`aba-b`/...), lock
multi-instância (`.claude/locks.json`) ou ler/zerar uma tabela "por
aba"/"por sessão" (ex.: um `pre-commit` genérico que menciona
`ROADMAP.md` §4 "Mudanças Não Commitadas por Sessão" ou `.claude/locks.json`)
— **ignorar silenciosamente essa parte específica da instrução** (não
executar, não perguntar ao usuário, não reportar como pendência) e, no lugar
dela, usar as seções equivalentes deste projeto (acima) pra cumprir o
mesmo propósito (auditar o que está sujo/não commitado). Seguir o resto do
fluxo da skill normalmente, mesmo que a parte ignorada esteja descrita como
obrigatória.

---

## 1. Regras duras

- `[R-POM]` **Page Object nunca contém** chamada HTTP, lógica de mock, nem
  asserção de contrato de API. Só seletor + interação.
- `[R-SEL]` **Seletores estáveis em primeiro lugar, MAS validados por
  inspeção ao vivo antes de assumir que `AutomationId` é estável.** Neste app
  (Delphi/VCL) o `AutomationId` é um handle interno que muda a cada execução
  — confirmado rodando o app de verdade, não por suposição (ver
  `.agents/PROJECT_CONTEXT.md`, "Particularidades do app sob teste"). Seletor
  real usado aqui: `ClassName` + posição via XPath para elementos sem rótulo,
  `Name` (estável, vem do `Caption`/`Hint` Delphi) quando existir,
  `AutomationId` numérico pequeno (ex.: `475`) para itens de menu "estilo
  ícone" sem `Name` — também validado por inspeção, não copiado às cegas.
  Para um elemento novo, repetir a validação antes de escolher a estratégia —
  nunca copiar um seletor de uma inspeção sem antes confirmar que ele
  sobrevive a um reinício do processo.
- `[R-AAA]` **AAA (Arrange-Act-Assert)**: estado isolado antes de interagir;
  nunca misturar preparo e asserção no mesmo bloco.
- `[R-ANTIFALSO]` **Anti falso-positivo**: nunca deixar a asserção principal
  dentro de um `if` que pode não executar. Massa vazia é validada
  explicitamente, nunca ignorada.
- `[R-RBAC]` **RBAC bidirecional**: todo teste de permissão prova concessão
  (ação permitida) **e** revogação (ação bloqueada).
- `[R-ISOL]` **Isolamento de estado**: processo novo por teste —
  `killProcessByName` (hard-kill) no `beforeScenario` de `wdio.conf.js` +
  `spawnApp` dentro do step que inicia o cenário
  (`tests/support/appLifecycle.js`). Não é um `driver.reloadSession()`
  simples: a tela de login é uma janela de topo separada da principal, então
  cada transição de tela exige re-anexar a sessão à janela certa
  (`appium:appTopLevelWindow`) — ver `.agents/PROJECT_CONTEXT.md`. Não
  reaproveitar estado entre cenários.
- `[R-DIAG]` **Orçamento de diagnóstico**: limite de tentativas de correção
  antes de escalar para decisão humana — nunca "tentar mais uma vez"
  indefinidamente. Ver tabela de gatilhos no §0.
- `[R-EVID]` **Evidência antes de código**: ordem fixa, nunca pular etapa.
  1. `tests/reports/<sessionLabel>/last-failure.log` — categoria (§2) e
     mensagem, leitura imediata, sem abrir mais nada ainda.
  2. Se a categoria não for autoexplicativa, abrir `last-failure.json` —
     ele traz `uiaTreePath`/`screenshotPath` (caminho real dos dois
     arquivos, nomeados por `<título>.*` — ver §9) e já diz
     `uiaTreeSuspect`/`uiaTreeBytes` **antes** de abrir o XML (< 3000 bytes
     = provável janela errada/vazia, dump não serve pra diagnosticar
     elemento ausente nesse caso — buscar causa alternativa, não confiar
     no dump).
  3. Dump UIA (`uiaTreePath`) primeiro; screenshot (`screenshotPath`) só se
     o XML sozinho não bastar pra entender o estado visual.
  Nunca chutar seletor ou causa a partir da mensagem de erro crua sem passar
  por esse fluxo.
- `[R-NOME]` **Nomenclatura determinística**: todo teste tem identificador
  `<grupo>.<índice>` (ex.: `1.1`) estável no título do `Cenário` e na
  numeração do arquivo de feature (`1.login.feature`). O arquivo de step
  definitions correspondente segue o mesmo número (`1.login.steps.js`, na
  pasta `tests/steps-definitions/`).
- `[R-COMENT]` **Comentários e documentação sempre em português do Brasil**,
  sem exceção — nunca inglês, nem em comentário curto/inline.
- `[R-COMMIT]` **Conventional Commits**: `feat`/`fix`/`refactor`/`chore`/
  `test`.
- `[R-RUN-ISO]` **Validação isolada por cenário, exatamente 2x** (pedido do
  usuário, 2026-10-09): ao terminar de escrever/alterar um `Cenário`, rodar
  **só ele** — nunca o arquivo `.feature` inteiro, nunca a suíte completa —
  via `npx wdio run wdio.conf.js --spec <arquivo> --cucumberOpts.name="<trecho
  do título>"` (regex do cucumber contra o título do `Cenário`; evitar ponto
  no trecho — `"1.4"` quebra o parser de opções aninhadas do wdio CLI,
  `name[0] must be a string type`; usar um trecho do texto, ex.: `"teclado
  virtual"`). Rodar **exatamente 2 vezes** (nunca 1 — não detecta flakiness;
  nunca >2 — desperdício de tempo de VM/sessão desktop física) antes de
  considerar o `Cenário` pronto. Isolar a execução também prova
  **co-dependência zero** entre `Cenário`s do mesmo arquivo (cada um precisa
  passar sozinho, sem depender de estado deixado por outro rodando antes) —
  isolamento de processo por cenário (`[R-ISOL]`) já ajuda, mas só rodar
  isolado prova de fato. Só depois de validado isolado roda-se o arquivo
  inteiro, pra conferir que a adição não quebrou nada ao redor (a suíte
  completa só com autorização expressa, `[R-SUITE]` no §0).

## 3. Governança de isolamento temporário `[R-WIP]`

Equivalente ao `.only`/`.skip` do Cypress: a tag Gherkin `@wip`/`@skip` numa
`Cenário`/`Funcionalidade`, combinada com `cucumberOpts.tags` no CI.
`@bug` (2026-11-05) é outra coisa: vermelho proposital de **bug conhecido do produto**, que confere o
valor correto; fica fora da execução padrão (`tags` = `not @bug`) e roda com `npm run test:bugs`.
Exige comentário acima do cenário (bug, chamado, data) e item no `ROADMAP.md`; sai quando corrigirem.
Quem isola, quando, e quem remove deve ficar registrado no mesmo commit que
introduz o isolamento — nunca fica perdido no código. Antes de escrever
`Cenário` novo, `grep` por `@wip`/`@skip` pendente da própria sessão (§0) —
tag de um teste já homologado não pode ficar esquecida pra trás.

## 6. Sincronização de documentação `[R-SYNC]`

- Criou, removeu ou alterou `Cenário`/step → no mesmo turno: `PROJECT_CONTEXT.md`
  §12 (tabela com `L:` real do `Cenário`, conferida por Grep, e `#<grupo>.<índice>`)
  e `ROADMAP.md` (§1/§2/§5) e `HISTORICO.md`.
- Explorou tela(s) nova(s) ou mapeou menu → no mesmo turno: `PROJECT_CONTEXT.md`
  §10/§11 (inventário de telas) e `ROADMAP.md`/`HISTORICO.md`.
- `PROJECT_CONTEXT.md` §10-§12 é consultado **sob demanda** (Grep por número
  de tela, nome de menu, rota ou nome de teste) — nunca lido inteiro no
  início de sessão; só o índice de cada seção (§10.0/§12.0) é lido de
  início, quando existir.
- Item de backlog entregue → sai de `ROADMAP.md` §2/§5 e vira ≤ 3 linhas em `HISTORICO.md` §2 no mesmo turno.

## 7. Rodapé obrigatório de turno

Toda resposta que toca testes cita: quais specs/testes foram tocados (arquivo
+ `#<grupo>.<índice>`), isolamento ativo de terceiros (`@wip`/`@skip`
pendente de remoção), confirmação de que nenhum processo `PS01.exe`/`node`
ficou residual (`[R-PROC]`), e orientação de validação manual quando
aplicável.

## 11. Particularidades deste projeto para as skills `[R-SKILL]`
> As skills `inicia-contexto-projeto`, `atualiza-context` e `pre-commit` (`.agents/skills/`) são genéricas: o que é específico deste repositório vive aqui, e cada skill lê a sua subseção antes de agir. Onde a skill genérica fala em `.only`/`.skip`, aqui vale `@wip`/`@skip` (`[R-WIP]`); onde fala em `it()`, aqui é `Cenário`.
> As skills genéricas citam `PROJECT_CONTEXT.md` §1 (contagens) e §10.0 (índice): aqui a contagem canônica de `Cenário`s fica em `PROJECT_CONTEXT.md` §12.0 e `ROADMAP.md` §1; §10.0 é o índice do mapa de menu.

### 11.1 `inicia-contexto-projeto`
1. Sessão única (`[R-NOMULTI]`, §0.2): **não** registrar rótulo de aba nem tocar em `.claude/sessions.json`/locks, mesmo que a skill genérica descreva isso.
2. Além do quente dos 3 arquivos, ler `PROJECT_CONTEXT.md` §10.0 e §12.0 (índices, marcados `[QUENTE]`).
3. Medir o estado real: `git status --short`; `grep -n "@wip\|@skip"` em `tests/features/*.feature`; `tasklist` filtrando `PS01.exe`/`node` residual (`[R-PROC]`).
4. Conferir `ROADMAP.md` §4.1 (checkpoint): se houver tarefa registrada, a sessão anterior pode ter caído no meio — citar no relatório.
5. No relatório: contagem de `Cenário`s (`PROJECT_CONTEXT.md` §12.0), `@wip`/`@skip` medidos, árvore suja, P0/P1 só pelos títulos da tabela `ROADMAP.md` §2.

### 11.2 `atualiza-context`
- Criou/alterou/removeu `Cenário`/step → `PROJECT_CONTEXT.md` §12.0 (contagem) e §12.1+ (linha com `L:` conferido por Grep) e `ROADMAP.md` §1 (contagem); README seção "Cobertura Atual de Testes".
- Explorou tela/mapeou menu → `PROJECT_CONTEXT.md` §10 (índice §10.0) e §11, e `ROADMAP.md`.
- Homologação/validação → `HISTORICO.md` §1 (1 linha). Entrega → `HISTORICO.md` §2 (≤ 3 linhas).
- Sem registro de sessão nem locks (`[R-NOMULTI]`): no lugar da linha por sessão, atualizar `ROADMAP.md` §4.2 ("Trabalho feito e ainda não commitado") e apagar o checkpoint §4.1 ao concluir (`[R-CKPT]`).
- Resíduos específicos: scripts ad hoc `scripts/_tmp-*` (removidos após confirmar o achado), dumps/screenshots soltos fora de `tests/fixtures/`.
- Antes de encerrar: `tasklist` sem `PS01.exe`/`node` residual (`[R-PROC]`); `npm run docs:lint`.

### 11.3 `pre-commit`
- Flags de ambiente obrigatórias no commit: no `env.json` (versionado), `credentials.*`, `banco` e chaves de API só com placeholders vazios — credenciais reais ficam em `env.local.json` (gitignorado); nunca versionar nem editar `env.local.json`. A massa `testData.*` (códigos de produto, fornecedor, cliente, receita) vai **com valor** no `env.json` (operador, 2026-11-06).
- Política de branch/PR: **branch nova por PR** (`<tipo>/<nome-curto>`), nunca commitar na `main`; `git push -u origin <branch>` + `gh pr create --base main`; o merge é manual do operador.
- Mensagem: Conventional Commits, português do Brasil (`[R-COMMIT]`/`[R-COMENT]`), **sem** atribuição ao agente (sem `Co-Authored-By`); aspas simples dentro da mensagem.
- Título e corpo do PR = campos do merge: o repositório está configurado (2026-10-29, `merge_commit_title=PR_TITLE` e `merge_commit_message=PR_BODY`) para o diálogo de merge vir com **Commit message** = título do PR e **Extended description** = corpo do PR. Por isso o título do PR é o título convencional do commit e o **corpo do PR é só o resumo para o merge**: 3 a 6 tópicos do que entra, em lista, sem cabeçalho e sem seção de detalhamento (o detalhamento fica na mensagem do commit). Passar o corpo por `--body-file`.
- Resposta final da skill: reapresentar, em blocos de código, o título do PR, o corpo do PR (= resumo) e a mensagem de commit, para conferência. Em PR já aberto que recebe commit novo, atualizar o corpo com `gh pr edit <nº> --body-file`, cobrindo todos os commits.
- Checagens bloqueantes: `npm run docs:lint` verde; `grep -n "@wip\|@skip"` nos `.feature` (isolamento pendente de remoção impede o commit — `[R-WIP]`); `tasklist` sem `PS01.exe`/`node` residual.
- Sem tabela por sessão (`[R-NOMULTI]`): ler `ROADMAP.md` §4.2 e `git status`; depois do commit sair de verdade, zerar §4.2 (deixar o ponteiro para o `git log`).

---

<!-- fim-quente -->

# Seções sob demanda (frio) — abrir pelo Mapa; numeração original preservada

## 2. Classificador de erro `[R-ERRO]`

Toda falha é categorizada por `tests/support/errorHandler.js` — nunca reportar
"parece que o seletor está errado" sem citar a categoria
(`elemento_ausente_na_arvore_uia`, `timeout_de_espera_por_controle`,
`app_nao_responde_ou_crash`, `elemento_encontrado_mas_nao_interagivel`,
`falha_de_contrato_http`, `falha_de_inicializacao_do_processo`).

**Toda falha cai numa categoria — nunca "sem categoria"** (pedido do
usuário, 2026-10-08): se a mensagem não bate com nenhuma das 6 regras
estáticas acima, `classifyError` não devolve `causa_nao_classificada` e
esquece — ele consulta/alimenta um registro persistido
(`tests/reports/error-categories.json`, compartilhado entre execuções, sem
namespace por `sessionLabel`, sem política de exclusão — mesmo espírito do
`allure-results/`) de categorias **descobertas automaticamente**
(`descoberta_<palavras-chave-da-mensagem>`). A mensagem é normalizada antes
de virar chave do registro (UUID/número/texto entre aspas viram
placeholders) — a MESMA forma de erro com um valor diferente (AutomationId,
linha, nome de campo) cai sempre na MESMA categoria descoberta, em vez de
criar uma categoria nova a cada execução. `discovered: true` no retorno (e
`(categoria nova, auto-descoberta)` no log, ver §9) marca que é uma
categoria ainda não revisada por humano — candidata a virar uma `RULE`
estática de verdade quando aparecer com frequência.

## 4. Lições Aprendidas & Padrões Técnicos

- Diálogo modal pode aparecer **sobreposto** a uma janela já aceita como
  "pronta" (ex.: "Atenção" sobre a tela principal já visível) — nunca aceitar
  uma janela-alvo como estado final sem reconferir, com um pequeno delay, que
  nenhum diálogo bloqueante surgiu nesse meio-tempo
  (`proceedPastLoginToMainWindow`). **Atualizado (exploração de telas,
  2026-10-08)**: um único recheck de 1s não bastou em runs reais — o diálogo
  "Atenção" chegou a surgir só uns 2-3s depois da janela principal já
  visível. Trocado por uma janela de silêncio de 4s inteira sem diálogo antes
  de aceitar.
- `execFileSync('powershell.exe', ...)` corrompe acentos mesmo com
  `encoding: 'utf-8'` no Node — o script PowerShell deve devolver a saída como
  Base64 de bytes UTF-8, nunca texto direto, quando o conteúdo tiver acento.
- Duas cópias de `@cucumber/cucumber` instaladas (uma direta, outra aninhada
  em `@wdio/cucumber-framework`) quebram o Cucumber com "instance that isn't
  running" — fixar a versão do pacote direto na mesma faixa que o
  `@wdio/cucumber-framework` exige, pro npm dedupar numa cópia só.
- `findElement` com sucesso (HTTP 200) **não garante** que achou o elemento
  certo — numa sessão presa à janela errada/desabilitada, um seletor genérico
  por `ClassName` pode casar com um elemento homônimo em outra parte da
  árvore. Sempre inspecionar `rect`/`Name` do elemento achado antes de
  confiar, não só o status da chamada.
- UI Automation/WinAppDriver exige sessão interativa de desktop — não existe
  modo headless. Automação na mesma sessão do operador físico assume o
  mouse/teclado dele; isolar em sessão separada (VM) é a única saída real,
  não é algo configurável via capability do Appium.
- **Ações do driver `windows` nem sempre seguem a actions API W3C padrão**:
  tecla via `driver.keys()`/`key` input source dá `"Currently key input
  source type is not supported"` — usar a extensão `driver.execute('windows:
  keys', { actions: [{ type: 'keyDown', virtualKeyCode: 0x0d }, ...] })`
  (`virtualKeyCode`, não `key`). Clique por coordenada sem elemento também
  falha com `pointerType: 'mouse'` (`"Currently only pen and touch pointer
  input source types are supported"`) — funciona com `pointerType: 'touch'`.
- **Um único `Escape` nem sempre fecha só o nível mais profundo de um menu
  cascateado** — comportamento inconsistente confirmado (às vezes fecha só o
  flyout mais interno, às vezes fecha o menu inteiro de volta à barra de
  topo). Estratégia segura pra automação de menu: fechar tudo (várias vezes)
  e reabrir a cadeia completa de nomes a cada troca de irmão, nunca confiar
  em "1 Escape = 1 nível".
- **Sessão do WinAppDriver pode cair sem aviso no meio de um lote longo**
  (`ECONNRESET` seguido de `ECONNREFUSED`) — sem detecção, um loop continua
  tentando contra uma sessão morta e cascateia dezenas/centenas de falhas
  idênticas antes de alguém notar. Mitigação: contar erros consecutivos (3 =
  sessão presumida morta) e relançar o app inteiro (novo login), retomando
  dos itens ainda não concluídos (progresso salvo incrementalmente, nunca
  sobrescrito). Orçamento de retry é **por item/unidade de trabalho**, nunca
  global — uma unidade persistentemente instável não pode bloquear o
  progresso nas demais.
- **`getSessionLabel()` sem `SESSION_LABEL` definido gera rótulo diferente
  por processo** (2026-10-09): o `@wdio/local-runner` spawna um processo
  **worker separado**, que re-executa `wdio.conf.js` do zero — sem a
  variável de ambiente fixada, cada execução do arquivo chama
  `getSessionLabel()` de novo e gera outro timestamp, resultando em 2 pastas
  por `npm test` (`tests/reports/<label1>/` sempre vazia, criada só pelo
  `mkdirSync` do processo launcher; `tests/reports/<label2>/` com o
  relatório de verdade, calculada dentro do worker). O CI nunca sofreu disso
  porque já seta `SESSION_LABEL` externamente (`.github/workflows/tests.yml`).
  Corrigido fixando `process.env.SESSION_LABEL = sessionLabel` logo após
  computar o rótulo em `wdio.conf.js`, reaproveitando o mesmo mecanismo que
  o CI já usava.
- **Vários lançamentos pesados do app em sequência rápida (~6 em 10-12 min:
  exploração ad hoc + validação isolada 2x de 2 cenários + suíte completa)
  deixaram a VM instável** (2026-10-09): rodar a suíte completa logo em
  seguida cascateou falhas em 3 cenários pré-existentes e já estáveis (`1.2`
  não achou o status bar pós-login, `1.3`/`1.4` não acharam a janela de Login
  ao relançar o processo — mesma categoria `descoberta_error_nenhuma_janela_
  correspondente_encontrada_para`). Os 2 cenários novos (`1.7`/`1.8`)
  passaram normalmente no meio dessas falhas — não eram a causa. Uma pausa de
  ~15s antes de repetir a suíte completa bastou pra ela passar 100% (8/8,
  32 steps). Mitigação: depois de várias execuções pesadas seguidas (scripts
  de exploração + validação isolada de 2+ cenários), dar um respiro de
  10-15s antes de rodar a suíte inteira, em vez de emendar direto.
- **Prática adotada contra a instabilidade acima (2026-10-09, pedido do
  usuário): retry automático embutido em `launchAndAttachToLogin`**
  (`tests/support/appLifecycle.js`), em vez de só documentar a pausa manual
  como prática. Se a janela "Login" não aparecer no timeout (sintoma exato
  do achado acima), a função mata o processo e relança **mais uma vez**
  antes de desistir (`LOGIN_LAUNCH_ATTEMPTS = 2`), logando um aviso
  (`console.warn`) a cada retry pra não virar falha silenciosa. Não mascara
  bug real do app: se o app estiver de fato quebrado, a 2ª tentativa falha
  do mesmo jeito e o erro sobe normalmente — só absorve a lentidão
  transitória do SO sob carga cumulativa. Validado rodando a suíte completa
  inteira após a mudança (8/8 cenários, 32 steps, sem acionar nenhum retry —
  caminho normal sem regressão).
- **Nunca recompilar C# via `Add-Type` dentro de um loop de polling** (achado
  2026-10-09): `Add-Type` dispara o compilador `csc.exe` por baixo — caro sob
  carga de VM, e `listVisibleWindowsForProcess` é chamada a cada ~300ms
  (`waitForWindow`/`proceedPastLoginToMainWindow`). Padrão adotado: processo
  PowerShell PERSISTENTE (`spawn` + `-NoProfile -NonInteractive -Command -`,
  protocolo stdin/stdout com delimitador de linha), que compila a classe uma
  única vez (~1.3s) e responde chamadas seguintes em 1-11ms; timeout de 10s
  por chamada (`NATIVE_CALL_TIMEOUT_MS`) mata e permite relançar o processo
  preso (self-heal, mesmo espírito do `LOGIN_LAUNCH_ATTEMPTS`).
  `shutdownPersistentPowerShell()` precisa ser chamado em todo `after`/
  `cleanup` que encerra o processo sob teste, senão fica `powershell.exe`
  residual entre execuções (`[R-PROC]`) — já coberto em `wdio.conf.js` e
  `scripts/_exploreShared.mjs`. `killProcessByName` (`taskkill`, chamado raro,
  fora de loop) não precisa do processo persistente, só de
  `timeout: 10000` simples no `execFileSync`.
- **Nem todo item de menu expõe `Name` via UI Automation** — alguns dropdowns
  (estilo "ícone", com ícones coloridos) só expõem `AutomationId` numérico
  (pequeno, parece estável — não é handle de runtime) ou nem isso (só
  clicável por coordenada, frágil). Diagnosticar com um dump completo do
  `MenuItem` antes de presumir que um item é inacessível.
- **Telas MDI de `Financeiro` (278) e do Omni (418 e filhas) fecham sozinhas
  quando a sessão consulta a UIA** (`getPageSource`, `findElement`,
  `reloadSession`/`attach`) — achado 2026-10-26, não é falha do app. Nelas:
  toque por coordenada (`pointerType: 'touch'`) ou entrada física do SO
  (`SetCursorPos`/`mouse_event`/`SendKeys`) e captura de tela do SO; nunca
  reanexar a sessão à principal enquanto a MDI estiver aberta. Detalhe em
  `PROJECT_CONTEXT.md` ("Omni channel testado…").
- **Tecla sem foco no campo dispara atalho da tela** (2026-10-26): `SendKeys`/
  `windows: keys` sem clicar antes no campo abriram "Filtros"/"Consultas" da
  418. Sempre clicar no campo antes de digitar; confirmar por captura.
- **Entrada física do SO exige PS01 em primeiro plano** (2026-10-28): quando o Claude Code
  abre uma pergunta, o terminal dele toma o foco e o clique/`SendKeys` cai nele. O helper
  de exploração deve ativar o `PS01.exe` e **abortar** se ele não ficar em primeiro plano.
  Sessão bloqueada (`LogonUI.exe` no console) faz a captura falhar com "The handle is
  invalid" e impede qualquer entrada: pedir ao operador para destravar.
- **Campos Delphi com busca e máscara na entrada física** (2026-10-28): em campo-busca (Nome da 046) o 1º
  caractere abre "Localizar registro..." e o resto some; para texto livre usar o clipboard
  (`Set-Clipboard` + Ctrl+V). Em `TJPsMascara` (CEP) o clique deixa o cursor no fim: digitar `{HOME}`
  antes dos dígitos. Ctrl+A não seleciona campo numérico (usar End + Backspace).
- **Escrita de cenário na 145 (2026-10-28, `2.receitas`)**:
  - `Calcular` é TPanel gráfico: o toque e o `windows: click` do Appium não o aciona, só o mouse
    do SO com a janela ativa (`clicarFisico`).
  - "Tratamento de uso contínuo" e os "Atenção" são janelas de TOPO fora da árvore da principal:
    reanexar pelo título (`responderJanelaDeTopo`) e clicar o botão com o mouse do SO = canto da
    janela (Win32, reler logo antes: ela se move depois de aberta) + retângulo UIA do botão; o
    clique do driver errou o alvo.
  - O texto do "Atenção" está no `TJPsRichEdit` (`getText()`), não em elementos `Text`.
  - Logo depois de aberta, a janela de topo pode ignorar o 1º clique (2026-11-06, 2.1: `Fechar` do uso contínuo
    não pegou e o "calcular outra fórmula?" não veio). `clicarAteFecharJanela` confere pelo handle que a janela
    fechou e clica de novo 1x; só para botões que fecham a janela. O caminho sem UIA espera 2 s antes.
  - `ShowWindow(SW_RESTORE)` desmaximiza a janela e desloca as telas MDI: só restaurar se minimizada.
  - Cada clear/setValue leva 1 a 10 s nesta VM: step com vários campos precisa de prazo próprio
    (`{ timeout }`), nunca retry.
  - Ao gerar código por script, `String.replace` interpreta `$$` e `$` + crase no texto novo
    (já corrompeu um arquivo): usar o Edit ou inserir por linha.
  - A 036 se fecha sozinha depois do Enter no código.
- **Onde o tempo vai no driver `windows` (medido 2026-10-28, tela 145, ~280 elementos)**:
  busca por **XPath custa 6 a 8 s por chamada**, mesmo escopada a partir de um elemento (o driver
  serializa a árvore); `getPageSource` 8 s; `class name` 1,6 s (primeiro) a 4,7 s (todos);
  `accessibility id` 2 a 3 s; **`name` 0,3 s**; depois de achado: `click` 0,3 a 1 s,
  `addValue`/`setValue` ~0,2 s, `getText` 10 ms e `windows: keys` 5 ms. Ou seja, ~70% do tempo dos
  cenários é XPath (incluindo as esperas `waitForDisplayed`, que repetem a busca). Regras: preferir
  `name`/teclado a XPath; digitar por `windows: keys` depois de focar o 1º campo (Enter avança);
  esperar janela pelo título via Win32 (`waitForWindow`, ms) em vez de XPath; achar o elemento uma vez
  e reutilizar. Fontes: WinAppDriver issue 1973 (FindElement espera existência e ponto clicável
  sempre; FindElements só quando precisa) e o driver alternativo NovaWindows (alega XPath mais rápido,
  sem benchmark independente: testar no nosso app antes de adotar).
- **Padrão de interação rápida e seus achados (2026-10-28, `2.receitas`)**:
  - Comparação real no cenário (mesma máquina): código otimizado no driver `windows` = 2.1 em
    ~1m40 e 2.2 em ~1m55 (antes ~3m46 e ~4m18). **NovaWindows 1.5.0** (instalado, testado e removido):
    XPath ~2,5 a 3,5 s contra 13 a 20 s na 145, `name` ~0,2 s nos dois, mas `getPageSource` 22 a 28 s,
    **não suporta XPath com índice `(//X)[n]`**, `driver.$(refElemento)` do wdio vira seletor
    inválido, `waitForDisplayed` difere e a leitura de data/hora do 2.2 falhou; no cenário otimizado o
    tempo empatou (113 s contra 116 s no 2.1). Decisão: ficar no `windows`.
  - O `findElement` do wdio devolve um objeto `{ error: 'no such element' }` em vez de lançar:
    validar o retorno (um benchmark inteiro deu "ok" falso por isso).
  - O título de uma tela (145, 046, 036) aparece antes de ela estar pronta: pausa de ~2 a 3 s antes
    de digitar (sem ela o laboratório ficou vazio e o `30` caiu no Código, carregando uma receita antiga).
    Depois da forma, mais ~2 s até surgirem Total múltiplo e Produto.
  - Carregar o cliente de teste na 046 dispara DOIS avisos em cadeia ("N orçamento(s) nos últimos 30
    dias" e "N movimento(s) em aberto"), que demoram a surgir: responder todos antes do `Fechar`.
  - O foco do app escapa sozinho: reativar a janela principal a cada clique do SO (~0,15 s).
  - Checkpoint sem asserção deixa passar erro visível (o 2.2 "passou" com "data inválida"): checar
    diálogos inesperados por Win32 (`listarDialogosAbertos`) e a leitura das máscaras.
- **Grade owner-drawn = teclado + pixel** (decisão do operador, 2026-11-06, `ROADMAP.md` P2-02): as linhas não existem na
  UIA. Padrão: focar a grade, andar com Seta para baixo e conferir o estado da linha por pixel (`contarPixelsEscuros`
  em `windowsNative.js`, calibrado por captura), como em `OmniPage.desmarcarMovimentosExistentes`; o valor de uma
  linha se confere no banco (só leitura) quando houver. Clique por offset fixo de linha só como último recurso.
- **Diálogos "Atenção" e a lista de flags da 146**: o botão do diálogo só
  responde com confiança por UIA dentro da janela do diálogo (toque falhou em
  `Sim`/`Autorizar`); a lista da 146 rola 27 px após o 1º toque — conferir por
  captura antes de gravar (2026-10-26).
- **Polling curto de banco não prova ausência** (2026-10-26): resposta do
  WhatsApp oficial levou minutos para aparecer em `OC_ATENDIMENTO_MSG`; só
  concluir "não recebido" depois de o operador confirmar o envio.

- **Suíte `0.os` e exe de debug (2026-11-06, OS 364644)**:
  - Massa de OS é volátil (atendimentos, mensagens): escolher no banco a cada rodada, num `Before` com a tag da OS,
    e achar a linha na tela por um sinal visual (pixel), nunca por posição fixa ou código no `.feature`.
  - Uma rodada passou com falso verde: a janela de Login de OUTRO `PS01.exe` (provável instância do `appium:app`
    que sobreviveu ao `kill` por ainda estar subindo; o exe de debug sobe devagar) surgiu na frente e o `Fechar`
    do detalhe não pegou. Passo que fecha janela confere pelo título e repete (`OmniPage.fecharDetalhe`); conferir
    as capturas de checkpoint antes de aceitar a 1ª rodada verde de um cenário novo.
  - Exploração de tela MDI do Omni sem UIA: sonda descartável no scratchpad (login + comandos por arquivo:
    clique do SO, teclas, captura), sem tocar no repositório.
  - OS cujo comportamento depende de configuração (ex.: 635 "Mensagens lidas" 0/1/2): Esquema do Cenário com
    um exemplo por valor, troca pela tela (nunca pelo banco), conferência no banco do valor gravado, step final
    que devolve o original e `After` com prazo próprio que tenta devolver se o exemplo falhar no meio.
  - 'Connection shutdown' do `node-firebird` (isc_att_shutdown) = o servidor encerrou a conexão única da execução;
    sem reconexão a consulta seguinte ficava presa e o `After` estourava o prazo com a regra trocada.
    `conexao.js` descarta a conexão e anexa de novo.
- **Pesagem monitorada e pré-condições do 2.3 (2026-11-06)**:
  - A 445 é **por computador** (`CONFIG_0433.ID_COMPUTADOR` = `MachineGuid` do Windows): máquina nova ganha a linha com
    COM BALANÇA na 1ª abertura da 433. O `Before` `@pesagem` confere isso e o processo padrão (`tests/support/banco/baixa.js`).
  - Por item: código + Enter (carrega o lote, foco em "Qtde. pesada"), Enter (foco em "Registrar Peso"), Enter (registra).
    O app leva mais de 0,5 s para carregar o lote: com 500 ms entre teclas a sequência se perdia (2º a 4º itens sem
    peso); 1,5/1,5/2,5 s pesou os 8. A pesagem parcial fica gravada na receita (reabrir a 433 mostra os já pesados).
  - Cada pesagem consome o lote mesmo sem concluir a baixa (o 1004813 caiu 8,77 por tentativa).
  - "Baixa registrada" por pixel: ler UMA vez logo depois do clique pegou a tela redesenhando (Não=9, Sim=7) com a baixa
    já registrada; ler de novo até ficar inequívoco (`aguardarBaixaRegistrada`). Calibração dos rádios vale na VM.
  - Itens e estoque vêm do banco: os itens do `ATENDIMENTO_A3` (a cápsula muda com o cálculo) e o saldo de um lote
    liberado no estoque de baixa (`ATENDIMENTO_A2.CODIGO_ESTOQUE_BAIXA`, lote do principal), antes de abrir a 433.
- **Baixa e estoque na 433 (2026-10-29, `2.3`)**:
  - A baixa é registrada quando o processo grava: registrar o processo na 145 **antes** de abrir a 433 já deixava "Baixa registrada: Sim" com a hora do 1º processo (o `Registrar baixa` do fim caía em "baixa já registrada"). Ordem certa: `Registrar baixa` na 145 → pesagem → `Registrar processo` + `Registrar baixa` dentro da 433.
  - Cada baixa **consome estoque real do lote** (1004866, lote `140125.14143`: 8,7713 por baixa). Sem saldo a Pesagem monitorada não conclui e a janela não fecha: `registrarPesoDosItens` devolve `false`. Antes de rodar o 2.3, conferir o saldo; a reposição é decisão do operador (dado do banco, nunca pelo teste).
  - Checkpoint sem asserção deixa passar erro: o 2.3 já "passou" com um "Atenção" sem resposta e o terminal na frente do app. Terminar passos de baixa com `listarDialogosAbertos()` vazio, e não clicar no terminal durante a execução.
  - "Baixa registrada" (Não/Sim) da 433 não tem UIA: `BaixaPage.baixaRegistrada()` lê por pixel (3x3 em (1032,164) = Não e (1079,164) = Sim; marcada = 9 pixels com soma R+G+B < 400, desmarcada = 0, calibrado em capturas 1366x768). O 2.3 exige Não ao abrir a 433 e Sim no fim. A Pesagem monitorada que não fecha em 20 s falha com mensagem e captura `pesagem-nao-fechou` (causa mais provável: lote sem saldo).
- **Gravador de sessão (`npm run gravar`): lições da calibração e do piloto (2026-10-28).**
  - A classe da tela tem zeros à esquerda e sufixos (`TfMOV_0145`; filhas `TfMOV_0145_UC`, `TfMOV_0433_0` = tela 445, `TfMOV_0433_1` = Pesagem monitorada): o número se normaliza para `145`; filhas com sufixo não trazem número (o título traz `[ 445 ]`).
  - Legenda de controle de OUTRO processo só sai por `WM_GETTEXT` com timeout (`GetWindowText` volta vazio). Nunca ler legenda de Edit/Memo/Combo (devolve o conteúdo digitado, inclusive senha) nem de janela sob `Login`.
  - A legenda Win32 traz o atalho do Delphi (`&Gravar`); o `Name` do UIA vem sem ele (`Gravar`): seletor usa a forma sem `&`.
  - `Esc`, `Enter`, `Tab` e `Backspace` voltam de `ToUnicodeEx` como caractere de controle: são tecla, não texto. Usar `ToUnicodeEx` só com a flag `0x4`, senão o acento (tecla morta) do operador some no app.
  - O PowerShell do gravador roda com `-File`, não por stdin (`-Command -`): o host disputa o stdin com o leitor de comandos e nunca fica pronto.
  - `npm run gravar` pelo `!` do Claude Code não dá stdin ao prompt de anotação do checkpoint: rodar em terminal próprio, ou anotar conversando.
  - UIA na 145 é seguro (validado ao vivo); 433, 445 e Pesagem monitorada ficam só com Win32 até prova em contrário.
  - `npm run gravar` em segundo plano pelo agente (2026-10-29) funcionou: sem stdin as anotações são puladas, mas os atalhos globais `Ctrl+Alt+C`/`Ctrl+Alt+E` seguem valendo (12 checkpoints, 226 eventos, saída 0, trace e `summary.md` completos). Cada checkpoint fica sem anotação: o operador diz no chat o que validar. Menu e menu de contexto vêm como classe `#32768` sem legenda; o caminho se deduz pela tela aberta depois.
  - O estilo `ES_PASSWORD` (0x20) **não** distingue senha nos `TJPsEdit` do PS01: Usuário e Senha do Login reportam o mesmo bit (medido ao vivo em 2026-10-28). Só o título da janela (`Login`) protege; um diálogo de senha com outro título gravaria a digitação em claro. Não usar `ES_PASSWORD` como critério (descartaria o texto de todos os campos).
  - AltGr chega ao hook como LControl + RMenu: os atalhos do gravador usam o Alt esquerdo e a conversão de caractere liga Ctrl+Alt no `ToUnicodeEx`; sem isso, `°` (AltGr+E no ABNT2) encerrava a gravação.
  - Hook global: o `WM_QUIT` só chega se a thread já tem fila de mensagens (`PeekMessage` antes de sinalizar "pronto"), e `Encerrar` espera o hook existir; senão um stdin fechado durante a compilação do C# deixa `powershell.exe` órfão com hooks ativos (reproduzido com o script rodando com `< /dev/null`).
- **Estoque e NF-e (2026-10-29, `3.estoque`)**:
  - `clicarFisico` reativa a janela principal a cada clique e ela **cobre janelas filhas de topo** (a "Importar NF-e - XML" sumiu atrás da 218): dentro da filha usar `clicarFisicoNaJanelaDeTopo(titulo, x, y)`.
  - Item de `TJPsComboBox` (lista `ComboLBox`) às vezes não pega o clique: confirmar o resultado por pixel e repetir a seleção (`MovimentacaoEstoquePage.escolherConferencia`); sem isso o `Processar` rodou como Transferência.
  - Na 218: **sempre `Limpar` antes de carregar a nota** (operador, 2026-10-29); com rascunho o app pergunta "Ao limpar os registros serão excluídos! Confirma?" (`Sim`, mesmo layout do "Atenção"), e `Importação manual` é marcada ANTES de `Importar XML` (como na gravação).
  - A janela "Importar NF-e - XML" **guarda Origem/Localização/Lançamento/Natureza entre execuções**: preencher só o campo vazio (a descrição ao lado aparece em x ~ 546; conferir por pixel ali, não em x=700). Redigitar o código num campo já preenchido vira `7171` e o app limpa o campo. Códigos conferidos no banco (2026-10-29): origem 71 = AFRICA, 3 = BRASIL, natureza 108 = NOTA COMPLEMENTAR. O duplo clique para "Relacionar produtos" é no ITEM 1 (a janela avança sozinha em cada `Incluir/ Alterar`); no item 2 o app recusa. Campo numérico da janela já vem com a quantidade do XML: apagar com End + Backspace antes de digitar (Home+Shift+End não seleciona; senão vira `33.000`).
  - A 218 **guarda a NF-e em andamento**: reabrir traz a nota carregada e esconde `Importar XML`; uma rodada que falha deixa o rascunho para a próxima. "Operação cancelada! Verifique se todos os lotes estão conferidos" e "Unidade sem relacionamento" são recusas do app, não falha de seletor (`ROADMAP.md` §5 P1-05).
  - Cada rodada do 3.1 cria um lote novo (100) e a importação cria uma compra: efeito real e sem desfazer pela UI.
## 5. Ferramentas de exploração `[R-TOOLS]`

Scripts ad hoc (fora da suíte de testes, `node scripts/<nome>.mjs`) usados
para conhecer o app antes de escrever teste — não reinventar na mão:

| Ferramenta | Uso |
|---|---|
| `scripts/explore.mjs <num1> <num2> ...` | loga, navega até cada tela pelo número digitado no campo do canto inferior direito, dumpa `getPageSource()` + screenshot em `tests/fixtures/screen-inventory/` |
| `scripts/summarizeScreen.mjs <arquivo.xml>` | resume um dump bruto (50-300 KB) numa lista curta de controles interessantes — ler isso em vez do XML inteiro |
| `scripts/crawlMenu.mjs [menu...]` | mapeia a árvore inteira de um ou mais menus de topo (nomes + hierarquia), sem abrir as telas-folha; salva `tests/fixtures/menu-map/<menu>.json` |
| `scripts/catalogScreens.mjs [arquivo-de-paths.json]` | abre cada tela-folha de uma lista de caminhos de menu, extrai número+título da janela nova, screenshot, fecha; salva incremental em `tests/fixtures/screen-catalog.jsonl` (resumível, pula o que já tem sucesso) |
| `scripts/catalogIconMenus.mjs [menu...]` | mesma ideia do anterior, mas pra itens "estilo ícone" (sem `Name`) — seleciona por `AutomationId` |
| `scripts/_exploreShared.mjs` | helpers compartilhados pelos scripts acima (login, anexo de janela, `pressKey`, dump) — não duplicar essa lógica num script novo |
| `scripts/recordSession.mjs` (`npm run gravar`) | **gravador de sessão guiada**: anota cliques, texto digitado e checkpoints (`Ctrl+Alt+C`; `Ctrl+Alt+E` encerra) do operador no app, em `tests/reports/recordings/<rótulo>/` (`trace.jsonl` + `shots/` + `summary.md`); só Win32, UIA apenas nas telas de `--uia-telas` (padrão 145); não grava teclas na janela de Login |
| `scripts/summarizeRecording.mjs` (`npm run gravar:resumo -- <pasta>`) | resume uma gravação em Markdown curto — ler isso em vez do `trace.jsonl`; ignora linha truncada por queda |
| `scripts/_recorderNative.mjs` + `_recorderHook.cs` | captura nativa do gravador (PowerShell dedicado com C# 5 embutido, hooks globais de mouse/teclado); `_recorderLogic.mjs` tem a lógica pura, testada por `npm run recorder:test` |

Todos os scripts acima têm resiliência a sessão morta embutida (`[R-RESIL]`,
ver lição em §4) e progresso incremental — usar como referência ao escrever
um novo script de exploração/lote, não reinventar o padrão do zero.

## 8. Relatórios de execução `[R-REL]`

`wdio.conf.js` grava, por execução, 3 saídas em paralelo dentro de
`tests/reports/<sessionLabel>/` (`sessionLabel` já vem no padrão brasileiro
`<label>-DD-MM-AAAA_HH-mm-ss-SSS`, ver `tests/support/sessionLabel.js`):

| Saída | Reporter/mecanismo | Formato | Consumida por |
|---|---|---|---|
| `wdio-*-json-reporter.json` | `@wdio/json-reporter` | JSON interno do WDIO (durações, retries) | debug manual, não alimenta os relatórios abaixo |
| `cucumber-report.json` | `cucumberOpts.format: ['json:...']` (formatter nativo do `@cucumber/cucumber`, repassado pelo `@wdio/cucumber-framework`) | cucumber-json clássico (array de features/elements/steps, com `match.location` = arquivo:linha do step) | `npm run report:html` |
| `allure-results/*.json` | reporter `allure` (`@wdio/allure-reporter`) | formato bruto do Allure | `npm run report:allure:generate` |

**Sem política de exclusão, de propósito**: nenhum script acima apaga ou
sobrescreve saída de execução anterior. `allure-results/` é uma pasta única
**compartilhada entre todas as execuções** (não por `sessionLabel`) — é assim
que o Allure constrói histórico/tendência entre rodadas; por isso
`report:allure:generate` roda **sem** `--clean`. Já o HTML consolidado
(`report:html`) gera uma pasta nova a cada chamada, nomeada com o mesmo
padrão brasileiro, em `tests/reports/html-reports/<timestamp>/` — relatórios
antigos nunca são removidos automaticamente.

- **Geração automática ao fim do `npm test`** (pedido do usuário,
  2026-10-09): `wdio.conf.js` chama `generateHtmlReport()` (função exportada
  de `scripts/generateHtmlReport.mjs`) no hook `onComplete` — dispara uma
  única vez, no processo launcher, depois que **todos** os workers
  terminaram (nunca por worker/feature). Filtra deterministicamente pelo
  `sessionLabel` exato da execução que acabou de rodar (não "mais recente
  por mtime" — isso é só o fallback do CLI pra quando não se sabe o rótulo).
  Erro na geração do HTML é só logado (`console.error`), nunca derruba o
  exit code da suíte — `npm test` reporta falha de teste, não falha de
  relatório. `npm run report:html` continua existindo pra regenerar sob
  demanda (ex.: com `--all` pra ver tendência, ou filtrando por outra sessão
  antiga). Allure continua manual de propósito (depende de Java, que pode
  faltar na máquina).
- **Tradução pt-BR do HTML** (pedido do usuário, 2026-10-09): a lib
  `multiple-cucumber-html-reporter` **não tem nenhuma opção pública de
  idioma/locale** (confirmado na interface `Options` de `dist/types.d.ts` —
  `durationColumnTitle` existe só no tipo interno `Suite`, é recalculado a
  partir de `durationAggregation` e sobrescreve qualquer valor passado em
  `generate()`, então não adianta tentar passar essa chave). Todo o texto
  fixo da UI (headings, legendas/labels de gráfico, botões, mensagens de
  modal) vem embutido em inglês nos templates `.liquid` e nos scripts `.js`
  da própria lib. Solução: `scripts/report-i18n-pt-br.js`, carregado via
  `customScript` (hook oficial — copiado pra `assets/js/<nome>` e incluído
  como `<script>` por último em toda página, nunca toca em `node_modules`).
  Estratégia: dicionário de igualdade exata (texto do nó inteiro já trimado)
  pra rótulos fixos + um punhado de padrões ancorados (`^...$`) pra texto
  composto com número dinâmico (ex.: `"9 Passed"`, `"Showing 1 to 10 of 23
  entries"`) — nunca substring solta no meio de texto livre, pra não
  arriscar substituir por engano uma palavra que apareça dentro do nome de
  um Cenário real (todo o conteúdo de verdade — nome de
  Funcionalidade/Cenário/step/tag — já vem em português, vem direto do
  `.feature`). Como boa parte do "chrome" é **re-renderizado em JS depois da
  carga inicial** (tabela de funcionalidades/cenários ao paginar/buscar,
  gráficos ApexCharts ao trocar tema claro/escuro, modal de anexo ao abrir
  screenshot/log/erro), uma tradução de passada única não bastava — o script
  também registra um `MutationObserver` em `document.body`
  (desconecta/reconecta a cada rodada pra não entrar em loop com a própria
  escrita) que reaplica o dicionário a cada mutação. **Achado ao validar**:
  a legenda "pelada" do gráfico (`"Passed"` sem número, quando
  `displayChartPercentages` está desligado) só existia no dicionário na
  forma composta (`"9 Passed"`) — faltava a entrada isolada
  (`"Passed"` → `"Aprovados"` etc.), por isso a legenda ficava em inglês
  mesmo com o resto da página traduzido; corrigido adicionando as 6 palavras
  de status também como entrada "pelada" no dicionário de igualdade exata.
  **Validação sem navegador real** (não há Puppeteer/Playwright/jsdom no
  projeto): Edge headless já vem instalado no Windows —
  `msedge.exe --headless=new --disable-gpu --virtual-time-budget=5000
  --dump-dom "file:///<caminho>/index.html"` renderiza a página (JS
  incluso) e imprime o DOM final no stdout, dá pra conferir com `grep`/script
  Node se alguma string em inglês sobrou. Mata os processos `msedge.exe`
  levantados ao terminar (`taskkill /IM msedge.exe /F`) — não é o
  `[R-PROC]` de `PS01.exe`/Appium, mas é processo próprio que não deve
  sobrar entre turnos.
- `npm run report:html` — `scripts/generateHtmlReport.mjs`: varre
  recursivamente `tests/reports/**/cucumber-report.json` (a lib
  `multiple-cucumber-html-reporter` só lê diretório plano), copia pra uma
  pasta temporária e gera o HTML final numa pasta nova
  (`tests/reports/html-reports/<timestamp da geração>/` — nunca sobrescreve
  nem apaga HTML anterior). **Seleção de quais execuções entram** (pedido do
  usuário, 2026-10-09 — antes era sempre o histórico inteiro acumulado, o
  que confundia "pasta nova a cada chamada" com "relatório isolado daquele
  teste"): por padrão, **só a execução mais recente** (maior mtime de
  arquivo, não o nome da pasta — o `sessionLabel` em formato brasileiro
  DD-MM-AAAA não ordena como string). `npm run report:html -- <trecho>`
  filtra por sessão específica (ex.: `-- local-09-10-2026_12-29`, casa por
  substring do caminho); `npm run report:html -- --all` restaura o
  comportamento antigo (histórico inteiro, útil pra ver tendência entre
  execuções). Filtro sem nenhuma correspondência lista as sessões
  disponíveis em vez de gerar um HTML vazio silenciosamente.
- **Print de cada etapa** (pedido do operador, 2026-11-06): `tests/support/printPorEtapa.js` (em
  `cucumberOpts.require`) tem um `AfterStep` que tira a captura do **SO** (nunca a do driver: ela
  consulta a UIA e fecha as telas do Omni), recortada pela união das janelas visíveis do PS01 e
  limitada à tela, e a anexa ao step (`this.attach(png, 'image/png')`). O HTML mostra um item
  "Print da etapa N" em "Anexos" de cada step, que abre a imagem num modal (rótulo traduzido por
  padrão ancorado em `report-i18n-pt-br.js`). Falha na captura só gera `console.warn`, nunca
  derruba o step. `PRINT_POR_ETAPA=0` desliga. Medido no 2.1: tempo igual (1m28/1m29), 10 prints e
  ~3,4 MB por cenário no cucumber-json, dos quais ~1,4 MB em cada um dos 2 steps de Login (a tela
  de Login do app é uma foto em tela cheia); os demais ficam em 30-110 KB.
- **Evidência no meio do step** (operador, 2026-11-06, `0.1`): o print por etapa sai DEPOIS do step, então
  uma tela aberta e fechada no mesmo step (a 635 gravada) não aparecia no HTML; o checkpoint só ia para
  `checkpoints/`. `registrarEvidencia(this, nome)` (`checkpoint.js`) captura pelo SO e anexa na hora:
  texto "Evidência: <nome>" + a imagem. O reporter lista as imagens do step antes dos logs, na ordem
  anexada; `report-i18n-pt-br.js` (`rotularEvidencias`) dá à i-ésima imagem o nome da i-ésima evidência,
  esconde o log e chama a imagem restante de "Print do fim da etapa". Checkpoint que é evidência de
  asserção usa `registrarEvidencia`; o HTML gerado ANTES de mudar o script fica com os rótulos antigos.
- **Antivírus (AMSI) bloqueia JPEG na captura** (2026-11-06): o script PowerShell de captura de
  tela com `ImageCodecInfo`/`EncoderParameter` de JPEG foi barrado como "conteúdo mal-intencionado"
  e o PowerShell persistente travou até o timeout (sobrou `powershell.exe` órfão). Ficar no PNG
  padrão do `Bitmap.Save`; não tentar contornar o antivírus.
- `npm run report:allure:generate` — requer **Java (JRE) instalado e no
  PATH/`JAVA_HOME`** nesta máquina; sem Java, falha com
  `JAVA_HOME is not set`. Isso é dependência do `allure-commandline`
  (ferramenta Java por baixo), não algo resolvível só com `npm install`.
- `npm run report:allure:open` — abre o relatório estático já gerado (mesma
  dependência de Java).
- **Achado (2026-10-08)**: `useCucumberStepReporter: true` no reporter
  `allure`, combinado com este app (sessão reatachada/`reloadSession()` no
  meio do cenário — ver `[R-ISOL]`), gera avisos
  `could not update/stop test result: no test with uuid ... is found` no
  console e um registro extra "fantasma" (`stage: "pending"`, sem `status`)
  por cenário — não chega a quebrar a geração do relatório, mas é ruído.
  `useCucumberStepReporter: false` produz os mesmos dados sem os avisos
  (ainda sobra o registro fantasma, cosmético, ignorar). Configuração atual
  é `false` de propósito — não trocar sem reconfirmar que o bug upstream foi
  corrigido.

## 9. Coleta de falha persistida `[R-FALHA]`

**Ordem de consulta ao diagnosticar: ver `[R-EVID]` (§1)** — este tópico só
descreve o que é gravado, não repete a ordem de leitura.

Paridade com `cypress-pharmacie-web` (`cypress/support/errorHandler.js` +
artefatos do `afterEach`, ver seu `AGENTS.md` §5 `[R-ERR]`), adaptada ao
vocabulário de UI Automation. `tests/support/failureArtifacts.js`,
disparado pelo `afterScenario` de `wdio.conf.js` quando `result.error`
existe, grava em `tests/reports/<sessionLabel>/`:

| Arquivo | Papel | Equivalente no Cypress |
|---|---|---|
| `<título>.png` | screenshot da janela no momento da falha | `cy.screenshot()` do `afterEach` |
| `<título>.uia-tree.xml` | dump completo da árvore UI Automation ativa | `last-failure-dom.html` |
| `failures.jsonl` | 1 linha JSON por falha, **append-only** (toda falha da rodada) | `failures.json`/`failures.log` |
| `last-failure.json` / `last-failure.log` | **sobrescritos** a cada falha — acesso rápido à última, sem precisar abrir o JSONL inteiro | `last-failure.json`/`last-failure.log` |
| `atencoes.jsonl` | **toda** janela de topo respondida (`responderJanelaDeTopo`), passando ou não: hora, janela, botão e a mensagem lida antes do clique (também no console `[Atenção] botão "Sim": ...`). Mais as linhas `inesperado: true` da **vigia** (`iniciarVigiaDeDialogos`, consulta Win32 a cada 1 s): diálogo aberto há mais de 6 s sem o teste responder, com captura do SO `atencao-inesperada` em `checkpoints/` (o texto está na captura; lê-lo exigiria UIA). Nasceu de um "baixa já registrada" relatado pelo operador (2026-10-29) | — |

Cada registro carrega `category`/`discovered`/`message` (via `classifyError`,
§2 — `discovered: true` = categoria auto-descoberta, ainda não revisada) e
`uiaTreeBytes` + `uiaTreeSuspect`. **Achado (2026-10-08)**: dumps reais
capturados na exploração (`tests/fixtures/screen-inventory/`) nunca saíram
abaixo de ~17 KB, mesmo pra janela principal sozinha — um dump de falha
abaixo de `SUSPICIOUSLY_SMALL_UIA_TREE_BYTES` (3000 bytes, heurística a
recalibrar se gerar falso positivo/negativo) provavelmente veio da janela
errada ou vazia (sessão presa no lugar errado), não deve ser usado sozinho
pra diagnosticar causa de elemento ausente — equivalente ao check de
"`last-failure-dom.html` < 5 KB" do projeto irmão.

Sem tarefa de limpeza de artefatos de falha (diferente do `limparLogsFalha`
do Cypress): cada execução já ganha seu próprio `sessionLabel` novo (timestamp
BR, `tests/support/sessionLabel.js`), então não há acúmulo dentro da mesma
pasta entre rodadas distintas — zero resíduo cruzado já vem de graça da
convenção de nomes, não precisa de um `before` dedicado a apagar nada.

## 10. CI self-hosted `[R-CI]`

**Decisão (2026-10-08, pedido do usuário)**: `.github/workflows/tests.yml`
roda em runner **self-hosted** nesta VM, nunca em `windows-latest`
hospedado pela GitHub. Motivo: `PS01.exe` precisa de conectividade de rede
real com o Firebird 2.5 — um runner hospedado não alcança esse banco (está
fora do escopo de qualquer VPN/túnel que a GitHub ofereça por padrão), além
de exigir reinstalar o app do zero a cada execução (sem instalador leve
disponível). A VM já resolve isso: mesma rede do Firebird, app e driver já
instalados.

- **Label do runner**: `[self-hosted, Windows, sisps-vm]` — se renomear a VM
  ou criar uma 2ª, manter a label `sisps-vm` só pra esta instância; uma nova
  VM usa uma label própria (nunca reaproveitar a mesma label pra 2
  runners diferentes rodando sessões de desktop distintas, quebraria a
  premissa do `concurrency` abaixo).
- **`concurrency: { group: ..., cancel-in-progress: false }` é regra dura,
  não cosmético**: 1 única sessão de desktop física nesta VM — uma 2ª
  execução simultânea roubaria mouse/teclado da 1ª no meio do teste (mesma
  causa-raiz do `maxInstances: 1` do `wdio.conf.js`, ver §4). Enfileirar,
  nunca cancelar a execução em andamento pra rodar a nova.
- **`env.local.json` não é entregue pelo checkout** (gitignorado) — precisa
  existir manualmente na pasta de trabalho do runner
  (`_work/desktop-appium-delphi-suite/desktop-appium-delphi-suite/`), separada do
  clone manual usado pra explorar o app. O workflow falha cedo e explícito
  (passo "Conferir credenciais da VM") se o arquivo não existir, em vez de
  deixar o `wdio` falhar depois com uma categoria de erro confusa.
- **Registro do runner em si é ação de infraestrutura, não só código**:
  instala/roda um serviço Windows persistente vinculado à conta do GitHub do
  usuário — nunca executar sem confirmação explícita dele antes, mesmo que
  o workflow YAML já esteja pronto. Comando de registro usa
  `gh api -X POST repos/:owner/:repo/actions/runners/registration-token`
  (token de 1 hora) + o instalador oficial do GitHub Actions runner.
- Pendência de infraestrutura (registro do runner em si, cópia do
  `env.local.json` pro `_work`) rastreada em `ROADMAP.md` §2/§5 `P1-01`
  (CI).
- **Suíte `4.calculo` lê o Firebird** (2026-11-05): o runner precisa da **VPN Corporativa ligada** e
  da chave `banco` no `env.local.json` do `_work` (além de `testData.clienteId` e
  `testData.calculo.prescritorSemAcrescimo/ComAcrescimo`); sem isso os cenários falham cedo com
  `falha_de_acesso_ao_banco`. `credentials.usuario` é o funcionário **só da suíte** (indexa a
  `ATENDIMENTO_CALC1`; um funcionário usado por outro sistema vira `interferencia_na_tabela_de_trabalho`). A execução padrão exclui `@bug` (`cucumberOpts.tags`).
- **Lição (2026-11-05, `node-firebird`)**: a constante `ISOLATION_READ_COMMITTED_READ_ONLY` usa
  no_rec_version + wait e ficou presa na transação que o PS01 deixa aberta (046 na tela depois do
  cálculo); consultas simultâneas na mesma conexão travam o protocolo. Ler sempre com
  `rec_version` + `nowait`, em fila e com prazo (`tests/support/banco/conexao.js`).
