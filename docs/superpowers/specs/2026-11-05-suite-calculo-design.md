# Suite `4.calculo` — desenho

Data: 2026-11-05 · Desenho aprovado pelo operador em conversa, seção por seção · Fase: spec escrita, aguardando revisão do operador antes do plano de implementação.

## Objetivo
Conferir, de ponta a ponta no app desktop PS01 (tela 145), o **cálculo da receita**: quantidade de cada item, fator, preço, taxa técnica e valor de cada fórmula e do orçamento, contra um **modelo independente** das regras do sistema, com os insumos lidos do banco na hora. Motivação do operador: há bugs de cálculo em produção hoje (ex.: milhão de lactobacilo ×1000 em fórmula de produção interna) e o cálculo depende de muitas flags da ficha do produto e do lote.

Base de conhecimento (ler antes de implementar): `.agents/PROJECT_CONTEXT.md` § "Cálculo da receita na 145: motor, regras e massa" (inclui "Produção interna (telas 128 e 237) e o bug do milhão") e `docs/analise-calculo-145/` (leitura linha a linha das procedures `MOV_ATENDIMENTO_CALC*`).

## Decisões do operador (2026-11-05)
| Tema | Decisão |
|---|---|
| Oráculo | **Calculado na hora a partir do banco** (só leitura). Revoga, para esta suíte, o "Firebird fora do escopo" (`ROADMAP.md` P2-07). |
| Flags da ficha | **Produtos existentes** com cada configuração; a suíte não altera cadastro. Uma guarda confere no banco que o produto ainda tem a flag esperada. |
| Umidade | **Cálculo certo, texto errado**: `UMIDADE_UC = -1` (checkbox marcado na 112) = usar a umidade, como a ficha e o motor fazem; o texto "NÃO UTILIZADA P/ CÁLCULO" do rastro é bug de texto, registrado no backlog, sem cenário vermelho. |
| Bug conhecido | Cenário confere o valor **correto**, leva a tag `@bug` e fica fora da execução padrão e do CI até a correção. |
| Organização | **Um orçamento por tema**, várias fórmulas no mesmo orçamento (pedido do operador). |
| Evidência | **Todos os orçamentos são gravados**, com o código registrado para conferência posterior. |
| Arquitetura | **Abordagem A**: modelo próprio em JS + leitura dos insumos no banco; descartadas "confiar na tabela do motor" (não pega bug do motor) e "chamar a procedure" (grava a tabela de trabalho e é tautológica). |

## Cenários (numeração conferida por `ls tests/features` em 2026-11-05: próximo grupo = 4)
| # | Cenário (um orçamento) | Forma | Fórmulas |
|---|---|---|---|
| 4.1 | Unidades | cápsula (2), total 30 | 1005757 500 mg · 1 g · 500000 mcg · 1004105 10000 ui (UI por g) · 1000110 1 meq · 1001324 400 mg + 1005757 10 % |
| 4.2 | Fatores da ficha | cápsula, 30 | 1005813 correção 1,5 · 1001910 umidade ligada · 1001324 umidade desligada · 1000198 equivalência ligada + correção · 1005623 equivalência desligada |
| 4.3 | Lote e laudo | cápsula, 30 | 1000427 `FATORCALCULO` 2 · 1004866 (principal 1004813, lote conc. 90 + umidade) · 1000503 laudo (`FATORCALCULO` 3) · 1002518 `FATORCALCULO` 4 · 1000105 UI por mg + laudo |
| 4.4 | Lactobacilos digitados | sachê (7), 30 | itens da fórmula interna 1094 digitados (500 mlh, 500 blh, 500 ufc, 500 blh) · itens da 1100 digitados (600 blh, 2 × 600 mlh) |
| 4.5 `@bug` | Lactobacilos por fórmula interna | sachê (7), 30 | produto 1005946 (fórmula 1094) 1 u · produto 1005952 (fórmula 1100) 1 u — esperado = mesmos itens digitados (hoje sai ×1000 no milhão) |
| 4.6 | Regras da forma | várias | gomas (3) perda 5% + mínimo 55 · xarope (5) 100 ml com densidade 1,2, perda 10%, mínimo 55 · creme (1) total 50 com índice +20% · creme total 30 com 2% (mínimo 50) · creme total 200 sem índice |
| 4.7 | Múltiplo, taxa e prescritor | cápsula, 30 | 1005757 500 mg múltiplo 2 · 1005757 1500 mg múltiplo 3 (2 cápsulas nº 00) · dois ativos; gravado com prescritor de acréscimo +10% |

