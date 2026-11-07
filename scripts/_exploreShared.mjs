// Helpers compartilhados pelos scripts de exploração ad hoc (explore.mjs,
// exploreMenu.mjs) — NÃO fazem parte da suíte de testes. Duplicar a lógica
// de login/anexo de janela do appLifecycle.js porque aqui a sessão WebDriver
// é local ao script (não a global `driver` injetada pelo wdio/cucumber).
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

export const env = loadEnv()

export const BASE_CAPS = {
  platformName: 'Windows',
  // `AUTOMATION_NAME=NovaWindows` testa o driver alternativo com o mesmo script.
  'appium:automationName': process.env.AUTOMATION_NAME || 'Windows',
  'appium:newCommandTimeout': 120,
}

export async function attach(driver, windowHandle) {
  await driver.reloadSession({ ...BASE_CAPS, 'appium:appTopLevelWindow': windowHandle })
}

export async function proceedPastLoginToMainWindow(driver, pid, { timeoutMs = 25000, intervalMs = 300 } = {}) {
  const deadline = Date.now() + timeoutMs
  let lastSeen = []
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
      (w) => w.title === 'AppERP - Soluções Inteligentes' && w.width > 500
    )
    if (mainWindow) {
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

export async function pressKey(driver, virtualKeyCode) {
  await driver.execute('windows: keys', {
    actions: [
      { type: 'keyDown', virtualKeyCode },
      { type: 'keyUp', virtualKeyCode },
    ],
  })
}

export const VK_RETURN = 0x0d
export const VK_ESCAPE = 0x1b

export async function dumpScreen(outDir, driver, label) {
  mkdirSync(outDir, { recursive: true })
  const base = path.join(outDir, label)
  const source = await driver.getPageSource()
  writeFileSync(`${base}.xml`, source, 'utf-8')
  try {
    const shot = await driver.takeScreenshot()
    writeFileSync(`${base}.png`, shot, 'base64')
  } catch (err) {
    writeFileSync(`${base}.screenshot-error.txt`, String(err))
  }
  console.log(`[dump] ${label} -> ${base}.xml (${source.length} bytes)`)
  return source
}

export async function loginAndReachMainWindow() {
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

  const usuarioEl = driver.$('(//Edit[@ClassName="TJPsEdit"])[2]')
  await usuarioEl.waitForDisplayed()
  await usuarioEl.click()
  await usuarioEl.setValue(env.credentials.usuario)
  const senhaEl = driver.$('(//Edit[@ClassName="TJPsEdit"])[1]')
  await senhaEl.click()
  await senhaEl.setValue(env.credentials.senha)
  await driver.$('//Pane[@ClassName="TPanel" and @Name="Conectar"]').click()

  const mainWindowHandle = await proceedPastLoginToMainWindow(driver, pid, { timeoutMs: 40000 })
  return { driver, pid, mainWindowHandle }
}

export async function cleanup(driver) {
  await driver.deleteSession().catch(() => {})
  killProcessByName(env.app.processName)
  shutdownPersistentPowerShell()
}
