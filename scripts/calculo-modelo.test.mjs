// Testes do modelo de cálculo da receita (suíte 4.calculo). Sem app e sem banco: os insumos
// foram medidos no banco de homologação em 2026-11-05 e congelados aqui (PROJECT_CONTEXT.md,
// "Cálculo da receita na 145"). `npm run calculo:test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  trunc4,
  round4,
  fatorTotal,
  gramasPorDose,
  precoPorGrama,
  escolherCapsula,
  excipiente,
} from '../tests/support/calculo/modelo.js'

const fichaBase = { concentracao: 100, umidade: 0, umidadeUc: 0, fatorEquiv: 1, fatorEquivUc: 0, densidade: 1 }

test('trunca e arredonda na 4ª casa como o Firebird', () => {
  assert.equal(trunc4(100 / 96.38), 1.0375)
  assert.equal(round4(0.5452 / 1.1111), 0.4907)
})

test('umidade ligada na ficha: 100/96,38 truncado', () => {
  const r = fatorTotal({ fatorCalculo: 1, movimentoEstoque: 1, ficha: { ...fichaBase, umidade: 3.62, umidadeUc: -1, densidade: 0.655 }, lote: null, laudo: null })
  assert.equal(r.fator, 1.0375)
  assert.equal(r.fonte, 'FICHA')
})

test('umidade desligada não entra', () => {
  assert.equal(fatorTotal({ fatorCalculo: 1, movimentoEstoque: 1, ficha: { ...fichaBase, umidade: 11.62, umidadeUc: 0 }, lote: null, laudo: null }).fator, 1)
})

test('equivalência ligada × correção (cloroquina)', () => {
  assert.equal(fatorTotal({ fatorCalculo: 1, movimentoEstoque: 1, ficha: { ...fichaBase, concentracao: 50.505, fatorEquiv: 1.61, fatorEquivUc: -1, densidade: 0.75 }, lote: null, laudo: null }).fator, 3.1878)
})

test('equivalência desligada (alpha GPC) = só correção', () => {
  assert.equal(fatorTotal({ fatorCalculo: 1, movimentoEstoque: 1, ficha: { ...fichaBase, concentracao: 50, fatorEquiv: 2, fatorEquivUc: 0 }, lote: null, laudo: null }).fator, 2)
})

test('lote com conc 90 + umidade 5 (passiflora)', () => {
  const r = fatorTotal({ fatorCalculo: 2, movimentoEstoque: 1, ficha: { ...fichaBase, umidadeUc: -1, densidade: 0.58 }, lote: { concentracao: 90, umidade: 5, densidade: 1 }, laudo: null })
  assert.deepEqual([r.fonte, r.fator], ['LOTE', 1.1695])
})

test('laudo conc 30,19 (magnésio)', () => {
  const r = fatorTotal({ fatorCalculo: 3, movimentoEstoque: 1, ficha: { ...fichaBase, concentracao: 30.89, umidadeUc: -1, densidade: 0.46 }, lote: { concentracao: 30.89, umidade: 0, densidade: 1 }, laudo: { concentracao: 30.19, umidade: 0, densidade: 0.86 } })
  assert.deepEqual([r.fonte, r.fator, r.densidade], ['LAUDO', 3.3123, 0.86])
})

test('FATORCALCULO 2 sem lote cai para a ficha', () => {
  const r = fatorTotal({ fatorCalculo: 2, movimentoEstoque: 1, ficha: { ...fichaBase, concentracao: 50 }, lote: null, laudo: null })
  assert.deepEqual([r.fonte, r.fator], ['FICHA', 2])
})

test('mg, mcg, g', () => {
  const ref = { unidadeUmu: 0 }
  assert.equal(gramasPorDose({ quantidade: 500, unidade: 'mg', unidadeInfo: { calculo: 1, valorIndice: 2, valorUnidade: 1000 }, referencias: ref, fator: 1, movimentoEstoque: 1 }), 0.5)
  assert.equal(gramasPorDose({ quantidade: 500000, unidade: 'mcg', unidadeInfo: { calculo: 1, valorIndice: 2, valorUnidade: 1000000 }, referencias: ref, fator: 1, movimentoEstoque: 1 }), 0.5)
  assert.equal(gramasPorDose({ quantidade: 1, unidade: 'g', unidadeInfo: { calculo: 1, valorIndice: 1, valorUnidade: 1 }, referencias: ref, fator: 1.5, movimentoEstoque: 1 }), 1.5)
})

