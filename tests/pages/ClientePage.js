import { BasePage } from './BasePage.js'
import { aguardarJanelaComTitulo, clicarFisico } from '../support/appLifecycle.js'
import { digitar, pausa, selecionarConteudoDoCampo, teclar, VK } from '../support/teclado.js'

// Tela 046 — Cadastro de clientes (`TfCAD_0046`). Aqui só serve para ESCOLHER o
// paciente/comprador da receita pelo código (nada é salvo). Abre sozinha depois do
// `Calcular` da 145 quando a receita ainda não tem paciente.
//
// Campo Código (`TJPsCodigo` sem rótulo, 50x15 em x=98, y=156) e botão Fechar
// (`TBitBtn` 70x34 em x=88, y=652): clique do SO no centro + teclado (ver
// ReceitaPage.js sobre desempenho). Rótulos/posições por dump UIA de 2026-10-28.
const CODIGO = { x: 98 + 25, y: 156 + 7 }
const FECHAR = { x: 88 + 35, y: 652 + 17 }

export class ClientePage extends BasePage {
  // O título aparece antes de a tela estar pronta: sem a espera o código digitado se perde.
  async aguardarAbrir() {
    await aguardarJanelaComTitulo('[ 046 ]')
    await pausa(2000)
  }

  async selecionarPorCodigo(codigo) {
    await clicarFisico(CODIGO.x, CODIGO.y)
    await selecionarConteudoDoCampo()
    await digitar(String(codigo))
    await teclar(VK.ENTER)
    await pausa(800)
  }

  async fechar() {
    await clicarFisico(FECHAR.x, FECHAR.y)
  }
}
