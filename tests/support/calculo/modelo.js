// Modelo do cálculo da receita da tela 145 (suíte 4.calculo): funções PURAS, sem banco e sem tela.
// Reimplementa as regras levantadas no código das procedures MOV_ATENDIMENTO_CALC* e conferidas em
// 2026-11-05 (ver .agents/PROJECT_CONTEXT.md, "Cálculo da receita na 145"). Onde o sistema tem um bug
// conhecido (milhão de fórmula interna, MOV_ATENDIMENTO_CALC2), o modelo segue a regra CORRETA.

// Firebird (NUMERIC(18,4)): divisão trunca na 4ª casa; CAST de produto e atribuição a variável arredondam.
export const trunc4 = (x) => Math.trunc(x * 1e4 + (x >= 0 ? 1e-9 : -1e-9)) / 1e4
export const round4 = (x) => Math.round((x + Number.EPSILON) * 1e4) / 1e4
export const round2 = (x) => Math.round((x + Number.EPSILON) * 1e2) / 1e2

function naoModelada(regra) {
  return new Error(`regra não modelada: ${regra}`)
}

const fatorDeUmidade = (umidade) => trunc4(100 / (100 - (umidade === 100 ? 0 : umidade)))

// Fator total do item (MOV_ATENDIMENTO_CALC7): equivalência × correção × umidade, com correção,
// umidade e densidade vindas da ficha, do lote ou do laudo conforme `fatorCalculo`
// (1 ficha; 2 lote → ficha; 3 laudo → ficha; 4 laudo → lote → ficha). A equivalência vem sempre
// da ficha. A umidade só entra com `ficha.umidadeUc = -1` (checkbox marcado na ficha 112).
export function fatorTotal({ fatorCalculo, movimentoEstoque, ficha, lote, laudo, calculoDensidade }) {
  const fc = fatorCalculo || 1
  const equivalencia = movimentoEstoque === 1 && ficha.fatorEquivUc === -1 ? ficha.fatorEquiv : 1
  const umidadeFicha = movimentoEstoque < 2 && ficha.umidadeUc === -1 && ficha.umidade != null ? fatorDeUmidade(ficha.umidade) : 1
  const correcaoFicha = movimentoEstoque === 1 ? trunc4(100 / ficha.concentracao) : 1
  const usaLote = [2, 4].includes(fc) && lote
  const umidadeLote = usaLote && lote.umidade != null ? fatorDeUmidade(lote.umidade) : umidadeFicha
  const correcaoLote = usaLote ? (lote.concentracao ? trunc4(100 / lote.concentracao) : null) : correcaoFicha
  const usaLaudo = movimentoEstoque === 1 && [3, 4].includes(fc) && laudo
  const umidadeLaudo = usaLaudo ? fatorDeUmidade(laudo.umidade || 0) : null

  let umidade = umidadeFicha
  if (fc === 2 && lote && lote.umidade > 0) umidade = umidadeLote
  else if (usaLaudo && laudo.umidade > 0) umidade = umidadeLaudo
  else if (fc === 4 && lote && lote.umidade > 0) umidade = umidadeLote

  let fonte = 'FICHA'
  let correcao = correcaoFicha
  let densidade = ficha.densidade
  if (fc !== 1 && usaLaudo && laudo.concentracao != null) {
    fonte = 'LAUDO'
    correcao = trunc4(100 / laudo.concentracao)
    umidade = umidadeLaudo
    densidade = laudo.densidade
  } else if (fc !== 1 && usaLote && correcaoLote != null) {
    fonte = 'LOTE'
    correcao = correcaoLote
    umidade = umidadeLote
    densidade = lote.densidade
  }
  if (calculoDensidade === 0) densidade = 1
  const fator = round4(equivalencia * correcao * (ficha.umidadeUc === -1 ? umidade : 1))
  return { fonte, equivalencia, correcao, umidade, densidade, fator }
}

