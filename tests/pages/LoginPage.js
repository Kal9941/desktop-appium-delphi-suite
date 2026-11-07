import { BasePage } from './BasePage.js'

// PENDÊNCIA: nesta tela (app Delphi/VCL), os campos de usuário/senha não têm
// `Name` nem `AutomationId` estável (ver .agents/PROJECT_CONTEXT.md) — ambos
// são `TJPsEdit` sem rótulo. Seletor real validado por inspeção com WinAppDriver
// (equivalente ao "auto inspect"): posição por ClassName via XPath. O botão
// "Conectar" também não é um Button nativo, é um TPanel com Name="Conectar"
// (há, além dele, um Button real de mesmo nome "Conectar ao sistema OmniCare"
// que é só o ícone de biometria — não usar).
const XPATH = {
  // document order: primeiro TJPsEdit = senha (y maior/mais abaixo na tela),
  // segundo TJPsEdit = usuário (y menor/mais acima) — confirmado via screenshot.
  // Por posição (x, y do dump UIA de 2026-10-28; a janela de Login ocupa a tela toda):
  // o XPath com índice `(//Edit)[n]` não é suportado pelo driver NovaWindows.
  senha: '//Edit[@ClassName="TJPsEdit" and @x="40" and @y="524"]',
  usuario: '//Edit[@ClassName="TJPsEdit" and @x="40" and @y="441"]',
  conectar: '//Pane[@ClassName="TPanel" and @Name="Conectar"]',
}

// Ícone de teclado virtual, à esquerda do botão "Conectar" — owner-drawn
// (mesmo padrão do botão Logout em MainPage.js), zero elementos UI Automation
// nessa região, só clicável por coordenada. Validado por inspeção ao vivo
// (2026-10-09, janela de Login recém-aberta, 1366x768): abre a janela de topo
// "Teclado alfanumérico" (ver TecladoVirtualPage.js), independente de qual
// campo (Usuário/Senha) estava focado antes do clique.
const TECLADO_VIRTUAL_BUTTON = { x: 62, y: 620 }

export class LoginPage extends BasePage {
  usuarioField() {
    return this.byXPath(XPATH.usuario)
  }

  senhaField() {
    return this.byXPath(XPATH.senha)
  }

  conectarButton() {
    return this.byXPath(XPATH.conectar)
  }

  async abrirTecladoVirtual() {
    await this.clickByCoordinate(TECLADO_VIRTUAL_BUTTON.x, TECLADO_VIRTUAL_BUTTON.y)
  }

  async login({ usuario, senha }) {
    const usuarioEl = this.usuarioField()
    await usuarioEl.waitForDisplayed()
    await usuarioEl.click()
    await usuarioEl.setValue(usuario)

    const senhaEl = this.senhaField()
    await senhaEl.click()
    await senhaEl.setValue(senha)

    await this.conectarButton().click()
  }
}
