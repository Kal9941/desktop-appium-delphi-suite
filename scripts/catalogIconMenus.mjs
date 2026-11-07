// Cataloga os itens dos menus "estilo ícone" (Usuários, Utilitários, SisPS,
// Ajuda, Omni Channel) + o item direto Rastreabilidade — ver achado em
// .agents/PROJECT_CONTEXT.md §10.0/§10.6: esses itens não têm `Name`
// acessível via UI Automation, só `AutomationId` numérico pequeno (estável,
// não é handle de runtime). Mesma mecânica de catalogScreens.mjs, mas
// selecionando por `AutomationId` em vez de `Name`.
// NÃO faz parte da suíte de testes — é exploração.
import { appendFileSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  loginAndReachMainWindow, cleanup, pressKey, VK_ESCAPE,
} from './_exploreShared.mjs'

const OUT_JSONL = path.join('tests', 'fixtures', 'screen-catalog-icon.jsonl')
const SHOT_DIR = path.join('tests', 'fixtures', 'screen-catalog-shots')
mkdirSync(SHOT_DIR, { recursive: true })

function escapeXPathLiteral(value) {
  if (!value.includes('"')) return `"${value}"`
  return `concat("${value.split('"').join('", \'"\', "')}")`
}

function parseAll(xml, tag) {
  const tagRegex = new RegExp(`<${tag}((?:\\s+[\\w:.-]+="[^"]*")*)\\s*/?>`, 'g')
  const attrRegex = /([\w:.-]+)="([^"]*)"/g
  const out = []
  let m
  while ((m = tagRegex.exec(xml))) {
    const attrs = {}
    let am
    attrRegex.lastIndex = 0
    while ((am = attrRegex.exec(m[1]))) attrs[am[1]] = am[2]
    out.push(attrs)
  }
  return out
}

function parseMenuItems(xml) {
  return parseAll(xml, 'MenuItem').map((a) => ({
    name: a.Name || '',
    automationId: a.AutomationId || '',
    runtimeId: a.RuntimeId || '',
    expanded: a.ExpandCollapseState === 'Collapsed' || a.ExpandCollapseState === 'Expanded',
    x: Number(a.x), y: Number(a.y),
  }))
}

function parseWindows(xml) {
  return parseAll(xml, 'Window').map((a) => ({
    name: a.Name || '', className: a.ClassName || '', runtimeId: a.RuntimeId || '',
  }))
}

function sanitize(s) {
  return s.replace(/[^a-z0-9áàâãéêíóôõúüç -]+/gi, '_').slice(0, 80)
}

async function clickByName(driver, name) {
  const el = driver.$(`(//MenuItem[@Name=${escapeXPathLiteral(name)}])[last()]`)
  await el.waitForDisplayed({ timeout: 4000 })
  await el.click()
  await new Promise((r) => setTimeout(r, 500))
}

async function clickByAutomationId(driver, automationId) {
  const el = driver.$(`(//MenuItem[@AutomationId="${automationId}"])[last()]`)
  await el.waitForDisplayed({ timeout: 4000 })
  await el.click()
  await new Promise((r) => setTimeout(r, 500))
}

async function closeAllMenus(driver, times = 5) {
  for (let i = 0; i < times; i++) {
    await pressKey(driver, VK_ESCAPE)
    await new Promise((r) => setTimeout(r, 150))
  }
}

async function closeOpenedScreen(driver) {
  try {
    const closeButtons = await driver.$$('//Button[@AutomationId="Close"]')
    if (closeButtons.length > 1) {
      await closeButtons[0].click()
      await new Promise((r) => setTimeout(r, 400))
      return 'close-button'
    }
  } catch {
    // cai pro fallback
  }
  await closeAllMenus(driver, 3)
  return 'escape-fallback'
}

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

// Diff de MenuItems por RuntimeId — acha os filhos recém-revelados de um
// clique, independente de terem Name (achado: itens "estilo ícone" só têm
// AutomationId).
async function expandAndDiff(driver, clickFn) {
  const before = parseMenuItems(await driver.getPageSource())
  const beforeIds = new Set(before.map((i) => i.runtimeId))
  await clickFn()
  // Achado: o dropdown "Omni Channel" (menu misto nativo+ícone) às vezes
  // ainda não tinha renderizado todos os itens no momento do diff — um
  // clique/diff normal pega só uma parte (achado: 0 itens numa tentativa, 4
  // de 7 noutra). Espera extra + confere de novo antes de aceitar.
  await new Promise((r) => setTimeout(r, 700))
  const after = parseMenuItems(await driver.getPageSource())
  return after.filter((i) => !beforeIds.has(i.runtimeId) && (i.name || i.automationId) && i.name !== '|')
}

