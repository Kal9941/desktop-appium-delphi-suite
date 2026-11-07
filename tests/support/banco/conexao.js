import Firebird from 'node-firebird'
import { loadEnv } from '../loadEnv.js'

// Conexão SOMENTE LEITURA com o Firebird do sistema (consulfarma), usada pela suíte 4.calculo
// para ler os insumos do cálculo e o orçamento gravado. Mesma trava do kit
// `C:\Projetos\acesso ao banco\lib\conexao.js`: só SELECT/WITH parametrizado, sem `;`, sem
// DML/DDL/EXECUTE, numa transação read-only que sempre termina em rollback. A credencial vem de
// env.local.json (`banco`) e nunca é impressa.

const PALAVRAS_PROIBIDAS = /\b(INSERT|UPDATE|DELETE|MERGE|ALTER|DROP|CREATE|RECREATE|EXECUTE|GRANT|REVOKE|COMMIT|ROLLBACK|SAVEPOINT|SET|CALL|REPLACE|EXCEPTION|POST_EVENT)\b/i
const ERRO_DE_REDE = /ETIMEDOUT|ECONNREFUSED|EHOSTUNREACH|ENETUNREACH|ENOTFOUND|ECONNRESET|EPIPE|EAI_AGAIN|Connection is closed|Connection shutdown/i
// 'Connection shutdown' (isc_att_shutdown, 335544856): o SERVIDOR encerrou a conexão (visto em 2026-11-06 no meio
// do 0.1, ~3,5 min depois do attach). A conexão está morta: descartar sem detach e anexar de novo.
const CONEXAO_ENCERRADA_PELO_SERVIDOR = /Connection shutdown/i
const TENTATIVAS = 4
const ESPERA_ENTRE_TENTATIVAS_MS = 45000
const PRAZO_DA_CONSULTA_MS = 60000

// Transação de leitura: read committed COM versão de registro (lê a última versão confirmada) e SEM
// espera. A constante ISOLATION_READ_COMMITTED_READ_ONLY do node-firebird usa no_rec_version + wait:
// a leitura da ATENDIMENTO_CALC1 ficou presa (2026-11-05) na transação que o PS01 mantém aberta
// enquanto a 046 está na tela, e o teste e o app ficaram esperando um pelo outro.
const ISC_TPB_READ_COMMITTED = 15
const ISC_TPB_REC_VERSION = 17
export const OPCOES_TRANSACAO_LEITURA = { isolation: [ISC_TPB_READ_COMMITTED, ISC_TPB_REC_VERSION], readOnly: true, wait: false }

// Uma consulta por vez na conexão única: o node-firebird não suporta consultas simultâneas na mesma
// conexão (três leituras em paralelo travaram o protocolo em 2026-11-05). A fila segue mesmo se uma falhar.
let fila = Promise.resolve()
export function emFila(tarefa) {
  const resultado = fila.then(tarefa)
  fila = resultado.catch(() => {})
  return resultado
}

// Nenhuma consulta pode prender o cenário: sem resposta no prazo → erro classificado como acesso ao banco.
export function comPrazo(promessa, prazoMs, sql) {
  let temporizador
  const estouro = new Promise((_, reject) => {
    temporizador = setTimeout(() => reject(new Error(`Sem acesso ao Firebird: a consulta não respondeu em ${prazoMs} ms (${String(sql).slice(0, 80)})`)), prazoMs)
  })
  return Promise.race([promessa, estouro]).finally(() => clearTimeout(temporizador))
}

// Remove literais ('...') para que uma palavra proibida dentro de texto não bloqueie a consulta.
function semLiterais(sql) {
  return sql.replace(/'([^']|'')*'/g, "''")
}

export function validarSomenteLeitura(sql) {
  const limpo = semLiterais(String(sql || '')).trim()
  if (!/^(SELECT|WITH)\b/i.test(limpo)) throw new Error(`Consulta recusada (somente leitura): só SELECT/WITH. ${limpo.slice(0, 60)}`)
  if (limpo.includes(';')) throw new Error('Consulta recusada (somente leitura): um comando por vez, sem ";".')
  const proibida = limpo.match(PALAVRAS_PROIBIDAS)
  if (proibida) throw new Error(`Consulta recusada (somente leitura): palavra "${proibida[1].toUpperCase()}".`)
}

export function ehErroDeRede(erro) {
  return ERRO_DE_REDE.test(String(erro?.message ?? erro))
}

// Retentável: queda de rede no attach OU no meio da consulta. No meio, o node-firebird não devolve
// erro ao callback pendente (reconecta por dentro): a consulta só cai no prazo — que também retenta.
export function deveRetentar(erro) {
  return ehErroDeRede(erro) || /não respondeu em/.test(String(erro?.message ?? erro))
}

function opcoes() {
  const banco = loadEnv().banco || {}
  for (const chave of ['host', 'database', 'user', 'password']) {
    if (!banco[chave]) throw new Error('Preencha "banco" em env.local.json (host, port, database, user, password).')
  }
  return {
    host: banco.host,
    port: Number(banco.port || 3050),
    database: banco.database,
    user: banco.user,
    password: banco.password,
    lowercase_keys: true,
    charset: 'WIN1252',
  }
}

let conexao = null

function anexar() {
  if (conexao) return conexao
  conexao = new Promise((resolve, reject) => {
    Firebird.attach(opcoes(), (erro, db) => {
      if (erro) {
        conexao = null
        reject(erro)
      } else resolve(db)
    })
  })
  return conexao
}

async function consultarUmaVez(sql, params) {
  const db = await anexar()
  const tr = await new Promise((resolve, reject) => {
    db.transaction({ ...OPCOES_TRANSACAO_LEITURA }, (erro, t) => (erro ? reject(erro) : resolve(t)))
  })
  try {
    return await new Promise((resolve, reject) => {
      tr.query(sql, params, (erro, linhas) => (erro ? reject(erro) : resolve(linhas || [])))
    })
  } finally {
    await new Promise((resolve) => tr.rollback(() => resolve()))
  }
}

// Executa um SELECT parametrizado (`?` + params). Em queda de rede, desanexa e tenta de novo
// (a VPN até o Firebird oscila por minutos); depois de TENTATIVAS, falha com "Sem acesso ao Firebird".
export async function consultar(sql, params = []) {
  validarSomenteLeitura(sql)
  for (let tentativa = 1; ; tentativa++) {
    try {
      return await emFila(() => comPrazo(consultarUmaVez(sql, params), PRAZO_DA_CONSULTA_MS, sql))
    } catch (erro) {
      if (!deveRetentar(erro)) throw erro
      // Consulta presa: abandona a conexão (pode estar travada; o detach nela também travaria).
      // Queda de rede: desanexa. Nos dois casos tenta de novo numa conexão nova.
      if (/não respondeu em/.test(erro.message) || CONEXAO_ENCERRADA_PELO_SERVIDOR.test(erro.message)) conexao = null
      else await fecharBanco()
      if (tentativa === TENTATIVAS) throw new Error(`Sem acesso ao Firebird depois de ${TENTATIVAS} tentativas (${erro.message}). A VPN Corporativa está ligada?`)
      await new Promise((resolve) => setTimeout(resolve, ESPERA_ENTRE_TENTATIVAS_MS))
    }
  }
}

export async function fecharBanco() {
  if (!conexao) return
  const pendente = conexao
  conexao = null
  try {
    const db = await pendente
    await new Promise((resolve) => db.detach(() => resolve()))
  } catch {
    // conexão nunca chegou a abrir: nada a fechar
  }
}
