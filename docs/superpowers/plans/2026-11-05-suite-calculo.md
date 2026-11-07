# Suite `4.calculo` — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Suíte Cucumber `4.calculo` (7 cenários, um orçamento gravado por cenário) que confere o cálculo da receita da tela 145 contra um modelo próprio alimentado por leitura do banco Firebird.

**Architecture:** Modelo puro (`tests/support/calculo/modelo.js`, testado por `node --test` com os casos medidos em 2026-11-05) + leitura somente-leitura do banco (`tests/support/banco/conexao.js`, `calculo/insumos.js`, `calculo/gravado.js`) + comparação que coleta todas as divergências (`calculo/comparacao.js`). Os steps montam e calculam as fórmulas pela `ReceitaPage` (padrão `[R-VEL]`), comparam após cada `Calcular` (tabela de trabalho `ATENDIMENTO_CALC1` + tela) e após o `Gravar` (`ATENDIMENTO_A1/A2/A3` + bloco Valores).

**Tech Stack:** Node 26 (ESM), WebdriverIO 10 + `@wdio/cucumber-framework`, Appium driver `windows`, `node-firebird` (novo), `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-05-suite-calculo-design.md` (ler junto). Regras do sistema: `.agents/PROJECT_CONTEXT.md` § "Cálculo da receita na 145: motor, regras e massa". Regras do projeto: `.agents/AGENTS.md` (quente).

## Global Constraints
- Banco **somente leitura**: só `SELECT`/`WITH … SELECT` parametrizado, transação read-only, nunca `EXECUTE`/procedure; nunca imprimir credencial.
- Credenciais só em `env.local.json` → `banco` {`host`,`port`,`database`,`user`,`password`}; `env.json` com placeholders vazios; **nunca editar `env.local.json`** (o operador preenche).
- `testData.clienteId` = 867092, `testData.calculo.prescritorSemAcrescimo` = 14991, `testData.calculo.prescritorComAcrescimo` = 7 (vêm do `env.local.json`; falhar cedo e explícito se vazios).
- Loja 1, funcionário 122 (`CODIGO_FUNCIONARIO` da tabela de trabalho), banco `demostore`.
- Tolerâncias: fator exato na 4ª casa (truncado); quantidade em g ±0,0001; R$ ±0,01.
- Arredondamentos do motor: fator e umidade `trunc4`; preço por grama `round4`; quantidade usada no valor `round4`.
- Comentários e mensagens em pt-BR (`[R-COMENT]`); nomes de cenário `4.<n>` (`[R-NOME]`); Page Object sem banco nem asserção (`[R-POM]`).
- Commits: branch `feat/suite-calculo`, Conventional Commits em pt-BR, **sem** `Co-Authored-By` (`AGENTS.md` §11.3); push/PR só quando o operador pedir.
- Cada cenário validado **exatamente 2x isolado** (`[R-RUN-ISO]`) antes do próximo; `tasklist` sem `PS01.exe`/`node` residual ao fim de cada task (`[R-PROC]`).

## Review Focus
- Outra sessão calcula com o funcionário 122 entre o `Calcular` e a leitura → `interferencia_na_tabela_de_trabalho`, nunca divergência (teste em Task 4).
- VPN cai no meio (`ECONNREFUSED` vindo do Firebird) → retenta e, se persistir, `falha_de_acesso_ao_banco`; não pode cair na regra "app não responde", que também casa `ECONNREFUSED` (testes em Task 1 e Task 6).
- Ficha/lote/laudo mudou desde a medição (flag trocada, lote vencido, laudo novo) → `precondicao_de_massa` antes de abrir a 145 (teste em Task 4).
- Diálogo bloqueante no cálculo ("Não pode ser utilizado com a forma farmacêutica selecionada!") → falha com o texto do diálogo, sem travar a tela nem seguir para a próxima fórmula (teste em Task 6).
- Total da tela com milhar ("2.573,39") ou vazio → conversão correta ou erro explícito, nunca `NaN` silencioso (teste em Task 5).

---

### Task 1: Conexão somente leitura com o Firebird

**Files:**
- Modify: `package.json` (devDependency `node-firebird@^1.1.9`; script `"calculo:test": "node --test scripts/calculo-*.test.mjs"`)
- Modify: `env.json` (bloco `"banco": {"host": "", "port": 3050, "database": "", "user": "", "password": ""}`)
- Create: `tests/support/banco/conexao.js`
- Test: `scripts/calculo-conexao.test.mjs`

**Interfaces:**
- Produces: `validarSomenteLeitura(sql: string): void` (lança `Error`), `ehErroDeRede(erro: Error): boolean`, `consultar(sql: string, params?: unknown[]): Promise<object[]>` (chaves em minúsculo; até 4 tentativas com 45 s entre elas quando `ehErroDeRede`; depois lança `Error` com mensagem iniciada por `"Sem acesso ao Firebird"`), `fecharBanco(): Promise<void>`.

- [ ] **Step 1: Escrever os testes que falham**

