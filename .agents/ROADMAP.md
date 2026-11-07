# ROADMAP.md — Status e backlog

> **Atualizado:** 2026-10-21 · **Como ler:** quente até `<!-- fim-quente -->` — §1 números, §2 tabela do backlog (título + 1 linha), §3 ponteiro, §4 checkpoint e trabalho não commitado (sessão única, `AGENTS.md` `[R-NOMULTI]`). Frio: §5 corpo de cada item (abrir por `Grep "#### P1-01"`). Histórico de validações e entregas: `HISTORICO.md`.
> O que falta e o que já foi feito. Fonte única para status/histórico. Regras
> de escrita em `AGENTS.md`; arquitetura em `PROJECT_CONTEXT.md`.

## 1. Status
- **24 `Cenário`s** em 5 arquivos de feature (`0.os.feature` `0.1`-`0.2`; `1.login.feature` `1.1`-`1.8`; `2.receitas.feature` `2.1`-`2.4`; `3.estoque.feature` `3.1`-`3.3`; `4.calculo.feature` `4.1`-`4.7`) — mesma fonte de `PROJECT_CONTEXT.md` §12.0.
- Exceções ativas (vermelhos propositais): **`4.5` `@bug`** (milhão ×1000 na fórmula de produção interna, P1-06) e **`0.2` `@bug`** (OS 361422, % sem os ativos em mg, P2-15): fora da execução padrão (`cucumberOpts.tags = 'not @bug'`), roda com `npm run test:bugs`. `@wip`/`@skip`: nenhuma (conferido por `grep` em 2026-11-05).
- **Fase atual: mapeamento** (operador, 2026-10-28): gravar e mapear fluxos para aumentar o conhecimento do agente; **não** escrever `Cenário` até o operador pedir (exceção pedida em 2026-11-05: suíte `4.calculo`). Conhecimento novo vai para as seções donas de `.agents/` no mesmo turno (`AGENTS.md` `[R-GRAVACAO]`). Pagamento nos testes: só `Dinheiro`.

---

## 2. Backlog Ativo Priorizado
> Uma linha por item: prioridade no ID (`P0` infra/estabilidade · `P1` regra/funcionalidade pendente · `P2` melhoria contínua), título, resumo de 1 linha e onde está o corpo (§5, frio). Item entregue sai daqui e vira ≤ 3 linhas em `HISTORICO.md` §2. Nunca escrever investigação nesta tabela — vai no §5.

