import { AfterStep } from '@cucumber/cucumber'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getCurrentAppPid } from './appLifecycle.js'
import { captureScreen, listVisibleWindowsForProcess } from './windowsNative.js'

// Print de cada etapa no relatório HTML (pedido do operador, 2026-11-06): depois de cada step,
// passando ou falhando, anexa a captura da tela ao step no cucumber-json, e o
// multiple-cucumber-html-reporter a mostra embaixo do step.
//
// A captura é a do SO, nunca a do driver: o `takeScreenshot` consulta a UIA e FECHA as telas
// MDI do Omni (AGENTS.md §4). Recorta pela união das janelas visíveis do PS01 (inclui os
// diálogos "Atenção", que são janelas do mesmo processo): na tela de Login a captura inteira
// levava o papel de parede e passava de 1 MB. Sem app aberto, a tela inteira.
// `PRINT_POR_ETAPA=0` desliga.

const ligado = process.env.PRINT_POR_ETAPA !== '0'
let contador = 0

async function areaDasJanelasDoApp() {
  const pid = getCurrentAppPid()
  if (!pid) return undefined
  const janelas = (await listVisibleWindowsForProcess(pid)).filter((j) => j.width > 0 && j.height > 0)
  if (janelas.length === 0) return undefined
  // A principal maximizada vai de (-8,-8) a além da borda: `captureScreen` corta pela tela.
  const left = Math.min(...janelas.map((j) => j.left))
  const top = Math.min(...janelas.map((j) => j.top))
  const right = Math.max(...janelas.map((j) => j.left + j.width))
  const bottom = Math.max(...janelas.map((j) => j.top + j.height))
  return { left, top, width: right - left, height: bottom - top }
}

AfterStep(async function () {
  if (!ligado) return
  contador += 1
  const pasta = path.join(os.tmpdir(), 'pharmacie-print-por-etapa')
  const arquivo = path.join(pasta, `etapa-${process.pid}-${contador}.png`)
  try {
    mkdirSync(pasta, { recursive: true })
    await captureScreen(arquivo, { regiao: await areaDasJanelasDoApp() })
    // A imagem vai embutida no cucumber-json; o arquivo é só intermediário.
    await this.attach(readFileSync(arquivo), 'image/png')
  } catch (erro) {
    // Sem print o step não falha (ex.: sessão do Windows bloqueada, "The handle is invalid").
    console.warn(`[print por etapa] captura não anexada: ${erro.message}`)
  } finally {
    rmSync(arquivo, { force: true })
  }
})