```js
test('aceita SELECT e WITH', () => { validarSomenteLeitura('SELECT 1 FROM RDB$DATABASE'); validarSomenteLeitura('WITH x AS (SELECT 1 FROM RDB$DATABASE) SELECT * FROM x') })
test('recusa escrita, procedure e múltiplos comandos', () => {
  for (const sql of ['UPDATE ESTOQUE_GERAL SET ATIVO = 0', 'EXECUTE PROCEDURE MOV_ATENDIMENTO_CALC1', 'SELECT 1 FROM RDB$DATABASE; DELETE FROM X', 'insert into x values (1)'])
    assert.throws(() => validarSomenteLeitura(sql), /somente leitura/i)
})
test('palavra proibida dentro de literal não bloqueia', () => validarSomenteLeitura("SELECT CODIGO FROM ESTOQUE_GERAL WHERE NOMEPRODUTO = 'UPDATE'"))
test('reconhece erro de rede', () => { assert.equal(ehErroDeRede(new Error('connect ECONNREFUSED 127.0.0.1:3050')), true); assert.equal(ehErroDeRede(new Error('Column unknown')), false) })
```

- [ ] **Step 2: Rodar e ver falhar** — `npm run calculo:test` → FAIL (módulo inexistente).
- [ ] **Step 3: Implementar `tests/support/banco/conexao.js`** — mesma trava do kit `C:\Projetos\acesso ao banco\lib\conexao.js` (`validarSomenteLeitura` com remoção de literais antes de procurar `INSERT|UPDATE|DELETE|MERGE|ALTER|DROP|CREATE|RECREATE|EXECUTE|GRANT|REVOKE|COMMIT|ROLLBACK|SET|CALL|EXCEPTION|POST_EVENT` e `;`); `import Firebird from 'node-firebird'`; opções de `loadEnv().banco` com `lowercase_keys: true`, `charset: 'WIN1252'`; transação `Firebird.ISOLATION_READ_COMMITTED_READ_ONLY` com rollback no fim; conexão única reaproveitada (`fecharBanco` desanexa); credencial vazia → `Error('Preencha "banco" em env.local.json')`.
- [ ] **Step 4: Rodar** — `npm install` e `npm run calculo:test` → PASS.
- [ ] **Step 5: Verificar contra o banco** (operador já preencheu `banco`): `node -e "import('./tests/support/banco/conexao.js').then(async m => { console.log(await m.consultar('SELECT CODIGO FROM ESTOQUE_GERAL WHERE CODIGO = ?', [1005757])); await m.fecharBanco() })"` → `[ { codigo: 1005757 } ]`.
- [ ] **Step 6: Commit** — `git checkout -b feat/suite-calculo` (se ainda na `main`); `git add package.json package-lock.json env.json tests/support/banco scripts/calculo-conexao.test.mjs`; `git commit -m "feat(calculo): conexão somente leitura com o Firebird"`.

### Task 2: Modelo — unidade, fator, preço, cápsula e excipiente

**Files:**
- Create: `tests/support/calculo/modelo.js`
- Test: `scripts/calculo-modelo.test.mjs`

**Interfaces:**
- Produces (funções puras, números JS):
  - `trunc4(x: number): number`, `round4(x: number): number`, `round2(x: number): number`
  - `fatorTotal({ fatorCalculo, movimentoEstoque, ficha, lote, laudo }): { fonte: 'FICHA'|'LOTE'|'LAUDO', equivalencia, correcao, umidade, densidade, fator }` — `ficha` = `{ concentracao, umidade, umidadeUc, fatorEquiv, fatorEquivUc, densidade }`; `lote`/`laudo` = `{ concentracao, umidade, densidade } | null`; precedência e truncamento conforme `PROJECT_CONTEXT.md` ("Fator total"); `densidadeConfig` 0 força densidade 1 (parâmetro opcional `calculoDensidade`).
  - `gramasPorDose({ quantidade, unidade, unidadeInfo, referencias, fator, movimentoEstoque }): number` — `unidadeInfo` = linha de `UNIDADES` `{ calculo, valorIndice, valorUnidade }`; `referencias` = `{ ui, utr, ufc, meq, unidadeUmu }` (UFC/UI já com a precedência de lote/laudo); regras de `ui/utr/meq/ufc/blh/mlh`, ÷1000 com `unidadeUmu = 0`, `mlh` ÷ UFC ÷ 1000; `%` e `qsp` lançam `Error('regra não modelada: …')` (tratados em `formula`).
  - `precoPorGrama({ valorVenda, correcao, naoUtilizarFatorPreco }): number` (`round4(valorVenda / correcao)` quando `naoUtilizarFatorPreco` é 0/null).
  - `escolherCapsula(volumePorDose: number, capsulas: {codigo, volume, ordenacao}[]): { codigo, volume, quantidadePorDose }` — menor nº de cápsulas por dose (1..300); empate pela menor `ordenacao`; `volume` nulo/0 ignorado.
  - `excipiente({ volumeCapsula, quantidadePorDose, volumePorDose, qvd, densidadeExcipiente }): { gramasPorDose, gramasTotal }`.

- [ ] **Step 1: Testes que falham** (valores medidos em 2026-11-05):

