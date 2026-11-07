import { consultar } from '../banco/conexao.js'

// Insumos do modelo de cálculo (suíte 4.calculo), lidos do banco SOMENTE LEITURA na hora do teste:
// ficha do produto, lote e laudo usados, unidades, forma farmacêutica (taxa, índice, mínimo, perda),
// configuração da loja, cápsulas da forma, fórmula interna e acréscimo do prescritor. Colunas e
// regras: .agents/PROJECT_CONTEXT.md, "Cálculo da receita na 145".

const numero = (v) => (v === null || v === undefined ? null : Number(v))

export async function lerFicha(codigo) {
  const [e] = await consultar(
    'SELECT CODIGO, COALESCE(CODIGOPRINCIPAL, CODIGO) AS PRINCIPAL, MOVIMENTOESTOQUE, COALESCE(FATORCALCULO, 1) AS FATORCALCULO, ' +
      'CONCENTRACAO, UMIDADE, UMIDADE_UC, FATOREQUIV, FATOREQUIV_UC, DENSIDADE, UI, UTR, UFC, MEQ, COALESCE(UNIDADE_UMU, 0) AS UNIDADE_UMU, ' +
      'UNIDADE, VALORVENDA, COALESCE(BLOQUEAR_PERDA, 0) AS BLOQUEAR_PERDA, ATIVO FROM ESTOQUE_GERAL WHERE CODIGO = ?',
    [codigo]
  )
  if (!e) throw new Error(`pré-condição: produto ${codigo} não existe em ESTOQUE_GERAL`)
  return {
    codigo: e.codigo,
    principal: e.principal,
    movimentoEstoque: e.movimentoestoque,
    fatorCalculo: e.fatorcalculo,
    concentracao: numero(e.concentracao),
    umidade: numero(e.umidade),
    umidadeUc: e.umidade_uc,
    fatorEquiv: numero(e.fatorequiv),
    fatorEquivUc: e.fatorequiv_uc,
    densidade: numero(e.densidade),
    ui: numero(e.ui),
    utr: numero(e.utr),
    ufc: numero(e.ufc),
    meq: numero(e.meq),
    unidadeUmu: e.unidade_umu,
    unidade: String(e.unidade || '').toLowerCase(),
    valorVenda: numero(e.valorvenda),
    bloquearPerda: e.bloquear_perda,
    ativo: e.ativo,
  }
}

// O mesmo número de lote pode ter várias linhas: usa a mais recente com laudo aprovado (o laudo liga
// por CODIGO_LOTE = ESTOQUE_LOTE.CODIGO) ou, sem laudo, a mais recente.
export async function lerLoteELaudo(principal, loteTexto) {
  if (!loteTexto) return { lote: null, laudo: null }
  const lotes = await consultar(
    'SELECT CODIGO, CONCENTRACAO, UMIDADE, DENSIDADE, UI, UFC FROM ESTOQUE_LOTE WHERE CODIGO_PRODUTO = ? AND LOTE = ? ORDER BY CODIGO DESC',
    [principal, loteTexto]
  )
  const mapear = (l) => ({ codigo: l.codigo, concentracao: numero(l.concentracao), umidade: numero(l.umidade), densidade: numero(l.densidade), ui: numero(l.ui), ufc: numero(l.ufc) })
  for (const l of lotes) {
    const [laudo] = await consultar(
      'SELECT COUNT(*) AS N, AVG(COALESCE(CONCENTRACAO, 1)) AS CONCENTRACAO, AVG(COALESCE(UMIDADE, 0)) AS UMIDADE, AVG(COALESCE(DENSIDADE, 1)) AS DENSIDADE, ' +
        'AVG(UI) AS UI, AVG(UFC) AS UFC FROM ESTOQUE_LAUDOINTERNO WHERE CODIGO_LOTE = ? AND RESULTADO = -1 AND CANCELAMENTO_CF IS NULL',
      [l.codigo]
    )
    if (laudo && Number(laudo.n) > 0) return { lote: mapear(l), laudo: { concentracao: numero(laudo.concentracao), umidade: numero(laudo.umidade), densidade: numero(laudo.densidade), ui: numero(laudo.ui), ufc: numero(laudo.ufc) } }
  }
  return { lote: lotes.length ? mapear(lotes[0]) : null, laudo: null }
}

export async function lerUnidades() {
  const linhas = await consultar(
    'SELECT UNIDADE, CALCULO, VALORINDICE, VALORUNIDADE FROM UNIDADES WHERE CNPJ_FORNECEDOR_XML IS NULL AND CALCULO <> 20 AND UNIDADE_CALCULO_A = -1'
  )
  const mapa = new Map()
  for (const u of linhas) {
    const chave = String(u.unidade).toLowerCase()
    if (!mapa.has(chave)) mapa.set(chave, { calculo: u.calculo, valorIndice: u.valorindice, valorUnidade: Number(u.valorunidade) })
  }
  return mapa
}

