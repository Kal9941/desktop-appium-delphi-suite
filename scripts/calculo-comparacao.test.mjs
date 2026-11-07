// Testes da comparação esperado × obtido da suíte 4.calculo. Sem app e sem banco.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TOLERANCIA, valorDaTela, comparar, tabelaDeDivergencias } from '../tests/support/calculo/comparacao.js'

test('valor da tela com milhar e vírgula', () => {
  assert.equal(valorDaTela('2.573,39'), 2573.39)
  assert.equal(valorDaTela('0,00'), 0)
  assert.equal(valorDaTela(' 87,42 '), 87.42)
})

test('valor da tela vazio ou ilegível é erro explícito', () => {
  assert.throws(() => valorDaTela(''), /valor da tela ilegível/)
  assert.throws(() => valorDaTela('abc'), /valor da tela ilegível/)
})

test('reais dentro de 0,01 não divergem', () => {
  assert.equal(TOLERANCIA.reais, 0.01)
  assert.equal(comparar('reais', 'F1', 87.425, 87.42), null)
  assert.deepEqual(comparar('reais', 'F1', 87.42, 87.44), { rotulo: 'F1', grandeza: 'reais', esperado: 87.42, obtido: 87.44 })
})

test('fator é exato na 4ª casa', () => {
  assert.notEqual(comparar('fator', 'F2 1001910', 1.0375, 1.0376), null)
  assert.equal(comparar('fator', 'F2 1001910', 1.0375, 1.0375), null)
})

test('gramas dentro de 0,0001', () => {
  assert.equal(comparar('gramas', 'F1 1005757', 15, 15.00004), null)
  assert.notEqual(comparar('gramas', 'F1 1004749', 0.1154, 115.3846), null)
})

test('obtido ausente diverge', () => {
  assert.notEqual(comparar('reais', 'F1', 10, undefined), null)
})

test('tabela lista todas as divergências', () => {
  const tabela = tabelaDeDivergencias([
    comparar('fator', 'F2 1001910', 1.0375, 1.0376),
    comparar('reais', 'F1 valor', 87.42, 90),
  ])
  assert.match(tabela, /F2 1001910/)
  assert.match(tabela, /1\.0375/)
  assert.match(tabela, /F1 valor/)
  assert.match(tabela, /fórmula · item · grandeza · esperado · obtido/)
})

// ---- Valor de cada fórmula na tela (achado de 2026-11-05: depois do "Sim" em "calcular outra
// fórmula?" a 145 já mostra a fórmula seguinte em branco; o bloco Valores acumula o orçamento) ----
import { valoresDasFormulasNaTela } from '../tests/support/calculo/comparacao.js'

test('valor de cada fórmula = diferença do acumulado; a última também pela linha da fórmula', () => {
  const telas = [
    { valorOrcamento: 87.42, valorFormula: 0 },
    { valorOrcamento: 124.96, valorFormula: 0 },
    { valorOrcamento: 193.7, valorFormula: 68.74 },
  ]
  assert.deepEqual(valoresDasFormulasNaTela(telas), [87.42, 37.54, 68.74])
})

test('última fórmula: linha da fórmula diferente da diferença do acumulado vira o valor da linha', () => {
  // a linha y=443 é a fonte da última; a diferença do acumulado fica para conferir o total
  assert.deepEqual(valoresDasFormulasNaTela([{ valorOrcamento: 50, valorFormula: 50 }]), [50])
})
