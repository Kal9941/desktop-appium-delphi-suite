import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { getSessionLabel } from './tests/support/sessionLabel.js'
import { captureFailureArtifacts, logClassifiedFailure } from './tests/support/failureArtifacts.js'
import { killProcessByName, shutdownPersistentPowerShell } from './tests/support/windowsNative.js'
import { pararVigiaDeDialogos } from './tests/support/appLifecycle.js'
import { loadEnv } from './tests/support/loadEnv.js'
import { AUTOMATION_NAME } from './tests/support/driverConfig.js'
import { generateHtmlReport } from './scripts/generateHtmlReport.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const env = loadEnv()
const sessionLabel = getSessionLabel()

// PENDÊNCIA corrigida (2026-10-09): sem isto, o worker do @wdio/local-runner
// (processo separado, que re-executa este arquivo do zero) chamava
// `getSessionLabel()` de novo sem `SESSION_LABEL` definido e gerava OUTRO
// timestamp — 2 pastas por execução (`tests/reports/<label1>/` vazia, criada
// só por este `mkdirSync` aqui embaixo, e `tests/reports/<label2>/` com o
// relatório de verdade, calculada dentro do worker). Setar a variável aqui
// garante que a segunda chamada reaproveite o MESMO rótulo (primeiro ramo de
// `getSessionLabel()`) — é exatamente o mecanismo que o CI já usa (`env.
// SESSION_LABEL: ci-${{ github.run_id }}`, ver `.github/workflows/tests.yml`),
// só que setado automaticamente em vez de exigir a variável de fora.
process.env.SESSION_LABEL = sessionLabel

mkdirSync(path.join(__dirname, 'tests', 'reports', sessionLabel), { recursive: true })

export const config = {
  runner: 'local',
  specs: ['./tests/features/**/*.feature'],

  // Paralelismo real em desktop Windows é mais caro que no browser (sem "abas"
  // baratas) — cada instância precisa de porta própria e instância isolada do
  // app. Começar serial (1) é a opção segura; ver docs §4.6 antes de subir.
  maxInstances: 1,

  capabilities: [
    {
      platformName: 'Windows',
      'appium:automationName': AUTOMATION_NAME,
      'appium:app': env.app.executablePath,
      'appium:appArguments': env.app.arguments || undefined,
      'appium:newCommandTimeout': 120,
    },
  ],

  services: [['appium', { args: { address: '127.0.0.1', port: 4723 } }]],

  logLevel: 'info',
  framework: 'cucumber',
  reporters: [
    'spec',
    ['json', { outputDir: path.join('tests', 'reports', sessionLabel) }],
    // allure-results é compartilhado entre execuções (não por sessionLabel) de
    // propósito: sem política de exclusão — cada rodada só ACRESCENTA
    // resultados, nunca apaga os anteriores. É isso que dá ao Allure o
    // histórico/tendência entre execuções (ver scripts/report:allure:generate,
    // que roda sem --clean).
    ['allure', {
      outputDir: path.join('tests', 'reports', 'allure-results'),
      useCucumberStepReporter: false,
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false,
    }],
  ],
  cucumberOpts: {
    // printPorEtapa.js: hook AfterStep que anexa a captura do SO a cada step (relatório HTML).
    require: ['./tests/steps-definitions/**/*.steps.js', './tests/support/printPorEtapa.js'],
    // Vermelhos propositais (bug conhecido do produto) ficam fora da execução padrão e do CI:
    // `npm run test:bugs` roda só eles (CUCUMBER_TAGS=@bug). @wip/@skip seguem [R-WIP].
    tags: process.env.CUCUMBER_TAGS ?? 'not @bug',
    timeout: 60000,
    ignoreUndefinedDefinitions: false,
    // Formato cucumber-json "de verdade" (array de features/elements/steps),
    // diferente do JSON do reporter 'json' acima (que é um dump interno do
    // WDIO). É o que scripts/generateHtmlReport.mjs consome pra gerar o HTML
    // do multiple-cucumber-html-reporter.
    format: [`json:${path.join('tests', 'reports', sessionLabel, 'cucumber-report.json')}`],
  },

  // Isolamento de estado entre testes: processo novo por teste. Decisão
  // registrada em .agents/PROJECT_CONTEXT.md — mais lento, hermético por
  // padrão, não depende de um "modo de teste" no app. O lançamento e o
  // re-anexo da sessão às janelas corretas (login → principal) é feito pelos
  // próprios steps (ver tests/support/appLifecycle.js), porque a tela de
  // login é uma janela de topo separada — aqui só garantimos que não sobra
  // processo de uma execução anterior antes do cenário começar.
  beforeScenario: async function () {
    killProcessByName(env.app.processName)
  },

  afterScenario: async function (world, result) {
    if (!result.error) return
    logClassifiedFailure(result.error)
    await captureFailureArtifacts({
      driver,
      sessionLabel,
      testTitle: world.pickle.name,
      error: result.error,
    })
  },

  after: function () {
    pararVigiaDeDialogos()
    killProcessByName(env.app.processName)
    shutdownPersistentPowerShell()
  },

  // Gera o HTML automaticamente ao fim da suíte (pedido do usuário,
  // 2026-10-09) — antes exigia rodar `npm run report:html` à parte depois de
  // todo `npm test`. Filtra por `sessionLabel` exato (não "mais recente por
  // mtime", que é só o fallback do CLI pra quando ninguém sabe o rótulo da
  // última execução) — aqui o próprio `sessionLabel` desta execução já é
  // conhecido, então não há ambiguidade possível. Roda no processo
  // launcher (`onComplete` só dispara uma vez, depois de todos os workers
  // terminarem — nunca por worker), e não deixa um erro de geração de
  // relatório derrubar o exit code da suíte: `npm test` reporta falha de
  // teste, não falha de relatório.
  onComplete: async function () {
    try {
      await generateHtmlReport({ mode: 'filter', filterText: sessionLabel })
    } catch (error) {
      console.error('Falha ao gerar o relatório HTML automaticamente:', error)
    }
  },
}
