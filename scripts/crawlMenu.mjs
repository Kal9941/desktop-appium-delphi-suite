// Mapeia a árvore INTEIRA do menu superior (Cadastros, Consultas,
// Movimentos, Relatórios, Rastreabilidade, Configurações, Usuários,
// Utilitários, Omni Channel, AppERP, Ajuda) sem abrir as telas-folha —
// só descobre a estrutura (nomes, hierarquia, se tem submenu).
// NÃO faz parte da suíte de testes. Uso: node scripts/crawlMenu.mjs [menu...]
// Saída: tests/fixtures/menu-map/<menu>.json (árvore) + console.log de progresso.
//
// Achado (ver testEscape.mjs vs testEscapeCrash.mjs): o comportamento de
// "1x Escape fecha só o flyout mais profundo" NÃO é consistente — em alguns
// casos fecha o menu INTEIRO de volta à barra de topo (reproduzido com
// Cadastros > Animais, 2 níveis). Como não dá pra confiar em quantos níveis
// um Escape fecha, a estratégia segura é: fechar tudo (várias vezes) e
// reabrir a cadeia completa de nomes a cada troca de irmão. Mais lento, mas
// determinístico — crucial numa árvore que vai rodar sem supervisão.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { loginAndReachMainWindow, cleanup, pressKey, VK_ESCAPE } from './_exploreShared.mjs'

const OUT_DIR = path.join('tests', 'fixtures', 'menu-map')
mkdirSync(OUT_DIR, { recursive: true })

const ALL_TOP_MENUS = [
  'Cadastros', 'Consultas', 'Movimentos', 'Relatórios', 'Rastreabilidade',
  'Configurações', 'Usuários', 'Utilitários', 'Omni Channel', 'AppERP', 'Ajuda',
]
const TOP_MENUS = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ALL_TOP_MENUS

function parseMenuItems(xml) {
  const tagRegex = /<MenuItem((?:\s+[\w:.-]+="[^"]*")*)\s*\/?>/g
  const attrRegex = /([\w:.-]+)="([^"]*)"/g
  const items = []
  let m
  while ((m = tagRegex.exec(xml))) {
    const attrs = {}
    let am
    attrRegex.lastIndex = 0
    while ((am = attrRegex.exec(m[1]))) attrs[am[1]] = am[2]
    items.push({
      name: attrs.Name || '',
      runtimeId: attrs.RuntimeId || '',
      automationId: attrs.AutomationId || '',
      expanded: attrs.ExpandCollapseState === 'Collapsed' || attrs.ExpandCollapseState === 'Expanded',
    })
  }
  return items
}

function escapeXPathLiteral(value) {
  if (!value.includes('"')) return `"${value}"`
  return `concat("${value.split('"').join('", \'"\', "')}")`
}

