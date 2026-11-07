# HISTORICO.md — Changelog de Validações e Entregas · desktop-appium-delphi-suite

> **Só escrita:** nunca é lido na abertura da sessão; consultar por `Grep` de issue, PR, commit, identificador (ex.: `1.7`, `local-09-10-2026_14-24-42-714`, `f1ded12`) ou data. Regras de escrita em `AGENTS.md` §0.1 `[R-DOC]` e §11.2.
> **Gatilhos de leitura (Mapa do `AGENTS.md`):** (1) operador citou issue/PR/commit → `Grep` antes de agir: já validada? parcialmente coberta? (2) criar `Cenário`/explorar tela → item removido/descartado de propósito não é recriado; (3) item documentado como validado está quebrando → em que data e como foi validado, com que ressalva; (4) pergunta sobre o que foi feito numa issue/sessão; (5) `atualiza-context` antes de escrever → completar a entrada existente, não duplicar.

## 1. Validações e incrementos
> Uma linha por evento, mais recente primeiro: `- <AAAA-MM-DD> · <Cenário/identificadores> · Issue/PR · resultado`.

- 2026-11-06 · OS 361422 no exe 23.2.1.7 (banco do backup, pela UI, sem cenário) · **reproduzido**: receita de evidência **261143830** (paciente/prescritor 2 "TESTE"), essência 10% = 0,37 com a valeriana 500 mg = 0,5 fora da base (certo 0,42). Não é regressão. Capturas em `tests/reports/investigacao-os-361422-23.2.1.7/`

- 2026-11-06 · 0.2 `@bug` · OS 361422 · cenário novo na `0.os`, **vermelho 2x isolado pelo motivo certo** (2m42 cada; receitas 261100466 e 261100474: essência 0,37 contra 0,4245 esperado). `responderDialogosDoCalculo` movido para `tests/support/calculo/dialogos.js`; 4.1 verde 1x depois da mudança (4m41)

- 2026-11-06 · OS 361422 (145, % com mg/mcg) · análise só leitura da receita 261001707 (consulfarma) e das procedures: causa na `CALC1` (ordem por quantidade digitada + `V_QTDEMAIOR` que substitui), igual no `ps_atu` (alias `ps_atu`; `psatu` não existe no servidor) → P2-15. OS 365845 (cliente 804) registrada no P1-06 como o mesmo bug do milhão

- 2026-11-06 · bug do milhão (P1-06, OS 362031) · receita de evidência **261143829** gravada no banco do backup pelo exe 23.2.1.7 (pedido do operador; paciente 2 e prescritor 2 "TESTE"): `ATENDIMENTO_A3` com o 1000604 a 150 via fórmula 1001757 e a 0,15 digitado

- 2026-11-06 · bug do milhão (P1-06, OS 362031) · **reproduzido na versão 23.2.1.7** (exe e banco do backup, massa criada pela UI com autorização do operador: UFC no 1000604, produto 1001757, fórmula interna 35): digitado 0,15 g contra 150,00 g via fórmula interna (×1000). Não é regressão. Orçamento não gravado; evidências em `tests/reports/investigacao-bug-milhao-23.2.1.7/`

- 2026-11-06 · 4.5 (bug do milhão, OS 362031) no exe `C:\SisPS - BKP\PS01.exe` · investigação, sem rodar o cenário: exe 23.2.1.7, `PS.ini` aponta para `bkp_antigo_gustavo_bkp` (192.168.200.10); login sem diálogo, janela "SisPS CS - Soluções Inteligentes". Banco sem a massa do 4.5 (nenhum produto com UFC, nenhuma `ESTOQUEF` com `mlh`, sem prescritor 14991/cliente 867092, sem `CODIGO_FORMAFARMACEUTICA_INDICE`). Fonte da `MOV_ATENDIMENTO_CALC2` lá: `mlh` só ÷ UFC, sem ÷1000 (pelo código, também ×1000); a atual divide por 1000 e a reatribuição desfaz. `loadEnv` aceita `APP_EXECUTABLE_PATH`/`BANCO_HOST`/`BANCO_DATABASE`

- 2026-11-06 · 0.1 / relatório HTML · operador viu que a 635 gravada não aparecia no print do step "configuro na 635" (o print sai depois do step, com a 635 já fechada). `registrarEvidencia` anexa a captura na hora e o i18n a rotula "Evidência: <nome>"; 0.1 de novo 2x isolado com os 3 exemplos (4m13 e 4m20), HTML conferido no Edge headless (15 evidências + 12 "Print do fim da etapa")

