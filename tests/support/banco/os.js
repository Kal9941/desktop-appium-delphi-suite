import { consultar } from './conexao.js'

// Leituras SOMENTE LEITURA da suíte 0.os (validação de OS abertas).

// ---- OS 364644: notificação "!" (mensagens não lidas) da 418 ----
// O "!" da grade é OC_ATENDIMENTO.MSG_QTDE, recalculado pela trigger
// OC_ATENDIMENTO_MSG_AI1_MSG_QTDE a partir das mensagens do CLIENTE sem leitura
// (CODIGO_FUNCIONARIO_RESPOSTA nulo, MSG_TRANSFERENCIA 0, LEITURA_DT nulo). A regra de
// leitura é OC_CONFIG.MENSAGEM_LIDA: 0 = quando o atendente visualizar; 1 = quando o
// atendente visualizar ou alguém responder; 2 = quando alguém responder. Em nenhuma delas
// abrir o atendimento de OUTRO atendente marca como lido (a OS: o "!" sumia nesse caso).

const MENSAGEM_DO_CLIENTE_NAO_LIDA =
  'M.CODIGO_FUNCIONARIO_RESPOSTA IS NULL AND M.MSG_TRANSFERENCIA = 0 AND M.LEITURA_DT IS NULL'

export async function regraDeLeituraDasMensagens() {
  const [linha] = await consultar('SELECT FIRST 1 MENSAGEM_LIDA FROM OC_CONFIG')
  return linha ? Number(linha.mensagem_lida) : null
}

// Escolhido a cada rodada (os atendimentos mudam o tempo todo): aberto (STATUS 0/1) e COM
// dono que não é o funcionário da suíte (sem dono, abrir atribuiria o atendimento a ele, caso
// A da OS), com mensagem do cliente não lida. A grade é filtrada pelo telefone e o teste acha
// a linha pelo "!" verde: entre os atendimentos desse telefone, só ele pode ter não lidas.
// O mais recente primeiro.
export async function atendimentoDeOutroAtendenteComNaoLidas(funcionario) {
  const linhas = await consultar(
    `SELECT FIRST 1 A.CODIGO, A.ATENDENTE_CF, A.ID_USUARIO, A.MSG_QTDE
       FROM OC_ATENDIMENTO A
      WHERE A.STATUS IN (0, 1) AND A.ATENDENTE_CF IS NOT NULL AND A.ATENDENTE_CF NOT IN (0, ?)
        AND A.MSG_QTDE > 0 AND A.ID_USUARIO IS NOT NULL
        AND EXISTS (SELECT 1 FROM OC_ATENDIMENTO_MSG M WHERE M.CODIGO_OC_ATENDIMENTO = A.CODIGO AND ${MENSAGEM_DO_CLIENTE_NAO_LIDA})
        AND (SELECT COUNT(*) FROM OC_ATENDIMENTO B WHERE B.ID_USUARIO = A.ID_USUARIO AND B.MSG_QTDE > 0) = 1
      ORDER BY A.CODIGO DESC`,
    [funcionario]
  )
  if (linhas.length === 0) return null
  const [l] = linhas
  return { codigo: Number(l.codigo), atendente: Number(l.atendente_cf), telefone: String(l.id_usuario).trim(), msgQtde: Number(l.msg_qtde) }
}

// ---- OS 361422: item em % ignora ativos em mg/mcg (145, fórmula com informe por Total múltiplo) ----
// Causa (P2-15): MOV_ATENDIMENTO_CALC1 percorre os itens por quantidade DIGITADA (500 mg antes de
// 1,5 g) e V_QTDEMAIOR substitui em vez de somar; o % sai de uma base sem o item em mg.

const UNIDADES_DE_MASSA = ['g', 'mg', 'mcg', 'kg']

// O que o cenário exercita ainda existe no banco: produtos ativos e a forma com informe por Total
// múltiplo (TIPOINFORME 1). Sem isso o cenário não prova a OS.
export async function problemasDaMassaDaOs361422({ forma, itens }) {
  const problemas = []
  const [f] = await consultar('SELECT TIPOINFORME FROM FORMAFARMACEUTICA WHERE CODIGO = ?', [forma])
  if (!f) problemas.push(`forma farmacêutica ${forma} não existe`)
  else if (Number(f.tipoinforme) !== 1) problemas.push(`forma ${forma} não é de informe por Total múltiplo (TIPOINFORME ${f.tipoinforme})`)
  for (const item of itens) {
    const [p] = await consultar('SELECT ATIVO, USO_ATENDIMENTO FROM ESTOQUE_GERAL WHERE CODIGO = ?', [item.produto])
    if (!p) problemas.push(`produto ${item.produto} não existe`)
    else if (Number(p.ativo) === 0 || Number(p.uso_atendimento) === 0) problemas.push(`produto ${item.produto} desativado ou sem uso no atendimento`)
  }
  return problemas
}

// Itens gravados de uma fórmula da receita (ATENDIMENTO_A3), com o nome para a mensagem de falha.
export async function itensGravadosDaFormula(codigoReceita, numeroFormula) {
  const linhas = await consultar(
    'SELECT A3.NUMEROLINHA, A3.CODIGO_PRODUTO, E.NOMEPRODUTO, A3.QUANTIDADE, A3.UNIDADE, A3.QUANTIDADE_CALCULO ' +
      'FROM ATENDIMENTO_A3 A3 JOIN ESTOQUE_GERAL E ON E.CODIGO = A3.CODIGO_PRODUTO ' +
      'WHERE A3.CODIGO_ATEND_A1 = ? AND A3.NUMEROFORMULA = ? ORDER BY A3.NUMEROLINHA',
    [codigoReceita, numeroFormula]
  )
  return linhas.map((l) => ({
    produto: Number(l.codigo_produto),
    nome: String(l.nomeproduto).trim(),
    quantidade: Number(l.quantidade),
    unidade: String(l.unidade).trim(),
    calculo: Number(l.quantidade_calculo),
    deMassa: UNIDADES_DE_MASSA.includes(String(l.unidade).trim().toLowerCase()),
  }))
}

// Fotografia do que a OS protege: o contador, o dono e quais mensagens do cliente estão sem leitura.
export async function estadoDaLeitura(atendimento) {
  const [a] = await consultar('SELECT MSG_QTDE, ATENDENTE_CF FROM OC_ATENDIMENTO WHERE CODIGO = ?', [atendimento])
  const naoLidas = await consultar(
    `SELECT M.CODIGO FROM OC_ATENDIMENTO_MSG M WHERE M.CODIGO_OC_ATENDIMENTO = ? AND ${MENSAGEM_DO_CLIENTE_NAO_LIDA} ORDER BY M.CODIGO`,
    [atendimento]
  )
  return {
    msgQtde: Number(a?.msg_qtde ?? 0),
    atendente: a?.atendente_cf == null ? null : Number(a.atendente_cf),
    naoLidas: naoLidas.map((m) => Number(m.codigo)),
  }
}