```js
test('umidade ligada na ficha: 100/96,38 truncado', () => assert.equal(fatorTotal({ fatorCalculo: 1, movimentoEstoque: 1, ficha: { concentracao: 100, umidade: 3.62, umidadeUc: -1, fatorEquiv: 1, fatorEquivUc: 0, densidade: 0.655 }, lote: null, laudo: null }).fator, 1.0375))
test('umidade desligada não entra', () => assert.equal(fatorTotal({ fatorCalculo: 1, movimentoEstoque: 1, ficha: { concentracao: 100, umidade: 11.62, umidadeUc: 0, fatorEquiv: 1, fatorEquivUc: 0, densidade: 1 }, lote: null, laudo: null }).fator, 1))
test('equivalência ligada × correção (cloroquina)', () => assert.equal(fatorTotal({ fatorCalculo: 1, movimentoEstoque: 1, ficha: { concentracao: 50.505, umidade: 0, umidadeUc: 0, fatorEquiv: 1.61, fatorEquivUc: -1, densidade: 0.75 }, lote: null, laudo: null }).fator, 3.1878))
test('equivalência desligada (alpha GPC) = só correção', () => assert.equal(fatorTotal({ fatorCalculo: 1, movimentoEstoque: 1, ficha: { concentracao: 50, umidade: 0, umidadeUc: 0, fatorEquiv: 2, fatorEquivUc: 0, densidade: 1 }, lote: null, laudo: null }).fator, 2))
test('lote com conc 90 + umidade 5 (passiflora)', () => { const r = fatorTotal({ fatorCalculo: 2, movimentoEstoque: 1, ficha: { concentracao: 100, umidade: 0, umidadeUc: -1, fatorEquiv: 1, fatorEquivUc: 0, densidade: 0.58 }, lote: { concentracao: 90, umidade: 5, densidade: 1 }, laudo: null }); assert.deepEqual([r.fonte, r.fator], ['LOTE', 1.1695]) })
test('laudo conc 30,19 (magnésio)', () => { const r = fatorTotal({ fatorCalculo: 3, movimentoEstoque: 1, ficha: { concentracao: 30.89, umidade: 0, umidadeUc: -1, fatorEquiv: 1, fatorEquivUc: 0, densidade: 0.46 }, lote: { concentracao: 30.89, umidade: 0, densidade: 1 }, laudo: { concentracao: 30.19, umidade: 0, densidade: 0.86 } }); assert.deepEqual([r.fonte, r.fator, r.densidade], ['LAUDO', 3.3123, 0.86]) })
test('mg, mcg, g', () => {
  const ref = { unidadeUmu: 0 }
  assert.equal(gramasPorDose({ quantidade: 500, unidade: 'mg', unidadeInfo: { calculo: 1, valorIndice: 2, valorUnidade: 1000 }, referencias: ref, fator: 1, movimentoEstoque: 1 }), 0.5)
  assert.equal(gramasPorDose({ quantidade: 500000, unidade: 'mcg', unidadeInfo: { calculo: 1, valorIndice: 2, valorUnidade: 1000000 }, referencias: ref, fator: 1, movimentoEstoque: 1 }), 0.5)
  assert.equal(gramasPorDose({ quantidade: 1, unidade: 'g', unidadeInfo: { calculo: 1, valorIndice: 1, valorUnidade: 1 }, referencias: ref, fator: 1.5, movimentoEstoque: 1 }), 1.5)
})
test('ui com referência por g e por mg', () => { assert.equal(round4(gramasPorDose({ quantidade: 10000, unidade: 'ui', unidadeInfo: { calculo: 4, valorIndice: 1, valorUnidade: 1 }, referencias: { ui: 20400, unidadeUmu: 1 }, fator: 1, movimentoEstoque: 1 })), 0.4902) })
test('ufc, blh e mlh (milhão ÷ 1000)', () => { const ref = { ufc: 130, unidadeUmu: 0 }; assert.equal(round4(gramasPorDose({ quantidade: 500, unidade: 'mlh', unidadeInfo: { calculo: 6, valorIndice: 1, valorUnidade: 1 }, referencias: ref, fator: 1, movimentoEstoque: 1 }) * 30), 0.1154) })
test('meq', () => assert.equal(round4(gramasPorDose({ quantidade: 1, unidade: 'meq', unidadeInfo: { calculo: 6, valorIndice: 1, valorUnidade: 1 }, referencias: { meq: 84, unidadeUmu: 0 }, fator: 1, movimentoEstoque: 1 }) * 30), 0.0004))
test('preço ÷ correção arredondado', () => assert.equal(precoPorGrama({ valorVenda: 0.5452, correcao: 1.1111, naoUtilizarFatorPreco: 0 }), 0.4907))
test('cápsula nº 0 para 0,5 ml/dose e 2 nº 00 para 1,5 ml/dose', () => {
  const capsulas = [
    { codigo: 4000088, volume: 0.21, ordenacao: 1 }, { codigo: 4000047, volume: null, ordenacao: 3 },
    { codigo: 4000019, volume: 0.19, ordenacao: 4 }, { codigo: 4000080, volume: 0.68, ordenacao: 12 },
    { codigo: 4000140, volume: 0.7, ordenacao: 14 }, { codigo: 4000081, volume: 0.95, ordenacao: 17 },
    { codigo: 4000087, volume: 1.1, ordenacao: 19 },
  ]
  assert.deepEqual(escolherCapsula(0.5, capsulas), { codigo: 4000080, volume: 0.68, quantidadePorDose: 1 })
  assert.deepEqual(escolherCapsula(1.5, capsulas), { codigo: 4000081, volume: 0.95, quantidadePorDose: 2 })
})
test('excipiente (0,68 − 0,5) × 30 × 0,8', () => assert.equal(round4(excipiente({ volumeCapsula: 0.68, quantidadePorDose: 1, volumePorDose: 0.5, qvd: 30, densidadeExcipiente: 0.8 }).gramasTotal), 4.32))
```

