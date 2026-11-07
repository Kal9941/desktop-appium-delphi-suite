// Entrada por teclado pelo driver (`windows: keys`): ~5 ms por chamada, contra 6 a 20 s
// de uma busca por XPath + 0,2 s de setValue (medido 2026-10-28, AGENTS.md §4). Digita
// no campo que estiver com o foco: quem chama foca antes (clique do SO no campo).
export const VK = { BACKSPACE: 0x08, ENTER: 0x0d, TAB: 0x09, ESC: 0x1b, END: 0x23, HOME: 0x24, SHIFT: 0x10, DOWN: 0x28 }

export async function digitar(texto) {
  await driver.execute('windows: keys', { actions: [{ text: String(texto) }] })
}

export async function teclar(virtualKeyCode) {
  await driver.execute('windows: keys', {
    actions: [
      { virtualKeyCode, down: true },
      { virtualKeyCode, down: false },
    ],
  })
}

// Home, depois Shift+End: seleciona o conteúdo, e o que for digitado o substitui
// (Ctrl+A não seleciona campo numérico dos TJPs, ver AGENTS.md §4).
export async function selecionarConteudoDoCampo() {
  await teclar(VK.HOME)
  await driver.execute('windows: keys', {
    actions: [
      { virtualKeyCode: VK.SHIFT, down: true },
      { virtualKeyCode: VK.END, down: true },
      { virtualKeyCode: VK.END, down: false },
      { virtualKeyCode: VK.SHIFT, down: false },
    ],
  })
}

export const pausa = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