Os valores medidos em 2026-11-05 para cada fórmula estão no `PROJECT_CONTEXT.md` (tabela "Massa usada") e servem só de referência e de caso do teste unitário do modelo; o esperado do cenário é **sempre** recalculado com os insumos do dia.

## Componentes
| Arquivo | Responsabilidade | Depende de |
|---|---|---|
| `tests/support/banco/conexao.js` | Conexão Firebird **somente leitura**: só `SELECT` parametrizado (recusa o resto, mesma trava do kit `C:\Projetos\acesso ao banco\lib\conexao.js`), transação read-only, até 4 tentativas com espera em queda de VPN (`ECONNREFUSED`/`ETIMEDOUT`). Credenciais em `env.local.json` → `banco` (`host`, `port`, `database`, `user`, `password`); `env.json` com placeholders vazios. Nunca loga credencial. | `node-firebird` (dependência nova de desenvolvimento) |
| `tests/support/calculo/modelo.js` | Funções **puras** (sem banco, sem tela): conversão de unidade (g, mg, mcg, kg, ml, l, ui, utr, meq, ufc, blh, mlh, %, qsp, u), fator total (equivalência × correção × umidade, ficha/lote/laudo por `FATORCALCULO`, truncado em 4 casas), preço por grama (÷ correção, arredondado em 4 casas), quantidade por dose × QVD, densidade, perda, índice da forma por faixa, índice do prescritor, taxa técnica (fixa/percentual, × múltiplo), valor mínimo (`FORMAFARMACEUTICA_VALOR_MIN` e `VALORMINIMOATENDIMENTO`), expansão de fórmula interna (regra correta: milhão ÷ 1000), valor da fórmula e do orçamento. Regra não modelada → erro "regra não modelada: <qual>". | — |
| `tests/support/calculo/insumos.js` | Lê os insumos do modelo: ficha do produto e do principal (`ESTOQUE_GERAL`), lote usado (pelo `LOTE` da tabela de trabalho) e laudo aprovado (`ESTOQUE_LAUDOINTERNO` por `CODIGO_LOTE`), `UNIDADES`, forma (`FORMAFARMACEUTICA`, `_LOJABAIXA`, `_INDICE`/`_DET`, `_VALOR_MIN`), `ATENDIMENTO_CONF` da loja, fórmula interna (`ESTOQUEF`/`_DETALHE`), `MEDICO.AUMENTOR`; e as **guardas** (pré-condições de produto/forma/fórmula interna). | conexão |
| `tests/support/calculo/gravado.js` | Lê a `ATENDIMENTO_CALC1` do funcionário logo após cada `Calcular` (confere `PARAMETROS` contra a fórmula digitada) e, após o `Gravar`, `ATENDIMENTO_A1`/`A2`/`A3` pelo código do orçamento. | conexão |
| `tests/support/calculo/comparacao.js` | Compara esperado × obtido por grandeza (tolerâncias abaixo), **coleta todas** as divergências do cenário e monta a tabela da falha. | modelo |
| `tests/pages/ReceitaPage.js` (estendido) | Múltiplo (End + Backspace antes de digitar), várias fórmulas no orçamento (`Sim` em "calcular outra fórmula?"), leitura dos totais por retângulo (y=443 fórmula; y=619 orçamento), respostas aos diálogos do cálculo (uso contínuo, avisos do produto, QSP conforme a massa), paciente/prescritor/recalcular/gravar com várias fórmulas, leitura do código. Padrão `[R-VEL]`/`[R-POM]`. | appLifecycle |
| `tests/fixtures/calculo/orcamentos.json` | Massa por cenário: fórmulas (laboratório, forma, total, múltiplo, itens, resposta ao QSP) e pré-condições por produto (`FATORCALCULO`, `UMIDADE_UC`, `FATOREQUIV_UC`, `UNIDADE_UMU`, ativo, liberado para a forma; no 4.5, itens `mlh` da fórmula interna). Sem valor esperado fixo. | — |
| `tests/features/4.calculo.feature` + `tests/steps-definitions/4.calculo.steps.js` | Os 7 cenários. | todos |
| `scripts/calculo-modelo.test.mjs` (`npm run calculo:test`) | Testes unitários do modelo com os casos medidos em 2026-11-05 (insumos congelados no teste). | modelo |

