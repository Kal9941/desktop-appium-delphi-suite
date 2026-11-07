import { BasePage } from './BasePage.js'
import { aguardarJanelaComTitulo, aguardarJanelaFechar, clicarFisico } from '../support/appLifecycle.js'
import { digitar, pausa, teclar, VK } from '../support/teclado.js'
import { contarPixelsEscuros } from '../support/windowsNative.js'

// Tela 433 — Baixa de fórmulas (Receita) (`TfMOV_0433`) e a "Pesagem monitorada"
// (`TfMOV_0433_1`). Só Win32 (sem UIA validado, `PROJECT_CONTEXT.md` "Piloto 145 a 433"):
// cliques do SO nas coordenadas ABSOLUTAS gravadas no piloto (1366x768 maximizada) e
// teclado. Precondição ASSUMIDA (decisão do operador): Tipo de uso da 445 = "0 - SEM
// BALANÇA" (o teste não altera configuração global).
const REGISTRAR_PESO = { x: 1215, y: 273 } // TPanel gráfico no topo da 433
const REGISTRAR_PROCESSO = { x: 831, y: 659 } // TBitBtn da 433
const REGISTRAR_BAIXA = { x: 757, y: 659 } // TBitBtn da 433

// Opções do campo "Baixa registrada" (Não/Sim) da 433: botões de rádio sem elemento UIA. Lidos
// por pixel (a 433 não aceita consulta UIA): um quadrado 3x3 no aro do círculo fica escuro
// (brilho ~93) quando a opção está marcada e cinza claro (~243) quando não. Calibrado em
// 2026-10-29 sobre capturas de 1366x768 (marcada = 9 pixels escuros, desmarcada = 0).
const OPCAO_BAIXA_NAO = { x: 1032, y: 164 }
const OPCAO_BAIXA_SIM = { x: 1079, y: 164 }
const LEITURA_RADIO = { raio: 1, limiteSoma: 400 }

export class BaixaPage extends BasePage {
  // Lê o campo "Baixa registrada": `true` (Sim), `false` (Não) ou erro se a leitura for ambígua
  // (nenhuma ou as duas marcadas: tela fora do lugar ou coberta por outra janela).
  async baixaRegistrada() {
    const [nao, sim] = await Promise.all([
      contarPixelsEscuros(OPCAO_BAIXA_NAO.x, OPCAO_BAIXA_NAO.y, LEITURA_RADIO),
      contarPixelsEscuros(OPCAO_BAIXA_SIM.x, OPCAO_BAIXA_SIM.y, LEITURA_RADIO),
    ])
    const naoMarcado = nao >= 7
    const simMarcado = sim >= 7
    if (naoMarcado === simMarcado) {
      throw new Error(`Não consegui ler "Baixa registrada" na 433 (pixels escuros: Não=${nao}, Sim=${sim}): a tela está coberta ou fora do lugar.`)
    }
    return simMarcado
  }

  // Espera "Baixa registrada" = Sim depois do "Registrar baixa". Uma leitura só, 3 s depois do
  // clique, pegou a tela no meio do redesenho (Não=9 e Sim=7 pixels escuros, 2026-11-06) com a
  // baixa já registrada: lê de novo até ficar inequívoco. Devolve `false` se não virar Sim no prazo.
  async aguardarBaixaRegistrada({ timeoutMs = 15000 } = {}) {
    const limite = Date.now() + timeoutMs
    for (;;) {
      try {
        if (await this.baixaRegistrada()) return true
      } catch {
        // leitura ambígua (tela redesenhando): tenta de novo
      }
      if (Date.now() >= limite) return false
      await pausa(1000)
    }
  }

  async aguardarAbrir() {
    await aguardarJanelaComTitulo('[ 433 ]')
    // O título aparece antes de a tela estar pronta (mesmo padrão da 145).
    await pausa(3000)
  }

  async abrirPesagemMonitorada() {
    await clicarFisico(REGISTRAR_PESO.x, REGISTRAR_PESO.y)
    await aguardarJanelaComTitulo('Pesagem monitorada')
    await pausa(2000)
  }

  // Por item, com a 445 em SEM BALANÇA (medido ao vivo em 2026-11-06): código + Enter carrega o
  // produto e o lote e leva o foco a "Qtde. pesada" (já com a quantidade do cálculo); o 2º Enter
  // confirma e leva o foco a "Registrar Peso"; o 3º registra e a linha sai da lista. A janela se
  // fecha sozinha depois do último. As esperas importam: com 500 ms o Enter seguinte chegava
  // antes de o lote carregar e a sequência se perdia (2º a 4º itens sem peso); com ~1,5 s, os 8
  // pesaram. Sem cliques aqui: a Pesagem monitorada é quem está em primeiro plano.
  async registrarPesoDosItens(codigos) {
    for (const codigo of codigos) {
      await digitar(codigo)
      await pausa(600)
      await teclar(VK.ENTER) // carrega produto e lote; foco em "Qtde. pesada"
      await pausa(1500)
      await teclar(VK.ENTER) // confirma a quantidade; foco em "Registrar Peso"
      await pausa(1500)
      await teclar(VK.ENTER) // registra o peso; a linha sai da lista
      await pausa(2500)
    }
    return aguardarJanelaFechar('Pesagem monitorada', { timeoutMs: 20000 })
  }

  async registrarProcesso() {
    await clicarFisico(REGISTRAR_PROCESSO.x, REGISTRAR_PROCESSO.y)
  }

  async registrarBaixa() {
    await clicarFisico(REGISTRAR_BAIXA.x, REGISTRAR_BAIXA.y)
  }
}
