// Inventário de AutomationId/ControlType do app — equivalente ao
// `npm run scan:elements` do cypress-enterprise-suite (detecta testid novo/
// removido a cada deploy antes de escrever teste "no escuro").
//
// PENDÊNCIA (ver .agents/ROADMAP.md): este script ainda não conecta de fato
// via UI Automation. Como o AutomationId é instável neste app, o inventário
// em si pouco serviria (ver .agents/PROJECT_CONTEXT.md, "Particularidades").
//
// Abordagem prevista: subir uma sessão Appium contra um build de referência
// do app, chamar driver.getPageSource() na tela alvo, parsear o XML da árvore
// de UI Automation e serializar { automationId, controlType, name } por
// elemento interativo para um inventário versionado em tests/fixtures/.

async function main() {
  throw new Error(
    'scanElements ainda não implementado — ver PENDÊNCIA no topo deste arquivo.'
  )
}

main()