- [ ] **Step 2: Rodar e ver falhar** — `npm run calculo:test` → FAIL.
- [ ] **Step 3: Implementar `modelo.js`** com as assinaturas acima; regras e números conforme `PROJECT_CONTEXT.md` ("Quantidade de cada item digitado", "Fator total", "Preço", "Itens incluídos pelo sistema").
- [ ] **Step 4: Rodar** — `npm run calculo:test` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(calculo): modelo de quantidade, fator, preço, cápsula e excipiente"`.

### Task 3: Modelo — valor da fórmula, fórmula interna e orçamento

**Files:**
- Modify: `tests/support/calculo/modelo.js`
- Test: `scripts/calculo-modelo.test.mjs`

**Interfaces:**
- Consumes: Task 2 (`round4`, `round2`).
- Produces:
  - `valorItem({ precoPorGrama, quantidadeG, multiplo, densidade, aplicaDensidade, percentualPerda, aplicaPerda, indiceForma, indicePrescritor }): number` — `precoPorGrama × round4(quantidadeG) × multiplo × indiceForma × indicePrescritor`, × densidade se `aplicaDensidade`, × (1 + perda/100) se `aplicaPerda`.
  - `indiceDaForma(somaItens: number, faixas: {valor, indice}[]): number` — 1 + indice/100 da 1ª faixa com `valor ≥ soma` e `indice > 0`; sem faixa → 1.
  - `taxaTecnica({ tipo, valor, percentual, acrescimo, multiplicarTaxa, multiplo, somaItens }): number` (tipo 1 = fixa; senão % da soma com mínimo `valor`; + acréscimo; × múltiplo se `multiplicarTaxa = -1`).
  - `valorFormula({ itens: {precoPorGrama, quantidadeG, densidade, aplicaDensidade, aplicaPerda}[], multiplo, percentualPerda, faixasIndice, aumentorPrescritor, taxa, minimoPorQvd, minimoAtendimento }): { itens: number[], somaItens, indiceForma, taxa, bruto, minimo, valor }` — índice calculado sobre Σ(preço × qtd × múltiplo) sem perda/densidade; `valor = max(round2(bruto), minimo)`.
  - `expandirFormulaInterna({ detalhes: {codigoProduto, quantidade, unidade, unidadeInfo, referencias, fator}[], pesoFormula, quantidadePorDose }): {codigoProduto, gramasPorDose}[]` — regra **correta** (usa `gramasPorDose`, logo `mlh` ÷ 1000).
  - `valorOrcamento(valoresFormulas: number[]): number`.

- [ ] **Step 1: Testes que falham** (casos medidos; cada um com os itens do snapshot congelados no teste):
  - `R00 cápsula neutra 500 mg = 87,42` (itens: 15 g × 3,96; excipiente 4,32 g × 1,14; cápsula 30 × 0,12; frasco 5; tampa 1,5; 3 rótulos × 1; taxa fixa 10).
  - `múltiplo 2 = 130,10` (L2-01: soma por dose 55,0508; taxa 10 × 2).
  - `índice +20% no creme total 50 = 37,54` (soma 16,2833; faixas `[{valor:90,indice:20},{valor:300,indice:10}]`; taxa 18).
  - `mínimo por QVD: creme total 30 com 2% = 50,00` (bruto 35,89).
  - `perda 5% + mínimo 55 nas gomas = 55,00` (bruto 48,97).
  - `xarope: densidade 1,2 e perda 10% no item em ml = 3,8768` (`valorItem` de 10 ml × 0,2937).
  - `prescritor +10% multiplica cada item` (`indicePrescritor` 1,1 sobre R00 → itens × 1,1, taxa inalterada).
  - `fórmula interna 1094: crispatus 500 mlh UFC 130 → 0,003846 g por u` e `1100: bifidus 600 mlh UFC 100 → 0,006 g por u` (`expandirFormulaInterna`, `pesoFormula` 1, `quantidadePorDose` 1).
  - `orçamento de 3 fórmulas = 193,70` (`valorOrcamento([87.42, 37.54, 68.74])`).
- [ ] **Step 2: Rodar e ver falhar** — `npm run calculo:test` → FAIL.
- [ ] **Step 3: Implementar** as funções acima em `modelo.js`.
- [ ] **Step 4: Rodar** — `npm run calculo:test` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(calculo): modelo do valor da fórmula, fórmula interna e orçamento"`.

### Task 4: Insumos, guardas e leitura do gravado

**Files:**
- Create: `tests/support/calculo/insumos.js`, `tests/support/calculo/gravado.js`
- Create: `scripts/calculo-insumos.contrato.mjs`; `package.json` script `"calculo:contrato": "node --test scripts/calculo-insumos.contrato.mjs"`
- Test: `scripts/calculo-gravado.test.mjs` (partes puras)

