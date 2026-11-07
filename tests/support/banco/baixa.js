import { execFileSync } from 'node:child_process'
import { consultar } from './conexao.js'

// Leituras SOMENTE LEITURA para o 2.3 (processo e baixa pela Pesagem monitorada, telas 433/445).

// O PS01 identifica a máquina pelo MachineGuid do Windows (é o "ID" mostrado na 445 e o
// `CONFIG_0433.ID_COMPUTADOR`, em maiúsculas; conferido em 2026-11-06).
export function idDoComputador() {
  const saida = execFileSync('reg', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'], {
    encoding: 'utf-8',
    timeout: 10000,
  })
  const achado = saida.match(/MachineGuid\s+REG_SZ\s+([0-9a-fA-F-]{36})/)
  if (!achado) throw new Error(`MachineGuid não encontrado no registro: ${saida.trim()}`)
  return achado[1].toUpperCase()
}

const COMO_CONFIGURAR_A_445 =
  'abrir a 433 nesta máquina > "..." > Configurações (445): Tipo de uso 0 - SEM BALANÇA (o Tipo leitura vira ' +
  '1 - REGISTRO NO SISTEMA) e Gravar'

// Pré-condições do 2.3, conferidas ANTES de abrir o app (hook `Before` da tag `@pesagem`).
// Devolve a lista de problemas (vazia = tudo certo), cada um já com o que fazer.
export async function problemasParaPesagem(funcionario) {
  const problemas = []

  // 1. A 445 é por computador (`CONFIG_0433`): sem a linha, o app a cria COM BALANÇA na 1ª abertura
  //    da 433 e a pesagem fica esperando a balança ("Qtde. pesada" 0 em todos os itens).
  const id = idDoComputador()
  const [config] = await consultar(
    'SELECT CODIGO, USO_BALANCA, TIPO_LEITURA FROM CONFIG_0433 WHERE UPPER(ID_COMPUTADOR) = ?',
    [id]
  )
  if (!config) {
    problemas.push(`tela 445 nunca configurada neste computador (ID ${id}, sem linha na CONFIG_0433): ${COMO_CONFIGURAR_A_445}`)
  } else if (Number(config.uso_balanca) !== 0 || Number(config.tipo_leitura) !== 1) {
    problemas.push(
      `tela 445 deste computador (CONFIG_0433 ${config.codigo}) está com Tipo de uso ${config.uso_balanca} e ` +
        `Tipo leitura ${config.tipo_leitura}, o 2.3 precisa de 0 e 1: ${COMO_CONFIGURAR_A_445}`
    )
  }

  // 2. Processo padrão do funcionário (007, aba "Processo produção"): sem ele o "Registrar processo"
  //    da 433 recusa com "Funcionário não possui processo padrão!" (ROADMAP P1-07).
  const [func] = await consultar('SELECT CODIGO, CODIGO_PROCESSO_TIPO FROM FUNCIONARIO WHERE CODIGO = ?', [funcionario])
  if (!func) {
    problemas.push(`funcionário ${funcionario} (credentials.usuario) não existe na tabela FUNCIONARIO`)
  } else if (func.codigo_processo_tipo === null || func.codigo_processo_tipo === undefined) {
    problemas.push(
      `funcionário ${funcionario} sem processo padrão: cadastrar na 007 (Cadastros > Funcionários > Ficha do ` +
        'funcionário), aba "Processo produção" (o 122 usa o processo 1)'
    )
  }
  return problemas
}

