# PROJECT_CONTEXT.md — Arquitetura e contratos do sistema

> O que existe. Fonte única para arquitetura/stack/contratos. Regras de
> escrita de teste ficam em `AGENTS.md`; status/backlog em `ROADMAP.md`.
> **§10, §11 e §12 são consultados sob demanda** (Grep por número de tela,
> nome de menu/feature ou nome de teste) — nunca lidos inteiros no início de
> sessão; só os índices (§10.0/§12.0) são lidos de início, quando existirem.
> **Atualizado:** 2026-10-21 · Histórico de validações e entregas: `HISTORICO.md`.
> **Como ler:** quente até `<!-- fim-quente -->` (Stack, Particularidades do app, Estrutura, `env.json`) mais os índices `[QUENTE]` §10.0 e §12.0; o resto é frio, aberto sob demanda pelo **Mapa** abaixo. Numeração preservada (seções sem número abrem por `Grep '^## <título>'`).

## Mapa de leitura sob demanda
> **Quente** = Stack, Particularidades do app sob teste, Estrutura de diretórios, `env.json` + §10.0 e §12.0 (índices, `[QUENTE]`). **Frio** = demais seções; abrir por `Grep` (número de tela, nome de menu, nome de `Cenário`, tema).

| Seção (frio) | O que responde | Ler quando |
|---|---|---|
| Decisões do doc de referência inicial (removido) | status das 8 decisões herdadas do doc de referência (runner de CI, driver, `AutomationId`, isolamento, paralelismo, versão do app) | dúvida sobre o que já foi decidido/resolvido; antes de propor mudança em CI, isolamento ou paralelismo |
| Primeiro teste validado | fluxo ponta a ponta do login (`launchAndAttachToLogin` → `proceedPastLoginToMainWindow` → status bar) | ao escrever o `Given`/`When` de um cenário novo que precise logar |
| Logout | clique por coordenada no botão Logout e reanexo à tela de Login | `Cenário` com Logout, saída ou retorno à tela de Login |
| Botão "Sair" NÃO reproduz o aviso de reconexão | hipótese descartada e causa real do diálogo "Atenção: usuário já conectado" | `Cenário` com "Sair", "Fechar o sistema?" ou aviso de reconexão |
| Teclado virtual na tela de Login | janela do teclado, `addValue`, propagação por campo focado e mascaramento da senha | `Cenário` com teclado virtual ou que precise asserir campo de senha |
| Login com usuário/senha inválidos | o que o app faz ao rejeitar credencial; armadilha da janela principal desabilitada | `Cenário` de login inválido; ao provar "login bem-sucedido" |
| Inventário de telas por número (+ Mecanismo de navegação, Resumo por tela) | abrir tela por número, `ClassName` `Tf<MÓDULO>_<nº>`, fechar a tela, grids owner-drawn, seletores das 7 telas exploradas | **antes de escrever** `Cenário` que abra tela por número (145/046/032/007/112/018/418 ou outra) |
| §10.1+ Mapa de navegação do menu | árvore de cada menu (nativo × "estilo ícone") | navegar por menu; achar o caminho de um item |
| §11 / §11.1 Catálogo de telas | número + descrição das telas-folha (245 nativas + 22 "estilo ícone") | descobrir o número de uma tela; antes de testar uma tela específica |
| §12.1+ Inventário de `Cenário`s | cada `Cenário` com `L:` e o que valida | duplicidade antes de criar; achar `Cenário` pelo nome/número |
| Manuais do sistema (`docs/Manuais - OmniCare/`) | 54 manuais PDF indexados por tela, convenções de UI, dependências entre telas, ações de risco, oráculos numéricos e erros dos manuais; resumos em `docs/manuais-resumo/` | **antes de escrever** `Cenário` de uma funcionalidade de negócio (cadastro, caixa, comissão, baixa, rastreabilidade, rótulo, NF-e…) ou ao explorar tela nova: `Grep` do número da tela no índice |
| Piloto 145 a 433 gravado (2026-10-28) | fluxo real receita até a baixa, dados usados, **precondição** (tela 445 "SEM BALANÇA"), mensagens do sistema, classes e nomes UIA observados | antes de escrever/alterar `Cenário` da 145, 433, "Registrar processo/baixa" ou pesagem monitorada |
| Cálculo da receita na 145: motor, regras e massa (2026-11-05) | procedure `MOV_ATENDIMENTO_CALC1`, conversão de unidades, fator (ficha/lote/laudo, `FATORCALCULO`, `_UC`), preço, densidade, perda, cápsula/excipiente/embalagem, taxa técnica, índice e valor mínimo da forma, massa por caso e totais medidos | **antes de escrever/alterar** `Cenário` que confira valor ou quantidade de fórmula; ao escolher produto de teste para um fator; ao investigar total divergente na 145 |
| Reposição de estoque (112/216/425) e importação de NF-e (218/132) gravadas (2026-10-29) | como repor saldo de lote (entrada pela 216, conferência pela 425), saldo do lote do 2.3, importar NF-e e relacionar produtos, compra 261000007 | antes de rodar o 2.3 (saldo do lote); antes de escrever/alterar `Cenário` de estoque, lote, conferência ou NF-e de compra |

---

## Stack

- **Driver:** Appium 2.x/3.x com driver oficial `windows` (sucessor do
  WinAppDriver standalone) — já instalado globalmente (`appium@3.8.0`,
  `windows@6.3.0`). Decisão #2 da tabela "Decisões do doc de referência
  inicial" **resolvida**.
- **Runner:** WebdriverIO 10 (`@wdio/cli`, `@wdio/local-runner`,
  `@wdio/appium-service`), framework **Cucumber** (`@wdio/cucumber-framework`
  + `@cucumber/cucumber`) — Gherkin em português (`# language: pt`).
  **Nota:** o pacote pedido originalmente,
  `@badeball/cypress-cucumber-preprocessor`, é específico do Cypress (se
  pluga no preprocessor dele) e não roda em projeto WebdriverIO/Appium;
  substituído pelo equivalente nativo do WDIO, mesma sintaxe Gherkin.
- **App sob teste:** `C:\Apps\ERPDesktop\app.exe` (processo `app.exe`), caminho
  configurado em `env.json` (`app.executablePath`).
- **Rede:** o app fala REST **apenas** para geração de link de pagamento
  (`tests/services/PaymentLinkService.js`). Todo o restante do domínio é
  **Firebird 2.5 direto** — fora do escopo de teste automatizado por enquanto
  (decisão explícita do usuário, 2026-10-07). Não existe, portanto, camada de
  Strategy de Mocks equivalente ao `BaseMock.js` do Cypress: não há rede para
  interceptar na maior parte do app.
- **Isolamento de estado:** processo novo por teste — decisão #4 de §4
  **resolvida** (mais lento, hermético por padrão, sem exigir "modo de teste"
  no app). Implementado via `killProcessByName` (hard-kill, `taskkill /F`) no
  `beforeScenario` global de `wdio.conf.js` seguido de `spawnApp` dentro do
  próprio step `Given` (`tests/support/appLifecycle.js`) — **não** é um
  `driver.reloadSession()` simples, ver "Particularidades do app sob teste"
  abaixo.

## Particularidades do app sob teste (validadas por inspeção real, 2026-10-07)

Achados que mudam a arquitetura do framework em relação ao que §3/§4 do
documento de referência assumia como genérico — confirmados rodando o app de
verdade com WinAppDriver, não deduzidos:

- **`AutomationId` é instável neste app.** É um app Delphi/VCL (`ClassName`
  como `TPanel`/`TJPsEdit`/`TBitBtn`, `FrameworkId=Win32`) que não expõe
  `AutomationProperties.AutomationId`; o driver `windows` cai para o handle
  interno do controle como `AutomationId`, que **muda a cada execução**
  (confirmado: mesmo campo mudou de `527192` para `2624284` entre duas
  aberturas do processo). Decisão #3 de §4: **resolvida como "não usar"**,
  não como "levantar inventário versionado" — `scripts/scanElements.js`
  continua esqueleto porque o inventário em si não serviria de nada aqui.
  Seletor real: `ClassName` + posição via XPath para campos sem rótulo
  (`(//Edit[@ClassName="TJPsEdit"])[n]`), e `Name` (estável — vem do
  `Caption`/`Hint` do componente Delphi) quando o elemento tem um.
- **A tela de login é uma janela de topo SEPARADA da janela principal, não
  filha dela.** Uma sessão Appium presa à janela principal (`appium:app`
  aponta pro processo, mas o UI Automation raiz fica numa janela `TApplication`
  de 0x0, desabilitada, "blocked by modal") não enxerga os controles de login
  via `getSource()` — e `findElement` nessa sessão casa com controles
  *errados* de mesmo `ClassName` em outro lugar da árvore, não com os campos
  de login. É preciso descobrir o handle da janela de topo real via Win32
  nativo (`tests/support/windowsNative.js`, `EnumWindows`/`GetWindowRect` via
  PowerShell) e anexar a sessão a ela com a capability
  `appium:appTopLevelWindow` (`tests/support/appLifecycle.js`). O mesmo vale
  para a transição login → tela principal: é outra janela de topo, exige
  outro re-anexo (`driver.reloadSession(...)`).
- **Diálogo "Atenção: usuário já está conectado ao banco de dados"** aparece
  quando o Firebird ainda julga o usuário conectado de uma execução anterior
  que foi encerrada com hard-kill (`taskkill /F` não dá chance do app
  encerrar a sessão no banco de forma limpa). Ele pode aparecer **a qualquer
  momento** entre o clique em "Conectar" e a tela principal — inclusive
  **sobreposto à tela principal já visível** (ainda "desconectada"), não só
  antes dela. `proceedPastLoginToMainWindow` (`tests/support/appLifecycle.js`)
  trata isso com um único loop de poll que prioriza o diálogo sobre a tela
  principal e faz um "settle" (reconfere após ~1s) antes de aceitar a tela
  principal como definitiva.
- **Encoding**: títulos de janela acentuados ("Soluções", "Atenção") saem
  corrompidos (mojibake) quando capturados via `execFileSync('powershell.exe',
  ...)`, mesmo pedindo `encoding: 'utf-8'` do lado do Node — o codepage do
  processo filho interfere no meio do caminho. Corrigido fazendo o script
  PowerShell devolver a saída como Base64 de bytes UTF-8 (Base64 é ASCII puro,
  não corrompe) — ver `tests/support/windowsNative.js`.

## Estrutura de diretórios

```text
desktop-appium-delphi-suite/
├── .agents/                # este arquivo + AGENTS.md + ROADMAP.md + HISTORICO.md + skills/
├── tests/
│   ├── features/            # .feature por domínio, numerados (<grupo>.<índice>)
│   ├── steps-definitions/   # Given/When/Then, mesmo número do .feature
│   ├── pages/               # Page Objects — AutomationId, sem lógica de rede
│   ├── services/            # Service Objects — só PaymentLinkService por ora
│   ├── fixtures/            # massa de dados/configuração curada à mão
│   ├── support/             # sessionLabel, errorHandler, failureArtifacts,
│   │                        # windowsNative (Win32 via PowerShell), appLifecycle
│   └── reports/             # gitignored — falhas/screenshots/dumps por sessão
├── scripts/
│   └── scanElements.js     # inventário de AutomationId — PENDENTE
├── env.json                 # app, credenciais de teste, paymentLinkApi, session
├── README.md                 # visão geral pública do projeto (raiz)
└── wdio.conf.js              # config central, cucumberOpts, services, hooks globais
```

## `env.json`

Único arquivo de configuração de ambiente, versionado (mesmo padrão do
`cypress-enterprise-suite`). Chaves atuais:

- `app.executablePath` / `app.processName` / `app.arguments`
- `credentials.nome` / `credentials.usuario` / `credentials.senha` /
  `credentials.telefone` — placeholders vazios neste arquivo versionado.
  **Nunca commitar credenciais reais aqui**: preencher em `env.local.json`
  (gitignored, mesmo diretório), que `tests/support/loadEnv.js` mescla por
  cima de `env.json` quando presente (merge **profundo**, `deepMerge`: uma
  chave folha do `env.local.json`, mesmo `""`, vence a do `env.json`). Todo
  ponto do código que precisa ler config usa `loadEnv()`, nunca
  `readFileSync('env.json')` direto.
- `paymentLinkApi.baseUrl` / `paymentLinkApi.apiKey` — pendente, ver
  `ROADMAP.md` P2-11; credencial, só no `env.local.json`. Idem `banco.*`.
- `testData.*` (massa: cliente, fornecedor, produto, receita, cálculo) — vai
  **com valor** no `env.json` versionado (operador, 2026-11-06, P2-01).
- `session.defaultLabel` — usado por `tests/support/sessionLabel.js` quando
  `SESSION_LABEL` não é passado por variável de ambiente.

<!-- fim-quente -->

# Seções sob demanda (frio) — abrir pelo Mapa; §10.0 e §12.0 são os únicos blocos quentes abaixo daqui

## Decisões do doc de referência inicial (removido em 2026-10-29)

> Os 8 itens vêm do §4 de `docs/APPIUM_WINDOWS_DESKTOP_FRAMEWORK_REFERENCE.md`, apagado do repositório (recuperável pelo `git log`); esta tabela é a única casa deles.

| # | Decisão | Status |
|---|---|---|
| 1 | Runner de CI | **Pendente** — workflow em `.github/workflows/tests.yml` assume `windows-latest`, não validado em execução real |
| 2 | Driver Appium | **Resolvido** — `windows` driver via `@wdio/appium-service` |
| 3 | AutomationId estável | **Resolvido como "não usar"** — é instável neste app (handle interno, muda a cada execução); seletor real é `ClassName`+posição (XPath) ou `Name`. Ver "Particularidades" acima |
| 4 | Isolamento de estado | **Resolvido** — processo novo por teste (`killProcessByName` + `spawnApp`, não `reloadSession()` simples) |
| 5 | Mocking de rede | **Resolvido parcialmente** — só existe REST para link de pagamento; sem mock definido, Firebird fora de escopo |
| 6 | Paralelismo real | **Pendente, achado real (2026-10-07)**: não é questão de `maxInstances` — WinAppDriver roda na sessão interativa do Windows e assume o mouse/teclado físico do operador. Decisão: isolar em VM (Hyper-V), ver `.agents/ROADMAP.md` item P0 |
| 7 | Artefatos de falha | **Resolvido** — screenshot PNG + `getPageSource()` (XML da árvore UIA) por teste falho, namespaced por `SESSION_LABEL` |
| 8 | Versão do app sob teste | **Pendente** — nenhuma versão/build fixada ainda |

## Primeiro teste validado (2026-10-07)

`1.login.feature` / `1.login.steps.js` rodam de ponta a ponta contra o app
real (não é só compilação/esqueleto) — login com as credenciais de
`env.json`, 3 execuções consecutivas de `npm test` passando. Fluxo real:
`launchAndAttachToLogin` → `LoginPage.login()` → `proceedPastLoginToMainWindow`
(trata "Atenção" se aparecer) → assert no painel de status
(`MainPage.statusBarUsuario`, começa com `"<código> - "` do operador, ex.: `"1 - Fabricio"`;
`contains` com o código 1 casava também com `VER.26.5.1.9` e `Lj: 1`, 2026-11-05).

## Logout (2026-10-09)

**Achado**: botão "Logout" no canto superior direito da barra de ferramentas
da janela principal (ver screenshot `tests/fixtures/menu-probe/
click-AppERP.png`) é **owner-drawn — zero elementos UI Automation** nessa
região (mesmo padrão dos grids de listagem, ver "Grids de listagem" acima).
Nenhum seletor por `Name`/`AutomationId` possível; único caminho é clique por
coordenada com `pointerType: 'touch'` (`'mouse'` falha, ver "Particularidades
do app" acima). Coordenada validada por inspeção ao vivo: clique em `(1268,
62)` (janela principal recém-aberta, 1366x768) reabre a tela de **Login**
limpa (campo usuário vazio) — mesmo app, mesmo processo, só uma nova janela
de topo "Login" enquanto a janela principal antiga continua viva em segundo
plano sem foco (`MainPage.logout()`, `appLifecycle.waitForLogoutReturnToLogin`).
Diferente do caminho de reconexão (`proceedPastLoginToMainWindow`), aqui não
aparece o diálogo "Atenção" — é sessão encerrada de forma limpa no Firebird,
não um hard-kill. `1.login.feature` cenário `1.2` cobre esse fluxo.

**Risco em aberto**: coordenada fixa em pixels — se o tamanho/posição padrão
da janela principal mudar (resolução de tela diferente no runner de CI,
DPI), o clique pode errar o alvo; não testado em resolução diferente de
1366x768 ainda.

## Botão "Sair" NÃO reproduz o aviso de reconexão (investigado e descartado, 2026-10-09)

Hipótese inicial do usuário: sair do app pelo botão "Sair" (mesma barra do
Logout, owner-drawn, mesmo padrão de coordenada) deixaria a sessão presa no
Firebird, reproduzindo o diálogo "Atenção: usuário já está conectado" no
próximo login — **testado ao vivo duas vezes e refutado nas duas**. Achado
real: "Sair" abre um diálogo de confirmação de verdade ("Fechar o sistema?",
janela `TfSIS_MSG` com elementos reais `Name="Sim"`/`Name="Não"` — diferente
do botão em si, que não tem elemento) e, ao confirmar, encerra o processo
(`tasklist` para de listar o PID ~1s depois). Mas o login seguinte vai direto
pra tela principal, **sem** o diálogo de reconexão — ou seja, "Sair" faz uma
desconexão limpa no Firebird antes de matar o processo, equivalente ao
Logout nesse aspecto (só muda o destino: tela de Login vs. processo
encerrado). Código desse caminho (`MainPage.sair`, `confirmSystemExitDialog`,
`waitForAppProcessToExit`) foi implementado, validado e depois **removido**
por decisão do usuário (não haveria cenário de teste pra ele).

**Causa real do aviso de reconexão**: só um encerramento **abrupto** (sem o
app avisar o Firebird antes — `taskkill /F` ou equivalente) deixa a sessão
presa. É exatamente o hard-kill que `launchAndAttachToLogin` já faz no
início de cada "entrar no sistema" (inclusive entre cenários, via
`beforeScenario` do `wdio.conf.js`) — se o processo anterior ainda estava
logado (sessão ativa) no momento do kill, o login seguinte mostra o aviso.
`1.login.feature` cenário `1.3` cobre esse fluxo: login → chega na tela
principal → "entra de novo" (que mata o processo ainda logado e relança) →
assert explícito de que o diálogo de reconexão apareceu E foi confirmado
(`proceedPastLoginToMainWindow` agora retorna `true`/`false` pra isso, em vez
de só tolerar o diálogo em silêncio).

## Teclado virtual na tela de Login (2026-10-09)

**Achado**: ícone de teclado virtual à esquerda do botão "Conectar" (ver
`LoginPage.abrirTecladoVirtual`) é **owner-drawn — zero elementos UI
Automation** nessa região (mesmo padrão do botão Logout). Único caminho é
clique por coordenada `pointerType: 'touch'`, validada por inspeção ao vivo:
`(62, 620)` (janela de Login recém-aberta, 1366x768). Abre uma nova janela de
topo **"Teclado alfanumérico"** (`TfSIS_TECLADO_ALFA`), independente de qual
campo (Usuário/Senha) estava focado antes do clique — hipótese inicial de que
o teclado não abriria com o campo Senha focado foi **testada ao vivo e
refutada** (abriu normalmente nas duas tentativas).

**Estrutura da janela do teclado**: 1 único `Edit` de preview (sem `Name`,
`IsPassword="True"`) onde o texto digitado aparece antes de confirmar; as
teclas em si são owner-drawn (`TPanel` sem `Name`/`AutomationId`, sem
elemento clicável individual — mesmo padrão dos grids de listagem, ver
"Grids de listagem" abaixo) — não dá pra "apertar tecla por tecla" via
seletor, só digitar direto no preview. Só o botão de fechar/confirmar é um
elemento real: `Button[@Name="Button1"]`.

**Achado-armadilha**: `setValue()` no campo de preview falha
(`WebDriverError: An unknown error occurred... /clear`) porque `setValue`
chama `clear()` antes de digitar e esse campo rejeita `clear()` — usar
`addValue()` (só acrescenta, sem limpar antes), ver `TecladoVirtualPage.js`.

**Propagação confirmada**: o texto digitado no preview via `addValue` +
clique em "Button1" propaga de volta pro campo real da tela de Login —
provado digitando o usuário real só pelo teclado virtual e completando o
login com sucesso (chegou na tela principal). `1.login.feature` cenário
`1.4` cobre esse fluxo.

**Risco em aberto**: mesma fragilidade de coordenada fixa em pixels do botão
Logout — não testado em resolução diferente de 1366x768.

**Propagação pro campo Senha confirmada (2026-10-09)**: a mesma mecânica
funciona digitando a SENHA pelo teclado virtual (campo Senha focado antes de
abrir o teclado, em vez do campo Usuário) — texto propaga de volta pro campo
real de Senha da tela de Login, login completo com sucesso. Não é uma
mecânica exclusiva do campo Usuário; o roteamento da propagação segue o
campo que estava com foco no momento em que o teclado foi aberto, não um
campo fixo. `1.login.feature` cenário `1.5` cobre esse fluxo.

**Login 100% pelo teclado virtual (2026-10-09)**: abrir/digitar/confirmar o
teclado duas vezes seguidas na mesma execução (uma pro campo Usuário, outra
pro campo Senha, reanexando a sessão à janela de Login entre uma e outra)
funciona sem nenhum efeito colateral — cada abertura do teclado é uma janela
nova (estado limpo, não herda texto da vez anterior). `1.login.feature`
cenário `1.6` cobre esse fluxo (único cenário que não usa `setValue` nenhum,
só o teclado virtual pros dois campos).

**Mascaramento do preview ao digitar senha (investigado ao vivo, 2026-10-09)**:
o campo de preview tem `IsPassword="True"` **sempre** (mesmo digitando o
usuário, ver achado acima) — mas isso só passou a importar de verdade aqui.
Confirmado por screenshot: ao digitar a senha, o preview mostra só caracteres
`#` (um por caractere digitado, ex.: senha de 12 caracteres → `############`),
nunca o texto em claro. Mais importante pra decisão de teste: **nem
`getPageSource()`/dump XML nem `getAttribute('Value')`/`getText()` expõem o
conteúdo do campo quando `IsPassword="True"`** — os três vêm vazios/`null`,
mesmo com o `#` visível na tela. Ou seja, **não existe caminho programático
(seletor/atributo) pra asserir o mascaramento** — só screenshot (visual),
que esta suíte não compara/faz OCR (fora do escopo das ferramentas de
`[R-TOOLS]`). Decisão: os cenários `1.4`/`1.5`/`1.6` não tentam asserir
mascaramento por atributo (provaria um falso-negativo sempre, já que o
atributo é `null` por padrão do `IsPassword`, não por mascaramento real
detectável); a asserção de valor que prova o fluxo é a propagação completa —
login bem-sucedido com a tela principal.

## Login com usuário/senha inválidos (2026-10-09)

**Achado (investigação ao vivo, script ad hoc removido após confirmar)**:
diferente da hipótese inicial de um diálogo de erro modal, o app **não mostra
nenhuma janela nova nem texto de erro inline** ao rejeitar usuário ou senha
incorretos — confirmado por polling de 15s contra `listVisibleWindowsForProcess`
(nenhum handle novo aparece além do padrão já conhecido). O único efeito
observável é: os campos Usuário/Senha são limpos e o foco volta pro campo
Usuário; a tela de Login continua a mesma (mesmo handle de janela, não
reabre). Por isso os Cenários `1.7`/`1.8` não buscam um diálogo — a prova é
"continua na tela de Login" seguida de um login válido imediato na mesma
sessão/processo, pra provar que o app seguia funcional e a rejeição foi
mesmo da credencial, não de uma falha genérica.

**Achado-armadilha confirmado**: ao tentar logar (válido ou inválido), o app
sempre cria em segundo plano a janela principal "cheia" (`ClassName="TfSIS_PS"`,
título "AppERP - Soluções Inteligentes", maximizada) **desabilitada**
(`IsEnabled="False"`) — ela só fica habilitada/populada quando a credencial é
válida; não é uma janela nova a cada tentativa, é a mesma sendo
habilitada/desabilitada. **Nunca usar só "achei uma janela com esse título e
largura > 500" como prova de login bem-sucedido** sem também confirmar que o
conteúdo populou (`proceedPastLoginToMainWindow` já faz isso corretamente via
`statusBarUsuario`/timeout — mas um teste novo que reimplementasse essa
checagem do zero cairia nessa armadilha).

**Achado**: os campos `TJPsEdit` da tela de Login reportam `IsPassword="True"`
**sempre**, inclusive o campo Usuário — mesmo padrão já confirmado no preview
do teclado virtual (ver "Mascaramento do preview ao digitar senha" abaixo).
Consequência prática: não dá pra assertar "campo foi limpo" lendo
`Value`/`getText()` depois de uma tentativa inválida (vêm vazios/`null`
sempre, independente do conteúdo real) — a única prova disponível é
comportamental (continuar na tela de Login + login válido funcionar logo em
seguida), não por atributo.

## Inventário de telas por número (exploração guiada, 2026-10-08)

O sistema é uma farmácia de manipulados: venda de produtos manipulados e de
alopatia para clientes, com atendimento multicanal. Toda tela do sistema tem
um número de 3 dígitos e pode ser aberta diretamente digitando esse número no
campo no canto inferior direito da janela principal — sem navegar pelo menu.
Script usado para a exploração (ad hoc, fora da suíte de testes):
`scripts/explore.mjs <num1> <num2> ...` — loga, navega por cada número, dumpa
`getPageSource()` + screenshot em `tests/fixtures/screen-inventory/<num>.xml`
e `.png`. `scripts/summarizeScreen.mjs <arquivo.xml>` resume o dump num texto
curto (controles com `Name` e/ou tipos sempre interessantes como
Edit/ComboBox/CheckBox/TabItem), porque os dumps brutos têm 50-130KB cada —
grandes demais pra reler por inteiro toda vez que se precisa de um seletor.

### Mecanismo de navegação por número (achados técnicos)