// Gramas por dose de um item digitado (MOV_ATENDIMENTO_CALC1), antes do Total múltiplo (QVD).
// `unidadeInfo` = linha de UNIDADES; `referencias` = UI/UTR/UFC/MEQ efetivos (já com a precedência
// de lote/laudo) e `unidadeUmu` (0 = referência em 1 mg → ÷1000; 1 = em 1 g).
export function gramasPorDose({ quantidade, unidade, unidadeInfo, referencias, fator, movimentoEstoque }) {
  const u = String(unidade).toLowerCase()
  const { calculo, valorIndice, valorUnidade } = unidadeInfo
  const ref = referencias || {}
  let gramas
  if (['ufc', 'mlh', 'blh'].includes(u) && ref.ufc > 0) {
    gramas = quantidade / ref.ufc
    if (u === 'mlh') gramas /= 1000
  } else if (u === 'ui' && ref.ui > 0) gramas = quantidade / ref.ui
  else if (u === 'utr' && ref.utr > 0) gramas = quantidade / ref.utr
  else if (u === 'meq' && ref.meq > 0) gramas = quantidade / ref.meq
  else if (calculo === 8) return quantidade
  else if ((calculo === 1 || calculo === 2) && valorIndice === 1) gramas = quantidade * valorUnidade
  else if ((calculo === 1 || calculo === 2) && valorIndice === 2 && valorUnidade > 0) gramas = quantidade / valorUnidade
  else throw naoModelada(`unidade "${unidade}" (UNIDADES.CALCULO ${calculo})`)

  if (movimentoEstoque === 1 && [1, 2, 3, 4, 5, 6, 7, 9].includes(calculo)) {
    if (fator > 0) gramas *= fator
    if ([4, 5, 6].includes(calculo) && !['ufc', 'blh', 'mlh'].includes(u) && (ref.unidadeUmu || 0) === 0) gramas /= 1000
  }
  return gramas
}

// Preço por grama usado no cálculo: o da ficha dividido pela CORREÇÃO (não pela equivalência nem
// pela umidade), salvo ATENDIMENTO_CONF.NAO_UTILIZAR_FATOR_CALC_PRECO_A = -1.
export function precoPorGrama({ valorVenda, correcao, naoUtilizarFatorPreco }) {
  if (naoUtilizarFatorPreco === -1) return valorVenda
  return round4(valorVenda / (correcao || 1))
}

// Cápsula (MOV_ATENDIMENTO_CALC8): menor nº de cápsulas por dose (1..300) e, empatando, a primeira
// pela ORDENACAO do vínculo cuja capacidade comporta o volume por dose.
export function escolherCapsula(volumePorDose, capsulas) {
  const ordenadas = capsulas.filter((c) => c.volume > 0).sort((a, b) => a.ordenacao - b.ordenacao)
  const alvo = Math.round(volumePorDose * 1e3) / 1e3
  for (let n = 1; n <= 300; n++) {
    const escolhida = ordenadas.find((c) => c.volume * n >= alvo)
    if (escolhida) return { codigo: escolhida.codigo, volume: escolhida.volume, quantidadePorDose: n }
  }
  throw naoModelada(`nenhuma cápsula comporta ${volumePorDose} ml por dose`)
}

// Excipiente (MOV_ATENDIMENTO_CALC10): complemento do volume das cápsulas × densidade do excipiente.
export function excipiente({ volumeCapsula, quantidadePorDose, volumePorDose, qvd, densidadeExcipiente }) {
  const gramasTotal = (volumeCapsula * quantidadePorDose - volumePorDose) * qvd * densidadeExcipiente
  return { gramasPorDose: gramasTotal / qvd, gramasTotal }
}

// Valor de um item na fórmula: preço por grama × quantidade (4 casas) × múltiplo × índice da forma ×
// índice do prescritor; × densidade quando o item foi digitado em ml de produto estocado em g; +
// perda no processo (FORMAFARMACEUTICA.PERCENTUAL_PP) em matéria-prima.
export function valorItem({ precoPorGrama, quantidadeG, multiplo, densidade, aplicaDensidade, percentualPerda, aplicaPerda, indiceForma, indicePrescritor }) {
  let valor = precoPorGrama * round4(quantidadeG) * multiplo * (indiceForma ?? 1) * (indicePrescritor ?? 1)
  if (aplicaDensidade && densidade > 0) valor *= densidade
  if (aplicaPerda && percentualPerda > 0) valor *= 1 + percentualPerda / 100
  return valor
}

