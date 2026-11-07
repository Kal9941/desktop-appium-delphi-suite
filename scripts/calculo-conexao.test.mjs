// Testes da trava de somente leitura da conexão com o Firebird (suíte 4.calculo).
// Rodam sem banco: `npm run calculo:test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validarSomenteLeitura, ehErroDeRede } from '../tests/support/banco/conexao.js'

test('aceita SELECT e WITH', () => {
  validarSomenteLeitura('SELECT 1 FROM RDB$DATABASE')
  validarSomenteLeitura('WITH x AS (SELECT 1 AS N FROM RDB$DATABASE) SELECT N FROM x')
})

test('recusa escrita, procedure e múltiplos comandos', () => {
  for (const sql of [
    'UPDATE ESTOQUE_GERAL SET ATIVO = 0',
    'EXECUTE PROCEDURE MOV_ATENDIMENTO_CALC1',
    'SELECT 1 FROM RDB$DATABASE; DELETE FROM X',
    'insert into x values (1)',
  ]) {
    assert.throws(() => validarSomenteLeitura(sql), /somente leitura/i, sql)
  }
})

test('palavra proibida dentro de literal não bloqueia', () => {
  validarSomenteLeitura("SELECT CODIGO FROM ESTOQUE_GERAL WHERE NOMEPRODUTO = 'UPDATE'")
})

test('reconhece erro de rede', () => {
  assert.equal(ehErroDeRede(new Error('connect ECONNREFUSED 127.0.0.1:3050')), true)
  assert.equal(ehErroDeRede(new Error('Dynamic SQL Error, Column unknown')), false)
})

// ---- Leitura que não espera o app (achado de 2026-11-05: com no_rec_version + wait, a leitura da
// ATENDIMENTO_CALC1 ficou presa na transação ainda aberta do PS01, com a 046 aberta) ----
import { OPCOES_TRANSACAO_LEITURA, comPrazo } from '../tests/support/banco/conexao.js'

test('transação de leitura usa versão de registro, somente leitura e sem espera', () => {
  // isc_tpb_read_committed = 15, isc_tpb_rec_version = 17 (node-firebird/lib/wire/const.js)
  assert.deepEqual(OPCOES_TRANSACAO_LEITURA, { isolation: [15, 17], readOnly: true, wait: false })
})

test('consulta que não responde no prazo falha com mensagem clara', async () => {
  await assert.rejects(comPrazo(new Promise(() => {}), 50, 'SELECT 1'), /^Error: Sem acesso ao Firebird: a consulta não respondeu em 50 ms/)
})

test('consulta que responde no prazo devolve o resultado', async () => {
  assert.equal(await comPrazo(Promise.resolve(7), 50, 'SELECT 1'), 7)
})

// ---- Consultas em fila (achado de 2026-11-05: três consultas em paralelo na mesma conexão do
// node-firebird travaram o protocolo) ----
import { emFila } from '../tests/support/banco/conexao.js'

test('consultas simultâneas rodam uma de cada vez, na ordem', async () => {
  const eventos = []
  const tarefa = (nome, ms) => () => new Promise((resolve) => { eventos.push(`início ${nome}`); setTimeout(() => { eventos.push(`fim ${nome}`); resolve(nome) }, ms) })
  const resultados = await Promise.all([emFila(tarefa('a', 30)), emFila(tarefa('b', 5)), emFila(tarefa('c', 1))])
  assert.deepEqual(resultados, ['a', 'b', 'c'])
  assert.deepEqual(eventos, ['início a', 'fim a', 'início b', 'fim b', 'início c', 'fim c'])
})

test('uma consulta que falha não trava a fila', async () => {
  await assert.rejects(emFila(() => Promise.reject(new Error('falhou'))), /falhou/)
  assert.equal(await emFila(() => Promise.resolve('segue')), 'segue')
})

// ---- Revisão final (Important 6): queda no meio da consulta também é retentada ----
import { deveRetentar } from '../tests/support/banco/conexao.js'

test('retenta queda de rede, socket fechado e consulta sem resposta', () => {
  for (const msg of ['connect ENETUNREACH 127.0.0.1:3050', 'write EPIPE', 'getaddrinfo EAI_AGAIN db.local', 'Connection is closed.', 'Sem acesso ao Firebird: a consulta não respondeu em 60000 ms (SELECT 1)']) {
    assert.equal(deveRetentar(new Error(msg)), true, msg)
  }
  assert.equal(deveRetentar(new Error('Dynamic SQL Error, Column unknown')), false)
})
