import { BasePage } from './BasePage.js'
import { aguardarJanelaComTitulo, janelaComTituloAberta, clicarFisico } from '../support/appLifecycle.js'
import { digitar, pausa, selecionarConteudoDoCampo, teclar, VK } from '../support/teclado.js'

// Tela 036 — Cadastro de prescritores (`TfCAD_0036`). Como a 046, aqui só serve para
// ESCOLHER o prescritor pelo código (nada é salvo): abre sozinha depois do `Calcular`
// da 145. Cuidado: ao lado de `Fechar` ficam `Excluir` e `Gravar`, que este Page
// Object nunca aciona (só o Fechar, em x=88, y=652).
const CODIGO = { x: 98 + 25, y: 156 + 7 }
const FECHAR = { x: 88 + 35, y: 652 + 17 }

export class PrescritorPage extends BasePage {
  // O título aparece antes de a tela estar pronta: sem a espera o código digitado se perde.
  async aguardarAbrir() {
    await aguardarJanelaComTitulo('[ 036 ]')
    await pausa(2000)
  }

  async selecionarPorCodigo(codigo) {
    await clicarFisico(CODIGO.x, CODIGO.y)
    await selecionarConteudoDoCampo()
    await digitar(String(codigo))
    await teclar(VK.ENTER)
  }

  // Depois do Enter no código a 036 costuma se fechar sozinha, devolvendo o
  // prescritor à 145 (visto em 2026-10-28); só fecha se ainda estiver aberta.
  async fecharSeAindaAberta() {
    await pausa(1500)
    if (await janelaComTituloAberta('[ 036 ]')) await clicarFisico(FECHAR.x, FECHAR.y)
  }
}
