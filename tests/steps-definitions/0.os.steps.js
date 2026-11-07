import { After, Before, When, Then } from '@cucumber/cucumber'
import { ConfiguracaoOmniPage } from '../pages/ConfiguracaoOmniPage.js'
import { MainPage } from '../pages/MainPage.js'
import { OmniPage } from '../pages/OmniPage.js'
import { ReceitaPage } from '../pages/ReceitaPage.js'
import { ativarJanelaPrincipal, janelaComTituloAberta, listarDialogosAbertos } from '../support/appLifecycle.js'
import { registrarEvidencia } from '../support/checkpoint.js'
import { loadEnv } from '../support/loadEnv.js'
import { pausa } from '../support/teclado.js'
import { aguardarCodigoDaReceita } from '../support/receita.js'
import { codigoDoFuncionario } from '../support/calculo/cenario.js'
import { responderDialogosDoCalculo } from '../support/calculo/dialogos.js'
import {
  atendimentoDeOutroAtendenteComNaoLidas,
  estadoDaLeitura,
  itensGravadosDaFormula,
  problemasDaMassaDaOs361422,
  regraDeLeituraDasMensagens,
} from '../support/banco/os.js'

// Suíte 0.os: uma OS aberta por cenário, conferida no exe com a correção. Na 418 não há NENHUMA
// consulta UIA (as telas do Omni fecham com ela, AGENTS.md §4): clique do SO, leitura por pixel e
// conferência no banco (só leitura). Na 145 vale o padrão da 2.receitas/4.calculo.

const env = loadEnv()

const PRAZO_STEP_LONGO = 180000

// ---- 0.1: OS 364644, notificação "!" da 418, em cada regra de leitura da 635 ----
// A regra (OC_CONFIG.MENSAGEM_LIDA) é configuração GLOBAL do banco de homologação: o Esquema
// troca pela 635 em cada exemplo e devolve o valor original no fim (step final + After de
// segurança). O original é lido UMA vez por execução, antes do 1º exemplo mexer nele.
const REGRAS_VALIDAS = [0, 1, 2]
let regraOriginal = null
let atendimentoDaOs = null
let leituraAntes = null
let omniPage

Before({ tags: '@os-364644' }, async function () {
  if (regraOriginal === null) {
    regraOriginal = await regraDeLeituraDasMensagens()
    if (!REGRAS_VALIDAS.includes(regraOriginal)) {
      throw new Error(`Pré-condição da OS 364644: OC_CONFIG.MENSAGEM_LIDA = ${regraOriginal}, fora de 0/1/2 (sem valor para restaurar)`)
    }
  }
  const funcionario = codigoDoFuncionario(env.credentials.usuario)
  atendimentoDaOs = await atendimentoDeOutroAtendenteComNaoLidas(funcionario)
  if (!atendimentoDaOs) {
    throw new Error(
      'Pré-condição da OS 364644 não atendida: nenhum atendimento aberto com dono (que não seja o funcionário ' +
        `${funcionario}) com mensagem do cliente não lida e único do telefone com não lidas. ` +
        'Uma mensagem nova de um cliente num atendimento de outro atendente recria a massa.'
    )
  }
  leituraAntes = await estadoDaLeitura(atendimentoDaOs.codigo)
  console.log(
    `[0.1] OS 364644: atendimento ${atendimentoDaOs.codigo} do atendente ${atendimentoDaOs.atendente}, ` +
      `MSG_QTDE ${leituraAntes.msgQtde}, não lidas ${leituraAntes.naoLidas.join(', ')}, regra original ${regraOriginal}`
  )
})

async function definirRegraPela635(world, regra) {
  const configuracao = new ConfiguracaoOmniPage(driver)
  await configuracao.abrir()
  await configuracao.definirMensagensLidas(regra)
  await configuracao.gravar()
  await registrarEvidencia(world, `regra-${regra}-gravada`)
  await configuracao.fechar()
  const gravada = await regraDeLeituraDasMensagens()
  if (gravada !== regra) throw new Error(`A 635 não gravou a regra de mensagens lidas: esperava ${regra}, OC_CONFIG.MENSAGEM_LIDA = ${gravada} (captura regra-${regra}-gravada)`)
}

// Rede de segurança: exemplo que falhou no meio deixa a regra trocada. Tenta devolver pela 635
// (fechando o detalhe da 418 se ficou aberto); se não der, avisa alto o que restaurar.
// Prazo próprio: a releitura do banco pode reconectar (até minutos) antes de abrir a 635.
After({ tags: '@os-364644', timeout: 600000 }, async function () {
  if (regraOriginal === null) return
  const atual = await regraDeLeituraDasMensagens().catch(() => null)
  if (atual === regraOriginal) return
  try {
    if (await janelaComTituloAberta('Atendimentos - Detalhe')) await new OmniPage(driver).fecharDetalhe()
    await definirRegraPela635(this, regraOriginal)
    console.warn(`[0.1] regra de mensagens lidas restaurada pelo After: ${atual} -> ${regraOriginal}`)
  } catch (erro) {
    console.error(`[0.1] ATENÇÃO: OC_CONFIG.MENSAGEM_LIDA ficou ${atual}; o original era ${regraOriginal}. Restaurar na tela 635. (${erro.message})`)
  }
})