test('ui com referência por g e por mg', () => {
  assert.equal(round4(gramasPorDose({ quantidade: 10000, unidade: 'ui', unidadeInfo: { calculo: 4, valorIndice: 1, valorUnidade: 1 }, referencias: { ui: 20400, unidadeUmu: 1 }, fator: 1, movimentoEstoque: 1 })), 0.4902)
  // betacaroteno: 25000 UI, 1666,67 UI por mg, fator do laudo 9,6153 → 4,326876 g em 30 doses
  assert.equal(round4(30 * gramasPorDose({ quantidade: 25000, unidade: 'ui', unidadeInfo: { calculo: 4, valorIndice: 1, valorUnidade: 1 }, referencias: { ui: 1666.67, unidadeUmu: 0 }, fator: 9.6153, movimentoEstoque: 1 })), 4.3269)
})

test('ufc, blh e mlh (milhão ÷ 1000)', () => {
  const info = { calculo: 6, valorIndice: 1, valorUnidade: 1 }
  assert.equal(round4(30 * gramasPorDose({ quantidade: 500, unidade: 'mlh', unidadeInfo: info, referencias: { ufc: 130, unidadeUmu: 0 }, fator: 1, movimentoEstoque: 1 })), 0.1154)
  assert.equal(30 * gramasPorDose({ quantidade: 500, unidade: 'blh', unidadeInfo: { calculo: 6, valorIndice: 1, valorUnidade: 1000 }, referencias: { ufc: 100, unidadeUmu: 0 }, fator: 1, movimentoEstoque: 1 }), 150)
  assert.equal(30 * gramasPorDose({ quantidade: 500, unidade: 'ufc', unidadeInfo: { calculo: 1, valorIndice: 1, valorUnidade: 1 }, referencias: { ufc: 200, unidadeUmu: 0 }, fator: 1, movimentoEstoque: 1 }), 75)
})

test('meq', () => {
  assert.equal(round4(30 * gramasPorDose({ quantidade: 1, unidade: 'meq', unidadeInfo: { calculo: 6, valorIndice: 1, valorUnidade: 1 }, referencias: { meq: 84, unidadeUmu: 0 }, fator: 1, movimentoEstoque: 1 })), 0.0004)
})

test('unidade sem modelo (% e qsp) é erro explícito', () => {
  assert.throws(() => gramasPorDose({ quantidade: 10, unidade: '%', unidadeInfo: { calculo: 9, valorIndice: 1, valorUnidade: 1 }, referencias: {}, fator: 1, movimentoEstoque: 1 }), /regra não modelada/)
})

test('preço ÷ correção arredondado', () => {
  assert.equal(precoPorGrama({ valorVenda: 0.5452, correcao: 1.1111, naoUtilizarFatorPreco: 0 }), 0.4907)
  assert.equal(precoPorGrama({ valorVenda: 2.178, correcao: 1.98, naoUtilizarFatorPreco: 0 }), 1.1)
})

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

test('excipiente (0,68 − 0,5) × 30 × 0,8', () => {
  assert.equal(round4(excipiente({ volumeCapsula: 0.68, quantidadePorDose: 1, volumePorDose: 0.5, qvd: 30, densidadeExcipiente: 0.8 }).gramasTotal), 4.32)
})

// ---- Task 3: valor da fórmula, fórmula interna e orçamento ----
import { valorItem, indiceDaForma, taxaTecnica, valorFormula, expandirFormulaInterna, valorOrcamento } from '../tests/support/calculo/modelo.js'

// Itens por dose como gravados na ATENDIMENTO_CALC1 (preço por grama já ÷ correção).
const item = (precoPorGrama, quantidadeG, extra = {}) => ({ precoPorGrama, quantidadeG, densidade: 1, aplicaDensidade: false, aplicaPerda: false, ...extra })
const TAXA_CAPSULA = { tipo: 1, valor: 10, percentual: 0, acrescimo: 0, multiplicarTaxa: -1 }
const EMBALAGEM_CAPSULA = [item(0.12, 30), item(5, 1), item(1.5, 1), item(1, 1), item(1, 1), item(1, 1)]
const FAIXAS_CREME = [{ valor: 90, indice: 20 }, { valor: 300, indice: 10 }]

