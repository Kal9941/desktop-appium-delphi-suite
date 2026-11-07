import { consultar } from './conexao.js'

// Leituras SOMENTE LEITURA para a asserção do 2.4 (orçamento enviado pelo Omni Channel).
// As telas do Omni fecham com qualquer consulta UIA, então o que foi enviado se confere no
// banco: a receita nova (ATENDIMENTO_A1 com CODIGO_OC_ATENDIMENTO) e a mensagem do orçamento
// (OC_ATENDIMENTO_MSG, TIPO 1 = enviada pela loja). Sem relógio: o "antes" é o maior código
// de cada tabela no início do cenário (os códigos crescem), o que também ignora o que outras
// pessoas gravarem no banco de homologação, junto com o filtro pelo funcionário da suíte.

const PRAZO_DA_MENSAGEM_MS = 90000
const INTERVALO_DE_LEITURA_MS = 3000
const ORCAMENTO_NA_MENSAGEM = /\*Orçamento nº:\*\s*(\d+)/g

export async function marcoAntesDoOmni() {
  const [{ ultima_receita: ultimaReceita }] = await consultar('SELECT MAX(CODIGO) AS ULTIMA_RECEITA FROM ATENDIMENTO_A1')
  const [{ ultima_mensagem: ultimaMensagem }] = await consultar('SELECT MAX(CODIGO) AS ULTIMA_MENSAGEM FROM OC_ATENDIMENTO_MSG')
  return { ultimaReceita: Number(ultimaReceita ?? 0), ultimaMensagem: Number(ultimaMensagem ?? 0) }
}

// A receita criada pelo `Orçamento receita` do atendimento nesta rodada: exatamente uma.
export async function receitaNovaDoOmni(marco, funcionario) {
  const linhas = await consultar(
    'SELECT CODIGO, CODIGO_OC_ATENDIMENTO FROM ATENDIMENTO_A1 WHERE CODIGO > ? AND CADASTRO_CF = ? AND CODIGO_OC_ATENDIMENTO IS NOT NULL ORDER BY CODIGO',
    [marco.ultimaReceita, funcionario]
  )
  if (linhas.length !== 1) {
    throw new Error(`Esperava 1 receita nova vinculada a atendimento Omni pelo funcionário ${funcionario}; achei ${linhas.length}: ${JSON.stringify(linhas)}`)
  }
  return { codigo: Number(linhas[0].codigo), atendimento: Number(linhas[0].codigo_oc_atendimento) }
}

// ---- Transferência do atendimento para o funcionário da suíte (2026-11-06) ----
// O `Orçamento receita` só funciona para o dono do atendimento ("Orçamento pertence a outro
// atendente"). Se o telefone do operador tem atendimento aberto de outro atendente, o 2.4
// transfere para o funcionário da suíte pela 471 antes de seguir.

const STATUS_ABERTO = [0, 1] // 0 Pendente, 1 Em andamento (sub status 1.x incluídos)
const PRAZO_DA_TRANSFERENCIA_MS = 30000

// Atendimento aberto do telefone. O app normaliza o número (DDI 55 e sem o 9º dígito em
// `ID_USUARIO`, ex.: 556293225337), então a comparação é pelos 8 últimos dígitos.
export async function atendimentoAbertoDoTelefone(telefone) {
  const digitos = String(telefone ?? '').replace(/\D/g, '')
  if (digitos.length < 8) throw new Error('pré-condição: credentials.telefone vazio ou curto (preencher no env.local.json)')
  const linhas = await consultar(
    `SELECT CODIGO, ATENDENTE_CF, CODIGO_OC_CANAL_GRUPO FROM OC_ATENDIMENTO WHERE ID_USUARIO LIKE ? AND STATUS IN (${STATUS_ABERTO.join(', ')}) ORDER BY CODIGO DESC`,
    [`%${digitos.slice(-8)}`]
  )
  if (linhas.length === 0) return null
  const [l] = linhas
  return { codigo: Number(l.codigo), atendente: Number(l.atendente_cf), grupo: Number(l.codigo_oc_canal_grupo) }
}

