// Abre CADA tela-folha do menu superior (uma por uma) e registra o número
// de tela (extraído do título da janela "[ NNN ] - Descrição") + o caminho
// de menu, pra documentar em .agents/PROJECT_CONTEXT.md. NÃO faz parte da
// suíte de testes — é exploração.
//
// Uso: node scripts/catalogScreens.mjs
// Lê:  tests/fixtures/menu-map/_leaf-paths.json (lista de caminhos, gerada
//      a partir dos JSONs do crawlMenu.mjs)
// Saída incremental (append, 1 linha JSON por item): tests/fixtures/screen-catalog.jsonl
// Resumível: pula caminhos cujo "key" (caminho join " > ") já está no jsonl.
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import {
  loginAndReachMainWindow, cleanup, pressKey, VK_ESCAPE,
} from './_exploreShared.mjs'

const LEAF_PATHS_FILE = process.argv[2] || path.join('tests', 'fixtures', 'menu-map', '_leaf-paths.json')
const OUT_JSONL = path.join('tests', 'fixtures', 'screen-catalog.jsonl')
const SHOT_DIR = path.join('tests', 'fixtures', 'screen-catalog-shots')
mkdirSync(SHOT_DIR, { recursive: true })

function escapeXPathLiteral(value) {
  if (!value.includes('"')) return `"${value}"`
  return `concat("${value.split('"').join('", \'"\', "')}")`
}

function parseWindows(xml) {
  const tagRegex = /<Window((?:\s+[\w:.-]+="[^"]*")*)\s*\/?>/g
  const attrRegex = /([\w:.-]+)="([^"]*)"/g
  const out = []
  let m
  while ((m = tagRegex.exec(xml))) {
    const attrs = {}
    let am
    attrRegex.lastIndex = 0
    while ((am = attrRegex.exec(m[1]))) attrs[am[1]] = am[2]
    out.push({ name: attrs.Name || '', className: attrs.ClassName || '', runtimeId: attrs.RuntimeId || '' })
  }
  return out
}

function sanitize(s) {
  return s.replace(/[^a-z0-9áàâãéêíóôõúüç -]+/gi, '_').slice(0, 80)
}

// Só conta como "feito" quem terminou SEM erro — um item com `erro` fica
// pendente de novo (achado: itens com erro não devem ser tratados como
// concluídos, senão ficam perdidos pra sempre no resume).
function loadDone() {
  if (!existsSync(OUT_JSONL)) return new Set()
  const lines = readFileSync(OUT_JSONL, 'utf-8').split('\n').filter(Boolean)
  const done = new Set()
  for (const l of lines) {
    const rec = JSON.parse(l)
    if (!rec.erro) done.add(rec.key)
  }
  return done
}

async function clickMenuItemByName(driver, name) {
  const sel = `(//MenuItem[@Name=${escapeXPathLiteral(name)}])[last()]`
  const el = driver.$(sel)
  await el.waitForDisplayed({ timeout: 4000 })
  await el.click()
  await new Promise((r) => setTimeout(r, 450))
}

async function closeAllMenus(driver, times = 5) {
  for (let i = 0; i < times; i++) {
    await pressKey(driver, VK_ESCAPE)
    await new Promise((r) => setTimeout(r, 150))
  }
}

async function openLeaf(driver, pathNames) {
  for (const name of pathNames) {
    await clickMenuItemByName(driver, name)
  }
}

// Fecha a tela que abriu (padrão MDI: 2 botões Close, clica o [0]) e, se não
// achar esse padrão, cai pro fallback de Escape (cobre diálogos simples).
async function closeOpenedScreen(driver) {
  try {
    const closeButtons = await driver.$$('//Button[@AutomationId="Close"]')
    if (closeButtons.length > 1) {
      await closeButtons[0].click()
      await new Promise((r) => setTimeout(r, 400))
      return 'close-button'
    }
  } catch {
    // ignora, cai pro fallback
  }
  await closeAllMenus(driver, 3)
  return 'escape-fallback'
}

