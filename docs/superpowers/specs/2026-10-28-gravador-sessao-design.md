# Gravador de sessão guiada — design

> **Data:** 2026-10-28 · **Status:** aguardando revisão do operador · **Piloto:** receita (tela 145) até baixa de fórmulas (tela 433)
> Convenções do projeto (`.agents/AGENTS.md`) valem integralmente: `[R-SEL]`, `[R-RISCO]`, `[R-PROC]`, `[R-RESIL]`, `[R-RUN-ISO]`, `[R-COMENT]` (comentários em pt-BR).

## 1. Objetivo e critério de sucesso

Em fluxos de negócio que atravessam várias telas, o operador faz o fluxo **uma vez** no PS01 enquanto um gravador anota cada ação.
Depois, a partir dessa gravação, o agente escreve o `Cenário` Cucumber, os steps e os Page Objects.

**Sucesso do piloto:**
1. O operador percorre receita 145 até baixa 433 com o gravador ligado e obtém uma gravação legível.
2. Um `Cenário` gerado a partir dela passa **2x isolado** (`[R-RUN-ISO]`), com cada seletor validado ao vivo (`[R-SEL]`).
3. Nenhum `PS01.exe`, `node` ou `powershell.exe` residual ao fim (`[R-PROC]`).

## 2. Decisões já tomadas

| Tema | Decisão | Origem |
|---|---|---|
| Ambiente do piloto | **Banco de homologação**; pode criar massa nova a cada execução | operador, 2026-10-28 |
| Limpeza da massa | **Fora da v1**: as receitas criadas ficam no banco de homologação | decorre da decisão acima; reavaliar com o P2-04 |
| O que "reproduzir" significa | `Cenário` Cucumber escrito pelo agente a partir da gravação; **não** há replay mecânico por coordenadas na v1 | proposta aceita |
| Dependência nativa | **Nenhuma** (recusada antes, ver comentário de `windowsNative.js`) | histórico do projeto |
| Estado do banco como checkpoint | **Fora da v1**: o guia de acesso ao banco não existe nesta máquina | exploração |

## 3. Fora do escopo (YAGNI)

- Replay mecânico da gravação e geração automática de `.feature`.
- Checkpoint com consulta ao Firebird.
- Gravar fora do `PS01.exe`, pausar/retomar, narração por voz.
- Execução simultânea com testes Appium (a sessão de desktop é única, ver `[R-ISOL]`/`maxInstances: 1`).

## 4. Arquitetura

Quatro arquivos, cada um com um papel só e interfaces estreitas. Nenhum toca na suíte de testes.

| Arquivo | Papel | Depende de |
|---|---|---|
| `scripts/_recorderNative.mjs` | Sobe um PowerShell **dedicado** com C# embutido (`Add-Type`) que instala os hooks globais de mouse e teclado, resolve a janela sob o cursor via Win32 e captura a tela. Expõe um iterador de eventos já decodificados. | `node:child_process` |
| `scripts/_recorderLogic.mjs` | Funções **puras**: extrair nº da tela da classe, agrupar teclas em texto digitado, montar o resumo. Sem E/S. | nada |
| `scripts/recordSession.mjs` | CLI: acha o `PS01.exe`, liga o gravador, aplica as regras de privacidade e de UIA, grava `trace.jsonl` e as capturas, conduz a anotação final dos checkpoints. | os dois acima, `loadEnv` |
| `scripts/summarizeRecording.mjs` | Lê uma gravação e imprime um resumo curto para o agente (mesmo papel de `summarizeScreen.mjs`). | `_recorderLogic.mjs` |

O PowerShell do gravador é **separado** do persistente de `windowsNative.js`: o hook precisa de uma thread com laço de mensagens, e não deve disputar a fila de comandos com o polling de janelas.

## 5. Captura