test('R00 cápsula neutra 500 mg = 87,42', () => {
  const r = valorFormula({ itens: [item(3.96, 15), item(1.14, 4.32), ...EMBALAGEM_CAPSULA], multiplo: 1, percentualPerda: 0, faixasIndice: [], aumentorPrescritor: 0, taxa: TAXA_CAPSULA, minimoPorQvd: 0, minimoAtendimento: 0 })
  assert.equal(r.valor, 87.42)
  assert.equal(r.taxa, 10)
})

test('múltiplo 2 = 130,10 (taxa × 2)', () => {
  const r = valorFormula({ itens: [item(3.96, 9), item(0.231, 6), item(1.14, 4.32), ...EMBALAGEM_CAPSULA], multiplo: 2, percentualPerda: 0, faixasIndice: [], aumentorPrescritor: 0, taxa: TAXA_CAPSULA, minimoPorQvd: 0, minimoAtendimento: 0 })
  assert.deepEqual([r.taxa, r.valor], [20, 130.1])
})

const ITENS_CREME_50 = [item(3.96, 0.3), item(0.0605, 48.535), item(0.3344, 1), item(11, 0.165), item(4, 1), item(2, 1), item(1.0095, 1), item(1, 1), item(1, 1), item(1, 1)]

test('índice +20% no creme total 50 = 37,54', () => {
  const r = valorFormula({ itens: ITENS_CREME_50, multiplo: 1, percentualPerda: 0, faixasIndice: FAIXAS_CREME, aumentorPrescritor: 0, taxa: { tipo: 1, valor: 18, percentual: 0, acrescimo: 0, multiplicarTaxa: -1 }, minimoPorQvd: 0, minimoAtendimento: 0 })
  assert.deepEqual([r.indiceForma, r.valor], [1.2, 37.54])
})

test('mínimo por QVD: creme total 30 com 2% = 50,00', () => {
  const itens = [item(3.96, 0.6), item(0.0605, 28.701), item(0.3344, 0.6), item(11, 0.099), item(3.5, 1), item(2, 1), item(1, 1), item(1, 1), item(1.0095, 1), item(1, 1)]
  const r = valorFormula({ itens, multiplo: 1, percentualPerda: 0, faixasIndice: FAIXAS_CREME, aumentorPrescritor: 0, taxa: { tipo: 1, valor: 18, percentual: 0, acrescimo: 0, multiplicarTaxa: -1 }, minimoPorQvd: 50, minimoAtendimento: 0 })
  assert.deepEqual([r.bruto, r.valor], [35.89, 50])
})

test('perda 5% + mínimo 55 nas gomas = 55,00', () => {
  const itens = [item(3.96, 3, { aplicaPerda: true }), item(0.5, 3), item(1, 3), item(1, 1), item(3, 1)]
  const r = valorFormula({ itens, multiplo: 1, percentualPerda: 5, faixasIndice: [], aumentorPrescritor: 0, taxa: { tipo: 1, valor: 28, percentual: 0, acrescimo: 0, multiplicarTaxa: -1 }, minimoPorQvd: 0, minimoAtendimento: 55 })
  assert.deepEqual([r.bruto, r.valor], [48.97, 55])
})

test('xarope: densidade 1,2 e perda 10% no item em ml = 3,8768', () => {
  assert.equal(round4(valorItem({ precoPorGrama: 0.2937, quantidadeG: 10, multiplo: 1, densidade: 1.2, aplicaDensidade: true, percentualPerda: 10, aplicaPerda: true, indiceForma: 1, indicePrescritor: 1 })), 3.8768)
})

test('prescritor +10% multiplica cada item, não a taxa', () => {
  const r = valorFormula({ itens: [item(3.96, 15), item(1.14, 4.32), ...EMBALAGEM_CAPSULA], multiplo: 1, percentualPerda: 0, faixasIndice: [], aumentorPrescritor: 10, taxa: TAXA_CAPSULA, minimoPorQvd: 0, minimoAtendimento: 0 })
  assert.deepEqual([r.taxa, r.valor], [10, 95.17])
})

