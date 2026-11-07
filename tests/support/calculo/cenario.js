import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  conferirPreCondicoes, lerAumentor, lerConfLoja, lerFicha, lerForma, lerFormulaInterna, lerLoteELaudo, lerUnidades,
} from './insumos.js'
import { diferencasDaEntrada, lerOrcamentoGravado, lerTabelaDeTrabalho, parametrosConferem, produtosDoGravadoConferem } from './gravado.js'
import {
  fatorTotal, gramasDePercentual, gramasPorDose, precoDaFormulaInterna, precoPorGrama, round4, valorFormula, valorOrcamento,
} from './modelo.js'
import { comparar, tabelaDeDivergencias, valoresDasFormulasNaTela } from './comparacao.js'
import { loadEnv } from '../loadEnv.js'

// Orquestração de DADOS de um cenário da suíte 4.calculo (sem tela): massa, pré-condições, leitura
// da tabela de trabalho depois de cada `Calcular`, esperado do modelo, comparação com a tela e com o
// orçamento gravado, divergências acumuladas e evidência. A interação com a 145 fica nos steps.

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MASSA = path.join(__dirname, '..', '..', 'fixtures', 'calculo', 'orcamentos.json')
const LOJA = 1
const UNIDADES_EM_ML = ['ml', 'qsp(ml)', 'qsp(gt)', 'cc', 'cm3', 'l']

// A ATENDIMENTO_CALC1 é por funcionário, e o funcionário é quem fez o login (credentials.usuario).
// A suíte usa um funcionário só dela: outro sistema calculando com o mesmo código sobrescreve a
// tabela no meio do cenário (122, 2026-11-05) e o cenário cai em "interferência".
export function codigoDoFuncionario(usuario) {
  const texto = String(usuario ?? '').trim()
  if (!/^\d+$/.test(texto) || Number(texto) <= 0) {
    throw new Error('pré-condição: credentials.usuario em env.local.json deve ser o código numérico do funcionário da suíte (é ele que indexa a ATENDIMENTO_CALC1).')
  }
  return Number(texto)
}

function funcionarioDaSuite() {
  return codigoDoFuncionario(loadEnv().credentials?.usuario)
}

// Resposta a cada diálogo "Atenção" que o cálculo abre.
export function classificarDialogoDoCalculo(texto) {
  const t = String(texto || '')
  if (/calcular outra f[óo]rmula/i.test(t)) return 'outra-formula'
  if (/em QSP/i.test(t)) return 'qsp'
  if (/n[ãa]o pode ser utilizado|desativado|C[ÁA]LCULO PROIBIDO/i.test(t)) return 'bloqueio'
  return 'aviso'
}

export function carregarOrcamento(chave) {
  const orcamento = JSON.parse(readFileSync(MASSA, 'utf8'))[chave]
  if (!orcamento) throw new Error(`pré-condição: orçamento "${chave}" não existe em tests/fixtures/calculo/orcamentos.json`)
  return orcamento
}

// Guardas de cenário: a forma ainda tem a regra que o cenário exercita (índice por faixa, mínimo por
// Total, mínimo do atendimento). Sem isso o cenário passaria sem testar a regra.
async function conferirPreCondicoesDasFormas(lista) {
  const violacoes = []
  for (const p of lista) {
    const forma = await lerForma(p.forma, LOJA, p.estoque)
    if (p.temIndice && !forma.faixasIndice.length) violacoes.push(`forma ${p.forma}: sem índice de preço (FORMAFARMACEUTICA_INDICE)`)
    if (p.minimoPorQvd && forma.minimoPorQvd(p.minimoPorQvd.qvd) !== p.minimoPorQvd.valor) {
      violacoes.push(`forma ${p.forma}: mínimo para o total ${p.minimoPorQvd.qvd} deveria ser ${p.minimoPorQvd.valor} (está ${forma.minimoPorQvd(p.minimoPorQvd.qvd)})`)
    }
    if (p.minimoAtendimento !== undefined && forma.minimoAtendimento !== p.minimoAtendimento) {
      violacoes.push(`forma ${p.forma}: VALORMINIMOATENDIMENTO deveria ser ${p.minimoAtendimento} (está ${forma.minimoAtendimento})`)
    }
  }
  return violacoes
}