export async function lerForma(forma, loja, estoqueBaixa) {
  const [ff] = await consultar(
    'SELECT TIPOINFORME, MULTIPLICARTAXA, COALESCE(PERCENTUAL_PP, 0) AS PERCENTUAL_PP, COALESCE(NAO_UTILIZAR_DENSIDADE, 0) AS NAO_UTILIZAR_DENSIDADE, ' +
      'COALESCE(VALORMINIMOATENDIMENTO, 0) AS VALORMINIMOATENDIMENTO, COBRARINCLUSAOSISTEMA, CODIGO_FORMAFARMACEUTICA_INDICE FROM FORMAFARMACEUTICA WHERE CODIGO = ?',
    [forma]
  )
  if (!ff) throw new Error(`pré-condição: forma farmacêutica ${forma} não existe`)
  const [taxa] = await consultar(
    'SELECT TIPO_TAXATECNICA, VALOR_TAXATECNICA, PERCENTUAL_TAXATECNICA, ACRESCIMO_TAXATECNICA FROM FORMAFARMACEUTICA_LOJABAIXA ' +
      'WHERE CODIGO_FORMAFARMACEUTICA = ? AND CODIGO_EMPRESA = ? AND CODIGO_ESTOQUE = ?',
    [forma, loja, estoqueBaixa]
  )
  const faixas = ff.codigo_formafarmaceutica_indice
    ? await consultar(
        'SELECT D.VALOR, D.INDICE FROM FORMAFARMACEUTICA_INDICE I JOIN FORMAFARMACEUTICA_INDICE_DET D ON D.CODIGO_FORMAFARMACEUTICA_INDICE = I.CODIGO ' +
          'WHERE I.CODIGO = ? AND I.ATIVO = -1 ORDER BY D.VALOR',
        [ff.codigo_formafarmaceutica_indice]
      )
    : []
  const minimos = await consultar('SELECT QVD, VALOR FROM FORMAFARMACEUTICA_VALOR_MIN WHERE CODIGO_FORMAFARMACEUTICA = ?', [forma])
  return {
    tipoInforme: ff.tipoinforme,
    multiplicarTaxa: ff.multiplicartaxa,
    percentualPerda: Number(ff.percentual_pp),
    naoUtilizarDensidade: ff.nao_utilizar_densidade,
    cobrarInclusaoSistema: ff.cobrarinclusaosistema,
    minimoAtendimento: Number(ff.valorminimoatendimento),
    taxa: taxa
      ? { tipo: taxa.tipo_taxatecnica, valor: Number(taxa.valor_taxatecnica || 0), percentual: Number(taxa.percentual_taxatecnica || 0), acrescimo: Number(taxa.acrescimo_taxatecnica || 0), multiplicarTaxa: ff.multiplicartaxa }
      : { tipo: 1, valor: 0, percentual: 0, acrescimo: 0, multiplicarTaxa: ff.multiplicartaxa },
    faixasIndice: faixas.map((f) => ({ valor: Number(f.valor), indice: Number(f.indice) })),
    minimoPorQvd: (qvd) => Number(minimos.find((m) => Number(m.qvd) === Number(qvd))?.valor || 0),
  }
}

export async function lerConfLoja(loja) {
  const [c] = await consultar(
    'SELECT CALCULODENSIDADE_A, NAO_UTILIZAR_FATOR_CALC_PRECO_A, COALESCE(CASASDECIMAIS_A, 3) AS CASASDECIMAIS_A FROM ATENDIMENTO_CONF WHERE CODIGO_EMPRESA = ?',
    [loja]
  )
  return { calculoDensidade: c?.calculodensidade_a, naoUtilizarFatorPreco: c?.nao_utilizar_fator_calc_preco_a, casasDecimais: c?.casasdecimais_a }
}

export async function lerCapsulasDaForma(forma) {
  const linhas = await consultar(
    'SELECT V.CODIGO_PRODUTO, V.ORDENACAO, VOL.VOLUME FROM ESTOQUER_VINCULO_FF V JOIN ESTOQUE_GERAL E ON E.CODIGO = V.CODIGO_PRODUTO AND E.ATIVO = -1 ' +
      'LEFT JOIN ESTOQUER_VOLUME VOL ON VOL.CODIGO = V.CODIGO_PRODUTO AND VOL.ATIVO = -1 ' +
      'WHERE V.CODIGO_FORMAFARMACEUTICA = ? AND V.ATIVO = -1 AND V.TIPO = 0 AND V.ESPECIFICO_TE = 0 ORDER BY V.ORDENACAO',
    [forma]
  )
  return linhas.map((l) => ({ codigo: l.codigo_produto, volume: numero(l.volume), ordenacao: l.ordenacao }))
}