| ID | Item | Resumo | Detalhe |
|---|---|---|---|
| P1-01 | CI | Runner self-hosted na VM; **registrar agora** (operador, 2026-11-06), passo a passo com confirmação: token, serviço Windows e `env.local.json` no `_work`. | §5 P1-01 |
| P1-06 | Bug do produto: milhão (`mlh`) ×1000 na fórmula de produção interna | Coberto pelo `4.5` `@bug` (vermelho proposital); OS 362031; só acompanhar: quando corrigirem, tirar a tag e rodar o 4.5 2x isolado. | §5 P1-06 |
| P1-07 | Funcionário próprio da suíte desktop (1) | Em uso (`1.login`, `2.receitas` e `4.calculo` verdes; processo padrão feito em 2026-11-06); falta caixa do dia pela **395 → 047** e o `env.local.json` do `_work`. | §5 P1-07 |
| P2-04 | Tela 145/146/Omni: pontas soltas da exploração | Sem teste: posologia nula, embalagens, `Gotas`, entrega do Delivery, link/áudio/envio agendado no Omni; massa de teste fica como está (operador, 2026-11-06). | §5 P2-04 |
| P2-01 | Usuário restrito para RBAC | `testData.*` preenchido no `env.json` (2026-11-06, conferido no banco); falta só um 2º funcionário (≠ 1) para `credentials.usuarioRestrito`, no `env.local.json`. | §5 P2-01 |
| P2-02 | Grids owner-drawn sem seletor definido | Estratégia decidida (2026-11-06): teclado (seta) + conferência por pixel, como no Omni; valor no banco quando houver. | §5 P2-02 |
| P2-03 | Primeiros cenários pras 7 telas exploradas | 145/046/007/112/418 já têm cobertura indireta (suítes 2/3/4); 032 e 018 sem nenhuma; aguarda o operador. | §5 P2-03 |
| P2-15 | OS 361422: % ignora item em mg/mcg (bug do produto) | Causa na `CALC1` (consulfarma e ps_atu iguais); cenário `0.2` `@bug` vermelho de propósito até a correção. | §5 P2-15 |
| P2-14 | OS 364644: lado "o dono abre e o '!' some" | O `0.1` prova só que abrir o atendimento de outro não apaga o "!"; o outro lado precisa de mensagem nova do cliente num atendimento do funcionário da suíte. | §5 P2-14 |
| P2-13 | 2.4: transferência automática do atendimento Omni não vista ao vivo | `OmniPage.transferirAtendimento` (471) só roda quando o telefone tem atendimento de outro atendente; a confirmação está suposta no layout do "Atenção". | §5 P2-13 |
| P2-12 | Abrir fisicamente as 251 telas-folha do mapa de menu | Só nome/caminho documentado; abrir cada uma fica para quando houver prioridade/módulo definido pelo usuário. | §5 P2-12 |
| P2-05 | Versão do app sob teste | Decidido (2026-11-06): ler a versão do `PS01.exe` no início da execução e gravar no relatório, sem travar. | §5 P2-05 |
| P2-11 | Link de pagamento (rebaixado de P1-02) | Aguarda o operador liberar outra forma além de `Dinheiro`; `baseUrl`/`apiKey` vão no `env.local.json`, não no `env.json`. | §5 P2-11 |
| P2-06 | Diálogo "Atenção: usuário já conectado" | Hoje sempre clica "Sim"; reavaliar se o app rodar testes contra ambiente compartilhado com uso humano real. | §5 P2-06 |
| P2-07 | Firebird 2.5 | Só leitura na suíte `4.calculo` (oráculo do cálculo, decisão de 2026-11-05); escrita direta no banco segue fora de escopo. | §5 P2-07 |
| P2-09 | Bug de texto: "UMIDADE … NÃO UTILIZADA" com a umidade em uso | Cálculo certo, texto errado; o agente redige o texto da OS e o operador abre o chamado; sem cenário vermelho. | §5 P2-09 |
| P2-10 | Pendências do modelo de cálculo | 1º: regressão da `2.receitas` (depois do P2-01); depois cápsula/excipiente (`CALC10_1`), homeopatia, enzimas, desconto/extra, recálculo no Gravar. | §5 P2-10 |
| P2-08 | Dicionário de tradução do relatório HTML acoplado à versão da lib | `report-i18n-pt-br.js` depende do texto fixo de `multiple-cucumber-html-reporter`; revalidar com Edge headless ao atualizar a lib. | §5 P2-08 |

---

## 3. Log de Entregas
> Vive em `HISTORICO.md` §2 (só escrita; consultar por Grep de issue/PR/commit). Entrega nova: ≤ 3 linhas lá, nunca aqui.

---

## Decisão de escopo registrada

- Rede: só link de pagamento via REST; restante do domínio é Firebird 2.5
  direto, fora do escopo de teste por ora (usuário, 2026-10-07).
- Isolamento: processo novo por teste, não por execução reaproveitada.

---

## 4. Checkpoint e trabalho não commitado (sessão única — `AGENTS.md` `[R-NOMULTI]`)