**Interfaces:**
- Consumes: Task 1 `consultar`; Task 2/3 tipos de entrada do modelo.
- Produces:
  - `insumos.js`: `lerFicha(codigo): Promise<Ficha>` (resolve `CODIGOPRINCIPAL`; devolve `{ codigo, principal, movimentoEstoque, fatorCalculo, concentracao, umidade, umidadeUc, fatorEquiv, fatorEquivUc, densidade, ui, utr, ufc, meq, unidadeUmu, valorVenda, bloquearPerda, ativo }`), `lerLoteELaudo(principal, lote): Promise<{ lote, laudo }>` (mesmo `LOTE` pode ter várias linhas: preferir a mais recente com laudo aprovado, `ESTOQUE_LAUDOINTERNO.CODIGO_LOTE`), `lerUnidades(): Promise<Map<string, UnidadeInfo>>`, `lerForma(forma, loja, estoqueBaixa): Promise<{ tipoInforme, multiplicarTaxa, percentualPerda, naoUtilizarDensidade, taxa, faixasIndice, minimoAtendimento, minimoPorQvd(qvd) }>`, `lerConfLoja(loja): Promise<{ calculoDensidade, naoUtilizarFatorPreco, casasDecimais }>`, `lerCapsulasDaForma(forma): Promise<{codigo, volume, ordenacao}[]>`, `lerFormulaInterna(produtoFormula): Promise<{ codigo, pesoFormula, detalhes }>`, `lerAumentor(prescritor): Promise<number>`, `conferirPreCondicoes(precondicoes): Promise<string[]>` (lista de violações em pt-BR, ex.: `"1001910: UMIDADE_UC deveria ser -1 (está 0)"`).
  - `gravado.js`: `parametrosConferem(parametros: string, formula): boolean` (puro: produtos em largura fixa de 41 caracteres, código com 10 dígitos), `lerTabelaDeTrabalho(funcionario): Promise<Map<number, { parametros, linhas }>>`, `lerOrcamentoGravado(codigoA1): Promise<{ a1, a2, a3 }>`.

- [ ] **Step 1: Testes puros que falham** (`scripts/calculo-gravado.test.mjs`):

```js
test('PARAMETROS confere com a fórmula digitada', () => assert.equal(parametrosConferem('1;0;122;-1;1;2;0;0;1;30.00;00010057570000000500        mg00000000000;-1;4;0.00;0;0;/;Fnulo', { itens: [{ produto: 1005757 }] }), true))
test('PARAMETROS de outra sessão não confere (interferência)', () => assert.equal(parametrosConferem('1;0;122;0;1;2;0;0;1;30.00;00010013240000000400        mg00000000000;-1;4;0.00;0;0;/;Fnulo', { itens: [{ produto: 1005757 }] }), false))
```
- [ ] **Step 2: Rodar e ver falhar** — `npm run calculo:test` → FAIL.
- [ ] **Step 3: Implementar `insumos.js` e `gravado.js`** (colunas exatas no `PROJECT_CONTEXT.md` e em `docs/analise-calculo-145/`; consultas sempre parametrizadas, colunas listadas, sem `SELECT *`; uma coluna `VARCHAR(7000)` por consulta na `ATENDIMENTO_CALC1`, senão estoura o bloco do Firebird).
- [ ] **Step 4: Rodar** — `npm run calculo:test` → PASS.
- [ ] **Step 5: Contrato contra o banco** (`scripts/calculo-insumos.contrato.mjs`): `fatorTotal(await insumos de 1001910)` = 1,0375; `1004866` resolve principal 1004813 e `lerLoteELaudo(1004813, '140125.14143')` traz concentração 90; `1000503` lote `25122281` traz laudo de concentração 30,19; `lerForma(1, 1, 4).faixasIndice` tem 90/20 e 300/10; `lerFormulaInterna(1005946)` tem 4 detalhes com 1 `mlh`; `conferirPreCondicoes([{ produto: 1001910, UMIDADE_UC: 0 }])` devolve 1 violação. Run: `npm run calculo:contrato` → PASS (se um valor tiver mudado no banco, atualizar o caso e anotar no `HISTORICO.md`).
- [ ] **Step 6: Commit** — `git commit -m "feat(calculo): leitura de insumos, guardas e orçamento gravado"`.

### Task 5: Comparação e tabela de divergências

**Files:**
- Create: `tests/support/calculo/comparacao.js`
- Test: `scripts/calculo-comparacao.test.mjs`

**Interfaces:**
- Produces: `TOLERANCIA = { fator: 0, gramas: 0.0001, reais: 0.01 }`, `valorDaTela(texto: string): number` (`"2.573,39"` → 2573.39; vazio/inválido → `Error('valor da tela ilegível: …')`), `comparar(grandeza: 'fator'|'gramas'|'reais', rotulo: string, esperado: number, obtido: number): Divergencia | null`, `tabelaDeDivergencias(divs: Divergencia[]): string` (colunas `fórmula · item · grandeza · esperado · obtido`), `Divergencia = { rotulo, grandeza, esperado, obtido }`.

