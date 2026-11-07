// Captura nativa do gravador de sessão guiada: sobe um PowerShell DEDICADO que
// compila `_recorderHook.cs` (hooks globais de mouse e teclado) e traduz as
// linhas Base64 que ele emite em eventos para o Node.
//
// O script vai para um arquivo `.ps1` (modo `-File`) e NÃO por stdin (`-Command -`):
// nesse modo o próprio PowerShell consome o stdin para ler o script e disputa
// com o leitor de comandos do C# (`uia`/`fim`) — achado na fumaça de 2026-10-28.
//
// É um processo separado do PowerShell persistente de `windowsNative.js`: o
// hook precisa de uma thread com laço de mensagens e não pode disputar a fila
// de comandos do polling de janelas.
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { TITULOS_SEM_TECLAS } from './_recorderLogic.mjs'

const CODIGO_CS = readFileSync(new URL('./_recorderHook.cs', import.meta.url), 'utf-8')
const TEMPO_PRONTO_MS = 30000
const TEMPO_UIA_MS = 1000
const TEMPO_PARAR_MS = 5000

// Literal de string do PowerShell entre aspas simples (aspa simples dobrada).
function literalPs(valor) {
  return `'${String(valor).replace(/'/g, "''")}'`
}

function montarScript({ nomeProcesso, pastaShots, atrasoShotMs, teclaCheckpoint, teclaEncerrar }) {
  const referencias = ['System.Web.Extensions', 'System.Drawing', 'UIAutomationClient', 'UIAutomationTypes', 'WindowsBase']
  return [
    "$ErrorActionPreference = 'Stop'",
    "$codigo = @'",
    CODIGO_CS,
    "'@",
    `Add-Type -TypeDefinition $codigo -ReferencedAssemblies ${referencias.map(literalPs).join(',')}`,
    `[Gravador]::Iniciar(${literalPs(nomeProcesso)}, ${literalPs(pastaShots)}, ${Number(atrasoShotMs)}, ` +
      `${literalPs(teclaCheckpoint)}, ${literalPs(teclaEncerrar)}, ${literalPs(TITULOS_SEM_TECLAS.join(','))})`,
    '',
  ].join('\n')
}

/**
 * Inicia a captura nativa.
 * `pastaShots` deve ser um caminho absoluto, sem separador no fim; as capturas
 * ficam como `<pai de pastaShots>/shots/NNNN.png`.
 * `pronto` resolve quando os hooks estão instalados.
 */