- 2026-11-06 · 0.1 · OS 364644 · virou Esquema com a regra 0/1/2 da 635 (pedido do operador) · **validado 2x isolado com os 3 exemplos** (4m22 e 3m56; regra devolvida a 1). Rodada anterior falhou no exemplo 2 com 'Connection shutdown' (isc_att_shutdown: o Firebird encerrou a conexão) e a regra ficou 2; o agente devolveu a 1 pela 635. Correção: `conexao.js` reconecta nesse erro e o `After` ganhou prazo próprio

- 2026-11-06 · 0.1 · OS 364644 · **validado 2x isolado** (45,7 s e 47 s; exe debug com a correção; atendimento 261100027 do atendente 65, mensagem 4859145 seguiu sem leitura e `MSG_QTDE` 1). Exploração ao vivo da 418 por sonda descartável (filtro por telefone, "!" por pixel). 1ª rodada passou com um falso verde: um Login de outro PS01 surgiu na tela e o `Fechar` do detalhe não pegou; `fecharDetalhe` passou a conferir e repetir

- 2026-11-06 · 2.3 · **validado 2x isolado** (2m41 e 2m40; receitas 261100402/261100403, baixa por 1, 8 itens Ok): processo padrão do 1 na 007 pelo agente (autorizado); diagnóstico ao vivo da pesagem (código + Enter carrega o lote, Enter, Enter: com 500 ms a sequência se perdia); leitura de "Baixa registrada" repetida até inequívoca; conferência de estoque no banco antes da 433 (testada também com falta, receita antiga 261002011)

- 2026-11-06 · 2.3 · itens da pesagem lidos do `ATENDIMENTO_A3` (receita 261100343 conferida: cápsula 4000080) e `Before` `@pesagem` com as pré-condições (445 pelo `MachineGuid` + processo padrão); rodada `pesagem-before`: barrou em 8 s, sem abrir o app, com "funcionário 1 sem processo padrão" (P1-07)

- 2026-11-06 · 2.3 / tela 445 · agente configurou a 445 da VM (`CONFIG_0433` 27: `USO_BALANCA` 0, `TIPO_LEITURA` 1, autorizado pelo operador) e trocou a mensagem de falha da pesagem; rodada `pesagem-445`: modo SEM BALANÇA ativo, 5 de 8 itens pesados; segue vermelho por divergência de massa (cápsula 4000080 na fórmula, 4000087 em `itensPesagem`) e 2 itens não pesados sem causa conhecida

- 2026-11-06 · suite 2.receitas (rodada `receitas-prints`) · 2.1, 2.2 e 2.4 verdes (8m27, 34 prints, HTML 20 MB); **2.3 vermelho** na Pesagem monitorada: causa raiz = 445 por computador (`CONFIG_0433`), a VM não tinha linha e o app criou a 27 com COM BALANÇA; lote tinha 10.000 (a mensagem do teste culpava o saldo)

- 2026-11-06 · relatório HTML / 2.1 · print de cada etapa (`printPorEtapa.js`, `AfterStep` com captura do SO recortada pelas janelas do PS01, anexada ao cucumber-json): 2.1 2x isolado (1m28/1m29, 10 prints, ~3,4 MB por cenário); JPEG pelo .NET barrado pelo antivírus (AMSI), fica PNG

- 2026-11-06 · 2.4 · **validado 2x isolado com a asserção** (2m33 e 2m11; receitas 261100330/261100331, mensagens 4859240/4859241, cada uma só com o orçamento da rodada); o 261100019 foi transferido 122 → 1 pelo operador na 471 antes das rodadas, então o caminho automático de transferência (`OmniPage.transferirAtendimento`) **não rodou ao vivo**

- 2026-11-06 · tela 471 / Omni · funcionário 1 vinculado ao grupo ATENDIMENTO (7) pelo agente, autorizado pelo operador (Omni > Cadastros > Atendentes, "+", `OC_CANAL_GRUPO_ATENDENTE_RELAC` 159); transferência explorada até o botão (o clique final foi bloqueado pela permissão do agente) e automatizada no 2.4

