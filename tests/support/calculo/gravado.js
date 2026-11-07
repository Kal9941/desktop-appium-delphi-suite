import { consultar } from '../banco/conexao.js'

// Leitura do que o sistema calculou (suíte 4.calculo): a tabela de trabalho ATENDIMENTO_CALC1 do
// funcionário (sobrescrita a cada `Calcular`, uma série de linhas por fórmula) e, depois do `Gravar`,
// o orçamento em ATENDIMENTO_A1 (cabeçalho), A2 (fórmulas) e A3 (itens).

// Os produtos de cada fórmula vão no 11º campo do PARAMETROS (separado por ";"), em largura fixa de
// 41 caracteres por item; o código é o 1º bloco de 10 dígitos. Confere que a tabela de trabalho é
// da fórmula que o teste digitou (outra sessão com o mesmo funcionário sobrescreve a tabela).
export function parametrosConferem(parametros, formula) {
  const produtos = String(parametros || '').split(';')[10] || ''
  const codigos = []
  for (let i = 0; i + 41 <= produtos.length; i += 41) codigos.push(Number(produtos.slice(i, i + 10)))
  const esperados = formula.itens.map((item) => Number(item.produto))
  if (codigos.length !== esperados.length) return false
  const ordenar = (lista) => [...lista].sort((a, b) => a - b).join(',')
  return ordenar(codigos) === ordenar(esperados)
}

// Uma coluna VARCHAR(7000) por consulta: juntas estouram o limite de bloco do Firebird.
export async function lerTabelaDeTrabalho(funcionario) {
  const linhas = await consultar(
    'SELECT NUMEROFORMULA, NIVELCALCULO, NUMEROLINHA, CODIGOPRODUTO, CODIGOPRINCIPAL, CODIGOPRODUTO_F, QUANTIDADE, UNIDADE, ' +
      'QUANTIDADEG, VALORVENDA, INCLUSAOSISTEMA, CALCULO, DENSIDADE, FATORCORRECAO, UFC, UI, CAPSULA, CANCELARBAIXA, LOTE ' +
      'FROM ATENDIMENTO_CALC1 WHERE CODIGO_FUNCIONARIO = ? ORDER BY NUMEROFORMULA, NIVELCALCULO, NUMEROLINHA',
    [funcionario]
  )
  const parametros = await consultar(
    'SELECT NUMEROFORMULA, PARAMETROS FROM ATENDIMENTO_CALC1 WHERE CODIGO_FUNCIONARIO = ? AND NIVELCALCULO = 0 AND NUMEROLINHA = 1',
    [funcionario]
  )
  const porFormula = new Map()
  for (const linha of linhas) {
    if (!porFormula.has(linha.numeroformula)) porFormula.set(linha.numeroformula, { parametros: '', linhas: [] })
    porFormula.get(linha.numeroformula).linhas.push(linha)
  }
  for (const p of parametros) if (porFormula.has(p.numeroformula)) porFormula.get(p.numeroformula).parametros = p.parametros
  return porFormula
}

export async function lerOrcamentoGravado(codigoA1) {
  const [a1] = await consultar(
    'SELECT CODIGO, STATUS_MOV, CODIGO_CLIENTE, CODIGO_MEDICO, VALORVENDA, VALORVENDA_DESC FROM ATENDIMENTO_A1 WHERE CODIGO = ?',
    [codigoA1]
  )
  const a2 = await consultar(
    'SELECT NUMEROFORMULA, CODIGO_FORMAFARMACEUTICA, QVD, MULTIPLO, VALOR_TAXATECNICA, VALORFORMULA_VENDA, VALORFORMULA_VENDA_DESC ' +
      'FROM ATENDIMENTO_A2 WHERE CODIGO_ATEND_A1 = ? ORDER BY NUMEROFORMULA',
    [codigoA1]
  )
  const a3 = await consultar(
    'SELECT NUMEROFORMULA, NUMEROLINHA, CODIGO_PRODUTO, CODIGO_PRODUTO_F, QUANTIDADE, UNIDADE, QUANTIDADE_CALCULO, VALORVENDA_UNIT, ' +
      'VALORVENDA, INCLUSAOSISTEMA FROM ATENDIMENTO_A3 WHERE CODIGO_ATEND_A1 = ? ORDER BY NUMEROFORMULA, NUMEROLINHA',
    [codigoA1]
  )
  return { a1, a2, a3 }
}

// O que o app registrou (PARAMETROS + linhas digitadas, nível 0) precisa ser a fórmula da massa:
// forma, múltiplo, total e cada item (código, quantidade, unidade). Sem isso um erro de digitação da
// automação (ex.: múltiplo 12 em vez de 2) seria calculado pelo modelo sobre a entrada errada e passaria.
export function diferencasDaEntrada(tabela, definicao) {
  const campos = String(tabela.parametros || '').split(';')
  const diferencas = []
  if (Number(campos[5]) !== Number(definicao.forma)) diferencas.push(`forma: massa ${definicao.forma}, registrado ${campos[5]}`)
  if (Number(campos[8]) !== Number(definicao.multiplo || 1)) diferencas.push(`múltiplo: massa ${definicao.multiplo || 1}, registrado ${campos[8]}`)
  if (definicao.total != null && Number(campos[9]) !== Number(definicao.total)) diferencas.push(`total: massa ${definicao.total}, registrado ${campos[9]}`)
  const digitados = tabela.linhas.filter((l) => l.nivelcalculo === 0 && l.inclusaosistema === 0)
  if (digitados.length !== definicao.itens.length) diferencas.push(`itens: massa ${definicao.itens.length}, registrado ${digitados.length}`)
  for (const item of definicao.itens) {
    const linha = digitados.find((l) => Number(l.codigoproduto) === Number(item.produto))
    if (!linha) {
      diferencas.push(`item ${item.produto}: não registrado`)
      continue
    }
    if (Number(linha.quantidade) !== Number(item.quantidade) || String(linha.unidade).toLowerCase() !== String(item.unidade).toLowerCase()) {
      diferencas.push(`item ${item.produto}: massa ${item.quantidade} ${item.unidade}, registrado ${Number(linha.quantidade)} ${linha.unidade}`)
    }
  }
  return diferencas
}

// Os itens digitados gravados na A3 (sem os itens de fórmula interna) são os produtos da massa.
export function produtosDoGravadoConferem(a3DaFormula, definicao) {
  const gravados = a3DaFormula.filter((l) => l.inclusaosistema === 0 && !l.codigo_produto_f).map((l) => Number(l.codigo_produto))
  const ordenar = (lista) => [...lista].sort((a, b) => a - b).join(',')
  return ordenar(gravados) === ordenar(definicao.itens.map((i) => Number(i.produto)))
}