// Posição (base 0) do funcionário na grade "Lista de atendentes" da 471 aberta pelo
// `...` > Transferir atendimento: atendentes do grupo em ordem de `FUNCIONARIO.NICK`, SEM o
// atendente atual (a grade o esconde na transferência; conferido por captura em 2026-11-06).
export async function posicaoNaListaDeTransferencia(atendimento, funcionario) {
  const linhas = await consultar(
    'SELECT R.CODIGO_FUNCIONARIO FROM OC_CANAL_GRUPO_ATENDENTE_RELAC R JOIN FUNCIONARIO F ON F.CODIGO = R.CODIGO_FUNCIONARIO WHERE R.CODIGO_OC_CANAL_GRUPO = ? AND R.CODIGO_FUNCIONARIO <> ? ORDER BY F.NICK',
    [atendimento.grupo, atendimento.atendente]
  )
  const posicao = linhas.findIndex((l) => Number(l.codigo_funcionario) === funcionario)
  if (posicao < 0) {
    throw new Error(
      `pré-condição: o funcionário ${funcionario} não é atendente do grupo ${atendimento.grupo} do Omni; ` +
        'vincular em Omni Channel > Cadastros > Atendentes (tela 471, "+")'
    )
  }
  return posicao
}

// Espera o banco registrar a transferência: atendente = funcionário e o mesmo grupo.
export async function aguardarAtendenteDoAtendimento(atendimento, funcionario, { prazoMs = PRAZO_DA_TRANSFERENCIA_MS } = {}) {
  const limite = Date.now() + prazoMs
  let atual = null
  for (;;) {
    const [linha] = await consultar('SELECT ATENDENTE_CF, CODIGO_OC_CANAL_GRUPO FROM OC_ATENDIMENTO WHERE CODIGO = ?', [atendimento.codigo])
    atual = linha ? { atendente: Number(linha.atendente_cf), grupo: Number(linha.codigo_oc_canal_grupo) } : null
    if (atual && atual.atendente === funcionario && atual.grupo === atendimento.grupo) return atual
    if (Date.now() >= limite) break
    await new Promise((resolve) => setTimeout(resolve, INTERVALO_DE_LEITURA_MS))
  }
  throw new Error(
    `Atendimento ${atendimento.codigo} não passou para o funcionário ${funcionario} no grupo ${atendimento.grupo} ` +
      `em ${prazoMs / 1000} s (agora: ${JSON.stringify(atual)})`
  )
}

export function orcamentosDaMensagem(texto) {
  return [...String(texto ?? '').matchAll(ORCAMENTO_NA_MENSAGEM)].map((m) => Number(m[1]))
}

// A mensagem do orçamento enviada no atendimento depois do marco, esperando o envio ao
// WhatsApp (MSG_ENVIADA = -1). A mensagem de abertura do atendimento novo ("Teste
// automatizado…") também é TIPO 1, mas não traz "Orçamento nº" e é ignorada.
export async function mensagemDoOrcamentoEnviada(marco, atendimento, { prazoMs = PRAZO_DA_MENSAGEM_MS } = {}) {
  const limite = Date.now() + prazoMs
  let ultima = null
  for (;;) {
    const linhas = await consultar(
      'SELECT CODIGO, MSG_ENVIADA, MSG_ERRO, MSG_TEXTO FROM OC_ATENDIMENTO_MSG WHERE CODIGO > ? AND CODIGO_OC_ATENDIMENTO = ? AND TIPO = 1 ORDER BY CODIGO DESC',
      [marco.ultimaMensagem, atendimento]
    )
    ultima = linhas.find((l) => orcamentosDaMensagem(l.msg_texto).length > 0) ?? null
    if (ultima && Number(ultima.msg_enviada) === -1) return { codigo: Number(ultima.codigo), texto: String(ultima.msg_texto) }
    if (Date.now() >= limite) break
    await new Promise((resolve) => setTimeout(resolve, INTERVALO_DE_LEITURA_MS))
  }
  if (!ultima) throw new Error(`Nenhuma mensagem de orçamento gravada no atendimento ${atendimento} em ${prazoMs / 1000} s`)
  throw new Error(`Mensagem de orçamento ${ultima.codigo} não foi enviada em ${prazoMs / 1000} s (MSG_ENVIADA ${ultima.msg_enviada}, erro: ${ultima.msg_erro ?? '-'})`)
}
