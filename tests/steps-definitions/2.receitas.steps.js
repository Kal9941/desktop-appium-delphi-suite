import { Before, When, Then } from '@cucumber/cucumber'
import { expect } from 'expect-webdriverio'
import { MainPage } from '../pages/MainPage.js'
import { BaixaPage } from '../pages/BaixaPage.js'
import { OmniPage } from '../pages/OmniPage.js'
import { PrescritorPage } from '../pages/PrescritorPage.js'
import { ReceitaPage } from '../pages/ReceitaPage.js'
import {
  ativarJanelaPrincipal,
  listarDialogosAbertos,
  responderDialogoAtencao,
  responderJanelaDeTopo,
  responderJanelaDeTopoSemUia,
  aguardarJanelaFechar,
} from '../support/appLifecycle.js'
import { registrarCheckpoint, registrarCheckpointDoSO } from '../support/checkpoint.js'
import { loadEnv } from '../support/loadEnv.js'
import { pausa } from '../support/teclado.js'
import { escolherPacienteEPrescritor as escolherPacienteEPrescritorDaReceita, aguardarCodigoDaReceita as aguardarCodigo } from '../support/receita.js'
import {
  aguardarAtendenteDoAtendimento,
  atendimentoAbertoDoTelefone,
  marcoAntesDoOmni,
  mensagemDoOrcamentoEnviada,
  orcamentosDaMensagem,
  posicaoNaListaDeTransferencia,
  receitaNovaDoOmni,
} from '../support/banco/omni.js'
import { codigoDoFuncionario } from '../support/calculo/cenario.js'
import { faltasDeEstoqueParaBaixa, itensDaReceitaParaPesagem, problemasParaPesagem } from '../support/banco/baixa.js'

const env = loadEnv()

// Prazo próprio para steps que fazem várias interações (o padrão do Cucumber é 60 s).
const PRAZO_STEP_LONGO = 180000

let receitaPage

// Dados da receita vêm de `testData.receita` (massa versionada no env.json; uma chave
// vazia no env.local.json a sobrescreve): falha cedo e explícito se algum estiver vazio,
// em vez de digitar "" no app.
function dadosReceita() {
  const dados = env.testData.receita
  const vazios = Object.entries(dados).filter(([, valor]) => !valor).map(([chave]) => chave)
  if (vazios.length > 0) {
    throw new Error(`Preencha testData.receita em env.json (ou tire a chave vazia do env.local.json): faltam ${vazios.join(', ')}`)
  }
  return dados
}

async function abrirTelaDeReceita() {
  await new MainPage(driver).abrirTelaPorNumero(145)
  receitaPage = new ReceitaPage(driver)
  await receitaPage.aguardarAbrir()
  // O título da 145 aparece antes de o formulário estar pronto: sem esta espera o 1º
  // campo digitado se perde (visto: Laboratório vazio e o 30 caiu no nome da forma).
  await pausa(4000)
}

async function montarFormula({ verificar = true } = {}) {
  const dados = dadosReceita()
  // O 1º campo digitado se perde se a 145 ainda não estiver pronta (intermitente, mesmo com
  // espera): confere o nome do laboratório e repete em vez de seguir com tela vazia.
  for (let tentativa = 1; ; tentativa++) {
    await receitaPage.preencher('laboratorio', dados.laboratorio, { pausaMs: 1500 })
    if (!verificar || (await receitaPage.laboratorioPreenchido())) break
    if (tentativa === 3) throw new Error('Laboratório não foi preenchido na 145 depois de 3 tentativas')
    await pausa(3000)
  }
  // Depois da forma, o app mostra Total múltiplo e os campos de produto: sem detecção
  // possível por Win32, espera fixa (1,5 s já foi pouco: o 30 caiu no Código da receita).
  await receitaPage.preencher('formaFarmaceutica', dados.formaFarmaceutica, { pausaMs: 2000 })
  await receitaPage.preencher('totalMultiplo', dados.totalMultiplo)
  await receitaPage.preencher('produto', dados.produtoCodigo, { pausaMs: 1200 })
  await receitaPage.preencher('quantidade', dados.produtoQuantidade)
  await receitaPage.preencher('unidade', dados.produtoUnidade, { pausaMs: 1500 })
}

// Calcular → "Tratamento de uso contínuo" (janela de topo) → "Deseja calcular outra
// fórmula?" (Não). Usado no 1º cálculo e no recálculo.
async function calcularFormula({ semUia = false } = {}) {
  await ativarJanelaPrincipal()
  await receitaPage.calcular()
  if (semUia) {
    // Telas do Omni: nenhuma consulta UIA (fecharia a MDI), então sem ler o texto do aviso.
    await responderJanelaDeTopoSemUia('Tratamento de uso contínuo', 'Fechar')
    await responderJanelaDeTopoSemUia('Atenção', 'Não')
    return
  }
  await responderJanelaDeTopo('Tratamento de uso contínuo', 'Fechar')
  const mensagem = await responderDialogoAtencao('Não')
  expect(mensagem).toContain('calcular outra fórmula')
}

