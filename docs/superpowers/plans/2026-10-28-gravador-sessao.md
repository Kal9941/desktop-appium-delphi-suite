# Gravador de sessão guiada — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gravar o que o operador faz no PS01 (cliques, digitação, checkpoints) para o agente transformar a gravação num `Cenário` Cucumber, com o fluxo receita 145 → baixa 433 como piloto.

**Architecture:** Um PowerShell dedicado com C# embutido instala hooks globais de mouse e teclado e emite eventos (JSON em Base64, um por linha) para o Node. O Node aplica as regras (privacidade, UIA por tela segura), grava `trace.jsonl` em modo append e gera um resumo para o agente ler. A lógica sem E/S fica em módulo puro, testado com `node --test`.

**Tech Stack:** Node 24 (ESM, `.mjs`), PowerShell 5.1 + C# 5 via `Add-Type`, `node:test`. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-10-28-gravador-sessao-design.md`

## Global Constraints

- Nenhuma dependência nova em `package.json` (dependência nativa foi recusada no projeto).
- Comentários e documentação em **português do Brasil** (`[R-COMENT]`).
- O C# embutido compila com o `csc` do PowerShell 5.1: **sintaxe C# 5** (sem `?.`, sem `$"..."`, sem `nameof`, sem membros com corpo de expressão).
- Todo texto que sai do PowerShell vai como **Base64 de UTF-8**, uma linha por evento, para não corromper acentos (lição de `AGENTS.md` §4).
- O callback do hook só faz Win32 barato (`WindowFromPoint`, `GetClassName`, `GetWindowText`, `GetWindowRect`) e enfileira; UIA, captura de tela e E/S rodam fora dele.
- Só eventos cujo processo é `app.processName` (`PS01.exe`) saem do PowerShell. Teclas com a janela em foco intitulada `Login` **nunca** saem do PowerShell.
- UIA só quando o nº da tela está na lista segura (padrão `145`); `AutomationId` nunca é gravado como seletor.
- Atalhos: `Ctrl+Alt+C` (checkpoint) e `Ctrl+Alt+E` (encerrar), consumidos pelo hook; as letras são configuráveis.
- Gravações em `tests/reports/recordings/<rótulo>/` (ignorado pelo git); nada é escrito fora dali.
- `[R-PROC]`: ao fim de toda tarefa que sobe processo, `tasklist` sem `PS01.exe`, `node` ou `powershell.exe` residual do gravador.
- Commit só com autorização do operador, pela skill `pre-commit`, em branch nova `feat/gravador-sessao`, sem `Co-Authored-By` (`AGENTS.md` §11.3). A árvore já tem alterações não commitadas de outro trabalho (resumos dos manuais): **não** misturar no commit do gravador.
- Arquivos de `.agents/` têm CRLF: nunca usar `sed -i` (o MSYS remove os CRs); editar com `Edit` de linha única ou PowerShell.

## Review Focus

Entradas que a spec implica mas que nenhuma tarefa exercitaria sem teste explícito, da mais provável para a menos:
1. Texto com acentos e `ç` digitado pelo operador deve sair íntegro no `texto` agrupado → teste na Tarefa 1.
2. Gravação vazia (operador encerra sem fazer nada) não pode quebrar o resumo → Tarefa 1.
3. Queda no meio da gravação deixa a última linha do `trace.jsonl` truncada; o resumo deve ignorá-la e avisar → Tarefa 1.
4. Evento sem nº de tela e sem legenda (controle owner-drawn) deve aparecer no resumo, não derrubá-lo → Tarefa 1.
5. Iniciar o gravador com o PS01 fechado deve falhar com mensagem clara **antes** de instalar hooks → Tarefa 1 (`ps01EmExecucao`) e Tarefa 3.

---

### Task 1: Lógica pura (`_recorderLogic.mjs`)

**Files:**
- Create: `scripts/_recorderLogic.mjs`
- Test: `scripts/_recorderLogic.test.mjs`
- Modify: `package.json` (scripts: `"recorder:test": "node --test scripts/_recorderLogic.test.mjs"`)

