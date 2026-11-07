import { BasePage } from './BasePage.js'
import { aguardarJanelaFechar, clicarFisico, clicarFisicoSemAtivar } from '../support/appLifecycle.js'
import { digitar, pausa, selecionarConteudoDoCampo } from '../support/teclado.js'
import { contarPixelsEscuros } from '../support/windowsNative.js'

// Tela 425 — Movimentação de estoque (`TfMOV_0425_4`, título `[425] - ...`, sem espaços), aberta
// pela grade de estoque da 112 com produto, lote, loja e saldo já preenchidos. O Movimento abre em
// `2 - Transferência` (visto em 2026-10-29: Processar nesse movimento dá "O campo selecionado não
// pode ser nulo", falta o estoque de destino): é preciso escolher `1 - Conferência`, em que a Qtde.
// passa a ser o saldo do lote. Só Win32: cliques do SO em coordenadas ABSOLUTAS (gravação de 2026-10-29).
const MOVIMENTO = { x: 722, y: 196 } // seta do TJPsComboBox "Movimento"
const MOVIMENTO_CONFERENCIA = { x: 559, y: 207 } // 1º item da lista (`ComboLBox`)
const QUANTIDADE = { x: 540, y: 254 } // TJPsValor "Qtde." (o layout muda um pouco com o movimento)
const PROCESSAR = { x: 912, y: 634 } // TBitBtn
const STATUS = { x: 830, y: 194 } // texto "1 - Liberado": só aparece no movimento Transferência
const TENTATIVAS_MOVIMENTO = 3

export class MovimentacaoEstoquePage extends BasePage {
  // O campo "Status" (`1 - Liberado`) só existe no movimento Transferência: texto escuro ali = o
  // combo não mudou para Conferência (lido por pixel, a 425 não tem UIA). Medido em 2026-10-29
  // sobre capturas de 1366x768: Transferência > 0 pixels escuros, Conferência = 0.
  async movimentoEhConferencia() {
    return (await contarPixelsEscuros(STATUS.x, STATUS.y, { raio: 10 })) === 0
  }

  // A lista do combo é uma janela de popup: clicar nela sem reativar a janela principal, ou ela fecha.
  // Na rodada de 2026-10-29 15:16 o clique no item não pegou e o Movimento ficou em Transferência
  // (Processar deu "O campo selecionado não pode ser nulo"): confere o resultado e tenta de novo.
  async escolherConferencia() {
    for (let tentativa = 1; tentativa <= TENTATIVAS_MOVIMENTO; tentativa++) {
      await clicarFisico(MOVIMENTO.x, MOVIMENTO.y)
      await pausa(800)
      await clicarFisicoSemAtivar(MOVIMENTO_CONFERENCIA.x, MOVIMENTO_CONFERENCIA.y)
      await pausa(1000)
      if (await this.movimentoEhConferencia()) return
      console.warn(`[425] Movimento não mudou para Conferência (tentativa ${tentativa}/${TENTATIVAS_MOVIMENTO})`)
    }
    throw new Error('A 425 não mudou o Movimento para "1 - Conferência": Processar faria uma transferência.')
  }

  async informarQuantidade(quantidade) {
    await clicarFisico(QUANTIDADE.x, QUANTIDADE.y)
    await selecionarConteudoDoCampo()
    await digitar(String(quantidade))
    await pausa(500)
  }

  // A 425 se fecha sozinha ao processar.
  async processar() {
    await clicarFisico(PROCESSAR.x, PROCESSAR.y)
    return aguardarJanelaFechar('[425]', { timeoutMs: 15000 })
  }
}
