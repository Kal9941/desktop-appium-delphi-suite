// Resume uma gravação do gravador de sessão (`recordSession.mjs`) em Markdown
// curto, para o agente ler no lugar do `trace.jsonl` bruto — mesmo papel de
// `summarizeScreen.mjs` para os dumps de tela. NÃO é parte da suíte de testes.
//
// Uso:  npm run gravar:resumo -- <pasta-da-gravação>
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { lerTrace, montarResumo } from './_recorderLogic.mjs'

const pasta = process.argv[2]
if (!pasta) {
  console.error('Uso: npm run gravar:resumo -- <pasta-da-gravação>')
  process.exit(1)
}

const caminhoTrace = path.join(pasta, 'trace.jsonl')
if (!existsSync(caminhoTrace)) {
  console.error(`trace.jsonl não encontrado em ${pasta}`)
  process.exit(1)
}

const { eventos, linhasInvalidas } = lerTrace(readFileSync(caminhoTrace, 'utf-8'))
console.log(montarResumo(eventos))
if (linhasInvalidas > 0) {
  console.log(`${linhasInvalidas} linha(s) do trace ignorada(s) (gravação interrompida?)`)
}