- 2026-11-06 · 2.4 · asserção do envio pelo banco (`tests/support/banco/omni.js`: 1 `*Orçamento nº:*` = receita nova, `MSG_ENVIADA` -1), testada contra mensagens reais (a de 29/10 com 5 orçamentos devolve os 5); 1 rodada no app bloqueada: o 261000216 foi finalizado por inatividade em 02/11 e o telefone abriu o 261100019 (outro atendente), onde o `Orçamento receita` dá "Orçamento pertence a outro atendente"; nenhuma mensagem enviada

- 2026-11-06 · 2.1 + 4.1 · `clicarAteFecharJanela` (`appLifecycle.js`: confere pelo handle que a janela de topo fechou e repete o clique 1x) contra a falha intermitente do `Fechar` do uso contínuo; 2.1 2x isolado (1m26, 1m28) e 4.1 2x isolado (4m43, 4m44, confere com o modelo); a repetição não foi acionada nessas rodadas

- 2026-11-06 · suite 2.receitas (2.1, 2.2) · regressão de `tests/support/receita.js` com o `testData` do `env.json` (funcionário 1, prescritor 14991): 2.2 2x isolado (1m30, 1m34; receita 261100319, "Gravação OK!", 38,01); 2.1 1 de 2 (1ª: `Fechar` do "Tratamento de uso contínuo" errou o botão, o "calcular outra fórmula?" não veio; 2ª: 1m25); saldo do lote `140125.14143` = 10.000,00 em `ESTOQUE_LOTE_LA` (lote do principal 1004813)

- 2026-11-06 · env.json / P2-01 · `testData` versionado com valor (decisão do operador): cliente 867092, fornecedor 1640, produto 1004813, receita lab 2/forma 2/×30/1004866 250 mg/prescritor 14991 e 8 itens de pesagem, cálculo 14991/7; tudo conferido ativo no banco (só leitura); prescritor 1 do piloto descartado por ter `AUMENTOR` 80; nenhum cenário rodado

