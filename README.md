# 🖥️ Windows Desktop Automation Suite — Legacy Win32 & Delphi VCL

[![Appium Version](https://img.shields.io/badge/Appium-v3.8.0-EA5906?style=for-the-badge&logo=appium&logoColor=white)](https://appium.io/)
[![Windows Driver](https://img.shields.io/badge/Driver-Windows%20Driver%206.3-0078D4?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/appium/appium-windows-driver)
[![WebdriverIO](https://img.shields.io/badge/WebdriverIO-v10.0.1-EA5906?style=for-the-badge&logo=webdriverio&logoColor=white)](https://webdriver.io/)
[![Cucumber BDD](https://img.shields.io/badge/Cucumber-BDD%20pt--BR-23D96C?style=for-the-badge&logo=cucumber&logoColor=white)](https://cucumber.io/)
[![AI-Governance](https://img.shields.io/badge/AI%20Governance-.agents%20Framework-blueviolet?style=for-the-badge)](#-recursos-para-agentes-de-ia)

> **Framework de Automação Desktop para Sistemas Legados**: Automação avançada de aplicação desktop Win32/Delphi VCL com Appium 3.x (driver `windows`), WebdriverIO 10 e Cucumber BDD. Resolve desafios complexos de baixo nível: instabilidade de `AutomationId` em controles Delphi (`TJPsEdit`, `TPanel`), anexação dinâmica a `TopLevelWindow` via PowerShell P/Invoke em Base64, superação de diálogos modais e oráculos de cálculo de domínio.

---

## 📌 Visão Geral do Projeto

Este repositório contém a automação de testes de um sistema desktop corporativo Win32/Delphi (VCL) de gestão — usando **Appium** (driver oficial `windows`, sucessor do WinAppDriver standalone) com **WebdriverIO** e **Cucumber** (Gherkin em português).

O app fala REST **apenas** para geração de link de pagamento; todo o restante do domínio conversa direto com **Firebird 2.5**, fora do escopo de teste automatizado por decisão explícita (ver `.agents/PROJECT_CONTEXT.md`).

Principais arquiteturas e padrões: Page Object Pattern (`tests/pages/`), Service Object Pattern para a rota de pagamento (`tests/services/`), especificações em Gherkin (`tests/features/` + `tests/steps-definitions/`), classificador de erro e isolamento de estado por processo novo — detalhamento em [🏗️ Estrutura de Arquitetura e Padrões](#️-estrutura-de-arquitetura-e-padrões).

Este projeto nasceu de um documento de referência (removido do repositório; recuperável pelo `git log`) com padrões gerais de automação de teste adaptados ao mundo desktop — vários padrões comuns em automação web **não se aplicam 1:1** aqui (ex.: `AutomationId` estável, mocking de rede) e as particularidades reais descobertas por inspeção ao vivo do app estão documentadas em `.agents/PROJECT_CONTEXT.md`.

---

## ⚙️ Configuração (`env.json`)

Arquivo de configuração de ambiente versionado. Credenciais (`credentials`, `banco`, `paymentLinkApi`) ficam com placeholders vazios — **nunca preencher credenciais reais aqui**. A massa de teste (`testData`) vai com valor, conferida no banco de homologação.

| Chave | Responsabilidade |
|---|---|
| `app.executablePath` / `app.processName` / `app.arguments` | Caminho do executável, nome do processo (usado para matar instâncias órfãs) e argumentos de linha de comando |
| `credentials.nome` / `credentials.usuario` / `credentials.senha` / `credentials.telefone` | Credenciais do operador de teste, usadas pelo login de todas as suítes. O `usuario` é o código de um funcionário **só da automação**: a `4.calculo` lê a tabela de cálculo desse funcionário, e outro sistema usando o mesmo código interfere no cenário |
| `credentials.usuarioRestrito` / `credentials.senhaRestrita` | 2º usuário, com permissões restritas — necessário pra testes de RBAC bidirecional (`[R-RBAC]`, `.agents/AGENTS.md` §1), que precisam provar concessão **e** revogação, não só 1 usuário logado |
| `paymentLinkApi.baseUrl` / `paymentLinkApi.apiKey` | Única rota REST do app (link de pagamento) — pendente de preenchimento, ver `.agents/ROADMAP.md` |
| `banco.host` / `banco.port` / `banco.database` / `banco.user` / `banco.password` | Firebird do sistema (`consulfarma`), lido **somente** pela suíte `4.calculo` para calcular o valor esperado (exige a VPN Corporativa). Valores reais só no `env.local.json` |
| `testData.calculo.prescritorSemAcrescimo` / `testData.calculo.prescritorComAcrescimo` | Prescritores da suíte `4.calculo`: um sem acréscimo (`MEDICO.AUMENTOR` 0, ex. 14991) e um com acréscimo (ex. 7, +10%); a suíte confere isso antes de rodar |
| `testData.receita.*` | Dados da receita de teste da suite `2.receitas` (`laboratorio`, `formaFarmaceutica`, `totalMultiplo`, `produtoCodigo`, `produtoQuantidade`, `produtoUnidade`, `prescritorCodigo`; os itens pesados no 2.3 vêm da própria receita, lidos no banco); `testData.clienteId` é o paciente/comprador |
| `testData.clienteId` / `testData.fornecedorCodigo` / `testData.produtoCodigo` | Identificadores de registros já existentes no banco, usados por testes que abrem uma "ficha" (consulta/edição), não criam um registro novo — ex.: telas `046`/`032`/`112` (ver `.agents/PROJECT_CONTEXT.md`). Atenção: amarra o teste a um dado específico desta instância; se o registro for excluído, o teste quebra por motivo errado (dado sumiu, não bug real) |
| `session.defaultLabel` | Prefixo usado para namespacear relatórios quando `SESSION_LABEL` não é passado por variável de ambiente — o rótulo final sai como `<defaultLabel>-DD-MM-AAAA_HH-mm-ss-SSS` (data/hora no padrão brasileiro, ver `tests/support/sessionLabel.js`) |

```json
// env.json (versionado; trecho: credenciais vazias, massa de teste com valor)
{
  "app": {
    "executablePath": "C:\\SisPS\\PS01.exe",
    "processName": "PS01.exe",
    "arguments": ""
  },
  "credentials": {
    "nome": "",
    "usuario": "",
    "senha": "",
    "telefone": "",
    "usuarioRestrito": "",
    "senhaRestrita": ""
  },
  "paymentLinkApi": {
    "baseUrl": "",
    "apiKey": ""
  },
  "testData": {
    "clienteId": "867092",
    "fornecedorCodigo": "1640",
    "produtoCodigo": "1004813",
    "receita": { "laboratorio": "2", "formaFarmaceutica": "2", "...": "..." },
    "calculo": { "prescritorSemAcrescimo": "14991", "prescritorComAcrescimo": "7" }
  },
  "session": {
    "defaultLabel": "local"
  }
}
```

Para rodar localmente, crie `env.local.json` (gitignorado, mesmo diretório) só com as chaves que você quer sobrescrever; `tests/support/loadEnv.js` mescla esse arquivo por cima de `env.json` quando ele existe (merge **profundo**, recursivo por chave aninhada — sobrescrever só `credentials.senha`, por exemplo, não exige repetir o resto de `credentials`):

```json
// env.local.json (gitignorado, não versionar)
{
  "credentials": {
    "nome": "<nome>",
    "usuario": "<código do operador>",
    "senha": "<senha>",
    "telefone": "<telefone padrão de testes>"
  }
}
```

---

## 🛠️ Tecnologias e Dependências

* **[Appium](https://appium.io/) (`v3.x`)** + **`appium-windows-driver`**: driver oficial `windows`, sucessor do WinAppDriver standalone — requer o binário [WinAppDriver](https://github.com/microsoft/WinAppDriver) da Microsoft instalado na máquina (ver [🚀 Como Executar Localmente](#-como-executar-localmente)).
* **[WebdriverIO](https://webdriver.io/) (`v10.x`)**: runner (`@wdio/cli`, `@wdio/local-runner`, `@wdio/appium-service`).
* **[@wdio/cucumber-framework](https://webdriver.io/) + [@cucumber/cucumber](https://cucumber.io/)**: framework BDD (Gherkin `# language: pt`).
* **`@wdio/spec-reporter` / `@wdio/json-reporter` / `@wdio/allure-reporter`**: relatórios de execução (terminal, JSON interno do WDIO e Allure) — ver [📑 Estrutura de Relatórios e Evidências](#-estrutura-de-relatórios-e-evidências).
* **`multiple-cucumber-html-reporter`**: HTML consolidado a partir do cucumber-json nativo, gerado sob demanda (`npm run report:html`).

---

## 🏗️ Estrutura de Arquitetura e Padrões

* **Page Object Pattern (`tests/pages/`):** `BasePage` (seletor + interação genéricos) → `LoginPage`/`MainPage`/`TecladoVirtualPage` (teclado alfanumérico na tela de Login). Nunca contém chamada HTTP, mock ou asserção de contrato de API.
* **Service Object Pattern (`tests/services/PaymentLinkService.js`):** chamada HTTP direta à única rota REST do app (link de pagamento), sem UI — esqueleto, aguardando `baseUrl`/`apiKey`.
* **Especificação em Gherkin (`tests/features/` + `tests/steps-definitions/`):** um arquivo `.feature` por domínio, numerado (`<grupo>.<índice>`, ex. `1.login.feature`), com o arquivo de step definitions correspondente de mesmo número.
* **Classificador de erro (`tests/support/errorHandler.js`):** categoriza toda falha (elemento ausente na árvore UIA, timeout, app travado, elemento não interagível, falha de contrato HTTP, falha de inicialização do processo) — nunca "parece que o seletor está errado" sem citar a categoria. Erro que não bate com nenhuma categoria conhecida nunca fica "sem classificação": gera uma categoria nova automaticamente (`descoberta_<palavras-chave>`), persistida em `tests/reports/error-categories.json` e reaproveitada se a mesma forma de erro se repetir.
* **Isolamento de estado (processo novo por teste):** `killProcessByName` (hard-kill) no `beforeScenario` global + `spawnApp` dentro do próprio step `Given` (`tests/support/appLifecycle.js`) — decisão registrada em `.agents/PROJECT_CONTEXT.md`.
* **Particularidades reais deste app (Delphi/VCL), descobertas por inspeção ao vivo — não suposições:**
  * `AutomationId` é **instável**: muda a cada execução (handle interno do controle, não um identificador estável como `data-testid`). Seletor real usado: `ClassName` + posição via XPath para elementos sem rótulo, `Name` (estável, vem do `Caption`/`Hint` Delphi) quando existe.
  * A tela de login é uma **janela de topo separada** da janela principal, não filha dela — a sessão Appium precisa ser re-anexada (`appium:appTopLevelWindow`) a cada transição de tela, orquestrado por `tests/support/windowsNative.js` (enumera janelas via Win32/PowerShell) e `tests/support/appLifecycle.js`.
  * Diálogo **"Atenção: usuário já está conectado ao banco de dados"** pode aparecer a qualquer momento (inclusive sobreposto à tela principal já visível) quando uma execução anterior foi encerrada com hard-kill — tratado num loop único que prioriza o diálogo sobre a tela principal.

---

## 📑 Estrutura de Relatórios e Evidências

`tests/reports/` é git-ignorado. Cada execução grava em
`tests/reports/<SESSION_LABEL>/` (`SESSION_LABEL` no padrão brasileiro
`<defaultLabel>-DD-MM-AAAA_HH-mm-ss-SSS`, ver `tests/support/sessionLabel.js`),
sem nenhuma política de exclusão — nada é apagado/sobrescrito
automaticamente entre execuções:

| Arquivo | Origem | Conteúdo |
|---|---|---|
| `wdio-*-json-reporter.json` | `@wdio/json-reporter` | JSON interno do WDIO (durações, retries) |
| `cucumber-report.json` | `cucumberOpts.format` (formatter nativo do `@cucumber/cucumber`) | cucumber-json clássico, com arquivo:linha de cada step — insumo de `npm run report:html` |
| `allure-results/*.json` (pasta única, fora do `SESSION_LABEL`) | reporter `allure` | resultados brutos do Allure, acumulados entre execuções (dá histórico/tendência) |

**Diagnóstico de falha** (`tests/support/failureArtifacts.js`, disparado pelo
hook `afterScenario` em `wdio.conf.js` só quando o cenário falha):

* `<nome-do-teste>.png` — screenshot da janela no momento da falha.
* `<nome-do-teste>.uia-tree.xml` — dump completo da árvore de UI Automation ativa.
* `failures.jsonl` — uma linha JSON por falha, consolidado da rodada (append-only).
* `last-failure.json` / `last-failure.log` — sobrescritos a cada falha, acesso rápido à mais recente sem abrir o JSONL inteiro.

Toda falha é classificada (ver [🏗️ Estrutura de Arquitetura e Padrões](#️-estrutura-de-arquitetura-e-padrões)); a ordem de consulta ao diagnosticar está em `.agents/AGENTS.md` §1 `[R-EVID]`.

### 📸 Print de cada etapa

Todo step, passando ou falhando, ganha um print da tela no relatório HTML: em **"Anexos"** do step aparece o item **"Print da etapa 1"**, que abre a imagem num modal. Detalhes:

* **Captura do Windows, não do driver.** A captura do driver consulta a UI Automation e fecharia as telas do Omni. Por isso o print mostra também os diálogos "Atenção".
* **Recorte pelas janelas do PS01.** O print pega só a área das janelas do app; sem o app aberto, a tela inteira.
* **Onde ficam as imagens.** Vão embutidas no `cucumber-report.json`, sem arquivo solto. São cerca de 3,4 MB por cenário, a maior parte nos 2 steps de Login (a tela de Login do app é uma foto em tela cheia).
* **Falha na captura não derruba o teste**, só gera um aviso no console.
* **Para desligar** numa rodada: `PRINT_POR_ETAPA=0` (ex.: `$env:PRINT_POR_ETAPA='0'; npm test` no PowerShell).
* **Evidência no meio do step.** O print é tirado quando o step termina, e uma tela aberta e fechada dentro do mesmo step (ex.: a 635 gravada no `0.1`) não aparece nele. Para isso o step chama `registrarEvidencia(this, '<nome>')` (`tests/support/checkpoint.js`): a captura é anexada na hora e aparece em "Anexos" como **"Evidência: <nome>"**, antes do **"Print do fim da etapa"**.

Implementado em `tests/support/printPorEtapa.js` (hook `AfterStep`); os rótulos das evidências são aplicados por `scripts/report-i18n-pt-br.js`.

### Gerando os relatórios navegáveis

O HTML (`multiple-cucumber-html-reporter`) já é gerado **automaticamente ao
fim de todo `npm test`**, com a execução que acabou de rodar — não precisa
chamar nada a mais pro uso do dia a dia. A página já sai **traduzida pra
pt-BR** (`scripts/report-i18n-pt-br.js`, injetado via `customScript` — a lib
não tem opção nativa de idioma; ver `.agents/AGENTS.md` §8 pra detalhe).
`npm run report:html` continua disponível pra regenerar sob demanda (filtrar
outra sessão, ou ver o histórico inteiro):

```bash
# Regenera com a execução mais recente (mesmo resultado do automático acima)
npm run report:html

# Filtra por uma sessão específica (substring do nome da pasta em tests/reports/):
npm run report:html -- local-09-10-2026_12-29

# Histórico inteiro acumulado (todas as execuções já rodadas), útil pra tendência:
npm run report:html -- --all

# Allure — requer Java (JRE) instalado e no PATH/JAVA_HOME nesta máquina,
# ainda é manual (não roda automático, pra não falhar o npm test numa
# máquina sem Java)
npm run report:allure:generate
npm run report:allure:open
```

### ⚠️ Execução paralela / múltiplas instâncias

Cada sessão Appium aqui abre uma **janela real na área de trabalho interativa do Windows** — o UI Automation ativa/foca essas janelas na mesma sessão de quem está logado na máquina, "roubando" o mouse/teclado físico de quem estiver sentado nela. Subir `maxInstances` no `wdio.conf.js` **não resolve isso** (só colocaria mais janelas competindo pelo mesmo mouse/teclado).

Por isso a suíte roda numa **VM** dedicada (VirtualBox, desktop interativo próprio), sem tocar no computador do operador. Dentro da VM a execução é **sequencial** (`maxInstances: 1`); paralelismo real exigiria várias VMs (fora do escopo atual).

---

## 🧪 Cobertura Atual de Testes

**Total:** **24 cenários automatizados** em 5 suítes (22 na execução padrão; o `4.5` e o `0.2` são `@bug` e rodam à parte com `npm run test:bugs`):

- **`0.os`** (2) — OS abertas: um cenário por OS, com a massa escolhida ou conferida no banco a cada rodada; OS ainda sem correção ficam `@bug` (vermelho de propósito).
- **`1.login`** (8) — tela de Login: autenticação válida e inválida, logout, aviso de reconexão após encerramento abrupto e teclado virtual.
- **`2.receitas`** (4) — receita alopática na tela 145: orçamento, conclusão com entrega, processo e baixa pela pesagem monitorada (433) e orçamento criado e enviado pelo Omni Channel (418).
- **`3.estoque`** (3) — reposição de estoque do produto de teste: entrada de lote (216), conferência do saldo (425) e importação de NF-e de compra (218 → 132).
- **`4.calculo`** (7) — cálculo da receita na 145 conferido contra um modelo próprio, com os insumos lidos do Firebird (somente leitura): unidades, fatores de ficha, lote e laudo, lactobacilos, regras da forma, múltiplo, taxa técnica e acréscimo do prescritor.

> 💡 Cada suíte abaixo expande na lista exaustiva dos seus cenários. A fonte de verdade linha a linha (incluindo o número da linha no `.feature` e nos steps) é `.agents/PROJECT_CONTEXT.md` §12, mantida em sincronia com o código a cada cenário criado, alterado ou removido. Todo cenário novo ou alterado é validado rodando **isolado 2x** contra o app real (`.agents/AGENTS.md` `[R-RUN-ISO]`).

---

### 0. OS abertas (`tests/features/0.os.feature`) — 2 Cenários

Validação de OS abertas: cada cenário reproduz o problema relatado pelo cliente e confere, no exe com a correção, o comportamento pedido. A massa é volátil (atendimentos, mensagens), então um `Before` com a tag da OS a escolhe no banco (somente leitura, `tests/support/banco/os.js`) a cada rodada. Steps em `tests/steps-definitions/0.os.steps.js`; tela do Omni por `tests/pages/OmniPage.js` (clique do SO e pixel, sem UIA):

<details>
<summary><b>🔍 0.os.feature — 2 cenários (clique para expandir)</b></summary>

<dl><dd>

<br>

- 0.1. **OS 364644 - abrir atendimento de outro atendente mantém a notificação de não lidas (regra 0, 1 e 2):** Esquema do Cenário que roda uma vez para cada regra da tela 635 "Mensagens lidas" (0 quando o atendente visualizar, 1 quando visualizar ou alguém responder, 2 quando alguém responder), trocada pela própria tela e devolvida ao valor original no fim. Em cada uma, escolhe no banco um atendimento aberto de outro atendente com mensagem do cliente não lida; na 418, filtra pelo telefone, acha a linha pelo "!" verde, abre e fecha o detalhe e atualiza a lista. Confere que `MSG_QTDE`, o dono e as mensagens sem leitura não mudaram e que o "!" continua na grade.
- 0.2. **OS 361422 - item em percentual considera os ativos em mg na forma por Total múltiplo** (`@bug`): monta na 145 a fórmula da investigação da OS (forma 61, glucosamina, condroitina e MSM em g, valeriana em mg e essência 10% digitada), grava e confere no banco que a essência é 10% da soma das quantidades calculadas de todos os ativos (0,4245 g). Hoje sai 0,37 g, sem a valeriana; fica vermelho até a correção e roda com `npm run test:bugs`.

</dd></dl>

</details>

---

### 1. Login (`tests/features/1.login.feature`) — 8 Cenários

Suíte da tela de Login, que é uma janela de topo separada da principal (a sessão Appium é reanexada a cada transição). Usa os page objects `tests/pages/LoginPage.js`, `MainPage.js` (barra de status e Logout) e `TecladoVirtualPage.js`, com steps em `tests/steps-definitions/1.login.steps.js`:

<details>
<summary><b>🔍 1.login.feature — 8 cenários (clique para expandir)</b></summary>

<dl><dd>

<br>

- 1.1. **Autentica com usuário e senha válidos:** login com as credenciais do `env.local.json`; responde o diálogo "Atenção" de reconexão se aparecer e valida que a barra de status começa com o código do funcionário logado.
- 1.2. **Efetua logout após autenticação:** login válido, clique no botão "Logout" (owner-drawn, por coordenada) e volta à tela de Login, reanexada como nova janela de topo.
- 1.3. **Aviso de reconexão ao logar após encerramento abrupto (sem logout):** relança o processo sem logout (hard-kill, sessão ainda ativa no Firebird); prova que o diálogo "Atenção" apareceu e foi confirmado, não só tolerado em silêncio.
- 1.4. **Login digitando o usuário pelo teclado virtual:** Usuário preenchido pelo teclado virtual da tela e Senha pela digitação normal.
- 1.5. **Login digitando a senha pelo teclado virtual:** o inverso do 1.4; prova que o teclado virtual segue o campo com foco.
- 1.6. **Login digitando usuário e senha pelo teclado virtual:** os dois campos pelo teclado virtual, sem nenhuma digitação direta, reanexando a janela de Login entre as chamadas.
- 1.7. **Não autentica com usuário inválido:** usuário inexistente mantém a tela de Login (o app só limpa os campos, sem diálogo de erro); um login válido em seguida prova que a recusa foi da credencial.
- 1.8. **Não autentica com senha inválida:** mesmo raciocínio do 1.7, com usuário válido e senha errada.

</dd></dl>

</details>

---

### 2. Receitas (`tests/features/2.receitas.feature`) — 4 Cenários

Suíte do fluxo da receita alopática, da entrada do orçamento até a baixa e o envio pelo Omni Channel. Usa os page objects `ReceitaPage` (145), `ClientePage` (046), `PrescritorPage` (036), `BaixaPage` (433) e `OmniPage` (418), sempre por clique do SO + teclado (sem XPath em espera). A massa vem de `testData.receita` e `testData.clienteId` do `env.json`; cada rodada grava receitas reais:

<details>
<summary><b>🔍 2.receitas.feature — 4 cenários (clique para expandir)</b></summary>

<dl><dd>

<br>

- 2.1. **Cria orçamento de receita alopática:** abre a 145 pelo número, monta a fórmula, `Calcular` (uso contínuo + "Deseja calcular outra fórmula?" Não), escolhe paciente (046) e prescritor (036), recalcula e grava; espera o código da receita.
- 2.2. **Conclui a receita com entrega para amanhã:** monta a própria receita, marca `Concluído`, digita a entrega para amanhã às 10:00, confere as máscaras de data e hora e grava.
- 2.3. **Registra o processo e a baixa da receita concluída:** `Registrar baixa` na 145 abre a 433 (exige "Baixa registrada: Não"), pesagem monitorada dos itens da própria receita (lidos no banco, porque a cápsula e as embalagens dependem do cálculo), `Registrar processo` e `Registrar baixa` (exige "Sim" no fim, lido por pixel). Consome estoque real do lote. **Antes de abrir o app** (tag `@pesagem`), confere no banco a tela 445 **deste computador** em "SEM BALANÇA" (a configuração é por máquina) e o processo padrão do funcionário da suíte; se faltar algo, falha na hora dizendo o que configurar.
- 2.4. **Cria a receita pelo Omni Channel e envia o orçamento:** abre a 418 e o atendimento pelo celular do operador; se o atendimento for de outro atendente, transfere para o funcionário da suíte (471). Desmarca os movimentos antigos, cria a receita por `Orçamento receita`, envia por `Enviar Orçamento` e **confere no banco** que a mensagem enviada traz só o orçamento da rodada. Sem UIA depois de abrir a 418 (a tela do Omni fecha ao ser consultada).

</dd></dl>

</details>

---

### 3. Estoque (`tests/features/3.estoque.feature`) — 3 Cenários

Suíte de reposição de estoque do produto de `tests/fixtures/estoque.json`, com os page objects `ProdutoPage` (112), `LotePage` (216), `MovimentacaoEstoquePage` (425) e `ImportarNFePage` (218); o XML da NF-e é gerado por `tests/support/nfe.js`. **Cada rodada altera o estoque real** (sem desfazer pela interface):

<details>
<summary><b>🔍 3.estoque.feature — 3 cenários (clique para expandir)</b></summary>

<dl><dd>

<br>

- 3.1. **Repõe o estoque com a entrada de um lote novo:** 112, busca o produto, menu de contexto da grade de estoque → 216, preenche e grava o lote (100 unidades) e confere que nenhum diálogo ficou aberto.
- 3.2. **Repõe o estoque com a conferência do saldo do lote:** 112 → 425, movimento `1 - Conferência` (conferido por pixel), Qtde. 10.000 e `Processar`.
- 3.3. **Repõe o estoque importando uma NF-e de compra:** 218 (`Limpar`, importação manual, XML com número e chave novos a cada rodada), relaciona os itens em gramas, `Importar NFe` e confere a compra na 132. Gera uma compra real por rodada.

</dd></dl>

</details>

---

### 4. Cálculo da Receita (`tests/features/4.calculo.feature`) — 7 Cenários

Suíte do cálculo da receita na tela 145: cada cenário grava **um orçamento** com várias fórmulas (massa em `tests/fixtures/calculo/orcamentos.json`). O valor esperado sai de um modelo próprio (`tests/support/calculo/modelo.js`) com os insumos lidos do Firebird **somente leitura** (ficha, lote, laudo, forma, prescritor) e é comparado com a tabela de trabalho do cálculo (`ATENDIMENTO_CALC1`), com a tela e com o orçamento gravado. Exige a VPN Corporativa e a chave `banco` no `env.local.json`:

<details>
<summary><b>🔍 4.calculo.feature — 7 cenários (clique para expandir)</b></summary>

<dl><dd>

<br>

- 4.1. **Unidades de prescrição em um orçamento:** fórmulas em mg, g, mcg, UI, mEq e %.
- 4.2. **Fatores da ficha do produto em um orçamento:** fator de correção; umidade e equivalência ligadas e desligadas.
- 4.3. **Fatores do lote e do laudo em um orçamento:** `FATORCALCULO` 2, 3 e 4, código principal e UI com laudo.
- 4.4. **Lactobacilos em bilhão, milhão e UFC digitados:** itens das fórmulas de produção interna digitados diretamente.
- 4.5. `[BUG]` **Lactobacilos por fórmula de produção interna:** vermelho de propósito — confere o valor correto, mas hoje o item em milhão sai ×1000 (bug do produto, OS 362031). Fora da execução padrão; roda com `npm run test:bugs`.
- 4.6. **Regras da forma farmacêutica em um orçamento:** perda, densidade, índice de preço por faixa e valor mínimo.
- 4.7. **Múltiplo, taxa técnica e acréscimo do prescritor:** múltiplo da fórmula, taxa técnica e o acréscimo do prescritor de `testData.calculo.prescritorComAcrescimo`.

</dd></dl>

</details>

---

## 🚀 Como Executar Localmente

### 1. Preparação (Instalação):

```bash
npm install
```

### 2. Configuração única da máquina (driver Appium `windows` + WinAppDriver):

```bash
# Driver "windows" do Appium (já roda via npm install, mas se precisar reinstalar/outra máquina)
npm run driver:install

# WinAppDriver da Microsoft — EXIGE PowerShell como Administrador (pede elevação/UAC)
npm run driver:install-wad
```

> ⚠️ Também é necessário o **Modo de Desenvolvedor do Windows** ativado (`Configurações → Privacidade e segurança → Para desenvolvedores`) — requisito do driver `windows` do Appium.

### 3. Executar os testes:

```bash
# Suíte completa
npm test

# Um arquivo de feature específico
npm run test:spec -- tests/features/1.login.feature
```

#### Executar um único cenário (teste) isolado

Passe o arquivo de feature e um trecho do **título do `Cenário`** em `--cucumberOpts.name` (o valor é uma regex do Cucumber aplicada ao título):

```bash
# Forma direta
npx wdio run wdio.conf.js --spec tests/features/1.login.feature --cucumberOpts.name="teclado virtual"

# Equivalente via script npm
npm run test:spec -- tests/features/1.login.feature --cucumberOpts.name="teclado virtual"
```

- **Use um trecho do texto do título, sem ponto.** Algo como `"1.4"` quebra o parser de opções do wdio CLI (`name[0] must be a string type`). Prefira, por exemplo, `"usuário inválido"` ou `"logout"`.
- **O trecho pode casar com mais de um cenário**, porque é uma regex. Escolha um trecho único. Exemplo: `"usuário pelo teclado virtual"` roda só o `1.4`, mas `"teclado virtual"` roda o `1.4`, o `1.5` e o `1.6`.
- **Rode exatamente 2 vezes** ao validar um cenário novo ou alterado. Uma execução só não detecta flakiness, e mais de duas desperdiçam tempo da sessão de desktop. Só depois de estável isolado, rode o arquivo inteiro ou a suíte.
- Cada cenário sobe um processo novo do app, então ele precisa passar sozinho, sem depender de estado deixado por outro.
- Antes de rodar, confira que não há `PS01.exe` ou `node` residual de uma execução anterior (`tasklist`).

#### Gravar uma sessão guiada (mapear um fluxo no app)

O gravador anota o que o operador faz no PS01 (cliques, texto digitado e checkpoints) para o agente aprender o fluxo e registrar o conhecimento em `.agents/`. Hoje serve para **mapear e aumentar o conhecimento**, não para gerar cenário.

**Antes de gravar**
- PS01 aberto e **logado**. Com o app fechado o gravador avisa e sai com código `1`.
- Use um terminal **próprio** (não o `!` do Claude Code): o prompt de anotação do fim precisa de teclado.
- Nenhuma suíte ou script Appium rodando ao mesmo tempo (a sessão de desktop é única).

**Comandos**

| Comando | O que faz |
|---|---|
| `npm run gravar -- --nome=meu-fluxo` | grava em `tests/reports/recordings/<nome>-<data>/` |
| `npm run gravar:resumo -- <pasta-da-gravação>` | imprime o resumo da gravação em Markdown |
| `npm run recorder:test` | testes da lógica pura do gravador (`node --test`) |
| `npm run calculo:test` | testes do modelo de cálculo e dos utilitários da suíte `4.calculo` (sem app, sem banco) |
| `npm run calculo:contrato` | confere a leitura dos insumos contra o Firebird (precisa da VPN e da chave `banco`) |
| `npm run test:bugs` | roda só os cenários `@bug` (vermelhos propositais de bug conhecido do produto) |

Opções de `gravar`: `--nome` (padrão `piloto`), `--uia-telas=145,007` (telas em que o UIA é consultado; padrão `145`), `--tecla-checkpoint=C` e `--tecla-encerrar=E` (letras dos atalhos, caso colidam com algum atalho do app).

**Durante a gravação**
- `Ctrl+Alt+C` marca um **checkpoint**: um ponto de verificação (captura de tela + tela atual). O que validar nele se informa depois. Aperte no momento em que o resultado importante está na tela, antes de fechar as telas.
- `Ctrl+Alt+E` encerra. Os dois atalhos só valem com o PS01 em foco e não chegam ao app.
- Abra as telas pelo campo de número do canto inferior direito: cliques em menu nativo saem só como coordenada.

**Ao encerrar**, o terminal pergunta "O que validar aqui?" para cada checkpoint (Enter pula) e grava o `summary.md`.

**O que sai da gravação**
- `trace.jsonl`: um evento por linha, gravado na hora (uma queda no meio preserva o que já foi gravado).
- `shots/NNNN.png`: capturas só da janela do PS01.
- `summary.md`: resumo por tela, com as legendas sem o `&` do Delphi e o que o UIA devolveu em cada clique.

**Privacidade e limites**
- Teclas digitadas na janela de **Login** nunca são gravadas, nem a legenda de campos de texto; só entram eventos do `PS01.exe`.
- UIA apenas nas telas da lista segura (padrão: 145). Nas telas MDI (433, 445, Financeiro, Omni) o gravador usa só Win32, porque o UIA fecha algumas delas.
- A gravação fica em `tests/reports/`, fora do git.
- **Só a janela de Login é protegida contra gravação de teclas.** Em outro diálogo de senha do PS01 (por exemplo, autorização de supervisor), a digitação seria gravada em claro: não digite senhas durante a gravação, ou avise o agente para incluir o título dessa janela na lista de proteção. O campo de senha não se distingue por estilo (os `TJPsEdit` do app reportam o mesmo estilo em todos os campos).
- Os atalhos usam o Alt **esquerdo** (`Ctrl+Alt+C` e `Ctrl+Alt+E`). O AltGr (teclados como o ABNT2) não aciona atalho e compõe os caracteres normalmente.
- Códigos de saída: `0` ok, `1` PS01 fechado, `2` PowerShell do gravador não subiu ou morreu.

---

## 📚 Base de Conhecimento para Agentes (`.agents/`)

A pasta `.agents/` é a fonte única da verdade para agentes de IA (e para quem chega no projeto): regras de trabalho, contexto do sistema, estado do backlog e histórico. Segue o padrão **quente/frio**, o mesmo do `cypress-pharmacie-web`, para que a abertura de sessão leia só o essencial e o resto seja consultado sob demanda.

| Arquivo | Papel |
|---|---|
| `AGENTS.md` | Regras de escrita de teste e de conduta (`[R-*]`), lições técnicas, **Particularidades para as skills** (§11 `[R-SKILL]`) |
| `PROJECT_CONTEXT.md` | O sistema sob teste: stack, achados do app, mapa de menu, catálogo de telas, inventário de `Cenário`s |
| `ROADMAP.md` | Estado atual, backlog em tabela (§2) com o corpo de cada item em §5, checkpoint de tarefa e trabalho não commitado (§4) |
| `HISTORICO.md` | Changelog de validações e entregas — só escrita, consultado por `Grep` |

* **Quente × frio:** os três primeiros têm o marcador `<!-- fim-quente -->`. Acima dele fica só o que muda a ação de qualquer turno; abaixo, consulta por tema. Um **Mapa de leitura sob demanda** no topo de `AGENTS.md` e `PROJECT_CONTEXT.md` diz o que cada seção fria responde e **quando** abri-la.
* **Skills** (`.agents/skills/`): `inicia-contexto-projeto` (lê só o quente), `atualiza-context` (sincroniza `.agents/` ao fim da sessão) e `pre-commit` (prepara o commit). São genéricas; o que é específico deste repositório está em `AGENTS.md` §11.
* **Lint:** `npm run docs:lint` (`scripts/lint-agents.js`) falha com marcador ausente/duplicado, parte quente acima do teto de KB, linha longa demais ou Mapa ausente. É chamado pela skill `pre-commit`.
* **Manuais do sistema:** os PDFs oficiais ficam em `docs/Manuais - Pharmacie/` e os resumos para escrita de cenários em `docs/manuais-resumo/` (índice por número de tela em `PROJECT_CONTEXT.md` § "Manuais do sistema"). São ponto de partida: nomes de menu e seletores se validam ao vivo antes de virar teste.

---

## 🔄 CI/CD - GitHub Actions

Os testes são executados automaticamente a cada **`pull request`** (workflow `.github/workflows/tests.yml`). Também é possível disparar a execução manualmente a qualquer momento através do botão do workflow na aba **Actions** (ver [🚀 Status da Automação e Execução Manual](#-status-da-automação-e-execução-manual)).

A execução roda num **runner self-hosted** (label `[self-hosted, Windows, sisps-vm]`) dentro da VM do app, nunca no `windows-latest` hospedado pela GitHub: o `PS01.exe` precisa de uma sessão de desktop interativa real (UI Automation não tem modo headless) e de rede com o Firebird 2.5, que um runner hospedado não alcança.

* **Um job único e sequencial**, não uma matriz em paralelo como no `cypress-pharmacie-web`: a VM tem uma só sessão de desktop, e duas execuções ao mesmo tempo disputariam o mouse e o teclado. Por isso o workflow usa `concurrency` **com fila, sem cancelar** a execução em andamento (dois PRs abertos ao mesmo tempo enfileiram).
* **Execução padrão:** todas as features, sem os cenários `@bug` (`cucumberOpts.tags = 'not @bug'`), com `SESSION_LABEL=ci-<run_id>`.
* **Configuração única da VM** (não repetida a cada execução): driver `windows`/WinAppDriver instalados, runner do GitHub Actions registrado como serviço e `env.local.json` copiado à mão para a pasta de trabalho do runner (`_work/desktop-appium-delphi-suite/...`; é gitignorado, não vem do checkout). Sem ele, o passo **"Conferir credenciais da VM"** falha cedo com mensagem clara. A suíte `4.calculo` exige ainda a VPN Corporativa ligada na VM.

> ⚠️ **Estado atual:** o runner da VM **ainda não está registrado** (`.agents/ROADMAP.md` P1-01). Até lá, as execuções disparadas ficam na fila (`Waiting for a runner`) e nenhum teste roda no Actions; a validação é feita rodando localmente na VM.

Após cada execução no GitHub Actions:

* O **HTML consolidado** (`multiple-cucumber-html-reporter`, em pt-BR) é gerado mesmo com falha (`npm run report:html`).
* Os **relatórios e evidências** ficam disponíveis para download nos **Artefatos** da execução: `test-reports-<run_id>` (30 dias), com a pasta `tests/reports/` inteira — cucumber-json, HTML, Allure bruto e, nas falhas, screenshot, dump da árvore UIA e `last-failure.*` (ver [📑 Estrutura de Relatórios e Evidências](#-estrutura-de-relatórios-e-evidências)).