async function escolherPacienteEPrescritor() {
  const dados = dadosReceita()
  await escolherPacienteEPrescritorDaReceita({ clienteId: env.testData.clienteId, prescritorCodigo: dados.prescritorCodigo })
}

async function recalcularEGravar() {
  // Gravar logo após escolher paciente/prescritor falha com "precisa ser
  // recalculada" (comportamento do app): recalcular antes de gravar.
  await calcularFormula()
  await receitaPage.gravar()
}

// Código da última receita gravada no cenário (o 2.3 lê os itens dela no banco). Zerado a cada
// cenário: o worker reaproveita o módulo e o valor do cenário anterior não pode vazar.
let codigoReceitaGravada = null
Before(function () {
  codigoReceitaGravada = null
})

async function aguardarCodigoDaReceita() {
  codigoReceitaGravada = await aguardarCodigo(receitaPage)
}

When('abro a tela de receita', abrirTelaDeReceita)

When('monto a fórmula de teste com o produto de teste', { timeout: PRAZO_STEP_LONGO }, montarFormula)

When('calculo a fórmula', { timeout: PRAZO_STEP_LONGO }, calcularFormula)

When('escolho o paciente e o prescritor de teste', { timeout: PRAZO_STEP_LONGO }, escolherPacienteEPrescritor)

When('recalculo a fórmula e gravo a receita', { timeout: PRAZO_STEP_LONGO }, recalcularEGravar)

Then('a receita recebe um código', { timeout: PRAZO_STEP_LONGO }, aguardarCodigoDaReceita)

// Preparo compartilhado por 2.2 em diante: cada cenário monta a PRÓPRIA receita
// (co-dependência zero, `[R-ISOL]`), com o mesmo caminho do 2.1.
When('preparo uma receita alopática gravada', { timeout: 600000 }, async function () {
  await abrirTelaDeReceita()
  await montarFormula()
  await calcularFormula()
  await escolherPacienteEPrescritor()
  await recalcularEGravar()
  await aguardarCodigoDaReceita()
})

// Entrega no dia seguinte às 10h (data relativa: uma data fixa vira passado).
function entregaAmanha() {
  const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const dd = String(amanha.getDate()).padStart(2, '0')
  const mm = String(amanha.getMonth() + 1).padStart(2, '0')
  return { data: `${dd}${mm}${amanha.getFullYear()}`, hora: '1000' }
}

async function marcarConcluidaEInformarEntrega() {
  const entrega = entregaAmanha()
  await ativarJanelaPrincipal()
  await receitaPage.marcarConcluida()
  await pausa(500)
  await receitaPage.informarEntrega(entrega.data, entrega.hora)
  // Confere o que ficou digitado nas máscaras (nossa própria entrada, não regra de
  // negócio): um dígito perdido já deu "data inválida" e o cenário passou em falso.
  const { data, hora } = await receitaPage.textoDaEntrega()
  expect(data).toBe(`${entrega.data.slice(0, 2)}/${entrega.data.slice(2, 4)}/${entrega.data.slice(4)}`)
  expect(hora).toBe(`${entrega.hora.slice(0, 2)}:${entrega.hora.slice(2)}`)
}

async function gravarReceitaConcluida() {
  await receitaPage.gravar()
  await pausa(2000)
  // Diálogo de erro/aviso inesperado depois do Gravar (checagem Win32): o checkpoint sozinho
  // deixou passar um "data inválida" no 2.2.
  expect(await listarDialogosAbertos()).toEqual([])
}

When('marco a receita como concluída e informo a entrega para amanhã às 10h', { timeout: PRAZO_STEP_LONGO }, marcarConcluidaEInformarEntrega)

When('gravo a receita concluída', { timeout: PRAZO_STEP_LONGO }, gravarReceitaConcluida)

// 2.3: a receita concluída (mesmo caminho do 2.2) é o ponto de partida do processo e da baixa.
When('preparo uma receita alopática concluída', { timeout: 900000 }, async function () {
  await abrirTelaDeReceita()
  await montarFormula()
  await calcularFormula()
  await escolherPacienteEPrescritor()
  await recalcularEGravar()
  await aguardarCodigoDaReceita()
  await marcarConcluidaEInformarEntrega()
  await gravarReceitaConcluida()
})

let baixaPage

