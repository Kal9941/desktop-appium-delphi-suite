// Gravador de sessão guiada: anota o que o operador faz no app (cliques,
// digitação, checkpoints) em `tests/reports/recordings/<rótulo>/` para o agente
// transformar a gravação num `Cenário`. NÃO é parte da suíte de testes.
//
// Uso:   npm run gravar -- [--nome=piloto] [--uia-telas=145,007]
//                         [--tecla-checkpoint=C] [--tecla-encerrar=E]
// Atalhos (com o app em foco):  Ctrl+Alt+C = checkpoint · Ctrl+Alt+E = encerrar
// Saída: 0 ok · 1 app fechado · 2 PowerShell do gravador morreu / não subiu.
import { execFileSync } from 'node:child_process'
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { once } from 'node:events'
import readline from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { loadEnv } from '../tests/support/loadEnv.js'
import { formatBrazilianTimestamp } from '../tests/support/sessionLabel.js'
import {
  agruparTeclas,
  calcularAvisos,
  lerTrace,
  montarResumo,
  ps01EmExecucao,
  resolverTela,
  telaPermiteUia,
} from './_recorderLogic.mjs'
import { iniciarGravadorNativo } from './_recorderNative.mjs'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EVENTOS_DE_MOUSE = ['clique', 'duplo', 'direito']

const { values: opcoes } = parseArgs({
  options: {
    nome: { type: 'string', default: 'piloto' },
    'uia-telas': { type: 'string', default: '145' },
    'tecla-checkpoint': { type: 'string', default: 'C' },
    'tecla-encerrar': { type: 'string', default: 'E' },
  },
})
const telasSeguras = opcoes['uia-telas'].split(',').map((t) => t.trim()).filter(Boolean)

const env = loadEnv()
const nomeProcesso = env.app.processName

// Falha cedo, ANTES de instalar qualquer hook, com o app fechado.
const saidaTasklist = execFileSync('tasklist', ['/FI', `IMAGENAME eq ${nomeProcesso}`], { encoding: 'utf-8' })
if (!ps01EmExecucao(saidaTasklist, nomeProcesso)) {
  console.error(`Abra o ${nomeProcesso} e faça login antes de gravar.`)
  process.exit(1)
}

const pastaGravacao = path.join(RAIZ, 'tests', 'reports', 'recordings', `${opcoes.nome}-${formatBrazilianTimestamp()}`)
const pastaShots = path.join(pastaGravacao, 'shots')
const caminhoTrace = path.join(pastaGravacao, 'trace.jsonl')
mkdirSync(pastaShots, { recursive: true })
// Cria o trace vazio já: uma gravação sem nenhum evento (encerrada de cara, ou com o
// PowerShell morto antes do 1º evento) ainda precisa gerar `summary.md`.
writeFileSync(caminhoTrace, '', { flag: 'a' })

// Cada linha vai direto para o disco (append síncrono): uma queda no meio
// preserva tudo até ali (`[R-RESIL]`). Nunca sobrescreve.
function gravarLinha(linha) {
  appendFileSync(caminhoTrace, `${JSON.stringify(linha)}\n`, 'utf-8')
}

function descreverNoTerminal(linha) {
  if (EVENTOS_DE_MOUSE.includes(linha.tipo)) {
    const alvo = linha.alvo.titulo ? `"${linha.alvo.titulo}"` : 'sem legenda'
    return `${linha.tipo} ${alvo} (${linha.alvo.classe}) tela ${linha.tela.numero ?? '?'}`
  }
  if (linha.tipo === 'texto') return `digitou ${linha.texto.length} caractere(s)`
  if (linha.tipo === 'tecla') return `tecla ${linha.tecla.nome}`
  return linha.tipo
}

// Devolve o texto digitado, ou `null` se o stdin já fechou (execução não interativa,
// como pelo `!` do Claude Code): `rl.question` num readline fechado lança, e o `close`
// registrado depois nunca dispara — sem isso a 2ª pergunta derrubava o CLI.
async function perguntar(rl, texto) {
  try {
    const fechou = once(rl, 'close').then(() => null)
    return await Promise.race([rl.question(texto), fechou])
  } catch {
    return null
  }
}

// O SIGINT precisa valer desde o início: um Ctrl+C durante a compilação do C# (antes de
// `pronto`) tem de encerrar o PowerShell do gravador em vez de deixá-lo pendurado.
let gravador
let interrompido = false
process.on('SIGINT', () => {
  interrompido = true
  gravador?.parar().catch(() => {})
})

try {
  gravador = iniciarGravadorNativo({
    nomeProcesso,
    pastaShots,
    teclaCheckpoint: opcoes['tecla-checkpoint'],
    teclaEncerrar: opcoes['tecla-encerrar'],
  })
  await gravador.pronto
} catch (erro) {
  console.error(`O gravador não subiu: ${erro.message}`)
  await gravador?.parar().catch(() => {})
  process.exit(2)
}