- **Campo + botão**: dentro da janela principal, único
  `//Edit[@ClassName="TJPsEdit"]` da árvore (sem `Name`) no canto inferior
  direito (`x≈1328, y≈709, 33x12`), com um `//Button[@ClassName="TButton"]`
  logo ao lado (seta, não precisa clicar nele). Fluxo: `click()` no campo →
  `setValue(<número>)` → **Enter**.
- **Enter não funciona via `driver.keys()`/actions API padrão** — o driver
  `windows` recusa com `"Currently key input source type is not supported
  when running 'actions' with method 'POST'"`. Funciona via comando de
  extensão específico do driver: `driver.execute('windows: keys', { actions:
  [{ type: 'keyDown', virtualKeyCode: 0x0d }, { type: 'keyUp', virtualKeyCode:
  0x0d }] })` (`virtualKeyCode`, não `key` — passar `key: 'Enter'` dá erro
  `"Some key action (pause or text or virtualKeyCode) must be defined"`).
- **Toda tela aberta por número é um `<Window>` ANINHADO dentro da janela
  principal (`TfSIS_PS`)** — é MDI de verdade, mesmo quando a tela parece uma
  janela flutuante independente na renderização visual. `getPageSource()` da
  sessão já anexada à janela principal inclui a árvore inteira da tela aberta
  — **nunca precisa reanexar sessão** (`reloadSession`) pra ler/interagir com
  o conteúdo de uma tela aberta por número.
  - **Achado-armadilha**: `listVisibleWindowsForProcess` (enum nativo de
    janelas top-level do Win32) às vezes reporta um SEGUNDO HWND de topo
    pertencente ao mesmo processo logo depois de abrir uma tela pesada (visto
    nas telas 032 e 145 em runs diferentes) — mas esse handle nunca é um
    "top-level window" de verdade pro UI Automation
    (`WindowsDriver`/WinAppDriver recusa com `"0x... is not a top level
    window handle"`). Pior: o driver `windows` tenta internamente recriar a
    sessão contra esse handle em loop (dezenas de tentativas, sem desistir
    sozinho) — um `reloadSession()` contra ele TRAVA o processo Node por
    minutos, não falha rápido. **Nunca tentar `reloadSession` para esse
    segundo handle** — ele é ruído (provavelmente uma janela
    transitória/tooltip/combo captada pela janela de tempo do diff
    antes/depois); ignorar e dumpar direto da sessão já anexada à principal.
- **ClassName da janela da tela segue o padrão `Tf<MÓDULO>_<número com 4
  dígitos>`** (ex.: `TfMOV_0145`, `TfCAD_0046`) — útil como seletor estável
  pra confirmar "estou na tela X" (`//Window[@ClassName="TfCAD_0046"]`),
  mais confiável que casar pelo `Name` (que é o título legível, pode mudar
  com idioma/versão). Exceção: a tela 018 teve
  `ClassName="TfUSU_0018_0024_0192"` — ver nota na tabela abaixo (uma única
  janela física reúne 3 números de tela como abas).
- **Fechar a tela aberta**: `//Button[@AutomationId="Close"]` aparece sempre
  **2 vezes** na árvore quando uma tela está aberta — o **primeiro** da lista
  (ordem do documento) é o X do frame filho da tela (o que se quer fechar); o
  **segundo** é o X da própria janela principal do app (**nunca clicar
  nele**, fecha o AppERP inteiro). `(await driver.$$('//Button[@AutomationId=
  "Close"]'))[0].click()`.
- **Grids de listagem (ex.: tela 418) não são expostos como `DataGrid`/
  `List`/`Table`/`DataItem` em UI Automation** — são desenhados pelo
  componente próprio do Delphi (owner-drawn), sem elementos UIA por linha.
  Testes que precisem ler/clicar linhas específicas desse tipo de grid não
  vão achar seletor por `Name`/`AutomationId` de linha — vai exigir
  coordenada relativa, scroll por `UpButton`/`DownButton`/`DownPageButton`
  (esses sim expostos), ou validação por screenshot.

### Resumo por tela

| Nº | Título real (`Name` da janela) | `ClassName` da janela | Campos/controles principais encontrados |
|---|---|---|---|
| 145 | `[ 145 ] - Atendimento ao cliente - Receita` | `TfMOV_0145` | Tela de venda de manipulados: radio Humana/Animal, checkbox Concluído, abas 1-Produtos/2-Posologia e Rótulo/3-Obs. ficha pesagem/4-Obs. sistema/6-Obs. receita, campos Paciente/Prescritor/Comprador/Convênio (sem `Name`, achar por posição), grid de produtos da fórmula, botões `Gravar`/`Registrar baixa`/`Registrar processo`/`Gerar NF-e`/`Digitalizar`/`Rótulos`/`Fichas`/`Consultar`/`Relatórios`/`Fechar` (todos `TBitBtn` com `Name` próprio — seletor direto por `Name`). |
| 046 | `[ 046 ] - Cadastro de clientes` | `TfCAD_0046` | Ficha do cliente: radio CPF/CNPJ, `TJPsMascara` (CPF/CNPJ), `TJPsCodigo`/`TJPsEdit` (código/nome, sem `Name`), checkboxes `Ativo`/`Cliente em débito`/`Programa de fidelidade`/`Não cobrar taxa de entrega`/`Manter telefones e endereços ao limpar` (estes COM `Name`), 11 abas (Informações pessoais, e-Mail e home page, Informações fiscais, Configuração do desconto, Filiação, Classificação, Contatos, Inf. profissionais, Animais, Perfil, Alergias e restrições, Fidelidade, Financeiro, Observações...). Botões `Refazer`/`Excluir`/`Gravar`/`Limpar`/`Consultar`/`Digitalizar`/`Relatórios`/`Fechar`. |
| 032 | `[ 032 ] - Cadastro de fornecedores` | `TfCAD_0032` | Ficha do fornecedor: radio CPF/CNPJ, campo CNPJ com botão de busca laranja, Nome fantasia/Razão social/Grupo, combos Classificação/Tipo de fornecedor, checkbox `Credenciado`, abas Informações fiscais/Contatos/Autorizações, grids Telefones/Endereços, abas inferiores Observação/Observação p/ cotação/Informações privadas/Crédito. Botões `Fechar`/`Limpar`/`Excluir`/`Gravar`/`Digitalizar`/`Consultar`/`Relatórios`. |
| 007 | `[ 007 ] - Cadastro de funcionários` | `TfCAD_0007` | Cadastro de funcionários: Código/Nome/Loja/Grupo, checkbox `Ativo`, foto (upload/câmera/girar), combo Classificação, campo Nickname. 11 abas: Info. pessoais, Classificações, Processo produção, Dados bancários, Registro ponto, Folha pagamento, Carteira Trabalho, Título eleitor, Comissão, Desconto autorizado, Segurança; mais Observação/Treinamentos/Curva ABC embaixo. Campos de Info. pessoais sem `Name` (Dt. nasc./Sexo/Estado civil/CPF/Nº R.G./Org. exped./UF/e-Mail — achar por posição/ordem). |
| 112 | `[ 112 ] - Cadastro de produtos (Alopatia)` | `TfCAD_0112` | Cadastro de produtos de alopatia: Código/Ativo/Código de barras/Localização/Número CAS/Número DCB/Tipo de uso, Nome, Descrição no rótulo. Abas Info. gerais/Info. extras/Memorando/Info. fiscais/Sinonimos/Produção interna/Rel. forma farmacêutica/Sngpc-Siproquim/Curva ABC. Bloco "Agrupamentos" (Grupo/Classificação/Linha/Classe/Categoria/Marca/Fabricante/Tipo de estoque, todos com botão de busca + botão de detalhe azul ao lado). Bloco "Índices e valores" (Índice/Valor custo, venda, referência). Grid de Estoque/Em trânsito/Mínimo e Máximo. 8 checkboxes de regra de negócio COM `Name` próprio: `Conservar em geladeira`, `Bloquear perda no processo`, `Bloquear excipiente`, `Fotossensível`, `Baixa monitorada`, `Uso contínuo`, `Unificar estoque`, `Usar no atendimento`. |
| 018 | `[ 018 ] - Permissões de usuários` | `TfUSU_0018_0024_0192` | **Uma única janela física reúne 3 números de tela como abas**: `1 - Permissões de usuários - [ 018 ]`, `2 - Grupo de permissões - [ 024 ]`, `3 - Lista de usuários e grupos por permissão - [ 192 ]` — digitar qualquer um dos 3 números abre a mesma janela, só muda a aba ativa inicial (não confirmado qual, não testado). Aba 018: combo `Usuário` (ComboBox com busca, sem `Name`), campo `Senha`, `Intervalo permitido p/ conexão` (2 campos `TJPsHora`), filtros Opções/Ativo/Incluir/Alterar/Excluir (combos "AMBOS"), campo `Localizar permissão`, grid "Lista de permissões do usuário" (colunas Código/Grupo/Nome da permissão/AT/I/A/E — vazio sem usuário selecionado), contadores "Total de permissões"/"Total de permissões ativas". Direto relevante pro padrão **RBAC bidirecional** exigido em `AGENTS.md` — esta é a tela que concede/revoga permissão por usuário. |
| 418 | `[ 418 ] - Omni Channel - Atendimentos` | `TfMOV_0418` | Painel de atendimentos omnichannel: filtro por intervalo de datas (2x `TJPsData`) + combo `Status` (ComboBox grande, lista "8 - AGUARDANDO" etc.), contadores clicáveis Pendente/Em andamento/Concluído/Finalizado/Descartado/Aguardando/Total (parecem ser botões/abas de filtro rápido, confirmar por teste manual), grid "Lista de registros" **sem elementos UIA por linha** (ver achado acima) com colunas TP(ícone canal)/Código/Data-hora/Janela/Clientes mensagem/Atendente/mensagem/Nome do cliente/Telefone/Grupo/Atendente/Status/TM. Botões `Iniciar um atendimento`, indicador `Ocupado`, `Consultar`/`Relatórios`/`Fechar`. Canais vistos nos dados: Chatbot, Balcão, Atendimento. |

### Tela 145 — exploração parcial (2026-10-23, só leitura, nada gravado)

Dumps e screenshots em `tests/fixtures/screen-inventory/145-*`. Não cobre
cálculo de receita, efeito dos flags nos totais nem inclusão de produto (ver
"Não conseguido" abaixo). Seletores: ver o `ClassName` `TfMOV_0145` acima; os
`AutomationId` mudam a cada execução (`[R-SEL]`).

**Estrutura (de cima para baixo)**
- Faixa `Orçamento`: Loja, Código (com lupa e botão verde), Tipo de receita
  (Humana/Animal), `Concluído`. À direita: `Meta [x%]` (só aparece com o app
  aberto há um tempo), `Info. Extra`, `Orçamentos (n)`, `Pendências (n)`, `---`, `>>`.
- Quatro botões owner-drawn, sem `Name`: Omni channel, Delivery, Financeiro
  e Carrinho (clique por coordenada).
- `Informações da fórmula`: Nº fórmula (x de y), Múltiplo, Laboratório, Forma
  farmacêutica, Est. (Baixa), Código CID. Flags `Receituário Ok`,
  `Inclusão automática` (vem marcado) e `Concluído` (há outro `Concluído` na faixa do topo).
- Abas 1-Produtos, 2-Posologia e Rótulo, 3-Obs. ficha pesagem, 4-Obs. sistema,
  6-Obs. receita. Barra: `Calcular`, `+` (incluir), editar, excluir, copiar, `Opções`.
- Totais da fórmula: Tx. técnica, Vlr. extra, Vlr. medic., Valor, % Desconto,
  Valor c/ desc. Datas: laboratório, retorno, vencimento.
- Paciente, Prescritor, Comprador, Convênio, botão `Revenda`.
- Bloco `Valores`: data/hora de entrega, Valor, % Desconto, Valor c/ desc.,
  botões `Comissão`, `Origem da venda`, `Forma de pagto.` (estes 3 não abertos).
- Rodapé: `Fechar`, `Limpar`, `Gravar` (+ seta), `Registrar baixa`,
  `Registrar processo`, `Gerar NF-e`, `Digitalizar`, `Rótulos`, `Fichas`,
  `Consultar`, `Relatórios`.

**Achados**
- `Info. Extra` abre painel com Loja para retirada, Tipo de operação (veio
  "ATENDIMENTO"), Setor de venda, Funcionário comissionado, Origem da venda e
  flag `Pagar Comissão`. Fecha pelo X do painel.
- `+` troca a grade para modo de inclusão: Tipo de produto (combo, padrão
  `1 - ALOPATIA`), Produto (campo de código numérico + lupa), Quantidade,
  Quantidade definida (unidade `g,ml`) e `Incluir fórmula`.
- `Orçamentos (n)` abre a consulta `[ 10922 ]` (receitas em orçamento, 90
  dias) e `Pendências (n)` abre `[ 10919 ]` (pendentes, 90 dias; colunas
  Fin./Del./R.A.). Ambas são `TfCON_0001`, com `Fechar`, exportar Excel/CSV e
  grade owner-drawn. **Escape não fecha**: usar o botão `Fechar` da janela.
- `Delivery` abre `[ 279 ]` (`TfMOV_0279`). Sem atendimento carregado, mostra
  "Operação cancelada! Tipo de operação não encontrado." (diálogo "Atenção",
  fecha com `Ok` ou Esc): delivery depende do Tipo de operação.
  A 279 tem Entrega/Coleta, Status Pendente/Em Trânsito/Concluído, flags
  `Expressa` e `Pagar comissão`, Forma de pagamento, Troco, Valor da taxa e Valor total.
- `Financeiro` abre `[ 345 ]` (`TfMOV_0345`): movimentos, recebimentos (total
  movimento/recebido/a receber) e documentos fiscais; atalhos para "Financeiro
  a pagar pendente" e Delivery.
- O botão Omni channel não abriu nada com a 145 vazia.
- Campos são legíveis por `getText()` (inclusive combos); `setValue` falha
  (`clear`), usar `addValue`. No campo Código do orçamento, Enter não carrega o código digitado.

**Consulta ao banco para massa de teste (só leitura)**
- Guia: `docs/ACESSO_BANCO_AGENTES.md` (Firebird 2.5, VPN Corporativa).
  Este app aponta (`C:\Apps\ERPDesktop\ARQ\SIS\PS.ini`, chaves `SERVIDOR_IP` e
  `SERVIDOR_BD`) para `db.local`, alias `demostore`.
- Conexão testada com `node-firebird` instalado **fora do repo** (pasta
  temporária): `host db.local`, porta 3050, `database:
  'demostore'`, charset WIN1252, usuário/senha do guia (não copiar para docs).
- Produtos: `ESTOQUE_GERAL` (`CODIGO`, `NOMEPRODUTO`, `CODIGO_ESTOQUE_TIPO`,
  `UNIDADE`, `VALORVENDA`, `VALORCUSTO`, `FATORCALCULO`, `MOVIMENTOESTOQUE`).
  `ESTOQUE_TIPO.MOVIMENTOESTOQUE`: 1 alopatia, 2 homeopatia, 3 revenda,
  4 embalagem (os mesmos números do combo "Tipo de produto" da tela 145).
- Exemplos de passiflora: `1000612` PASSIFLORA PO (alopatia, g, venda
  0,1646/g, custo 0,017); `1004866` EXTRATO SECO (alopatia); `2001332`
  INCARNATA TM (homeopatia, ml, 0,813); `3022779` M. PASSIFLORA 45CPS (revenda).

**Fluxo da fórmula e cálculo (validado em 2026-10-23, sem gravar)**
- Domínio: farmácia de manipulação. Receita → fórmula → forma farmacêutica
  (que define o laboratório) → matérias-primas, excipiente e embalagem →
  orçamento (custo + markup) → pagamento/entrega. No banco: `ATENDIMENTO_A1`
  (cabeçalho), `ATENDIMENTO_A2` (fórmula: forma, `QVD`, `MULTIPLO`, taxa
  técnica, extra, desconto, venda/custo) e `ATENDIMENTO_A3` (itens, com
  `QUANTIDADE`, `QUANTIDADE_CALCULO`, `VALORVENDA_UNIT`).
- **Ordem obrigatória para incluir item** (antes de qualquer produto):
  1. Laboratório (`TJPsCodigo` ~x=275,y=226): `FORMAFARMACEUTICA_LABORATORIO`
     (1 Semi-sólidos, 2 Sólidos, 3 Fitoterapia, 4 Homeopatia). Foi o que
     faltou nas tentativas anteriores.
  2. Forma farmacêutica (`TJPsCodigo` ~x=98,y=262): tabela `FORMAFARMACEUTICA`
     (2 CÁPSULAS, 6 PÓS/SHAKES...). Ao aceitar, aparecem `Total múltiplo` e
     `Est. (Baixa)`.
  3. `Total múltiplo` (`TJPsValor` ~x=503,y=262) = QVD, ex. 60 cápsulas. Enter
     nele limpa o produto: informar o produto **depois**.
  4. Produto por código (+ Enter, Esc no aviso), Quantidade (por unidade
     de dose, ex. mg por cápsula) e Unidade; Enter na unidade inclui o item.
- Digitar `300` na quantidade vira `3000` (campo já tem `0`; ficou 3.000,00).
  Com "Inclusão automática" marcado, `Receituário Ok` e `Concluído` da
  fórmula marcam sozinhos.
- `Calcular` (toque ~x=1080,y=300) gera: aviso do produto ("quantidade acima
  das especificações", "Estoque insuficiente..."), pergunta "Deseja calcular
  outra fórmula?" e, ao responder Não, **abre a tela 046** (cadastro de
  cliente) por falta de paciente/comprador; fechar pelo `Fechar` dela.
- Exemplo medido (forma 2, lab 2, múltiplo 1, QVD 60, PASSIFLORA PO 1000612,
  3.000 mg/cápsula): qtde calculada 180 g (3.000 mg x 60) e valor 29,628
  (180 x 0,1646, igual a `ESTOQUE_GERAL.VALORVENDA`). Itens automáticos:
  excipiente `1005128` (TI 4; 0,557 g/cáps., calc 33,4224 g, 38,1015),
  `4000087` cápsula n.00 (TI 7; 4 u/dose, calc 240, 36,00) e `4000166`
  pote PET 520 ml (TI 7; 1 u, 10,00). **Tx. técnica 10,00**, Valor total
  **126,73**. Os itens e a taxa somam 123,73: restam **3,00** não explicados.
- **Múltiplo** multiplica tudo: com múltiplo 21 a passiflora foi a 3.780 g e
  622,188, a tx. técnica a 210,00 (a forma 2 tem `MULTIPLICARTAXA = -1`) e o
  total a 2.661,32.
- Valor de referência de receitas reais (banco): cápsula de passiflora 300
  mg x 60 deu item 2,9628, fórmula 36,25 (tx. técnica 0 nessa receita).
- **Receita de teste GRAVADA em 2026-10-23: orçamento `261001625`** (autorizado;
  banco de testes): forma 2, lab 2, QVD 60, múltiplo 1, PASSIFLORA PO 300 mg
  (digitar `30` na quantidade), paciente/comprador `867092` KLISMAM JUNIOR
  MONTEIRO, prescritor `14991` JOSE RODRIGUES COSTA. Aviso "Gravação OK!".
  Conferido no banco: A1 `VALORVENDA` 46,60, custo 11,03, `STATUS_MOV` 0,
  médico 14991, cliente 867092, tipo operação 1, setor de venda 1.
- **Os 3,00 "a mais" estão resolvidos**: a fórmula tem **8 itens** e a grade
  só mostra 5 sem rolar. `ATENDIMENTO_A3` guarda também `4000043` sachê de
  sílica gel, `4000191` etiqueta 93x30 e `4000581` etiqueta 24 mm (R$ 1,00
  cada, `INCLUSAOSISTEMA` 8). Itens: 2,9628 + 16,9413 + 7,20 + 5,00 + 1,50 +
  3,00 = 36,6041, mais tx. técnica 10,00 = **46,60**. Custo total 11,03.
  `INCLUSAOSISTEMA`: 0 produto digitado, 4 excipiente, 7 cápsula/frasco, 8
  tampa e rótulos/acessórios.
- **Selecionar paciente, comprador e prescritor** (o que travava a gravação):
  após o `Calcular` o app abre sozinho a 046 (cliente) e depois a 036
  (prescritor), cadastros em que se **escolhe** o registro (nada é salvo):
  1. Na 046, ícone de telefone do campo Código abre a janela de topo
     "Consultar por telefone" (`TfUTI_TEL`). Reanexar a sessão a ela
     (`appium:appTopLevelWindow` com o handle de `listVisibleWindowsForProcess`),
     digitar o número no 2º campo (`addValue`) e Enter: carrega o cliente
     (aparece "Cliente com N orçamento(s)... Deseja consultar?": Esc = Não).
  2. Na 036, a lupa do Nome abre "Localizar registro..." (janela de topo,
     916x489): digitar o nome (busca "Início do nome"/"Parte do nome", lista ao
     vivo) e Enter escolhe a 1ª linha. **Esta é a busca por nome que parecia
     não abrir**: ela abre fora da sessão e da árvore da janela principal.
  3. `Fechar` a 046 e a 036 (botão da própria janela) devolve à 145 com
     Paciente, Comprador e Prescritor preenchidos. Depois, `Gravar` (botão
     `Gravar` da `TfMOV_0145`, clique UIA).
- Janelas de busca/seleção e diálogos "Atenção" são janelas de topo: para
  digitar nelas é preciso reanexar a sessão ao handle delas e voltar à
  principal (`AppERP - Soluções Inteligentes`, largura > 500) depois. Teclas
  `windows: keys` com `text` não funcionam; dígitos por `virtualKeyCode` só
  alcançam a janela em foco da sessão.
- Botões da 145 com a receita gravada (orçamento): `Forma de pagto.` abre
  "Forma de pagamento" (566x289, lista vazia, Fechar/Limpar/Confirmar);
  `Origem da venda` abre "Localizar registro..." (só "1 GRA-BRETANHA");
  `Comissão` abre lista de funcionários; `Delivery` abre a 279 **vazia**
  (não herda a receita; usa "INCLUIR MOVIMENTO"); `Financeiro` e `Carrinho`
  respondem "Operação cancelada! Receita não concluída!" e, para o carrinho,
  "Não é possível adicionar um carrinho em um orçamento". Omni channel não
  abriu nada.
- **Concluir a receita não bastou**: marcar `Concluído` (topo) e gravar de
  novo não persistiu (`CONCLUIDOFORMULA_DT`, `RECEITUARIO_OK_DT` e
  `STATUS_MOV` seguem nulos/0 no banco). Os checkboxes da fórmula marcados
  sozinhos pela "Inclusão automática" são só de tela. A conclusão exige as
  etapas `Registrar processo`/`Registrar baixa`, não executadas (não
  autorizadas): é o gargalo para Financeiro, Carrinho, pagamento e NF-e.

**Conclusão da receita e registro de processo (validado em 2026-10-26)**
- Abrir uma receita pelo número: a lupa do Código (toque ~x=229,y=162) abre um
  menu de contexto ("Receitas cadastradas hoje" / "Receitas pendentes 90
  dias"); o item abre a lista (`TfUTI_PES`, janela de topo). Escolher a linha
  por **toque** (a grade é owner-drawn; cada tecla de seta anda 2 linhas) e
  Enter carrega a receita na 145. O botão verde ao lado do Código é "novo":
  pergunta "Deseja descartar as alterações feitas?".
- Receita 261001625: marcar `Concluído` (topo) e `Gravar` (botão UIA, sem
  diálogo) gravou `STATUS_MOV` -1 (concluída). `Registrar processo` antes
  disso responde "Receita não concluída!".
- `Registrar processo` exige **processo padrão do funcionário**: sem ele,
  "Funcionário não possui processo padrão!". Configurado na tela 007, aba
  "Processo produção" (`FUNCIONARIO.CODIGO_PROCESSO_TIPO`, receita; também
  Coleta, Delivery e Revenda). Funcionário 122 recebeu o processo 1
  (CONFERENCIA INICIAL 2, `registrar_baixa` -1).
- Com o processo, `Registrar processo` pede "Confirma o registro do processo?",
  e a 145 vira "Atendimento Concluído": aba "5 - Rastreabilidade de processos",
  data/hora do laboratório e de entrega (27/10 18:00) preenchidas, "Retirar na
  loja". A baixa de estoque vem junto: `Registrar baixa` abre a 433 (Baixa de
  fórmulas) já com "Baixa registrada: Sim" pelo funcionário e hora do processo,
  8 itens com lote e quantidade pesada.
- Janelas MDI (278, 279, 433) aparecem em `listVisibleWindowsForProcess` mas o
  driver não anexa nelas ("not a top level window handle"): dumpar pela sessão
  da janela principal.

**Financeiro, Delivery e tela 146 (validado em 2026-10-26)**
- **Regra de teste (operador, 2026-10-28): forma de pagamento SOMENTE `Dinheiro` por ora.** Cartão, A PAGAR, link de pagamento e demais formas só quando o operador pedir. O fluxo receita > baixa gravado em 2026-10-28 **não incluiu pagamento**.
- A 278 (Controle de recebimento) **não se fecha sozinha por falha do app**:
  qualquer chamada UIA (`getPageSource`, `findElement`, `reloadSession`) com a
  278 aberta a fecha. Operar a 278 só por **toque por coordenada** e conferir
  por screenshot do SO (`CopyFromScreen`), nunca por UIA. Também fecha se a
  145 tiver alterações não gravadas ("Salve as alterações antes de continuar").
- Receita concluída + baixa registrada **não pode ser recalculada nem
  regravada** ("Fórmula com baixa registrada"); a 145 "suja" bloqueia o
  Financeiro: recarregar a receita (descartar alterações) antes de abrir.
- Pagamento exige **caixa aberto do dia** para o funcionário: sem ele, ao
  incluir a forma, "Funcionário não possui caixa aberto no dia". O operador
  122 tinha 7 caixas antigos abertos (`FINANCEIRO_CAIXA`, `FECHAMENTO_DT`
  nulo, desde 10/08). Tela 395 (PDV Frente de caixa) > `Controle de caixa` =
  tela 047: mostra um caixa aberto por vez. `Fechar caixa` exige informar o
  total (Cartão = soma do lançamento) e confirma; "Relatório não configurado"
  depois é só a impressão. Com todos fechados, `Abrir caixa da loja` cria o
  caixa do dia (261000031). Com caixa aberto: "Funcionário com caixa aberto".