**Hooks:** `WH_MOUSE_LL` e `WH_KEYBOARD_LL` numa thread própria com laço de mensagens. O callback só faz o mínimo, porque hook de baixo nível tem tempo limite e atrasar o callback trava o mouse do operador:
- no clique (botão para baixo): `WindowFromPoint`, `GetAncestor`, `GetClassName`, `GetWindowText`, `GetWindowRect`. São chamadas de microssegundos e **precisam** rodar aqui, antes de o app processar o clique, para registrar o estado de antes;
- tudo o mais (captura de tela, UIA, escrita) vai para uma fila e é tratado fora do callback.

**Filtro:** só entram eventos cujo processo da janela é o `PS01.exe` (`app.processName`). Cliques e teclas em qualquer outra janela são descartados na origem.

**Captura de tela:** `CopyFromScreen` do retângulo que une todas as janelas visíveis do `PS01.exe`, ~400 ms **depois** da ação, para mostrar o estado resultante (o estado de antes está na cadeia de janelas). Nunca a tela inteira.

**UIA (opt-in por tela):** `AutomationElement.FromPoint` só quando o nº da tela do evento está na lista segura. Padrão: `145`. Qualquer outra tela (inclusive a 433, MDI cujo comportamento sob UIA é desconhecido) fica só com Win32 e coordenadas até ser comprovada segura. Ampliar a lista é uma opção de linha de comando (`--uia-telas=145,007`), nunca automática. Fundamento: a 278 e o Omni/418 se fecham com qualquer chamada UIA (`AGENTS.md` §4).

**Nº da tela:** extraído da classe de janela `Tf<MÓDULO>_<nº>` (ex.: `TfUTI_PES`). Quando a classe não tiver número, grava `null`; o agente resolve pela legenda e pelas capturas.

## 6. Formato da gravação

Pasta `tests/reports/recordings/<rótulo>/` (já ignorada pelo git; o rótulo segue `sessionLabel`):

```text
trace.jsonl      uma linha JSON por evento, append-only (nunca sobrescreve)
shots/NNNN.png   captura posterior à ação
summary.md       gerado por summarizeRecording.mjs
```

Cada linha de `trace.jsonl`:

| Campo | Conteúdo |
|---|---|
| `seq`, `t` | ordem e milissegundos desde o início |
| `tipo` | `clique`, `duplo`, `direito`, `texto`, `tecla`, `janela`, `checkpoint`, `nota` |
| `x`, `y` | coordenada absoluta; `rx`, `ry` relativas à janela alvo |
| `alvo` | `{ classe, titulo, retangulo }` do controle sob o cursor |
| `cadeia` | ancestrais do controle até a janela de topo, cada um com `{ classe, titulo, retangulo }` |
| `tela` | nº extraído da classe (ou `null`) e título da janela de topo |
| `uia` | `{ name, className, controlType, path }` quando permitido; `AutomationId` **não** é gravado como seletor (é instável, `[R-SEL]`) |
| `texto` | para `texto`: o conteúdo agrupado; para `tecla`: nome da tecla e modificadores |
| `shot` | caminho relativo da captura |
| `avisos` | `uia-pulado-tela-nao-segura`, `sem-legenda`, `owner-drawn` (só coordenada) |

## 7. Checkpoints e anotação

- **`Ctrl+Alt+C`**: marca um checkpoint (captura de tela, e UIA se a tela for segura).
- **`Ctrl+Alt+E`**: encerra a gravação.
- As duas combinações são **consumidas pelo hook** (o app não as recebe), para não disparar atalho do PS01.
- Ao encerrar, o terminal lista cada checkpoint com o caminho da captura e pergunta "o que validar aqui?". A resposta vira um evento `nota` na gravação. Enter pula.
- Sem anotação, o agente pergunta ao operador pelo número do checkpoint ao escrever o teste.

## 8. Privacidade e segurança

- Teclas **não** são gravadas enquanto a janela em foco for a de título `Login` (Win32 puro, sem UIA). O fluxo gravado começa depois do login; o teste faz o login com `env.local.json`.
- Eventos fora do `PS01.exe` nunca chegam ao arquivo.
- A gravação mora em `tests/reports/`, ignorada pelo git, e **não** é versionada. O que vai para o repositório é o teste gerado e a documentação.
- `[R-RISCO]` vale para o operador durante a gravação: o gravador **observa**, não clica. O que o operador clica em homologação, inclusive "Registrar processo" e "Registrar baixa", é decisão dele.

