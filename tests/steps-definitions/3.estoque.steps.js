import { When } from '@cucumber/cucumber'
import { expect } from 'expect-webdriverio'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ImportarNFePage } from '../pages/ImportarNFePage.js'
import { LotePage } from '../pages/LotePage.js'
import { MainPage } from '../pages/MainPage.js'
import { MovimentacaoEstoquePage } from '../pages/MovimentacaoEstoquePage.js'
import { ProdutoPage } from '../pages/ProdutoPage.js'
import {
  aguardarJanelaComTitulo,
  listarDialogosAbertos,
  responderJanelaDeTopoSemUia,
} from '../support/appLifecycle.js'
import { getSessionLabel } from '../support/sessionLabel.js'
import { gerarXmlDeNfeNova } from '../support/nfe.js'
import { registrarCheckpointDoSO } from '../support/checkpoint.js'
import { pausa } from '../support/teclado.js'

// Massa curada do estoque (produto, códigos de cadastro e quantidades): `tests/fixtures/estoque.json`.
const dados = JSON.parse(readFileSync(new URL('../fixtures/estoque.json', import.meta.url), 'utf-8'))

// Prazo próprio para steps que fazem várias interações (o padrão do Cucumber é 60 s).
const PRAZO_STEP_LONGO = 180000

let produtoPage

// Falha cedo e explícito se algum valor da massa estiver vazio, em vez de digitar "" no app.
function exigirPreenchido(grupo, valores) {
  const vazios = Object.entries(valores).filter(([, valor]) => !valor).map(([chave]) => chave)
  if (vazios.length > 0) {
    throw new Error(`Preencha tests/fixtures/estoque.json (${grupo}): faltam ${vazios.join(', ')}`)
  }
}

async function abrirProdutoDeEstoque() {
  exigirPreenchido('produtoCodigo', { produtoCodigo: dados.produtoCodigo })
  await new MainPage(driver).abrirTelaPorNumero(112)
  produtoPage = new ProdutoPage(driver)
  await produtoPage.aguardarAbrir()
  await produtoPage.abrirPeloCodigo(dados.produtoCodigo)
}

// Os 3 cenários terminam com nenhum diálogo aberto: sem isto um "Atenção" sem resposta deixaria
// o cenário passar em falso (o checkpoint sozinho não afirma nada).
async function esperarSemDialogos() {
  await pausa(2000)
  expect(await listarDialogosAbertos()).toEqual([])
}

When('abro o cadastro de produtos com o produto de estoque', { timeout: PRAZO_STEP_LONGO }, abrirProdutoDeEstoque)

// 3.1: entrada de lote pela 216 (aberta pelo menu de contexto da grade de estoque da 112).
When('registro a entrada de um lote novo pela tela de lotes e estoques', { timeout: PRAZO_STEP_LONGO }, async function () {
  exigirPreenchido('entrada', dados.entrada)
  await produtoPage.abrirEntradaDeLote()
  const lote = new LotePage(driver)
  await lote.preencher('tipoEstoque', dados.entrada.tipoEstoque)
  await lote.preencher('origem', dados.entrada.origem)
  await lote.preencher('fornecedor', dados.entrada.fornecedor)
  await lote.preencher('fabricante', dados.entrada.fabricante)
  await lote.preencher('quantidadeEntrada', dados.entrada.quantidade)
  await registrarCheckpointDoSO('lote-preenchido')
  await lote.gravar()
  await pausa(3000)
  await esperarSemDialogos()
  expect(await lote.fechar()).toBe(true)
  await pausa(2000)
})

// 3.2: conferência pela 425 (aberta pelo mesmo menu de contexto): o saldo do lote passa a ser a Qtde.
When('confiro o saldo do lote pela movimentação de estoque', { timeout: PRAZO_STEP_LONGO }, async function () {
  exigirPreenchido('conferencia', dados.conferencia)
  await produtoPage.abrirMovimentacaoDeEstoque()
  const movimentacao = new MovimentacaoEstoquePage(driver)
  await movimentacao.escolherConferencia()
  await movimentacao.informarQuantidade(dados.conferencia.quantidade)
  await registrarCheckpointDoSO('conferencia-preenchida')
  expect(await movimentacao.processar()).toBe(true)
  await pausa(3000)
  await esperarSemDialogos()
})

// 3.3: importação de NF-e pela 218. Cada execução usa um XML com número e chave novos (o app barra
// a NF-e repetida).
let importarPage
let nfe

When('abro a importação de NF-e e carrego uma NF-e nova', { timeout: PRAZO_STEP_LONGO }, async function () {
  exigirPreenchido('nfe', dados.nfe)
  nfe = gerarXmlDeNfeNova(
    path.resolve(dados.nfe.arquivoModelo),
    path.resolve('tests', 'reports', getSessionLabel(), 'nfe')
  )
  await new MainPage(driver).abrirTelaPorNumero(218)
  importarPage = new ImportarNFePage(driver)
  await importarPage.aguardarAbrir()
  await importarPage.limpar()
  // Com rascunho na tela o app pergunta "Ao limpar os registros serão excluídos! Confirma?"; com a
  // tela vazia não pergunta nada, por isso a espera é curta e a ausência do aviso é tolerada.
  try {
    await responderJanelaDeTopoSemUia('Atenção', 'Sim', { timeoutMs: 4000 })
  } catch {
    // sem rascunho: nada a confirmar
  }
  await pausa(1500)
  await importarPage.marcarImportacaoManual()
  await registrarCheckpointDoSO('importacao-aberta')
  await importarPage.abrirJanelaDoXml()
  await importarPage.preencherCampoDoXml('origem', dados.nfe.origem)
  await importarPage.preencherCampoDoXml('localizacaoEstoque', dados.nfe.localizacaoEstoque)
  await importarPage.preencherCampoDoXml('lancamentoDuplicata', dados.nfe.lancamentoDuplicata)
  await importarPage.preencherCampoDoXml('naturezaOperacao', dados.nfe.naturezaOperacao)
  await registrarCheckpointDoSO('janela-xml-preenchida')
  expect(await importarPage.selecionarArquivo(nfe.caminho)).toBe(true)
  // A carga do XML leva uns 6 s para preencher a grade (gravação de 2026-10-29).
  await pausa(6000)
})

// Os 3 itens do XML vêm em kg (3, 0,25 e 5): cada um é relacionado ao produto em gramas.
When('relaciono os itens da NF-e em gramas', { timeout: PRAZO_STEP_LONGO }, async function () {
  const fechou = await importarPage.relacionarItens(dados.nfe.quantidadesEmGramas)
  if (!fechou) await registrarCheckpointDoSO('relacionar-nao-fechou')
  expect(fechou).toBe(true)
  await pausa(1500)
  expect(await listarDialogosAbertos()).toEqual([])
})

When('importo a NF-e e consulto a compra gerada',{ timeout: PRAZO_STEP_LONGO }, async function () {
  await importarPage.importarNfe()
  // "Atenção" de confirmação e depois "Importação concluída ... Deseja consultar?": sem UIA, a 218
  // é MDI (ver ImportarNFePage.js). Responder Sim abre a 132 com a compra gerada.
  await responderJanelaDeTopoSemUia('Atenção', 'Sim')
  await registrarCheckpointDoSO('importacao-concluida')
  await responderJanelaDeTopoSemUia('Atenção', 'Sim')
  await aguardarJanelaComTitulo('[ 132 ]')
  await pausa(2000)
})
