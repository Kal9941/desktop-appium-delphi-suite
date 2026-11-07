import { BasePage } from './BasePage.js'

// Janela de topo "Teclado alfanumérico" (ver LoginPage.abrirTecladoVirtual):
// um único campo de preview Edit (sem Name, único TJPsEdit da árvore) onde o
// texto digitado aparece antes de confirmar; as teclas em si são
// owner-drawn (TPanel sem Name/AutomationId, sem elemento clicável
// individual — mesmo padrão dos grids de listagem, ver
// .agents/PROJECT_CONTEXT.md "Grids owner-drawn"). Só o botão de
// fechar/confirmar é um elemento real.
const XPATH = {
  preview: '//Edit[@ClassName="TJPsEdit"]',
  confirmar: '//Button[@Name="Button1"]',
}

export class TecladoVirtualPage extends BasePage {
  previewField() {
    return this.byXPath(XPATH.preview)
  }

  async digitar(texto) {
    const campo = this.previewField()
    await campo.click()
    // `setValue` chama `clear()` antes de digitar e esse campo de preview
    // rejeita o clear (`WebDriverError: An unknown error occurred... /clear`,
    // confirmado por inspeção ao vivo 2026-10-09) — `addValue` funciona
    // porque só acrescenta, sem limpar antes.
    await campo.addValue(texto)
  }

  async confirmar() {
    await this.byXPath(XPATH.confirmar).click()
  }
}
