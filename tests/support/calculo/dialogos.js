import { getCurrentAppPid, responderJanelaDeTopo } from '../appLifecycle.js'
import { listVisibleWindowsForProcess } from '../windowsNative.js'
import { pausa } from '../teclado.js'
import { classificarDialogoDoCalculo } from './cenario.js'

// Diálogos do Calcular da 145, compartilhados pela 4.calculo e pela 0.os (movido de
// 4.calculo.steps.js em 2026-11-06, sem mudar o comportamento).

const ehDialogo = (w) => w.width > 0 && (w.title === 'Atenção' || (w.title === 'AppERP - Soluções Inteligentes' && w.width < 1000))

// Responde os diálogos que o cálculo abre até ficar `quietoMs` sem janela nova. "calcular outra
// fórmula?" → `outra`; QSP → conforme a massa; bloqueio (produto não permitido na forma, desativado)
// → falha de pré-condição com o texto do app. Para quando a 046 (paciente) aparece.
export async function responderDialogosDoCalculo({ outra, qsp, quietoMs = 5000 }) {
  const mensagens = []
  let ultimoEvento = Date.now()
  const limite = Date.now() + 180000
  while (Date.now() < limite && Date.now() - ultimoEvento < quietoMs) {
    const janelas = (await listVisibleWindowsForProcess(getCurrentAppPid())).filter((w) => w.width > 0)
    if (janelas.some((w) => w.title.includes('[ 046 ]'))) break
    if (janelas.some((w) => w.title === 'Tratamento de uso contínuo')) {
      await pausa(800)
      await responderJanelaDeTopo('Tratamento de uso contínuo', 'Fechar')
      ultimoEvento = Date.now()
    } else if (janelas.some(ehDialogo)) {
      await pausa(500)
      const titulo = janelas.find(ehDialogo).title
      let tipo = 'aviso'
      const mensagem = await responderJanelaDeTopo(titulo, (texto) => {
        tipo = classificarDialogoDoCalculo(texto)
        if (tipo === 'outra-formula') return [outra]
        if (tipo === 'qsp') return [qsp ? 'Sim' : 'Não']
        return ['Ok', 'OK', 'Sim', 'Não']
      })
      mensagens.push(mensagem)
      if (tipo === 'bloqueio') throw new Error(`pré-condição: o app recusou o cálculo: ${String(mensagem).replace(/\s+/g, ' ')}`)
      ultimoEvento = Date.now()
    }
    await pausa(400)
  }
  return mensagens
}