export function iniciarGravadorNativo({
  nomeProcesso,
  pastaShots,
  atrasoShotMs = 400,
  teclaCheckpoint = 'C',
  teclaEncerrar = 'E',
}) {
  // O script fica na pasta da gravação (único lugar onde o gravador escreve) e é apagado em `parar()`.
  const pastaGravacao = path.dirname(pastaShots)
  mkdirSync(pastaGravacao, { recursive: true })
  const caminhoScript = path.join(pastaGravacao, 'gravador.ps1')
  writeFileSync(
    caminhoScript,
    montarScript({ nomeProcesso, pastaShots, atrasoShotMs, teclaCheckpoint, teclaEncerrar }),
    'utf-8'
  )
  const proc = spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', caminhoScript],
    { stdio: ['pipe', 'pipe', 'pipe'] }
  )

  const fila = []
  const pendentesUia = new Map()
  let aguardando = null
  let terminou = false
  let parando = false
  let erro = null
  let bufferSaida = ''
  let textoStderr = ''

  const acordar = () => {
    if (aguardando) {
      const resolver = aguardando
      aguardando = null
      resolver()
    }
  }

  let resolverPronto
  let rejeitarPronto
  const pronto = new Promise((resolve, reject) => {
    resolverPronto = resolve
    rejeitarPronto = reject
  })
  const timerPronto = setTimeout(() => {
    rejeitarPronto(
      new Error(`Gravador nativo não ficou pronto em ${TEMPO_PRONTO_MS}ms. stderr: ${textoStderr.slice(-800)}`)
    )
  }, TEMPO_PRONTO_MS)
  // Evita "unhandled rejection" se ninguém aguardar `pronto` (ex.: erro depois de pronto).
  pronto.catch(() => {})

  const tratarLinha = (linha) => {
    // Só linhas Base64 são eventos; qualquer outra coisa do PowerShell é ruído.
    if (!/^[A-Za-z0-9+/=]+$/.test(linha)) return
    let evento
    try {
      evento = JSON.parse(Buffer.from(linha, 'base64').toString('utf-8'))
    } catch {
      return
    }
    switch (evento.tipo) {
      case 'pronto':
        clearTimeout(timerPronto)
        resolverPronto()
        return
      case 'erro':
        clearTimeout(timerPronto)
        rejeitarPronto(new Error(`Gravador nativo falhou: ${evento.texto}`))
        return
      case 'uia': {
        const pendente = pendentesUia.get(evento.ref)
        if (pendente) {
          clearTimeout(pendente.timer)
          pendentesUia.delete(evento.ref)
          pendente.resolver(evento.uia ?? null)
        }
        return
      }
      case 'aviso':
        console.warn(`[gravador] ${evento.texto}`)
        return
      case 'fim':
        terminou = true
        acordar()
        return
      default:
        fila.push(evento)
        acordar()
    }
  }

  proc.stdout.on('data', (pedaco) => {
    bufferSaida += pedaco.toString('utf-8')
    let indice
    while ((indice = bufferSaida.indexOf('\n')) !== -1) {
      const linha = bufferSaida.slice(0, indice).trim()
      bufferSaida = bufferSaida.slice(indice + 1)
      if (linha) tratarLinha(linha)
    }
  })
  // Erros de compilação do C# aparecem no stderr; guardados para a mensagem de erro.
  proc.stderr.on('data', (pedaco) => {
    textoStderr += pedaco.toString('utf-8')
  })
  proc.on('exit', () => {
    if (!parando && !terminou) {
      erro = new Error(`PowerShell do gravador encerrou inesperadamente. stderr: ${textoStderr.slice(-800)}`)
      clearTimeout(timerPronto)
      rejeitarPronto(erro)
    }
    terminou = true
    acordar()
  })
  // Sem este handler, EPIPE ao escrever num PowerShell já morto derrubaria o Node.
  proc.stdin.on('error', () => {})

  async function* eventos() {
    while (true) {
      if (fila.length > 0) {
        yield fila.shift()
        continue
      }
      if (erro) throw erro
      if (terminou) return
      await new Promise((resolve) => {
        aguardando = resolve
      })
    }
  }

  function pedirUia(seq, x, y) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        pendentesUia.delete(seq)
        resolve(null)
      }, TEMPO_UIA_MS)
      pendentesUia.set(seq, { resolver: resolve, timer })
      proc.stdin.write(`uia ${seq} ${x} ${y}\n`)
    })
  }

  async function parar() {
    parando = true
    clearTimeout(timerPronto)
    if (!terminou) {
      proc.stdin.write('fim\n')
      await new Promise((resolve) => {
        const limite = setTimeout(resolve, TEMPO_PARAR_MS)
        proc.once('exit', () => {
          clearTimeout(limite)
          resolve()
        })
        const conferir = setInterval(() => {
          if (terminou) {
            clearInterval(conferir)
            clearTimeout(limite)
            resolve()
          }
        }, 50)
        setTimeout(() => clearInterval(conferir), TEMPO_PARAR_MS + 100)
      })
    }
    proc.stdin.end()
    proc.kill()
    rmSync(caminhoScript, { force: true })
    for (const pendente of pendentesUia.values()) {
      clearTimeout(pendente.timer)
      pendente.resolver(null)
    }
    pendentesUia.clear()
  }

  return { eventos: eventos(), pronto, pedirUia, parar }
}
