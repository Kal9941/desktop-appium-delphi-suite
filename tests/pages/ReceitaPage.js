import { BasePage } from './BasePage.js'
import { aguardarJanelaComTitulo, clicarFisico } from '../support/appLifecycle.js'
import { digitar, pausa, selecionarConteudoDoCampo, teclar, VK } from '../support/teclado.js'

// Tela 145 — Atendimento ao cliente - Receita (`TfMOV_0145`).
//
// Os campos são `TJPsCodigo`/`TJPsEdit`/`TJPsValor` SEM `Name` nem rótulo e o
// `AutomationId` muda a cada execução (`[R-SEL]`); o que fica estável é o retângulo:
// a 145 abre sempre no mesmo lugar da janela principal 1366x768 maximizada
// (x, y, largura e altura do elemento UIA, conferidos por dump em 2026-10-28).
//
// Desempenho (AGENTS.md §4): achar cada campo por XPath custa 6 a 20 s. Por isso o
// campo é focado com um clique do SO no centro do retângulo e preenchido por
// teclado (`windows: keys`, ~5 ms); só leituras (`getText`) usam busca na árvore.
const CAMPOS = {
  codigoReceita: { classe: 'TJPsCodigo', x: 143, y: 156, w: 72, h: 15 },
  laboratorio: { classe: 'TJPsCodigo', x: 275, y: 226, w: 50, h: 15 },
  formaFarmaceutica: { classe: 'TJPsCodigo', x: 98, y: 262, w: 50, h: 15 },
  // Os três abaixo só aparecem depois de laboratório + forma preenchidos.
  totalMultiplo: { classe: 'TJPsValor', x: 503, y: 262, w: 74, h: 15 },
  produto: { classe: 'TJPsCodigo', x: 226, y: 335, w: 50, h: 15 },
  quantidade: { classe: 'TJPsValor', x: 631, y: 334, w: 80, h: 16 },
  unidade: { classe: 'TJPsEdit', x: 719, y: 334, w: 48, h: 16 },
  // Nome do laboratório (preenchido pelo app depois do código): prova de que o código entrou.
  nomeDoLaboratorio: { classe: 'TJPsEdit', x: 333, y: 226, w: 133, h: 15 },
  // Entrega (máscaras de data e hora).
  dataEntrega: { classe: 'TJPsData', x: 98, y: 620, w: 60, h: 18 },
  horaEntrega: { classe: 'TJPsHora', x: 166, y: 620, w: 28, h: 14 },
}

// Múltiplo (`TJPsValor` 40x15 em x=222, y=226; dump de 2026-11-05): já vem "1" e a seleção do
// conteúdo não pega (digitar 2 deu 12), então End + Backspaces antes de digitar.
const MULTIPLO = { x: 222 + 20, y: 226 + 7 }
// Aba "1 - Produtos": em forma de tipo de informe 0 uma tecla trocou a aba e escondeu os campos.
const ABA_PRODUTOS = { x: 130, y: 301 }
// Totais (`Edit` sem nome, identificados pelo retângulo; dump de 2026-11-05): linha y=443 = fórmula
// corrente; bloco Valores y=619 = orçamento inteiro (acumula as fórmulas).
const TOTAIS = {
  443: { 714: 'txTecnica', 797: 'vlrExtra', 987: 'valorFormula', 1090: 'descontoFormula', 1178: 'valorFormulaComDesconto' },
  619: { 987: 'valorOrcamento', 1090: 'descontoOrcamento', 1178: 'valorOrcamentoComDesconto' },
  226: { 97: 'numeroFormula', 138: 'totalFormulas', 222: 'multiplo' },
  262: { 503: 'totalMultiplo' },
}

// Controles gráficos/sem elemento útil: clique do SO no centro (x, y já são o centro).
const CALCULAR = { x: 1080, y: 299 }
// Há dois CheckBox "Concluído": o do topo (x=424, y=153, 76x18) é o da receita; o
// outro (x=1208, y=256) é da fórmula.
const CONCLUIDO_DA_RECEITA = { x: 424 + 38, y: 153 + 9 }
const GRAVAR = { x: 228 + 35, y: 652 + 17 }
// Aba "5 - Rastreabilidade de processos" (só existe depois de concluir) e os botões
// `Registrar processo` (643,652, 125x34) e `Registrar baixa` (533,652, 110x34).
const ABA_RASTREABILIDADE = { x: 573, y: 306 }
const REGISTRAR_PROCESSO = { x: 643 + 62, y: 652 + 17 }
const REGISTRAR_BAIXA = { x: 533 + 55, y: 652 + 17 }

function centro({ x, y, w, h }) {
  return { x: x + Math.round(w / 2), y: y + Math.round(h / 2) }
}

export class ReceitaPage extends BasePage {
  aguardarAbrir() {
    return aguardarJanelaComTitulo('[ 145 ]')
  }

