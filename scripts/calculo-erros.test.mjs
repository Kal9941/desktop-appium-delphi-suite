// Classificação de falhas e de diálogos do cálculo (suíte 4.calculo). Sem app e sem banco.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyError } from '../tests/support/errorHandler.js'
import { classificarDialogoDoCalculo } from '../tests/support/calculo/cenario.js'

test('queda do Firebird é falha de acesso ao banco, não app travado', () => {
  assert.equal(classifyError(new Error('Sem acesso ao Firebird depois de 4 tentativas (connect ECONNREFUSED 127.0.0.1:3050).')).category, 'falha_de_acesso_ao_banco')
})

test('categorias próprias do cálculo', () => {
  assert.equal(classifyError(new Error('pré-condição: 1001910: UMIDADE_UC deveria ser -1 (está 0)')).category, 'precondicao_de_massa')
  assert.equal(classifyError(new Error('divergência de cálculo no orçamento "unidades"')).category, 'divergencia_de_calculo')
  assert.equal(classifyError(new Error('interferência na tabela de trabalho: PARAMETROS da fórmula 1 não confere')).category, 'interferencia_na_tabela_de_trabalho')
})

test('ECONNREFUSED do Appium continua app não responde', () => {
  assert.equal(classifyError(new Error('connect ECONNREFUSED 127.0.0.1:4723')).category, 'app_nao_responde_ou_crash')
})

test('diálogos do cálculo', () => {
  assert.equal(classificarDialogoDoCalculo('CLINDAMICINA CLORIDRATO MONOHIDRATADA Não pode ser utilizado com a forma farmacêutica selecionada!'), 'bloqueio')
  assert.equal(classificarDialogoDoCalculo('ZZZ-ÁCIDO ASCÓRBICO está desativado!!'), 'bloqueio')
  assert.equal(classificarDialogoDoCalculo('Deseja calcular outra fórmula?'), 'outra-formula')
  assert.equal(classificarDialogoDoCalculo('Deseja calcular fórmula em QSP?'), 'qsp')
  assert.equal(classificarDialogoDoCalculo('1001324 - CREATINA ** ---- Produto com quantidade abaixo das especificações ***'), 'aviso')
})

test('mensagem com prefixo "Error: " também é classificada', () => {
  assert.equal(classifyError({ message: 'Error: Sem acesso ao Firebird: a consulta não respondeu em 60000 ms (SELECT 1)' }).category, 'falha_de_acesso_ao_banco')
  assert.equal(classifyError({ message: 'Error: pré-condição: produto 1 não existe' }).category, 'precondicao_de_massa')
})

// ---- Revisão final (Important 3): fonte do fator diferente da esperada é pré-condição ----
import { conferirFonteDoFator } from '../tests/support/calculo/cenario.js'

test('produto que deveria usar o laudo e usou a ficha é pré-condição', () => {
  assert.throws(() => conferirFonteDoFator(1000503, 'LAUDO', 'FICHA', '25122281'), /^Error: pré-condição: 1000503 deveria usar os fatores do LAUDO \(usou FICHA; lote 25122281\)/)
  conferirFonteDoFator(1000503, 'LAUDO', 'LAUDO', '25122281')
  conferirFonteDoFator(1005757, undefined, 'FICHA', 'x')
})

// ---- Funcionário próprio da suíte: o código da tabela de trabalho é o usuário do login ----
import { codigoDoFuncionario } from '../tests/support/calculo/cenario.js'

test('o funcionário da tabela de trabalho é o usuário do login (env.local.json)', () => {
  assert.equal(codigoDoFuncionario('122'), 122)
  assert.equal(codigoDoFuncionario(' 950 '), 950)
  assert.equal(codigoDoFuncionario(77), 77)
})

test('usuário do login que não é código de funcionário é pré-condição', () => {
  for (const invalido of [undefined, '', 'admin', '12a', '0', '-5', '1.5']) {
    assert.throws(() => codigoDoFuncionario(invalido), /^Error: pré-condição: credentials\.usuario em env\.local\.json/)
  }
})

test('entrada divergente da massa tem categoria própria', () => {
  assert.equal(classifyError(new Error('entrada divergente da massa na fórmula 2: múltiplo: massa 2, registrado 12')).category, 'entrada_divergente_da_massa')
})
