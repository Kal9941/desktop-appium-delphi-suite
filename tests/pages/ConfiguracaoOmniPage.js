import { BasePage } from './BasePage.js'
import { MainPage } from './MainPage.js'
import { aguardarJanelaComTitulo, aguardarJanelaFechar, clicarFisico, clicarFisicoSemAtivar } from '../support/appLifecycle.js'
import { pausa } from '../support/teclado.js'

// Tela 635 "Omni Channel - Configurações" (explorada 2026-11-06, OS 364644): janela pequena
// (436x442) aberta centralizada, sem UIA (clique do SO). Posições RELATIVAS ao canto da janela
// (lido pelo Win32), para não depender de onde ela abre. A combo "Mensagens lidas" grava em
// OC_CONFIG.MENSAGEM_LIDA: 0 quando o atendente visualizar, 1 quando visualizar ou alguém
// responder, 2 quando alguém responder. `Gravar` não mostra diálogo e a tela fica aberta.
const TITULO = 'Omni Channel - Configurações'
const SETA_MENSAGENS_LIDAS = { dx: 403, dy: 190 }
// A lista aberta mostra as 3 opções em ordem, 13 px cada; some se a principal for reativada.
const OPCAO_MENSAGENS_LIDAS = { dx: 135, dy: 207, passoY: 13 }
const GRAVAR = { dx: 118, dy: 414 }
const FECHAR = { dx: 48, dy: 414 }

export class ConfiguracaoOmniPage extends BasePage {
  async abrir() {
    await new MainPage(this.driver).abrirTelaPorNumero(635)
    this.janela = await aguardarJanelaComTitulo(TITULO)
    await pausa(2500)
    // Reler depois de assentada: a posição é a final.
    this.janela = await aguardarJanelaComTitulo(TITULO)
  }

  async clicar({ dx, dy }, { semAtivar = false } = {}) {
    const x = this.janela.left + dx
    const y = this.janela.top + dy
    if (semAtivar) await clicarFisicoSemAtivar(x, y)
    else await clicarFisico(x, y)
  }

  async definirMensagensLidas(regra) {
    await this.clicar(SETA_MENSAGENS_LIDAS)
    await pausa(1500)
    await this.clicar({ dx: OPCAO_MENSAGENS_LIDAS.dx, dy: OPCAO_MENSAGENS_LIDAS.dy + regra * OPCAO_MENSAGENS_LIDAS.passoY }, { semAtivar: true })
    await pausa(1000)
  }

  async gravar() {
    await this.clicar(GRAVAR)
    await pausa(3000)
  }

  async fechar() {
    await this.clicar(FECHAR)
    if (!(await aguardarJanelaFechar(TITULO, { timeoutMs: 8000 }))) {
      throw new Error('A tela 635 (Omni Channel - Configurações) não fechou')
    }
    await pausa(1500)
  }
}
