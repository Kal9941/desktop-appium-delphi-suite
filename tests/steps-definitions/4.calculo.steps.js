import { When, Then } from '@cucumber/cucumber'
import path from 'node:path'
import { ReceitaPage } from '../pages/ReceitaPage.js'
import {
  ativarJanelaPrincipal, janelaComTituloAberta, listarDialogosAbertos, responderJanelaDeTopo,
} from '../support/appLifecycle.js'
import { registrarCheckpoint } from '../support/checkpoint.js'
import { getSessionLabel } from '../support/sessionLabel.js'
import { loadEnv } from '../support/loadEnv.js'
import { pausa } from '../support/teclado.js'
import { aguardarCodigoDaReceita, escolherPacienteEPrescritor } from '../support/receita.js'
import { valorDaTela } from '../support/calculo/comparacao.js'
import { responderDialogosDoCalculo } from '../support/calculo/dialogos.js'
import {
  ConferenciaDoOrcamento, carregarOrcamento, conferirPreCondicoesDoOrcamento, conferirPrescritor,
} from '../support/calculo/cenario.js'

// Suíte 4.calculo: cada cenário é um orçamento com várias fórmulas (massa em
// tests/fixtures/calculo/orcamentos.json). Estado do cenário em `this.calculo` (World do Cucumber).
const env = loadEnv()
const PRAZO = 15 * 60 * 1000

function prescritorDoOrcamento(orcamento) {
  const codigo = env.testData?.calculo?.[orcamento.prescritor === 'comAcrescimo' ? 'prescritorComAcrescimo' : 'prescritorSemAcrescimo']
  if (!codigo) throw new Error('Preencha testData.calculo.prescritorSemAcrescimo/prescritorComAcrescimo em env.json')
  return codigo
}

async function lerTotaisNumericos(receitaPage) {
  const t = await receitaPage.lerTotais()
  return {
    txTecnica: valorDaTela(t.txTecnica),
    valorFormula: valorDaTela(t.valorFormula),
    valorOrcamento: valorDaTela(t.valorOrcamento),
    numeroFormula: Number(t.numeroFormula),
    totalFormulas: Number(t.totalFormulas),
  }
}

async function montarFormula(receitaPage, formula, qsp) {
  for (let tentativa = 1; ; tentativa++) {
    await receitaPage.preencher('laboratorio', String(formula.laboratorio), { pausaMs: 1500 })
    if (await receitaPage.laboratorioPreenchido()) break
    if (tentativa === 3) throw new Error('Laboratório não foi preenchido na 145 depois de 3 tentativas')
    await pausa(3000)
  }
  await receitaPage.preencher('formaFarmaceutica', String(formula.forma), { pausaMs: 2000 })
  if (formula.multiplo && formula.multiplo !== 1) await receitaPage.informarMultiplo(formula.multiplo)
  if (formula.total != null) await receitaPage.preencher('totalMultiplo', String(formula.total))
  for (const item of formula.itens) {
    await receitaPage.abrirAbaProdutos()
    await receitaPage.preencher('produto', String(item.produto), { pausaMs: 1500 })
    await receitaPage.preencher('quantidade', String(item.quantidade))
    await receitaPage.preencher('unidade', item.unidade, { pausaMs: 1800 })
    // Diálogos ao incluir o item (ex.: "Deseja calcular fórmula em QSP?").
    await responderDialogosDoCalculo({ outra: 'Não', qsp, quietoMs: 1500 })
  }
}

// Leva a 145 até a fórmula `numero` pelas setas de "Nº fórmula x de y".
async function irParaFormula(receitaPage, numero) {
  for (let i = 0; i < 20; i++) {
    const { numeroFormula } = await lerTotaisNumericos(receitaPage)
    if (numeroFormula === numero) return
    if (numeroFormula > numero) await receitaPage.formulaAnterior()
    else await receitaPage.proximaFormula()
  }
  throw new Error(`Não consegui navegar até a fórmula ${numero} da 145`)
}

When('os produtos do orçamento {string} têm a configuração esperada na ficha', { timeout: PRAZO }, async function (chave) {
  const orcamento = carregarOrcamento(chave)
  await conferirPreCondicoesDoOrcamento(orcamento)
  await conferirPrescritor(orcamento, prescritorDoOrcamento(orcamento))
  this.calculo = new ConferenciaDoOrcamento(chave, orcamento)
})

When('monto e calculo as fórmulas do orçamento {string}', { timeout: PRAZO }, async function (chave) {
  const { orcamento } = this.calculo
  if (this.calculo.chave !== chave) throw new Error(`O cenário conferiu o orçamento "${this.calculo.chave}" mas monta "${chave}"`)
  const receitaPage = new ReceitaPage(driver)
  for (const [i, formula] of orcamento.formulas.entries()) {
    const ultima = i === orcamento.formulas.length - 1
    await montarFormula(receitaPage, formula, orcamento.qsp)
    await ativarJanelaPrincipal()
    await receitaPage.calcular()
    await pausa(1500)
    await responderDialogosDoCalculo({ outra: ultima ? 'Não' : 'Sim', qsp: orcamento.qsp })
    // Na última fórmula a 046 já está aberta por cima da 145: os totais continuam legíveis pela UIA
    // da janela principal, mas o PS01 ainda não confirmou a transação do cálculo dela. A leitura do
    // banco dessa fórmula fica para depois de escolher paciente e prescritor (ver o step abaixo).
    const totais = await lerTotaisNumericos(receitaPage)
    if (ultima) this.calculo.pendente = { indice: i, totais }
    else await this.calculo.registrarCalculo(i, totais)
  }
})