async function catalogLeaf(driver, key, done, stats, clickFn) {
  if (done.has(key)) {
    console.log(`[skip] ${key}`)
    return
  }
  process.stdout.write(`[tela] ${key} ... `)
  try {
    const before = parseWindows(await driver.getPageSource())
    const beforeIds = new Set(before.map((w) => w.runtimeId))
    await clickFn()
    await new Promise((r) => setTimeout(r, 900))
    const after = parseWindows(await driver.getPageSource())
    const newWindows = after.filter((w) => !beforeIds.has(w.runtimeId))

    const label = sanitize(key)
    let screenshotPath = null
    try {
      const shot = await driver.takeScreenshot()
      screenshotPath = path.join(SHOT_DIR, `${label}.png`)
      writeFileSync(screenshotPath, shot, 'base64')
    } catch {
      // não fatal
    }
    const closeMethod = await closeOpenedScreen(driver)
    const record = { key, newWindows, screenshotPath, closeMethod, erro: null }
    appendFileSync(OUT_JSONL, JSON.stringify(record) + '\n', 'utf-8')
    stats.ok++
    console.log(`ok (${newWindows.length} janela(s) nova(s), fechado via ${closeMethod})`)
  } catch (err) {
    const record = { key, newWindows: [], screenshotPath: null, closeMethod: null, erro: String(err.message || err) }
    appendFileSync(OUT_JSONL, JSON.stringify(record) + '\n', 'utf-8')
    console.log(`ERRO: ${String(err.message || err).slice(0, 150)}`)
    stats.erro++
    await closeAllMenus(driver, 5).catch(() => {})
    throw err // deixa o chamador decidir se aborta a sessão
  }
}

async function processIconMenu(driver, topName, done, stats) {
  await closeAllMenus(driver, 3)
  const children = await expandAndDiff(driver, () => clickByName(driver, topName))
  console.log(`\n=== ${topName} (${children.length} itens no nível 1) ===`)

  // Itens "estilo ícone" não têm Name, então SKIP_RISKY (por nome) não
  // casa neles — identifica pela ORDEM VISUAL (y crescente), confirmada por
  // inspeção manual anterior (ver PROJECT_CONTEXT.md §10.6): em Utilitários,
  // os 2 últimos itens (maior y) são "Atualizar sistema" e "Atualizar SGBD".
  // Não clicar nesses dois — risco de ação real, não só abrir tela.
  const riskyRuntimeIds = new Set()
  if (topName === 'Utilitários') {
    const byY = [...children].sort((a, b) => a.y - b.y)
    for (const it of byY.slice(-2)) riskyRuntimeIds.add(it.runtimeId)
  }

  for (const item of children) {
    const label = item.name || `automationId:${item.automationId}`
    const key = `${topName} > ${label}`

    if (riskyRuntimeIds.has(item.runtimeId)) {
      console.log(`[skip] ${key} (ação arriscada — Atualizar sistema/SGBD, não clicar — ver SKIP_RISKY)`)
      continue
    }

    // Omni Channel > Cadastros compartilha a árvore nativa já catalogada em
    // §11 — pular pra não duplicar.
    if (topName === 'Omni Channel' && item.name === 'Cadastros') {
      console.log(`[skip] ${key} (compartilha a árvore nativa de Cadastros, já catalogada)`)
      continue
    }

    if (item.expanded) {
      // 1 nível de recursão (achado: suficiente pros casos reais — Omni
      // Channel > e-Commerce / Configurações). SisPS > Sistema é descartado
      // à parte (achado-armadilha, ver PROJECT_CONTEXT.md §10.0).
      if (topName === 'SisPS' && item.name === '' && !item.automationId) {
        console.log(`[skip] ${key} (achado-armadilha: colide com o menu de sistema da janela)`)
        continue
      }
      await closeAllMenus(driver, 3)
      await clickByName(driver, topName)
      const grandchildren = await expandAndDiff(driver, () =>
        item.automationId ? clickByAutomationId(driver, item.automationId) : clickByName(driver, item.name)
      )
      console.log(`  [submenu] ${key} (${grandchildren.length} itens)`)
      for (const gc of grandchildren) {
        const gcLabel = gc.name || `automationId:${gc.automationId}`
        const gcKey = `${key} > ${gcLabel}`
        await closeAllMenus(driver, 3)
        await clickByName(driver, topName)
        if (item.automationId) await clickByAutomationId(driver, item.automationId)
        else await clickByName(driver, item.name)
        await catalogLeaf(driver, gcKey, done, stats, async () => {
          if (gc.automationId) await clickByAutomationId(driver, gc.automationId)
          else await clickByName(driver, gc.name)
        })
      }
      continue
    }

    await closeAllMenus(driver, 3)
    await clickByName(driver, topName)
    await catalogLeaf(driver, key, done, stats, async () => {
      if (item.automationId) await clickByAutomationId(driver, item.automationId)
      else await clickByName(driver, item.name)
    })
  }
}

async function catalogRastreabilidade(driver, done, stats) {
  const key = 'Rastreabilidade (comando direto)'
  await closeAllMenus(driver, 3)
  await catalogLeaf(driver, key, done, stats, () => clickByName(driver, 'Rastreabilidade'))
}

const TOP_ICON_MENUS = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : ['Usuários', 'Utilitários', 'SisPS', 'Ajuda', 'Omni Channel']

async function runSession(stats) {
  const done = loadDone()
  const { driver } = await loginAndReachMainWindow()
  try {
    if (!done.has('Rastreabilidade (comando direto)')) {
      await catalogRastreabilidade(driver, done, stats)
    }
    for (const topName of TOP_ICON_MENUS) {
      await processIconMenu(driver, topName, done, stats)
    }
  } finally {
    await cleanup(driver)
  }
}

async function main() {
  const stats = { ok: 0, erro: 0 }
  let attempts = 0
  const MAX = 5
  while (attempts < MAX) {
    attempts++
    console.log(`\n>>> Sessão ${attempts}`)
    try {
      await runSession(stats)
      break
    } catch (err) {
      console.error(`[SESSÃO CAIU] ${err.message} — relançando.`)
    }
  }
  console.log(`\nConcluído. ok=${stats.ok} erro=${stats.erro}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
