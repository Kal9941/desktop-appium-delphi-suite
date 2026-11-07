import { mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { getSessionLabel } from './sessionLabel.js'
import { captureScreen } from './windowsNative.js'

let contador = 0

// Checkpoint = ponto de verificação marcado no cenário. O que validar em cada
// um o operador define depois: por ora só registra a captura da tela
// (tests/reports/<sessionLabel>/checkpoints/), sem asserção de negócio.
export async function registrarCheckpoint(driver, nome) {
  contador += 1
  const pasta = path.join('tests', 'reports', getSessionLabel(), 'checkpoints')
  mkdirSync(pasta, { recursive: true })
  const arquivo = path.join(pasta, `${String(contador).padStart(2, '0')}-${nome.replace(/[^\w-]+/g, '_')}.png`)
  await driver.saveScreenshot(arquivo)
  return arquivo
}

// Mesmo checkpoint, mas pela captura do SO: para as telas do Omni, que fecham quando a
// sessão do driver consulta a UIA (o `saveScreenshot` do driver conta como consulta).
export async function registrarCheckpointDoSO(nome) {
  contador += 1
  const pasta = path.resolve('tests', 'reports', getSessionLabel(), 'checkpoints')
  mkdirSync(pasta, { recursive: true })
  const arquivo = path.join(pasta, `${String(contador).padStart(2, '0')}-${nome.replace(/[^\w-]+/g, '_')}.png`)
  await captureScreen(arquivo)
  return arquivo
}

// Evidência no MEIO do step (2026-11-06, pedido do operador): o print por etapa
// (printPorEtapa.js) é tirado DEPOIS do step, quando a tela intermediária já fechou (ex.: a 635
// gravada e fechada no mesmo step). Captura pelo SO como o checkpoint e anexa ao step do relatório
// HTML, precedida de um rótulo de texto com o nome. `world` = o `this` do step ou do hook.
export async function registrarEvidencia(world, nome) {
  const arquivo = await registrarCheckpointDoSO(nome)
  if (typeof world?.attach === 'function') {
    await world.attach(`Evidência: ${nome}`, 'text/plain')
    await world.attach(readFileSync(arquivo), 'image/png')
  }
  return arquivo
}