### 4.1 Checkpoint de tarefa em andamento `[R-CKPT]`
> Como usar (ver `AGENTS.md` §0 `[R-CKPT]`): **antes** de iniciar trabalho que
> pode levar vários minutos ou ser interrompido por queda de sessão (rodar
> suíte/cenário, exploração em lote, edição de vários arquivos em sequência),
> substituir a linha abaixo por uma descrição do que vai ser feito (timestamp
> ISO de início, arquivos já previstos, 1 linha de objetivo). Se a sessão cair
> no meio, é a única pista de onde retomar. **Ao concluir**, apagar a entrada e
> devolver esta seção ao estado "nenhuma tarefa em andamento" (o resumo final
> vai pra `HISTORICO.md` §2 e pra "Trabalho feito e ainda não commitado" abaixo).
> Nunca deixar mais de uma entrada aqui — é sempre a tarefa corrente, não um
> histórico.

Nenhuma tarefa em andamento.



### 4.2 Trabalho feito e ainda não commitado
> Consolidado do que já foi implementado/alterado nesta árvore de trabalho
> mas ainda não virou commit — contexto que `git status` sozinho não explica
> (o quê, por quê, arquivos). Atualizar ao concluir cada entrega (`[R-SYNC]`).
> **Esta seção é zerada inteiramente pela skill `pre-commit`**, depois que o
> commit sair de verdade — o `git log`/corpo do commit vira o registro
> permanente a partir daí. Não é um histórico: só o que ainda está sujo no
> working tree agora.

Nada: tudo commitado em `3ea3455` (branch `feat/os-361422-percentual-mg`); ver `git log`.

---

<!-- fim-quente -->

## 5. Detalhe dos Itens do Backlog (frio — corpo integral de cada ID da tabela §2)
> Abrir por `Grep "#### <ID>"`. Ao atualizar um item: o corpo muda aqui, a linha da tabela §2 só se o título/resumo mudar.

### 🔴 P0 — Infraestrutura e estabilidade

Nenhum item aberto. O P0-01 (isolamento de sessão) foi fechado em 2026-11-06: a suíte roda numa VM VirtualBox
(Windows Server 2025 Eval, 6 GB) com desktop próprio; ver `HISTORICO.md` §2. Paralelismo com N VMs só volta
como item novo se o operador pedir (cada VM segue com `maxInstances: 1`).

### 🟡 P1 / 🟢 P2 — Funcionalidades pendentes e melhorias (a prioridade está no ID; a ordem aqui é a de entrada)

#### P1-01 · CI
- **[P1] CI**: decisão tomada — **self-hosted na VM** (não `windows-latest`
  hospedado; ver `AGENTS.md` §10 e o workflow comentado). Lógica do workflow
  pronta (`.github/workflows/tests.yml`: label `[self-hosted, Windows,
  sisps-vm]`, `concurrency` em fila, geração do HTML + upload de
  `tests/reports/`). **Falta** (ação de infraestrutura, não só código,
  precisa de confirmação explícita antes de executar — instala serviço
  persistente): registrar o runner nesta VM (`gh api -X POST
  repos/:owner/:repo/actions/runners/registration-token` + baixar/configurar
  o agente oficial do GitHub Actions como serviço Windows) e copiar
  `env.local.json` pra pasta de trabalho do runner (`_work/...`, separada do
  clone manual — não vem do checkout, é gitignorado).
- **Decisão (operador, 2026-11-06): registrar agora**, um passo por vez com confirmação (token, download do
  agente, configuração como serviço, `env.local.json` no `_work`). Ressalva: o 2.3 está bloqueado e o 2.4 sem
  asserção (P1-04), então a 1ª execução do CI pode sair vermelha por isso, não pelo runner.