**Interfaces:**
- Produces (tipos usados nas tarefas 3 e 4):
  - `type Janela = { classe: string, titulo: string, retangulo: { esquerda: number, topo: number, direita: number, base: number } }`
  - `type EventoTecla = { seq: number, t: number, tipo: 'tecla', tecla: { nome: string, caractere: string | null, modificadores: string[] }, janela: string }`
  - `export const TITULOS_SEM_TECLAS: string[]` = `['Login']`
  - `export function extrairNumeroTela(classe: string): string | null` — `Tf<MÓDULO>_<nº>` → `'145'`; sem número (`TfUTI_PES`) ou outra classe → `null`.
  - `export function telaPermiteUia(numeroTela: string | null, telasSeguras: string[]): boolean`
  - `export function agruparTeclas(eventos: EventoTecla[], opcoes?: { lacunaMs?: number }): object[]` — `lacunaMs` padrão `1500`.
  - `export function calcularAvisos(entrada: { alvo: { classe: string, titulo: string }, uiaPulado: boolean }): string[]`
  - `export function lerTrace(texto: string): { eventos: object[], linhasInvalidas: number }`
  - `export function montarResumo(eventos: object[]): string`
  - `export function ps01EmExecucao(saidaTasklist: string, nomeProcesso: string): boolean`

- [ ] **Step 1: Escrever os testes que falham** (`node:test` + `node:assert/strict`), um `test()` por linha:
  - `extrairNumeroTela('TfSIS_145') === '145'`; `extrairNumeroTela('TfUTI_PES') === null`; `extrairNumeroTela('TBitBtn') === null`.
  - `telaPermiteUia('145', ['145']) === true`; `telaPermiteUia('433', ['145']) === false`; `telaPermiteUia(null, ['145']) === false`.
  - `agruparTeclas`: três `tecla` imprimíveis seguidas (`'a'`,`'b'`,`'c'`, mesma `janela`, lacuna < 1500) viram um evento `{ tipo: 'texto', texto: 'abc', seq: <do primeiro>, t: <do primeiro> }`; uma `Enter` no meio fecha o grupo e passa como `tecla`; lacuna de 2000 ms abre grupo novo; modificador `ctrl` ou `alt` nunca entra no grupo; **`'ç'`, `'ã'`, `'é'` saem íntegros** em `texto` (Review Focus 1).
  - `calcularAvisos({ alvo: { classe: 'TBitBtn', titulo: '' }, uiaPulado: true })` contém `'sem-legenda'` e `'uia-pulado-tela-nao-segura'`; `{ classe: 'TStringGrid', titulo: '' }` contém `'owner-drawn'`; `{ classe: 'TBitBtn', titulo: 'Gravar' }` com `uiaPulado: false` devolve `[]`.
  - `lerTrace('{"seq":1}\n{"seq":2}\n{"seq":')` devolve 2 eventos e `linhasInvalidas === 1` (Review Focus 3); texto vazio devolve `{ eventos: [], linhasInvalidas: 0 }`.
  - `montarResumo([])` contém `Gravação vazia` (Review Focus 2).
  - `montarResumo` com eventos de duas telas: tem um título `## Tela 145` e outro `## Tela 433`; um clique `{ alvo: { classe: 'TBitBtn', titulo: 'Gravar' } }` aparece como `"Gravar" (TBitBtn)`; um `texto` aparece como `digitou "..."`; um checkpoint seguido de `nota` com `ref` igual ao `seq` do checkpoint mostra `**CHECKPOINT**` e o texto da nota; um clique com `tela.numero === null` e `alvo.titulo === ''` aparece sob `## Tela sem número` com `sem legenda (TStringGrid)` e as coordenadas relativas (Review Focus 4).
  - `ps01EmExecucao('PS01.exe    1234 Console', 'PS01.exe') === true`; `ps01EmExecucao('INFORMAÇÕES: nenhuma tarefa em execução', 'PS01.exe') === false` (Review Focus 5).

