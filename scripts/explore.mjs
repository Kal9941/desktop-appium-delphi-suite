// Script exploratório ad hoc — NÃO faz parte da suíte de testes. Usado para
// conhecer telas do app por número e dumpar a árvore de UI Automation de cada
// uma em tests/fixtures/screen-inventory/, para depois documentar seletores
// reais em .agents/PROJECT_CONTEXT.md. Roda fora do wdio/cucumber porque é
// exploração manual, não cenário de teste.
import { remote } from 'webdriverio'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { loadEnv } from '../tests/support/loadEnv.js'
import {
  killProcessByName,
  spawnApp,
  waitForWindow,
  listVisibleWindowsForProcess,
  shutdownPersistentPowerShell,
} from '../tests/support/windowsNative.js'

const env = loadEnv()
const OUT_DIR = path.join('tests', 'fixtures', 'screen-inventory')
mkdirSync(OUT_DIR, { recursive: true })

const BASE_CAPS = {
  platformName: 'Windows',
  'appium:automationName': 'Windows',
  'appium:newCommandTimeout': 120,
}

async function attach(driver, windowHandle) {
  await driver.reloadSession({ ...BASE_CAPS, 'appium:appTopLevelWindow': windowHandle })
}

async function proceedPastLoginToMainWindow(driver, pid, { timeoutMs = 25000, intervalMs = 300 } = {}) {
  const deadline = Date.now() + timeoutMs
  let lastSeen = []
  let result = null
  while (Date.now() < deadline) {
    lastSeen = await listVisibleWindowsForProcess(pid)
    const dialog = lastSeen.find((w) => w.title === 'Atenção')
    if (dialog) {
      await attach(driver, dialog.handle)
      await driver.$('//Button[@Name="Sim"]').click()
      await new Promise((r) => setTimeout(r, intervalMs))
      continue
    }
    const mainWindow = lastSeen.find(
      (w) => w.title === 'SisPS - Soluções Inteligentes' && w.width > 500
    )
    if (mainWindow) {
      // O diálogo "Atenção" de reconexão pode demorar vários segundos pra
      // aparecer depois da janela principal ficar visível (achado: >1s, até
      // ~2-5s) — um único recheck de 1s (como em appLifecycle.js) não é
      // suficiente. Espera uma janela de silêncio de QUIET_MS sem diálogo
      // antes de aceitar a janela principal como definitiva.
      const QUIET_MS = 4000
      const quietDeadline = Date.now() + QUIET_MS
      let dialogAppeared = false
      while (Date.now() < quietDeadline) {
        await new Promise((r) => setTimeout(r, 400))
        const recheck = await listVisibleWindowsForProcess(pid)
        if (recheck.some((w) => w.title === 'Atenção')) {
          dialogAppeared = true
          break
        }
      }
      if (dialogAppeared) continue
      await attach(driver, mainWindow.handle)
      await new Promise((r) => setTimeout(r, 500))
      return mainWindow.handle
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(`Tela principal não apareceu em ${timeoutMs}ms. Janelas: ${JSON.stringify(lastSeen)}`)
}

async function dumpScreen(driver, label) {
  const base = path.join(OUT_DIR, label)
  const source = await driver.getPageSource()
  writeFileSync(`${base}.xml`, source, 'utf-8')
  try {
    const shot = await driver.takeScreenshot()
    writeFileSync(`${base}.png`, shot, 'base64')
  } catch (err) {
    writeFileSync(`${base}.screenshot-error.txt`, String(err))
  }
  console.log(`[dump] ${label} -> ${base}.xml (${source.length} bytes)`)
}

async function main() {
  killProcessByName(env.app.processName)
  await new Promise((r) => setTimeout(r, 1500))
  const pid = spawnApp(env.app.executablePath)
  const loginWindow = await waitForWindow(pid, (w) => w.title === 'Login' && w.width > 0)

  const driver = await remote({
    protocol: 'http',
    hostname: '127.0.0.1',
    port: 4723,
    path: '/',
    capabilities: { ...BASE_CAPS, 'appium:appTopLevelWindow': loginWindow.handle },
    logLevel: 'warn',
  })

  try {
    // login
    const usuarioEl = driver.$('(//Edit[@ClassName="TJPsEdit"])[2]')
    await usuarioEl.waitForDisplayed()
    await usuarioEl.click()
    await usuarioEl.setValue(env.credentials.usuario)
    const senhaEl = driver.$('(//Edit[@ClassName="TJPsEdit"])[1]')
    await senhaEl.click()
    await senhaEl.setValue(env.credentials.senha)
    await driver.$('//Pane[@ClassName="TPanel" and @Name="Conectar"]').click()

    const mainWindowHandle = await proceedPastLoginToMainWindow(driver, pid, { timeoutMs: 40000 })
    await dumpScreen(driver, '000-main-window')
    console.log('Pronto. Sessão anexada à janela principal. PID:', pid)

    const screens = process.argv.slice(2)
    for (const screenArg of screens) {
      console.log(`\n=== Navegando para tela ${screenArg} ===`)

      const field = driver.$('//Edit[@ClassName="TJPsEdit"]')
      await field.waitForDisplayed()
      await field.click()
      await field.setValue(screenArg)
      // driver.keys()/sendKeys via actions API padrão não é suportado pelo
      // driver windows ("Currently key input source type is not supported").
      // Extensão específica do driver windows para enviar teclas reais.
      await driver.execute('windows: keys', {
        actions: [
          { type: 'keyDown', virtualKeyCode: 0x0d },
          { type: 'keyUp', virtualKeyCode: 0x0d },
        ],
      })
      await new Promise((r) => setTimeout(r, 2500))

      // Achado: toda tela aberta pelo número vira um <Window> ANINHADO dentro
      // da janela principal (MDI de verdade, mesmo parecendo flutuante na
      // tela) — mesmo quando listVisibleWindowsForProcess relata um segundo
      // HWND de topo (achado anterior: esse segundo handle é falso-positivo/
      // transitório e o driver windows nunca consegue anexar nele, "is not a
      // top level window handle" em loop infinito de retry interno do
      // driver). Nunca tentar driver.reloadSession() pra essas: dumpar direto
      // da sessão já anexada à janela principal é suficiente e muito mais
      // rápido.
      await dumpScreen(driver, screenArg)

      // Fecha a tela MDI aberta antes de ir pra próxima — o botão de fechar
      // do frame filho (AutomationId="Close") aparece ANTES do close da
      // janela principal na ordem do documento (achado, confirmado na tela
      // 145: 2 botões Name="Fechar"/AutomationId="Close", o [0] é do filho).
      try {
        const closeButtons = await driver.$$('//Button[@AutomationId="Close"]')
        if (closeButtons.length > 1) {
          await closeButtons[0].click()
        } else {
          console.warn(`[aviso] só 1 botão Close encontrado pra tela ${screenArg} — pode não ter fechado`)
        }
      } catch (err) {
        console.warn(`[aviso] falha ao fechar tela ${screenArg}:`, String(err).slice(0, 200))
      }
      await new Promise((r) => setTimeout(r, 800))
    }
  } finally {
    await driver.deleteSession().catch(() => {})
    killProcessByName(env.app.processName)
    shutdownPersistentPowerShell()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