export async function lerFormulaInterna(produtoFormula) {
  const [f] = await consultar('SELECT CODIGO, PESOFORMULA, TIPOCADASTRO FROM ESTOQUEF WHERE CODIGO_FORMULA = ?', [produtoFormula])
  if (!f) throw new Error(`pré-condição: produto ${produtoFormula} não é fórmula de produção interna (ESTOQUEF)`)
  const detalhes = await consultar(
    'SELECT NUMEROLINHA, CODIGO_PRODUTO, QUANTIDADE, UNIDADE FROM ESTOQUEF_DETALHE WHERE CODIGO_ESTOQUEF = ? ORDER BY NUMEROLINHA',
    [f.codigo]
  )
  return {
    codigo: f.codigo,
    pesoFormula: Number(f.pesoformula || 1),
    tipoCadastro: f.tipocadastro,
    detalhes: detalhes.map((d) => ({ numeroLinha: d.numerolinha, codigoProduto: d.codigo_produto, quantidade: Number(d.quantidade), unidade: String(d.unidade).toLowerCase() })),
  }
}

export async function lerAumentor(prescritor) {
  const [m] = await consultar('SELECT COALESCE(AUMENTOR, 0) AS AUMENTOR FROM MEDICO WHERE CODIGO = ?', [prescritor])
  if (!m) throw new Error(`pré-condição: prescritor ${prescritor} não existe`)
  return Number(m.aumentor)
}

// Pré-condições da massa (orcamentos.json): [{ produto, <COLUNA de ESTOQUE_GERAL>: valor | ">0" }, ...],
// mais `formaLiberada` (produto liberado para a forma em ESTOQUE_PFF, ou sem restrição) e
// `itensMlhNaFormulaInterna` (nº de itens em mlh na fórmula interna do produto).
// Devolve a lista de violações em pt-BR (vazia = tudo certo).
export async function conferirPreCondicoes(precondicoes) {
  const violacoes = []
  for (const { produto, formaLiberada, itensMlhNaFormulaInterna, ...colunas } of precondicoes) {
    const nomes = Object.keys(colunas)
    for (const nome of nomes) if (!/^[A-Z_]+$/.test(nome)) throw new Error(`coluna inválida na pré-condição: ${nome}`)
    if (nomes.length) {
      const [linha] = await consultar(`SELECT ${nomes.join(', ')} FROM ESTOQUE_GERAL WHERE CODIGO = ?`, [produto])
      if (!linha) {
        violacoes.push(`${produto}: não existe em ESTOQUE_GERAL`)
        continue
      }
      for (const nome of nomes) {
        const esperado = colunas[nome]
        const obtido = linha[nome.toLowerCase()]
        const ok = typeof esperado === 'string' && esperado.startsWith('>') ? Number(obtido) > Number(esperado.slice(1)) : Number(obtido) === Number(esperado)
        if (!ok) violacoes.push(`${produto}: ${nome} deveria ser ${esperado} (está ${obtido})`)
      }
    }
    if (formaLiberada !== undefined) {
      // Como o MOV_ATENDIMENTO_CALC1: a restrição da ESTOQUE_PFF só vale para produto não "transparente".
      const [p] = await consultar(
        'SELECT COUNT(*) AS TOTAL, SUM(IIF(P.CODIGO_FORMAFARMACEUTICA = ?, 1, 0)) AS DA_FORMA, ' +
          '(SELECT COALESCE(TRANSPARENTE, 0) FROM ESTOQUE_GERAL WHERE CODIGO = ?) AS TRANSPARENTE FROM ESTOQUE_PFF P ' +
          'WHERE P.CODIGO_PRODUTO = (SELECT COALESCE(CODIGOPRINCIPAL, CODIGO) FROM ESTOQUE_GERAL WHERE CODIGO = ?)',
        [formaLiberada, produto, produto]
      )
      if (Number(p.transparente) === 0 && Number(p.total) > 0 && !Number(p.da_forma)) violacoes.push(`${produto}: não está liberado para a forma ${formaLiberada} (ESTOQUE_PFF)`)
    }
    if (itensMlhNaFormulaInterna !== undefined) {
      const formula = await lerFormulaInterna(produto)
      const mlh = formula.detalhes.filter((d) => d.unidade === 'mlh').length
      if (mlh !== itensMlhNaFormulaInterna) violacoes.push(`${produto}: fórmula interna ${formula.codigo} deveria ter ${itensMlhNaFormulaInterna} item(ns) em mlh (tem ${mlh})`)
    }
  }
  return violacoes
}