- Com caixa do dia: `Financeiro` (278) > lupa da forma (lista grande) >
  escolher forma (ex.: 75 A PAGAR) > valor 46,60 vem preenchido > Enter inclui
  o lançamento e abre a **345 – Financeiro** (cód. financeiro, movimento REC,
  recebido, a receber 0,00). `ATENDIMENTO_A1.CODIGO_ATEND_FL` recebe o cód.
  financeiro e a 145 mostra o campo `Financeiro`.
- `Delivery` (279): dependia do **Tipo de operação padrão (Delivery)** da
  146, aba Geral, "Configurações válidas para esse computador" (vazio gerava
  "Tipo de operação não encontrado"). Com 53 ENTREGA COMUM, a 279 abre,
  pergunta "Confirma a inclusão do movimento?" e lista o REC. `Gravar` exige
  endereço do cliente ("Endereço não selecionado"; cliente 867092 sem
  endereço) e Entregador; a forma de pagamento da 279 é um combo à parte.
- Teclas por `windows: keys` em campos Delphi **duplicam o caractere**
  (keyDown+keyUp por tecla): para digitar usar `addValue` no elemento; para
  limpar, Backspace/Delete. Em popup "Localizar registro..." anexar a janela e
  `addValue` no `TJPsEdit`; depois reanexar à principal.
- Lista de Orçamentos/Pendências: **duplo toque** na linha carrega a receita
  na 145 (Enter não carrega). Esc não fecha a lista; usar o `Fechar`.

**Tela 146 (Configurações do atendimento) e impacto na 145**
- Abas Receita / Revenda / Geral; por loja (1 OmniCare DEMO). Valores do
  banco de teste: desconto padrão 0; taxa técnica 50%; validade mínima 0;
  prazo máximo orçamento 3 dias; desconto máximo mensal 10.000; delivery loja 1;
  "Gravar venda somente como orçamento" ligada; "Bloquear vendas de clientes
  em débito" ligada; máximo de falta no financeiro 0,50; meta por data de
  pagamento; orçamento válido 3 dias.
- Flag ligada com efeito confirmado: **"Selecionar origem da venda antes de
  gravar"**. `Gravar` abre a lista de Origem da venda (1 GRA-BRETANHA) e
  depois o painel **Informações Extras** (Loja para retirada, Tipo de
  operação, Setor de venda, Origem da venda, Funcionário comissionado, Pagar
  Comissão). Sem Tipo de operação: toast "Operação de venda inválido"; com
  origem 1, setor 1 (SETOR DE VENDA GERAL – LOJA 1; 4 = E-COMMERCE) e tipo 1
  (ATENDIMENTO): "Gravação OK!" e `CODIGO_ATENDIMENTO_ORIGEM`,
  `CODIGO_ATEND_SETORVENDA` e `CODIGO_TIPOOPERACAO` = 1 no banco.
- A lista de flags rola 27 px após o 1º toque na aba: conferir por screenshot
  antes de marcar. Flag restaurada ao original após o teste.
- Flags com efeito presumido, não testadas: bloquear posologia nula, exigir
  data de retorno, loja de retirada antes de gravar, digitalizar ao concluir,
  exigir prescritor, validar estoque de embalagens, horário automático.

**Delivery completo e flags do cálculo (validado em 2026-10-26, 2ª rodada)**
- Cliente 867092 **já tem endereço** (principal): o "Endereço não selecionado"
  da 279 é só falta de seleção. Na 279: combo `Endereço` (seta ao lado do
  título "Endereço do cliente") > escolher; `Entregador` (lupa; ex. 9
  ENTREGADOR); combo Forma de pagamento (10 - JÁ PAGO com financeiro lançado).
  `Gravar` = "Gravação OK!", "Entrega pendente!" (delivery 261000017); Em
  Trânsito também grava. **Concluído** responde "Entrega com movimento não
  finalizado": exige finalizar o movimento (documento fiscal), não executado.
- Autorização por permissão: `% Desconto` pede a **154** (botão laranja ao
  lado do campo) e desmarcar `Inclusão automática` pede a **682**. O diálogo
  "Autorização" (janela de topo, 356x204) tem `Usuário` (3º `Edit`) e `Senha`
  (2º `Edit`); preencher com `addValue` e clicar `Autorizar` **por UIA dentro
  da janela do diálogo** e só então reanexar à principal. Clicar `Autorizar`
  por toque deixa um diálogo fantasma que trava a 145 (só reiniciar o app).
- Campos numéricos da 145 (`TJPsValor`): o cursor fica antes do `0` final;
  digitar `N` vira N×10 (`6` = 60 no Total múltiplo; `5` = 50,00 em Vlr. extra;
  `1` = 10 em % Desconto). Backspace não limpa direito: usar `Limpar`.
  `Vlr. extra` e `% Desconto` só aceitam digitação após o botão de edição
  (lápis azul / escudo laranja).
- **Inclusão automática desmarcada** (PASSIFLORA PO 30 mg, múltiplo 60): ao
  `Calcular`, "Fórmula será calculada sem as inclusões do sistema!"; entra só
  o item digitado (1,80 g, 0,2963) + tx. técnica 10,00 = **10,30** (com a flag
  ligada seriam excipiente, cápsulas, frasco e rótulos). O `Limpar` religa a flag.
- **Vlr. extra** soma direto ao valor (10,30 + 50,00 = 60,30). **% Desconto**
  incide sobre o total com extra e taxa (60,30 a 10% = 54,27).
- **Animal**: o bloco vira "Informações do animal e prescritor" (campo Animal
  no lugar de Paciente), surgem `Peso Kg` e `Calcular o peso`, e Receituário Ok
  e Concluído marcam sozinhos.
- `Revenda` (145) abre a **232 – Atendimento ao cliente – Revenda** (abas Lista
  de produtos, Últimos produtos comprados, Rastreabilidade, Observações).
- Não testados: homeopatia (tipo 2), `Pagar Comissão`, Carrinho e Omni.

**Omni channel testado com o telefone do operador (validado em 2026-10-26, 6ª rodada)**
- **Entrada física obrigatória nas telas MDI do Omni**: reanexar a sessão à
  janela principal (`attach`) ou consultar a UIA **fecha** a janela MDI aberta
  (mesmo efeito da 278). Funcionou: clique/teclas pelo SO (`SetCursorPos` +
  `mouse_event`, `SendKeys`) e capturas do SO. Com a sessão do Appium apontando
  para uma janela já fechada, qualquer ação falha ("no such window"). Teclas
  enviadas sem foco no campo disparam atalhos da 418 (abriu "Filtros" e
  "Consultas/relatórios"): sempre clicar no campo antes de digitar.
- **Iniciar atendimento** (418): `Canal` (3 WhatsApp não oficial = texto livre;
  6 WhatsApp oficial = só **templates** aprovados: 341–349, 5208, 5209, 7316,
  tipos UTILIDADE/MARKETING, com variáveis `{{1}}`), `Grupo` (7 ATENDIMENTO),
  `Cliente` (lupa: lista os telefones do cliente e "Possui atendimento"),
  `Celular` (preenchido pelo cliente), `Mensagem`, `Agendar envio`, `Enviar
  mensagem`. Envio ao próprio telefone do operador criou o atendimento
  **261000213** (Pendente, atendente 122, 1 ✓).
- **Detalhe do atendimento** (duplo clique na linha): cabeçalho do canal/grupo,
  Código, Data/hora, **Status** (0 Pendente [0.1 Aguardando resposta/atendente,
  0.2 Aguardando retorno]; 1 Em andamento [1.1 Orçamento criado, 1.2
  Aguardando pagamento]; 2 Concluído [2.1 Fidelização]; 3 Finalizado [3.1
  Banido]; 4 Descartado), Cliente, ID/Celular, e-mail, usuário; abas
  Observações, Transferências, Atendimentos (histórico do cliente); **Lista de
  movimentos** (receitas vinculadas: St., Mov. REC, código, valor, Sel); chat
  à direita. Trocar o status **grava na hora** ("Gravação OK!") e registra no
  chat "Status alterado de [Pendente] p/ [Em andamento]".
- Botões do chat: `Link de Pagamento` (mesmo painel do Carrinho; não gerado),
  `Enviar Orçamento`, `Info. do Produto`, `Gravar Audio`, `Mensagem Padrão`,
  `Anexar Arq. Padrão`, `Anexar Arquivo`, `Pasta do Atend.`, `Imagens do
  Atend.`; rodapé: `Orçamento IA`, `Orçamento receita`, `Orçamento revenda`,
  `Refazer`. Menu `...`: Transferir atendimento, **Mensagem interna** (nota
  amarela "COMUNICAÇÃO INTERNA", não vai ao cliente; ✓✓), Detalhes do
  registro (tela 461).
- **`Orçamento receita` = o vínculo com a 145**: abre uma 145 nova já com
  paciente/comprador do atendimento e o campo `Omni channel` = código do
  atendimento (261000213). Ao gravar, `ATENDIMENTO_A1.CODIGO_OC_ATENDIMENTO`
  = 261000213 (receita 261001653, orçamento 21,23) e ela aparece na lista de
  movimentos do atendimento. É o que o botão Omni da 145 só mostra.