// A baixa é registrada no momento em que a receita é gravada com o processo: registrar o processo
// na 145 ANTES de abrir a 433 já registra a baixa (visto em 2026-10-29: a hora da baixa era a do
// 1º processo). Por isso aqui NÃO se registra processo na 145: abre-se a 433, pesa-se e só então
// se registra o processo e a baixa, dentro da própria 433.
// Pré-condições do 2.3 conferidas no banco ANTES de abrir o app (só leitura): a 445 deste computador
// em SEM BALANÇA e o processo padrão do funcionário. Sem isso o cenário só falharia minutos depois,
// dentro da 433, com causa menos clara.
Before({ tags: '@pesagem' }, async function () {
  const problemas = await problemasParaPesagem(codigoDoFuncionario(env.credentials.usuario))
  if (problemas.length > 0) {
    throw new Error(`Pré-condição do 2.3 não atendida:\n- ${problemas.join('\n- ')}`)
  }
})

When('registro a baixa da receita pela pesagem monitorada', { timeout: 900000 }, async function () {
  if (!codigoReceitaGravada) throw new Error('O código da receita gravada não foi lido antes da baixa')
  // Itens da própria receita, lidos no banco: a cápsula e as embalagens dependem do cálculo.
  const itens = await itensDaReceitaParaPesagem(codigoReceitaGravada)
  console.log(`[2.3] receita ${codigoReceitaGravada}: pesando ${itens.join(', ')}`)
  // Estoque conferido no banco ANTES de abrir a 433: sem saldo a pesagem não conclui e só se
  // descobria 20 s depois, dentro da Pesagem monitorada (pedido do operador, 2026-11-06).
  const faltas = await faltasDeEstoqueParaBaixa(codigoReceitaGravada)
  if (faltas.length > 0) {
    throw new Error(`Estoque insuficiente para a baixa da receita ${codigoReceitaGravada}:\n- ${faltas.join('\n- ')}`)
  }
  await receitaPage.registrarBaixa()
  baixaPage = new BaixaPage(driver)
  await baixaPage.aguardarAbrir()
  await pausa(1500)
  await registrarCheckpointDoSO('baixa-433-aberta')
  // A baixa ainda NÃO pode existir antes da pesagem (o 2.3 já passou com ela registrada pelo
  // processo da 145, e o "Registrar baixa" do fim era um clique sem efeito).
  if (await baixaPage.baixaRegistrada()) {
    throw new Error('A 433 abriu com "Baixa registrada: Sim": a baixa já existia antes da pesagem (o processo da 145 foi registrado antes? ver captura baixa-433-aberta).')
  }
  await baixaPage.abrirPesagemMonitorada()
  if (!(await baixaPage.registrarPesoDosItens(itens))) {
    const captura = await registrarCheckpointDoSO('pesagem-nao-fechou')
    // Duas causas já vistas, que a captura separa: "Qtde. pesada" 0 em TODOS os itens = a pesagem
    // espera a balança (445 por computador, 2026-11-06); parou num item = lote sem saldo (2026-10-29).
    throw new Error(
      `A Pesagem monitorada não fechou em 20 s depois de digitar os ${itens.length} itens. Causas conhecidas: ` +
        '(1) "Qtde. pesada" 0 em todos os itens: a tela 445 deste computador está COM BALANÇA (a configuração é ' +
        'por computador, tabela CONFIG_0433; ajustar na 433 > "..." > 445: Tipo de uso 0 - SEM BALANÇA e Tipo leitura ' +
        '1 - REGISTRO NO SISTEMA); (2) a pesagem parou num item: lote sem saldo para a "Qtde. cálculo" (compare com a ' +
        `"Quantidade" do lote disponível). Captura: ${captura}`
    )
  }
  await baixaPage.registrarProcesso()
  await responderDialogoAtencao('Sim')
  await baixaPage.registrarBaixa()
  await pausa(3000)
  // Sem isto um "Atenção" sem resposta (clique que não pegou) deixava o cenário passar em
  // falso: o checkpoint sozinho não afirma nada.
  expect(await listarDialogosAbertos()).toEqual([])
  if (!(await baixaPage.aguardarBaixaRegistrada())) {
    throw new Error('Depois de "Registrar baixa" a 433 não mostrou "Baixa registrada: Sim" em 15 s.')
  }
})

Then('registro o checkpoint {string}', async function (nome) {
  await registrarCheckpoint(driver, nome)
})

// ---- 2.4: orçamento pelo Omni Channel (sem NENHUMA consulta UIA depois de abrir a 418) ----
let omniPage
let marcoOmni

