import { BasePage } from './BasePage.js'
import { ativarJanelaPrincipal, clicarFisico } from '../support/appLifecycle.js'
import { digitar, selecionarConteudoDoCampo, teclar, VK } from '../support/teclado.js'

// Painel de status (rodapé) mostra "<código> - <nome>" do operador logado —
// único indicador confiável de login bem-sucedido encontrado nesta tela
// (ver .agents/PROJECT_CONTEXT.md; o app não expõe Name nos itens de menu
// "Logout"/"Sair", são ícones sem rótulo acessível).

// Botão "Logout" (canto superior direito da barra de ferramentas) é
// owner-drawn: zero elementos UI Automation nessa região (mesmo padrão dos
// grids de listagem, ver .agents/PROJECT_CONTEXT.md "Grids owner-drawn") —
// nenhum seletor por Name/AutomationId possível. Coordenada validada por
// inspeção ao vivo (2026-10-09: screenshot da janela principal recém-aberta,
// 1366x768) — reabre a tela de Login mantendo o processo vivo em segundo
// plano (ver `tests/support/appLifecycle.js`, `waitForLogoutReturnToLogin`).
const LOGOUT_BUTTON = { x: 1268, y: 62 }

export class MainPage extends BasePage {
  // Painel de status com "<código> - <nome>" (ex.: "1 - Fabricio"). Prefixo exato: com `contains`, o
  // código 1 casava também com a versão ("VER.26.5.1.9") e a loja ("Lj: 1") — 2026-11-05.
  statusBarUsuario(codigoUsuario) {
    return this.byXPath(`//*[starts-with(@Name, "${codigoUsuario} - ")]`)
  }

  async logout() {
    await this.clickByCoordinate(LOGOUT_BUTTON.x, LOGOUT_BUTTON.y)
  }

  // Campo de número da tela (canto inferior direito, `TJPsEdit` 33x12 em x=1328, y=701,
  // sem rótulo): clique do SO no centro + número + Enter abre a tela (ver ReceitaPage.js
  // sobre desempenho; dump UIA de 2026-10-28).
  async abrirTelaPorNumero(numero) {
    await ativarJanelaPrincipal()
    await clicarFisico(1328 + 16, 701 + 6)
    await selecionarConteudoDoCampo()
    await digitar(String(numero))
    await teclar(VK.ENTER)
  }
}
