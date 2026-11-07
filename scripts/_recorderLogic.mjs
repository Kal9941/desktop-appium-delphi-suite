// Lógica pura do gravador de sessão guiada (sem E/S, sem PowerShell): regras de
// privacidade, de UIA por tela, agrupamento de teclas e resumo da gravação.
// Fica separada da captura nativa (`_recorderNative.mjs`) para ser testável por
// unidade — a parte nativa só se valida ao vivo (ver a spec do gravador).

// Janelas em que NENHUMA tecla pode sair do processo do gravador (senha).
export const TITULOS_SEM_TECLAS = ['Login']

const LACUNA_PADRAO_MS = 1500

// `Tf<MÓDULO>_<nº>` (ex.: `TfSIS_145`) → '145'. O app real usa zeros à esquerda
// na classe (`TfSIS_0145`, achado da calibração): normaliza para a notação do
// projeto, no mínimo 3 dígitos ('145', '007', '046'). Classes de tela sem número
// (`TfUTI_PES`) e controles comuns (`TBitBtn`) não têm número de tela.
export function extrairNumeroTela(classe) {
  const casou = /^Tf[A-Za-z0-9]+_(\d{1,4})$/.exec(classe)
  return casou ? String(Number(casou[1])).padStart(3, '0') : null
}

// UIA só em tela comprovadamente segura: algumas telas MDI (278, Omni/418)
// se fecham com qualquer chamada UIA. Sem número de tela, nunca.
export function telaPermiteUia(numeroTela, telasSeguras) {
  if (numeroTela === null) return false
  return telasSeguras.includes(numeroTela)
}

// Esc, Enter, Tab e Backspace chegam do Windows como caractere de controle
// (`ToUnicodeEx` devolve "\u001b", "\r"...): são tecla, nunca texto digitado.
function ehTextoAgrupavel(evento) {
  const { caractere, modificadores } = evento.tecla
  if (caractere === null || /[\u0000-\u001f\u007f]/.test(caractere)) return false
  return !modificadores.includes('ctrl') && !modificadores.includes('alt')
}

// Junta teclas imprimíveis consecutivas (mesma janela, lacuna curta) num único
// evento `texto`; qualquer outra tecla passa adiante como `tecla` e fecha o grupo.
export function agruparTeclas(eventos, { lacunaMs = LACUNA_PADRAO_MS } = {}) {
  const saida = []
  let grupo = null

  const fecharGrupo = () => {
    if (grupo) saida.push(grupo)
    grupo = null
  }

  for (const evento of eventos) {
    if (!ehTextoAgrupavel(evento)) {
      fecharGrupo()
      saida.push(evento)
      continue
    }
    const continuaGrupo =
      grupo && grupo.janela === evento.janela && evento.t - grupo.tFim <= lacunaMs
    if (continuaGrupo) {
      grupo.texto += evento.tecla.caractere
      grupo.tFim = evento.t
    } else {
      fecharGrupo()
      grupo = {
        seq: evento.seq,
        t: evento.t,
        tFim: evento.t,
        tipo: 'texto',
        texto: evento.tecla.caractere,
        janela: evento.janela,
      }
    }
  }
  fecharGrupo()
  return saida
}

// Descobre a tela de um evento: primeira classe `Tf<MÓDULO>_<nº>` subindo do
// controle clicado até a janela de topo; sem clique (checkpoint, tecla de
// navegação), usa as classes das janelas visíveis do app, na ordem em que o
// nativo as enviou (a mais "de cima" primeiro).
export function resolverTela(bruto) {
  const candidatas = [bruto.alvo, ...(bruto.cadeia || []), bruto.janelaTopo]
    .filter(Boolean)
    .map((janela) => janela.classe)
    .concat(bruto.classesVisiveis || [])
  let numero = null
  for (const classe of candidatas) {
    numero = extrairNumeroTela(classe)
    if (numero) break
  }
  const titulo = bruto.janelaTopo ? bruto.janelaTopo.titulo : bruto.foco ? bruto.foco.titulo : ''
  return { numero, titulo }
}

// Avisos que dizem ao agente quão confiável é o alvo do evento. `owner-drawn` é
// heurística (grid sem legenda); refinar na gravação de calibração.
export function calcularAvisos({ alvo, uiaPulado }) {
  const avisos = []
  if (uiaPulado) avisos.push('uia-pulado-tela-nao-segura')
  if (alvo.titulo === '') {
    avisos.push('sem-legenda')
    if (/grid/i.test(alvo.classe)) avisos.push('owner-drawn')
  }
  return avisos
}

