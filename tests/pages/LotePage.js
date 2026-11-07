import { BasePage } from './BasePage.js'
import { aguardarJanelaFechar, clicarFisico } from '../support/appLifecycle.js'
import { digitar, pausa, selecionarConteudoDoCampo, teclar, VK } from '../support/teclado.js'

// Tela 216 — Incluir/ alterar lotes e estoques (`TfMOV_0216`), aberta pela grade de estoque da
// 112 (o produto já vem preenchido). Só Win32: cliques do SO em coordenadas ABSOLUTAS (centros
// dos campos conferidos nas capturas da gravação de 2026-10-29, 1366x768 maximizada) e teclado.
// Lote, Fabricação e Vencimento ficam vazios de propósito: o sistema gera (observação do operador).
const CAMPOS = {
  tipoEstoque: { x: 269, y: 197 }, // TJPsCodigo
  origem: { x: 269, y: 266 }, // TJPsCodigo
  fornecedor: { x: 269, y: 302 }, // TJPsCodigo
  fabricante: { x: 751, y: 302 }, // TJPsCodigo
  quantidadeEntrada: { x: 734, y: 516 }, // TJPsValor "Qtde. entrada"
}
const GRAVAR = { x: 401, y: 662 }
const FECHAR = { x: 273, y: 661 }

export class LotePage extends BasePage {
  async preencher(nome, valor, { pausaMs = 800 } = {}) {
    const { x, y } = CAMPOS[nome]
    await clicarFisico(x, y)
    await selecionarConteudoDoCampo()
    await digitar(valor)
    await teclar(VK.ENTER)
    await pausa(pausaMs)
  }

  async gravar() {
    await clicarFisico(GRAVAR.x, GRAVAR.y)
  }

  // Fechar volta à 112, que recarrega a grade de estoque.
  async fechar() {
    await clicarFisico(FECHAR.x, FECHAR.y)
    return aguardarJanelaFechar('[ 216 ]', { timeoutMs: 10000 })
  }
}