- `Enviar Orçamento` (tela "Enviar orçamento"): arquivos a anexar (lista de
  imagens), mensagem padrão, texto gerado ("Segue o orçamento solicitado,
  validade por 5 dias. Orçamento nº, Cliente, Fórmula, Valor, Total…"),
  `Agendar envio`, `Enviar orçamento c/ link pagto.`, `Enviar orçamento`. O
  envio simples chegou ao chat (✓). `Mensagens padrão` = tela 472; `Info. do
  Produto` abre "Enviar dados do produto" (pesquisa por produto de revenda).
- Menu Omni Channel (submenus): **Cadastros** (Canais, Grupos, Horários de
  atendimentos, Vínculo Canal/Grupo, Atendentes, Arquivos p/ envio, Mensagens,
  Status personalizado, Redes Sociais, Blacklist), **Aplicativo**
  (Cadastros/Consultas), **e-Commerce** (Configurações/Cadastros),
  **Consultas, gráficos e relatórios** (1147 atendimentos, 1088 totalizados por
  dia, 1296 pesquisa de satisfação, 1087 transferências, 1200 links de
  pagamento, 1024 TMA), **Configurações** (Atendimentos, Pagamentos = tela 549,
  Inteligência artificial), **Painel de vendas** (tela 571: tipo IA/EC, status
  Aguardando pagamento/separação/NF, pipeline PG/1–6/OK; dados de terceiros).
  A 549 tem usuário/senha/merchant do gateway: não abrir registros.
- **Iniciar atendimento, 2ª exploração (2026-10-28)**: formulário preenchido por
  entrada física: `Canal` e `Grupo` aceitam o código + Tab (3 = WHATSAPP NAO
  OFICIAL - 4001; 7 = ATENDIMENTO); `Cliente` aceita o código (867092 = o
  cadastro do operador, **sem celular**, então `Celular` fica vazio); `Celular` tem
  3 caixas (DDI 55 / DDD, só 2 dígitos / número): clicar em cada uma. O sistema
  **normaliza o número** (tira o 9º dígito) e, se o telefone já tem atendimento
  aberto, mostra "Cliente já possui um atendimento aberto! Deseja consultar?":
  `Não` só cancela (volta ao formulário, nada enviado); `Sim` abre o detalhe
  do atendimento existente. **Logo, "criar atendimento novo a cada execução" não
  funciona** enquanto o telefone do teste tiver atendimento aberto (precisa
  Finalizar o anterior, status 3, ou reaproveitá-lo). O telefone de
  `credentials.telefone` (do operador, confirmado por ele) casa com o cliente
  **498 - LUCAS** e com o atendimento **261000216** (canal oficial, aberto em
  27/10, status 0 Pendente, janela de conversa ativa).
- **Atualização (2026-11-06)**: o 261000216 foi **finalizado automaticamente por
  inatividade** em 02/11 (status 3); o telefone passou a ter o **261100019**
  (WhatsApp Oficial, 04/11, 1 Em andamento, cliente 867092, atendente
  Klismammonteiro, em uso real com mensagens no mesmo dia). Logado com outro
  funcionário (o 1 da suíte), `Orçamento receita` nele dá **"Operação cancelada!
  Orçamento pertence a outro atendente."**: o atendimento tem dono. Mensagem do
  orçamento no banco: `OC_ATENDIMENTO_MSG.MSG_TEXTO` (VARCHAR), `TIPO` 1 = enviada
  pela loja, um bloco `*Orçamento nº:* <código>` por movimento marcado.
- **Tela 471 "Omni Channel - Lista de Atendentes" (explorada 2026-11-06)**: a mesma tela serve
  ao cadastro (Omni Channel > Cadastros > Atendentes) e à transferência (detalhe > `...` do chat
  (1258,127), popup sem título > "Transferir atendimento" (1256,141); clicar sem reativar a
  principal, senão o popup some). À esquerda os grupos (na transferência só os do canal, o atual
  já selecionado); à direita os atendentes do grupo em ordem de `FUNCIONARIO.NICK`, colunas
  Código/Atendente/Loja/Último atendimento/Nº Ate./ST (ST: 1 verde, 2 laranja, 0 cinza =
  `OC_CANAL_GRUPO_ATENDENTE_RELAC.STATUS`). **Cadastro**: "+" (1137,127) abre "Localizar registro..."
  de funcionários; duplo clique inclui no grupo e o diálogo reabre para o próximo (Esc encerra).
  **Transferência** (721x589 em 322,95): a grade **esconde o atendente atual**; clicar numa linha
  troca o rodapé de "Transferir p/ o grupo" para "Transferir p/ o atendente: <código> <nick>", e o
  botão `Transferir atendimento` fica em (952,609), `Fechar` em (370,656). Grade owner-drawn: 1ª
  linha (700,179) + Seta para baixo. Ativar a janela pelo Win32 e mandar seta logo depois abriu o
  **menu de sistema** da janela (a ativação simula Alt): mandar as teclas sem reativar. Registro:
  `OC_ATENDIMENTO_TRANSF` (func./grupo de origem e destino, quem e quando); o atendimento muda
  `ATENDENTE_CF` e mantém o status (1 Em andamento, visto no 261100019). A confirmação
  "Confirma a transferência…?" ainda não foi vista nesta tela (o clique foi bloqueado).
  Grupos (`OC_CANAL_GRUPO`): 1 BALCAO, 2 SAC, 3 EDUARDO TESTE, 4 FACEBOOK, 5 E-COMMERCE, 6 CHATBOT,
  7 ATENDIMENTO, 8 GRUPO. Funcionário 1 vinculado ao ATENDIMENTO em 2026-11-06 (já estava em 1 e 6).
- **Notificação "!" de não lidas na 418 (OS 364644, explorada 2026-11-06)**: a última coluna da
  grade ("!", x=1300) é verde com o nº de mensagens do cliente não lidas, ou "0" sem fundo; vem de
  `OC_ATENDIMENTO.MSG_QTDE`, que a trigger `OC_ATENDIMENTO_MSG_AI1_MSG_QTDE` recalcula pelas
  mensagens do cliente (`CODIGO_FUNCIONARIO_RESPOSTA` nulo, `MSG_TRANSFERENCIA` 0) sem
  `LEITURA_DT`. Atendimentos com não lidas sobem para o topo da grade. Regra de leitura =
  `OC_CONFIG.MENSAGEM_LIDA` (1 no banco de homologação): 0 quando o atendente visualizar, 1 quando
  visualizar ou alguém responder (a trigger `OC_ATENDIMENTO_MSG_AI0` marca na resposta), 2 quando
  alguém responder; abrir o atendimento de outro atendente não marca em nenhuma delas.
  `Mostrar filtros` (1220,244) abre o painel e desce a grade (1ª linha em y=360, passo 18);
  "Nome do cliente/ Telefone" (1180,284) + Enter filtra; duplo clique na linha abre o detalhe
  (`Fechar` do detalhe em 120,669); `Atualizar` (1310,244). O exe de debug da correção mostra uma
  janela de topo "versão debug" (marca d'água) sobre as telas: não atrapalha o clique do SO.
- **Tela 635 "Omni Channel - Configurações" (explorada 2026-11-06)**: janela pequena (436x442) aberta
  centralizada (465,167), sem UIA. Relativo ao canto: seta da combo "Mensagens lidas" (403,190); a lista
  mostra 0/1/2 em (135, 207 + 13 x regra) e some se a principal for reativada (clicar sem ativar);
  `Gravar` (118,414) grava em `OC_CONFIG` sem diálogo e a tela fica aberta; `Fechar` (48,414). Outras
  combos: Finalizar o atendimento, Nome no atendimento, Concluir o orçamento; campos de tempo e Qtde. de erros.
- Coordenadas do detalhe do atendimento (tela 1366x768, MDI): `Link de
  Pagamento` (600,551), `Enviar Orçamento` (704,551), `Orçamento receita`
  (990,670), `Orçamento revenda` (1117,670), `Orçamento IA` (856,670). Só valem com
  a janela maximizada nesta resolução.
- **Fluxo completo Omni → receita → orçamento enviado (2026-10-28, exploração, atendimento 261000216)**:
  1. Detalhe do atendimento > `Orçamento receita` abre a 145 em modo **Orçamento** (título vermelho)
     com `Omni channel` = código do atendimento e Paciente/Comprador = cliente do atendimento (498 LUCAS).
  2. Receita (mesmos dados do piloto): Laboratório `2` Tab, Forma `2` Tab, Total múltiplo `30`, Produto
     `1004866` Tab; **Quantidade é a caixa da ESQUERDA** (x≈690; a da direita, x≈730, é a Unidade e abre
     "Localizar registro..."): `250`, depois a Unidade `mg` e Enter incluem o item. O campo de quantidade
     já vem com `0`: Ctrl+A não seleciona (digitar `250` dá `2500`; corrigir com End + Backspace).
  3. `Calcular` (1080,299): "Tratamento de uso contínuo" > `Fechar` > "Deseja calcular outra fórmula?" `Não`
     > abre a **036** sozinha: Código `1` Enter (JOSE RODRIGUES DE ALMEIDA) > `Fechar` (não tocar em
     `Excluir`/`Gravar` da 036). Voltando à 145: valor 26,18.
  4. `Gravar` logo depois dá "Operação cancelada! Fórmula nº 1 precisa ser recalculada." (`Ok`): refazer
     `Calcular` (uso contínuo `Fechar`, `Não`; vai a 39,13 com as embalagens, 8 itens) e `Gravar` >
     "Gravação OK!" e o Código do orçamento (261001758). Não marcar `Concluído` (é orçamento).
  5. `Fechar` a 145: o detalhe do atendimento mostra a receita em **Lista de movimentos** (St. vermelho,
     Mov. REC, Valor 39,13, `Sel` marcado; rodapé Orçamento 39,13 / A receber 39,13).
  6. `Enviar Orçamento` abre "Enviar orçamento": `Enviar arquivo` e `Enviar mensagem padrão` marcados
     (imagem da lista, mensagem ATENDIMENTO), texto gerado com orçamento nº, cliente, fórmula
     (`30 CAPSULAS | Passiflora Extrato 250mg`), valor e total. `Enviar orçamento` (1183,657) fecha a tela e
     a mensagem aparece no chat com ✓ (aceita pelo sistema; entrega real só o operador confirma).
  Cada orçamento enviado = 1 receita nova em homologação + 1 mensagem no WhatsApp do operador.
- **Cadastrar cliente do zero na 046 (exploração 2026-10-28, banco de homologação)**: cliente **867809**
  `CLIENTE TESTE EXPLORACAO`, CPF de teste (dígito válido), grupo padrão 800000 GRUPO GERAL - CLIENTE, 1
  telefone e 1 endereço. Passo a passo e armadilhas (tela 1366x768, entrada física do SO):
  1. **Nome é campo de busca**: o 1º caractere digitado abre "Localizar registro..." (Início/Parte do nome) e
     engole o seguinte ("CLIENTE" virou "CIENTE"). Para um nome novo (a lista vem vazia), fechar a busca
     (X) deixa o campo vazio e Enter na lista vazia não faz nada: **colar com Ctrl+V** (clipboard com o
     texto) preenche o Nome sem abrir a busca. `Nome rótulo` não aceita digitação; o sistema o preenche
     sozinho no `Gravar` (igual ao Nome).
  2. **CPF** (`TJPsMascara`, rádio CPF/CNPJ): digitar só os 11 dígitos (`52998224725` vira 529.982.247-25);
     Tab passa ao Nome sem aviso (nenhum cliente com esse CPF).
  3. **Telefones** (`+` verde, x≈439,y≈384): mini-tela "Cadastro de telefones" com Tipo (1 - RESIDENCIAL),
     DDD já em 62, número (clicar na caixa do número, x≈695,y≈331), Principal marcado e `Incluir/ Alterar`;
     `Voltar` fecha. A linha entra na grade (`Res (62) 3000-0000`, PR marcado).
  4. **Endereços** (`+` verde, x≈1239,y≈384): mini-tela "Cadastro de endereços" com CEP, UF GO, Cidade 33
     GOIANIA (padrão), Bairro (lupa abre lista de bairros de Goiânia; duplo clique escolhe, ex. 1556 AERO
     RANCHO V), Endereço, Nº, Tipo (texto livre), Principal/Mala direta/Usar na NF-e marcados.
     **Obrigatórios (borda vermelha ao `Incluir/ Alterar`): Bairro e Tipo.** O CEP é máscara: clicar deixa o
     cursor no fim e o texto sai truncado ("Conteúdo inválido!"); usar Home antes de digitar.
  5. **Consulta de CEP quebrada neste ambiente**: o Tab no CEP chama `https://viacep.com.br/ws/<cep>/json` e
     falha ("Não foi possível consultar... EACBrHTTPError 500... SSL routines: tlsv1 alert protocol
     version"). Não depender do preenchimento por CEP; preencher Bairro/Endereço à mão.
  6. **`Gravar`** (x≈335; o `Excluir` fica em x≈262, não clicar) atribui o Código (867809) sem exigir sexo,
     nascimento, e-mail nem as demais abas; `Tipo doc.` virou 2 sozinho.
- **Correção (2026-10-26)**: o ✓ no canal 3 (não oficial) só indica que o
  sistema aceitou; a entrega real foi tratada como não comprovada. O envio
  que vale é o do **canal 6 (oficial) por template**: template 341 com
  `{{1}}` = texto livre criou o atendimento **261000214**; o chat mostra o
  corpo renderizado ("Olá, segue um status do seu pedido. <variável> Você pode
  verificar…"), o indicador `Janela conversa` e o aviso "A janela de conversa
  foi encerrada! Será necessário enviar um template e aguardar o contato
  responder"; surge o botão `Msg. Template` (só no canal oficial). O operador
  confirmou o recebimento do template. A resposta dele (botão "Continuar" do
  template) **chegou** ao sistema, só que com atraso de alguns minutos: a
  checagem inicial de ~10 min no banco não a viu, mas ela estava lá (msg
  4858551) quando o operador avisou. Não concluir "recebimento inativo" só
  por uma janela curta de polling.
- **Atendimento com resposta (261000214, canal oficial)**: na lista, `Janela`
  "- de 24h", `Últ. msg cliente` "+ de 01m", coluna `!` = 1 (não lida). No
  chat a resposta aparece como "--- RESPOSTA A MENSAGEM ---" + texto do
  template citado + resposta; o template enviado passa a ✓✓; o aviso de janela
  encerrada some e `Janela conversa` mostra contagem regressiva (23h 58m).
  **Texto livre** passa a ser aceito (✓/✓✓) e o status vai a "1 - EM
  ANDAMENTO" sozinho. `Anexar Arquivo` (diálogo de arquivo; jpg/png/pdf/doc…)
  enviou imagem (✓✓), gravada em `C:\Apps\ERPDesktop\ARQ\OMN\<atendimento>\<msg>.jpg`
  (botão `Pasta do Atend.` abre essa pasta no Explorer).
- Outras funções do detalhe (todas testadas no 261000214): `Orçamento
  receita` (receita 261001668 vinculada); `Msg. Template` = tela **707**
  (lista de templates, texto da variável {{1}}, corpo, `Enviar mensagem`;
  template 346 sem variável enviado); `Orçamento IA` = "Enviar arquivos para
  IA" (lista de imagens do atendimento, Zoom, `Enviar`); `Gravar Audio` =
  "Enviar audio" (Iniciar, controles, `Agendar envio`, `Enviar`; sem teste, sem
  microfone); `Anexar Arq. Padrão` = catálogo de imagens com mensagem padrão
  (`Enviar`/`Agendar envio`); `Agendar envio` = seletor de data e hora
  (`Continuar`, `Hoje`, `Cancelar`), não confirmado; **Transferir
  atendimento** = tela **471** (grupos ATENDIMENTO/BALCAO/CHATBOT, atendentes
  com loja, último atendimento, nº de atendimentos, status; confirma "Confirma
  a transferência do atendimento p/ o GRUPO selecionado?"): o grupo vira
  Balcao, o status volta a Pendente, o chat vira "Aguardando atendimento…",
  surge "Grupo alterado de Atendimento p/ Balcao" e a aba Transferências
  registra func., data/hora, origem e destino.
- **558 – Totalizações do Omni Channel** (Omni > Consultas, gráficos e
  relatórios): abas por canal/grupo, atendente e pesquisa; tabelas de
  atendimentos, vendas e orçamentos por canal e grupo, com gráfico de barras/
  pizza (valores agregados).
- O seletor de Status do detalhe: clique físico em item da lista suspensa nem
  sempre aplica; confirmar pelo banco (`OC_ATENDIMENTO.STATUS`). Ao fim o
  261000214 ficou **Pendente no grupo Balcao** (não finalizado).
- Cuidado na 036 (cadastro de prescritores): o botão em x≈262 do rodapé é
  **Excluir**, não Gravar; um clique errado abriu o ponto de exclusão (nada
  excluído, prescritor 13360 segue ativo). Na 145 o `Gravar` fica em x≈262.
- Atendimento 261000213 finalizado ao fim do teste; 261000214 ficou Pendente. Dados de terceiros (nomes,
  telefones, e-mails) das listas não foram registrados.

**Carrinho e flags de produto (validado em 2026-10-26, 5ª rodada)**
- `Carrinho` só age com a receita **concluída**: pergunta "Deseja gerar um novo
  código de carrinho?" (Sim por UIA) e preenche o campo (ex.: 261000054). Com
  código, o botão abre "Atendimento ao cliente – Carrinho" (1016x617): Cód.
  carrinho, lista de movimentos (LP, Mov. REC, código, valor, Ok), Total,
  `Financeiro a pagar pendente` (lista financeiros de terceiros: dado pessoal,
  não registrar), `Delivery`, `Consultar Link de Pagamento [n]`, `Gerar o Link
  de Pagamento`, `Fichas`. Sem marcar o LP: "Nenhum movimento disponível p/
  envio do Link de pagamento". Marcado, abre "Enviar link de pagamento" com
  Operadora (3 Cielo, 8 PagarMe, 6 PIX-Banco Inter, 12 Pixpixpix, 11 REDE),
  Valor total, Parcelas, Valor da parcela e Recorrente; **não enviado**.
- 146, **Mostrar produtos desativados na inclusão**: permite incluir (ex.:
  1000015 ZZZ-ÁCIDO ASCÓRBICO) mas o `Calcular` barra: "<produto> está
  desativado!!". Sem a flag: "Produto não encontrado".
- 146, **Não utilizar o fator de correção** + **Considerar densidade desligada** +
  **Validar estoque de embalagens**: ALOPURINOL 30 mg x 60 foi de 38,89
  (base) a 42,70; item 3,3279 → 3,3315 e base efervescente 8,5035 → 12,312.
  Efeito combinado das flags, não isolado por flag.
- **Tratamento de uso contínuo**: produtos de uso contínuo (ex.: ALOPURINOL)
  abrem esta janela no `Calcular` (Posologia, Data de retorno, Nº de dias;
  `Fechar` por UIA preenche a data de retorno sozinha, aqui 25/12/2026).
- **Permitir uso de estoque em quarentena** (validado): massa achada no banco
  (`ESTOQUE_LOTE_LA.STATUSLOTE` 2 = quarentena; produto via
  `ESTOQUE_LOTE.CODIGO_PRODUTO`) com produto só em quarentena, ex. 1002427 (WPI).
  Sem a flag o item calcula **sem lote** e a validade da fórmula fica 25/12/2026;
  com a flag usa o lote em quarentena (0685701) e o vencimento vira 08/03/2027.
  O cálculo não bloqueia nos dois casos. Flags restauradas.
- **Omni channel**: o botão da 145 não reage a toque/UIA; o acesso é pelo menu
  **Omni Channel** (Cadastros, Aplicativo, e-Commerce, Consultas/gráficos/
  relatórios, Configurações, Painel de vendas, Atendimentos). `Atendimentos` =
  tela **418** (WhatsApp; contadores Pendente/Em andamento/Concluído/Finalizado/
  Descartado/Aguardando; lista com nome e telefone de terceiros: não registrar).
  `Iniciar um atendimento` abre a 418 "Iniciar atendimento" (Canal, Grupo,
  Cliente, Celular, Mensagem, `Enviar mensagem`: envia a terceiros, não
  executado). Menu `...`: Iniciar (Ins), Abrir (Ctrl+Ins), Transferir
  (Ctrl+T), Alterar Status, Atualizar (F5), Detalhes (F9), Atualização
  automática, Configurações, Monitoramento, Abrir ficha do cliente.

**Homeopatia e Pagar Comissão (validado em 2026-10-26, 4ª rodada)**
- Homeopatia: laboratório `4` (HOMEOPATIA) troca a tela: o Tipo de produto vira
  "2 - HOMEOPATIA", surgem `Tipo medic.` (lupa: 1 MEDICAMENTO SIMPLES, 2
  COMPLEXOS HOMEOPÁTICOS, 3 FLORAL, 4 AUTOISOTERÁPICO, 6 DOSE ÚNICA…), `Gotas`
  e `Quantidade definida` (g,ml); Est. (Baixa) passa a 6. Formas do lab 4: 4
  GLÓBULOS, 14 SOLUÇÃO HIDROALCOÓLICA, 15 PÓS, 17 DOSE ÚNICA.
- Medido: forma 14, produto 2001332 (PASSIFLORA INCARNATA TM, ml), quantidade 3
  (=30) e definida 30 ml: ao incluir, "Deseja calcular fórmula em QSP?" (Sim);
  o item vira `qsp(ml)` 30,00 = 24,39, entra frasco âmbar 30 ml (5,00), tampa,
  cânula, tx. técnica 38,00: total **73,39**, aviso "Estoque insuficiente"
  (permitido pela flag). Receita 261001652 gravada (orçamento, prescritor 13360).
- **Pagar Comissão** (Info. Extra): a lupa do `Funcionário comissionado` abre
  lista de funcionários; o checkbox só marca por UIA (toque não pegou) e o
  `Gravar` também funcionou por UIA nessa tela. Banco:
  `PAGAR_COMISSAO_FUNCIONARIO` -1, `CODIGO_FUNCIONARIO_COMISSAO` 6,
  `PAGAR_COMISSAO_MEDICO` 0.

**Flags restantes da 146 (validado em 2026-10-26, 3ª rodada)**
- **Exigir cadastro de prescritor p/ cálculo**: o `Calcular` abre direto a
  **036** (prescritores) para escolher um (`Localizar registro...` > `addValue`
  no nome > Enter > `Fechar`); sem a flag o cálculo segue sem prescritor.
- **Exigir a data de retorno**: ao gravar com `Concluído`, "A fórmula nº 1 não
  possui data de retorno registrada. Por favor, informe a data e tente
  novamente." Os campos de data são **mascarados** (digitar `30112026` vira
  lixo: "'  /  / 30' is not a valid date" e depois "Data de retorno inválida"):
  usar o botão de calendário ("Selecione uma data" > dia > `Continuar`).
- **Perguntar se deseja digitalizar ao concluir**: ao gravar concluída, abre a
  **221 – Digitalização** (lista de arquivos, `Escanear`, `Localizar arquivo`;
  descrição "RECEITA: <código>"); `Fechar` conclui o gravar.
- **Selecionar loja de retirada antes de gravar**: nenhum diálogo apareceu
  (a loja já vinha preenchida em Info. Extra); sem efeito visível aqui.
- **Bloquear receitas com posologia nula**: não validada: a posologia é
  gerada sozinha (TOMAR 1 CÁPSULA 2 VEZES AO DIA) e fica não editável após a
  conclusão; seria preciso esvaziá-la antes de concluir.
- Gravar concluída com dosagem fora do limite pergunta "Fórmula nº 1 com
  dosagem fora do intervalo permitido... Continuar mesmo assim?" (o toque no
  `Sim` não pegou; usar `Sim` por UIA na janela "Atenção"). Receita 261001651
  (prescritor 13360) gravada e concluída (`STATUS_MOV` -1).
- Todas as flags foram restauradas ao original e a 146 regravada. Cuidado: a
  lista rola 27 px depois do primeiro toque; um toque em y fixo alterou 3
  flags erradas (restauradas antes de gravar). Rolar arrastando (`pointerMove`
  500 ms) e conferir por captura antes de gravar.

**Demais abas e botões da 145 (validado em 2026-10-26)**
- Abas: 2 Posologia e Rótulo (texto do rótulo, posologia, observação do
  rótulo), 3 Obs. ficha pesagem, 4 Obs. sistema (texto automático com volume e
  avisos por item), 5 Rastreabilidade de processos (seq., código, processo,
  funcionário, data, hora, PC, Ok), 6 Obs. receita. A aba 5 só existe com a
  receita concluída. Trocar de aba por toque (a UIA só marca a aba).
- `Orçamentos (n)` = tela 10922 (orçamentos 90 dias); `Pendências (n)` = 10919
  (pendentes 90 dias, colunas Fin./Del./R.A.); `Meta` = 580 (Metas por
  funcionário); `>>` expande painel lateral Lista de imagens/Imagem
  (digitalização) e a 145 passa a 1362 px; `---` abre menu: Tipo de receita,
  Movimentos por funcionário/paciente/prescritor (Ctrl+F/P/M, tela 391),
  Comunicação interna/SAC, Controle de qualidade (Peso médio, tela "[84]"),
  Abrir tabela de horários (202, capacidade Marcado/Limite por horário),
  NFS-e (429, abre vinculada ao movimento; não autorizar), Venda delivery
  (descarrega a receita) e Log de alterações (campos alterados por usuário).
- `Opções` (aba Produtos): Incluir fórmula (Ins), Calcular (F3), Informações
  SNGPC (F10), Registrar falta do produto, Bloquear fórmula no refazer.
- `Comissão` abre lista de funcionários; `Origem da venda` abre a lista de
  origens (hoje só 1 GRA-BRETANHA).

**Ainda não testado / a retomar**
- Trocar de aba pela UIA marca a aba mas não troca o conteúdo.
- Combo `Tipo de produto`: lista aberta invisível; trocar com `addValue('<dígito>')`
  (1-ALOPATIA, 2-HOMEOPATIA, 4-EMBALAGEM). `+` só abre por **toque**.
- Efeito dos flags (`Inclusão automática` desmarcada, Humana/Animal),
  `% Desconto`, `Vlr. extra`, homeopatia e revenda no cálculo: não testados.
- `Carrinho` e Omni channel seguem sem efeito visível; `Forma de pagto.` (botão
  da 145, abaixo de Valores) não foi reaberto com caixa aberto.
- Delivery: cadastrar endereço do cliente e entregador para fechar o `Gravar`
  da 279; `Gerar NF-e` e `Autorizar NFS-e` não executados (`[R-RISCO]`).
- `Comissão`/`Pagar Comissão` e demais flags da 146 (lista acima): sem teste.
- Receita de teste `261001625`: concluída, baixada, com financeiro A PAGAR
  261000055 (R$ 46,60) no banco de testes (cliente 867092); orçamento
  `261001609` regravado com origem/setor/tipo. Decidir destino ao fim.
- Efeitos colaterais no banco de testes (autorizados): funcionário 122 com
  processo padrão 1; 7 caixas antigos do 122 fechados e caixa 261000031 aberto
  hoje; 146 com Tipo de operação padrão (Delivery) = 53.

### Pendências da exploração (não investigado a fundo)

- Não testado: qual aba abre por padrão em cada um dos 3 números da tela 018
  (018 vs 024 vs 192).
- Não testado: comportamento dos contadores clicáveis (Pendente/Em
  andamento/etc.) na tela 418 — parecem filtros rápidos, não confirmado.
- Não testado: ação real dos botões de negócio (Gravar/Excluir/Registrar
  baixa/Gerar NF-e etc.) — a exploração só abriu e fechou cada tela, não
  preencheu/gravou nada (evitar sujar dados de produção sem combinar antes).
- Grids owner-drawn (418 e provavelmente outras telas de listagem) precisam
  de estratégia de seletor ainda não definida — ver achado acima.

## 10. Mapa de navegação do menu superior (crawl automatizado, 2026-10-08)

### 10.0 Índice `[QUENTE]`

> Leia só até aqui no início de sessão. §10.1 em diante é o mapa linha a
> linha (centenas de itens) — consulte por Grep (nome do item, nome do menu)
> quando precisar, não leia por inteiro.

Mapeamento completo da árvore do menu superior (barra `Cadastros | Consultas
| Movimentos | Relatórios | Rastreabilidade | Configurações | Usuários |
Utilitários | Omni Channel | AppERP | Ajuda`), pedido pelo usuário como
continuação do inventário por número de tela (§ anterior). Script novo e
reutilizável: `scripts/crawlMenu.mjs [menu...]` — clica cada `MenuItem`,
diffa a árvore por `RuntimeId` antes/depois pra achar filhos novos, recursa em
itens com `ExpandCollapseState`, salva `tests/fixtures/menu-map/<menu>.json`
(formato `{name, automationId, leaf: true}` ou `{name, automationId,
submenu: [...]}`). Roda de novo com segurança (pula menus já salvos).

**Escopo desta rodada**: só a ESTRUTURA (nomes + hierarquia) foi levantada —
as 251 telas-folha descobertas NÃO foram abertas/dumpadas individualmente
(decisão do usuário, 2026-10-08: o mapa de navegação já é a entrega; abrir
fisicamente cada uma ficaria pra sob demanda/prioridade futura). Comparar com
§ "Inventário de telas por número" acima, que cobriu 7 telas em profundidade
total (seletores reais, screenshot, estrutura UIA).

| Menu | Telas-folha | Submenus | Observação |
|---|---|---|---|
| Cadastros | 148 | 33 | Maior de longe — cadastros mestres do domínio (clientes, fornecedores, funcionários, produtos, animais, etc.) |
| Movimentos | 79 | 21 | Operações do dia a dia (atendimento/venda, caixa, financeiro, estoque, documentos fiscais) |
| Configurações | 8 | 1 | — |
| Consultas | 6 | 2 | — |
| Rastreabilidade | 0 (comando direto) | 0 | **Não é dropdown** — clicar abre a tela `267 - Rastreabilidade de processos` direto. Achado-armadilha do crawler: tentar tratá-lo como submenu capturou o menu-de-sistema da JANELA RECÉM-ABERTA (Restaurar/Mover/Minimizar/etc.) como se fosse conteúdo real — descartado, ver §10.6. |
| Relatórios | 4 | 0 | Relatórios do sistema, Rótulos, Etiquetas, Abrir arquivo RPF |
| Usuários | 4 (manual) | 0 | Dropdown "estilo ícone" (ver achado abaixo) — Alterar senha, Permissões, Status de conexão, Gerenciamento de senhas |
| Utilitários | 8 (manual) | 0 | Dropdown "estilo ícone" — Autocorreção, Calculadora, Gerenciador de FTP, Teclado Virtual, Retirar acentos, Unificar cadastros, Atualizar sistema, Atualizar SGBD |
| Omni Channel | 7 (manual) | 3 | Dropdown misto (nativo + ícone) — ver §10.6 |
| AppERP | 4 (manual) | 1 | Dropdown "estilo ícone" — Contato/solicitação, Boleto EnterpriseERP, Liberação do sistema, Sistema (▶ não explorado, ver achado) |
| Ajuda | 5 (manual) | 0 | Dropdown "estilo ícone" — Acesso remoto, Suporte, Treinamentos, Notas da versão, Sobre |

**Achado técnico — dois estilos de menu distintos no mesmo app**:
- **Nativo** (Cadastros, Consultas, Movimentos, Relatórios, Configurações):
  `MenuItem` padrão do Win32, todo item tem `Name` preenchido — é o que o
  crawler automatizado consegue mapear de ponta a ponta via XPath
  `//MenuItem[@Name="..."]`.
- **"Estilo ícone"** (Usuários, Utilitários, AppERP, Ajuda, e parte de Omni
  Channel): dropdown com ícones coloridos (visualmente diferente — ver
  screenshots em `tests/fixtures/menu-probe/click-*.png`). Os itens aparecem
  como `<MenuItem ... Name="" .../>` — **sem nome acessível nenhum via UI
  Automation** (nem `Name`, nem `HelpText`, nem `ItemStatus`). Só têm
  `AutomationId` numérico pequeno (ex.: `475`, `476`) que PARECE estável
  (padrão de id de recurso compilado, não handle de runtime) mas não foi
  validado entre execuções. **Implicação pra teste futuro**: não dá pra
  clicar esses itens por `Name` — só por posição (`x`/`y` do dump) ou,
  melhor, descobrir se o `AutomationId` numérico é realmente estável
  rodando o app de novo e comparando. Rotulagem desses itens nesta seção foi
  feita por leitura visual do screenshot, não por extração automatizada.
- **Achado-armadilha do crawler**: quando um top-menu é na verdade um
  **comando direto** (não um dropdown — caso `Rastreabilidade`), a tela nova
  que ele abre tem seu próprio ícone de "menu de sistema" da janela
  (`Name="Sistema"`, `ExpandCollapseState="Collapsed"`) — o diff do crawler
  confunde isso com um item de submenu legítimo. Resultado espúrio
  descartado manualmente (ver `Rastreabilidade.json`, agora anotado como
  "comando direto"). Antes de confiar cegamente num resultado "1 item
  chamado Sistema com Restaurar/Mover/Minimizar/Maximizar/Fechar" de
  qualquer menu, **suspeitar que é esse artefato**, não um submenu real.

Dumps brutos de cada dropdown "estilo ícone" (screenshot): `tests/fixtures/
menu-probe/click-Usuários.png`, `click-Utilitários.png`, `click-AppERP.png`,
`click-Ajuda.png`, `click-Omni Channel.png`.

### 10.1 Cadastros (148 telas-folha, 33 submenus)

- **Animais**
  - Ficha do animal
  - Cor
  - Espécies
  - Pelagem
  - Porte
  - Raça
- **Atendimentos**
  - Horários
  - Operações
  - Origens
  - Processos de produção/ rastreabilidade
  - Setores de venda
  - **Forma farmacêutica**
    - Ficha da forma farmacêutica
    - Laboratórios
    - Tipos de uso
    - Tipos de forma farmacêutica
    - Índices de valores
- Bairros
- Cidades
- **Entregas em domicílio**
  - Ocorrências
  - Períodos de entrega
  - Regiões de entrega
- **Clientes**
  - Ficha do cliente
  - Convênios
  - Pós venda (Programação)
  - Classificação movimentação
  - Classificação pós venda
  - Índices de desconto
  - Profissões
- **Fornecedores**
  - Ficha do fornecedor
  - Índices de avaliação
- **Funcionários**
  - Ficha do funcionário
  - Áreas
  - Departamentos
  - Funções
  - **Comissões**
    - Vendas
    - Vendas por classe de produto
    - Vendas por grupo de produto
    - Vendas por linha de produto
    - Produção laboratório
    - Visita médica
  - **Metas**
    - Metas - Vendas
    - Metas - Produção
  - Férias
  - **Folha de pagamento**
    - Índices de tabelas
    - Lançamentos
    - Parâmetros p/ cálculo
  - **Folha de ponto**
    - Horários
    - Justificativas
  - Atas de reunião
  - **Processos**
    - Ficha do processo
    - Ítens do processo
- **Franquias**
  - Conexões
  - Empresas
  - Enviar dados
- Lojas
- **Prescritores**
- **Perfil**
- **Questionários**
- Feriados
- **Financeiro**
- **Grupos**
- **Informações fiscais**
- **Produtos**
  - **Insumo (Alopatia)**
  - **Insumo (Homeopatia)**
    - Graduação alcoolica
    - Dinamização em estoque
  - **Embalagem (Frasco, cápsula e outros)**
    - Ficha do produto
    - Tipos de embalagem
    - Vínculo forma farmacêutica/ embalagem
    - Vínculo matéria prima/ tipo de embalagem
    - Volumes
  - **Revenda**
    - Ficha do produto
    - Atualizar desconto máximo
    - Importação de tabelas
    - Promoções
    - Tabela de preços
    - Ficha do programa benefício
  - **Bens, componentes e outros**
    - Ficha do produto
    - **Equipamentos**
      - Ficha do equipamento
  - **Detalhes ficha do produto**
    - Categorias
    - Classes
    - Classificações
    - Códigos NCM
    - Fabricantes
    - Linhas
    - Listas de controle especial
    - Localizações de estoques
    - Marcas
    - Origens
    - Portarias
    - Tipos de estoque
  - Desconto por tipo de produto
  - **Formação de preços**
    - Cadastro de índices
    - Cálculo do markup/ Margem de lucro
    - Atualização de produtos
  - Incluir/ alterar estoque
  - Configuração de estoque mín. e máx.
  - Estoque detalhado
  - Histórico de compra
  - Histórico de estoque
  - Histórico de preços
  - Produção interna
  - **Laudo interno**
    - Testes
- Termos LGPD

### 10.2 Movimentos (79 telas-folha, 21 submenus)

- **Atendimento**
  - Receita
  - Revenda
  - Refazer
  - **Delivery**
    - Entregas e coletas
    - Lote de entregas e coletas
    - Lista de entregas e coletas
    - Painel de entregas e coletas
  - **Pós venda**
    - Lista de clientes
    - Registrar pós venda
    - Correção da data de retorno
  - **PBM's**
    - Autorizar
    - Consultar
- **Caixa**
  - PDV Frente de caixa
  - Conferência de caixa
  - Movimentações de caixas
- Comunicação interna/ S.A.C.
- Questionários
- Manutenção de equipamentos
- **Fornecedores**
  - Avaliar fornecedor
  - Credenciar fornecedor
- **Funcionários**
  - Comissões
  - **Metas**
    - Loja
    - Funcionário
    - Setor de Venda
    - Produção
  - Folha de pagamento
  - **Folha de ponto**
    - Lista de registro de ponto
    - Ficha do registro de ponto
  - Processos
  - Plano de ação
- **Prescritores**
  - Controle de visitas
  - Lista de visitas médicas
  - Análise de visitas médicas (3 meses)
  - Análise de visitas médicas (13 meses)
- **Financeiro**
  - Consulta de lançamentos
  - Contas pag/ rec
  - Parcelamento de contas
  - Fatura de convênios
  - **Contas**
    - Movimentação
    - Transferência
  - Conciliação (Cielo e Rede)
  - **Controle de boletos**
  - Controle de cartões
  - Controle de cheques
  - Controle de pagamentos
  - Fluxo de Caixa
- Curva ABC
- **Produtos**
  - **Compras**
    - Cotações
    - Importar NFe
    - Atualização de preços
    - Registro de lotes e estoques
  - Gerenciamento de faltas
  - Movimentação de estoques
  - Remanejamento de estoque
  - Separação de produtos - Delivery
  - Baixa de fórmulas
  - **Controle de qualidade**
    - Laudo interno
    - Peso médio
    - Conferência de processos
  - Horários dos laboratórios
  - Produção interna
  - Gerar estoque mínimo/ máximo
  - Reajuste de preços
  - Siproquim
  - **SNGPC**
    - Livro de controlados
    - Inventário
  - Captação de dados - Close-UP e IMS
  - Histórico do estoque (Lote LA)
- **Documentos Fiscais**
  - **NF-e**
    - Lista de documentos fiscais
    - NF-e - Notas fiscais
    - NF-e - Simples Remessa
  - **NFC-e**
    - Lista de documentos fiscais
  - **NFS-e**
    - Lista de documentos fiscais
    - NFS-e - Nota Fiscal de Serviço
  - EFD/ Sintegra
- Notas fiscais de serviços
- Resumo de vendas
- Resumo do financeiro
- Resumo de movimentações
- Análise do resultado do financeiro

### 10.3 Consultas (6 telas-folha, 2 submenus)

- Consultas do sistema
- **Produtos**
  - Consulta de produtos/ imagens
- **Movimentações**
  - Atendimento
  - Entrega/ coleta
  - Financeiro
  - Descontos concedidos

### 10.4 Relatórios (4 telas-folha, sem submenu)

- Relatórios do sistema
- Rótulos
- Etiquetas
- Abrir arquivo RPF

### 10.5 Configurações (8 telas-folha, 1 submenu)

- Atendimento
- e-Mails
- **Balança**
  - Posto
  - Agentes
  - Local
- CEP
- Sistema
- Personalizar menu rápido

### 10.6 Menus "estilo ícone" (Usuários, Utilitários, Omni Channel, AppERP, Ajuda, Rastreabilidade)

Levantado manualmente por screenshot (ver achado técnico em §10.0) — sem
seletor por `Name` disponível, exceto onde indicado.

- **Rastreabilidade** — comando direto (não é dropdown), abre
  `267 - Rastreabilidade de processos`.
- **Usuários**: Alterar senha · Permissões · _(separador)_ · Status de
  conexão · _(separador)_ · Gerenciamento de senhas.
- **Utilitários**: Autocorreção · Calculadora · Gerenciador de FTP · Teclado
  Virtual · _(separador)_ · Retirar acentos · Unificar cadastros ·
  _(separador)_ · Atualizar sistema · _(separador)_ · Atualizar SGBD.
- **AppERP**: Contato/ solicitação · Boleto EnterpriseERP · _(separador)_ ·
  Liberação do sistema · _(separador)_ · **Sistema ▶** (não explorado — a
  tentativa de clicar colidiu com o menu de sistema da própria janela,
  mesmo artefato do achado-armadilha acima; precisa de clique por
  coordenada, não por `Name`).
- **Ajuda**: Acesso remoto · _(separador)_ · Suporte · Treinamentos ·
  _(separador)_ · Notas da versão · _(separador)_ · Sobre.
- **Omni Channel** (dropdown misto): **Cadastros ▶** (compartilha a mesma
  árvore nativa do menu `Cadastros` de topo — único item deste dropdown com
  `Name` real, por isso o crawler automatizado achou exatamente 1 item) ·
  Aplicativo · **e-Commerce ▶** (não explorado, estilo ícone) ·
  _(separador)_ · Consultas, gráficos e relatórios · **Configurações ▶**
  (não explorado, estilo ícone) · _(separador)_ · Painel de vendas ·
  Atendimentos.

### 10.7 Pendências do mapa de menu

- ~~As 251 telas-folha de §10.1-10.5 (+ as de §10.6) foram só MAPEADAS~~ —
  **atualizado**: as 245 telas de §10.1-10.5 (menus nativos) foram abertas
  uma a uma e catalogadas (número + descrição) em §11, por pedido explícito
  do usuário feito logo depois. Só os itens "estilo ícone" de §10.6 (~20
  itens) continuam pendentes de abertura física.
- `AppERP > Sistema`, `Omni Channel > e-Commerce`, `Omni Channel >
  Configurações`: não exploradas (itens "estilo ícone" sem seletor por
  `Name` fácil, precisam de clique por coordenada).
- Validar se o `AutomationId` numérico pequeno dos itens "estilo ícone" (ex.:
  `475`) é realmente estável entre execuções antes de usá-lo como seletor em
  teste real — não testado nesta sessão.

## 11. Catálogo completo de telas (número + descrição, 2026-10-08)

> **Consultar só sob demanda, ao escrever um teste pra uma tela específica —
> NÃO ler esta seção inteira no início de sessão** (pedido explícito do
> usuário). Use Grep pelo número da tela, pelo nome do menu, ou por uma
> palavra do caminho/descrição.

Catálogo gerado abrindo as 245 telas-folha dos menus NATIVOS (§10.1-10.5:
Cadastros, Movimentos, Consultas, Relatórios, Configurações) uma por uma —
script `scripts/catalogScreens.mjs` (novo, reutilizável e resumível): reabre
a cadeia de menu até o item, clica, espera ~900ms, lê o `<Window>` novo que
apareceu (`Name` = título real da tela, de onde se extrai o número `[ NNN ]`
e a descrição), tira screenshot, fecha pelo botão `Close` do frame filho
(mesmo padrão de §10 — primeiro de dois botões `AutomationId="Close"`), e
segue pro próximo. Dados brutos: `tests/fixtures/screen-catalog.jsonl` (1
registro JSON por linha, com `newWindows`, `screenshotPath`); screenshots em
`tests/fixtures/screen-catalog-shots/`.

**Metodologia da "descrição"**: é o título real da janela que abriu (texto
que o próprio app usa, não uma inferência livre) — sempre no formato
`[ NNN ] - <descrição>` quando a tela é numerada. Não abri nenhum campo nem
cliquei em botão de ação (Gravar/Excluir/etc.) dentro das telas — só
naveguei até elas e fechei, mesma disciplina de segurança das 7 telas
originais (§ "Inventário de telas por número").

**Achados técnicos da rodada em lote (245 itens, ~1h de execução)**:
- **Resiliência por sessão**: o crawl roda numa única sessão Appium até
  travar; quando trava, detecta (3 erros consecutivos = sessão presumida
  morta), relança o app inteiro (novo login) e continua dos itens que
  faltam — sem isso, uma trava no meio formava uma cascata de centenas de
  falhas em sequência (achado real, aconteceu na primeira tentativa antes do
  fix: toda tentativa de clique falhava do mesmo jeito até o processo
  morrer, porque a conexão com o WinAppDriver já tinha caído silenciosamente
  mas o script continuava tentando).
  - **Resume correto**: só um item SEM erro conta como "feito" — um item
    que falhou fica pendente de novo na próxima sessão (bug corrigido
    durante esta rodada: a 1ª versão marcava até os itens com erro como
    concluídos, perdendo-os pra sempre).
- **Resultado final: 245/245 com sucesso** (todo item que falhou em algum
  momento foi reprocessado e completado numa sessão seguinte). 11 falhas
  transitórias no total, todas recuperadas.
- **7 itens sem `[ NNN ]` no título**: ou porque o título real não tem
  número (ex.: "Rótulos", "Consultas/ relatórios do sistema") ou porque
  nenhuma janela nova foi detectada (`Cadastros > Franquias > Conexões`,
  `Cadastros > Produtos > Insumo (Homeopatia) > Formação de preços`,
  `Configurações > Sistema`) — não investigado a fundo, pode ser ação
  instantânea sem tela, ou diálogo nativo (fora da árvore UIA da janela
  principal, por isso invisível ao diff).
- **1 linha suspeita/não confiável**: `Relatórios > Abrir arquivo RPF`
  registrou a tela `279 - Atendimento ao cliente - Delivery`, que não faz
  sentido pro item (provavelmente deveria abrir um diálogo nativo de
  "abrir arquivo", fora da árvore UIA, e o diff pegou uma janela
  remanescente por engano) — **não confiar nessa linha sem reconferir**
  manualmente antes de usar em teste.

| Nº | Caminho no menu | Descrição (título da tela) |
|---|---|---|
| 295 | Cadastros > Animais > Ficha do animal | Cadastro de animais |
| 314 | Cadastros > Animais > Cor | Cadastro de cores |
| 313 | Cadastros > Animais > Espécies | Cadastro de espécies |
| 315 | Cadastros > Animais > Pelagem | Cadastro de pelagens |
| 316 | Cadastros > Animais > Porte | Cadastro de portes |
| 292 | Cadastros > Animais > Raça | Cadastro de raças |
| 050 | Cadastros > Atendimentos > Horários | Cadastro de horários do laboratório |
| 048 | Cadastros > Atendimentos > Operações | Cadastro de operações |
| 653 | Cadastros > Atendimentos > Origens | Cadastro de origens - Atendimento |
| 229 | Cadastros > Atendimentos > Processos de produção/ rastreabilidade | Cadastro de processos de produção/ rastreabilidade |
| 282 | Cadastros > Atendimentos > Setores de venda | Cadastro de setores de venda |
| 106 | Cadastros > Atendimentos > Forma farmacêutica > Ficha da forma farmacêutica | Cadastro de formas farmacêuticas |
| 417 | Cadastros > Atendimentos > Forma farmacêutica > Laboratórios | Cadastro de laboratórios |
| 108 | Cadastros > Atendimentos > Forma farmacêutica > Tipos de uso | Cadastro de tipos de uso |
| 692 | Cadastros > Atendimentos > Forma farmacêutica > Tipos de forma farmacêutica | Cadastro de tipos de forma farmacêutica |
| 708 | Cadastros > Atendimentos > Forma farmacêutica > Índices de valores | Cadastro de índices p/ forma farmacêutica |
| 009 | Cadastros > Bairros | Cadastro de bairros |
| 010 | Cadastros > Cidades | Cadastro de cidades |
| 704 | Cadastros > Entregas em domicílio > Ocorrências | Cadastro de ocorrências - Delivery |
| 028 | Cadastros > Entregas em domicílio > Períodos de entrega | Cadastro de períodos de entrega |
| 030 | Cadastros > Entregas em domicílio > Regiões de entrega | Cadastro de regiões de entrega |
| 046 | Cadastros > Clientes > Ficha do cliente | Cadastro de clientes |
| 064 | Cadastros > Clientes > Convênios | Convênios de clientes |
| 066 | Cadastros > Clientes > Pós venda (Programação) | Programação de pós venda do cliente |
| 468 | Cadastros > Clientes > Classificação movimentação | Cadastro de classificação de movimentação |
| 469 | Cadastros > Clientes > Classificação pós venda | Cadastro de classificação de pós venda |
| 067 | Cadastros > Clientes > Índices de desconto | Índices de desconto |
| 095 | Cadastros > Clientes > Profissões | Cadastro de profissões |
| 032 | Cadastros > Fornecedores > Ficha do fornecedor | Cadastro de fornecedores |
| 034 | Cadastros > Fornecedores > Índices de avaliação | Cadastro de índices de avaliação |
| 007 | Cadastros > Funcionários > Ficha do funcionário | Cadastro de funcionários |
| 168 | Cadastros > Funcionários > Áreas | Cadastro de áreas |
| 099 | Cadastros > Funcionários > Departamentos | Cadastro de departamentos |
| 097 | Cadastros > Funcionários > Funções | Cadastro de funções |
| 017 | Cadastros > Funcionários > Comissões > Vendas | Cadastro de comissões - Vendas |
| 012 | Cadastros > Funcionários > Comissões > Vendas por classe de produto | Cadastro de comissões - Classe de produto |
| 013 | Cadastros > Funcionários > Comissões > Vendas por grupo de produto | Cadastro de comissões - Grupo de produto |
| 014 | Cadastros > Funcionários > Comissões > Vendas por linha de produto | Cadastro de comissões - Linha de produto |
| 008 | Cadastros > Funcionários > Comissões > Produção laboratório | Cadastro de comissões - Produção laboratório |
| 006 | Cadastros > Funcionários > Comissões > Visita médica | Cadastro de comissões - Visita médica |
| 491 | Cadastros > Funcionários > Metas > Metas - Vendas | Cadastro de metas de funcionários |
| 625 | Cadastros > Funcionários > Metas > Metas - Produção | Cadastro de Metas - Produção |
| 020 | Cadastros > Funcionários > Férias | Cadastro de férias |
| 476 | Cadastros > Funcionários > Folha de pagamento > Índices de tabelas | Cadastro de índices de tabelas |
| 065 | Cadastros > Funcionários > Folha de pagamento > Lançamentos | Cadastro de lançamentos para folha de pagamento |
| 141 | Cadastros > Funcionários > Folha de pagamento > Parâmetros p/ cálculo | Parâmetros para cálculo da folha de pagamento |
| 019 | Cadastros > Funcionários > Folha de ponto > Horários | Cadastro de folha de ponto de funcionários |
| 194 | Cadastros > Funcionários > Folha de ponto > Justificativas | Cadastro de justificativas |
| 170 | Cadastros > Funcionários > Atas de reunião | Cadastro de atas de reunião |
| 176 | Cadastros > Funcionários > Processos > Ficha do processo | Cadastro de processos |
| 199 | Cadastros > Funcionários > Processos > Ítens do processo | Ítens do processo |
| 174 | Cadastros > Funcionários > Treinamentos > Ficha do treinamento | Cadastro de treinamentos |
| 172 | Cadastros > Funcionários > Treinamentos > Classificação | Cadastro de classificação de treinamentos |
| — | Cadastros > Franquias > Conexões | (nenhuma janela nova detectada) |
| 667 | Cadastros > Franquias > Empresas | Franquias - Empresas |
| 668 | Cadastros > Franquias > Enviar dados | Franqueado - Enviar dados |
| 005 | Cadastros > Lojas | Cadastro de lojas |
| 036 | Cadastros > Prescritores > Ficha do prescritor | Cadastro de prescritores |
| 322 | Cadastros > Prescritores > Conselhos regionais | Cadastro de conselhos regionais |
| 040 | Cadastros > Prescritores > Especialidades | Cadastro de especialidades |
| 042 | Cadastros > Prescritores > Locais de atendimento | Cadastro de locais de atendimento do médico |
| 478 | Cadastros > Prescritores > Secretárias | Cadastro de secretária(o) do médico |
| 430 | Cadastros > Prescritores > Locais de atendimento do prescritor | Vínculo do prescritor com o local de atendimento |
| 201 | Cadastros > Prescritores > Representantes do prescritor | Vínculo do prescritor com o representante |
| 457 | Cadastros > Perfil > Itens do perfil | Cadastro de itens do perfil |
| 511 | Cadastros > Perfil > Relacionamento | Relacionamento de perfil |
| 188 | Cadastros > Questionários > Ficha do questionário | Cadastro de questionários |
| 061 | Cadastros > Feriados | Cadastro de feriados |
| 056 | Cadastros > Financeiro > Contas pag/ rec > Lançamentos | Cadastro de lançamentos financeiros - contas a pag./ rec. |
| 058 | Cadastros > Financeiro > Contas pag/ rec > Lançamentos programados | Programar lançamentos de contas a pagar e receber |
| 105 | Cadastros > Financeiro > Contas pag/ rec > Rateio entre lojas | Cadastros de rateio por loja |
| 091 | Cadastros > Financeiro > Contas pag/ rec > Centro de custo/ receita | Cadastro de centro de custo e receita |
| 054 | Cadastros > Financeiro > Contas pag/ rec > Situações | Cadastro de situações |
| 644 | Cadastros > Financeiro > Contas pag/ rec > Fluxo de caixa | Cadastros de fluxo de caixa |
| 646 | Cadastros > Financeiro > Contas pag/ rec > Fluxo de caixa - Relacionamento | Fluxo de caixa - Relacionamentos |
| 003 | Cadastros > Financeiro > Bancários > Bancos | Cadastro de bancos |
| 052 | Cadastros > Financeiro > Bancários > Contas | Cadastro de contas bancárias |
| 059 | Cadastros > Financeiro > Bancários > Lançamentos | Cadastro de lançamentos bancários |
| 249 | Cadastros > Financeiro > Bancários > Cobrança - Boletos | Configuração de boletos bancários |
| 483 | Cadastros > Financeiro > Fidelidade | Fidelidade |
| 521 | Cadastros > Financeiro > PIX | Configurações PIX |
| 011 | Cadastros > Grupos | Cadastro de grupos |
| 001 | Cadastros > Informações fiscais > Alíquotas fiscais | Cadastro de Alíquotas Fiscais |
| 147 | Cadastros > Informações fiscais > Impressoras fiscais | Cadastro de impressora fiscal - ECF |
| 149 | Cadastros > Informações fiscais > Alíquotas /Impressoras fiscais | Cadastro de alíquotas por impressoras fiscais |
| 715 | Cadastros > Informações fiscais > Notas fiscais > Agente - NFS-e | Agente - NFS-e |
| 226 | Cadastros > Informações fiscais > Notas fiscais > Configurações - NF-e/ NFC-e | NF-e | NFC-e - Configurações |
| 228 | Cadastros > Informações fiscais > Notas fiscais > Configurações - NFS-e | NFS-e - Configurações |
| 569 | Cadastros > Informações fiscais > Notas fiscais > Configurações - SAT/ MFE | SAT | MFE - Configurações |
| 238 | Cadastros > Informações fiscais > Notas fiscais > Numeração | Numeração de notas fiscais |
| 584 | Cadastros > Informações fiscais > Notas fiscais > Máquina de cartão (POS/ TEF) | Máquina de cartão (POS/ TEF) |
| 516 | Cadastros > Informações fiscais > Notas fiscais > Tabela de serviços | Tabela de serviços |
| 639 | Cadastros > Informações fiscais > Impostos > CST | Cadastros de CST |
| 166 | Cadastros > Informações fiscais > Impostos > CFOP | Cadastro de cfop |
| 381 | Cadastros > Informações fiscais > Impostos > IBPT | Tabela IBPT |
| 177 | Cadastros > Informações fiscais > Impostos > Natureza de operação | Natureza de operação |
| 236 | Cadastros > Informações fiscais > Impostos > Tabelas de impostos | Cadastro de tabelas de impostos |
| 223 | Cadastros > Informações fiscais > Impostos > Configuração de tabelas de impostos | Configurações de impostos para emissão de documentos fiscais |
| 262 | Cadastros > Informações fiscais > Impostos > Configuração do pis e cofins p/ notas de entrada | Configuração de pis e cofins para notas de entrada |
| 113 | Cadastros > Informações fiscais > Atualização de inf. fiscais | Atualização de informações fiscais |
| 112 | Cadastros > Produtos > Insumo (Alopatia) > Ficha do produto | Cadastro de produtos (Alopatia) |
| 116 | Cadastros > Produtos > Insumo (Alopatia) > Diluentes/ conservantes | Diluentes, conservantes e essências |
| 021 | Cadastros > Produtos > Insumo (Alopatia) > Excipientes | Excipientes |
| 115 | Cadastros > Produtos > Insumo (Alopatia) > Incompatibilidades | Cadastro de incompatibilidades |
| 120 | Cadastros > Produtos > Insumo (Alopatia) > Substituição de bases | Substituição de bases |
| 709 | Cadastros > Produtos > Insumo (Alopatia) > Vínculo forma farmacêutica / Base | Vínculo forma farmacêutica/ base |
| 130 | Cadastros > Produtos > Insumo (Homeopatia) > Ficha do produto | Cadastro de produtos (Homeopatia) |
| — | Cadastros > Produtos > Insumo (Homeopatia) > Formação de preços | (nenhuma janela nova detectada) |
| 299 | Cadastros > Produtos > Insumo (Homeopatia) > Graduação alcoolica | Graduação alcoólica |
| 081 | Cadastros > Produtos > Insumo (Homeopatia) > Dinamização em estoque | Dinamização em estoque |
| 123 | Cadastros > Produtos > Embalagem (Frasco, cápsula e outros) > Ficha do produto | Cadastro de produtos (Embalagem) |
| 078 | Cadastros > Produtos > Embalagem (Frasco, cápsula e outros) > Tipos de embalagem | Cadastro de tipos de embalagem |
| 126 | Cadastros > Produtos > Embalagem (Frasco, cápsula e outros) > Vínculo forma farmacêutica/ embalagem | Vínculo forma farmacêutica com embalagem |
| 161 | Cadastros > Produtos > Embalagem (Frasco, cápsula e outros) > Vínculo matéria prima/ tipo de embalagem | Vínculo matéria prima com tipo de embalagem |
| 125 | Cadastros > Produtos > Embalagem (Frasco, cápsula e outros) > Volumes | Volumes |
| 117 | Cadastros > Produtos > Revenda > Ficha do produto | Cadastro de produtos (Revenda) |
| 288 | Cadastros > Produtos > Revenda > Atualizar desconto máximo | Atualização de desconto máximo |
| 119 | Cadastros > Produtos > Revenda > Importação de tabelas | Importação de tabela de preços |
| 493 | Cadastros > Produtos > Revenda > Promoções | Cadastro de promoções |
| 496 | Cadastros > Produtos > Revenda > Tabela de preços | Cadastro de tabelas de preços |
| 253 | Cadastros > Produtos > Revenda > Ficha do programa benefício | Cadastro de programas benefícios ( PBM ) |
| 252 | Cadastros > Produtos > Bens, componentes e outros > Ficha do produto | Cadastro de produtos (Patrimônio e material de consumo) |
| 180 | Cadastros > Produtos > Bens, componentes e outros > Equipamentos > Ficha do equipamento | Cadastro de equipamentos |
| 070 | Cadastros > Produtos > Detalhes ficha do produto > Categorias | Cadastro de categorias |
| 074 | Cadastros > Produtos > Detalhes ficha do produto > Classes | Cadastro de classes |
| 464 | Cadastros > Produtos > Detalhes ficha do produto > Classificações | Cadastro de classificações |
| 244 | Cadastros > Produtos > Detalhes ficha do produto > Códigos NCM | Cadastro de códigos ncm |
| 348 | Cadastros > Produtos > Detalhes ficha do produto > Fabricantes | Cadastro de fabricantes |
| 076 | Cadastros > Produtos > Detalhes ficha do produto > Linhas | Cadastro de linhas |
| 072 | Cadastros > Produtos > Detalhes ficha do produto > Listas de controle especial | Cadastro de listas de controle especial |
| 104 | Cadastros > Produtos > Detalhes ficha do produto > Localizações de estoques | Cadastro de localizações de estoque |
| 572 | Cadastros > Produtos > Detalhes ficha do produto > Marcas | Cadastro de marcas |
| 038 | Cadastros > Produtos > Detalhes ficha do produto > Origens | Cadastro de origens |
| 068 | Cadastros > Produtos > Detalhes ficha do produto > Portarias | Cadastro de portarias |
| 102 | Cadastros > Produtos > Detalhes ficha do produto > Tipos de estoque | Cadastro de tipos de estoque |
| 647 | Cadastros > Produtos > Desconto por tipo de produto | Cadastro de descontos por detalhes do produto e funcionário |
| 656 | Cadastros > Produtos > Formação de preços > Cadastro de índices | Formação de preços - Cadastro de índices |
| 659 | Cadastros > Produtos > Formação de preços > Cálculo do markup/ Margem de lucro | Formação de preços - Cálculo de markup e margem de lucro |
| 660 | Cadastros > Produtos > Formação de preços > Atualização de produtos | Formação de preços - Atualização de produtos |
| 216 | Cadastros > Produtos > Incluir/ alterar estoque | Incluir/ alterar lotes e estoques |
| 305 | Cadastros > Produtos > Configuração de estoque mín. e máx. | Configuração de estoque mínimo e máximo |
| 160 | Cadastros > Produtos > Estoque detalhado | Estoque detalhado |
| 118 | Cadastros > Produtos > Histórico de compra | Histórico de compras |
| 133 | Cadastros > Produtos > Histórico de estoque | Histórico da movimentação do estoque |
| 114 | Cadastros > Produtos > Histórico de preços | Histórico de preços |
| 128 | Cadastros > Produtos > Produção interna | Produção interna |
| 432 | Cadastros > Produtos > Laudo interno > Testes | Cadastro de testes para o laudo interno de análise |
| 679 | Cadastros > Termos LGPD | Cadastro de Termos LGPD |
| 145 | Movimentos > Atendimento > Receita | Atendimento ao cliente - Receita |
| 232 | Movimentos > Atendimento > Revenda | Atendimento ao cliente - Revenda |
| 378 | Movimentos > Atendimento > Refazer | Atendimento ao cliente - Refazer |
| 279 | Movimentos > Atendimento > Delivery > Entregas e coletas | Atendimento ao cliente - Delivery |
| 190 | Movimentos > Atendimento > Delivery > Lote de entregas e coletas | Lote de entregas e coletas |
| 318 | Movimentos > Atendimento > Delivery > Lista de entregas e coletas | Lista de entregas/ coletas |
| 605 | Movimentos > Atendimento > Delivery > Painel de entregas e coletas | Delivery - Painel de movimentos |
| 071 | Movimentos > Atendimento > Pós venda > Lista de clientes | Lista de clientes pós venda |
| 073 | Movimentos > Atendimento > Pós venda > Registrar pós venda | Atendimento ao cliente - Pós venda |
| 210 | Movimentos > Atendimento > Pós venda > Correção da data de retorno | Correção da data de retorno |
| 346 | Movimentos > Atendimento > PBM's > Autorizar | Programa benefício de medicamentos - Autorização |
| 622 | Movimentos > Atendimento > PBM's > Consultar | Programa benefício de medicamentos - Consulta |
| 395 | Movimentos > Caixa > PDV Frente de caixa | PDV Frente de caixa |
| 131 | Movimentos > Caixa > Conferência de caixa | Conferência de caixa |
| 139 | Movimentos > Caixa > Movimentações de caixas | Movimentações de caixas |
| 186 | Movimentos > Comunicação interna/ S.A.C. | Comunicação interna/ Sac |
| 197 | Movimentos > Questionários | Questionários |
| 069 | Movimentos > Manutenção de equipamentos | Manutenção de equipamentos |
| 286 | Movimentos > Fornecedores > Avaliar fornecedor | Avaliar fornecedor |
| 394 | Movimentos > Fornecedores > Credenciar fornecedor | Credenciar fornecedor |
| 041 | Movimentos > Funcionários > Comissões | Comissões |
| 029 | Movimentos > Funcionários > Metas > Loja | Metas por loja |
| 580 | Movimentos > Funcionários > Metas > Funcionário | Metas por funcionário |
| 579 | Movimentos > Funcionários > Metas > Setor de Venda | Metas por setores de venda |
| 626 | Movimentos > Funcionários > Metas > Produção | Metas - Produção |
| 142 | Movimentos > Funcionários > Folha de pagamento | Folha de pagamento |
| 565 | Movimentos > Funcionários > Folha de ponto > Lista de registro de ponto | Lista de registro de ponto |
| 340 | Movimentos > Funcionários > Folha de ponto > Ficha do registro de ponto | Ficha da folha de ponto |
| 178 | Movimentos > Funcionários > Processos | Processos de funcionários |
| 206 | Movimentos > Funcionários > Plano de ação | Plano de ação |
| 093 | Movimentos > Prescritores > Controle de visitas | Controle de visitas |
| 592 | Movimentos > Prescritores > Lista de visitas médicas | Lista de visitas médicas |
| 593 | Movimentos > Prescritores > Análise de visitas médicas (3 meses) | Análise de visitas médicas |
| 594 | Movimentos > Prescritores > Análise de visitas médicas (13 meses) | Análise de visitas médicas (13 meses) |
| 611 | Movimentos > Financeiro > Consulta de lançamentos | Consulta de lançamentos (Crédito / Débito) |
| 089 | Movimentos > Financeiro > Contas pag/ rec | Contas a pagar/ receber |
| 610 | Movimentos > Financeiro > Parcelamento de contas | Parcelamento de contas - Gerar parcelas |
| 140 | Movimentos > Financeiro > Fatura de convênios | Fatura de convênios |
| 086 | Movimentos > Financeiro > Contas > Movimentação | Movimentação de conta |
| 612 | Movimentos > Financeiro > Contas > Transferência | Movimentação de conta - Transferência |
| 530 | Movimentos > Financeiro > Conciliação (Cielo e Rede) | Conciliação (Cielo e Rede) |
| 371 | Movimentos > Financeiro > Controle de cartões | Controle de cartões |
| 354 | Movimentos > Financeiro > Controle de cheques | Controle de cheques |
| 669 | Movimentos > Financeiro > Controle de pagamentos | Controle de Pagamentos |
| 645 | Movimentos > Financeiro > Fluxo de Caixa | Financeiro - Fluxo de Caixa |
| 380 | Movimentos > Curva ABC | Curva ABC |
| 135 | Movimentos > Produtos > Compras > Cotações | Cotações |
| 218 | Movimentos > Produtos > Compras > Importar NFe | Importar NF-e |
| 144 | Movimentos > Produtos > Compras > Atualização de preços | Atualização de preços |
| 155 | Movimentos > Produtos > Compras > Registro de lotes e estoques | Registro de lotes e estoques |
| 375 | Movimentos > Produtos > Gerenciamento de faltas | Gerenciamento de produtos em falta |
| 425 | Movimentos > Produtos > Movimentação de estoques | Movimentação de estoque |
| 298 | Movimentos > Produtos > Remanejamento de estoque | Remanejamento de estoque |
| 525 | Movimentos > Produtos > Separação de produtos - Delivery | Separação de produtos p/ delivery |
| 433 | Movimentos > Produtos > Baixa de fórmulas | Baixa de fórmulas (Receita) |
| 470 | Movimentos > Produtos > Controle de qualidade > Laudo interno | Laudo interno |
| 084 | Movimentos > Produtos > Controle de qualidade > Peso médio | Peso médio - Receita |
| 600 | Movimentos > Produtos > Controle de qualidade > Conferência de processos | Conferência de processos a realizar |
| 202 | Movimentos > Produtos > Horários dos laboratórios | Horários dos laboratórios |
| 237 | Movimentos > Produtos > Produção interna | Produção interna |
| 264 | Movimentos > Produtos > Gerar estoque mínimo/ máximo | Gerar estoques mínimo/ máximo |
| 373 | Movimentos > Produtos > Reajuste de preços | Reajustar preços |
| 634 | Movimentos > Produtos > Siproquim | Siproquim |
| 109 | Movimentos > Produtos > SNGPC > Livro de controlados | Sngpc - Livro de controlados |
| 143 | Movimentos > Produtos > SNGPC > Inventário | Inventário SNGPC - Livro de controlados |
| 179 | Movimentos > Produtos > Captação de dados - Close-UP e IMS | Captação de dados - Close Up e IMS |
| 133 | Movimentos > Produtos > Histórico do estoque (Lote LA) | Histórico da movimentação do estoque do lote LA |
| 444 | Movimentos > Documentos Fiscais > NF-e > Lista de documentos fiscais | NF-e - Lista de documentos fiscais |
| 132 | Movimentos > Documentos Fiscais > NF-e > NF-e - Notas fiscais | Nota fiscal (Compra) |
| 227 | Movimentos > Documentos Fiscais > NF-e > NF-e - Simples Remessa | NF-e - Simples remessa |
| 606 | Movimentos > Documentos Fiscais > NFC-e > Lista de documentos fiscais | NFC-e - Lista de documentos fiscais |
| 616 | Movimentos > Documentos Fiscais > NFS-e > Lista de documentos fiscais | NFS-e - Lista de documentos fiscais |
| 429 | Movimentos > Documentos Fiscais > NFS-e > NFS-e - Nota Fiscal de Serviço | NFS-e - Nota fiscal de serviço eletrônica |
| 164 | Movimentos > Documentos Fiscais > EFD/ Sintegra | Vendas do período (efd e sintegra) |
| 261 | Movimentos > Notas fiscais de serviços | Notas fiscais de serviços (água, energia, gás, comunicação e telecomunicação) |
| 035 | Movimentos > Resumo de vendas | Resumo de vendas |
| 551 | Movimentos > Resumo do financeiro | Resumo do financeiro |
| 230 | Movimentos > Resumo de movimentações | Resumo de movimentações |
| 254 | Movimentos > Análise do resultado do financeiro | Análise do resultado do financeiro |
| — | Consultas > Consultas do sistema | Consultas/ relatórios do sistema |
| 355 | Consultas > Produtos > Consulta de produtos/ imagens | Consulta de produtos/ imagens |
| 391 | Consultas > Movimentações > Atendimento | Consultar movimentação do atendimento |
| 499 | Consultas > Movimentações > Entrega/ coleta | Consultar movimentação do delivery |
| 101 | Consultas > Movimentações > Financeiro | Consultar movimentação do financeiro |
| 657 | Consultas > Movimentações > Descontos concedidos | Consulta de descontos concedidos |
| — | Relatórios > Relatórios do sistema | Consultas/ relatórios do sistema |
| — | Relatórios > Rótulos | Rótulos |
| 211 | Relatórios > Etiquetas | Etiquetas de revenda |
| 279 | Relatórios > Abrir arquivo RPF | Atendimento ao cliente - Delivery |
| 146 | Configurações > Atendimento | Configurações do atendimento |
| 413 | Configurações > e-Mails | Configurações - e-Mails |
| 710 | Configurações > Balança > Posto | Configurações da balança - Postos |
| 711 | Configurações > Balança > Agentes | Configurações da balança - Agentes |
| — | Configurações > Balança > Local | Configurações da balança |
| 684 | Configurações > CEP | Configurações do CEP |
| — | Configurações > Sistema | (nenhuma janela nova detectada) |
| 171 | Configurações > Personalizar menu rápido | Personalizar menu rápido |
### 11.1 Menus "estilo ícone" + Rastreabilidade (2026-10-08, continuação)

Catálogo das ~22 telas dos menus "estilo ícone" (Usuários, Utilitários,
AppERP, Ajuda, Omni Channel) + o item direto `Rastreabilidade` (ver §10.0/
§10.6 pros achados sobre por que esses itens não têm `Name`). Script:
`scripts/catalogIconMenus.mjs` (novo) — mesma mecânica de
`catalogScreens.mjs`, mas clica por `AutomationId` (numérico, estável) em
vez de `Name` (vazio nesses itens). Dados brutos:
`tests/fixtures/screen-catalog-icon.jsonl`.

**Itens pulados de propósito (risco de ação real, não só abrir tela)**:
`Utilitários > Atualizar sistema` e `Utilitários > Atualizar SGBD` —
identificados pela posição (y) na lista, não clicados.

**4 itens NÃO explorados** (sem `Name` nem `AutomationId` — nem
clique-por-atributo nem XPath estável funcionam, só coordenada x/y, que é
frágil e muda a cada resolução/tema): `Omni Channel > Aplicativo` (que por
sua vez é OUTRO submenu com `Cadastros`/`Consultas`, confirmado só
visualmente, não aberto) e `Omni Channel > e-Commerce` /
`Omni Channel > Configurações` (ambos `▶`, não abertos). Testado clique por
coordenada via `driver.performActions` com `pointerType: 'touch'` (achado:
`pointerType: 'mouse'` não é suportado pelo driver `windows` — erro
`"Currently only pen and touch pointer input source types are supported"` —
mas `'touch'` funciona) — confirmou que `Aplicativo` abre mais um nível de
submenu, mas não aprofundei mais: sem seletor estável, documentar essas
telas não ajudaria a escrever teste de verdade (teria que repetir o mesmo
clique frágil por coordenada).

| Nº | Caminho no menu | Descrição (título da tela) |
|---|---|---|
| 267 | Rastreabilidade | Rastreabilidade de processos |
| — | Usuários > Alterar senha | (nenhuma janela nova detectada) |
| 018 | Usuários > Permissões | Permissões de usuários |
| 203 | Usuários > Status de conexão | Lista de usuário do sistema |
| 407 | Usuários > Gerenciamento de senhas | Gerenciamento de senhas |
| 250 | Utilitários > Autocorreção | Auto correção |
| — | Utilitários > Calculadora | (nenhuma janela nova detectada) |
| — | Utilitários > Gerenciador de FTP | Gerenciador de F.T.P. |
| — | Utilitários > Teclado Virtual | (nenhuma janela nova detectada) |
| — | Utilitários > Retirar acentos | (nenhuma janela nova detectada) |
| 212 | Utilitários > Unificar cadastros | Unificar cadastros |
| 016 | AppERP > Contato/ solicitação | EnterpriseERP [ Contato/ Solicitação ] |
| — | AppERP > Boleto EnterpriseERP | EnterpriseERP -> Financeiro - Lista de boletos |
| — | AppERP > Liberação do sistema | Liberação do sistema |
| — | Ajuda > Acesso remoto | (nenhuma janela nova detectada) |
| — | Ajuda > Suporte | (nenhuma janela nova detectada) |
| — | Ajuda > Treinamentos | (nenhuma janela nova detectada) |
| — | Ajuda > Notas da versão | Notas de versões |
| — | Ajuda > Sobre | Sobre |
| 558 | Omni Channel > Consultas, gráficos e relatórios | Totalizações do Omni Channel |
| 571 | Omni Channel > Painel de vendas | Omni Channel - Painel de vendas |
| 418 | Omni Channel > Atendimentos | Omni Channel - Atendimentos |
| — | Omni Channel > Aplicativo > Cadastros | não explorado — item sem Name/AutomationId, só clicável por coordenada (frágil); confirmado visualmente que é um submenu (Cadastros ▶, Consultas ▶) |
| — | Omni Channel > Aplicativo > Consultas | não explorado — mesma limitação acima |
| — | Omni Channel > e-Commerce | não explorado — item sem Name/AutomationId, submenu (▶) não aberto |
| — | Omni Channel > Configurações | não explorado — item sem Name/AutomationId, submenu (▶) não aberto |

## 12. Inventário Canônico de Testes

> **Como usar** (padrão trazido do projeto irmão `cypress-enterprise-suite` em
> 2026-10-08, visto em `docs/Inteligencia do cypress/` — pasta local de
> referência, fora do versionamento, pode não existir em outro clone): Grep
> por
> `#<grupo>.<índice>`, nome do `Cenário` ou nome do arquivo — o índice §12.0
> diz arquivo e faixa de números; cada linha da tabela traz `L:` (linha real
> do `Cenário`/step, **sempre reconfirmada por Grep antes de citar, nunca
> copiada de memória** — desloca a cada edição do arquivo), o nome e o que
> valida. `[WIP]`/`[SKIP]` = tag `@wip`/`@skip` ativa (`AGENTS.md` `[R-WIP]`).
> Sincronização: `AGENTS.md` `[R-SYNC]`.

### 12.0 Índice por arquivo de feature `[QUENTE]`

| Arquivo | `Cenário`s | Faixa | Escopo |
|---|---|---|---|
| `0.os.feature` | 2 | `0.1`-`0.2` | OS abertas: um cenário por OS, massa escolhida/conferida no banco a cada rodada; o `0.1` é Esquema com 3 exemplos (regra 0/1/2 da 635); o `0.2` é `@bug` (OS 361422, fora da execução padrão). Ver §12.0.1 |
| `1.login.feature` | 8 | `1.1`-`1.8` | Login (credenciais válidas/inválidas, logout, reconexão após hard-kill, teclado virtual) |
| `2.receitas.feature` | 4 | `2.1`-`2.4` | Receitas alopáticas: orçamento (145), conclusão, processo/baixa (433), orçamento pelo Omni (418) — spec em `docs/superpowers/specs/2026-10-28-suite-receitas-design.md` |
| `3.estoque.feature` | 3 | `3.1`-`3.3` | Reposição de estoque do produto 1004813: entrada de lote (216), conferência (425), importação de NF-e (218 → 132). Os 3 validados 2x isolado (2026-10-29), ver §12.3 |
| `4.calculo.feature` | 7 | `4.1`-`4.7` | Cálculo da receita (145): um orçamento gravado por cenário, esperado calculado pelo modelo com insumos lidos do banco (somente leitura); `4.5` é `@bug` (fora da execução padrão). Ver §12.4 e "Cálculo da receita na 145" |

### 12.0.1 `0.os.feature` / `0.os.steps.js` — 2 `Cenário`s

| # | L: (feature) | L: (steps) | Nome do Cenário | O que valida |
|---|---|---|---|---|
| 0.1 | L:14 (Esquema, Exemplos L:24: regra 0, 1, 2) | `Before` L:39 · `After` L:76 · `When` L:89 · L:97 · L:112 · `Then` L:117 · L:93 | OS 364644 - abrir atendimento de outro atendente mantém a notificação de não lidas (regra <regra>) | Roda com cada regra da 635 "Mensagens lidas" (`OC_CONFIG.MENSAGEM_LIDA` 0/1/2): troca pela 635 (`ConfiguracaoOmniPage`, conferida no banco), faz o fluxo e devolve o valor original (step L:93; o `After` L:76 tenta pela 635 se o exemplo falhar no meio e avisa se não conseguir). `Before` (`@os-364644`, `tests/support/banco/os.js`) escolhe um atendimento aberto com dono que não é o da suíte e com mensagem do cliente não lida (o único do telefone com `MSG_QTDE` > 0). Abre a 418, filtra a grade pelo telefone, acha a linha pelo "!" verde (pixel), abre o detalhe, fecha (conferido) e `Atualizar`. Asserção: `MSG_QTDE`, dono e mensagens sem `LEITURA_DT` iguais aos de antes, e o "!" verde ainda na grade. Validado 2x isolado com os 3 exemplos (2026-11-06, exe debug com a correção; 4m22 e 3m56; atendimento 261100027; regra voltou a 1). |
| 0.2 `@bug` | L:36 | `Before` L:164 · `When` (2.receitas) "abro a tela de receita" · L:170 · (2.receitas) "escolho o paciente e o prescritor de teste" · L:198 · `Then` L:212 | OS 361422 - item em percentual considera os ativos em mg na forma por Total múltiplo | Mesma fórmula 2 da receita 261001707: forma 61 (Total múltiplo), lab 2, total 1, glucosamina 1,5 g, condroitina 1,2 g, MSM 1 g, valeriana 500 mg e essência 1003193 10% digitada; `Before` confere forma e produtos no banco. Grava a receita e lê o `ATENDIMENTO_A3`: essência = 10% da soma das quantidades calculadas dos ativos de massa (0,4245). Hoje sai 0,37 (valeriana fora, P2-15). Vermelho 2x isolado pelo motivo certo (2026-11-06; 2m42 cada; receitas 261100466 e 261100474). Usa `responderDialogosDoCalculo` (`tests/support/calculo/dialogos.js`, compartilhado com a 4.calculo; 4.1 verde depois da mudança). |

### 12.1 `1.login.feature` / `1.login.steps.js` — 8 `Cenário`s

| # | L: (feature) | L: (steps) | Nome do Cenário | O que valida |
|---|---|---|---|---|
| 1.1 | L:7 | `Given` L:20 · `When` L:25 · `Then` L:32 | Autentica com usuário e senha válidos | Login via `LoginPage.login()` com credenciais de `env.local.json`; trata diálogo "Atenção" de reconexão se aparecer (`proceedPastLoginToMainWindow`); valida painel de status (`MainPage.statusBarUsuario`) começando com `"<código> - "` do operador logado |
| 1.2 | L:12 | `Given` L:20 · `When` L:25 · `Then` L:32 · `When` L:44 · `Then` L:48 | Efetua logout após autenticação | Login válido + clique no botão "Logout" (`MainPage.logout`, owner-drawn por coordenada) + volta pra tela de Login (nova janela de topo, reanexada por `waitForLogoutReturnToLogin`) |
| 1.3 | L:19 | `Given` L:20 · `When` L:25 · `Then` L:32 · `When` L:56 · `Then` L:162 | Aviso de reconexão ao logar após encerramento abrupto (sem logout) | Relança o processo sem logout prévio (hard-kill, sessão ainda ativa no Firebird) → diálogo "Atenção" aparece e é confirmado — `proceedPastLoginToMainWindow` retorna `true`, provando que o diálogo realmente apareceu (não só tolerado em silêncio) |
| 1.4 | L:26 | `Given` L:20 · `When` L:72 · `Then` L:32 | Login digitando o usuário pelo teclado virtual | Campo Usuário preenchido via teclado virtual na tela (`TecladoVirtualPage.digitar` + `addValue`), Senha via `setValue` normal |
| 1.5 | L:31 | `Given` L:20 · `When` L:91 · `Then` L:32 | Login digitando a senha pelo teclado virtual | Campo Senha preenchido via teclado virtual, Usuário via `setValue` normal — prova que o teclado segue o campo com foco, não é exclusivo do Usuário |
| 1.6 | L:36 | `Given` L:20 · `When` L:110 · `Then` L:32 | Login digitando usuário e senha pelo teclado virtual | Usuário **e** Senha preenchidos via teclado virtual, sem nenhum `setValue` direto — abre/digita/confirma duas vezes, reanexando a janela de Login entre as chamadas |
| 1.7 | L:41 | `Given` L:20 · `When` L:140 · `Then` L:148 · `When` L:25 · `Then` L:32 | Não autentica com usuário inválido | Usuário inexistente + senha válida → permanece na tela de Login (sem diálogo de erro — app só limpa os campos); login válido em seguida prova que a rejeição foi da credencial, não de uma falha genérica do app |
| 1.8 | L:48 | `Given` L:20 · `When` L:144 · `Then` L:148 · `When` L:25 · `Then` L:32 | Não autentica com senha inválida | Usuário válido + senha errada → permanece na tela de Login; login válido em seguida pelo mesmo motivo do `1.7` |


### 12.2 `2.receitas.feature` / `2.receitas.steps.js` — 4 `Cenário`s

| # | L: (feature) | L: (steps) | Nome do Cenário | O que faz (checkpoints sem asserção de negócio: o operador define depois) |
|---|---|---|---|---|
| 2.1 | L:7 | `When` L:118 · L:120 · L:122 · L:124 · L:126 · `Then` L:128 · L:248 | Cria orçamento de receita alopática | Abre a 145 pelo número (clique do SO + teclado), monta a fórmula (lab 2, forma 2, múltiplo 30, produto 1004866 250 mg), Calcular (uso contínuo + "Deseja calcular outra fórmula?" Não), escolhe paciente (046) e prescritor (036), recalcula e Gravar; espera o código da receita (único objetivo do fluxo) e registra o checkpoint `receita-gravada` (captura em `tests/reports/<sessão>/checkpoints/`). Validado 2x isolado (2026-10-28; receitas 261001793 e posterior) e de novo em 2026-11-06 (1m26/1m28, com `clicarAteFecharJanela`, depois de 1 falha intermitente no `Fechar` do uso contínuo). Dados em `testData.receita` + `testData.clienteId` (`env.json`). |
| 2.2 | L:19 | `When` L:132 · L:170 · L:172 · `Then` L:248 (checkpoint) | Conclui a receita com entrega para amanhã | Monta a PRÓPRIA receita (mesmo caminho do 2.1, step `preparo uma receita alopática gravada`), marca `Concluído` (checkbox do topo, x=424,y=153), digita entrega amanhã 10:00 nas máscaras (clique deixa o cursor no fim: Home antes de `addValue`) e confere o que ficou digitado (`dd/mm/aaaa`, `hh:mm`), `Gravar`, checkpoint `receita-concluida`. Validado 2x isolado (2026-10-28; receitas 261001889 e 261001896) e de novo em 2026-11-06 (1m30/1m34, receita 261100319, captura "Gravação OK!"); a 1ª versão "passou" com erro "data inválida" na tela, pegou-se pela captura. |
| 2.3 `@pesagem` | L:31 | `Before` L:195 · `When` L:175 · L:202 · `Then` L:248 | Registra o processo e a baixa da receita concluída | Receita concluída (mesmo caminho do 2.2) → `Registrar baixa` na 145 abre a 433 (captura `baixa-433-aberta`, que deve mostrar "Baixa registrada: Não") → `Registrar peso` (TPanel) abre a Pesagem monitorada → código de cada um dos 8 itens (`testData.receita.itensPesagem`) + 3 Enters, a janela se fecha sozinha → `Registrar processo` + Sim → `Registrar baixa` → checkpoint `baixa-registrada` e checagem de que nenhum diálogo ficou aberto. **Ordem importa (2026-10-29): a baixa é registrada quando o processo grava; registrar o processo na 145 antes da 433 já registrava a baixa (hora da baixa = hora do 1º processo), por isso o 2.3 não registra processo na 145.** 433/Pesagem só por clique do SO em coordenada absoluta + teclado (sem UIA); precondição da 445 "SEM BALANÇA" assumida. **Consome estoque real do lote do produto 1004866 (lote `140125.14143`, 8,7713 por baixa): com o saldo abaixo disso a Pesagem não conclui e o cenário falha (visto em 2026-10-29, saldo 3,6861); repor o saldo antes de rodar.** Validado 2x na ordem antiga (2026-10-28, ~3m10); na ordem nova, 0 de 2 (lote sem saldo). **2026-11-06**: os itens pesados vêm da própria receita (`ATENDIMENTO_A3`, `tests/support/banco/baixa.js`), não mais de `testData.receita.itensPesagem` (a cápsula escolhida pelo cálculo mudou de 4000087 para 4000080 e a lista fixa quebrou); o hook `Before` da tag `@pesagem` (L:195) confere no banco, antes de abrir o app, a 445 deste computador (`CONFIG_0433` pelo `MachineGuid`: `USO_BALANCA` 0, `TIPO_LEITURA` 1) e o processo padrão do funcionário (`FUNCIONARIO.CODIGO_PROCESSO_TIPO`). Antes de abrir a 433, `faltasDeEstoqueParaBaixa` confere no banco que cada item tem um lote liberado com saldo no estoque de baixa (`ATENDIMENTO_A2.CODIGO_ESTOQUE_BAIXA`, lote do principal quando houver). Pesagem: código + Enter, Enter, Enter com 1,5/1,5/2,5 s (com 500 ms a sequência se perdia); "Baixa registrada: Sim" lido até ficar inequívoco (`aguardarBaixaRegistrada`). **Validado 2x isolado (2026-11-06; 2m41 e 2m40; receitas 261100402 e 261100403, baixa por 1, 8 itens Ok).** |
| 2.4 | L:39 | `When` L:257 · L:295 · L:299 · L:318 · `Then` L:331 (asserção) · L:338 | Cria a receita pelo Omni Channel e envia o orçamento | Abre a 418, `Iniciar atendimento` com o celular de `credentials.telefone`, desmarca os `Sel` dos movimentos já no atendimento (por pixel; as marcações voltam a cada abertura), `Orçamento receita` (mesmo caminho da 145) e `Enviar Orçamento`; checkpoints `atendimento-aberto`, `movimentos-desmarcados`, `orcamento-gravado`, `orcamento-enviado`. Sem UIA depois de abrir a 418 (a MDI fecha). Validado 2x isolado (2026-10-29; 1m50 e 1m53, VM 6 GB). **Asserção (2026-11-06, L:331)**, lida no banco por `tests/support/banco/omni.js`: a nova mensagem `TIPO` 1 do atendimento, enviada (`MSG_ENVIADA` -1 em até 90 s), traz exatamente um `*Orçamento nº:*`, igual à receita nova do funcionário da suíte (códigos acima do marco do início). Sem aviso "já possui atendimento aberto", segue no atendimento novo (caminho ainda não visto). **Transferência (2026-11-06)**: se o atendimento aberto do telefone é de outro atendente (o app recusa o `Orçamento receita`: "Orçamento pertence a outro atendente"), o step L:257 o transfere para o funcionário da suíte pela 471 (`OmniPage.transferirAtendimento`, posição na grade pelo banco) e confere `OC_ATENDIMENTO.ATENDENTE_CF`; caminho ainda não visto ao vivo (P1-04). **Validado 2x isolado com a asserção** (2026-11-06; 2m33 e 2m11; 261100019 já do funcionário 1). |

### 12.3 `3.estoque.feature` / `3.estoque.steps.js` — 3 `Cenário`s

| # | L: (feature) | L: (steps) | Nome do Cenário | O que faz (checkpoints sem asserção de negócio, exceto "nenhum diálogo aberto" no fim) |
|---|---|---|---|---|
| 3.1 | L:7 | `When` L:51 · L:54 | Repõe o estoque com a entrada de um lote novo | 112 pelo número, busca o produto 1004813 pelo código, botão direito na grade de estoque → 216, preenche tipo de estoque/origem/fornecedor/fabricante/Qtde. entrada (`tests/fixtures/estoque.json`), `Gravar`, fecha a 216 e confere que nenhum diálogo ficou aberto. **Validado 2x isolado (2026-10-29, ~52 s)**; a captura `lote-gravado` mostra o lote novo `IA-1004813/29102026` com 100,00 na grade. **Cada rodada cria um lote novo de 100** (efeito real no banco, sem desfazer pela UI). |
| 3.2 | L:16 | `When` L:51 · L:72 | Repõe o estoque com a conferência do saldo do lote | Mesmo caminho até a grade, menu de contexto → 425, escolhe `1 - Conferência`, Qtde. 10.000, `Processar` (a 425 se fecha sozinha). **Validado 2x isolado (2026-10-29, ~45 s)**. `MovimentacaoEstoquePage.escolherConferencia` confere o Movimento por pixel (o campo `Status` só existe em Transferência) e repete a seleção até 3x: numa rodada o clique no item do combo não pegou e o `Processar` deu "O campo selecionado não pode ser nulo". |
| 3.3 | L:25 | `When` L:89 · L:121 · L:129 | Repõe o estoque importando uma NF-e de compra | 218: `Limpar` (+ `Sim`), marca `Importação manual`, `Importar XML`, preenche só o que estiver vazio entre origem/localização/lançamento/natureza (o app guarda os valores; conferência por pixel), escolhe o XML gerado por `tests/support/nfe.js` (número e chave novos a cada rodada a partir de `docs/NF de exemplo.xml`), duplo clique no ITEM 1 abre "Relacionar produtos" e em cada item escolhe `g` e a quantidade em gramas (`quantidadesEmGramas`: 3000, 250, 5000), `Importar NFe`, responde os dois "Atenção" e confere a 132. **Validado 2x isolado (2026-10-29: 1m15 e 1m20; compra 261000009 e seguintes, nota 3.782,16).** Uma rodada de 3 falhou: a "Relacionar produtos" não fechou (clique intermitente, sem captura); a 1ª rodada com sucesso gravou 33.000 e 55.000 g por erro de digitação (campo numérico já vinha com "3"/"5"), corrigido com End + Backspace. **Cada rodada cria uma compra e dá entrada em estoque** (3 kg do 1005501, 250 g do 1005234, 5 kg do 1002121). |

Page Objects: `ProdutoPage` (112), `LotePage` (216), `MovimentacaoEstoquePage` (425), `ImportarNFePage` (218); `tests/support/nfe.js` gera o XML.

Page Objects da `2.receitas`: `ReceitaPage` (145), `ClientePage` (046), `PrescritorPage` (036), todos por clique do SO no retângulo do campo + teclado (`tests/support/teclado.js`; padrão `[R-VEL]`, `AGENTS.md` §0/§4); suporte em `appLifecycle.js` (`responderJanelaDeTopo`, `responderDialogoAtencao[SeAparecer]`, `responderAvisosEmCadeia`, `clicarFisico`, `aguardarJanelaComTitulo`, `listarDialogosAbertos`), `windowsNative.js` (`activateWindow`, `physicalClick`, `left`/`top` nas janelas), `driverConfig.js` (`AUTOMATION_NAME`) e `checkpoint.js`.

### 12.4 `4.calculo.feature` / `4.calculo.steps.js` — 7 `Cenário`s

Todos com os mesmos passos (`When` L:106 pré-condições · `When` L:113 monta e calcula · `When` L:141 paciente/prescritor · `Then` L:133 confere as fórmulas · `When` L:152 recalcula e grava · `Then` L:193 confere o gravado); massa em `tests/fixtures/calculo/orcamentos.json`; esperado = `tests/support/calculo/modelo.js` com insumos do banco (`insumos.js`), comparado com a `ATENDIMENTO_CALC1` (tabela de trabalho), a tela e A1/A2/A3 (`cenario.js`, `gravado.js`). Evidência em `tests/reports/<sessão>/calculo/` (`<cenário>.json` + `orcamentos-gravados.jsonl`).

| # | L: (feature) | Nome do Cenário | Orçamento (fórmulas) | Validação |
|---|---|---|---|---|
| 4.1 | L:11 | Unidades de prescrição em um orçamento | cápsula: 1005757 500 mg · 1 g · 500000 mcg · 1004105 10000 ui (UI/g) · 1000110 1 meq · 1001324 400 mg + 1005757 10 % → **557,35** | 2x isolado (261100221, 261100222) |
| 4.2 | L:23 | Fatores da ficha do produto em um orçamento | correção 1,5 · umidade ligada · umidade desligada · equivalência ligada + correção · equivalência desligada → **224,74** | 2x (261100223, 261100224) |
| 4.3 | L:35 | Fatores do lote e do laudo em um orçamento | `FATORCALCULO` 2 · principal 1004813 (lote conc 90 + umidade) · laudo 3 · `FATORCALCULO` 4 · UI/mg + laudo → **181,50** | 2x (261100225, 261100226) |
| 4.4 | L:47 | Lactobacilos em bilhão, milhão e UFC digitados | sachê: itens da 1094 (mlh/blh/ufc) · itens da 1100 (blh + 2 mlh) → **5.026,97** | 2x (261100227, 261100228) |
| 4.6 | L:59 | Regras da forma farmacêutica em um orçamento | gomas (perda 5% + mínimo 55) · xarope 100 ml (densidade 1,2, perda 10%, mínimo 55) · creme 50 (índice +20%) · creme 30 (mínimo 50) · creme 200 (sem índice) → **636,91** | 2x (261100229, 261100230) |
| 4.7 | L:71 | Múltiplo, taxa técnica e acréscimo do prescritor | múltiplo 2 · 1500 mg múltiplo 3 · dois ativos; prescritor 7 (+10%) → **973,51** | 2x (261100231, 261100232) |
| 4.5 `@bug` | L:88 | Lactobacilos por fórmula de produção interna | fórmula 1094 (produto 1005946) 1 u · fórmula 1100 (1005952) 1 u: esperado 5.026,97 (= 4.4), sistema 9.792,48 | vermelho proposital (`npm run test:bugs`; evidência 261100233) — `ROADMAP.md` P1-06 |

---

## Manuais do sistema (`docs/Manuais - OmniCare/`, lidos em 2026-10-28)

54 PDFs oficiais da EnterpriseERP (23 em "Parte farmacêutica", 31 em "Parte geral"; versões do sistema 25.11 a 26.5).
Resumos por manual em `docs/manuais-resumo/` (7 arquivos, `01`-`07`, coluna "Res." abaixo): objetivo, tela/menu, pré-requisitos,
fluxo, regras de negócio, ações de risco, candidatos a cenário e lacunas. Abrir por `Grep` do nome do manual no arquivo indicado.

**Limites (ler antes de confiar):** resumo feito só do texto dos PDFs (sem os prints e sem consultar o app); as setas dos caminhos de
menu se perderam na extração; os manuais quase nunca trazem mensagem literal de erro/validação nem a lista de campos obrigatórios;
há erros nos próprios manuais (abaixo). Tudo é **ponto de partida**: nome de menu, botão e seletor se valida ao vivo (`[R-SEL]`)
e cenário negativo exige exploração da tela. Menu/tela já exploradas e com manual: 145, 007, 032, 112, 018 (e 046 citada em Refazer).

### Convenções de UI recorrentes nos manuais
- Ícone azul ao lado de um campo abre o cadastro auxiliar (grupo, cidade, entregador, tipo de embalagem); lupa seleciona um existente.
- `+` verde ou botão direito > "Incluir" cria registro; "Gravar" é o salvar padrão (alguns fluxos pedem Gravar 2x: alteração e Tela 145).
- "Limpar" antes de novo cadastro/consulta; coluna "AT" com "OK" ativa o registro (linha riscada = inativo); verde = registrado/selecionado.
- Tela 433 abre por 3 caminhos: Tela 145 > "Registrar baixa"; `Movimentos > Produtos > Baixa de fórmula`; código no campo do canto inferior direito.
- Tela 425 grava em 3 cliques: "Gravar" > "Autorizar" > "Registrar" (Tela 433 usa "Registrar baixa").

### Dependências entre telas (cenários cross-tela, validados ao final na Tela 145)
- Embalagem só aparece na receita se 123, 125, 126, 161 e 078 estiverem coerentes: "Tipo de envase" igual em 161 e 126;
  vínculo pelo POTE, nunca pela cápsula; volumes da 126 do menor para o maior. 106 ("Cálculo do excipiente" 0/1) muda a "Dose (mg)" da 021.
- Tela 146 é global e concentra opções de vários manuais: código de barras nas fichas, % da taxa técnica, conclusão da receita
  contar metas, horário automático, pagar comissão ao orçamentista, data de referência da comissão de laboratório, "Mostrar processos de
  produção na ficha de pesagem". Mexer nela afeta custo, fichas e metas: restaurar o valor original ao fim do teste.
- Tela 002 (Configuração de Relatório) é compartilhada por rótulo de matéria-prima, rótulo de receita e Fichas 40 colunas; "Gravar" persiste global.
- Tela 395 (PDV) leva à 047 (Controle de Caixa), 568 (Configurações do caixa) e 379 ("Concluir Movimento": "OK" finaliza a receita e gera comissão/meta).
- Omni Channel (manual 07, sem número de tela; a exploração real é a 418): mensagem e arquivo padrão só ficam disponíveis depois de vinculados a um grupo de atendimento; os 5 status padrão (0 a 4) são imutáveis e só aceitam sub status; orçamento aberto pelo Omni traz o cliente e vincula o atendimento ao omni, o aberto pela tela comum não; "enviar mensagem padrão" e "enviar arquivo" são flags que precisam estar marcadas; só uma pesquisa de satisfação ativa por tipo (com/sem venda).
- Rastreabilidade tem 4 formas de registro: aba "5 - Rastreabilidade de Processos" da 145 (só receita concluída e criada após a
  configuração), Tela 600, Tela 267 e 267 sem login (janela fixa de 15 s). "Registrar baixa" tem dois sentidos (opção do processo na 229 × botão da rotina de baixa).

### Ações de risco citadas (`[R-RISCO]`: não clicar sem confirmar; nenhum manual descreve desfazer)
- "Importar NFe" > "Sim" (218: dá entrada de estoque/lotes/duplicatas); "Gravar" na 145 ao desmarcar "Concluído" (tira cobrança e ficha de pesagem; fórmula só se desativa).
- "Registrar baixa"/"Registrar baixa geral"/estornos (433), "Gravar > Autorizar > Registrar" (425), "Gerar Nota Fiscal" da perda, "Processar Refazer" (cria nova receita).
- "Registrar processo" > "Sim", "Registrar peso" e as opções "Registrar baixa"/"Bloquear receita"/"Bloquear cálculo" do processo (irreversíveis na receita).
- Caixa: "Fechar Caixa" (sem correção), sangria e suprimento (não cancelam); "Calcular comissão" > "Gravar" (041); registrar ponto (relógio roxo).
- "CANCELAR LOTES REGISTRADOS" antes de excluir produto da nota; "Copiar permissões" com campos invertidos tira a permissão do usuário de origem;
  "Ativar todas as permissões"; "Importar horários"; "Enviar" solicitação (016) abre chamado real (limite de 5 abertas por usuário).
- Servidor e backup (manuais de infraestrutura) mexem em Firebird, `aliases.conf` e firewall, rodam fora do PS01: **não são testáveis pela UI**.
- Omni Channel: quase todo botão envia algo a um cliente real (mensagem, arquivo, áudio, orçamento, **link de pagamento**, envio agendado, pesquisa de satisfação ao finalizar); "Orçamento IA" depende de contrato PH24. Testar só com o telefone do operador (como em 2026-10-26).

### Melhores candidatos a asserção (oráculos numéricos nos manuais)
- Cadastros 112/123/130/117: exemplo custo 3,00, venda ~2,00, referência 3,00. Valor de custo: taxa técnica R$ 12,50 + itens R$ 27,853575 = R$ 40,353575.
- Metas - Produção (tipos 1-4) e Metas - Vendas (bonificação 50%/60% é ambígua); comissões de vendas e de laboratório; Taxa de entrega por região.
- Permissões numeradas citadas: 320 (alterar horário de entrega), 410/411 (metas), 11305 (Livro de Controlados), 682 (inclusão automática, ver `HISTORICO.md`).

### Erros e inconsistências nos próprios manuais (conferir na tela antes de usar)
- Caminho da Tela 145 varia: `Movimentos > Atendimentos > Receitas` (Desativar fórmula) × `Movimentos > Produtos > Receita` (Fichas 40 colunas) × `Movimentos > Atendimento > Receita` (Refazer, Pendências).
- "Cadastro" × "Cadastros" e "Embalagem (frasco, cápsula e outros)" × "Embalagens" (125/126); "Configuração > Atendimento" × "Configurações > Atendimento" (146).
- "alterar data de entrega" cita "Tela 125" no Método 1 (provável erro: é a 145); "Relatório 1305" pede a permissão 11305; "REGISTRO DE LOTES ESTOQUE" × "REGISTRO DE LOTE E ESTOQUE".
- Comissão do entregador: "quatro entregas" mas calcula 3 × R$ 10,00; Taxa de entrega anuncia "duas formas" e descreve uma, com "[inserir link]"; Valor de custo mostra R$ 27,8536 e R$ 27,853575 para o mesmo total.
- "Rastreabilidade completo" contém o "OK" mais a Tela 146; "Conferencia de Processos" só acrescenta a pesagem monitorada pela Tela 600.

### Índice por manual (Grep pelo número da tela)
> Res. = arquivo em `docs/manuais-resumo/`: 01 cadastros de produto · 02 produção/baixa/lote · 03 rastreabilidade · 04 cadastros/caixa/comissões · 05 configuração/rótulos/fiscal · 06 estoque/metas/relatórios · 07 Omni Channel.

| Manual (PDF) | Tela(s) citada(s) | Res. |
|---|---|---|
| Alopatia completo | 112 (apoio 145, 106) | 01 |
| Cadastro básico de embalagens | 123 | 01 |
| Cadastro básico de insumo de alopatia | 112 | 01 |
| Cadastro básico de produto homeopatia | 130 | 01 |
| Cadastro básico de produtos revenda | 117 | 01 |
| Cadastro de volume de embalagem | 125 | 01 |
| Diluentes, conservantes e essência | 116 | 01 |
| Excipiente | 021 (112, 106) | 01 |
| Manual Cadastro Formas Farmaceuticas | 106 (145) | 01 |
| Vinculo materia prima embalagem | 161, 078 | 01 |
| Vínculo de forma farmacêutica com embalagem | 126 (125) | 01 |
| Manual_Mapa_Veterinario | 109, 036 (permissão 11305) | 01 |
| Baixa e estorno de fórmulas | 433 (145) | 02 |
| Baixa geral de formulas | 433 | 02 |
| Conferencia | 425 | 02 |
| Incluir lote manual | 112, 216 | 02 |
| Refazer | 378, 046, 145 | 02 |
| Rastreabilidade - Registro pela tela 267 | 267, 146 | 02 |
| Rastreabilidade Acesso sem Login | 267, 007, 002 | 02 |
| Rastreabilidade Registro Manual e Processo Padrao | 229, 145, 146 | 02 |
| Rastreabilidade completo | 145 (aba 5), 146, 229, 267, 600, 433 | 03 |
| Rastreabilidade OK | 145 (aba 5), 229, 267, 600 (sem a 146) | 03 |
| Rastreabilidade Conferencia de Processos | 600, 433 | 03 |
| Cadastro de Fornecedor Simples | 032 | 04 |
| Cadastro de Horarios de Laboratorio e Delivery | 417, 048, 146, 145 | 04 |
| Cadastro de Prescritor Completo | 036, 040, 011, 322 | 04 |
| Cadastro de Prescritor simples | 036, 040, 011, 322 | 04 |
| Caixa | 395, 047, 049, 568, 056, 379 | 04 |
| Cancelar lote e incluir lote pela tela de compra | 444, 155, 132 | 04 |
| Comissão vendas | 007, 146, 379, 041 | 04 |
| Comissão laboratorio | 007, 229, 146, 041 | 04 |
| Como abrir solicitação no sistema OmniCare | 016 | 04 |
| Como alterar data de entrega de fórmulas ao cliente | 145 (permissão 320) | 04 |
| Como cadastrar funcionário | 007, 018 | 04 |
| Como cadastrar funcionário básico | 007, 018 | 04 |
| Como utilizar A PAGAR | 056, 011, 395, 568, 379 | 04 |
| Configuracao do Servidor | nenhuma (infraestrutura, PS01 só abre) | 05 |
| Configuração de backup | nenhuma (infraestrutura) | 05 |
| Configuração de rótulo de materia prima | 112, 160, 148, 002 | 05 |
| Configuração de rótulo de receita | 145, 002 | 05 |
| Desativar formula | 145 | 05 |
| Fichas 40 colunas | 145, 002 | 05 |
| Importação NF-e | 218 | 05 |
| Manual Cadastro Estoque atualizado | 104, 117, 216 | 06 |
| Manual Formas de Pagamento do Caixa | 056, 011 | 06 |
| Metas - Produção | 229, 625 | 06 |
| Metas - Vendas | 491, 146, 379 (permissões 410, 411) | 06 |
| Pegar xml de notas | 444 (NF-e), 606 (NFC-e), 616 (NFS-e) | 06 |
| Registo de ponto | sem número (`Cadastros - Funcionários - Folha de ponto`) | 06 |
| Relatórios A4 | 002, 146 | 06 |
| Taxa de entrega regiões | 030, 007 | 06 |
| Valor de custo | 146, 145 | 06 |
| Visualizacao de Pendencias e Orcamentos | 145, 391 | 06 |
| Manual para clientes do omni channel - atendimentos | sem número no manual (418 pela exploração); menus `Omni Channel > Cadastros > Mensagens Padrão`, `Arquivos p/ Envio`, `Status personalizado`, `Cadastros > questionários` | 07 |

---

## Piloto 145 a 433 gravado pelo operador (2026-10-28)

Fonte: gravação do gravador de sessão (`tests/reports/recordings/piloto-145-433-28-10-2026_11-26-24-022`, gitignorada, 111 eventos, 78 capturas). Operador 122, banco de **homologação**. Receita criada: **261001723**. Só o que está no trace e nas capturas; o que é leitura nossa está marcado como inferência.

**Fluxo real (ordem)**
1. Campo de número (canto inferior direito) `145` + Enter abre a 145 (`TfMOV_0145`) com Código vazio.
2. Laboratório `2` Enter (2 SOLIDOS), Forma farmacêutica `2` Enter (2 CAPSULAS), Total múltiplo `30` Enter.
3. Produto `passi` abre "Consultar produtos" (`TfCON_PREC`); duplo clique na linha PASSIFLORA EXTRATO SECO (1004866); Quantidade `250`, Tab, unidade `mg`, Enter.
4. `Calcular` abre "Tratamento de uso contínuo" (`TfMOV_0145_UC`, `Fechar`) e depois "Deseja calcular outra fórmula?" (`Não`). A base (1005128) entra sozinha. Valor 26,18, Tx. técnica 10,00.
5. Paciente pela 046 (`TfCAD_0046`: busca `klismam`, "Localizar registro..." `TfUTI_PES`, duplo clique) e prescritor pela 036 (código `1`, Enter). Inferência: a 046 abriu sem clique registrado, provavelmente aberta pelo sistema após o `Não`.
6. `Gravar` antes de recalcular falha: "Operação cancelada! Fórmula nº 1 precisa ser recalculada." (`Ok`). Refazer `Calcular` e `Gravar`.
7. Marcar `Concluído` (topo) e `Gravar`: o sistema inclui as embalagens (8 itens ao todo, valor 39,13) e atribui o Código.
8. Data de entrega digitada em campo com máscara: `29`, Backspace, `102026`, Tab, `1000` = 29/10/2026 10:00. `Gravar`.
9. Aba "5 - Rastreabilidade de processos" > `Registrar processo` > `Sim`: título "Atendimento Concluído"; processo 1 CONFERENCIA INICIAL 2 registrado pelo operador; 2 PESAGEM SOLIDOS, 3 ROTULO e 4 PESO MEDIO pendentes.
10. `Registrar baixa` abre a 433 (`TfMOV_0433`) com "Baixa registrada: Não" e pesagens em 0,0000.
11. Menu `...` da 433 > tela 445 "Baixa de fórmulas - Configurações" (`TfMOV_0433_0`): Tipo de uso `1 - COM BALANÇA` trocado para `0 - SEM BALANÇA` e **Gravar** (persistida **por computador**, não global: ver a precondição abaixo).
12. `Registrar peso` abre "Pesagem monitorada" (`TfMOV_0433_1`): para cada item, código do produto + Enter (3 Enters): 1004866, 1005128, 4000087, 4000170, 4000518, 4000191, 4000043, 4000581. Resultado: Qtde. pesada = calculada, Ok marcado, lotes entre parênteses.
13. `Registrar processo` > `Sim` e `Registrar baixa` na 433. "Baixa registrada: Sim", "Baixa registrada por 1 | 122 | 28/10/2026 11:29:40". Um `Gravar` posterior mostra "Operação cancelada. Fórmula com baixa já registrada!" (esperado: a baixa já constava).

**Precondições que o teste ASSUME (decisão do operador, 2026-10-28; o teste não altera nada disso)**
- Tela 445, "Tipo de uso" = `0 - SEM BALANÇA` e "Tipo leitura" = `1 - REGISTRO NO SISTEMA`. Sem isso a pesagem monitorada não funciona digitando códigos (fica esperando a balança, "Qtde. pesada" 0 em todos os itens). **É por computador, não global** (corrigido em 2026-11-06): tabela `CONFIG_0433`, uma linha por `ID_COMPUTADOR` (`USO_BALANCA` 0/1, `TIPO_LEITURA`). Na 1ª abertura da 433 numa máquina nova o app cria a linha com `USO_BALANCA` 1 (COM BALANÇA): foi o que quebrou o 2.3 na VM (linha 27, criada pelo funcionário 1 em 2026-11-06 14:43:59 UTC no meio da rodada). A configuração do piloto (linha 24, do 122) era da máquina anterior. Toda máquina que rodar o 2.3 (VM local e runner do CI) precisa da 445 configurada uma vez.
- Operador 122 com processo padrão na 007, aba "Processo produção" (já configurado).
- Banco de homologação; cada execução cria uma receita nova (código novo).

**Dados usados (candidatos a `testData`, nunca fixos no código)**
Loja 1, tipo Humana, laboratório 2, forma farmacêutica 2, total múltiplo 30, produto 1004866 a 250 mg (busca `passi`), paciente 867092 (busca `klismam`), prescritor 1, entrega no dia seguinte 10:00 (usar data relativa, não 29/10/2026). Itens automáticos: 1005128 BASE EFERVESCENTE, 4000087 CAPSULAS N. 00, 4000170 FRASCO PET 75ML, 4000518 TAMPA VK 38MM, 4000191 ETIQUETA PL. BRIL. 3 CORES, 4000043 SACHE DE SILICA GEL 1G, 4000581 ETIQUETA RED. 24MM.

**Seletores observados (UIA só na 145; 433/445/Pesagem só Win32)**
- UIA na 145 (sem `&`): `Gravar` (Button), `Concluído` (CheckBox, ClassName `TJPsCheckBox`), `Registrar processo`, `Registrar baixa`, `Fechar` (Button), aba `5 - Rastreabilidade de processos` (TabItem; o nome tem espaço no fim).
- Campos de código (Laboratório, Forma, prescritor, etc.) são `TJPsCodigo` sem legenda e o campo de número da tela é `TJPsEdit` sem legenda: só por posição/ordem. Grids são `TDBGrid` owner-drawn: duplo clique por coordenada.
- Win32 devolve a legenda com `&` (`&Gravar`); o UIA, sem (`Gravar`). Diálogos de aviso: `TfSIS_MSG`, botões `TButton` (`&Sim`, `&Não`, `&Ok`).
- Classe de tela com zeros à esquerda (`TfMOV_0145`); filhas têm sufixo (`_UC`, `_0`, `_1`) e não trazem o número na classe (o título traz `[ 445 ]`).

**Escopo e checkpoints (operador, 2026-10-28)**
- É um fluxo **padrão** de receita, gravado só para **mapear e aumentar o conhecimento**: ainda **não** se escrevem cenários a partir dele.
- Pagamento não entrou no fluxo; quando entrar, usar só `Dinheiro` (ver seção Financeiro acima).
- Checkpoint = ponto de verificação marcado pelo operador (`Ctrl+Alt+C`); o **que validar** em cada um o operador informa depois. Não inferir asserção das capturas.
- Neste piloto houve um único checkpoint, apertado com a tela principal já vazia (depois de fechar a 433 e a 145). O estado final útil do fluxo é a 433 com "Baixa registrada: Sim", visível nas capturas 0178 e 0181 da gravação.

## Reposição de estoque (112/216/425) e importação de NF-e (218/132) gravadas (2026-10-29)

Fonte: gravação `piloto-29-10-2026_14-29-07-719` (gitignorada, 226 eventos, 165 capturas, 12 checkpoints sem anotação, ~25 min). Operador 122, homologação. **Alterou o banco**: entrada de 500.000, conferência de 10.000 e a compra 261000007. Caminhos de menu não gravados (cliques em item de menu sem legenda): a tela aberta é que identifica o caminho.

**A. Estoque do produto 1004813 (MARACUJA EXTRATO SECO)**
1. 112 (`[ 112 ] - Cadastro de produtos (Alopatia)`): busca no Nome (`pa`/`aa`/`ass` abre "Localizar registro..."), duplo clique na linha. A grade "Estoque" lista os lotes (Lote Sis., Loja, Estoque, Lote, Status, Fornecedor, Vencimento, Localização, Quantidade); lote `140125.14143` em "Laboratório 1 - Sólidos" tinha **3,6861**.
2. Botão direito na grade de estoque abre menu de contexto: um item abre a **216** `Incluir/ alterar lotes e estoques` (`TfMOV_0216`, filha da 112): campos Tipo de estoque (`1 - ALMOXARIFADO - MANIPULAÇÃO`), Origem (`3 - BRASIL`), Fornecedor (`1640`), Fabricante (`100000`), Qtde. entrada, Fabricação/Vencimento/Lote (vazios: o texto da Observação diz "lote, fabricação e vencimento automáticos") e `Gravar`/`Fechar`. Entrada de 500.000,00 criou o lote `IA-1004813/29102026` (Almoxarifado, vencimento 28/10/2031); o estoque total passou a 500.931,1009.
3. Outro item do mesmo menu de contexto (com a linha do lote selecionada) abre a **425** `Movimentação de estoque` (título `[425] - ...`, sem espaço): Movimento `1 - Conferência`, Produto/Lote/Loja/Saldo só leitura, `Qtde.` (`TJPsValor`), `Processar`. Digitar `10.000` e processar **substituiu** o saldo do lote 140125.14143: 3,6861 → **10.000,00** (conferência = ajuste para o valor contado).
4. Efeito sobre o `2.3`: o lote `140125.14143` (Laboratório 1 - Sólidos) tem agora 10.000, mais que os 8,7713 por baixa. **Sem divergência (conferido no banco, 2026-11-06)**: o 1004866 tem `CODIGOPRINCIPAL` = 1004813, então o lote pertence ao principal e serve aos dois. O saldo fica em `ESTOQUE_LOTE_LA` (`CODIGO_ESTOQUE_LOTE` = 16313; `ESTOQUE_LOTE.QUANTIDADE` é só a entrada): estoque 4 = **10.000,00** (conferência de 29/10 17:34), estoque 1 (almoxarifado) = 927,41.

**B. Importação de NF-e (218 → 132)**
1. 218 `Importar NF-e` (`TfMOV_0218`): "Importação manual" marcada, `Importar XML` abre o diálogo do SO "Selecione a NF-e" (`#32770`; arquivo escolhido por clique no painel de navegação + `Abrir`). Lê fornecedor (AQIA QUIMICA INOVATIVA LTDA, 01142107000137), série/nº (1 - 656731), emissão 17/04/2025, valor 3.517,44, 3 itens e 3 duplicatas; itens sem produto relacionado aparecem em vermelho.
2. Duplo clique no item abre "Relacionar produtos" (filha, título `[ 218 ] - Importar NF-e - Relacionar produtos`): Tipo de produto (`1 - ALO`), Produto (busca "Localizar registro..." por `not`/`mate`/`phy`/`ex`), Quantidade/Unidade (kg do XML → g: 3,00 kg = 3.000 g), Informações do lote (vazio = lote gerado `<nº NF>/<produto>`), Origem, Localização do estoque (`1 - ALMOXARIFADO - MANIPULAÇÃO`), `Incluir/ Alterar`. Resultado nos 3 itens: PHYTO POMA 1005501 (3.000 g), EXSELEN/SELENIOMETIONINA 1005234 (250 g), PURO BASE PARA OVULO 1002121 (5.000 g); lote `656731/1005501` com 3.000,00, fab. 29/10/2026, venc. 13/09/2031.
3. `Importar NFe` → "Atenção" (Sim) → "Importação concluída com sucesso! Compra nº 261000007! Deseja consultar?" (`Sim`) abre a **132** `Nota fiscal (Compra)` com a compra 261000007 `Concluído`, 3 itens (CFOP 6109), Total NF-e 3.782,16 contra Duplicatas 3.517,44 (diferença 264,72, que o sistema aceitou).
4. A 005 (Cadastro de lojas) foi aberta e fechada no meio (digitou `1`, Enter, copiou o CNPJ com Ctrl+C); inferência: consulta do CNPJ da loja para conferir com o XML.

**C. Gravação `nfe-relacionar-29-10-2026_16-24-21-186` (218 limpa até a 132, 52 eventos, 6 checkpoints sem anotação)**
1. `Limpar` (Sim no "Atenção") → marca `Importação manual` → `Importar XML` (topo da 218) abre a janela filha com Origem 71, Localização 1, Lançamento 415, Natureza 108: o operador **só clicou nos campos, sem digitar** (o app guarda esses valores entre execuções) → `Importar XML` da janela → seletor "Selecione a NF-e" (escolhe o arquivo, `Abrir`); a grade leva ~6 s para carregar.
2. **Duplo clique no ITEM 1** (coluna do nome, abs (323,237)) abre "Relacionar produtos" (título com espaço no fim); a cada `Incluir/ Alterar` a janela AVANÇA sozinha para o item seguinte e some depois do último. Em cada item: combo da unidade (abs (1092,326)) → 1º item da lista `g` (abs (1070,343); lista g/ml/u, o produto vinha em `u`) → Qtde. (abs (1036,325)) em gramas: 3.000, 250, 5.000 (o XML traz 3, 0,25 e 5 kg) → `Incluir/ Alterar` (abs ~(430,541)).
3. Grade verde (itens relacionados), lote 15478/1005501 com 3.000,00; `Importar NFe` → "Confirma a importação da NF-e?" `Sim` → "Importação concluída… Deseja consultar?" `Sim` → 132. O menu `...` do topo da 218 tem "Manifestação do Destinatário", "Unidades relacionadas", "Produtos relacionados" e "Padrão p/ atualizar o produto" (só aberto, não usado). Antes do `Limpar`, duplo clique no item 2 NÃO abre a janela ("Unidade sem relacionamento"): começar sempre pelo item 1.

**Observações para teste futuro (fase de mapeamento: nada escrito)**
- Seletores: tudo `TDBGrid` owner-drawn (duplo clique por coordenada), campos `TJPsEdit`/`TJPsValor`/`TJPsComboBox` sem legenda, botões `TBitBtn` com `&` no Win32 (`&Importar XML`, `&Incluir/ Alterar`, `&Importar NFe`, `&Processar`); a lista de um `TJPsComboBox` abre como janela `ComboLBox` fora da tela. A tecla morta de acento ("ç~ão") vem do ABNT2: digitar texto com acento pelo clipboard.
- Efeito colateral real e irreversível pelo teste: uma NF-e importada duplicada deve ser barrada pelo sistema (não verificado); a entrada de estoque e a conferência não têm desfazer pela UI além de novo ajuste.
- Gatilhos de notificação do Windows ("OMNI CHANNEL - NOVO CHAT") cobrem o canto inferior direito e podem interceptar cliques de coordenada (visto na captura do checkpoint 5).

## Cálculo da receita na 145: motor, regras e massa (explorado em 2026-11-05)

Fonte: leitura do código das procedures no `demostore` (`RDB$PROCEDURES`, só leitura; pedido do operador) e **40 receitas montadas na 145** (só `Calcular`, nada gravado): 29 calculadas e comparadas uma a uma com o modelo abaixo, todas conferindo no centavo; as demais foram barradas pela forma (`ESTOQUE_PFF`), presas na forma de tipo de informe 0 ou ficaram sem snapshot por queda da VPN. Análise linha a linha: `docs/analise-calculo-145/` (fatores/lote/laudo e excipiente/cápsula/embalagem; os números de linha citados lá se referem a fontes extraídos fora do repo). Kit do banco: `C:\Projetos\acesso ao banco\` (`[R-BANCO]` do kit: consultar só com pedido do operador).

**Motor em uso**
- O `Calcular` chama `MOV_ATENDIMENTO_CALC1` (o `MOV_ATENDIMENTO_CALC_NEW` existe mas não é usado: `ATENDIMENTO_CALC` vazia). Cadeia: `CALC1_I` (carrega itens; fatores via `CALC7`) → laço do CALC1 (quantidade, fator, QVD) → `CALC6` (bases substituíveis, diluente, conservante, essência) → `CALC8`/`CALC10` (cápsula, excipiente, embalagem) → `CALC9` (observações) → taxa técnica e índices.
- **Oráculo por item**: o cálculo grava a tabela de trabalho `ATENDIMENTO_CALC1` por funcionário (`CODIGO_FUNCIONARIO` = quem fez o login; a suíte usa `credentials.usuario`), sobrescrita a cada `Calcular`: `QUANTIDADEG` (g por dose, antes do múltiplo), `VALORVENDA` (preço unitário já dividido pela correção), `FATORCORRECAO` (fator total), `DENSIDADE`, `LOTE`, `INCLUSAOSISTEMA`, `TEXTO_FATOR` e `PARAMETROS` (linha 1 nível 0: a string de entrada, com os produtos em largura fixa de 41 caracteres). Outra pessoa usando o 122 sobrescreve: conferir `PARAMETROS` antes de usar.
- A grade de itens da 145 é owner-drawn (sem UIA). Os totais são legíveis pelo retângulo (`Edit` sem nome): linha y=443 → Tx. técnica x=714, Vlr. extra 797, Valor 987, % Desconto 1090, Valor c/ desc. 1178; bloco Valores y=619 → 987/1090/1178; Múltiplo x=222,y=226 (40x15; já vem "1" e a seleção não pega: End + Backspace antes de digitar); Total múltiplo x=503,y=262.

**Quantidade de cada item digitado** (CALC1)
1. Unidade → grama pela tabela `UNIDADES` (`CALCULO`, `VALORINDICE` 1 multiplica / 2 divide por `VALORUNIDADE`): mg ÷1000, mcg ÷1.000.000, kg ×1000, ml/l para ml. `ui`/`utr`: ÷ UI/UTR do produto e, se `ESTOQUE_GERAL.UNIDADE_UMU = 0` (referência em 1 mg), ÷1000. `ufc`: ÷ UFC (sem ÷1000). `meq`: ÷ `ESTOQUE_GERAL.MEQ` (só da ficha) e ÷1000 com UMU 0. `u` (CALCULO 8) não é convertido nem corrigido. `%` (CALCULO 9): percentual da maior quantidade. `qsp(...)` (CALCULO 0): completa o total.
2. × fator total (só matéria-prima, `MOVIMENTOESTOQUE = 1`, CALCULO 1-7 e 9).
3. × Total múltiplo (QVD) quando a forma tem `TIPOINFORME = 1` (qtde por dose: cápsula, goma). `TIPOINFORME = 2` (total final: creme, xarope) reescala pelo total; 0 = nenhum; 3 = dose tomada.
4. Na saída: × **Múltiplo**; densidade e perda (abaixo); 3 ou 4 casas (`ATENDIMENTO_CONF.CASASDECIMAIS_A`, loja 1 = 4).

**Fator total** (`CALC7`) = `FATOREQUIV × CORREÇÃO × UMIDADE`, gravado em NUMERIC(18,4) **truncado** (100/96,38 = 1,0375; 100/30,19 = 3,3123)
- Correção = 100 / `CONCENTRACAO`. Umidade = 100 / (100 − `UMIDADE`), só entra se `ESTOQUE_GERAL.UMIDADE_UC = -1`. Equivalência = `FATOREQUIV`, só se `FATOREQUIV_UC = -1`, e **sempre da ficha**.
- **Fonte de correção/umidade/densidade (e UI/UFC/UTR) = `ESTOQUE_GERAL.FATORCALCULO`**: 1 ficha; 2 lote (`ESTOQUE_LOTE`, cai para a ficha); 3 laudo interno (`ESTOQUE_LAUDOINTERNO`, média dos aprovados `RESULTADO = -1` do lote, ligado por `CODIGO_LOTE` = `ESTOQUE_LOTE.CODIGO`; cai para a ficha); 4 laudo → lote → ficha. Laudo e lote trocam correção, umidade e densidade juntas (umidade 0 do laudo anula a da ficha).
- **Bug do texto da umidade (decisão do operador, 2026-11-05: cálculo certo, texto errado)**: o `TEXTO_FATOR` escreve "UMIDADE = x NÃO UTILIZADA P/ CÁLCULO" justamente quando `UMIDADE_UC = -1`, que é quando a umidade **é** multiplicada (mesma condição nas duas linhas do CALC7). A ficha 112 confirma o cálculo: checkbox ao lado de "Umidade (%)" marcado e "Fator final 1,0375" já com a umidade (1001910). Visto no 1004866: texto diz "não utilizada", fator 1,1111 × 1,0526 = 1,1695.
- **Ficha 112, aba "Info. extras"** (onde moram as flags do cálculo): quantidade mínima/máxima por dose (mg e %) com "Checar no atendimento" (gera os avisos "abaixo/acima das especificações"); unidade, ui/utr/mEq/ufc e a unidade de referência (`UNIDADE_UMU`); "Validade no atendimento" (padrão/máxima); bloco "Fator correção, equivalência, densidade, umidade": fator de correção, concentração (%), densidade, fator de equivalência + checkbox (`FATOREQUIV_UC`), umidade (%) + checkbox (`UMIDADE_UC`), enzima e atividade, **Fator utilizado** (`FATORCALCULO`: "1 - FICHA DO PRODUTO"...) e **Fator final** calculado. Aba "Info. gerais": Bloquear perda no processo, Bloquear excipiente, Fotossensível, Uso contínuo, Usar no atendimento, índices/valores de venda. A automação abre a ficha pelo código (`ProdutoPage.abrirPeloCodigo`), mas digitar um 2º código na mesma 112 não trocou o produto (fechar e reabrir).
- Código principal: o produto digitado pode ter `CODIGOPRINCIPAL` (1004866 → 1004813): fatores e lote vêm do principal (resolve a dúvida do lote 140125.14143).

**Preço de cada item**
- `VALORVENDA` da **ficha do produto** (nunca do lote), dividido só pela **correção** (arredondado em 4 casas) quando `ATENDIMENTO_CONF.NAO_UTILIZAR_FATOR_CALC_PRECO_A` é 0/NULL (loja 1: 0). Efeito: a correção aumenta a quantidade e **não** encarece; equivalência e umidade encarecem (ex.: cloroquina 1000198, equiv 1,61 × correção 1,98 = fator 3,1878, preço/g 2,178 → 1,1).
- Valor do item = preço × quantidade (4 casas) × múltiplo × índice da forma × índice do prescritor (`MEDICO.AUMENTOR` %, só com prescritor escolhido; não medido).
- **Densidade**: item digitado em ml/qsp(ml) de produto estocado em g, com `ATENDIMENTO_CONF.CALCULODENSIDADE_A = -1` (loja 1) e forma sem `NAO_UTILIZAR_DENSIDADE = -1`: quantidade e valor × densidade (1005425 10 ml, dens 1,2: 10 × 0,2937 × 1,2).
- **Perda** (`FORMAFARMACEUTICA.PERCENTUAL_PP`, ex.: gomas 5%, xarope 10%): + % na quantidade e no valor de matéria-prima (não embalagem), salvo `ESTOQUE_GERAL.BLOQUEAR_PERDA = -1`. A 145 mostra "* Perda no processo: x% *".

**Itens incluídos pelo sistema** (com "Inclusão automática"; cobrados se `FORMAFARMACEUTICA.COBRARINCLUSAOSISTEMA = -1`)
- Volume por dose = Σ (quantidade ÷ densidade) dos ativos ÷ QVD, em 4 casas. **Cápsula**: menor nº de cápsulas por dose (1 a 300) e, empatando, a primeira por `ESTOQUER_VINCULO_FF.ORDENACAO` cujo volume (`ESTOQUER_VOLUME.VOLUME`) comporta o volume (forma 2: nº 0 = 0,68 ml, nº 00 = 0,95/1,1 ml; 1,5 ml por dose → 2 cápsulas nº 00).
- **Excipiente** = (volume da cápsula × nº de cápsulas − volume por dose) × QVD × densidade do excipiente (ex.: (0,68 − 0,5) × 30 × 0,8 = 4,32 g de 1005128). Qual excipiente: pelo ativo (`ESTOQUEA_EXCIPIENTE*`) ou pela forma; `ESTOQUE_GERAL.BLOQUEAREXCIPIENTE` tira o excipiente.
- **Embalagem** pelo nº de unidades que cabem (`ESTOQUER_VOLUME_DETALHE`), mais tampa/rótulos/sílica do vínculo (`INCLUSAOSISTEMA` 8). Sem cápsula/frasco compatível a linha simplesmente não aparece (sem mensagem).

**Totais da fórmula**
- **Taxa técnica** por loja + estoque de baixa + forma (`FORMAFARMACEUTICA_LOJABAIXA`): `TIPO_TAXATECNICA = 1` valor fixo (cápsula = 10,00, cremes 18,00, demais semissólidos 28,00); senão % dos itens com mínimo. × múltiplo quando `FORMAFARMACEUTICA.MULTIPLICARTAXA = -1` (múltiplo 2 → 20,00; 3 → 30,00), com faixas opcionais `ATENDIMENTO_CONF.TAXATECNICA_MQ*/MP*` (loja 1: zeradas).
- **Índice de preço da forma** (`FORMAFARMACEUTICA_INDICE` + `_DET`): soma dos itens cai na primeira faixa com `VALOR` ≥ soma → todos os itens × (1 + `INDICE`/100). Forma 1 (cremes): até 90 → +20%; até 300 → +10%; acima, nada.
- **Valor mínimo** (aplicado pela tela, não pela procedure): `FORMAFARMACEUTICA_VALOR_MIN` por forma e Total (forma 1 com total 30 → 50,00; forma 21 total 150 → 80,00) e `FORMAFARMACEUTICA.VALORMINIMOATENDIMENTO` (formas 3, 5, 10 → 55,00). Valor = máximo entre (itens + taxa) e o mínimo.
- Valor = Σ itens + taxa técnica (+ Vlr. extra; − % Desconto, ver "Delivery completo e flags do cálculo").
- **Várias fórmulas no mesmo orçamento** (pedido do operador; validado em 2026-11-05): depois do `Calcular`, "Deseja calcular outra fórmula?" `Sim` abre a fórmula seguinte em branco ("Nº fórmula 2 de 2") e o 046 não abre; só no `Não` da última o app segue para paciente/prescritor. A linha y=443 mostra a fórmula corrente e o bloco Valores (y=619) **acumula** o orçamento. Medido: F1 cápsula 87,42 → Valores 87,42; F2 creme total 50 37,54 → 124,96; F3 cloroquina múltiplo 2 68,74 → **193,70**. A `ATENDIMENTO_CALC1` guarda cada fórmula separada (`NUMEROFORMULA` 1..n, cada uma com o seu `PARAMETROS`).

**Bloqueios e avisos vistos ao calcular** (diálogo "Atenção" com `Ok`)
- "<produto> Não pode ser utilizado com a forma farmacêutica selecionada!" (`ESTOQUE_PFF`: produto restrito a outras formas; zera o cálculo). Ex.: 1005079, 1000419, 1001198 em cápsula.
- "Produto com quantidade abaixo/acima das especificações", "Estoque insuficiente para fazer a fórmula!", textos do `AVISO_ATENDIMENTO` do produto (incompatibilidades, prazo máximo de tratamento) e "Tratamento de uso contínuo" (janela própria).
- Item em % ou ml dispara "Deseja calcular fórmula em QSP?": `Sim` transforma o item em qsp (muda a receita).

**Massa usada (homologação, conferida em 2026-11-05; preços e lotes mudam)**

| Caso | Produto | Configuração | Resultado medido |
|---|---|---|---|
| Neutro | 1005757 PEPTISTRONG | FATORCALCULO 1, conc 100, 3,96/g | 500 mg × 30 = 87,42; 1 g = 155,35; 1500 mg = 216,85 (2 cáps. nº 00) |
| Correção na ficha | 1005813 NUTRICOLIN | conc 66,6666 → 1,5 | 100 mg: 4,5 g, preço/g 4,4; 44,90 |
| Umidade usada | 1001910 CONDROITINA | umid 3,62, UC -1 → 1,0375 | 30,94 |
| Umidade ignorada | 1001324 CREATINA | umid 11,62, UC 0 → 1 | 28,80 |
| Equivalência + correção | 1000198 CLOROQUINA | equiv 1,61 UC -1, conc 50,505 → 3,1878 | 34,37 |
| Equivalência ignorada | 1005623 ALPHA GPC | equiv 2 UC 0, conc 50 → 2 | 85,73 |
| Lote | 1000427 VIT. A / 1004866 PASSIFLORA | FATORCALCULO 2 | 36,95 / 38,01 (lote conc 90 + umid 5 → 1,1695) |
| Laudo | 1000503 MAGNÉSIO / 1002518 ZEAXANTINA | FATORCALCULO 3 / 4 | 35,13 (laudo conc 30,19 → 3,3123) / 39,99 |
| UI | 1004105 NATOKINASE (UMU 1) / 1000105 BETACAROTENO (UMU 0 + laudo) | 20400 UI/g; 1666,67 UI/mg | 159,12 / 31,42 |
| UFC / mEq / mcg / % | 1002419 / 1000110 / 1005757 / 1001324 + 1005757 | — | 2.573,39 / 30,85 / 87,42 / 38,01 |
| Múltiplo | 1005757 300 mg + 1001324 200 mg | múltiplo 2 (e 12 por engano) | 130,10 (780,61) |
| Perda + mínimo | forma 3 gomas, 1005757 100 mg | perda 5%, mínimo 55 | 55,00 (itens + taxa = 48,97) |
| Densidade + perda + mínimo | forma 5 xarope 100, 1005425 10 ml + sorbitol qsp | dens 1,2, perda 10% | 55,00 (53,27) |
| Índice da forma | forma 1 creme | +20% até 90; sem índice > 300 | total 50: 37,54; total 100: 58,69; total 200: 439,37; total 30 com 2%: 50,00 (mínimo) |

**Produção interna (telas 128 e 237) e o bug do milhão (`mlh`) — explorado em 2026-11-05 a pedido do operador**
- **128 – Produção interna (cadastro da fórmula)**: `ESTOQUEF` + `ESTOQUEF_DETALHE`. Código da fórmula (`ESTOQUEF.CODIGO`, campo Código ~(130,162)), "Fórmula (Alopática)" = produto que representa a fórmula (`CODIGO_FORMULA`, ex.: 1005946), Tipo de fórmula (1 PESO / 2 UNIDADE + peso), Qtde. mín. produção, Índice cálculo, Laboratório, Forma, Tipo de uso no atendimento (`OPCAO_ATENDIMENTO`: 0 não usar ... 2 incluir itens p/ pesagem mostrando ... 6 substituir), Formar preço de venda (`PRECOSISTEMA`: 0 valor da fórmula / 1 produtos da fórmula), lista de produtos (quantidade, unidade, fase), "Inclusão manual da fórmula p/ alteração no atendimento". Só aberta e lida (nada gravado).
- **237 – Produção interna (produzir)**: campo "Fórmula alopática" recebe o **código da fórmula** (1094), não o do produto (o 1005946 é descartado sem aviso); Loja ~(113,162); obrigatórios em vermelho: Estoque (saída) (vem 4 da forma), Estoque (entrada) ~(125,320), Vencimento (preenchido sozinho ao informar Validade em dias ~(552,283)), e então "Qtde. a ser feita" ~(1222,320) dispara o cálculo (avisos do produto e "Estoque insuficiente" em diálogos "Atenção"). A grade mostra Quantidade, Unidade, Qtde. cálculo, Valor de custo/venda; rodapé Valor de custo/venda, Índice. **Gravar/Registrar baixa não executados** (criam lote e movem estoque: `[R-RISCO]`). Usa o mesmo motor `CALC1` em modo produção interna (`INCLUSAOAUTOMATICA = 10`, `PARAMETROS` "1;1094;122;-1;0;2;...;10;4") e grava a mesma `ATENDIMENTO_CALC1`. Produções existentes: `FORMULAMANIPULACAO` (`CODIGO_FORMULA` = `ESTOQUEF.CODIGO`) + `_DETALHE`.
- **Unidades de lactobacilo**: `blh` (bilhão) e `ufc` = quantidade ÷ UFC do produto (UFC em bilhões/g; com `FATORCALCULO` 3 o UFC vem do laudo: gasseri 1004031 ficha 110 → laudo 100); `mlh` (milhão) = ÷ UFC ÷ 1000. Avisos dos produtos repetem a regra ("1 bilhão = 1 UFC; 100 milhões = 0,1 UFC").
- **Bug do milhão (relatado pelo operador, reproduzido e explicado)**: os itens em `mlh` de uma **fórmula de produção interna usada dentro da receita** saem ×1000. Causa no código: `MOV_ATENDIMENTO_CALC2` (expande a `ESTOQUEF` na receita) converte `quantidade ÷ UFC` e divide `mlh` por 1000, mas depois de buscar os fatores (`CALC7`) **reatribui** `quantidade ÷ UFC` para `ufc`/`blh`/`mlh` sem o ÷1000. O `CALC1` (item digitado) não tem a reatribuição, por isso a receita digitada e a 237 calculam certo.
  - Fórmula 1094 "PRODUÇÃO BILHÃO" (produto 1005946; crispatus 500 mlh, acidophilus 500 blh, rhamnosus 500 ufc, gasseri 500 blh), sachê forma 7, total 30: digitada → crispatus 0,11538 g, fórmula **3.456,42**; fórmula interna 1 u/dose → crispatus 115,384615 g, **4.977,98** (diferença 1.521,56 = só o crispatus ×1000).
  - Fórmula 1100 "TESTE LACTOBACILLUS" (produto 1005952; acidophilus 600 blh, bifidus 600 mlh, bulgaricus 600 mlh): digitada → 0,18 g cada mlh, **1.570,55**; fórmula interna 1 u/dose → 180 g cada, **4.814,50**.
  - 237 com a 1094 e Qtde. a ser feita 100: crispatus 0,3846 g (certo), acidophilus 500 g, rhamnosus 250 g, gasseri 500 g; valor de venda 11.313,0767.
  - **Versão 23.2.1.7 (2026-11-06, exe `C:\Apps\ERPDesktop - BKP\app.exe`, banco `bkp_antigo_gustavo_bkp` em 192.168.200.10)**: o bug já existia. Lá o
    `CALC2` converte `mlh` só por ÷ UFC (sem nenhum ÷1000) e o `CALC1` divide. Massa criada pela UI (autorizada): UFC 100 no 1000604
    (L. ACIDOPHILUS), produto 1001757 "TESTE QA BUG MILHAO" e fórmula interna **35** (1000604 500 `mlh`, uso 2, preço pelos produtos,
    Unidade, sachê forma 3, **Concluído** marcado: sem ele a 145 não expande a fórmula). 145 lab 1, forma 3, total 30: digitado 0,15 g,
    via fórmula 150,00 g (×1000). Receita de evidência **261143829** (paciente 2 e prescritor 2 "TESTE" do banco
    antigo; `ATENDIMENTO_A3`: fórmula 1 = 1000604 via 1001757, `QUANTIDADE_CALCULO` 150; fórmula 2 = digitado, 0,15). Na 23.2
    a FK do item é `CODIGO_ATEND_A1` e a 036 não fecha sozinha. Evidências em `tests/reports/investigacao-bug-milhao-23.2.1.7/`.
  - Diferenças do exe 23.2.1.7: janela principal "AppERP CS - Soluções Inteligentes"; 112 e 145 em janela não maximizada (outras
    coordenadas); na 145 "Total múltiplo" é o total (Múltiplo 1) e a inclusão de item é uma linha em cima da grade; 112 nova exige
    Tipo estoque e Classificação.
  - Na receita, a fórmula interna aparece como linha nível 0 (o produto 1005946, `u`) e os itens em `NIVELCALCULO` 1 da `ATENDIMENTO_CALC1`: o oráculo por item compara os itens de nível 1 com os mesmos itens digitados.
  - Preço por unidade da linha da fórmula (`CALCULOPRECO_F = 1`) = Σ(preço/g × gramas dos itens) ÷ gramas da linha: com o bug, (1.523,08 + 1.254 + 660 + 1.478,40) ÷ 30 = 163,8492 (gravado); correto 113,1308.

**Achados da implementação da suíte `4.calculo` (2026-11-05/06)**
- **Transação do PS01**: depois do `Calcular` da ÚLTIMA fórmula ("calcular outra fórmula?" = `Não`), o app abre a 046 com a transação do cálculo **ainda aberta**; o `Sim` (fórmula seguinte) confirma. Leitura da `ATENDIMENTO_CALC1` com a transação padrão do `node-firebird` (`ISOLATION_READ_COMMITTED_READ_ONLY` = no_rec_version + wait) ficou presa esperando o app (e o app esperando o teste). A suíte lê com `rec_version` + `nowait`, uma consulta por vez (o `node-firebird` trava com consultas simultâneas na mesma conexão) e prazo de 60 s; a última fórmula só é lida depois de escolher paciente/prescritor.
- **Tela com várias fórmulas**: depois do `Sim` a linha da fórmula (y=443) já mostra a fórmula seguinte em branco (0,00); o valor de cada fórmula é a diferença do bloco Valores (acumulado). Depois do `Gravar` a 145 volta para a fórmula 1. "Nº fórmula x de y" é legível em x=97/138, y=226.
- **Gravar**: com 6 fórmulas e prescritor sem acréscimo, e também com o prescritor 7 (+10%), o app **não** pediu "precisa ser recalculada". O prescritor 7 tem "Observação do médico" (diálogo `Ok`) que **cancela** aquele `Gravar` sem gravar: gravar de novo grava (o 2º clique não repete a observação).
- **Guarda de forma**: o `CALC1` só aplica a restrição da `ESTOQUE_PFF` a produto com `ESTOQUE_GERAL.TRANSPARENTE = 0` (o 1005813 é -1 e calcula em cápsula mesmo restrito à forma 40).
- **Escolha de cápsula**: 1 g/dose (1,0 ml) foi para 2 cápsulas nº 0 (0,68 ml), não 1 nº 00 (1,1 ml); 0,89 ml/dose foi para a nº 00 de 1,1 ml, não a de 0,95 ml: há uma 2ª rodada com excipiente mínimo por faixa de dose (`MOV_ATENDIMENTO_CALC10_1`, forma 2 com `CALCULO_EXCIPIENTE = 1`) ainda não modelada (`ROADMAP.md` P2-10).
- `cucumberOpts.tags` (o `@cucumber/cucumber` 13 removeu `tagExpression`).
- **Funcionário compartilhado** (2026-11-06): outro sistema (API e serviço node, fora desta VM) cria orçamentos com o funcionário 122 a cada poucos segundos e sobrescreve a `ATENDIMENTO_CALC1` no meio do cenário (6 cenários em `interferencia_na_tabela_de_trabalho` na mesma rodada). Decisão do operador: a suíte desktop loga com um **funcionário só dela**, o **1** (desde 2026-11-05 em `credentials.usuario`); o código vem do login (`codigoDoFuncionario` em `tests/support/calculo/cenario.js`), sem 122 fixo. A 4.calculo só precisa de acesso à 145/046/036; o 1 **não tem processo padrão na 007** (o 2.3 precisa) nem caixa do dia.

**Pendências**
- Forma de tipo de informe 0 (ex.: 10 SOLUÇÕES, sem campo de total): a automação não conseguiu incluir os itens (foco pulou para a aba "4 - Obs. sistema"); investigar antes de cobrir.
- Não medidos: índice do prescritor (`MEDICO.AUMENTOR`), `NAO_UTILIZAR_FATOR_CALC_PRECO_A = -1`, `CALCULODENSIDADE_A = 0`, faixas de taxa por múltiplo, homeopatia (dinamização/`ESTOQUEH_TABELA`), enzimas, fórmula interna (`ESTOQUEF`/`CALC2`), Inclusão automática desligada (só medida em 2026-10-26).
