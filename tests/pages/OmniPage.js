import { BasePage } from './BasePage.js'
import {
  aguardarJanelaComTitulo,
  aguardarJanelaFechar,
  clicarDuploFisico,
  clicarFisico,
  clicarFisicoNaJanelaDeTopo,
  clicarFisicoSemAtivar,
  responderJanelaDeTopoSemUia,
} from '../support/appLifecycle.js'
import { registrarCheckpointDoSO } from '../support/checkpoint.js'
import { contarPixelsEscuros } from '../support/windowsNative.js'
import { digitar, pausa, selecionarConteudoDoCampo, teclar, VK } from '../support/teclado.js'

// Omni Channel: 418 (Atendimentos), "Iniciar atendimento", detalhe do atendimento e
// "Enviar orçamento". As telas MDI do Omni FECHAM quando a sessão do driver consulta a UIA
// (AGENTS.md §4): aqui tudo é clique do SO em coordenada ABSOLUTA (1366x768 maximizada,
// medidas na exploração de 2026-10-28) + teclado, e nenhuma chamada ao driver.
const INICIAR_ATENDIMENTO = { x: 1146, y: 127 }
const FORM = {
  canal: { x: 122, y: 163 },
  grupo: { x: 900, y: 163 },
  cliente: { x: 122, y: 233 },
  celularDdd: { x: 1130, y: 233 },
  celularNumero: { x: 1190, y: 233 },
  mensagem: { x: 600, y: 400 },
  enviarMensagem: { x: 1105, y: 670 },
}
// Lista de movimentos do atendimento (418 - Detalhe): 4 linhas visíveis, passo de 18 px.
const MOVIMENTOS = {
  selX: 503,
  colunaCodigoX: 186,
  primeiraLinhaY: 547,
  passoY: 18,
  linhasVisiveis: 4,
  limiteDeLinhas: 40,
  pixelsDeCaixaMarcada: 5,
}
// Transferência pelo detalhe (2026-11-06): `...` do chat abre um popup (janela sem título);
// "Transferir atendimento" abre a 471 "Lista de Atendentes" (721x589 em 322,95) com o grupo
// atual já selecionado. Clicar numa linha da grade de atendentes troca o rodapé para
// "Transferir p/ o atendente"; a grade é owner-drawn (sem UIA): seleção por Seta para baixo.
const MENU_DO_CHAT = { x: 1258, y: 127 }
const MENU_TRANSFERIR = { x: 1256, y: 141 }
const TRANSFERENCIA = {
  titulo: 'Lista de Atendentes',
  primeiraLinha: { x: 700, y: 179 },
  transferir: { x: 952, y: 609 },
  fechar: { x: 370, y: 656 },
}
// Grade da 418 filtrada (OS 364644, exploração de 2026-11-06): `Mostrar filtros` abre o painel
// e desce a grade; com o filtro "Nome do cliente/ Telefone" a 1ª linha fica em y=360 (passo de
// 18 px). A coluna "!" (x=1300) é verde com o nº de não lidas, ou branca com "0":
// contarPixelsEscuros (raio 4) deu 55 a 63 no verde, 16 no "0" da coluna TM e 0 na linha vazia.
const GRADE = {
  mostrarFiltros: { x: 1220, y: 244 },
  atualizar: { x: 1310, y: 244 },
  filtroTelefone: { x: 1180, y: 284 },
  colunaCodigoX: 85,
  notificacaoX: 1300,
  primeiraLinhaY: 360,
  passoY: 18,
  linhasExaminadas: 10,
  pixelsDaNotificacao: 40,
}
const FECHAR_DETALHE = { x: 120, y: 669 }
const ORCAMENTO_RECEITA = { x: 990, y: 670 }
const ENVIAR_ORCAMENTO = { x: 704, y: 551 }
const ENVIAR_ORCAMENTO_CONFIRMAR = { x: 1183, y: 657 }