async function getMenuItems(driver) {
  const source = await driver.getPageSource()
  return parseMenuItems(source)
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

// Reabre a cadeia inteira de nomes do zero (menu fechado -> cada nome
// clicado em sequência), restaurando o estado até o nível desejado.
async function reopenPath(driver, names) {
  for (const name of names) {
    await clickMenuItemByName(driver, name)
  }
}

// Clica em `nodeName` (já visível no nível atual) e retorna só os itens NOVOS
// que apareceram (diff por RuntimeId) — são os filhos diretos.
async function expandAndDiff(driver, nodeName) {
  const before = await getMenuItems(driver)
  const beforeIds = new Set(before.map((i) => i.runtimeId))
  await clickMenuItemByName(driver, nodeName)
  const after = await getMenuItems(driver)
  return after.filter((i) => !beforeIds.has(i.runtimeId) && i.name && i.name !== '|')
}

async function crawlNode(driver, ancestorPath, nodeName, pathLabel, depth, stats) {
  const fullNodePath = [...ancestorPath, nodeName]
  const newItems = await expandAndDiff(driver, nodeName)
  const children = []
  for (const item of newItems) {
    stats.visited++
    const fullPath = `${pathLabel} > ${item.name}`
    if (item.expanded) {
      console.log(`${'  '.repeat(depth + 1)}[submenu] ${fullPath}`)
      const sub = await crawlNode(driver, fullNodePath, item.name, fullPath, depth + 1, stats)
      children.push({ name: item.name, automationId: item.automationId, submenu: sub })
      // Fecha tudo e reabre a cadeia completa até este nível antes do
      // próximo irmão — ver achado no topo do arquivo sobre Escape não ser
      // confiável pra "subir só 1 nível".
      await closeAllMenus(driver)
      await reopenPath(driver, fullNodePath)
    } else {
      console.log(`${'  '.repeat(depth + 1)}[item] ${fullPath}`)
      children.push({ name: item.name, automationId: item.automationId, leaf: true })
    }
  }
  return children
}

function outFile(topMenu) {
  return path.join(OUT_DIR, `${topMenu.replace(/\s+/g, '_')}.json`)
}

// Roda uma "sessão" (login até sair) processando os menus de `menus` em
// ordem. Cada menu só é salvo em disco quando termina de ponta a ponta —
// se a sessão cair no meio de um menu, ele fica pra ser refeito do zero na
// próxima tentativa (os já salvos não são reprocessados, ver main()).
async function runSession(menus, stats) {
  const { driver } = await loginAndReachMainWindow()
  try {
    for (const topMenu of menus) {
      console.log(`\n=== MENU: ${topMenu} ===`)
      const children = await crawlNode(driver, [], topMenu, topMenu, 0, stats)
      await closeAllMenus(driver)
      writeFileSync(outFile(topMenu), JSON.stringify(children, null, 2), 'utf-8')
      console.log(`[ok] ${topMenu}: ${children.length} itens diretos salvos`)
    }
  } finally {
    await cleanup(driver)
  }
}

// Achado: a conexão com o driver windows/WinAppDriver pode cair no meio
// (ECONNRESET visto num run real) e deixar o estado do menu inconsistente —
// mais simples e confiável relançar o app inteiro (novo login) do que tentar
// recuperar o estado do menu em pleno voo. Orçamento de retry é POR MENU (não
// global): um menu persistentemente instável não pode consumir o orçamento
// inteiro e bloquear o progresso nos outros — loga e segue pro próximo.
const MAX_ATTEMPTS_PER_MENU = 3

async function main() {
  const stats = { visited: 0 }
  const failed = []
  for (const topMenu of TOP_MENUS) {
    if (existsSync(outFile(topMenu))) {
      console.log(`[skip] ${topMenu}: já salvo de uma tentativa anterior`)
      continue
    }
    let ok = false
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MENU && !ok; attempt++) {
      console.log(`\n>>> ${topMenu} — tentativa ${attempt}/${MAX_ATTEMPTS_PER_MENU}`)
      try {
        await runSession([topMenu], stats)
        ok = true
      } catch (err) {
        console.error(`[ERRO] ${topMenu} tentativa ${attempt} falhou: ${err.message}`)
      }
    }
    if (!ok) {
      console.error(`[DESISTI] ${topMenu} falhou em todas as ${MAX_ATTEMPTS_PER_MENU} tentativas — pulando.`)
      failed.push(topMenu)
    }
  }

  const tree = {}
  for (const topMenu of TOP_MENUS) {
    if (existsSync(outFile(topMenu))) tree[topMenu] = JSON.parse(readFileSync(outFile(topMenu), 'utf-8'))
  }
  writeFileSync(path.join(OUT_DIR, '_full-tree.json'), JSON.stringify(tree, null, 2), 'utf-8')
  console.log(`\nConcluído. Total de itens visitados (todos os níveis, soma de tentativas): ${stats.visited}`)
  if (failed.length > 0) {
    console.error(`Menus que falharam em todas as tentativas (não documentados): ${failed.join(', ')}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