async function catalogOne(driver, baselineWindows, pathNames) {
  await openLeaf(driver, pathNames)
  await new Promise((r) => setTimeout(r, 900))

  const source = await driver.getPageSource()
  const windowsNow = parseWindows(source)
  const baselineIds = new Set(baselineWindows.map((w) => w.runtimeId))
  const newWindows = windowsNow.filter((w) => !baselineIds.has(w.runtimeId))

  const label = sanitize(pathNames.join(' - '))
  let screenshotPath = null
  try {
    const shot = await driver.takeScreenshot()
    screenshotPath = path.join(SHOT_DIR, `${label}.png`)
    writeFileSync(screenshotPath, shot, 'base64')
  } catch {
    // sem screenshot não é fatal
  }

  const closeMethod = await closeOpenedScreen(driver)

  return { newWindows, screenshotPath, closeMethod }
}

function outFile() {
  return OUT_JSONL
}

// Achado (run real): quando a sessão/driver quebra de vez (ex.: WinAppDriver
// crashou), TODO item subsequente falha da mesma forma ("menu não abre") —
// sem detectar isso, o loop continuava gastando ~4s por item SÓ pra falhar
// de novo em cascata, centenas de vezes, sem nunca reiniciar a sessão. 3
// erros seguidos = sessão presumida morta, força relançar (throw sai pro
// catch do main(), que recomeça com uma sessão nova).
const MAX_CONSECUTIVE_ERRORS = 3

async function runSession(items, stats) {
  const { driver, pid } = await loginAndReachMainWindow()
  const baselineWindows = parseWindows(await driver.getPageSource())
  let consecutiveErrors = 0
  try {
    for (const pathNames of items) {
      const key = pathNames.join(' > ')
      process.stdout.write(`[tela] ${key} ... `)
      try {
        const { newWindows, screenshotPath, closeMethod } = await catalogOne(driver, baselineWindows, pathNames)
        const record = {
          key,
          menuPath: pathNames,
          newWindows,
          screenshotPath,
          closeMethod,
          erro: null,
        }
        appendFileSync(OUT_JSONL, JSON.stringify(record) + '\n', 'utf-8')
        stats.ok++
        consecutiveErrors = 0
        console.log(`ok (${newWindows.length} janela(s) nova(s), fechado via ${closeMethod})`)
      } catch (err) {
        const record = { key, menuPath: pathNames, newWindows: [], screenshotPath: null, closeMethod: null, erro: String(err.message || err) }
        appendFileSync(OUT_JSONL, JSON.stringify(record) + '\n', 'utf-8')
        console.log(`ERRO: ${String(err.message || err).slice(0, 150)}`)
        stats.erro++
        consecutiveErrors++
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          throw new Error(`${consecutiveErrors} erros consecutivos — sessão presumida morta`)
        }
        // Tenta se recuperar fechando tudo antes do próximo item, sem
        // derrubar a sessão inteira por causa de 1 item ruim isolado.
        await closeAllMenus(driver, 5).catch(() => {})
      }
    }
  } finally {
    await cleanup(driver)
  }
}

async function main() {
  const allLeaves = JSON.parse(readFileSync(LEAF_PATHS_FILE, 'utf-8'))
  const done = loadDone()
  const stats = { ok: 0, erro: 0 }

  let remaining = allLeaves.filter((p) => !done.has(p.join(' > ')))
  console.log(`Total: ${allLeaves.length}. Já feitos: ${allLeaves.length - remaining.length}. Restam: ${remaining.length}`)

  let attempts = 0
  const MAX_SESSION_RESTARTS = 50
  while (remaining.length > 0 && attempts < MAX_SESSION_RESTARTS) {
    attempts++
    console.log(`\n>>> Sessão ${attempts} — ${remaining.length} itens pendentes`)
    try {
      await runSession(remaining, stats)
      remaining = []
    } catch (err) {
      console.error(`[SESSÃO CAIU] ${err.message} — relançando e continuando.`)
      const doneNow = loadDone()
      remaining = allLeaves.filter((p) => !doneNow.has(p.join(' > ')))
    }
  }

  console.log(`\nConcluído. ok=${stats.ok} erro=${stats.erro}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