- 2026-11-05 · suite 1.login + 4.calculo · funcionário próprio (1) no lugar do 122 (outro sistema calculava com o 122 e sobrescrevia a `ATENDIMENTO_CALC1`): `statusBarUsuario` passou a prefixo `"<código> - "`; `1.login` 8/8; `4.calculo` 6/6 com 0 divergências e os mesmos totais (orçamentos 261100310-261100315); 4.5 `@bug` vermelho como esperado (5.026,97 × 9.792,48, orçamento 261100316)
- 2026-11-05 · tela 145 (cálculo) · exploração pedida pelo operador antes da suíte de cálculo: código das procedures `MOV_ATENDIMENTO_CALC*` lido no consulfarma e 40 receitas montadas só com `Calcular` (29 comparadas com o modelo, todas no centavo: unidades g/mg/mcg/ui/ufc/meq/%/qsp/ml, fatores de ficha/lote/laudo, equivalência, umidade, densidade, perda, múltiplo, índice e valor mínimo da forma); achado: texto "UMIDADE NÃO UTILIZADA" sai quando a umidade É usada; nada gravado; resumo em `PROJECT_CONTEXT.md` "Cálculo da receita na 145"
- 2026-11-06 · suite 4.calculo · 4.1 (557,35), 4.2 (224,74), 4.3 (181,50), 4.4 (5.026,97), 4.6 (636,91) e 4.7 (973,51) validados 2x isolado com 0 divergências (orçamentos gravados 261100221-261100232); 4.5 `@bug` vermelho proposital conferido por `npm run test:bugs` (esperado 5.026,97 × sistema 9.792,48, orçamento 261100233); dry-run da execução padrão sem o 4.5; regressão da 2.receitas não rodou (sem `testData.receita` nesta VM)
- 2026-11-05 · tela 128/237/145 (produção interna) · bug do operador reproduzido: item em milhão (`mlh`) de fórmula de produção interna usada na receita sai ×1000 (fórmula 1094: 3.456,42 digitada × 4.977,98 pela fórmula; 1100: 1.570,55 × 4.814,50); causa em `MOV_ATENDIMENTO_CALC2` (reatribui qtde ÷ UFC sem o ÷1000 do mlh); 237 calcula certo; orçamento com 3 fórmulas validado (193,70); nada gravado
- 2026-11-05 · ambiente · Node 26 + `npm install` + WinAppDriver 1.2.1 instalados na VM; suíte `1.login` 8/8 (32 passos, 3m04)
- 2026-10-29 · suite 3.estoque · 3.1 (entrada de lote, 216), 3.2 (conferência, 425) e 3.3 (importação de NF-e, 218 → 132: Limpar, Importação manual, relacionar itens em g) validados 2x isolado (~52 s, ~45 s, ~1m17); códigos de origem 71 e natureza 108 conferidos no banco; compras 261000009 em diante e lotes reais criados
- 2026-10-29 · tela 112/216/425/218/132/005 · gravação guiada (226 eventos, 12 checkpoints): operador repôs estoque (entrada 500.000 pela 216 no produto 1004813; conferência pela 425 levou o lote 140125.14143 de 3,6861 para 10.000,00, desbloqueando o saldo do 2.3 a confirmar para o 1004866) e importou NF-e 656731 (AQIA, 3 itens) gerando a compra 261000007 pela 218/132; ver PROJECT_CONTEXT "Reposição de estoque"
- 2026-10-28 · tela 145/433/445 · piloto do gravador de sessão: receita 261001723 criada, concluída, processo registrado e baixa feita (Baixa registrada: Sim, por 122); operador mudou a 445 para "SEM BALANÇA" (config global, vira precondição do teste); 111 eventos, 78 capturas; ver PROJECT_CONTEXT "Piloto 145 a 433"
- 2026-10-28 · suite 2.receitas · 2.1 Cria orçamento de receita alopática validado 2x isolado (145 → Calcular → 046/036 → Gravar; espera o código); suporte de janelas de topo e clique físico do SO criado; 2.2 a 2.4 pendentes
- 2026-10-28 · suite 2.receitas · 2.3 Registra o processo e a baixa validado 2x isolado (processo CONFERENCIA INICIAL 2, 433 com baixa registrada e 8 itens pesados); 433/Pesagem por coordenada absoluta + teclado; 2.4 (Omni) pendente
- 2026-10-28 · suite 2.receitas · otimização de tempo: padrão `[R-VEL]` (clique do SO + teclado + Win32, sem XPath em espera) reduz 2.1 de ~3m46 para ~1m40 e 2.2 de ~4m18 para ~1m55; NovaWindows testado e descartado (empate, incompatível); 2.1/2.2 revalidados 2x e `1.login` 32/32
- 2026-10-28 · suite 2.receitas · 2.2 Conclui a receita validado 2x isolado (entrega amanhã 10:00 em máscara: Home antes de digitar); checkpoints sem asserção deixaram uma 1ª versão passar com erro de data na tela
- 2026-10-28 · tela 046 · cliente do zero explorado ao vivo: cliente 867809 gravado (CPF, 1 telefone, 1 endereço; Bairro e Tipo do endereço obrigatórios); Nome é busca (colar com Ctrl+V) e consulta de CEP falha por TLS (ViaCEP); sem Cenário
- 2026-10-28 · tela 418/145/036 · fluxo Omni → receita → orçamento explorado ao vivo (atendimento 261000216 reaproveitado: telefone com atendimento aberto bloqueia criar novo): orçamento 261001758 gravado (39,13) e enviado pelo `Enviar orçamento`; sem Cenário
- 2026-10-28 · docs/Manuais - Pharmacie · leitura dos 54 manuais PDF (23 farmacêutica + 31 geral; 53 por 6 agentes e o do Omni Channel direto); resumos em docs/manuais-resumo/ e índice por tela em PROJECT_CONTEXT.md § "Manuais do sistema"; só texto dos PDFs, nada validado no app
- 2026-10-26 · tela 145/007/433 · receita 261001625 concluída (STATUS_MOV -1) e processo registrado (baixa junto); funcionário 122 ganhou processo padrão 1 na 007; Financeiro/Forma de pagto./Delivery/Omni ainda sem fluxo útil, ver P1-03
- 2026-10-26 · tela 145/146/047/278/345/279 · Financeiro destravado: 7 caixas antigos do 122 fechados, caixa 261000031 aberto, forma A PAGAR incluída (CODIGO_ATEND_FL 261000055); Delivery abre com tipo de operação padrão 53 na 146; flag "origem da venda" da 146 provou o impacto no Gravar da 145 (origem, setor e tipo gravados no 261001609); abas 2-6 e botões documentados
- 2026-10-26 · tela 145/279/232 · Delivery 261000017 gravado (endereço, entregador, JÁ PAGO) e em trânsito; flags medidas: Inclusão automática (permissão 682) 10,30 vs 46,60, Vlr. extra soma direto, % Desconto (permissão 154) 10% = 54,27, Animal, Revenda (232); fluxo de autorização por UIA documentado
- 2026-10-26 · tela 146/145/036/221 · flags da 146: exigir prescritor (abre 036), exigir data de retorno (bloqueia gravar; datas mascaradas, usar calendário), digitalizar ao concluir (abre 221), loja de retirada sem efeito visível; posologia nula não validada; receita 261001651 concluída; flags restauradas
- 2026-10-26 · tela 145 · homeopatia (lab 4, forma 14, QSP, 73,39) e Pagar Comissão (PAGAR_COMISSAO_FUNCIONARIO -1, funcionário 6) validados; receita 261001652
- 2026-10-26 · tela 145/146 · Carrinho (código 261000054, link de pagamento sem enviar) e flags de produto (desativados barram o Calcular; fator de correção/densidade/embalagens 38,89→42,70) validados; flags restauradas
- 2026-10-26 · tela 145/146/418 · quarentena validada (WPI 1002427 passa a usar lote em quarentena, vencimento 25/12/2026→08/03/2027) e Omni channel mapeado (menu, 418 Atendimentos/Iniciar atendimento, sem enviar mensagens); flag restaurada
- 2026-10-26 · tela 418/145/472/549/571 · Omni testado com o telefone do operador: atendimento 261000213 criado (canal 3), orçamento enviado, nota interna, status gravados; `Orçamento receita` vincula a 145 (CODIGO_OC_ATENDIMENTO, receita 261001653); entrada física do SO necessária nas MDI
- 2026-10-26 · tela 418/707/471/558 · Omni canal oficial: template 341/346 entregues, resposta do cliente recebida (janela 24 h reaberta, texto livre, imagem), Msg. Template (707), Transferir (471), Pasta do Atend., Orçamento IA e receita 261001668 vinculada ao 261000214; totalizações 558
- 2026-10-23 · tela 145 · cálculo validado e receita de teste 261001625 GRAVADA (orçamento, paciente 867092, prescritor 14991, total 46,60 = 8 itens + tx. técnica 10,00); conclusão/pagamento/delivery/omni pendentes · `PROJECT_CONTEXT.md`
- (sem registros migrados — as validações anteriores estão dentro das entradas do §2; novas entram aqui)