- [ ] **Step 1: Testes que falham** — `valorDaTela('2.573,39') === 2573.39`; `valorDaTela('0,00') === 0`; `valorDaTela('')` lança; `comparar('reais','F1',87.42,87.43)` é `null` só se dentro de 0,01 (87,425 vs 87,42 → null; 87,44 → divergência); `comparar('fator','F2 1001910',1.0375,1.0376)` → divergência; `tabelaDeDivergencias` contém `"F2 1001910"` e `"1.0375"`.
- [ ] **Step 2: Rodar e ver falhar** — `npm run calculo:test` → FAIL.
- [ ] **Step 3: Implementar `comparacao.js`.**
- [ ] **Step 4: Rodar** — `npm run calculo:test` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(calculo): comparação esperado × obtido com tabela de divergências"`.

### Task 6: Tela, steps, erros e o cenário 4.1 (fatia vertical)

**Files:**
- Modify: `tests/pages/ReceitaPage.js` (múltiplo, aba Produtos, totais, várias fórmulas, código)
- Modify: `tests/support/errorHandler.js` (4 categorias novas **antes** das regras atuais)
- Create: `tests/support/calculo/cenario.js` (orquestra modelo × tabela × tela × gravado; acumula divergências e evidências)
- Create: `tests/support/receita.js` (helpers de paciente/prescritor/recalcular/gravar extraídos de `tests/steps-definitions/2.receitas.steps.js`, que passa a importá-los sem mudar comportamento)
- Create: `tests/fixtures/calculo/orcamentos.json` (só `"unidades"` nesta task)
- Create: `tests/features/4.calculo.feature`, `tests/steps-definitions/4.calculo.steps.js`
- Test: `scripts/calculo-erros.test.mjs`

**Interfaces:**
- Consumes: Tasks 1-5; `appLifecycle.js` (`clicarFisico`, `responderJanelaDeTopo`, `listarDialogosAbertos`, `aguardarJanelaComTitulo`), `ClientePage`, `PrescritorPage`, `MainPage`.
- Produces:
  - `ReceitaPage`: `informarMultiplo(n)` (clique em (242,233), End + 4 Backspace, digitar, Enter), `abrirAbaProdutos()` (clique em (130,301)), `lerTotais(): Promise<{ txTecnica, valorFormula, valorOrcamento, multiplo, totalMultiplo }>` (uma busca XPath pelos retângulos y=443 x=714/987, y=619 x=987, y=226 x=222, y=262 x=503), `codigoDoOrcamento()`.
  - Steps (texto exato): `os produtos do orçamento {string} têm a configuração esperada na ficha`, `monto e calculo as fórmulas do orçamento {string}`, `cada fórmula calculada confere com o modelo de cálculo`, `escolho o paciente e o prescritor do orçamento` (prescritor lido de `testData.calculo.prescritorSemAcrescimo` ou `…ComAcrescimo` conforme o campo `prescritor` da massa; **texto novo**: o `escolho o paciente e o prescritor de teste` da `2.receitas` usa o prescritor dela e não pode ser redefinido — os helpers de 046/036 daquele arquivo vão para `tests/support/receita.js` e os dois steps os usam), `recalculo e gravo o orçamento`, `o orçamento gravado confere com o modelo de cálculo`.
  - `cenario.js`: `classificarDialogoDoCalculo(texto: string): 'outra-formula'|'qsp'|'bloqueio'|'aviso'` (puro; "calcular outra fórmula" → `outra-formula`; "em QSP" → `qsp`; "Não pode ser utilizado", "desativado", "não pode ser utilizado no atendimento", "CÁLCULO PROIBIDO" → `bloqueio`; demais → `aviso`).
  - `ErrorCategory.PRECONDICAO_DE_MASSA` (`/^pré-condição:/`), `DIVERGENCIA_DE_CALCULO` (`/^divergência de cálculo/`), `INTERFERENCIA_NA_TABELA` (`/^interferência na tabela de trabalho/`), `FALHA_DE_ACESSO_AO_BANCO` (`/^Sem acesso ao Firebird/`).
  - Evidência: `tests/reports/<sessão>/calculo/<cenario>.json` e `orcamentos-gravados.jsonl` (`{ cenario, codigo, em, valores }`); tabela anexada com `this.attach(tabela, 'text/plain')`.
  - `orcamentos.json`: `{ "<chave>": { "cenario": "4.1", "prescritor": "semAcrescimo"|"comAcrescimo", "formulas": [{ "laboratorio", "forma", "total", "multiplo", "qsp": false, "itens": [{ "produto", "quantidade", "unidade" }] }], "precondicoes": [{ "produto", "<COLUNA>": valor }] } }`.

