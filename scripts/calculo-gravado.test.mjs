// Testes das partes puras da leitura do cálculo gravado (suíte 4.calculo). Sem banco.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parametrosConferem } from '../tests/support/calculo/gravado.js'

const DA_RECEITA = '1;0;122;-1;1;2;0;0;1;30.00;00010057570000000500        mg00000000000;-1;4;0.00;0;0;/;Fnulo'
const DE_OUTRA_SESSAO = '1;0;122;0;1;2;0;0;1;30.00;00010013240000000400        mg00000000000;-1;4;0.00;0;0;/;Fnulo'

test('PARAMETROS confere com a fórmula digitada', () => {
  assert.equal(parametrosConferem(DA_RECEITA, { itens: [{ produto: 1005757 }] }), true)
})

test('PARAMETROS de outra sessão não confere (interferência)', () => {
  assert.equal(parametrosConferem(DE_OUTRA_SESSAO, { itens: [{ produto: 1005757 }] }), false)
})

test('PARAMETROS com vários itens exige todos, na mesma quantidade de itens', () => {
  const dois = '1;0;122;-1;1;2;0;0;1;30.00;00010057570000000300        mg0000000000000010013240000000200        mg00000000000;-1;4;0.00;0;0;/;Fnulo'
  assert.equal(parametrosConferem(dois, { itens: [{ produto: 1005757 }, { produto: 1001324 }] }), true)
  assert.equal(parametrosConferem(dois, { itens: [{ produto: 1005757 }] }), false)
})

test('PARAMETROS vazio não confere', () => {
  assert.equal(parametrosConferem('', { itens: [{ produto: 1005757 }] }), false)
})

// ---- Revisão final: a entrada registrada pelo app precisa ser a da massa (Important 1 e 4) ----
import { diferencasDaEntrada, produtosDoGravadoConferem } from '../tests/support/calculo/gravado.js'

const PARAMETROS_F1 = '1;0;122;-1;1;2;0;0;2;30.00;00010057570000000500        mg00000000000;-1;4;0.00;0;0;/;Fnulo'
const linhaDigitada = (codigoproduto, quantidade, unidade) => ({ nivelcalculo: 0, inclusaosistema: 0, codigoproduto, quantidade, unidade })

test('entrada igual à massa não tem diferenças', () => {
  const definicao = { forma: 2, total: 30, multiplo: 2, itens: [{ produto: 1005757, quantidade: 500, unidade: 'mg' }] }
  assert.deepEqual(diferencasDaEntrada({ parametros: PARAMETROS_F1, linhas: [linhaDigitada(1005757, 500, 'mg')] }, definicao), [])
})

test('múltiplo digitado errado (12 em vez de 2) é diferença', () => {
  const definicao = { forma: 2, total: 30, multiplo: 2, itens: [{ produto: 1005757, quantidade: 500, unidade: 'mg' }] }
  const parametros = PARAMETROS_F1.replace('0;0;2;30.00', '0;0;12;30.00')
  assert.deepEqual(diferencasDaEntrada({ parametros, linhas: [linhaDigitada(1005757, 500, 'mg')] }, definicao), ['múltiplo: massa 2, registrado 12'])
})

test('mesma fórmula com outra quantidade/unidade é diferença (separa 500 mg de 1 g)', () => {
  const definicao = { forma: 2, total: 30, itens: [{ produto: 1005757, quantidade: 1, unidade: 'g' }] }
  const parametros = PARAMETROS_F1.replace('0;0;2;30.00', '0;0;1;30.00')
  assert.deepEqual(diferencasDaEntrada({ parametros, linhas: [linhaDigitada(1005757, 500, 'mg')] }, definicao), ['item 1005757: massa 1 g, registrado 500 mg'])
})

test('forma sem total (tipo de informe 0) não confere o total', () => {
  const definicao = { forma: 2, total: null, itens: [{ produto: 1005757, quantidade: 500, unidade: 'mg' }] }
  assert.deepEqual(diferencasDaEntrada({ parametros: PARAMETROS_F1.replace('0;0;2;30.00', '0;0;1;0.00'), linhas: [linhaDigitada(1005757, 500, 'mg')] }, definicao), [])
})

test('A3 gravada com outros produtos não confere', () => {
  const definicao = { itens: [{ produto: 1005757 }, { produto: 1001324 }] }
  const a3 = (codigos) => codigos.map((codigo_produto) => ({ codigo_produto, inclusaosistema: 0, codigo_produto_f: null }))
  assert.equal(produtosDoGravadoConferem(a3([1005757, 1001324]), definicao), true)
  assert.equal(produtosDoGravadoConferem(a3([1005757]), definicao), false)
})
