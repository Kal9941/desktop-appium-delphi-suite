// Resume um dump de árvore de UI Automation (gerado por explore.mjs) numa
// lista compacta de controles "interessantes" (com Name e/ou AutomationId
// estável, ou tipos interativos) — os dumps brutos têm 100-300KB, grande
// demais pra ler inteiro repetidamente ao documentar seletores.
import { readFileSync } from 'node:fs'

const INTERESTING_TYPES = new Set([
  'Window', 'Edit', 'Button', 'CheckBox', 'RadioButton', 'ComboBox', 'Tab',
  'TabItem', 'DataGrid', 'DataItem', 'List', 'ListItem', 'Table', 'Text',
  'MenuItem', 'Custom',
])

// Campos de formulário em apps Delphi/VCL costumam não ter Name (o rótulo é
// um Text separado ao lado) — incluir sempre, mesmo sem Name, senão o resumo
// perde os campos de entrada de dados (a maioria da tela).
const ALWAYS_INCLUDE_TYPES = new Set(['Edit', 'ComboBox', 'DataGrid', 'Table', 'CheckBox', 'RadioButton', 'TabItem'])

const STABLE_AUTOMATION_IDS = new Set(['Close', 'Minimize-Restore', 'Maximize-Restore', 'TitleBar', 'SystemMenuBar', 'MenuBar'])

function parse(xmlPath) {
  const xml = readFileSync(xmlPath, 'utf-8')
  const tagRegex = /<([A-Za-z]+)((?:\s+[\w:.-]+="[^"]*")*)\s*\/?>/g
  const attrRegex = /([\w:.-]+)="([^"]*)"/g
  const results = []
  let m
  while ((m = tagRegex.exec(xml))) {
    const tag = m[1]
    if (tag.startsWith('/')) continue
    const attrs = {}
    let am
    attrRegex.lastIndex = 0
    while ((am = attrRegex.exec(m[2]))) {
      attrs[am[1]] = am[2]
    }
    results.push({ tag, attrs })
  }
  return results
}

function summarize(xmlPath) {
  const elements = parse(xmlPath)
  const interesting = elements.filter((el) => {
    const name = el.attrs.Name || ''
    const autoId = el.attrs.AutomationId || ''
    const isStableAutoId = STABLE_AUTOMATION_IDS.has(autoId)
    const hasName = name.trim() !== ''
    const isInterestingType = INTERESTING_TYPES.has(el.tag)
    if (ALWAYS_INCLUDE_TYPES.has(el.tag)) return true
    return (hasName || isStableAutoId) && (isInterestingType || isStableAutoId)
  })

  const windows = elements.filter((el) => el.tag === 'Window')

  return { totalElements: elements.length, windows, interesting }
}

const xmlPath = process.argv[2]
if (!xmlPath) {
  console.error('uso: node scripts/summarizeScreen.mjs <caminho.xml>')
  process.exit(1)
}

const { totalElements, windows, interesting } = summarize(xmlPath)
console.log(`Total de elementos: ${totalElements}`)
console.log(`\nJanelas (Window) na árvore:`)
for (const w of windows) {
  console.log(`  ClassName="${w.attrs.ClassName}" Name="${w.attrs.Name}" ${w.attrs.width}x${w.attrs.height}`)
}
console.log(`\nControles interessantes (${interesting.length}):`)
for (const el of interesting) {
  const a = el.attrs
  console.log(
    `  <${el.tag}> ClassName="${a.ClassName || ''}" AutomationId="${a.AutomationId || ''}" Name="${a.Name || ''}" pos=(${a.x},${a.y}) size=${a.width}x${a.height}`
  )
}