#### P2-04 · Tela 145/146/Omni: pontas soltas da exploração
- Exploração P1-03 entregue (ver `HISTORICO.md` §2); achados em `PROJECT_CONTEXT.md`
  ("Tela 145", "Conclusão da receita…", "Financeiro, Delivery e tela 146", "Omni
  channel…"). Pontas soltas, **todas dependem de decisão do operador** por serem
  cobrança/fiscal/envio real: (1) flag de posologia nula (esvaziar a posologia antes
  de concluir) e estoque de embalagens isolado; campo `Gotas` (homeopatia); (2)
  concluir a entrega do Delivery (exige movimento finalizado/documento fiscal);
  (3) Omni: `Link de Pagamento`/`Enviar orçamento c/ link`, `Gravar Audio`, envios
  agendados, telas de Cadastros.
- **Massa de teste (decisão do operador, 2026-11-06): fica como está.** Receitas `261001625`, `261001651`,
  `261001652`, `261001653`, `261001668`, atendimentos Omni `261000213` e `261000214` (Pendente no Balcao) e
  carrinho `261000054` não atrapalham as suítes; finalizar/apagar é ação sem desfazer (`[R-RISCO]`).
- **Atenção ao retomar**: telas MDI do Omni/278 fecham ao consultar a UIA (usar
  entrada física do SO); `+` e botões owner-drawn só por toque; permissões 154/682
  pedem autorização; na 036 o botão em x≈262 é **Excluir**; nada de `Excluir`/NF-e
  sem pedir (`[R-RISCO]`). Credenciais reais só em `env.local.json`.

#### P2-01 · Campos de `env` ainda vazios (resta o usuário restrito)
- Preenchidos na VM (conferido em 2026-11-05): `credentials.usuarioRestrito`/`senhaRestrita` (usuário 1, reservado a
  testes de RBAC `[R-RBAC]`; hoje o 1 também é o `credentials.usuario`, P1-07), `testData.clienteId` e `testData.calculo.*`.
- Faltam: `testData.fornecedorCodigo`/`produtoCodigo` (fichas 032/112) e `testData.receita` (a `2.receitas` para em
  "Preencha testData.receita"). Para RBAC, o restrito precisa ser outro funcionário que não o da suíte.
- **Decisão (operador, 2026-11-06)**: o agente levanta os valores no banco (só leitura) e grava a **massa de teste
  com valor no `env.json` versionado**, incluindo chaves novas se a suíte precisar; usuário/senha (inclusive o
  restrito) e chaves de API continuam só no `env.local.json` (`AGENTS.md` §11.3). Cuidado: o `loadEnv` faz merge
  profundo e a folha do `env.local.json` vence, então tirar de lá as chaves `testData.*` que passarem para o `env.json`.
- **Feito (2026-11-06)**: `testData` inteiro no `env.json`, cada valor conferido no banco (só leitura): cliente 867092
  (KLISMAM), fornecedor 1640 (PHARMACIE DEMO), produto 1004813 (MARACUJA E.S.), receita = lab 2 SOLIDOS, forma 2
  CAPSULAS, ×30, 1004866 PASSIFLORA 250 mg, prescritor **14991** (`AUMENTOR` 0; o 1 do piloto tem **+80%**), 8 itens
  de pesagem do piloto (todos ativos); cálculo 14991/7 (+10%). O `env.local.json` desta VM tem `clienteId` e
  `calculo.*` com os mesmos valores (inofensivo). **Falta**: funcionário restrito (≠ 1) para RBAC, credencial local.

#### P2-02 · Grids owner-drawn sem seletor definido
- **[P2] Grids owner-drawn sem seletor definido**: telas de listagem (achado
  na 418-Omni Channel) não expõem linhas como elementos UIA — precisa definir
  estratégia (coordenada relativa, scroll por botões UpButton/DownButton, ou
  validação por screenshot) antes de escrever o primeiro teste que leia/clique
  uma linha de grid. Ver `.agents/PROJECT_CONTEXT.md` §"Inventário de telas".
- **Decisão (operador, 2026-11-06)**: padrão = teclado + pixel, generalizando o do Omni
  (`OmniPage.desmarcarMovimentosExistentes`: Seta para baixo linha a linha, conferência por
  `contarPixelsEscuros`); o valor da linha se confere no banco quando houver. Lição em `AGENTS.md` §4.

#### P2-03 · Primeiros cenários pras 7 telas exploradas
- **[P2] Primeiros cenários pras 7 telas exploradas**: 145/046/032/007/112/
  018/418 só foram navegadas e documentadas (seletores, estrutura), nenhum
  cenário `.feature` escrito ainda pra elas nem ação de negócio testada
  (Gravar/Excluir/etc. não foram clicados, pra não sujar dados).
- **Revisto em 2026-11-06**: 145, 046 e 418 já entram nas suítes `2.receitas`/`4.calculo`, 112 na `3.estoque` e
  007 só como dado (funcionário); **032 e 018 seguem sem cobertura**. Aguarda o operador escolher módulo/prioridade.

#### P2-15 · OS 361422: % ignora item em mg/mcg (bug do produto)
- Receita 261001707 (consulfarma, 122): essência 10% = 0,4245 na fórmula 1 (incluída pelo vínculo de conservantes) e 0,37 na
  fórmula 2 (incluída à mão), com glucosamina 1,5 g, condroitina 1,2 g (fator 1,0375), MSM 1 g e valeriana 500 mg.
- Causa (`MOV_ATENDIMENTO_CALC1`, idêntica no `ps_atu` 26.6, 2026-11-06): o laço ordena por `C1.QUANTIDADE DESC` (digitada,
  sem converter: 500 mg vem antes de 1,5 g) e `V_QTDEMAIOR` SUBSTITUI quando o item é maior que o acumulado. A valeriana
  entra 0,5, a glucosamina 1,5 a substitui, e o % sai de 3,7. Também divide pelo fator (1,2 e não 1,245), diferente da fórmula 1.
- Item manual: o % usa `V_QTDEMAIOR`; pelo vínculo o item entra com `INCLUSAOSISTEMA` e é calculado fora desse laço.
- Cenário `0.2` `@bug` (2026-11-06): espera 0,4245 (10% da soma das quantidades calculadas dos ativos); hoje 0,37. Quando
  corrigirem: tirar `@bug`, validar o `0.2` 2x isolado e mover para o `HISTORICO.md`. Se a correção mantiver a divisão pelo
  fator (0,42), decidir com o operador qual base vale antes de mudar o esperado.
- **Não é regressão** (2026-11-06): reproduzido no exe 23.2.1.7 / banco `bkp_antigo_gustavo_bkp`, receita **261143830**
  (forma 3 sachê, glucosamina 1,5 g, condroitina 1,2 g, MSM 1 g, valeriana 500 mg = 0,5, essência 1000500 10% = 0,37; certo 0,42).
  A `CALC1` de lá tem a mesma ordem e ainda descarta item menor que 1/3 do acumulado.

#### P2-14 · OS 364644: lado "o dono abre e o '!' some"
- O `0.1` (2026-11-06) cobre a reclamação do cliente: abrir o atendimento de OUTRO atendente mantém `MSG_QTDE` e `LEITURA_DT`.
- Falta o lado positivo (regra 0/1, caso D da OS): o dono abre e as mensagens do cliente ganham `LEITURA_DT`, e o "!" some.
- Massa: mensagem nova do cliente num atendimento do funcionário da suíte (telefone do operador, `credentials.telefone`); o teste não envia mensagem como cliente. A troca da regra pela 635 já existe (`ConfiguracaoOmniPage`): o esperado muda por regra (0/1 marca ao o dono abrir, 2 não marca).

#### P2-13 · 2.4: transferência automática do atendimento Omni não vista ao vivo
- Escrita em 2026-11-06 (`OmniPage.transferirAtendimento`, posição na grade da 471 pelo banco, conferência em `OC_ATENDIMENTO.ATENDENTE_CF`); nas rodadas de validação o 261100019 já tinha sido transferido à mão pelo operador.
- A confirmação "Confirma a transferência…?" está suposta no layout do "Atenção" (Sim/Não): o clique que a abriria foi bloqueado pela permissão do agente.
- Validar na próxima vez que o telefone do operador tiver atendimento de outro atendente (capturas `transferencia-*`); se a confirmação diferir, ajustar `BOTOES_SEM_UIA`.

#### P2-12 · Abrir fisicamente as 251 telas-folha do mapa de menu
- **[P2] Abrir fisicamente as 251 telas-folha do mapa de menu**: hoje só o
  nome/caminho está documentado (`.agents/PROJECT_CONTEXT.md` §10) — abrir
  cada uma, dumpar seletores e screenshot (mesmo tratamento das 7 telas
  originais) fica para quando houver prioridade/módulo específico definido
  pelo usuário (decisão explícita de escopo, 2026-10-08).

#### P2-05 · Versão do app sob teste
- **[P2] Versão do app sob teste**: decidir como fixar a build/versão do
  `PS01.exe` usada no CI.
- **Decisão (operador, 2026-11-06)**: registrar, não travar. Ler a versão do arquivo `C:\SisPS\PS01.exe` no início
  da execução (`wdio.conf.js`) e gravá-la nos metadados do relatório; sem `versaoEsperada` nem falha por versão.

#### P2-11 · Link de pagamento (rebaixado de P1-02 em 2026-11-06)
- Preencher `paymentLinkApi.baseUrl`/`apiKey` e escrever o primeiro teste de contrato real em
  `tests/services/PaymentLinkService.js`. A URL e a chave vão no **`env.local.json`** (credencial), nunca com
  valor no `env.json`. Rebaixado porque a regra vigente é pagamento só em `Dinheiro`: aguarda o operador liberar.

#### P2-06 · Diálogo "Atenção: usuário já conectado"
- **[P2] Diálogo "Atenção: usuário já conectado"**: hoje sempre clica "Sim"
  (assume que a conexão anterior é da própria automação) — reavaliar se o app
  rodar testes contra ambiente compartilhado com uso humano real.

#### P2-07 · Firebird 2.5
- **[P2] Firebird 2.5**: desde 2026-11-05 a suíte `4.calculo` **lê** o banco (somente leitura, `tests/support/banco/conexao.js`, credencial `banco` no `env.local.json`, VPN ligada) para calcular o esperado; escrita direta (setup/cleanup de massa) segue fora de escopo.

#### P1-06 · Bug do produto: milhão ×1000 na fórmula de produção interna
- Relatado pelo operador e reproduzido em 2026-11-05 (`PROJECT_CONTEXT.md`, "Produção interna (telas 128 e 237) e o bug do milhão"): item em `mlh` de uma fórmula de produção interna (`ESTOQUEF`) usada na receita sai ×1000. Causa: `MOV_ATENDIMENTO_CALC2` divide `mlh` por 1000 e depois reatribui `quantidade ÷ UFC` sem o ÷1000. Digitado na receita (`CALC1`) e produzido na 237, calcula certo.
- Cenário `4.5` `@bug` confere o valor correto (fórmulas 1094 e 1100: 3.456,42 e 1.570,55, iguais aos itens digitados do `4.4`); hoje sai 4.977,98 e 4.814,50 (orçamento de evidência 261100233).
- **OS 365845** (cliente 804 Botica, urgente, 2026-11-06) é o mesmo bug: produção interna 2442, item 1010491 600 `mlh` UFC 100 → 180,00 em vez de 0,18 (igual à nossa 1100); com uso 6 + inclusão manual sai certo porque o item vira digitado (`CALC1`).
- Chamado: **OS 362031** (informado pelo operador em 2026-11-06). Quando corrigirem: tirar `@bug`, validar o 4.5 2x isolado e mover para o `HISTORICO.md`.
- **Não é regressão** (2026-11-06): reproduzido na versão 23.2.1.7 (exe e banco `bkp_antigo_gustavo_bkp` do backup), 500 `mlh` em sachê, total 30: digitado 0,15 g, via fórmula interna 150,00 (×1000). Lá o `CALC2` nunca divide `mlh` por 1000; o `CALC1` divide. Receita de evidência gravada lá: **261143829**.

#### P1-07 · Funcionário próprio da suíte desktop
- Achado em 2026-11-06 (`PROJECT_CONTEXT.md`, "Funcionário compartilhado"): outro sistema calcula com o 122 e sobrescreve a `ATENDIMENTO_CALC1`; a `4.calculo` falha por interferência. Decisão do operador: funcionário só da suíte.
- Feito: `codigoDoFuncionario(credentials.usuario)` em `tests/support/calculo/cenario.js` (testado em `scripts/calculo-erros.test.mjs`); nenhum 122 fixo no código.
- Feito (2026-11-05): operador pôs o funcionário 1 em `credentials.usuario`; `MainPage.statusBarUsuario` passou a casar o prefixo `"<código> - "`. `1.login` 8/8 e `4.calculo` 6/6 com o 1.
- Feito (2026-11-06, agente pelo app, autorizado): processo padrão do 1 na **007**, aba "Processo produção" > "Processo padrão p/ Receita" = 1 CONFERENCIA INICIAL 2, como o 122 (`FUNCIONARIO.CODIGO_PROCESSO_TIPO` = 1, conferido no banco); o 2.3 passou 2x. O `Before` `@pesagem` confere isso antes do 2.3.
- Falta (operador): caixa do dia do 1 pela **395** (PDV Frente de caixa) > `Controle de caixa` (**047**): fechar caixas antigos e `Abrir caixa da loja`. Copiar a credencial para o `env.local.json` do `_work` do runner (P1-01).

#### P2-09 · Bug de texto: "UMIDADE … NÃO UTILIZADA" com a umidade em uso
- `MOV_ATENDIMENTO_CALC7`: o `TEXTO_FATOR` diz "NÃO UTILIZADA P/ CÁLCULO" quando `UMIDADE_UC = -1`, exatamente quando a umidade entra no fator (e a ficha 112 mostra o "Fator final" com ela). Decisão do operador (2026-11-05): cálculo certo, texto errado. Reportar ao time do produto; a suíte confere só o fator.
- 2026-11-06: o agente redige o texto da OS (procedure, condição, evidência) e o operador abre o chamado; o número da OS entra aqui.

#### P2-10 · Pendências do modelo de cálculo (`4.calculo`)
- **Cápsula e excipiente**: o sistema faz uma 2ª rodada com excipiente mínimo por faixa de dose (`MOV_ATENDIMENTO_CALC10_1`) que o modelo não cobre (1 g/dose → 2 cápsulas nº 0, não 1 nº 00). Hoje a quantidade vem da tabela de trabalho; só o preço é conferido.
- **Não modelado**: homeopatia (dinamização, `ESTOQUEH_TABELA`), enzimas, fórmula interna com mais de um nível, forma de tipo de informe 0 (a automação não inclui itens na 10 SOLUÇÕES), `% Desconto`/`Vlr. extra` (autorização 154), `NAO_UTILIZAR_FATOR_CALC_PRECO_A = -1`, `CALCULODENSIDADE_A = 0`, faixas de taxa por múltiplo, taxa percentual.
- **Recálculo por fórmula no Gravar** ("Fórmula nº N precisa ser recalculada" + setas de "Nº fórmula"): implementado mas nunca exercitado (nem com prescritor +10% o app pediu).
- Regressão da `2.receitas` depois da extração dos helpers para `tests/support/receita.js`: não rodou (faltava `testData.receita`). **Prioridade 1 do item (operador, 2026-11-06)**: desbloqueada (`testData.receita` no `env.json` desde 2026-11-06); é o passo 3.

#### P2-08 · Dicionário de tradução do relatório HTML acoplado à versão da lib
- **[P2] Dicionário de tradução do relatório HTML (`report-i18n-pt-br.js`)
  é acoplado à versão atual de `multiple-cucumber-html-reporter`** (texto
  fixo em inglês embutido nos templates da lib, sem API de i18n) — ao
  atualizar essa dependência, revalidar com Edge headless (`--dump-dom`,
  ver `AGENTS.md` §8) se algum rótulo novo/renomeado ficou sem tradução.