## 9. Resiliência (`[R-RESIL]`)

- Cada evento é gravado e descarregado (`flush`) assim que chega: uma queda no meio preserva tudo até ali.
- Se o PowerShell do gravador morrer, o script avisa em voz alta, fecha o que foi gravado e sai com código diferente de zero; não reinicia sozinho (reiniciar perderia o estado do laço de mensagens sem o operador saber).
- Encerramento (`Ctrl+Alt+E`, `Ctrl+C`, erro) sempre desinstala os hooks e mata o PowerShell dedicado (`finally`), para não sobrar `powershell.exe` (`[R-PROC]`).
- Se o disco falhar na escrita, o erro sobe; nada de engolir.

## 10. Verificação do próprio gravador

- **Lógica pura** (`_recorderLogic.mjs`): testes com o executor nativo do Node (`node --test`), sem dependência nova. Cobrem extração do nº da tela, agrupamento de teclas em texto, e o resumo a partir de uma gravação de exemplo. Script npm `recorder:test`.
- **Parte nativa:** não é testável por unidade. Validada por uma **gravação de calibração**: 6 ações conhecidas na tela de login/principal, conferidas contra `trace.jsonl` e `shots/`. Só depois disso o piloto.
- **Piloto:** critério de sucesso da seção 1.

## 11. Do piloto ao teste

1. O operador grava o fluxo 145 → 433, com checkpoints nas confirmações que importam (por exemplo, receita concluída; "Baixa registrada: Sim" na 433).
2. O agente roda `summarizeRecording.mjs`, lê o resumo e as capturas dos checkpoints.
3. O agente escreve o `.feature` (provisoriamente `2.receita.feature`, grupo novo por `[R-NOME]`), os steps e os Page Objects; os dados usados (cliente, prescritor, produtos) vão para `testData` em `env.local.json`, **nunca** fixos no código.
4. Cada seletor é validado ao vivo (`[R-SEL]`); trechos que só têm coordenada (grids owner-drawn, telas MDI) são marcados como frágeis no código e na documentação.
5. O `Cenário` roda **2x isolado**; só depois o arquivo inteiro e a suíte.

**Pré-condições conhecidas do fluxo** (do contexto do projeto): "Registrar processo" exige receita **concluída** e processo padrão do funcionário (tela 007, aba "Processo produção"; o funcionário 122 já tem); receita com baixa registrada não pode ser recalculada nem regravada, então cada execução cria receita nova.

## 12. Riscos e pontos em aberto

| Risco | Tratamento |
|---|---|
| UIA fechar a 433 (comportamento desconhecido) | 433 fica fora da lista segura; só Win32 e coordenadas |
| Menus nativos: o clique no item vira `#32768` sem legenda | O operador abre telas pelo campo de número (texto digitado identifica a tela); cliques de menu ficam como coordenada + captura |
| Grids owner-drawn só dão coordenada | Marcados `owner-drawn` no trace; o teste usa toque por coordenada, como já feito na 145 |
| Atraso do callback do hook travar o mouse | Callback mínimo, resto em fila (seção 5) |
| Massa acumulando em homologação | Aceito pelo operador; reavaliar com o P2-04 |
| Teclado: atalhos do PS01 usam teclas de função | Atalhos do gravador usam `Ctrl+Alt+<letra>`, combinação improvável no app; configuráveis se colidirem |

## 13. Sincronização de documentação (na entrega)

- `AGENTS.md` §5 `[R-TOOLS]`: linhas dos scripts novos.
- `PROJECT_CONTEXT.md`: achados do piloto (telas 145/433 observadas, seletores) e inventário de `Cenário` (§12).
- `ROADMAP.md`: item de backlog, se sobrar trabalho; §4.2 enquanto não houver commit.
- `HISTORICO.md` §1/§2.