// Índice de preço da forma (FORMAFARMACEUTICA_INDICE_DET): 1ª faixa com VALOR ≥ soma e INDICE > 0.
export function indiceDaForma(somaItens, faixas) {
  const faixa = [...(faixas || [])].filter((f) => f.indice > 0).sort((a, b) => a.valor - b.valor).find((f) => f.valor >= somaItens)
  return faixa ? 1 + faixa.indice / 100 : 1
}

// Taxa técnica (FORMAFARMACEUTICA_LOJABAIXA): tipo 1 = valor fixo; senão % da soma dos itens com o
// valor como mínimo; + acréscimo; × múltiplo quando FORMAFARMACEUTICA.MULTIPLICARTAXA = -1.
export function taxaTecnica({ tipo, valor, percentual, acrescimo, multiplicarTaxa, multiplo, somaItens }) {
  let taxa = tipo === 1 ? valor : Math.max(round2((somaItens * (percentual || 0)) / 100), valor || 0)
  taxa += acrescimo || 0
  if (multiplicarTaxa === -1) taxa *= multiplo
  return round2(taxa)
}

// Valor de uma fórmula: itens (com índice da forma calculado sobre a soma bruta) + taxa técnica,
// respeitando o valor mínimo da forma (por Total ou o mínimo do atendimento).
export function valorFormula({ itens, multiplo, percentualPerda, faixasIndice, aumentorPrescritor, taxa, minimoPorQvd, minimoAtendimento }) {
  const somaBruta = itens.reduce((s, i) => s + i.precoPorGrama * i.quantidadeG * multiplo, 0)
  const indiceForma = indiceDaForma(somaBruta, faixasIndice)
  const indicePrescritor = 1 + (aumentorPrescritor || 0) / 100
  const valores = itens.map((i) => valorItem({ ...i, multiplo, percentualPerda, indiceForma, indicePrescritor }))
  const somaItens = valores.reduce((s, v) => s + v, 0)
  const valorTaxa = taxaTecnica({ ...taxa, multiplo, somaItens: somaBruta })
  const bruto = round2(somaItens + valorTaxa)
  const minimo = Math.max(minimoPorQvd || 0, minimoAtendimento || 0)
  return { itens: valores, somaItens, indiceForma, taxa: valorTaxa, bruto, minimo, valor: Math.max(bruto, minimo) }
}

// Expansão de uma fórmula de produção interna (ESTOQUEF_DETALHE) na receita, pela regra CORRETA
// (a mesma do item digitado: milhão ÷ 1000). O sistema hoje (MOV_ATENDIMENTO_CALC2) perde o ÷1000.
export function expandirFormulaInterna({ detalhes, pesoFormula, quantidadePorDose }) {
  return detalhes.map((d) => ({
    codigoProduto: d.codigoProduto,
    gramasPorDose: (gramasPorDose(d) * quantidadePorDose) / (pesoFormula || 1),
  }))
}

export function valorOrcamento(valoresFormulas) {
  return round2(valoresFormulas.reduce((s, v) => s + v, 0))
}

// Preço por unidade da linha de uma fórmula de produção interna na receita (MOV_ATENDIMENTO_CALC1,
// CALCULOPRECO_F = 1): soma de preço × gramas dos itens (nível 1) ÷ gramas da linha da fórmula.
export function precoDaFormulaInterna(itens, gramasDaFormula) {
  return round4(itens.reduce((s, i) => s + i.precoPorGrama * i.gramas, 0) / gramasDaFormula)
}

// Item em % (UNIDADES.CALCULO 9, forma de tipo de informe 1): fração da soma das quantidades dos
// ativos já calculados (cada um ÷ o próprio fator), × o fator do item em % (MOV_ATENDIMENTO_CALC1).
export function gramasDePercentual({ percentual, somaDosAtivosSemFator, fator }) {
  return somaDosAtivosSemFator * (percentual / 100) * (fator > 0 ? fator : 1)
}