// Estoque para a baixa da receita gravada, conferido ANTES de abrir a 433 (pedido do operador,
// 2026-11-06): sem saldo a Pesagem monitorada não conclui, e o lote do principal já ficou sem saldo
// uma vez (2026-10-29). Regra: para cada item, ao menos um lote liberado (`STATUSLOTE` 1) no estoque
// de baixa da fórmula (`ATENDIMENTO_A2.CODIGO_ESTOQUE_BAIXA`) com saldo para a "Qtde. cálculo"
// (`QUANTIDADE_CALCULO`, mesma unidade da "Quantidade" do lote). Um lote só: a pesagem usa um lote
// por item ("peso fracionado do mesmo lote" desligado na 445). O lote é do produto principal quando
// houver (`ESTOQUE_GERAL.CODIGOPRINCIPAL`: o 1004866 usa o lote do 1004813). Devolve as faltas.
export async function faltasDeEstoqueParaBaixa(codigoReceita) {
  const itens = await consultar(
    'SELECT A3.NUMEROFORMULA, A3.CODIGO_PRODUTO, A3.QUANTIDADE_CALCULO, A2.CODIGO_ESTOQUE_BAIXA, ' +
      'COALESCE(EG.CODIGOPRINCIPAL, A3.CODIGO_PRODUTO) AS PRODUTO_ESTOQUE ' +
      'FROM ATENDIMENTO_A3 A3 ' +
      'JOIN ATENDIMENTO_A2 A2 ON A2.CODIGO_ATEND_A1 = A3.CODIGO_ATEND_A1 AND A2.NUMEROFORMULA = A3.NUMEROFORMULA ' +
      'LEFT JOIN ESTOQUE_GERAL EG ON EG.CODIGO = A3.CODIGO_PRODUTO ' +
      'WHERE A3.CODIGO_ATEND_A1 = ? ORDER BY A3.NUMEROFORMULA, A3.NUMEROLINHA',
    [Number(codigoReceita)]
  )
  if (itens.length === 0) throw new Error(`A receita ${codigoReceita} não tem itens no ATENDIMENTO_A3`)
  const faltas = []
  for (const item of itens) {
    const precisa = Number(item.quantidade_calculo)
    const [lote] = await consultar(
      'SELECT FIRST 1 TRIM(EL.LOTE) AS LOTE, LA.SALDO FROM ESTOQUE_LOTE EL ' +
        'JOIN ESTOQUE_LOTE_LA LA ON LA.CODIGO_ESTOQUE_LOTE = EL.CODIGO ' +
        'WHERE EL.CODIGO_PRODUTO = ? AND LA.CODIGO_ESTOQUE = ? AND LA.STATUSLOTE = 1 ORDER BY LA.SALDO DESC',
      [Number(item.produto_estoque), Number(item.codigo_estoque_baixa)]
    )
    const saldo = lote ? Number(lote.saldo) : 0
    if (saldo < precisa) {
      const deQuem = Number(item.produto_estoque) === Number(item.codigo_produto) ? '' : ` (lote do principal ${item.produto_estoque})`
      faltas.push(
        `produto ${item.codigo_produto}${deQuem}: precisa de ${precisa} no estoque ${item.codigo_estoque_baixa}, ` +
          (lote ? `o maior lote liberado (${lote.lote}) tem ${saldo}` : 'nenhum lote liberado com saldo') +
          ' — repor pela 112 (entrada 216 ou conferência 425, ver PROJECT_CONTEXT "Reposição de estoque")'
      )
    }
  }
  return faltas
}

// Códigos dos itens da receita gravada, na ordem da Pesagem monitorada (a mesma do ATENDIMENTO_A3):
// a cápsula e as embalagens são escolhidas pelo cálculo, por isso não cabem numa lista fixa
// (em 2026-11-06 a cápsula passou de 4000087 para 4000080 e o 2.3 quebrou).
export async function itensDaReceitaParaPesagem(codigoReceita) {
  const linhas = await consultar(
    'SELECT CODIGO_PRODUTO FROM ATENDIMENTO_A3 WHERE CODIGO_ATEND_A1 = ? ORDER BY NUMEROFORMULA, NUMEROLINHA',
    [Number(codigoReceita)]
  )
  if (linhas.length === 0) throw new Error(`A receita ${codigoReceita} não tem itens no ATENDIMENTO_A3`)
  return linhas.map((l) => String(l.codigo_produto))
}