test('índice da forma: primeira faixa que cobre a soma', () => {
  assert.equal(indiceDaForma(16.2833, FAIXAS_CREME), 1.2)
  assert.equal(indiceDaForma(150, FAIXAS_CREME), 1.1)
  assert.equal(indiceDaForma(401.77, FAIXAS_CREME), 1)
  assert.equal(indiceDaForma(10, []), 1)
})

test('taxa técnica fixa × múltiplo só com MULTIPLICARTAXA -1', () => {
  assert.equal(taxaTecnica({ ...TAXA_CAPSULA, multiplo: 3, somaItens: 0 }), 30)
  assert.equal(taxaTecnica({ ...TAXA_CAPSULA, multiplicarTaxa: 0, multiplo: 3, somaItens: 0 }), 10)
})

test('fórmula interna: milhão ÷ 1000 (1094 e 1100)', () => {
  const mlh = { calculo: 6, valorIndice: 1, valorUnidade: 1 }
  const blh = { calculo: 6, valorIndice: 1, valorUnidade: 1000 }
  const f1094 = expandirFormulaInterna({ pesoFormula: 1, quantidadePorDose: 1, detalhes: [
    { codigoProduto: 1004749, quantidade: 500, unidade: 'mlh', unidadeInfo: mlh, referencias: { ufc: 130, unidadeUmu: 0 }, fator: 1, movimentoEstoque: 1 },
    { codigoProduto: 1002419, quantidade: 500, unidade: 'blh', unidadeInfo: blh, referencias: { ufc: 100, unidadeUmu: 0 }, fator: 1, movimentoEstoque: 1 },
  ] })
  assert.equal(Math.round(f1094[0].gramasPorDose * 1e6) / 1e6, 0.003846)
  assert.equal(f1094[1].gramasPorDose, 5)
  const f1100 = expandirFormulaInterna({ pesoFormula: 1, quantidadePorDose: 1, detalhes: [
    { codigoProduto: 1002418, quantidade: 600, unidade: 'mlh', unidadeInfo: mlh, referencias: { ufc: 100, unidadeUmu: 0 }, fator: 1, movimentoEstoque: 1 },
  ] })
  assert.equal(f1100[0].gramasPorDose, 0.006)
})

test('orçamento de 3 fórmulas = 193,70', () => {
  assert.equal(valorOrcamento([87.42, 37.54, 68.74]), 193.7)
})

// ---- Preço da linha da fórmula interna (CALCULOPRECO_F = 1): soma dos itens ÷ gramas da fórmula ----
import { precoDaFormulaInterna } from '../tests/support/calculo/modelo.js'

test('preço da fórmula interna = Σ(preço × gramas dos itens) ÷ gramas da fórmula', () => {
  // números do sistema com o bug do milhão (fórmula 1094, 30 u): reproduz os 163,8492 gravados
  assert.equal(precoDaFormulaInterna([{ precoPorGrama: 13.2, gramas: 115.384615 }, { precoPorGrama: 8.36, gramas: 150 }, { precoPorGrama: 8.8, gramas: 75 }, { precoPorGrama: 9.856, gramas: 150 }], 30), 163.8492)
  // e o esperado correto (crispatus 0,115385 g): 113,1308 por u
  assert.equal(precoDaFormulaInterna([{ precoPorGrama: 13.2, gramas: 0.115385 }, { precoPorGrama: 8.36, gramas: 150 }, { precoPorGrama: 8.8, gramas: 75 }, { precoPorGrama: 9.856, gramas: 150 }], 30), 113.1308)
})

// ---- Revisão final (Important 2): percentual = fração da soma das quantidades dos ativos ----
import { gramasDePercentual } from '../tests/support/calculo/modelo.js'

test('10 % sobre 12 g de ativo (4.1 F6) = 1,2 g', () => {
  assert.equal(round4(gramasDePercentual({ percentual: 10, somaDosAtivosSemFator: 12, fator: 1 })), 1.2)
})
