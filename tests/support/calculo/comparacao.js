// Comparação esperado (modelo) × obtido (tabela de trabalho, tela, orçamento gravado) da suíte
// 4.calculo. Cada comparação devolve a divergência ou null; o cenário coleta TODAS e falha uma vez,
// no fim, com a tabela (`[R-ANTIFALSO]`: nenhuma divergência é engolida).

export const TOLERANCIA = { fator: 0, gramas: 0.0001, reais: 0.01 }

// Texto de um TJPsValor da tela ("2.573,39") → número. Vazio ou ilegível é erro, nunca NaN.
export function valorDaTela(texto) {
  const limpo = String(texto ?? '').trim()
  if (!/^-?[\d.]+(,\d+)?$/.test(limpo)) throw new Error(`valor da tela ilegível: "${texto}"`)
  return Number(limpo.replace(/\./g, '').replace(',', '.'))
}

export function comparar(grandeza, rotulo, esperado, obtido) {
  const tolerancia = TOLERANCIA[grandeza]
  if (tolerancia === undefined) throw new Error(`grandeza desconhecida: ${grandeza}`)
  // Margem de 1e-9 só para o erro de ponto flutuante (87,425 − 87,42 não dá 0,005 exato).
  const igual = typeof obtido === 'number' && Number.isFinite(obtido) && Math.abs(esperado - obtido) <= tolerancia + 1e-9
  return igual ? null : { rotulo, grandeza, esperado, obtido }
}

export function tabelaDeDivergencias(divergencias) {
  const linhas = divergencias.filter(Boolean).map((d) => `${d.rotulo} · ${d.grandeza} · ${d.esperado} · ${d.obtido}`)
  return ['fórmula · item · grandeza · esperado · obtido', ...linhas].join('\n')
}

// Valor de cada fórmula como a tela mostrou: depois do "Sim" em "calcular outra fórmula?" a 145 já
// exibe a fórmula seguinte em branco, então para as fórmulas que não são a última o valor é a
// diferença do bloco Valores (que acumula o orçamento); a última é lida na própria linha da fórmula.
export function valoresDasFormulasNaTela(telas) {
  return telas.map((tela, i) => {
    if (i === telas.length - 1) return tela.valorFormula
    const anterior = i === 0 ? 0 : telas[i - 1].valorOrcamento
    return Math.round((tela.valorOrcamento - anterior) * 100) / 100
  })
}