export class OmniPage extends BasePage {
  // O 1º clique do SO às vezes só foca o botão e a janela não abre (visto em `Iniciar
  // atendimento`, `Orçamento receita` e `Sel`, 2026-10-29): confere o título esperado e
  // clica de novo uma única vez. Só para botões que abrem janela em poucos segundos.
  async clicarAteAbrir({ x, y }, titulo) {
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      await clicarFisico(x, y)
      try {
        await aguardarJanelaComTitulo(titulo, { timeoutMs: 8000 })
        return
      } catch (erro) {
        if (tentativa === 2) throw erro
      }
    }
  }

  async aguardarAtendimentos() {
    await aguardarJanelaComTitulo('Omni Channel - Atendimentos')
    await pausa(3000)
  }

  async iniciarAtendimento({ canal, grupo, cliente, celular }) {
    await this.clicarAteAbrir(INICIAR_ATENDIMENTO, 'Iniciar atendimento')
    await pausa(2500)
    for (const [campo, valor] of [['canal', canal], ['grupo', grupo], ['cliente', cliente]]) {
      await clicarFisico(FORM[campo].x, FORM[campo].y)
      await selecionarConteudoDoCampo()
      await digitar(valor)
      await teclar(VK.TAB)
      await pausa(1500)
    }
    // Celular em 3 caixas (DDI 55 já vem; DDD de 2 dígitos; número).
    const digitos = String(celular).replace(/\D/g, '')
    await clicarFisico(FORM.celularDdd.x, FORM.celularDdd.y)
    await digitar(digitos.slice(0, 2))
    await clicarFisico(FORM.celularNumero.x, FORM.celularNumero.y)
    await digitar(digitos.slice(2))
    await clicarFisico(FORM.mensagem.x, FORM.mensagem.y)
    await digitar('Teste automatizado: orcamento via Omni')
    await pausa(500)
    await clicarFisico(FORM.enviarMensagem.x, FORM.enviarMensagem.y)
  }

  // Deixa na grade só o atendimento do telefone (quem chama garante no banco que é único).
  async filtrarPorTelefone(telefone) {
    await clicarFisico(GRADE.mostrarFiltros.x, GRADE.mostrarFiltros.y)
    await pausa(2500)
    await clicarFisico(GRADE.filtroTelefone.x, GRADE.filtroTelefone.y)
    await pausa(500)
    await digitar(String(telefone))
    await teclar(VK.ENTER)
    await pausa(3000)
  }

  async atualizarGrade() {
    await clicarFisico(GRADE.atualizar.x, GRADE.atualizar.y)
    await pausa(4000)
  }

  // y da 1ª linha da grade com o "!" verde (mensagens não lidas), ou null se nenhuma tiver.
  async linhaComNotificacaoDeNaoLidas() {
    for (let i = 0; i < GRADE.linhasExaminadas; i++) {
      const y = GRADE.primeiraLinhaY + i * GRADE.passoY
      if ((await contarPixelsEscuros(GRADE.notificacaoX, y)) >= GRADE.pixelsDaNotificacao) return y
    }
    return null
  }

  async abrirAtendimentoDaLinha(y) {
    await clicarDuploFisico(GRADE.colunaCodigoX, y)
    await this.aguardarDetalhe()
  }

  // O 1º clique às vezes não pega (visto em 2026-11-06): confere pelo título e clica de novo 1x.
  async fecharDetalhe() {
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      await clicarFisico(FECHAR_DETALHE.x, FECHAR_DETALHE.y)
      if (await aguardarJanelaFechar('Atendimentos - Detalhe', { timeoutMs: 8000 })) {
        await pausa(1500)
        return
      }
    }
    throw new Error('O detalhe do atendimento (418 - Detalhe) não fechou depois de 2 cliques em Fechar')
  }

  async aguardarDetalhe() {
    await aguardarJanelaComTitulo('Atendimentos - Detalhe')
    await pausa(3000)
  }

  // A mensagem do orçamento leva TODOS os movimentos marcados em `Sel` do atendimento, e as
  // marcações voltam ao abrir o atendimento (cada rodada deixa mais uma receita). Desce a grade
  // linha a linha (Seta para baixo; a grade rola e o cursor fica na última linha visível) e
  // desmarca cada caixa marcada. A leitura é por pixel e o clique é conferido: o 1º clique
  // às vezes é ignorado. É idempotente: passar do fim da lista só reexamina a última linha.
  async desmarcarMovimentosExistentes() {
    await clicarFisico(MOVIMENTOS.colunaCodigoX, MOVIMENTOS.primeiraLinhaY)
    for (let i = 0; i < MOVIMENTOS.limiteDeLinhas; i++) {
      const y = MOVIMENTOS.primeiraLinhaY + Math.min(i, MOVIMENTOS.linhasVisiveis - 1) * MOVIMENTOS.passoY
      await this.desmarcarCaixaSel(y)
      await teclar(VK.DOWN)
      await pausa(150)
    }
  }

  async caixaSelMarcada(y) {
    return (await contarPixelsEscuros(MOVIMENTOS.selX, y)) >= MOVIMENTOS.pixelsDeCaixaMarcada
  }

  async desmarcarCaixaSel(y) {
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      if (!(await this.caixaSelMarcada(y))) return
      await clicarFisico(MOVIMENTOS.selX, y)
      await pausa(700)
    }
    if (await this.caixaSelMarcada(y)) throw new Error(`Caixa Sel em y=${y} continua marcada depois de 3 cliques`)
  }

  // Transfere o atendimento aberto no detalhe para o atendente na `posicao` (base 0) da grade
  // da 471 (calculada no banco: `posicaoNaListaDeTransferencia`). Quem chama confere no banco
  // que a transferência valeu (a grade não tem leitura de texto sem UIA).
  async transferirAtendimento(posicao) {
    await clicarFisico(MENU_DO_CHAT.x, MENU_DO_CHAT.y)
    await pausa(1200)
    // O popup some se a principal for reativada: clique sem ativar.
    await clicarFisicoSemAtivar(MENU_TRANSFERIR.x, MENU_TRANSFERIR.y)
    await aguardarJanelaComTitulo(TRANSFERENCIA.titulo)
    await pausa(2500)
    await clicarFisicoNaJanelaDeTopo(TRANSFERENCIA.titulo, TRANSFERENCIA.primeiraLinha.x, TRANSFERENCIA.primeiraLinha.y)
    await pausa(600)
    for (let i = 0; i < posicao; i++) {
      await teclar(VK.DOWN)
      await pausa(120)
    }
    await pausa(600)
    await registrarCheckpointDoSO('transferencia-atendente-escolhido')
    await clicarFisicoNaJanelaDeTopo(TRANSFERENCIA.titulo, TRANSFERENCIA.transferir.x, TRANSFERENCIA.transferir.y)
    // Confirmação "Confirma a transferência do atendimento…?": layout do "Atenção" (Sim/Não),
    // a conferir na 1ª rodada ao vivo (captura `transferencia-confirmada`).
    await responderJanelaDeTopoSemUia('Atenção', 'Sim', { timeoutMs: 15000 })
    await pausa(2000)
    await registrarCheckpointDoSO('transferencia-confirmada')
    if (!(await aguardarJanelaFechar(TRANSFERENCIA.titulo, { timeoutMs: 10000 }))) {
      await clicarFisicoNaJanelaDeTopo(TRANSFERENCIA.titulo, TRANSFERENCIA.fechar.x, TRANSFERENCIA.fechar.y)
      await aguardarJanelaFechar(TRANSFERENCIA.titulo, { timeoutMs: 10000 })
    }
    await pausa(2000)
  }

  async abrirOrcamentoReceita() {
    await this.clicarAteAbrir(ORCAMENTO_RECEITA, '[ 145 ]')
  }

  async abrirEnviarOrcamento() {
    await this.clicarAteAbrir(ENVIAR_ORCAMENTO, 'Enviar orçamento')
    await pausa(2500)
  }

  async confirmarEnvioDoOrcamento() {
    await clicarFisicoNaJanelaDeTopo('Enviar orçamento', ENVIAR_ORCAMENTO_CONFIRMAR.x, ENVIAR_ORCAMENTO_CONFIRMAR.y)
    // O envio demora (anexa a imagem padrão): 20 s não bastaram; o chat atualiza depois.
    const fechou = await aguardarJanelaFechar('Enviar orçamento', { timeoutMs: 90000 })
    await pausa(8000)
    return fechou
  }
}
