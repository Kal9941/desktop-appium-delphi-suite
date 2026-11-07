import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs'
import path from 'node:path'
import { classifyError } from './errorHandler.js'

// Dumps reais capturados durante a exploração (tests/fixtures/screen-inventory/)
// nunca saíram abaixo de ~17 KB, mesmo pra janela principal sozinha. Abaixo
// disso, o dump provavelmente veio da janela errada/vazia (sessão presa no
// lugar errado) — equivalente ao check de "last-failure-dom.html < 5 KB" do
// cypress-pharmacie-web, recalibrado pro tamanho típico de uma árvore UIA.
const SUSPICIOUSLY_SMALL_UIA_TREE_BYTES = 3000

function formatLogLine(record) {
  const suspectNote = record.uiaTreeSuspect
    ? ' ⚠ suspeito — menor que o esperado, pode ser janela errada/vazia'
    : ''
  const discoveredNote = record.discovered ? ' (categoria nova, auto-descoberta — ver tests/reports/error-categories.json)' : ''
  return [
    `[${record.timestamp}] ${record.testTitle}`,
    `  categoria: ${record.category ?? 'causa_nao_classificada'}${discoveredNote}`,
    `  mensagem: ${record.message ?? '(sem mensagem)'}`,
    `  screenshot: ${record.screenshotPath ?? '(falhou ao capturar)'}`,
    `  uia-tree: ${record.uiaTreePath ?? '(falhou ao capturar)'} (${record.uiaTreeBytes} bytes)${suspectNote}`,
    '',
  ].join('\n')
}

// Equivalente ao last-failure-dom.html do Cypress: screenshot da janela +
// dump da árvore de UI Automation ativa no momento da falha, namespaced por
// sessão. Também persiste a classificação em disco (equivalente a
// failures.json/failures.log + last-failure.json/last-failure.log do
// cypress-pharmacie-web — ver AGENTS.md §9), já que só `console.error` some
// do scrollback do terminal assim que a execução termina.
export async function captureFailureArtifacts({
  driver, sessionLabel, testTitle, error,
}) {
  const safeTitle = testTitle.replace(/[^a-z0-9-_]+/gi, '_')
  const dir = path.join('tests', 'reports', sessionLabel)
  mkdirSync(dir, { recursive: true })

  const base = path.join(dir, safeTitle)
  const classified = error ? classifyError(error) : null

  let screenshotPath = null
  try {
    const screenshot = await driver.takeScreenshot()
    screenshotPath = `${base}.png`
    writeFileSync(screenshotPath, screenshot, 'base64')
  } catch (err) {
    writeFileSync(`${base}.screenshot-error.txt`, String(err))
  }

  let uiaTreePath = null
  let uiaTreeBytes = 0
  try {
    const uiaTree = await driver.getPageSource()
    uiaTreeBytes = Buffer.byteLength(uiaTree, 'utf-8')
    uiaTreePath = `${base}.uia-tree.xml`
    writeFileSync(uiaTreePath, uiaTree)
  } catch (err) {
    writeFileSync(`${base}.uia-tree-error.txt`, String(err))
  }

  const record = {
    timestamp: new Date().toISOString(),
    testTitle,
    category: classified?.category ?? null,
    discovered: classified?.discovered ?? false,
    message: classified?.message ?? null,
    screenshotPath,
    uiaTreePath,
    uiaTreeBytes,
    uiaTreeSuspect: uiaTreeBytes > 0 && uiaTreeBytes < SUSPICIOUSLY_SMALL_UIA_TREE_BYTES,
  }
  const logLine = formatLogLine(record)

  // Consolidado da rodada (append-only, uma linha por falha) — JSONL, padrão
  // já usado neste projeto (ver scripts/catalog*.mjs), equivalente ao
  // failures.json/failures.log do cypress-pharmacie-web.
  appendFileSync(path.join(dir, 'failures.jsonl'), `${JSON.stringify(record)}\n`, 'utf-8')
  appendFileSync(path.join(dir, 'failures.log'), logLine, 'utf-8')

  // Ponteiro rápido pra última falha (sobrescrito a cada chamada) —
  // equivalente ao last-failure.json/last-failure.log do cypress-pharmacie-web.
  writeFileSync(path.join(dir, 'last-failure.json'), JSON.stringify(record, null, 2), 'utf-8')
  writeFileSync(path.join(dir, 'last-failure.log'), logLine, 'utf-8')

  return dir
}

export function logClassifiedFailure(error) {
  const classified = classifyError(error)
  const discoveredNote = classified.discovered ? ' (categoria nova, auto-descoberta)' : ''
  // eslint-disable-next-line no-console
  console.error(`[${classified.category}]${discoveredNote} ${classified.message}`)
  return classified
}