- [ ] **Step 2: Rodar e ver falhar**
  Run: `npm run recorder:test` · Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar `scripts/_recorderLogic.mjs`** com as assinaturas acima. Abordagem: `extrairNumeroTela` por regex `/^Tf[A-Za-z0-9]+_(\d{1,4})$/`; `owner-drawn` = `titulo === ''` e classe casando `/grid/i` (heurística a refinar na Tarefa 5); `lerTrace` faz `JSON.parse` por linha e conta as que falham; `montarResumo` agrupa eventos consecutivos pela `tela.numero` e anexa notas ao checkpoint pelo `ref`.

- [ ] **Step 4: Rodar e ver passar**
  Run: `npm run recorder:test` · Expected: PASS, 0 falhas.

- [ ] **Step 5: Checkpoint de commit** (só com autorização do operador, skill `pre-commit`): `test(gravador): lógica pura do gravador de sessão`.

---

### Task 2: Captura nativa (`_recorderNative.mjs`)

**Files:**
- Create: `scripts/_recorderNative.mjs`

**Interfaces:**
- Consumes: `TITULOS_SEM_TECLAS` de `scripts/_recorderLogic.mjs` (Tarefa 1).
- Produces:
  - `export function iniciarGravadorNativo(opcoes: { nomeProcesso: string, pastaShots: string, atrasoShotMs?: number, teclaCheckpoint?: string, teclaEncerrar?: string }): GravadorNativo` (`atrasoShotMs` padrão `400`; teclas padrão `'C'` e `'E'`).
  - `type GravadorNativo = { eventos: AsyncIterable<EventoBruto>, pedirUia(seq: number, x: number, y: number): Promise<UiaInfo | null>, parar(): Promise<void> }`
  - `type EventoBruto = { seq: number, t: number, tipo: 'clique' | 'duplo' | 'direito' | 'tecla' | 'checkpoint' | 'encerrar', x?: number, y?: number, rx?: number, ry?: number, alvo?: Janela, cadeia?: Janela[], janelaTopo?: { classe: string, titulo: string }, foco: { titulo: string, handle: string }, tecla?: { nome: string, caractere: string | null, modificadores: string[] }, shot: string | null }`
  - `type UiaInfo = { name: string, className: string, controlType: string, path: string }`