## Fluxo de um cenário
```gherkin
Cenário: 4.2 Fatores da ficha do produto em um orçamento
  Dado que estou na tela de login
  Quando informo usuário e senha válidos
  Então vejo a tela principal
  E os produtos do orçamento "fatores-ficha" têm a configuração esperada na ficha
  Quando abro a tela de receita
  E monto e calculo as fórmulas do orçamento "fatores-ficha"
  Então cada fórmula calculada confere com o modelo de cálculo
  Quando escolho o paciente e o prescritor do orçamento
  E recalculo e gravo o orçamento
  Então o orçamento gravado confere com o modelo de cálculo
```
1. **Guarda**: pré-condições no banco; divergência → falha `precondicao_de_massa` antes de abrir a 145.
2. **Montar e calcular** fórmula a fórmula; após cada `Calcular`: snapshot da `ATENDIMENTO_CALC1` daquela fórmula (`PARAMETROS` conferido) + valor da fórmula na tela; `Sim` em "calcular outra fórmula?" até a última, `Não` na última.
3. **Conferir cada fórmula**: modelo (insumos do banco) × snapshot × tela.
4. **Paciente e prescritor** (046/036): cliente de teste e prescritor sem acréscimo (4.1-4.6) ou com +10% (4.7).
5. **Recalcular e gravar**: recalcula o que o app exigir ("Fórmula nº N precisa ser recalculada" — medir na implementação se vale para todas as fórmulas; se valer, percorrer pelas setas de "Nº fórmula") e grava; espera o código.
6. **Conferir o gravado**: A2/A3 de cada fórmula = modelo (com índice do prescritor); A1 = soma das fórmulas = bloco "Valores" da tela.

**Tolerâncias**: fator exato na 4ª casa (truncado); quantidade em g ±0,0001; valores em R$ ±0,01.

## Erros, `@bug`, relatório
- Categorias novas em `tests/support/errorHandler.js` (regras estáticas): `precondicao_de_massa`, `divergencia_de_calculo` (tabela fórmula · item · grandeza · esperado · obtido, com todas as divergências), `interferencia_na_tabela_de_trabalho` (`PARAMETROS` não bate: outra sessão calculou com o mesmo funcionário; sem retentativa, `[R-DIAG]`), `falha_de_acesso_ao_banco` (após 4 tentativas).
- `@bug`: só o 4.5, com comentário acima do cenário (chamado + data). `wdio.conf.js` ganha `cucumberOpts.tagExpression` de `CUCUMBER_TAGS` (padrão `not @bug`); `npm run test:bugs` roda `@bug`. `@wip`/`@skip` mantêm o significado de `[R-WIP]`. O 4.5 entra em `ROADMAP.md` §1 como vermelho proposital; o bug do milhão e o bug de texto da umidade entram no backlog.
- Evidência em `tests/reports/<sessão>/calculo/`: `<cenário>.json` (insumos, esperado, obtido por camada), `orcamentos-gravados.jsonl` (cenário, código, data, valores da tela), captura após o `Gravar`; tabela de divergências anexada ao relatório do Cucumber.

