// Page Object base — seletores e interação, nunca lógica de rede/mock nem
// asserção de contrato de API (regra dura, ver docs §2 e §3).
export class BasePage {
  constructor(driver) {
    this.driver = driver
  }

  // AutomationId exposto pelo app — estratégia `~` do WebdriverIO mapeia para
  // "accessibility id" (UI Automation AutomationId no driver windows).
  // PENDÊNCIA (ver .agents/PROJECT_CONTEXT.md): em apps Delphi/VCL como o
  // sistema sob teste aqui, o AutomationId costuma ser um handle de controle
  // interno que MUDA a cada execução — não usar como seletor estável nesses
  // casos; preferir byXPath com ClassName/Name (ver LoginPage.js).
  byAutomationId(automationId) {
    return this.driver.$(`~${automationId}`)
  }

  byXPath(xpath) {
    return this.driver.$(xpath)
  }

  async waitAndClick(automationId) {
    const el = this.byAutomationId(automationId)
    await el.waitForDisplayed()
    await el.waitForClickable()
    await el.click()
  }

  async waitAndSetValue(automationId, value) {
    const el = this.byAutomationId(automationId)
    await el.waitForDisplayed()
    await el.setValue(value)
  }

  // Fallback pra controles owner-drawn sem elemento UI Automation nenhum
  // (ex.: botão "Logout" da barra de ferramentas, ver MainPage.js) —
  // `pointerType: 'mouse'` falha neste driver ("Currently only pen and touch
  // pointer input source types are supported"), só `'touch'` funciona (ver
  // AGENTS.md §4).
  async clickByCoordinate(x, y) {
    await this.driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x, y },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ])
    await this.driver.releaseActions()
  }

  // Tecla real pelo driver windows (a actions API padrão W3C não é suportada,
  // ver AGENTS.md §4): `virtualKeyCode`, não `key`.
  async pressKey(virtualKeyCode) {
    await this.driver.execute('windows: keys', {
      actions: [
        { type: 'keyDown', virtualKeyCode },
        { type: 'keyUp', virtualKeyCode },
      ],
    })
  }

  async pressEnter() {
    await this.pressKey(0x0d)
  }
}