When('configuro na 635 as mensagens lidas com a regra {int}', { timeout: PRAZO_STEP_LONGO }, async function (regra) {
  await definirRegraPela635(this, regra)
})

Then('restauro na 635 a regra original de mensagens lidas', { timeout: PRAZO_STEP_LONGO }, async function () {
  await definirRegraPela635(this, regraOriginal)
})

When('abro na 418 o atendimento de outro atendente com mensagens não lidas', { timeout: PRAZO_STEP_LONGO }, async function () {
  await new MainPage(driver).abrirTelaPorNumero(418)
  omniPage = new OmniPage(driver)
  await omniPage.aguardarAtendimentos()
  await omniPage.filtrarPorTelefone(atendimentoDaOs.telefone)
  await registrarEvidencia(this, 'notificacao-antes')
  // Sem o "!" antes de abrir, o teste não provaria nada: falha como pré-condição, não como a OS.
  const linha = await omniPage.linhaComNotificacaoDeNaoLidas()
  if (linha === null) {
    throw new Error(`Pré-condição: a grade filtrada pelo telefone do atendimento ${atendimentoDaOs.codigo} não mostra o "!" verde antes de abrir (captura notificacao-antes)`)
  }
  await omniPage.abrirAtendimentoDaLinha(linha)
  await registrarEvidencia(this, 'atendimento-de-outro-aberto')
})

When('fecho o atendimento e atualizo a lista', { timeout: PRAZO_STEP_LONGO }, async function () {
  await omniPage.fecharDetalhe()
  await omniPage.atualizarGrade()
})

Then('a notificação de mensagens não lidas continua no atendimento com a regra {int}', async function (regra) {
  const depois = await estadoDaLeitura(atendimentoDaOs.codigo)
  await registrarEvidencia(this, 'notificacao-depois')
  const problemas = []
  const regraVigente = await regraDeLeituraDasMensagens()
  if (regraVigente !== regra) problemas.push(`a regra vigente era ${regraVigente}, não ${regra} (alguém trocou a 635 durante o teste?)`)
  if (depois.atendente !== leituraAntes.atendente) {
    problemas.push(`o dono mudou de ${leituraAntes.atendente} para ${depois.atendente} (abrir não deveria atribuir)`)
  }
  if (depois.msgQtde !== leituraAntes.msgQtde) {
    problemas.push(`OC_ATENDIMENTO.MSG_QTDE foi de ${leituraAntes.msgQtde} para ${depois.msgQtde}`)
  }
  const lidas = leituraAntes.naoLidas.filter((codigo) => !depois.naoLidas.includes(codigo))
  if (lidas.length > 0) problemas.push(`mensagens marcadas como lidas (LEITURA_DT preenchido): ${lidas.join(', ')}`)
  if ((await omniPage.linhaComNotificacaoDeNaoLidas()) === null) problemas.push('o "!" verde sumiu da grade (captura notificacao-depois)')
  if (problemas.length > 0) {
    throw new Error(
      `OS 364644 reproduzida (regra ${regra}): abrir o atendimento ${atendimentoDaOs.codigo} do atendente ${atendimentoDaOs.atendente} ` +
        `pelo funcionário da suíte apagou a notificação:\n- ${problemas.join('\n- ')}\n` +
        '(se o próprio dono leu a conversa durante o teste, o resultado não vale: rodar de novo)'
    )
  }
  const dialogos = await listarDialogosAbertos()
  if (dialogos.length > 0) throw new Error(`Diálogo inesperado aberto no fim: ${JSON.stringify(dialogos)}`)
})

// ---- 0.2: OS 361422, item em % ignora ativos em mg/mcg (bug do produto, @bug) ----
// A fórmula 2 da receita 261001707 (consulfarma), que o dev usou na investigação: forma 61 (informe
// por Total múltiplo), lab 2, total 1, e a essência em % incluída À MÃO (pelo vínculo dos
// conservantes ela sai certa). Esperado: % × soma das quantidades calculadas dos ativos de massa,
// com o item em mg (0,4245, como a fórmula 1 daquela receita). Hoje: 0,37 (a valeriana fica de fora).
const OS_361422 = {
  laboratorio: 2,
  forma: 61,
  total: 1,
  itens: [
    { produto: 1001191, quantidade: '1,5', unidade: 'g' }, // GLUCOSAMINA
    { produto: 1001910, quantidade: '1,2', unidade: 'g' }, // CONDROITINA (fator 1,0375)
    { produto: 1001594, quantidade: '1', unidade: 'g' }, // MSM
    { produto: 1001238, quantidade: '500', unidade: 'mg' }, // VALERIANA EXTRATO SECO
    { produto: 1003193, quantidade: '10', unidade: '%' }, // ESSÊNCIA FLOR DE LARANJEIRA
  ],
  produtoEmPercentual: 1003193,
}
const TOLERANCIA_GRAMAS = 0.0001
let receitaDaOs361422 = null