// Lê um trace JSONL tolerando linha truncada (queda no meio da gravação).
export function lerTrace(texto) {
  const eventos = []
  let linhasInvalidas = 0
  for (const linha of texto.split(/\r?\n/)) {
    if (linha.trim() === '') continue
    try {
      eventos.push(JSON.parse(linha))
    } catch {
      linhasInvalidas++
    }
  }
  return { eventos, linhasInvalidas }
}

function tituloDaTela(tela) {
  const numero = tela && tela.numero ? tela.numero : null
  const titulo = tela && tela.titulo ? tela.titulo : ''
  if (numero) return `Tela ${numero}${titulo ? ` — ${titulo}` : ''}`
  return `Tela sem número${titulo ? ` — ${titulo}` : ''}`
}

// As coordenadas vão sempre: item de menu e grid owner-drawn só se identificam
// pela posição (o menu nativo cai na janela principal, que tem legenda).
function descreverAlvo(evento) {
  const alvo = evento.alvo || { classe: '?', titulo: '' }
  const posicao = `em (${evento.rx},${evento.ry})`
  // A legenda Win32 traz o atalho do Delphi ("&Gravar"); o Name do UIA vem sem
  // ele ("Gravar"). O resumo mostra a forma do UIA para não induzir seletor errado
  // (o trace mantém a legenda original).
  const legenda = alvo.titulo.replace(/&(?!&)/g, '')
  if (legenda) return `"${legenda}" (${alvo.classe}) ${posicao}`
  return `sem legenda (${alvo.classe}) ${posicao}`
}

function descreverEvento(evento, notas) {
  switch (evento.tipo) {
    case 'clique':
    case 'duplo':
    case 'direito':
      return `${evento.tipo} ${descreverAlvo(evento)}`
    case 'texto':
      return `digitou "${evento.texto}"`
    case 'tecla': {
      const mods = (evento.tecla.modificadores || []).concat(evento.tecla.nome)
      return `tecla ${mods.join('+')}`
    }
    case 'checkpoint': {
      const nota = notas.get(evento.seq)
      return nota ? `**CHECKPOINT**: ${nota}` : '**CHECKPOINT** (sem anotação)'
    }
    case 'janela':
      return `janela "${evento.tela ? evento.tela.titulo : ''}"`
    default:
      return evento.tipo
  }
}

// Resumo em Markdown para o agente ler no lugar do trace bruto: eventos
// consecutivos agrupados por tela, com notas anexadas ao checkpoint.
export function montarResumo(eventos) {
  const cabecalho = '# Resumo da gravação\n\n'
  const notas = new Map()
  for (const evento of eventos) {
    if (evento.tipo === 'nota') notas.set(evento.ref, evento.texto)
  }
  const principais = eventos.filter((evento) => evento.tipo !== 'nota')
  if (principais.length === 0) {
    return `${cabecalho}Gravação vazia: nenhum evento registrado.\n`
  }

  const checkpoints = principais.filter((evento) => evento.tipo === 'checkpoint').length
  const linhas = [`${cabecalho}Eventos: ${principais.length} (checkpoints: ${checkpoints})\n`]
  let tituloAtual = null
  for (const evento of principais) {
    const titulo = tituloDaTela(evento.tela)
    if (titulo !== tituloAtual) {
      linhas.push(`\n## ${titulo}\n`)
      tituloAtual = titulo
    }
    const avisos = evento.avisos && evento.avisos.length > 0 ? ` [${evento.avisos.join(', ')}]` : ''
    // O que o UIA devolveu é o que o agente usa para escolher Name/ClassName do seletor.
    const uia = evento.uia
      ? ` · UIA name="${evento.uia.name}" ${String(evento.uia.controlType).replace('ControlType.', '')}`
      : ''
    linhas.push(`- #${evento.seq} ${descreverEvento(evento, notas)}${uia}${avisos}`)
  }
  return `${linhas.join('\n')}\n`
}

// Decide, pela saída do `tasklist`, se o processo do app está rodando — para
// falhar cedo, antes de instalar qualquer hook, com o PS01 fechado.
export function ps01EmExecucao(saidaTasklist, nomeProcesso) {
  const nome = nomeProcesso.toLowerCase()
  return saidaTasklist
    .split(/\r?\n/)
    .some((linha) => linha.trim().toLowerCase().startsWith(nome))
}