## 2. Log Executivo de Entregas (mais recente primeiro)
> Item entregue do backlog vira ≤ 3 linhas aqui (data, PR, resultado, o que cobre) — `AGENTS.md` `[R-SYNC]`. Os blocos abaixo vieram do antigo `ROADMAP.md` (seções "Feito"), migrados sem edição.

### Entrega (2026-11-06)

- **Suíte `0.os` (OS abertas)** — um cenário por OS, conferida no exe com a correção e massa escolhida no banco a cada rodada. `0.1` = OS 364644 (418: abrir o atendimento de outro atendente não apaga o "!" de não lidas), Esquema com as 3 regras da 635, verde 2x. Lado "o dono abre" fica no P2-14.

- **P1-04 · Suíte `2.receitas` completa** — 2.1, 2.2, 2.3 e 2.4 verdes 2x isolado. 2.3 destravado: 445 por computador (`CONFIG_0433`), itens da pesagem lidos do `ATENDIMENTO_A3`, esperas da pesagem (500 ms → 1,5 s), `Before` `@pesagem` (445 + processo padrão) e conferência de estoque antes da 433; 2.4 com asserção do envio pelo banco. Resta a transferência automática do 2.4 ao vivo (P2-13).

- **P0-01 · Isolamento de sessão — fechado** (revisão do backlog com o operador): a suíte já roda numa VM VirtualBox (Windows Server 2025 Eval, 6 GB) com desktop próprio, então não toma mais o mouse/teclado do operador. Ficaram para trás o caminho Hyper-V (o host chegou a habilitar o recurso, sem VM criada) e a ideia, nunca testada, de rodar num desktop virtual do Windows (a entrada física do SO só chega ao desktop ativo). Paralelismo com N VMs só volta como item novo.

- **Suíte `4.calculo` (cálculo da receita, 145)** — branch `feat/suite-calculo`: 7 cenários (um orçamento gravado cada), oráculo = modelo próprio (`tests/support/calculo/modelo.js`, `npm run calculo:test`) com insumos lidos do Firebird somente leitura (`calculo:contrato`); `4.5 @bug` documenta o milhão ×1000 da fórmula de produção interna (P1-06). Spec/plano em `docs/superpowers/`.