// Prazo maior: além de abrir o atendimento, pode transferi-lo (471 + conferência no banco).
When('abro o Omni Channel e inicio o atendimento com o telefone do operador', { timeout: 300000 }, async function () {
  // Maior código de receita e de mensagem antes do cenário: a asserção do envio só olha o que vier depois.
  marcoOmni = await marcoAntesDoOmni()
  await new MainPage(driver).abrirTelaPorNumero(418)
  omniPage = new OmniPage(driver)
  await omniPage.aguardarAtendimentos()
  await omniPage.iniciarAtendimento({
    canal: '3', // WHATSAPP NAO OFICIAL (texto livre)
    grupo: '7', // ATENDIMENTO
    cliente: env.testData.clienteId,
    celular: env.credentials.telefone,
  })
  // Telefone com atendimento aberto: "Cliente já possui um atendimento aberto! Deseja consultar?"
  // (Sim abre o existente; Não só cancela). Sem atendimento aberto (o sistema finaliza o antigo
  // por inatividade: o 261000216 em 2026-11-02) o envio cria um atendimento NOVO e manda ao
  // celular a mensagem digitada; aí não há aviso e o teste segue no atendimento novo.
  try {
    await responderJanelaDeTopoSemUia('Atenção', 'Sim', { timeoutMs: 20000 })
  } catch (erro) {
    if (!String(erro.message).startsWith('Nenhuma janela correspondente')) throw erro
    console.log('[2.4] sem atendimento aberto para o telefone: o envio criou um atendimento novo')
    await registrarCheckpointDoSO('atendimento-novo-criado')
  }
  await omniPage.aguardarDetalhe()
  // O `Orçamento receita` só vale para o dono do atendimento: se o atendimento aberto do
  // telefone é de outro atendente (uso real do operador), transfere para o funcionário da
  // suíte no mesmo grupo (pré-condição: ele é atendente do grupo, cadastrado na 471).
  const funcionario = codigoDoFuncionario(env.credentials.usuario)
  const atendimento = await atendimentoAbertoDoTelefone(env.credentials.telefone)
  if (atendimento && atendimento.atendente !== funcionario) {
    console.log(`[2.4] atendimento ${atendimento.codigo} é do atendente ${atendimento.atendente}: transferindo para o ${funcionario}`)
    const posicao = await posicaoNaListaDeTransferencia(atendimento, funcionario)
    await omniPage.transferirAtendimento(posicao)
    await aguardarAtendenteDoAtendimento(atendimento, funcionario)
    await registrarCheckpointDoSO('atendimento-transferido')
  }
})

When('desmarco os movimentos que já estavam no atendimento do Omni', { timeout: PRAZO_STEP_LONGO }, async function () {
  await omniPage.desmarcarMovimentosExistentes()
})

When('crio o orçamento da receita pelo atendimento do Omni',{ timeout: 900000 }, async function () {
  const dados = dadosReceita()
  await omniPage.abrirOrcamentoReceita()
  receitaPage = new ReceitaPage(driver)
  await receitaPage.aguardarAbrir()
  await pausa(4000)
  await montarFormula({ verificar: false })
  await calcularFormula({ semUia: true })
  // Paciente e comprador já vêm do atendimento: só o prescritor é pedido (036).
  const prescritor = new PrescritorPage(driver)
  await prescritor.aguardarAbrir()
  await prescritor.selecionarPorCodigo(dados.prescritorCodigo)
  await prescritor.fecharSeAindaAberta()
  await calcularFormula({ semUia: true })
  await receitaPage.gravar()
  await pausa(4000)
  expect(await listarDialogosAbertos()).toEqual([])
})

When('fecho a receita e envio o orçamento pelo Omni', { timeout: PRAZO_STEP_LONGO }, async function () {
  await receitaPage.fechar()
  await aguardarJanelaFechar('[ 145 ]')
  await pausa(2000)
  await omniPage.abrirEnviarOrcamento()
  await registrarCheckpointDoSO('enviar-orcamento-tela')
  const fechou = await omniPage.confirmarEnvioDoOrcamento()
  await registrarCheckpointDoSO('apos-enviar-orcamento')
  expect(fechou).toBe(true)
})

// Lido no banco (só leitura): a mensagem do "Enviar orçamento" leva todo movimento marcado em
// `Sel` do atendimento; depois de desmarcar os antigos ela deve trazer SÓ a receita desta rodada.
Then('a mensagem enviada pelo Omni traz só o orçamento novo', { timeout: 150000 }, async function () {
  const receita = await receitaNovaDoOmni(marcoOmni, codigoDoFuncionario(env.credentials.usuario))
  const mensagem = await mensagemDoOrcamentoEnviada(marcoOmni, receita.atendimento)
  console.log(`[2.4] receita ${receita.codigo} no atendimento ${receita.atendimento}; mensagem ${mensagem.codigo} enviada`)
  expect(orcamentosDaMensagem(mensagem.texto)).toEqual([receita.codigo])
})

Then('registro o checkpoint {string} pela captura do SO', async function (nome) {
  await registrarCheckpointDoSO(nome)
})
