import {
  killProcessByName,
  spawnApp,
  waitForWindow,
  listVisibleWindowsForProcess,
  activateWindow,
  physicalClick,
  physicalDoubleClick,
  physicalRightClick,
} from './windowsNative.js'
import { AUTOMATION_NAME } from './driverConfig.js'
import { appendFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { getSessionLabel } from './sessionLabel.js'
import { registrarCheckpointDoSO } from './checkpoint.js'

// A tela de login é uma janela de topo SEPARADA da janela principal (não um
// filho dela) — ver PENDÊNCIA em tests/pages/LoginPage.js. Por isso a sessão
// Appium precisa ser re-anexada (`appium:appTopLevelWindow`) a cada transição
// de tela: login → (opcional: diálogo "Atenção" de reconexão) → tela principal.
const BASE_CAPS = {
  platformName: 'Windows',
  'appium:automationName': AUTOMATION_NAME,
  'appium:newCommandTimeout': 120,
}

let currentPid = null

export function getCurrentAppPid() {
  return currentPid
}

// Isolamento de estado: processo novo por teste. Mata qualquer instância
// anterior antes de abrir uma nova — ver .agents/PROJECT_CONTEXT.md.
// PENDÊNCIA: matar via taskkill /F é um hard-kill; se o app não encerrar a
// sessão no Firebird de forma limpa, a próxima tentativa de login pode cair
// no diálogo "Atenção: usuário já está conectado ao banco de dados" (tratado
// por confirmReconnectDialogIfPresent).
//
// `[R-RESIL]`: sob carga cumulativa da VM (vários lançamentos pesados em
// sequência — achado 2026-10-09, ver AGENTS.md §4), a janela "Login" às vezes
// não aparece dentro do timeout mesmo com o processo abrindo normalmente —
// não é um bug do app, é o SO atrasado pra renderizar. Em vez de só
// documentar "espere uns segundos" como prática manual, a tentativa aqui mata
// e relança uma vez automaticamente antes de desistir. Isso NÃO mascara uma
// falha real do app: se o app estiver genuinamente quebrado, a 2ª tentativa
// falha do mesmo jeito e o erro original sobe normalmente.
const LOGIN_LAUNCH_ATTEMPTS = 2

export async function launchAndAttachToLogin(executablePath, processName) {
  let lastError
  for (let attempt = 1; attempt <= LOGIN_LAUNCH_ATTEMPTS; attempt++) {
    killProcessByName(processName)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    currentPid = spawnApp(executablePath)
    iniciarVigiaDeDialogos()
    try {
      const loginWindow = await waitForWindow(currentPid, (w) => w.title === 'Login' && w.width > 0)
      await driver.reloadSession({ ...BASE_CAPS, 'appium:appTopLevelWindow': loginWindow.handle })
      return
    } catch (error) {
      lastError = error
      if (attempt < LOGIN_LAUNCH_ATTEMPTS) {
        console.warn(
          `[R-RESIL] Janela de Login não apareceu na tentativa ${attempt}/${LOGIN_LAUNCH_ATTEMPTS} ` +
            `(provável lentidão transitória da VM) — matando e relançando antes de desistir.`
        )
      }
    }
  }
  throw lastError
}

// O diálogo "Atenção: usuário já está conectado" (ver PENDÊNCIA acima) pode
// aparecer a qualquer momento entre o clique em "Conectar" e a tela principal
// abrir — nunca em um instante fixo. Por isso um único loop trata as duas
// janelas possíveis (diálogo ou tela principal) até a tela principal aparecer
// ou o prazo esgotar, em vez de duas esperas com prazos fixos e desencontrados.
// Retorna `true`/`false`: viu (e confirmou) o diálogo de reconexão pelo
// menos uma vez nesse login — usado pelo teste de reconexão (ver
// `1.login.feature` #1.3) pra provar que o aviso realmente apareceu, não só
// tolerar silenciosamente a presença dele.
export async function proceedPastLoginToMainWindow({ timeoutMs = 25000, intervalMs = 300 } = {}) {
  const deadline = Date.now() + timeoutMs
  let lastSeen = []
  let reconnectDialogShown = false

  while (Date.now() < deadline) {
    lastSeen = await listVisibleWindowsForProcess(currentPid)

    // PRIORIDADE: o diálogo "Atenção" pode aparecer sobreposto à janela
    // principal (já visível, ainda "desconectada") em vez de antes dela — se
    // não checarmos o diálogo primeiro, anexamos à tela principal cedo demais
    // e o login nunca termina de fato. Só aceitamos a janela principal quando
    // não há diálogo pendente.
    const dialog = lastSeen.find((w) => w.title === 'Atenção')
    if (dialog) {
      reconnectDialogShown = true
      await driver.reloadSession({ ...BASE_CAPS, 'appium:appTopLevelWindow': dialog.handle })
      await driver.$('//Button[@Name="Sim"]').click()
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
      continue
    }

    const mainWindow = lastSeen.find(
      (w) => w.title === 'SisPS - Soluções Inteligentes' && w.width > 500
    )
    if (mainWindow) {
      // "Settle": o diálogo "Atenção" às vezes aparece só DEPOIS da janela
      // principal já estar visível (sobreposto a ela), não antes — então ver
      // a janela principal uma vez não basta. Achado (exploração de telas,
      // 2026-10-08): um único recheck de 1s não é suficiente — em runs reais
      // o diálogo chegou a aparecer só uns 2-3s depois da janela principal já
      // visível, produzindo falso-positivo de "login ok" com o diálogo ainda
      // escondido atrás. Espera uma janela de silêncio de 4s inteira sem
      // diálogo (não só um recheck pontual) antes de aceitar.
      const QUIET_MS = 4000
      const quietDeadline = Date.now() + QUIET_MS
      let dialogAppeared = false
      while (Date.now() < quietDeadline) {
        await new Promise((resolve) => setTimeout(resolve, 400))
        const recheck = await listVisibleWindowsForProcess(currentPid)
        if (recheck.some((w) => w.title === 'Atenção')) {
          dialogAppeared = true
          reconnectDialogShown = true
          break
        }
      }
      if (dialogAppeared) continue
      await driver.reloadSession({ ...BASE_CAPS, 'appium:appTopLevelWindow': mainWindow.handle })
      await new Promise((resolve) => setTimeout(resolve, 500))
      return reconnectDialogShown
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error(
    `Tela principal não apareceu em ${timeoutMs}ms. Janelas visíveis no momento: ${JSON.stringify(lastSeen)}`
  )
}

// Clicar "Logout" (ver MainPage.logout) abre uma nova janela de topo "Login"
// (mesmo título/formato da inicial) enquanto a janela principal continua viva
// em segundo plano, só sem foco — confirmado por inspeção ao vivo
// (2026-10-09). Diferente do login inicial, aqui não existe diálogo
// "Atenção" nesse caminho (é logout limpo, não reconexão após hard-kill), um
// único `waitForWindow` basta.
export async function waitForLogoutReturnToLogin({ timeoutMs = 10000 } = {}) {
  const loginWindow = await waitForWindow(
    currentPid,
    (w) => w.title === 'Login' && w.width > 0,
    { timeoutMs }
  )
  await driver.reloadSession({ ...BASE_CAPS, 'appium:appTopLevelWindow': loginWindow.handle })
}

// Clicar o ícone de teclado virtual (ver LoginPage.abrirTecladoVirtual) abre
// uma nova janela de topo "Teclado alfanumérico", sempre no mesmo processo —
// nunca aparece diálogo "Atenção" nesse caminho (não é reconexão), um único
// `waitForWindow` basta.
export async function waitForTecladoVirtualWindow({ timeoutMs = 10000 } = {}) {
  const tecladoWindow = await waitForWindow(
    currentPid,
    (w) => w.title === 'Teclado alfanumérico' && w.width > 0,
    { timeoutMs }
  )
  await driver.reloadSession({ ...BASE_CAPS, 'appium:appTopLevelWindow': tecladoWindow.handle })
}

// Fechar o teclado virtual (TecladoVirtualPage.confirmar) não abre janela
// nova — a de Login continua a mesma de antes, só precisa reanexar a sessão
// de volta a ela (presa na janela do teclado, que já fechou).
export async function reattachToLoginWindow({ timeoutMs = 10000 } = {}) {
  const loginWindow = await waitForWindow(
    currentPid,
    (w) => w.title === 'Login' && w.width > 0,
    { timeoutMs }
  )
  await driver.reloadSession({ ...BASE_CAPS, 'appium:appTopLevelWindow': loginWindow.handle })
}

// Diálogos "Atenção" (TfSIS_MSG) e buscas "Localizar registro..." são janelas de
// topo, fora da árvore da janela principal: a sessão precisa ser reanexada a
// elas para clicar no botão e, depois, de volta à principal (ver PROJECT_CONTEXT).
export async function reattachToMainWindow({ timeoutMs = 10000 } = {}) {
  const mainWindow = await waitForWindow(
    currentPid,
    (w) => w.title === 'SisPS - Soluções Inteligentes' && w.width > 500,
    { timeoutMs }
  )
  await driver.reloadSession({ ...BASE_CAPS, 'appium:appTopLevelWindow': mainWindow.handle })
  // Diálogos tiram o foco da principal; os cliques do SO seguintes precisam dela ativa.
  await activateWindow(mainWindow.handle)
}

// Registra a mensagem de cada janela de topo respondida (principalmente os "Atenção"):
// console (aparece no log do wdio) + `tests/reports/<sessão>/atencoes.jsonl`, uma linha por
// diálogo, na ordem em que surgiram. Serve para provar o que o app disse antes de o botão
// ser clicado (um "Sim" às cegas já escondeu avisos de que o operador não sabia).
function gravarLinhaDeAtencao(linha) {
  try {
    const pasta = path.resolve('tests', 'reports', getSessionLabel())
    mkdirSync(pasta, { recursive: true })
    appendFileSync(path.join(pasta, 'atencoes.jsonl'), `${JSON.stringify(linha)}\n`, 'utf8')
  } catch (error) {
    // O registro é só diagnóstico: nunca derruba o cenário.
    console.warn(`Não foi possível gravar atencoes.jsonl: ${error.message}`)
  }
}

function registrarMensagemDeJanela(titulo, botao, mensagem) {
  console.log(`[${titulo}] botão "${botao}": ${mensagem || '(sem texto)'}`)
  gravarLinhaDeAtencao({ em: new Date().toISOString(), janela: titulo, botao, mensagem })
}

// Vigia de diálogos INESPERADOS: o registro acima só cobre o que o teste responde. Um aviso que o
// app abre sozinho e que ninguém responde (ex.: "lote sem saldo", "baixa já registrada") passava
// batido: o cenário seguia e a captura final só o mostrava por acaso. A vigia consulta as janelas
// do app (Win32, sem UIA) a cada segundo e, quando um diálogo fica aberto por mais de
// `VIGIA_PERSISTE_MS` sem o teste estar respondendo um, grava uma linha `inesperado: true` em
// `atencoes.jsonl` e uma captura do SO (`atencao-inesperada`), além de um aviso no console. Só
// registra: o texto do aviso está na captura (ler o texto exigiria UIA, que fecha telas MDI).
const VIGIA_INTERVALO_MS = 1000
const VIGIA_PERSISTE_MS = 6000
let vigia = null
let vigiaConsultando = false
let respondendoJanela = 0
let dialogosVistos = new Map()

function ehDialogo(janela) {
  return janela.width > 0 && (janela.title === 'Atenção' || (janela.title === 'SisPS - Soluções Inteligentes' && janela.width < 1000))
}

async function vigiarDialogosUmaVez() {
  if (vigiaConsultando || !currentPid) return
  vigiaConsultando = true
  try {
    const agora = Date.now()
    const abertos = (await listVisibleWindowsForProcess(currentPid)).filter(ehDialogo)
    const handles = new Set(abertos.map((w) => w.handle))
    for (const handle of dialogosVistos.keys()) if (!handles.has(handle)) dialogosVistos.delete(handle)
    for (const janela of abertos) {
      const visto = dialogosVistos.get(janela.handle) ?? { desde: agora, registrado: false }
      // O teste está respondendo um diálogo agora: conta o tempo a partir do fim da resposta.
      if (respondendoJanela > 0) visto.desde = agora
      dialogosVistos.set(janela.handle, visto)
      if (visto.registrado || agora - visto.desde < VIGIA_PERSISTE_MS) continue
      visto.registrado = true
      let captura = ''
      try {
        captura = await registrarCheckpointDoSO('atencao-inesperada')
      } catch (error) {
        captura = `(captura falhou: ${error.message})`
      }
      console.warn(`[vigia] diálogo "${janela.title}" aberto há mais de ${VIGIA_PERSISTE_MS / 1000}s sem resposta do teste. Captura: ${captura}`)
      gravarLinhaDeAtencao({ em: new Date().toISOString(), janela: janela.title, inesperado: true, handle: janela.handle, captura })
    }
  } catch {
    // Consulta falhou (VM lenta, processo encerrando): a vigia nunca derruba o cenário.
  } finally {
    vigiaConsultando = false
  }
}

export function iniciarVigiaDeDialogos() {
  pararVigiaDeDialogos()
  vigia = setInterval(vigiarDialogosUmaVez, VIGIA_INTERVALO_MS)
  vigia.unref()
}

export function pararVigiaDeDialogos() {
  if (vigia) clearInterval(vigia)
  vigia = null
  dialogosVistos = new Map()
  respondendoJanela = 0
}

// Reanexa a sessão a uma janela de topo (pelo título), lê os textos dela, clica no
// botão pedido (`Name` UIA sem o `&`) e volta à janela principal. Devolve o texto.
export async function responderJanelaDeTopo(titulo, botao, opcoes) {
  respondendoJanela += 1
  try {
    return await lerEResponderJanelaDeTopo(titulo, botao, opcoes)
  } finally {
    respondendoJanela -= 1
  }
}

async function lerEResponderJanelaDeTopo(titulo, botao, { timeoutMs = 10000 } = {}) {
  const janela = await waitForWindow(currentPid, (w) => w.title === titulo && w.width > 0, { timeoutMs })
  await driver.reloadSession({ ...BASE_CAPS, 'appium:appTopLevelWindow': janela.handle })
  // A mensagem do "Atenção" mora num TJPsRichEdit (Document); janelas sem ele
  // (ex.: "Tratamento de uso contínuo") devolvem texto vazio.
  const rich = await driver.findElement('class name', 'TJPsRichEdit')
  const mensagem = rich.error ? '' : await driver.getElementText(Object.values(rich)[0])
  // `botao` pode ser o nome do botão ou uma função (mensagem) => [nomes em ordem de preferência]:
  // usa o 1º que existir na janela (ex.: "Ok" num aviso, "Não" em "calcular outra fórmula?").
  const candidatos = typeof botao === 'function' ? botao(mensagem) : [botao]
  let alvo = { error: true }
  let escolhido = candidatos[0]
  for (const nome of candidatos) {
    alvo = await driver.findElement('name', nome)
    escolhido = nome
    if (!alvo.error) break
  }
  registrarMensagemDeJanela(titulo, escolhido, mensagem)
  // O clique do driver erra o alvo nestas janelas de topo (o ponteiro cai fora do
  // botão, validado 2026-10-28): clique de mouse do SO no centro do botão =
  // canto da janela (Win32) + retângulo do elemento (UIA, relativo à janela).
  if (alvo.error) throw new Error(`Botão "${candidatos.join('/')}" não encontrado na janela "${titulo}"`)
  const { x, y, width, height } = await driver.getElementRect(Object.values(alvo)[0])
  // A janela muda de lugar logo depois de aberta (visto: top 215 → 245): o canto é relido
  // imediatamente antes de cada clique, nunca o da primeira leitura.
  await clicarAteFecharJanela(janela.handle, (atual) => ({ x: atual.left + x + Math.round(width / 2), y: atual.top + y + Math.round(height / 2) }), `${titulo} > ${escolhido}`)
  await reattachToMainWindow()
  return mensagem
}

// Logo depois de aberta, a janela de topo ainda não responde e o clique pode se perder
// (2026-11-06, 2.1: o "Fechar" do "Tratamento de uso contínuo" não pegou, a janela ficou
// aberta e o "Deseja calcular outra fórmula?" nunca veio). Confere que a MESMA janela
// (handle) fechou e, se não, clica de novo 1x. Um "Atenção" novo que surja em seguida tem
// outro handle e não conta. Só serve para botões que fecham a janela (Sim/Não/Ok/Fechar).
const PRAZO_PARA_JANELA_FECHAR_MS = 3000

async function janelaPorHandle(handle) {
  return (await listVisibleWindowsForProcess(currentPid)).find((w) => w.handle === handle && w.width > 0)
}

async function janelaSeguiuAberta(handle, prazoMs) {
  const limite = Date.now() + prazoMs
  while (Date.now() < limite) {
    if (!(await janelaPorHandle(handle))) return false
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return true
}

async function clicarAteFecharJanela(handle, pontoDoBotao, rotulo) {
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    const atual = await janelaPorHandle(handle)
    if (!atual) return
    await activateWindow(atual.handle)
    const { x, y } = pontoDoBotao(atual)
    await physicalClick(x, y)
    if (!(await janelaSeguiuAberta(handle, PRAZO_PARA_JANELA_FECHAR_MS))) return
    console.warn(`[janela de topo] "${rotulo}" seguiu aberta depois do clique ${tentativa} de 2${tentativa === 1 ? ': repetindo' : ''}`)
  }
}

// Diálogos "Atenção" (`TfSIS_MSG`): botões Sim, Não, Ok.
export function responderDialogoAtencao(botao, opcoes) {
  return responderJanelaDeTopo('Atenção', botao, opcoes)
}


// Responde um "Atenção" só se ele aparecer dentro do prazo (avisos condicionais do
// app, ex.: "Cliente com N orçamento(s)... Deseja consultar?"). Devolve a mensagem
// ou `null` quando nenhum diálogo surgiu.
export async function responderDialogoAtencaoSeAparecer(botao, { timeoutMs = 4000 } = {}) {
  try {
    return await responderDialogoAtencao(botao, { timeoutMs })
  } catch (error) {
    if (String(error.message).startsWith('Nenhuma janela correspondente')) return null
    throw error
  }
}

// Ativa a janela principal (Win32): o clique do SO e o `windows: keys` só atingem o app
// se ele estiver em primeiro plano.
export async function ativarJanelaPrincipal() {
  const mainWindow = await waitForWindow(
    currentPid,
    (w) => w.title === 'SisPS - Soluções Inteligentes' && w.width > 500
  )
  await activateWindow(mainWindow.handle)
}

// Reativa a janela principal a cada clique: o foco escapa sozinho (visto: sem isso um
// campo ficou sem foco e o texto seguinte caiu no Código da receita).
export async function clicarFisico(x, y) {
  await ativarJanelaPrincipal()
  await physicalClick(x, y)
}

// Duplo clique e botão direito do SO, com a janela principal ativa (grades de "Localizar
// registro..." e menu de contexto da grade de estoque da 112).
export async function clicarDuploFisico(x, y) {
  await ativarJanelaPrincipal()
  await physicalDoubleClick(x, y)
}

export async function clicarDireitoFisico(x, y) {
  await ativarJanelaPrincipal()
  await physicalRightClick(x, y)
}

// Clique do SO SEM reativar a janela principal: itens de menu de contexto (`#32768`) somem
// se a principal for reativada antes do clique.
export async function clicarFisicoSemAtivar(x, y) {
  await physicalClick(x, y)
}

// Espera por título via Win32 (milissegundos), em vez de XPath no driver (6 a 20 s por
// busca, e o waitForDisplayed repete a busca). Telas MDI também aparecem na lista.
export async function aguardarJanelaComTitulo(trecho, { timeoutMs = 30000 } = {}) {
  return waitForWindow(currentPid, (w) => w.title.includes(trecho) && w.width > 0, { timeoutMs })
}

export async function janelaComTituloAberta(trecho) {
  const janelas = await listVisibleWindowsForProcess(currentPid)
  return janelas.some((w) => w.title.includes(trecho) && w.width > 0)
}

export async function aguardarJanelaFechar(trecho, { timeoutMs = 10000 } = {}) {
  const limite = Date.now() + timeoutMs
  while (Date.now() < limite) {
    if (!(await janelaComTituloAberta(trecho))) return true
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return false
}

// Diálogos que não deveriam existir (ex.: "data inválida", visto no 2.2): a janela de
// erro tem o título da principal mas é pequena; "Atenção" idem. Checagem Win32, em ms.
export async function listarDialogosAbertos() {
  const janelas = await listVisibleWindowsForProcess(currentPid)
  return janelas
    .filter((w) => w.width > 0 && (w.title === 'Atenção' || (w.title === 'SisPS - Soluções Inteligentes' && w.width < 1000)))
    .map((w) => w.title)
}

// Responde em cadeia todos os "Atenção" que forem surgindo (avisos condicionais do app,
// ex.: um após o outro ao carregar um cliente com orçamentos e movimentos em aberto).
// Espera até `primeiroTimeoutMs` pelo 1º e `seguinteTimeoutMs` por cada novo; devolve as
// mensagens respondidas (vazio se nenhum apareceu).
export async function responderAvisosEmCadeia(botao, { primeiroTimeoutMs = 20000, seguinteTimeoutMs = 5000 } = {}) {
  const mensagens = []
  let prazo = primeiroTimeoutMs
  for (;;) {
    const mensagem = await responderDialogoAtencaoSeAparecer(botao, { timeoutMs: prazo })
    if (mensagem === null) return mensagens
    mensagens.push(mensagem)
    prazo = seguinteTimeoutMs
  }
}

// Respostas a diálogos de topo SEM consultar a UIA (nas telas do Omni, qualquer consulta da
// sessão fecha a MDI). O botão é clicado pelo mouse do SO no deslocamento conhecido a partir
// do canto da janela (Win32, relido no momento do clique). Deslocamentos medidos em 2026-10-28:
// "Atenção" (560x181): Sim (409,149), Não (501,149); "Tratamento de uso contínuo": Fechar (38,263).
const BOTOES_SEM_UIA = {
  Atenção: { Sim: { dx: 409, dy: 149 }, Não: { dx: 501, dy: 149 } },
  'Tratamento de uso contínuo': { Fechar: { dx: 38, dy: 263 } },
}

export async function responderJanelaDeTopoSemUia(titulo, botao, opcoes) {
  respondendoJanela += 1
  try {
    await clicarEmJanelaDeTopoSemUia(titulo, botao, opcoes)
  } finally {
    respondendoJanela -= 1
  }
}

async function clicarEmJanelaDeTopoSemUia(titulo, botao, { timeoutMs = 30000 } = {}) {
  const deslocamento = BOTOES_SEM_UIA[titulo]?.[botao]
  if (!deslocamento) throw new Error(`Sem deslocamento conhecido para "${botao}" em "${titulo}"`)
  const janela = await waitForWindow(currentPid, (w) => w.title === titulo && w.width > 0, { timeoutMs })
  // A janela se move e só passa a responder uns 2 s depois de abrir (no caminho com UIA, a
  // reanexação da sessão já consumia esse tempo; com 0,6 s o clique em Fechar não pegou).
  await new Promise((resolve) => setTimeout(resolve, 2000))
  const atual = (await listVisibleWindowsForProcess(currentPid)).find((w) => w.handle === janela.handle)
  await activateWindow(atual.handle)
  await physicalClick(atual.left + deslocamento.dx, atual.top + deslocamento.dy)
  await new Promise((resolve) => setTimeout(resolve, 600))
}

// Clique do SO em coordenada ABSOLUTA dentro de uma janela de topo/popup (ex.: "Enviar
// orçamento"): ativa a PRÓPRIA janela antes (o clicarFisico ativa a principal e o botão do
// popup não recebe o clique).
export async function clicarFisicoNaJanelaDeTopo(titulo, x, y) {
  const janela = await waitForWindow(currentPid, (w) => w.title === titulo && w.width > 0)
  await activateWindow(janela.handle)
  await physicalClick(x, y)
}