- [ ] **Step 1: Testes de classificação que falham** (`scripts/calculo-erros.test.mjs`): `classifyError(new Error('Sem acesso ao Firebird (connect ECONNREFUSED 127.0.0.1:3050)')).category === 'falha_de_acesso_ao_banco'` (e **não** `app_nao_responde_ou_crash`); `pré-condição: …` → `precondicao_de_massa`; `divergência de cálculo …` → `divergencia_de_calculo`; `interferência na tabela de trabalho …` → `interferencia_na_tabela_de_trabalho`. E `classificarDialogoDoCalculo`: `'CLINDAMICINA CLORIDRATO MONOHIDRATADA Não pode ser utilizado com a forma farmacêutica selecionada!'` → `bloqueio`; `'Deseja calcular outra fórmula?'` → `outra-formula`; `'Deseja calcular fórmula em QSP?'` → `qsp`; `'Produto com quantidade abaixo das especificações ***'` → `aviso`.
- [ ] **Step 2: Rodar e ver falhar** — `npm run calculo:test` → FAIL.
- [ ] **Step 3: Implementar as regras no `errorHandler.js`** (no início do array `RULES`) e `classificarDialogoDoCalculo` em `cenario.js`.
- [ ] **Step 4: Rodar** — `npm run calculo:test` → PASS.
- [ ] **Step 5: Massa do 4.1** em `orcamentos.json` (chave `"unidades"`, fórmulas da spec, precondições: 1005757 `FATORCALCULO` 1 e `CONCENTRACAO` 100; 1004105 `UNIDADE_UMU` 1; 1000110 `MEQ` 84; 1001324 `UMIDADE_UC` 0), feature com o `Cenário: 4.1 Unidades de prescrição em um orçamento` no formato da spec, `ReceitaPage` estendida, `cenario.js` e steps. Diálogo com "Não pode ser utilizado" ou "desativado" durante o cálculo → lançar `Error('pré-condição: <texto do diálogo>')`.
- [ ] **Step 6: Medir e implementar o recálculo com várias fórmulas**: no `recalculo e gravo o orçamento`, se "Fórmula nº N precisa ser recalculada" aparecer para N > 1, percorrer pelas setas de "Nº fórmula" (dump UIA ao vivo antes de fixar coordenadas, `[R-SEL]`); registrar o achado em `PROJECT_CONTEXT.md` (seção do cálculo).
- [ ] **Step 6b: Regressão da `2.receitas`** após extrair os helpers para `tests/support/receita.js`: `--cucumberOpts.name="Cria orçamento de receita"` 1x → passing (se o `testData.receita` estiver preenchido; senão registrar que não foi possível e seguir).
- [ ] **Step 7: Validar 4.1 2x isolado** — `npx wdio run wdio.conf.js --spec tests/features/4.calculo.feature --cucumberOpts.name="Unidades de prescrição"` duas vezes → 1 passing cada; `orcamentos-gravados.jsonl` com 1 código por execução; `tasklist` sem residual. Falha → `[R-EVID]` (`last-failure.log` primeiro) e `[R-DIAG]`.
- [ ] **Step 8: Commit** — `git commit -m "feat(calculo): cenário 4.1 com oráculo do banco e orçamento gravado"`.

### Task 7: Cenários 4.2 (fatores da ficha) e 4.3 (lote e laudo)

**Files:**
- Modify: `tests/fixtures/calculo/orcamentos.json` (chaves `"fatores-ficha"`, `"lote-laudo"`), `tests/features/4.calculo.feature`

**Interfaces:**
- Consumes: steps e `cenario.js` da Task 6 (sem step novo).

- [ ] **Step 1: Massa** — fórmulas e produtos da spec; precondições: 1005813 `CONCENTRACAO` 66,6666 e `FATORCALCULO` 1; 1001910 `UMIDADE_UC` -1; 1001324 `UMIDADE_UC` 0 e `UMIDADE` > 0; 1000198 `FATOREQUIV_UC` -1; 1005623 `FATOREQUIV_UC` 0 e `FATOREQUIV` 2; 1000427 `FATORCALCULO` 2; 1004866 `CODIGOPRINCIPAL` 1004813 e principal `FATORCALCULO` 2; 1000503 `FATORCALCULO` 3; 1002518 `FATORCALCULO` 4; 1000105 `FATORCALCULO` 3 e `UNIDADE_UMU` 0.
- [ ] **Step 2: Cenários** `4.2 Fatores da ficha do produto em um orçamento` e `4.3 Fatores do lote e do laudo em um orçamento`.
- [ ] **Step 3: Validar cada um 2x isolado** (`--cucumberOpts.name="Fatores da ficha"`, depois `"lote e do laudo"`) → 1 passing por execução.
- [ ] **Step 4: Commit** — `git commit -m "feat(calculo): cenários 4.2 fatores da ficha e 4.3 lote e laudo"`.

### Task 8: Cenários 4.4 (lactobacilos digitados) e 4.6 (regras da forma)

**Files:**
- Modify: `orcamentos.json` (`"lactobacilos-digitados"`, `"regras-da-forma"`), `4.calculo.feature`

- [ ] **Step 1: Massa 4.4** — sachê forma 7, laboratório 3, total 30: itens da 1094 (1004749 500 mlh, 1002419 500 blh, 1002421 500 ufc, 1004031 500 blh) e da 1100 (1002419 600 blh, 1002418 600 mlh, 1002420 600 mlh); precondições: UFC > 0 em todos.
- [ ] **Step 2: Massa 4.6** — gomas (lab 1, forma 3, total 30, 1005757 100 mg); xarope (lab 1, forma 5, total 100, 1005425 10 ml + 1001034 100 qsp(ml), `"qsp": false`); creme total 50 (1005757 300 mg + 1000231 50 qsp(g)); creme total 30 (1005757 2 % + 1000231 30 qsp(g)); creme total 200 (1005757 100 g + 1000231 200 qsp(g)). Guardas de cenário: forma 1 com faixas de índice e `FORMAFARMACEUTICA_VALOR_MIN` (QVD 30 → 50); formas 3 e 5 com `VALORMINIMOATENDIMENTO` 55.
- [ ] **Step 3: Cenários** `4.4 Lactobacilos em bilhão, milhão e UFC digitados` e `4.6 Regras da forma farmacêutica em um orçamento`; validar cada um 2x isolado.
- [ ] **Step 4: Commit** — `git commit -m "feat(calculo): cenários 4.4 lactobacilos digitados e 4.6 regras da forma"`.