Before({ tags: '@os-361422' }, async function () {
  receitaDaOs361422 = null
  const problemas = await problemasDaMassaDaOs361422(OS_361422)
  if (problemas.length > 0) throw new Error(`Pré-condição da OS 361422 não atendida:\n- ${problemas.join('\n- ')}`)
})

When('monto e calculo a fórmula da OS 361422 com a essência em percentual incluída à mão', { timeout: PRAZO_STEP_LONGO * 2 }, async function () {
  const receitaPage = new ReceitaPage(driver)
  // O 1º campo se perde se a 145 ainda não estiver pronta: confere o laboratório e repete.
  for (let tentativa = 1; ; tentativa++) {
    await receitaPage.preencher('laboratorio', String(OS_361422.laboratorio), { pausaMs: 1500 })
    if (await receitaPage.laboratorioPreenchido()) break
    if (tentativa === 3) throw new Error('Laboratório não foi preenchido na 145 depois de 3 tentativas')
    await pausa(3000)
  }
  await receitaPage.preencher('formaFarmaceutica', String(OS_361422.forma), { pausaMs: 2000 })
  await receitaPage.preencher('totalMultiplo', String(OS_361422.total))
  for (const item of OS_361422.itens) {
    await receitaPage.abrirAbaProdutos()
    await receitaPage.preencher('produto', String(item.produto), { pausaMs: 1500 })
    await receitaPage.preencher('quantidade', item.quantidade)
    await receitaPage.preencher('unidade', item.unidade, { pausaMs: 1800 })
    await responderDialogosDoCalculo({ outra: 'Não', qsp: false, quietoMs: 1500 })
  }
  await ativarJanelaPrincipal()
  await receitaPage.calcular()
  await pausa(1500)
  // Até a 046 (paciente) abrir: "calcular outra fórmula?" → Não.
  await responderDialogosDoCalculo({ outra: 'Não', qsp: false })
  await registrarEvidencia(this, 'os-361422-calculada')
})

// Gravar logo depois de escolher paciente e prescritor cai em "precisa ser recalculada" (2.receitas):
// recalcula antes. O código da receita prova que gravou.
When('recalculo e gravo a receita da OS 361422', { timeout: PRAZO_STEP_LONGO * 2 }, async function () {
  const receitaPage = new ReceitaPage(driver)
  await ativarJanelaPrincipal()
  await receitaPage.calcular()
  await pausa(1500)
  await responderDialogosDoCalculo({ outra: 'Não', qsp: false })
  await ativarJanelaPrincipal()
  await receitaPage.gravar()
  await responderDialogosDoCalculo({ outra: 'Não', qsp: false, quietoMs: 3000 })
  receitaDaOs361422 = Number(await aguardarCodigoDaReceita(receitaPage))
  console.log(`[0.2] OS 361422: receita ${receitaDaOs361422}`)
  await registrarEvidencia(this, `os-361422-receita-${receitaDaOs361422}`)
})

Then('a essência em percentual é calculada sobre todos os ativos da fórmula, inclusive os em mg', async function () {
  if (!receitaDaOs361422) throw new Error('A receita da OS 361422 não foi gravada neste cenário')
  const itens = await itensGravadosDaFormula(receitaDaOs361422, 1)
  const percentual = itens.find((i) => i.produto === OS_361422.produtoEmPercentual)
  if (!percentual) throw new Error(`A receita ${receitaDaOs361422} não tem o item em % (${OS_361422.produtoEmPercentual})`)
  const ativos = itens.filter((i) => i.deMassa && i.produto !== percentual.produto)
  const base = ativos.reduce((soma, i) => soma + i.calculo, 0)
  const esperado = Math.round(base * (percentual.quantidade / 100) * 1e4) / 1e4
  const resumo = ativos.map((i) => `${i.nome} ${i.quantidade} ${i.unidade} = ${i.calculo} g`).join('; ')
  await this.attach(`Receita ${receitaDaOs361422}, fórmula 1\nAtivos: ${resumo}\nBase ${base} g × ${percentual.quantidade}% = ${esperado} g; gravado ${percentual.calculo} g`, 'text/plain')
  if (Math.abs(percentual.calculo - esperado) > TOLERANCIA_GRAMAS) {
    // Diagnóstico: quais ativos explicariam o valor gravado se tivessem ficado de fora.
    const semMgMcg = ativos.filter((i) => !['mg', 'mcg'].includes(i.unidade.toLowerCase()))
    const baseSemMgMcg = semMgMcg.reduce((soma, i) => soma + i.quantidade * (i.unidade.toLowerCase() === 'kg' ? 1000 : 1), 0)
    throw new Error(
      `OS 361422 reproduzida (receita ${receitaDaOs361422}): ${percentual.nome} ${percentual.quantidade}% gravada com ${percentual.calculo} g; ` +
        `esperado ${esperado} g (${percentual.quantidade}% de ${Math.round(base * 1e4) / 1e4} g, soma das quantidades calculadas dos ativos: ${resumo}). ` +
        `${percentual.quantidade}% só dos itens em g, pela quantidade digitada, daria ${Math.round(baseSemMgMcg * percentual.quantidade / 100 * 1e4) / 1e4} g.`
    )
  }
})