  // Foca o campo (clique do SO) e digita. `substituir`: seleciona o conteúdo antes
  // (campos com valor inicial, ex.: Quantidade começa em 0). Campos com máscara
  // (data/hora) usam só Home: o clique deixa o cursor no FIM e os dígitos se perdem.
  async preencher(nome, valor, { enter = true, substituir = true, pausaMs = 700 } = {}) {
    const { x, y } = centro(CAMPOS[nome])
    await clicarFisico(x, y)
    if (substituir) await selecionarConteudoDoCampo()
    else await teclar(VK.HOME)
    await digitar(valor)
    if (enter) await teclar(VK.ENTER)
    if (pausaMs) await pausa(pausaMs)
  }

  async calcular() {
    await clicarFisico(CALCULAR.x, CALCULAR.y)
  }

  async informarMultiplo(multiplo) {
    await clicarFisico(MULTIPLO.x, MULTIPLO.y)
    await teclar(VK.END)
    for (let i = 0; i < 4; i++) await teclar(VK.BACKSPACE)
    await digitar(String(multiplo))
    await teclar(VK.ENTER)
    await pausa(800)
  }

  // Setas de "Nº fórmula x de y" (botões gráficos ao lado do número; captura de 2026-11-05).
  async formulaAnterior() {
    await clicarFisico(176, 232)
    await pausa(1200)
  }

  async proximaFormula() {
    await clicarFisico(200, 232)
    await pausa(1200)
  }

  async abrirAbaProdutos() {
    await clicarFisico(ABA_PRODUTOS.x, ABA_PRODUTOS.y)
    await pausa(500)
  }

  // Textos dos totais (ex.: "2.573,39"), com UMA busca (união XPath pelos retângulos).
  async lerTotais() {
    const condicoes = Object.entries(TOTAIS).flatMap(([y, xs]) => Object.keys(xs).map((x) => `(@x="${x}" and @y="${y}")`))
    const refs = await this.driver.findElements('xpath', `//Edit[${condicoes.join(' or ')}]`)
    const totais = {}
    for (const ref of refs) {
      const id = Object.values(ref)[0]
      const { x, y } = await this.driver.getElementRect(id)
      const nome = TOTAIS[y]?.[x]
      if (nome) totais[nome] = (await this.driver.getElementText(id)).trim()
    }
    return totais
  }

  async marcarConcluida() {
    await clicarFisico(CONCLUIDO_DA_RECEITA.x, CONCLUIDO_DA_RECEITA.y)
  }

  async informarEntrega(dataDDMMAAAA, horaHHMM) {
    await this.preencher('dataEntrega', dataDDMMAAAA, { enter: false, substituir: false, pausaMs: 200 })
    await this.preencher('horaEntrega', horaHHMM, { enter: false, substituir: false, pausaMs: 200 })
  }

  async abrirRastreabilidade() {
    await clicarFisico(ABA_RASTREABILIDADE.x, ABA_RASTREABILIDADE.y)
  }

  async registrarProcesso() {
    await clicarFisico(REGISTRAR_PROCESSO.x, REGISTRAR_PROCESSO.y)
  }

  async registrarBaixa() {
    await clicarFisico(REGISTRAR_BAIXA.x, REGISTRAR_BAIXA.y)
  }

  // Fechar da 145 (TBitBtn 70x34 em x=88, y=652).
  async fechar() {
    await clicarFisico(88 + 35, 652 + 17)
  }

  async gravar() {
    await clicarFisico(GRAVAR.x, GRAVAR.y)
  }

  // Leitura (única busca na árvore): XPath pelo retângulo do campo.
  async texto(nome) {
    const { classe, x, y } = CAMPOS[nome]
    const campo = this.byXPath(`//Edit[@ClassName="${classe}" and @x="${x}" and @y="${y}"]`)
    return (await campo.getText()).trim()
  }

  // Lê data e hora da entrega com UMA busca (união XPath), identificando cada campo pelo x.
  async laboratorioPreenchido() {
    return (await this.texto('nomeDoLaboratorio')) !== ''
  }

  async textoDaEntrega() {
    const { x: xd, y } = CAMPOS.dataEntrega
    const { x: xh } = CAMPOS.horaEntrega
    const refs = await this.driver.findElements(
      'xpath',
      `//Edit[@ClassName="TJPsData" and @x="${xd}" and @y="${y}"] | //Edit[@ClassName="TJPsHora" and @x="${xh}" and @y="${y}"]`
    )
    const resultado = {}
    for (const ref of refs) {
      const id = Object.values(ref)[0]
      const { x } = await this.driver.getElementRect(id)
      resultado[x === xd ? 'data' : 'hora'] = (await this.driver.getElementText(id)).trim()
    }
    return resultado
  }
}