### Entrega (2026-10-26)

- **P1-03 · Tela 145: fluxo de receita, cálculo, pagamento, delivery e Omni** (exploratório, sem `Cenário`): receita concluída/baixada/paga, Delivery gravado, flags da 146 medidas, Carrinho, homeopatia, Pagar Comissão e Omni (canal oficial com resposta do cliente) documentados em `PROJECT_CONTEXT.md`. Pontas soltas: backlog P2-04.

### Feito (2026-10-09)

- Corrigida fragilidade real por trás de 4 falhas transitórias de VM
  (`1.3`/`1.4`/`1.5`/`1.6`): `listVisibleWindowsForProcess` recompilava C#
  via `Add-Type` a cada chamada de polling. Trocado por processo PowerShell
  persistente (compila 1x, 1-11ms/chamada depois). Ver `AGENTS.md` §4.
  Validado: suíte completa 8/8 cenários, 32 steps, 3m24s, zero processo
  residual.

- Coordenação multi-sessão/multi-instância desativada (não usada neste
  projeto) — regra `[R-NOMULTI]` em `AGENTS.md` §0.2; `[R-CKPT]`
  reintroduzido em versão single-session (seções "Checkpoint de tarefa em
  andamento" e "Trabalho feito e ainda não commitado" abaixo).
- Retry automático em `launchAndAttachToLogin` (`appLifecycle.js`) contra a
  instabilidade de VM sob carga cumulativa: mata+relança 1x se a janela
  "Login" não aparecer no timeout, logando aviso — não mascara bug real do
  app. Validado com suíte completa sem acionar o retry (caminho normal
  intacto). Ver `AGENTS.md` §4.
- Relatório HTML (`multiple-cucumber-html-reporter`) passou a ser gerado
  **automaticamente ao fim de `npm test`** (`onComplete` em `wdio.conf.js`),
  filtrando só a sessão que acabou de rodar (antes acumulava o histórico
  inteiro a cada chamada). `npm run report:html` ganhou filtro por sessão
  (`-- <trecho>`) e modo `--all` pra ver tendência. Ver `AGENTS.md` §8.
- Relatório HTML traduzido pra pt-BR via `scripts/report-i18n-pt-br.js`
  (`customScript`, dicionário de DOM + `MutationObserver` pra conteúdo
  re-renderizado em JS) — a lib não tem opção pública de idioma. Validado
  com Edge headless (`--dump-dom`), sem navegador real instalado no projeto.
  Ver `AGENTS.md` §8.
- Novos `Cenário: 1.7 Não autentica com usuário inválido` e `1.8 Não autentica
  com senha inválida` em `1.login.feature` (pedido do usuário). Investigação
  ao vivo prévia (script ad hoc removido) refutou a hipótese de um diálogo de
  erro — o app só limpa os campos e mantém a tela de Login; assertiva usada é
  "continua na tela de Login" seguida de login válido imediato na mesma
  execução, provando que a rejeição foi da credencial e não de uma falha
  genérica. Ver `PROJECT_CONTEXT.md` "Login com usuário/senha inválidos".
  8/8 cenários passando (32 steps) em `npm test`; `1.7`/`1.8` validados
  isolados 2x cada sem flakiness antes da suíte completa (que cascateou
  falhas transitórias de instabilidade da VM em 3 cenários pré-existentes na
  1ª tentativa — resolvido com uma pausa de 15s, ver lição em `AGENTS.md`
  §4; nenhuma relação com os cenários novos, que passaram limpos nas duas
  tentativas).
- Novo `Cenário: 1.2 Efetua logout após autenticação` em `1.login.feature`
  (pedido do usuário: a caixa "Atenção: usuário já conectado" abria porque os
  testes anteriores só matavam o processo via hard-kill, nunca clicavam em
  "Logout"). `MainPage.logout()` clica o botão "Logout" do canto superior
  direito por coordenada (`pointerType: 'touch'`, owner-drawn, sem elemento
  UIA — achado novo, ver `AGENTS.md`/`PROJECT_CONTEXT.md` "Logout
  (2026-10-09)"); `appLifecycle.waitForLogoutReturnToLogin` reanexa a sessão
  à nova janela de Login.
- Novo `Cenário: 1.3 Aviso de reconexão ao logar após encerramento abrupto
  (sem logout)`. Hipótese original do usuário (botão "Sair" deixaria sessão
  presa) foi testada ao vivo e **refutada** — "Sair" desconecta limpo, igual
  ao Logout (ver `PROJECT_CONTEXT.md` "Botão Sair NÃO reproduz..."); a causa
  real é encerramento abrupto (hard-kill) com sessão ainda ativa, já
  exercitado pelo próprio `launchAndAttachToLogin`. `proceedPastLoginToMainWindow`
  passou a retornar `true`/`false` (viu e confirmou o diálogo "Atenção") em
  vez de só tolerar em silêncio, pra asserção explícita no cenário 1.3.
- Novo `Cenário: 1.4 Login digitando o usuário pelo teclado virtual` (pedido
  do usuário, continuação de uma sessão anterior que já tinha explorado o
  ícone de teclado virtual perto do botão "Conectar" via scripts ad hoc,
  removidos depois de confirmados os achados). `LoginPage.abrirTecladoVirtual()`
  clica o ícone por coordenada (owner-drawn, mesmo padrão do Logout);
  `TecladoVirtualPage` (novo Page Object) digita no campo de preview via
  `addValue` (não `setValue`, que falha — ver `AGENTS.md`/`PROJECT_CONTEXT.md`
  "Teclado virtual na tela de Login"); `appLifecycle.waitForTecladoVirtualWindow`/
  `reattachToLoginWindow` cuidam do re-anexo de janela. Propagação do texto
  digitado confirmada com sucesso (login completo usando o usuário digitado
  só pelo teclado). 4/4 cenários passando (16 steps) em `npm test`, rodado
  2x seguidas sem flakiness.
- Novo `Cenário: 1.5 Login digitando a senha pelo teclado virtual` (pedido do
  usuário, continuação do P2 do teclado virtual). Mesma mecânica do cenário
  1.4, espelhada: campo Senha focado antes de abrir o teclado, usuário
  preenchido normalmente depois. Propagação pro campo Senha confirmada ao
  vivo — não é exclusiva do campo Usuário, segue o campo com foco no momento
  em que o teclado abre (ver `PROJECT_CONTEXT.md` "Teclado virtual na tela de
  Login"). 5/5 cenários passando (19 steps) em `npm test`; cenário 1.5
  validado isolado 2x sem flakiness antes de rodar a suíte completa.
- Investigação ao vivo (pedido do usuário): o preview do teclado virtual
  mascara a senha digitada com `#` na tela, mas **nem o dump UIA
  (`getPageSource`) nem `getAttribute('Value')`/`getText()` expõem esse
  conteúdo** (vêm `null`/vazio) — não há caminho programático pra asserir o
  mascaramento, só screenshot (fora do escopo de ferramentas atual). Ver
  `PROJECT_CONTEXT.md` "Mascaramento do preview ao digitar senha". Script
  ad hoc de investigação (`scripts/_tmp-inspect-teclado-mask.mjs`) removido
  após confirmar o achado.
- Novo `Cenário: 1.6 Login digitando usuário e senha pelo teclado virtual`
  (pedido do usuário): login 100% pelo teclado virtual, sem nenhum
  `setValue` direto — abre/digita/confirma o teclado duas vezes na mesma
  execução (Usuário, depois Senha), reanexando a sessão à janela de Login
  entre uma chamada e outra. 6/6 cenários passando (22 steps) em `npm test`;
  1.6 validado isolado 2x sem flakiness antes da suíte completa.

### Feito (2026-10-08)

- CI: workflow reescrito pra runner self-hosted nesta VM (Firebird
  inalcançável de runner hospedado) — `concurrency` em fila, check de
  `env.local.json`, geração de HTML + upload de artifact. Ver `AGENTS.md`
  §10. Falta só a parte de infraestrutura (registro do runner), pendente de
  confirmação explícita — ver `ROADMAP.md` §5 `P1-01`.
- `README.md` atualizado, sem menções ao Cypress; seções de relatórios e
  classificador de erro realinhadas ao estado atual.
- Classificador de erro ganhou categorias dinâmicas: erro desconhecido gera
  `descoberta_<palavras-chave>` persistida em
  `tests/reports/error-categories.json` (reaproveitada se a mesma forma de
  erro se repetir) — nunca mais só `causa_nao_classificada`. Ver `AGENTS.md`
  §2/§9.
- `[R-EVID]` ganhou ordem fixa de consulta a artefato de falha
  (`last-failure.log` → `last-failure.json` → dump UIA → screenshot) — ver
  `AGENTS.md` §1/§0.
- Coleta de falha persistida: `failureArtifacts.js` passou a gravar
  `failures.jsonl` (consolidado) e `last-failure.json`/`.log` (sobrescritos),
  com check de dump UIA suspeito (`uiaTreeSuspect`, < 3000 bytes). Ver
  `AGENTS.md` §9.
- Relatórios de execução: reporters Allure + cucumber-json nativo
  adicionados a `wdio.conf.js`; `sessionLabel` passou a usar timestamp BR;
  novo `scripts/generateHtmlReport.mjs` + `npm run report:html`/
  `report:allure:generate`/`report:allure:open`. `allure generate` exige
  Java/JRE (não instalado nesta máquina). Ver `AGENTS.md` §8.
- Governança adaptada do projeto irmão: `AGENTS.md` ganhou âncoras `[R-*]`
  e `## 0. Diretrizes Principais`; `PROJECT_CONTEXT.md` ganhou §12
  "Inventário Canônico de Testes" (consulta sob demanda, `L:` sempre
  reconfirmada por Grep).
- Catálogo dos menus "estilo ícone" (Usuários/Utilitários/SisPS/Ajuda/Omni
  Channel) + Rastreabilidade: 22/22 itens via `scripts/catalogIconMenus.mjs`
  (seleção por `AutomationId`). 2 itens pulados por risco (Atualizar
  sistema/SGBD), 4 itens de canto não exploráveis (sem seletor estável). Ver
  `PROJECT_CONTEXT.md` §11.1.
- Catálogo completo das 245 telas-folha dos menus nativos via
  `scripts/catalogScreens.mjs` — 245/245 com sucesso (resiliente a sessão
  morta, 3 erros consecutivos → relança o app). 1 linha suspeita sinalizada
  (`Relatórios > Abrir arquivo RPF`). Ver `PROJECT_CONTEXT.md` §11.
- Mapa completo do menu superior via `scripts/crawlMenu.mjs`: 251
  telas-folha + 59 submenus (só estrutura, não abertas individualmente). Ver
  `PROJECT_CONTEXT.md` §10.
- Ambiente local provisionado (Node.js portátil, `npm install`,
  Appium/driver `windows` funcionais) e WinAppDriver instalado e validado
  (MSI 32-bit, path real `Program Files (x86)`, `install-wad` sozinho não é
  confiável — exige `msiexec /quiet` com checagem de exit code real).
- Exploração guiada das 7 telas pedidas (145/046/032/007/112/018/418) —
  seletores e estrutura documentados via `scripts/explore.mjs` +
  `scripts/summarizeScreen.mjs`. Ver `PROJECT_CONTEXT.md` §"Inventário de
  telas por número".
- `npm test` validado de ponta a ponta contra o app real: 3/3 steps
  passando (fix do diálogo "Atenção" em `appLifecycle.js`, ver `AGENTS.md`
  §4).

### Feito (2026-10-07)

- Scaffold inicial a partir de `docs/APPIUM_WINDOWS_DESKTOP_FRAMEWORK_REFERENCE.md`
  §5: `wdio.conf.js`, `env.json`, classificador de erro (6 categorias),
  `BasePage`/`LoginPage` placeholder, `PaymentLinkService` esqueleto,
  `scripts/scanElements.js` esqueleto, `.github/workflows/tests.yml` template.
- Framework trocado de Mocha para Cucumber (`@wdio/cucumber-framework` +
  `@cucumber/cucumber`) — `@badeball/cypress-cucumber-preprocessor` pedido
  originalmente é exclusivo do Cypress, não roda em WebdriverIO.
- [x] **Primeiro cenário (`1.login.feature`) validado de ponta a ponta contra
  o app real** (múltiplas execuções consecutivas passando). WinAppDriver +
  `appium-windows-driver` instalados. Seletores reescritos de `AutomationId`
  (instável neste app) para `ClassName`+XPath/`Name` reais — ver `AGENTS.md`
  e `PROJECT_CONTEXT.md`. Novos: `windowsNative.js`, `appLifecycle.js`,
  `MainPage.js`.
- `README.md` criado na raiz (baseado em `docs/README.md` do projeto irmão),
  honesto sobre pendências (paralelismo, CI não validado).

## 3. Notas históricas
- (sem notas migradas)