Then('cada fórmula calculada confere com o modelo de cálculo', { timeout: PRAZO }, async function () {
  if (this.calculo.pendente) throw new Error('A última fórmula ainda não foi lida do banco: escolha o paciente e o prescritor antes de conferir')
  await this.calculo.conferirFormulas()
  // Registra o que já divergiu (a falha fica para o fim do cenário, com todas as divergências,
  // depois de gravar o orçamento como evidência).
  if (this.calculo.divergencias.length) await this.attach(`Divergências até aqui:\n${this.calculo.tabela()}`, 'text/plain')
  // O que o modelo não cobre (qsp, total final...) aparece no relatório, nunca some em silêncio.
  const naoConferidos = this.calculo.listaNaoConferidos()
  if (naoConferidos.length) await this.attach(`Não conferido pelo modelo (quantidade do sistema):\n${naoConferidos.join('\n')}`, 'text/plain')
})

When('escolho o paciente e o prescritor do orçamento', { timeout: PRAZO }, async function () {
  this.calculo.prescritor = prescritorDoOrcamento(this.calculo.orcamento)
  await escolherPacienteEPrescritor({ clienteId: env.testData.clienteId, prescritorCodigo: this.calculo.prescritor })
  // Com a 046/036 fechadas o PS01 confirma o cálculo da última fórmula: agora dá para lê-la.
  if (this.calculo.pendente) {
    const { indice, totais } = this.calculo.pendente
    await this.calculo.registrarCalculo(indice, totais)
    this.calculo.pendente = null
  }
})

When('recalculo e gravo o orçamento', { timeout: PRAZO }, async function () {
  const receitaPage = new ReceitaPage(driver)
  const { orcamento } = this.calculo
  // Depois do Gravar responde TODOS os diálogos até não sobrar nenhum, sem clicar Gravar de novo
  // (não duplicar a gravação): "Fórmula nº N precisa ser recalculada" → recalcula a fórmula N e
  // grava outra vez; qualquer outro aviso (ex.: "Observação do médico" do prescritor, "Gravação OK")
  // → Ok e segue. O sucesso é provado depois pelo código do orçamento.
  const avisos = []
  const temCodigo = async () => /^[0-9]+$/.test(await receitaPage.texto('codigoReceita'))
  const LIMITE_DE_DIALOGOS = 15
  for (let gravacao = 1; gravacao <= orcamento.formulas.length + 2; gravacao++) {
    await ativarJanelaPrincipal()
    await receitaPage.gravar()
    let recalcular = null
    let respondidos = 0
    for (let ultimoDialogo = Date.now(); Date.now() - ultimoDialogo < 4000; ) {
      await pausa(800)
      const dialogos = await listarDialogosAbertos()
      if (!dialogos.length) continue
      // Um diálogo que reaparece (clique errado, aviso em laço) não pode prender o step até o prazo.
      if (++respondidos > LIMITE_DE_DIALOGOS) throw new Error(`O Gravar abriu mais de ${LIMITE_DE_DIALOGOS} diálogos seguidos: ${avisos.join(' | ')}`)
      const mensagem = await responderJanelaDeTopo(dialogos[0], (texto) => {
        const m = /f[óo]rmula n[ºo°]?\s*(\d+)\s*precisa ser recalculada/i.exec(texto)
        if (m) recalcular = Number(m[1])
        return ['Ok', 'OK', 'Sim']
      })
      avisos.push(String(mensagem).replace(/\s+/g, ' '))
      ultimoDialogo = Date.now()
      if (recalcular !== null) break
    }
    if (recalcular === null) {
      // Um aviso informativo (ex.: "Observação do médico" do prescritor 7) cancela aquele Gravar sem
      // gravar. Antes de gravar de novo espera o Código por até 15 s: um Gravar lento que ainda vai
      // atribuir o código não pode levar a um 2º clique (orçamento duplicado).
      const gravou = await browser.waitUntil(temCodigo, { timeout: 15000, interval: 1000 }).catch(() => false)
      if (!gravou) continue
      if (avisos.length) await this.attach(`Avisos ao gravar:\n${avisos.join('\n')}`, 'text/plain')
      return
    }
    await irParaFormula(receitaPage, recalcular)
    await ativarJanelaPrincipal()
    await receitaPage.calcular()
    await pausa(1500)
    await responderDialogosDoCalculo({ outra: 'Não', qsp: orcamento.qsp })
  }
  throw new Error(`O orçamento não gravou depois de recalcular as fórmulas (avisos: ${avisos.join(' | ')})`)
})

Then('o orçamento gravado confere com o modelo de cálculo', { timeout: PRAZO }, async function () {
  const receitaPage = new ReceitaPage(driver)
  const codigo = await aguardarCodigoDaReceita(receitaPage)
  await registrarCheckpoint(driver, `orcamento-${this.calculo.orcamento.cenario}-${codigo}`)
  const totais = await lerTotaisNumericos(receitaPage)
  await this.calculo.conferirGravado(codigo, this.calculo.prescritor, totais)
  this.calculo.salvarEvidencia(path.join('tests', 'reports', getSessionLabel()))
  await this.attach(`Orçamento ${codigo} (${this.calculo.chave})\n${this.calculo.tabela()}`, 'text/plain')
  if (await janelaComTituloAberta('Atenção')) throw new Error('Diálogo "Atenção" aberto depois de gravar o orçamento')
  this.calculo.falharSeDivergiu()
})