Contrato do processo PowerShell (o implementador escreve o C#): `powershell.exe -NoProfile -NonInteractive -Command -`; sobe a thread do hook (`WH_MOUSE_LL` + `WH_KEYBOARD_LL`, laço `GetMessage`); filtra por nome de processo da janela (clique) ou da janela em foco (tecla); descarta teclas com título em foco ∈ `TITULOS_SEM_TECLAS`; detecta `duplo` com `GetDoubleClickTime`; resolve `alvo`/`cadeia` **no callback**, antes do app tratar o clique; consome `Ctrl+Alt+<letra>` devolvendo `1` ao Windows (keydown e keyup); salva `shots/NNNN.png` (união dos retângulos das janelas visíveis do PS01) `atrasoShotMs` depois, para cliques, `Enter`, `Esc`, teclas de função e checkpoints; saída = uma linha por evento, Base64 de UTF-8 de JSON; entrada = linhas `uia <seq> <x> <y>` (responde com um evento `{ "tipo": "uia", "seq": <seq>, "uia": {...} | null }` usando `System.Windows.Automation.AutomationElement.FromPoint`) e `fim` (drena capturas pendentes e sai).

- [ ] **Step 1: Implementar `iniciarGravadorNativo`** conforme o contrato. Padrão a seguir: o de `tests/support/windowsNative.js` (processo PowerShell + `Add-Type`, Base64). `pedirUia` resolve `null` após 1000 ms sem resposta. `parar()` envia `fim`, aguarda a saída e, se passar de 5 s, mata o processo. Se o PowerShell morrer fora de `parar()`, o iterador `eventos` **lança** `Error('PowerShell do gravador encerrou inesperadamente')`.

- [ ] **Step 2: Verificação de fumaça** (substitui teste de unidade; a parte nativa não é testável por unidade). Com o PS01 aberto e logado, rodar `node -e "import('./scripts/_recorderNative.mjs').then(async m => { const g = m.iniciarGravadorNativo({ nomeProcesso: 'PS01.exe', pastaShots: 'tests/reports/recordings/_fumaca/shots' }); setTimeout(() => g.parar(), 20000); for await (const e of g.eventos) console.log(e.tipo, e.alvo && e.alvo.classe, e.alvo && e.alvo.titulo) })"` e, nos 20 s, clicar num botão do PS01 e pressionar `Ctrl+Alt+C`.
  Expected: uma linha `clique TBitBtn <legenda>` (ou classe equivalente) e uma `checkpoint`; o PS01 **não** abriu atalho com `Ctrl+Alt+C`; existe pelo menos um `NNNN.png` em `_fumaca/shots`; o comando termina sozinho.

- [ ] **Step 3: Conferir `[R-PROC]`**: `tasklist` sem `powershell.exe` do gravador; apagar `tests/reports/recordings/_fumaca/`.

- [ ] **Step 4: Checkpoint de commit** (com autorização): `feat(gravador): captura nativa de mouse e teclado do PS01`.

---

### Task 3: CLI de gravação (`recordSession.mjs`)

**Files:**
- Create: `scripts/recordSession.mjs`
- Modify: `package.json` (script `"gravar": "node scripts/recordSession.mjs"`)

**Interfaces:**
- Consumes: de `_recorderLogic.mjs` — `extrairNumeroTela`, `telaPermiteUia`, `agruparTeclas`, `calcularAvisos`, `montarResumo`, `ps01EmExecucao`; de `_recorderNative.mjs` — `iniciarGravadorNativo`; de `tests/support/sessionLabel.js` — `formatBrazilianTimestamp`; de `tests/support/loadEnv.js` — `loadEnv`.
- Produces: pasta `tests/reports/recordings/<rótulo>/` com `trace.jsonl`, `shots/` e `summary.md`. Opções: `--nome=<texto>` (rótulo = `<texto>-<timestamp BR>`, padrão `piloto`), `--uia-telas=145,007` (padrão `145`), `--tecla-checkpoint=C`, `--tecla-encerrar=E`. Códigos de saída: `0` ok, `1` PS01 fechado, `2` PowerShell do gravador morreu.

- [ ] **Step 1: Falha rápida com o PS01 fechado.** Antes de qualquer hook, rodar `tasklist` (`execFileSync`), passar a saída a `ps01EmExecucao`; se `false`, imprimir "Abra o PS01 e faça login antes de gravar" e sair com `1`.
  Run (PS01 fechado): `npm run gravar` · Expected: a mensagem acima, código de saída `1`, nenhum `powershell.exe` novo.

- [ ] **Step 2: Laço de gravação.** Para cada `EventoBruto`: montar a linha do trace (campos da spec §6) com `tela = { numero: <primeiro extrairNumeroTela casando ao subir da cadeia>, titulo: janelaTopo.titulo }`; se `telaPermiteUia`, `await pedirUia(seq, x, y)`, senão registrar `uiaPulado`; `avisos = calcularAvisos(...)`; `appendFileSync` + flush imediato a cada linha. Eventos `tecla` viram `EventoTecla` (com `janela = foco.handle`), entram num buffer e saem via `agruparTeclas` quando chega um evento que não é tecla ou no encerramento. `checkpoint` imprime "checkpoint #N gravado" no terminal; `encerrar` sai do laço. Cada clique imprime uma linha curta no terminal.

- [ ] **Step 3: Anotação final.** Para cada checkpoint, mostrar o caminho da captura e perguntar "O que validar aqui? (Enter pula)" com `node:readline/promises`; gravar um evento `{ tipo: 'nota', ref: <seq do checkpoint>, texto }`. Depois escrever `summary.md` com `montarResumo(lerTrace(...).eventos)`.

- [ ] **Step 4: Encerramento seguro.** `try/finally` (e tratamento de `SIGINT`) chama `parar()` do gravador; se o iterador lançar o erro de PowerShell morto, imprimir o erro, preservar o que já foi gravado e sair com `2`.

- [ ] **Step 5: Verificação.** Com o PS01 aberto: `npm run gravar -- --nome=teste`, clicar em dois lugares, `Ctrl+Alt+C`, `Ctrl+Alt+E`, responder à pergunta.
  Expected: `trace.jsonl` com os cliques, um `checkpoint` e uma `nota`; `summary.md` presente; `tasklist` sem `powershell.exe` do gravador; apagar a pasta `teste-*`.

- [ ] **Step 6: Checkpoint de commit** (com autorização): `feat(gravador): CLI de gravação guiada com checkpoints`.

---

### Task 4: Resumo sob demanda (`summarizeRecording.mjs`)

**Files:**
- Create: `scripts/summarizeRecording.mjs`
- Modify: `package.json` (script `"gravar:resumo": "node scripts/summarizeRecording.mjs"`)

**Interfaces:**
- Consumes: `lerTrace`, `montarResumo` de `_recorderLogic.mjs`.
- Produces: CLI `node scripts/summarizeRecording.mjs <pasta-da-gravação>` que imprime o resumo no stdout; se `linhasInvalidas > 0`, acrescenta "N linha(s) do trace ignorada(s) (gravação interrompida?)".

- [ ] **Step 1: Implementar o CLI** (leitura do `trace.jsonl` da pasta dada, sem E/S além disso).
- [ ] **Step 2: Verificar** com a gravação feita na Tarefa 3 antes de apagá-la, e com um `trace.jsonl` de 2 linhas válidas + 1 truncada criado à mão.
  Run: `npm run gravar:resumo -- <pasta>` · Expected: resumo em Markdown; no caso truncado, o aviso de 1 linha ignorada e código de saída `0`.
- [ ] **Step 3: Checkpoint de commit** (com autorização): `feat(gravador): resumo de gravação para o agente`.

---

### Task 5: Gravação de calibração (com o operador)

**Files:** nenhum arquivo versionado; ajustes que a calibração exigir voltam para as Tarefas 1–3.

- [ ] **Step 1:** `tasklist` limpo (`[R-PROC]`); abrir o PS01 sem fazer login; `npm run gravar -- --nome=calibracao`.
- [ ] **Step 2: O operador executa esta sequência exata:** (1) digitar `xxxx` no campo Usuário da tela de Login; (2) fazer login normalmente; (3) clicar no menu `Cadastros`; (4) `Esc`; (5) digitar `145` no campo do canto inferior direito e `Enter`; (6) `Ctrl+Alt+C`; (7) `Ctrl+Alt+E`.
- [ ] **Step 3: Conferir `trace.jsonl` e `shots/`.** Aprovado quando: o texto `xxxx` e a senha **não** aparecem em nenhuma linha; há um clique em `Cadastros`; há um `texto` `145` seguido de `tecla Enter` com `tela.numero === '145'`; há um `checkpoint`; cada clique tem `shot` existente; os atalhos não abriram nada no PS01.
- [ ] **Step 4:** corrigir o que falhar (heurística `owner-drawn`, atraso da captura, letras de atalho que colidam) e repetir os Steps 1–3 até passar.

---

### Task 6: Gravação do piloto 145 → 433 (com o operador)

**Files:** nenhum arquivo versionado (gravação em `tests/reports/recordings/`).

- [ ] **Step 1: Pré-condições:** ambiente de homologação; operador **122** (tem processo padrão na tela 007); `[R-PROC]` limpo.
- [ ] **Step 2:** `npm run gravar -- --nome=piloto-145-433`. O operador cria a receita na 145, a conclui, usa "Registrar processo" e "Registrar baixa" até a 433. Abrir as telas pelo campo de número. Checkpoints sugeridos: receita gravada; receita concluída; "Baixa registrada: Sim" na 433. Encerrar com `Ctrl+Alt+E` e anotar cada checkpoint.
- [ ] **Step 3:** `npm run gravar:resumo -- <pasta>` e conferir que o resumo mostra as telas 145 e 433 em ordem, cada checkpoint com sua nota e os controles sem legenda sinalizados.

---

### Task 7: Cenário a partir da gravação

> **ADIADA (operador, 2026-10-28): fase de mapeamento.** A gravação do piloto serve, por ora, só para aumentar o conhecimento do agente (registrado em `.agents/`); nenhum `Cenário` é escrito até o operador pedir. Pagamento, quando entrar, só `Dinheiro`. O que validar em cada checkpoint o operador informa depois. As precondições e dados do piloto estão em `PROJECT_CONTEXT.md` § "Piloto 145 a 433".

**Files:**
- Create: `tests/features/2.receita.feature`, `tests/steps-definitions/2.receita.steps.js`, Page Objects em `tests/pages/` (nomes definidos pelas telas gravadas)
- Modify: `env.json` (só placeholders vazios em `testData` para os dados da receita) — valores reais em `env.local.json`, que **não** se edita nem versiona

**Interfaces:**
- Consumes: a gravação da Tarefa 6; os helpers `launchAndAttachToLogin`/`proceedPastLoginToMainWindow` de `tests/support/appLifecycle.js`; `[R-NOME]` (`2.1` em diante), `[R-POM]`, `[R-AAA]`, `[R-ANTIFALSO]`.

- [ ] **Step 0 (`[R-GRAVACAO]`, `AGENTS.md` §0):** antes de escrever qualquer coisa, descrever ao operador, em passos numerados e na ordem, exatamente o que ele fez na gravação (tela a tela: cliques com legenda, textos digitados, checkpoints e anotações), marcando o que é inferência; incorporar as correções dele. Não bloqueia: segue para o Step 1 enquanto ele confere.
- [ ] **Step 1:** ler o resumo e as capturas dos checkpoints; listar os dados usados (cliente, prescritor, produtos) e levá-los para `testData` em `env.json` (vazios) e `env.local.json` (valores do operador); nada fixo no código.
- [ ] **Step 2:** `grep -n "@wip\|@skip" tests/features/*.feature` (`[R-WIP]`).
- [ ] **Step 3:** escrever o `Cenário` com as asserções dos checkpoints (receita concluída; "Baixa registrada: Sim" na 433). Cada seletor validado por inspeção ao vivo e confirmado após reiniciar o processo (`[R-SEL]`); passos só de coordenada (grid owner-drawn, MDI) comentados como frágeis. Não usar UIA na 433 (`[R-RISCO]` e spec §5).
- [ ] **Step 4: Validar isolado 2x** (`[R-RUN-ISO]`): `npx wdio run wdio.conf.js --spec tests/features/2.receita.feature --cucumberOpts.name="<trecho do título, sem ponto>"`, duas vezes. Expected: 2 passes (cada execução cria uma receita nova em homologação).
- [ ] **Step 5:** respiro de 10–15 s e rodar o arquivo inteiro; depois a suíte (`npm test`) para provar que nada ao redor quebrou. `tasklist` limpo.
- [ ] **Step 6: Checkpoint de commit** (com autorização): `test(receita): cenário 145 até baixa 433 a partir de gravação guiada`.

---

### Task 8: Sincronização de documentação (`[R-SYNC]`)

**Files:**
- Modify: `.agents/AGENTS.md` (§5 `[R-TOOLS]`: linhas de `recordSession.mjs`, `summarizeRecording.mjs`, `_recorderNative.mjs`, `_recorderLogic.mjs`), `.agents/PROJECT_CONTEXT.md` (achados do piloto; §12.0/§12.1 com o `Cenário` novo e o `L:` conferido por Grep), `.agents/ROADMAP.md` (§1 contagem de `Cenário`s; §4.2), `.agents/HISTORICO.md` (§1 e §2), `README.md` (seção "Cobertura Atual de Testes" e uma linha sobre `npm run gravar`).

- [ ] **Step 1:** atualizar cada arquivo acima respeitando CRLF (ver Global Constraints).
- [ ] **Step 2:** `npm run docs:lint` · Expected: `✅ docs:lint OK`.
- [ ] **Step 3:** `tasklist` sem `PS01.exe`, `node` ou `powershell.exe` residual.
- [ ] **Step 4:** rodapé obrigatório do turno (`AGENTS.md` §7): specs tocados, nenhum `@wip`/`@skip` pendente, processos limpos.