export async function conferirPreCondicoesDoOrcamento(orcamento) {
  const violacoes = [
    ...(await conferirPreCondicoes(orcamento.precondicoes || [])),
    ...(await conferirPreCondicoesDasFormas(orcamento.precondicoesDaForma || [])),
  ]
  if (violacoes.length) throw new Error(`pré-condição: ${violacoes.join('; ')}`)
}

// Produto que o cenário promete exercitar com fatores do lote/laudo (massa `fontesDoFator`): se o
// motor passou a usar outra fonte (lote mudou, laudo cancelado), o cenário não testa mais o que diz.
export function conferirFonteDoFator(produto, esperada, obtida, lote) {
  if (esperada && esperada !== obtida) {
    throw new Error(`pré-condição: ${produto} deveria usar os fatores do ${esperada} (usou ${obtida}; lote ${lote || 'nenhum'})`)
  }
}

// O orçamento com prescritor "comAcrescimo" só prova o acréscimo se o prescritor tiver AUMENTOR > 0;
// os demais precisam de AUMENTOR 0 (senão todo valor gravado sai multiplicado).
export async function conferirPrescritor(orcamento, codigo) {
  const aumentor = await lerAumentor(codigo)
  if (orcamento.prescritor === 'comAcrescimo' && !(aumentor > 0)) throw new Error(`pré-condição: prescritor ${codigo} deveria ter acréscimo (MEDICO.AUMENTOR > 0; está ${aumentor})`)
  if (orcamento.prescritor !== 'comAcrescimo' && aumentor !== 0) throw new Error(`pré-condição: prescritor ${codigo} não deveria ter acréscimo (MEDICO.AUMENTOR = ${aumentor})`)
}

// Campos do PARAMETROS (MOV_ATENDIMENTO_CALC1): 0 loja · 5 forma · 8 múltiplo · 9 QVD · 12 estoque de baixa.
function campoDosParametros(parametros, indice) {
  return String(parametros || '').split(';')[indice]
}

// UI/UFC efetivos: mesma precedência da correção (lote/laudo com valor > 0, senão ficha).
function referenciasEfetivas(ficha, produto, lote, laudo) {
  const escolher = (campo) => {
    if (ficha.fatorCalculo === 2 && lote?.[campo] > 0) return lote[campo]
    if ([3, 4].includes(ficha.fatorCalculo) && laudo?.[campo] > 0) return laudo[campo]
    if (ficha.fatorCalculo === 4 && lote?.[campo] > 0) return lote[campo]
    return ficha[campo]
  }
  return { ui: escolher('ui'), ufc: escolher('ufc'), utr: ficha.utr, meq: produto.meq, unidadeUmu: ficha.unidadeUmu }
}

export class ConferenciaDoOrcamento {
  constructor(chave, orcamento) {
    this.chave = chave
    this.orcamento = orcamento
    this.divergencias = []
    this.formulas = [] // por índice: { definicao, tabela, tela, esperado }
    this.gravado = null
    // Grandezas que o modelo não cobre (qsp, total final...): vêm do sistema e ficam listadas.
    this.naoConferidos = new Set()
  }

  listaNaoConferidos() {
    return [...this.naoConferidos]
  }

  registrar(divergencia) {
    if (divergencia) this.divergencias.push(divergencia)
  }

