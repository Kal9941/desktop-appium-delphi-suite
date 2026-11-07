// Contrato da leitura de insumos da suíte 4.calculo CONTRA O BANCO (somente leitura; precisa de VPN e
// da chave `banco` no env.local.json): `npm run calculo:contrato`. Os valores são os conferidos em
// 2026-11-05; se o banco mudar (ficha, lote, laudo), atualizar o caso e anotar no HISTORICO.md.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { fecharBanco } from '../tests/support/banco/conexao.js'
import { lerFicha, lerLoteELaudo, lerForma, lerFormulaInterna, conferirPreCondicoes, lerAumentor } from '../tests/support/calculo/insumos.js'
import { fatorTotal } from '../tests/support/calculo/modelo.js'

after(fecharBanco)

test('1001910: umidade ligada na ficha → fator 1,0375', async () => {
  const f = await lerFicha(1001910)
  assert.equal(fatorTotal({ fatorCalculo: f.fatorCalculo, movimentoEstoque: f.movimentoEstoque, ficha: f, lote: null, laudo: null }).fator, 1.0375)
})

test('1004866 resolve o principal 1004813 e o lote 140125.14143 (conc 90)', async () => {
  const f = await lerFicha(1004866)
  assert.equal(f.principal, 1004813)
  const { lote } = await lerLoteELaudo(1004813, '140125.14143')
  assert.equal(lote.concentracao, 90)
})

test('1000503 lote 25122281 traz o laudo de concentração 30,19', async () => {
  const { laudo } = await lerLoteELaudo(1000503, '25122281')
  assert.equal(laudo.concentracao, 30.19)
})

test('forma 1 (creme) tem índice 90/20 e 300/10 e mínimo 50 no total 30', async () => {
  const forma = await lerForma(1, 1, 4)
  assert.deepEqual(forma.faixasIndice, [{ valor: 90, indice: 20 }, { valor: 300, indice: 10 }])
  assert.equal(forma.minimoPorQvd(30), 50)
})

test('forma 2 (cápsula) com taxa fixa 10 na loja 1, estoque 4', async () => {
  const forma = await lerForma(2, 1, 4)
  assert.deepEqual([forma.taxa.tipo, forma.taxa.valor, forma.multiplicarTaxa], [1, 10, -1])
})

test('fórmula interna do 1005946 (1094) tem 4 itens, 1 em mlh', async () => {
  const f = await lerFormulaInterna(1005946)
  assert.equal(f.codigo, 1094)
  assert.equal(f.detalhes.length, 4)
  assert.equal(f.detalhes.filter((d) => d.unidade === 'mlh').length, 1)
})

test('pré-condição violada é listada em pt-BR', async () => {
  const violacoes = await conferirPreCondicoes([{ produto: 1001910, UMIDADE_UC: 0 }])
  assert.deepEqual(violacoes, ['1001910: UMIDADE_UC deveria ser 0 (está -1)'])
})

test('pré-condição atendida não lista nada (inclui forma liberada e mlh da fórmula interna)', async () => {
  assert.deepEqual(await conferirPreCondicoes([{ produto: 1001910, UMIDADE_UC: -1, UMIDADE: '>0', formaLiberada: 2 }, { produto: 1005946, itensMlhNaFormulaInterna: 1 }]), [])
})

test('produto restrito a outra forma é violação (1005079 em cápsula)', async () => {
  const violacoes = await conferirPreCondicoes([{ produto: 1005079, formaLiberada: 2 }])
  assert.equal(violacoes.length, 1)
})

test('acréscimo dos prescritores de teste', async () => {
  assert.equal(await lerAumentor(14991), 0)
  assert.equal(await lerAumentor(7), 10)
})

test('produto TRANSPARENTE ignora a restrição de forma (1005813 em cápsula, como o MOV_ATENDIMENTO_CALC1)', async () => {
  assert.deepEqual(await conferirPreCondicoes([{ produto: 1005813, formaLiberada: 2 }]), [])
})

// ---- Guarda de cenário: a forma ainda tem a regra que o cenário exercita (índice, mínimos) ----
import { conferirPreCondicoesDoOrcamento } from '../tests/support/calculo/cenario.js'

test('forma 1 tem índice e mínimo 50 no total 30; formas 3 e 5 com mínimo 55', async () => {
  await conferirPreCondicoesDoOrcamento({ precondicoesDaForma: [
    { forma: 1, estoque: 4, temIndice: true, minimoPorQvd: { qvd: 30, valor: 50 } },
    { forma: 3, estoque: 4, minimoAtendimento: 55 },
    { forma: 5, estoque: 5, minimoAtendimento: 55 },
  ] })
})

test('forma sem a regra esperada é pré-condição', async () => {
  await assert.rejects(conferirPreCondicoesDoOrcamento({ precondicoesDaForma: [{ forma: 2, estoque: 4, temIndice: true }] }), /pré-condição: forma 2: sem índice de preço/)
})

// ---- Guarda do prescritor: o "com acréscimo" tem AUMENTOR > 0 e o "sem acréscimo" tem 0 ----
import { conferirPrescritor } from '../tests/support/calculo/cenario.js'

test('prescritor confere com o acréscimo que o orçamento pede', async () => {
  await conferirPrescritor({ prescritor: 'comAcrescimo' }, 7)
  await conferirPrescritor({ prescritor: 'semAcrescimo' }, 14991)
  await assert.rejects(conferirPrescritor({ prescritor: 'comAcrescimo' }, 14991), /pré-condição: prescritor 14991 deveria ter acréscimo/)
  await assert.rejects(conferirPrescritor({ prescritor: 'semAcrescimo' }, 7), /pré-condição: prescritor 7 não deveria ter acréscimo/)
})