console.log(`Gravando em ${pastaGravacao}`)
console.log(
  `Ctrl+Alt+${opcoes['tecla-checkpoint'].toUpperCase()} = checkpoint · ` +
    `Ctrl+Alt+${opcoes['tecla-encerrar'].toUpperCase()} = encerrar · UIA só nas telas: ${telasSeguras.join(', ')}`
)

let ultimaTela = { numero: null, titulo: '' }
let teclasPendentes = []
const checkpoints = []
let codigoDeSaida = 0

function descarregarTeclas() {
  for (const evento of agruparTeclas(teclasPendentes)) {
    const linha = { ...evento, tela: ultimaTela }
    gravarLinha(linha)
    console.log(`  #${linha.seq} ${descreverNoTerminal(linha)}`)
  }
  teclasPendentes = []
}

try {
  for await (const bruto of gravador.eventos) {
    if (bruto.tipo === 'tecla') {
      // Tecla de navegação (Enter, Esc, F1-F12) traz as classes visíveis: a tela
      // aberta nesse instante (antes de a tecla agir) vale para o texto digitado antes dela.
      if (bruto.classesVisiveis) ultimaTela = resolverTela(bruto)
      teclasPendentes.push({
        seq: bruto.seq,
        t: bruto.t,
        tipo: 'tecla',
        tecla: bruto.tecla,
        janela: bruto.foco.handle,
        shot: bruto.shot,
      })
      continue
    }
    descarregarTeclas()
    if (bruto.tipo === 'encerrar') break

    if (EVENTOS_DE_MOUSE.includes(bruto.tipo)) {
      const tela = resolverTela(bruto)
      // Sempre acompanha a última tela vista (mesmo sem número): teclas e
      // checkpoints herdam dela, e o resumo não fragmenta o título da seção.
      ultimaTela = tela
      const permitido = telaPermiteUia(tela.numero, telasSeguras)
      const uia = permitido ? await gravador.pedirUia(bruto.seq, bruto.x, bruto.y) : null
      const linha = {
        seq: bruto.seq,
        t: bruto.t,
        tipo: bruto.tipo,
        x: bruto.x,
        y: bruto.y,
        rx: bruto.rx,
        ry: bruto.ry,
        alvo: bruto.alvo,
        cadeia: bruto.cadeia,
        tela,
        uia,
        shot: bruto.shot,
        avisos: calcularAvisos({ alvo: bruto.alvo, uiaPulado: !permitido }),
      }
      gravarLinha(linha)
      console.log(`  #${linha.seq} ${descreverNoTerminal(linha)}`)
    } else if (bruto.tipo === 'checkpoint') {
      ultimaTela = resolverTela(bruto)
      const linha = { seq: bruto.seq, t: bruto.t, tipo: 'checkpoint', tela: ultimaTela, shot: bruto.shot }
      gravarLinha(linha)
      checkpoints.push(linha)
      console.log(`  #${linha.seq} checkpoint ${checkpoints.length} gravado`)
    }
  }
  descarregarTeclas()
} catch (erro) {
  // PowerShell do gravador morreu: preserva o que já foi gravado e avisa em voz alta.
  descarregarTeclas()
  console.error(`\nERRO: ${erro.message}`)
  codigoDeSaida = 2
} finally {
  await gravador.parar().catch(() => {})
}

if (codigoDeSaida === 0 && !interrompido && checkpoints.length > 0) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  for (const [indice, checkpoint] of checkpoints.entries()) {
    console.log(`\nCheckpoint ${indice + 1} (#${checkpoint.seq}) — captura: ${path.join(pastaGravacao, checkpoint.shot ?? '')}`)
    const digitado = await perguntar(rl, 'O que validar aqui? (Enter pula) ')
    if (digitado === null) {
      console.log('\n(stdin não interativo ou fechado: anotações puladas; informe ao agente o que validar em cada checkpoint)')
      break
    }
    const resposta = digitado.trim()
    if (resposta) gravarLinha({ tipo: 'nota', ref: checkpoint.seq, texto: resposta })
  }
  rl.close()
}

const { eventos, linhasInvalidas } = lerTrace(readFileSync(caminhoTrace, 'utf-8'))
const caminhoResumo = path.join(pastaGravacao, 'summary.md')
writeFileSync(caminhoResumo, montarResumo(eventos), 'utf-8')
console.log(`\nResumo: ${caminhoResumo}${linhasInvalidas ? ` (${linhasInvalidas} linha(s) inválida(s) ignorada(s))` : ''}`)
process.exit(codigoDeSaida)