## Dados (`env.json` só com placeholders; valores reais em `env.local.json`, preenchidos pelo operador)
- `banco`: credencial do Firebird (a mesma do kit de acesso ao banco).
- `testData.clienteId` = 867092; `testData.calculo.prescritorSemAcrescimo` = 14991 (`AUMENTOR` 0); `testData.calculo.prescritorComAcrescimo` = 7 (`AUMENTOR` 10). Não usar o prescritor 1 (acréscimo de 80%).
- Loja 1, banco de homologação `consulfarma`; funcionário = `credentials.usuario`, só da suíte (decisão de 2026-11-06: o 122 é usado por outro sistema).

## Validação do próprio modelo
- `npm run calculo:test` (sem app, sem banco): os 29 cálculos medidos, o orçamento de 3 fórmulas e os 4 casos de lactobacilo (esperado correto e o resultado atual do motor, para documentar a diferença), mais truncamento do fator, arredondamento do preço, densidade, perda, índice por faixa, mínimo, taxa × múltiplo, UI com `UNIDADE_UMU` 0/1 e milhão ÷ 1000.
- Teste de contrato de `insumos.js` contra o banco (só leitura) para um produto de cada tipo: `scripts/calculo-insumos.contrato.mjs` (`npm run calculo:contrato`; precisa de VPN e da chave `banco`), separado do `calculo:test` para que este rode sem banco.

## Ordem de entrega
1. `node-firebird` + `banco/conexao.js` + chave `banco` no `env.json` → consulta de teste.
2. `calculo/modelo.js` + `calculo:test` verde.
3. `calculo/insumos.js`, `calculo/gravado.js`, `calculo/comparacao.js` → `npm run calculo:contrato` verde.
4. `ReceitaPage` estendido (incl. medir o "precisa ser recalculada" com várias fórmulas) → exercitado no 4.1.
5. Massa + feature + steps: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7 e por último 4.5 `@bug`; cada cenário **2x isolado** (`[R-RUN-ISO]`).
6. `tagExpression`/`test:bugs`, categorias de erro, docs (`PROJECT_CONTEXT.md` §12, `ROADMAP.md`, `HISTORICO.md`, README "Cobertura"), remoção dos `_tmp-*` → suíte inteira 1x + `npm run docs:lint`.

## Riscos assumidos
- Cada execução grava 7 orçamentos em homologação (sem baixa nem financeiro); cada validação 2x isolada grava 2 por cenário.
- A suíte depende de VPN e credencial do banco na máquina que roda (no runner self-hosted, P1-01, entra na cópia do `env.local.json`).
- Massa compartilhada: ficha, lote ou laudo podem mudar; a guarda transforma isso em falha de pré-condição clara, não em divergência.
- Funcionário compartilhado: um cálculo de outra pessoa ou sistema no meio vira `interferencia_na_tabela_de_trabalho`. Por isso a suíte usa um funcionário só dela (`credentials.usuario`).
- O modelo pode divergir do sistema numa regra ainda não vista; regra não modelada lança erro explícito em vez de calcular.

## Fora do escopo (registrado no backlog)
Homeopatia (dinamização, `ESTOQUEH_TABELA`), enzimas, fórmula interna com mais de um nível, forma de tipo de informe 0 (ex.: 10 Soluções: a automação ainda não inclui itens), Inclusão automática desligada, `% Desconto`/`Vlr. extra` (autorização 154), `NAO_UTILIZAR_FATOR_CALC_PRECO_A = -1`, `CALCULODENSIDADE_A = 0`, faixas de taxa por múltiplo, e gravar produção na 237 (cria lote e move estoque, `[R-RISCO]`).

## Execução
- Suíte padrão: `npm test` (sem `@bug`). Só o arquivo: `npx wdio run wdio.conf.js --spec tests/features/4.calculo.feature`. Só um cenário: `--cucumberOpts.name="<trecho do título>"` (sem ponto no trecho).
- Vermelhos propositais: `npm run test:bugs`.
- Modelo: `npm run calculo:test` (sem banco); leitura dos insumos: `npm run calculo:contrato` (com banco).
