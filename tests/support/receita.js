import { ClientePage } from '../pages/ClientePage.js'
import { PrescritorPage } from '../pages/PrescritorPage.js'
import { ativarJanelaPrincipal, responderAvisosEmCadeia } from './appLifecycle.js'

// Passos de fluxo da receita (tela 145) compartilhados pelas suítes 2.receitas e 4.calculo.

// O `Calcular` (ou o "Não" em "Deseja calcular outra fórmula?") abre a 046 (paciente) e depois a
// 036 (prescritor), só para ESCOLHER o registro: nada é gravado nelas.
export async function escolherPacienteEPrescritor({ clienteId, prescritorCodigo }) {
  if (!clienteId || !prescritorCodigo) throw new Error('Preencha testData.clienteId e o prescritor de teste em env.json')
  const cliente = new ClientePage(driver)
  await cliente.aguardarAbrir()
  await ativarJanelaPrincipal()
  await cliente.selecionarPorCodigo(clienteId)
  // O cliente de teste dispara avisos em cadeia ("Cliente com N orçamento(s) nos últimos 30
  // dias" e "Cliente com N movimento(s) em aberto", cada um com "Deseja consultar?"), e eles
  // demoram a surgir; clicar o Fechar antes os bloqueia.
  await responderAvisosEmCadeia('Não')
  await cliente.fechar()

  const prescritor = new PrescritorPage(driver)
  await prescritor.aguardarAbrir()
  await ativarJanelaPrincipal()
  await prescritor.selecionarPorCodigo(prescritorCodigo)
  await prescritor.fecharSeAindaAberta()
}

// Único resultado objetivo do Gravar de um orçamento: o código atribuído.
export async function aguardarCodigoDaReceita(receitaPage) {
  await browser.waitUntil(async () => /^[0-9]+$/.test(await receitaPage.texto('codigoReceita')), {
    timeout: 90000,
    interval: 1000,
    timeoutMsg: 'O código da receita não foi atribuído depois do Gravar',
  })
  return receitaPage.texto('codigoReceita')
}
