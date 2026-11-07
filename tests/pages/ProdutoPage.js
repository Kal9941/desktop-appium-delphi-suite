import { BasePage } from './BasePage.js'
import {
  aguardarJanelaComTitulo,
  clicarDireitoFisico,
  clicarFisico,
  clicarFisicoSemAtivar,
} from '../support/appLifecycle.js'
import { digitar, pausa, selecionarConteudoDoCampo, teclar, VK } from '../support/teclado.js'

// Tela 112 — Cadastro de produtos (Alopatia) (`TfCAD_0112`). Aqui só serve de porta de entrada
// do estoque: a grade "Estoque" (owner-drawn, sem UIA) tem um menu de contexto que abre a 216
// (entrada de lote) e a 425 (movimentação de estoque). Só Win32: cliques do SO nas coordenadas
// ABSOLUTAS gravadas em 2026-10-29 (1366x768 maximizada) e teclado, como na 145 (`[R-VEL]`).
const CODIGO = { x: 126, y: 161 } // TJPsCodigo "Código" (o piloto usou a busca por Nome)

// A grade lista os lotes por "Lote Sis."; a 2ª linha (y ~ 496) é o lote 140125.14143 em
// "Laboratório 1 - Sólidos", o que a 425 confere. Linhas novas entram no fim da grade.
const LINHA_DO_LOTE = { x: 402, y: 494 }

// Itens do menu de contexto, medidos a partir do ponto do clique direito.
const MENU_ENTRADA_DE_LOTE = { dx: 38, dy: 19 } // abre a 216
const MENU_MOVIMENTACAO = { dx: 105, dy: 70 } // abre a 425

export class ProdutoPage extends BasePage {
  async aguardarAbrir() {
    await aguardarJanelaComTitulo('[ 112 ]')
    // O título aparece antes de a tela estar pronta (mesmo padrão da 145).
    await pausa(3000)
  }

  async abrirPeloCodigo(codigo) {
    await clicarFisico(CODIGO.x, CODIGO.y)
    await selecionarConteudoDoCampo()
    await digitar(String(codigo))
    await teclar(VK.ENTER)
    // A grade de estoque carrega depois do Enter.
    await pausa(3000)
  }

  // Seleciona a linha do lote (clique esquerdo) e abre o menu de contexto (clique direito).
  async abrirMenuDaLinhaDoLote() {
    await clicarFisico(LINHA_DO_LOTE.x + 54, LINHA_DO_LOTE.y + 2)
    await pausa(500)
    await clicarDireitoFisico(LINHA_DO_LOTE.x, LINHA_DO_LOTE.y)
    await pausa(800)
  }

  // O menu de contexto some se a janela principal for reativada: clique sem ativar.
  async escolherNoMenu({ dx, dy }) {
    await clicarFisicoSemAtivar(LINHA_DO_LOTE.x + dx, LINHA_DO_LOTE.y + dy)
  }

  async abrirEntradaDeLote() {
    await this.abrirMenuDaLinhaDoLote()
    await this.escolherNoMenu(MENU_ENTRADA_DE_LOTE)
    await aguardarJanelaComTitulo('[ 216 ]')
    await pausa(2000)
  }

  async abrirMovimentacaoDeEstoque() {
    await this.abrirMenuDaLinhaDoLote()
    await this.escolherNoMenu(MENU_MOVIMENTACAO)
    await aguardarJanelaComTitulo('[425]')
    await pausa(2000)
  }
}