  // Logo depois do `Calcular` da fórmula `indice` (0-based): lê a tabela de trabalho e confere que
  // ela é desta fórmula (outra sessão com o mesmo funcionário sobrescreve a tabela).
  // O PS01 só confirma a transação do cálculo quando o fluxo segue (a da última fórmula fica aberta
  // enquanto a 046 está na tela): tenta por até `tentativas` × `intervaloMs` antes de acusar interferência.
  async registrarCalculo(indice, totaisDaTela, { tentativas = 20, intervaloMs = 3000 } = {}) {
    const definicao = this.orcamento.formulas[indice]
    const funcionario = funcionarioDaSuite()
    let tabela
    let diferencas = []
    for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
      tabela = (await lerTabelaDeTrabalho(funcionario)).get(indice + 1)
      diferencas = tabela ? diferencasDaEntrada(tabela, definicao) : []
      if (tabela && parametrosConferem(tabela.parametros, definicao) && !diferencas.length) break
      if (tentativa < tentativas) await new Promise((resolve) => setTimeout(resolve, intervaloMs))
    }
    if (!tabela || !parametrosConferem(tabela.parametros, definicao)) {
      throw new Error(`interferência na tabela de trabalho: a fórmula ${indice + 1} do orçamento "${this.chave}" não está na ATENDIMENTO_CALC1 do funcionário ${funcionario} (PARAMETROS: ${tabela?.parametros || 'vazio'})`)
    }
    // Mesmos produtos, outra entrada: a automação digitou diferente da massa (ex.: múltiplo 12 em vez
    // de 2). O modelo calcularia sobre a entrada errada e o cenário passaria sem testar o prometido.
    if (diferencas.length) throw new Error(`entrada divergente da massa na fórmula ${indice + 1} do orçamento "${this.chave}": ${diferencas.join('; ')}`)
    this.formulas[indice] = { definicao, tabela, tela: totaisDaTela }
  }

  // Esperado de uma fórmula pelo modelo, a partir dos insumos do banco e das linhas da tabela de trabalho.
  async esperadoDaFormula(indice, aumentorPrescritor) {
    const { tabela } = this.formulas[indice]
    const rotulo = `F${indice + 1}`
    const forma = Number(campoDosParametros(tabela.parametros, 5))
    const multiplo = Number(campoDosParametros(tabela.parametros, 8)) || 1
    const qvd = Number(campoDosParametros(tabela.parametros, 9)) || 0
    const estoqueBaixa = Number(campoDosParametros(tabela.parametros, 12))
    const conf = await lerConfLoja(LOJA)
    const unidades = await lerUnidades()
    const dadosForma = await lerForma(forma, LOJA, estoqueBaixa)
    if (tabela.linhas.some((l) => l.nivelcalculo > 1)) throw new Error('regra não modelada: fórmula interna com mais de um nível')
    const filhosDe = (pai) => tabela.linhas.filter((l) => l.nivelcalculo === 1 && l.codigoproduto_f === pai.codigoproduto)

    const itens = []
    const conferencias = []
    const unidadeDe = (linha) => unidades.get(String(linha.unidade).toLowerCase())
    // Itens em % por último: o percentual incide sobre a soma dos ativos já calculados (CALC1).
    const ehPercentual = (linha) => unidadeDe(linha)?.calculo === 9
    const temQsp = tabela.linhas.some((l) => l.nivelcalculo === 0 && l.inclusaosistema === 0 && unidadeDe(l)?.calculo === 0)
    const linhasNivel0 = tabela.linhas.filter((l) => l.nivelcalculo === 0)
    const ordenadas = [...linhasNivel0.filter((l) => !ehPercentual(l)), ...linhasNivel0.filter(ehPercentual)]
    let somaDosAtivosSemFator = 0
    for (const linha of ordenadas) {
      // Fórmula de produção interna (linha nível 0 com itens de nível 1): itens pelo modelo, preço
      // da linha = soma correta dos itens. É aqui que aparece o bug do milhão (MOV_ATENDIMENTO_CALC2).
      const filhos = filhosDe(linha)
      if (filhos.length) {
        const preco = await this.conferirFormulaInterna(linha, filhos, { unidades, conf, rotulo, conferencias })
        conferencias.push(comparar('reais', `${rotulo} ${linha.codigoproduto} preço/u da fórmula interna`, preco, Number(linha.valorvenda)))
        itens.push({ linha, precoPorGrama: preco, quantidadeG: Number(linha.quantidadeg), densidade: 1, aplicaDensidade: false, aplicaPerda: false })
        continue
      }
      const produto = await lerFicha(linha.codigoproduto)
      const ficha = produto.principal !== produto.codigo ? await lerFicha(produto.principal) : produto
      const { lote, laudo } = await lerLoteELaudo(ficha.principal, linha.lote)
      const fatores = fatorTotal({ fatorCalculo: ficha.fatorCalculo, movimentoEstoque: ficha.movimentoEstoque, ficha, lote, laudo, calculoDensidade: conf.calculoDensidade })
      const preco = precoPorGrama({ valorVenda: produto.valorVenda, correcao: fatores.correcao, naoUtilizarFatorPreco: conf.naoUtilizarFatorPreco })
      const nome = `${rotulo} ${linha.codigoproduto}`
      let quantidadeG = Number(linha.quantidadeg)

      if (linha.inclusaosistema === 0) {
        // Guarda do cenário: o produto ainda usa a fonte de fatores que o caso promete (lote/laudo).
        conferirFonteDoFator(linha.codigoproduto, this.orcamento.fontesDoFator?.[linha.codigoproduto], fatores.fonte, linha.lote)
        if (ficha.movimentoEstoque === 1) conferencias.push(comparar('fator', `${nome} fator`, fatores.fator, Number(linha.fatorcorrecao)))
        conferencias.push(comparar('reais', `${nome} preço/g`, preco, Number(linha.valorvenda)))
        const unidadeInfo = unidadeDe(linha)
        if (!unidadeInfo) throw new Error(`regra não modelada: unidade "${linha.unidade}" (${nome}) fora da tabela UNIDADES do cálculo`)
        let esperadoG = null
        if (dadosForma.tipoInforme === 2 || [0, 3, 7].includes(unidadeInfo.calculo)) {
          // Total final (creme, xarope), qsp, gotas, ãã: quantidade não modelada, vem da tabela de
          // trabalho e fica LISTADA como não conferida (evidência + anexo do cenário), nunca em silêncio.
          this.naoConferidos.add(`${nome} gramas (${Number(linha.quantidade)} ${linha.unidade}; forma de tipo de informe ${dadosForma.tipoInforme})`)
        } else if (unidadeInfo.calculo === 9) {
          if (temQsp || dadosForma.tipoInforme !== 1) this.naoConferidos.add(`${nome} gramas (${Number(linha.quantidade)} % com qsp ou fora do tipo de informe 1)`)
          else esperadoG = gramasDePercentual({ percentual: Number(linha.quantidade), somaDosAtivosSemFator, fator: ficha.movimentoEstoque === 1 ? fatores.fator : 1 })
        } else {
          const porDose = gramasPorDose({ quantidade: Number(linha.quantidade), unidade: linha.unidade, unidadeInfo, referencias: referenciasEfetivas(ficha, produto, lote, laudo), fator: fatores.fator, movimentoEstoque: ficha.movimentoEstoque })
          esperadoG = dadosForma.tipoInforme === 1 && qvd > 0 && unidadeInfo.calculo !== 8 ? porDose * qvd : porDose
          if (unidadeInfo.calculo !== 8) somaDosAtivosSemFator += esperadoG / (ficha.movimentoEstoque === 1 && fatores.fator > 0 ? fatores.fator : 1)
        }
        if (esperadoG !== null) {
          conferencias.push(comparar('gramas', `${nome} gramas`, round4(esperadoG), round4(quantidadeG)))
          quantidadeG = esperadoG
        }
      } else {
        conferencias.push(comparar('reais', `${nome} preço/un`, preco, Number(linha.valorvenda)))
      }

      const aplicaDensidade = linha.inclusaosistema === 0 && UNIDADES_EM_ML.includes(String(linha.unidade).toLowerCase()) && conf.calculoDensidade === -1 &&
        dadosForma.naoUtilizarDensidade !== -1 && produto.unidade === 'g' && Number(linha.densidade) > 0
      const aplicaPerda = [1, 2].includes(ficha.movimentoEstoque) && produto.bloquearPerda !== -1 && linha.calculo !== 8 && linha.calculo < 10
      itens.push({ linha, precoPorGrama: preco, quantidadeG, densidade: Number(linha.densidade), aplicaDensidade, aplicaPerda })
    }

    // Cápsula e excipiente: a quantidade vem da tabela de trabalho (só o preço é conferido acima).
    // A escolha do sistema passa por uma 2ª rodada com excipiente mínimo por faixa de dose
    // (MOV_ATENDIMENTO_CALC10_1) que o modelo ainda não cobre: visto em 2026-11-05, 1 g/dose foi para
    // 2 cápsulas nº 0 e não 1 nº 00 (backlog, "regra não modelada").

    const valor = valorFormula({
      itens,
      multiplo,
      percentualPerda: dadosForma.percentualPerda,
      faixasIndice: dadosForma.faixasIndice,
      aumentorPrescritor,
      taxa: dadosForma.taxa,
      minimoPorQvd: dadosForma.minimoPorQvd(qvd),
      minimoAtendimento: dadosForma.minimoAtendimento,
    })
    return { forma, multiplo, qvd, itens, valor, conferencias }
  }

  // Itens (nível 1) de uma fórmula de produção interna usada na receita: gramas e preço/g de cada um
  // pelo modelo (regra correta do milhão) e o preço por unidade da linha da fórmula pela soma deles.
  async conferirFormulaInterna(pai, filhos, { unidades, conf, rotulo, conferencias }) {
    const formula = await lerFormulaInterna(pai.codigoproduto)
    const gramasDaFormula = Number(pai.quantidadeg)
    const itens = []
    for (const detalhe of formula.detalhes) {
      const linha = filhos.find((l) => l.codigoproduto === detalhe.codigoProduto)
      const nome = `${rotulo} ${pai.codigoproduto}→${detalhe.codigoProduto}`
      if (!linha) {
        conferencias.push(comparar('gramas', `${nome} item ausente na tabela de trabalho`, 1, undefined))
        continue
      }
      const produto = await lerFicha(detalhe.codigoProduto)
      const ficha = produto.principal !== produto.codigo ? await lerFicha(produto.principal) : produto
      const { lote, laudo } = await lerLoteELaudo(ficha.principal, linha.lote)
      const fatores = fatorTotal({ fatorCalculo: ficha.fatorCalculo, movimentoEstoque: ficha.movimentoEstoque, ficha, lote, laudo, calculoDensidade: conf.calculoDensidade })
      const unidadeInfo = unidades.get(detalhe.unidade)
      if (!unidadeInfo) throw new Error(`regra não modelada: unidade "${detalhe.unidade}" na fórmula interna ${formula.codigo}`)
      const porUnidade = gramasPorDose({ quantidade: detalhe.quantidade, unidade: detalhe.unidade, unidadeInfo, referencias: referenciasEfetivas(ficha, produto, lote, laudo), fator: fatores.fator, movimentoEstoque: ficha.movimentoEstoque })
      const gramas = (porUnidade * gramasDaFormula) / formula.pesoFormula
      const preco = precoPorGrama({ valorVenda: produto.valorVenda, correcao: fatores.correcao, naoUtilizarFatorPreco: conf.naoUtilizarFatorPreco })
      conferencias.push(comparar('gramas', `${nome} gramas (${detalhe.quantidade} ${detalhe.unidade})`, round4(gramas), round4(Number(linha.quantidadeg))))
      conferencias.push(comparar('reais', `${nome} preço/g`, preco, Number(linha.valorvenda)))
      itens.push({ precoPorGrama: preco, gramas })
    }
    return precoDaFormulaInterna(itens, gramasDaFormula)
  }

  // Depois de calcular todas as fórmulas: modelo × tabela de trabalho × valor da fórmula na tela.
  async conferirFormulas() {
    const naTela = valoresDasFormulasNaTela(this.formulas.map((f) => f.tela))
    const ultima = this.formulas.length - 1
    for (let i = 0; i < this.formulas.length; i++) {
      const esperado = await this.esperadoDaFormula(i, 0)
      this.formulas[i].esperado = esperado
      for (const c of esperado.conferencias) this.registrar(c)
      // A taxa só aparece na tela para a última fórmula; a das demais é conferida na A2 gravada.
      if (i === ultima) this.registrar(comparar('reais', `F${i + 1} tx. técnica (tela)`, esperado.valor.taxa, this.formulas[i].tela.txTecnica))
      this.registrar(comparar('reais', `F${i + 1} valor da fórmula (tela)`, esperado.valor.valor, naTela[i]))
    }
  }

  // Depois do `Gravar`: A2/A3 de cada fórmula e A1 do orçamento, já com o acréscimo do prescritor.
  async conferirGravado(codigo, prescritor, totaisDaTela) {
    const aumentor = await lerAumentor(prescritor)
    const gravado = await lerOrcamentoGravado(codigo)
    this.gravado = { codigo, prescritor, aumentor, ...gravado, tela: totaisDaTela }
    if (!gravado.a1) throw new Error(`divergência de cálculo: orçamento ${codigo} não encontrado em ATENDIMENTO_A1`)
    const valores = []
    for (let i = 0; i < this.formulas.length; i++) {
      // A gravação veio da tabela de trabalho: outra sessão com o mesmo funcionário entre a leitura e o
      // Gravar troca os produtos da fórmula. Isso é interferência, não divergência de cálculo.
      const a3DaFormula = gravado.a3.filter((l) => l.numeroformula === i + 1)
      if (!produtosDoGravadoConferem(a3DaFormula, this.formulas[i].definicao)) {
        throw new Error(`interferência na tabela de trabalho: a fórmula ${i + 1} do orçamento ${codigo} foi gravada com outros produtos (${a3DaFormula.filter((l) => l.inclusaosistema === 0).map((l) => l.codigo_produto).join(', ')})`)
      }
      const esperado = await this.esperadoDaFormula(i, aumentor)
      valores.push(esperado.valor.valor)
      const a2 = gravado.a2.find((f) => f.numeroformula === i + 1)
      this.registrar(comparar('reais', `F${i + 1} valor gravado (A2)`, esperado.valor.valor, a2 ? Number(a2.valorformula_venda) : undefined))
      this.registrar(comparar('reais', `F${i + 1} tx. técnica gravada (A2)`, esperado.valor.taxa, a2 ? Number(a2.valor_taxatecnica) : undefined))
      esperado.itens.forEach((item, n) => {
        const a3 = gravado.a3.find((l) => l.numeroformula === i + 1 && l.codigo_produto === item.linha.codigoproduto && l.inclusaosistema === item.linha.inclusaosistema)
        this.registrar(comparar('reais', `F${i + 1} ${item.linha.codigoproduto} valor gravado (A3)`, round4(esperado.valor.itens[n]), a3 ? Number(a3.valorvenda) : undefined))
      })
    }
    const total = valorOrcamento(valores)
    this.registrar(comparar('reais', 'orçamento gravado (A1)', total, Number(gravado.a1.valorvenda)))
    this.registrar(comparar('reais', 'orçamento na tela (Valores)', total, totaisDaTela.valorOrcamento))
    return total
  }

  falharSeDivergiu() {
    if (this.divergencias.length) {
      throw new Error(`divergência de cálculo no orçamento "${this.chave}" (${this.divergencias.length}):\n${tabelaDeDivergencias(this.divergencias)}`)
    }
  }

  tabela() {
    return tabelaDeDivergencias(this.divergencias)
  }

  // Evidência para conferência posterior (pasta da execução): JSON completo + índice dos gravados.
  salvarEvidencia(pastaDaSessao) {
    const pasta = path.join(pastaDaSessao, 'calculo')
    mkdirSync(pasta, { recursive: true })
    const resumo = {
      orcamento: this.chave,
      cenario: this.orcamento.cenario,
      formulas: this.formulas.map((f) => ({ definicao: f.definicao, parametros: f.tabela?.parametros, linhas: f.tabela?.linhas, tela: f.tela, esperado: f.esperado && { ...f.esperado, itens: f.esperado.itens.map((i) => ({ ...i, linha: i.linha.codigoproduto })) } })),
      gravado: this.gravado,
      naoConferidos: this.listaNaoConferidos(),
      divergencias: this.divergencias,
    }
    writeFileSync(path.join(pasta, `${this.orcamento.cenario}-${this.chave}.json`), JSON.stringify(resumo, null, 2))
    if (this.gravado) {
      appendFileSync(path.join(pasta, 'orcamentos-gravados.jsonl'), `${JSON.stringify({ cenario: this.orcamento.cenario, orcamento: this.chave, codigo: this.gravado.codigo, em: new Date().toISOString(), tela: this.gravado.tela, divergencias: this.divergencias.length })}\n`)
    }
  }
}