### Task 9: Cenário 4.7 (múltiplo, taxa e prescritor com acréscimo)

**Files:**
- Modify: `orcamentos.json` (`"multiplo-prescritor"`, `"prescritor": "comAcrescimo"`), `4.calculo.feature`

- [ ] **Step 1: Massa** — cápsula, total 30: 1005757 500 mg múltiplo 2; 1005757 1500 mg múltiplo 3; 1005757 300 mg + 1001324 200 mg. Guarda: `MEDICO.AUMENTOR` do prescritor com acréscimo > 0 e do sem acréscimo = 0.
- [ ] **Step 2: Cenário** `4.7 Múltiplo, taxa técnica e acréscimo do prescritor`; o gravado confere itens × (1 + `AUMENTOR`/100) e taxa × múltiplo; validar 2x isolado.
- [ ] **Step 3: Commit** — `git commit -m "feat(calculo): cenário 4.7 múltiplo, taxa e acréscimo do prescritor"`.

### Task 10: Cenário 4.5 `@bug` e filtro de tags

**Files:**
- Modify: `wdio.conf.js` (`cucumberOpts.tagExpression: process.env.CUCUMBER_TAGS ?? 'not @bug'`)
- Create: `scripts/testBugs.mjs` (define `process.env.CUCUMBER_TAGS = '@bug'` e chama `npx wdio run wdio.conf.js` com `spawnSync`, `stdio: 'inherit'`, `shell: true`, repassando os argumentos e o código de saída); `package.json` `"test:bugs": "node scripts/testBugs.mjs"`
- Modify: `orcamentos.json` (`"lactobacilos-formula-interna"`), `4.calculo.feature`
- Modify: `cenario.js` (esperado dos itens de nível 1 vem de `expandirFormulaInterna`)

- [ ] **Step 1: Massa** — sachê forma 7, total 30: 1005946 1 u; 1005952 1 u; guardas: `lerFormulaInterna(1005946)` com 1 item `mlh`, `lerFormulaInterna(1005952)` com 2 itens `mlh`.
- [ ] **Step 2: Cenário** `4.5 Lactobacilos por fórmula de produção interna` com `@bug` e a linha `# Bug: item em milhão (mlh) da fórmula interna sai ×1000 (MOV_ATENDIMENTO_CALC2). Chamado: <nº informado pelo operador>. 2026-11-05.`
- [ ] **Step 3: Verificar o vermelho proposital** — `npm run test:bugs` → 1 failing com `divergência de cálculo` mostrando crispatus esperado 0,1154 g × obtido 115,3846 g (1094) e bifidus/bulgaricus 0,18 × 180 (1100); `npm test` não executa o 4.5 (`--dry-run` lista os cenários sem ele).
- [ ] **Step 4: Commit** — `git commit -m "test(calculo): cenário 4.5 @bug do milhão na fórmula de produção interna"`.

### Task 11: Documentação, limpeza e suíte inteira

**Files:**
- Delete: `tests/features/_tmp-calculo145.feature`, `tests/features/_tmp-ficha112.feature`, `tests/features/_tmp-telas.feature`, `tests/steps-definitions/_tmp-calculo145.steps.js`
- Modify: `.agents/PROJECT_CONTEXT.md` (§12.0 contagem 22 `Cenário`s e 4 arquivos; §12.4 tabela `4.calculo` com `L:` por Grep), `.agents/ROADMAP.md` (§1 contagem e exceção ativa 4.5 `@bug`; §2: item do bug do milhão, item do bug de texto da umidade, item "pendências do cálculo" com o fora-de-escopo da spec; P2-07 atualizado; §4.1/§4.2), `.agents/HISTORICO.md` (§1 validações 2x; §2 entrega ≤ 3 linhas), `.agents/AGENTS.md` §10 `[R-CI]` (VPN + chave `banco` no `_work`), `README.md` ("Cobertura Atual de Testes", "Configuração": chave `banco` e `testData.calculo`, comandos `calculo:test`, `calculo:contrato`, `test:bugs`)

- [ ] **Step 1: Apagar os `_tmp-*`** e confirmar `git status` sem eles.
- [ ] **Step 2: Atualizar a documentação** acima.
- [ ] **Step 3: Suíte inteira 1x** — `npm test` → 21 passing (1.login 8, 2.receitas 4 se o `testData.receita` estiver preenchido, 3.estoque 3, 4.calculo 6) e o 4.5 fora; `npm run calculo:test` e `npm run calculo:contrato` verdes; `npm run docs:lint` → OK; `tasklist` sem residual.
- [ ] **Step 4: Commit** — `git commit -m "docs(calculo): inventário, backlog e README da suíte 4.calculo"`.
