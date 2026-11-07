import { BasePage } from './BasePage.js'
import {
  aguardarJanelaComTitulo,
  aguardarJanelaFechar,
  clicarDuploFisico,
  clicarFisico,
  clicarFisicoNaJanelaDeTopo,
  clicarFisicoSemAtivar,
} from '../support/appLifecycle.js'
import { digitar, pausa, teclar, VK } from '../support/teclado.js'
import { registrarCheckpointDoSO } from '../support/checkpoint.js'
import { contarPixelsEscuros } from '../support/windowsNative.js'

// Tela 218 — Importar NF-e (`TfMOV_0218`) e a janela filha "Importar NF-e - XML". Só Win32:
// cliques do SO em coordenadas ABSOLUTAS (gravação de 2026-10-29, 1366x768 maximizada) e teclado.
// Os avisos "Atenção" se respondem em `3.estoque.steps.js` (sem UIA: a 218 é MDI e a consulta da
// sessão pode fechá-la, como nas telas do Omni).
const IMPORTAR_XML = { x: 1172, y: 123 } // botão no topo da 218 (TPanel)
const IMPORTAR_NFE = { x: 1213, y: 656 } // TBitBtn no rodapé da 218
const LIMPAR = { x: 193, y: 668 } // TBitBtn no rodapé da 218
const IMPORTACAO_MANUAL = { x: 1264, y: 161 } // TCheckBox no topo da 218

// Campos da janela "Importar NF-e - XML" (`TJPsCodigo`, centros do código em x ~ 505).
const CAMPOS_XML = {
  origem: { x: 505, y: 320 },
  localizacaoEstoque: { x: 505, y: 356 },
  lancamentoDuplicata: { x: 505, y: 392 },
  naturezaOperacao: { x: 505, y: 428 },
}
const DESCRICAO_X = 565 // início do texto da descrição do cadastro (x ~ 546 a 660), ao lado do código
const TENTATIVAS_CAMPO = 3
const IMPORTAR_XML_DA_JANELA = { x: 833, y: 510 } // TBitBtn "Importar XML" da janela filha

// A janela filha é de topo: `clicarFisico` reativa a principal e ela a cobre (visto em 2026-10-29,
// captura só com a 218). Os cliques dentro dela ativam a PRÓPRIA janela.
const JANELA_XML = '[ 218 ] - Importar NF-e - XML'

// Grade de itens da 218 e janela filha "Relacionar produtos" (título com espaço no fim).
const PRIMEIRO_ITEM = { x: 323, y: 237 } // coluna do nome, linha do item 1 (TDBGrid)
const JANELA_RELACIONAR = '[ 218 ] - Importar NF-e - Relacionar produtos '
const UNIDADE = { x: 1092, y: 326 } // TJPsComboBox "Quantidade/ Unidade" (parte de baixo)
const UNIDADE_GRAMAS = { x: 1070, y: 343 } // 1º item da lista (`ComboLBox`: g, ml, u)
const QUANTIDADE = { x: 1036, y: 325 } // TJPsValor
const INCLUIR_ALTERAR = { x: 430, y: 541 } // TBitBtn

export class ImportarNFePage extends BasePage {
  async aguardarAbrir() {
    await aguardarJanelaComTitulo('[ 218 ]')
    // O título aparece antes de a tela estar pronta (mesmo padrão da 145).
    await pausa(3000)
  }

  // A 218 guarda a NF-e em andamento entre execuções (reabrir já a traz carregada e sem `Importar
  // XML`): `Limpar` descarta o rascunho antes de carregar a nota nova.
  async limpar() {
    await clicarFisico(LIMPAR.x, LIMPAR.y)
    await pausa(1500)
  }

  // A gravação de 2026-10-29 marcou "Importação manual" ANTES de `Importar XML`.
  async marcarImportacaoManual() {
    await clicarFisico(IMPORTACAO_MANUAL.x, IMPORTACAO_MANUAL.y)
    await pausa(800)
  }

  async abrirJanelaDoXml() {
    await clicarFisico(IMPORTAR_XML.x, IMPORTAR_XML.y)
    await aguardarJanelaComTitulo('Importar NF-e - XML')
    await pausa(1500)
  }

  // O app GUARDA os valores desta janela entre execuções (gravação de 2026-10-29: o operador só
  // clicou nos campos, sem digitar) e, num campo já preenchido, selecionar e redigitar o código o
  // deixava vazio. Com o código aceito o app mostra a descrição ao lado (texto escuro): campo com
  // descrição fica como está; vazio recebe o código e é conferido de novo.
  async preencherCampoDoXml(nome, codigo) {
    const { x, y } = CAMPOS_XML[nome]
    const preenchido = async () => (await contarPixelsEscuros(DESCRICAO_X, y, { raio: 14 })) > 0
    if (await preenchido()) return
    for (let tentativa = 1; tentativa <= TENTATIVAS_CAMPO; tentativa++) {
      await clicarFisicoNaJanelaDeTopo(JANELA_XML, x, y)
      await pausa(500)
      // Caractere a caractere: campo com busca abre "Localizar registro..." no 1º caractere e
      // engole os seguintes quando eles chegam juntos.
      for (const caractere of String(codigo)) {
        await digitar(caractere)
        await pausa(300)
      }
      await registrarCheckpointDoSO(`campo-${nome}-digitado`)
      await teclar(VK.ENTER)
      await pausa(800)
      if (await preenchido()) return
      console.warn(`[218] Campo "${nome}" ficou vazio (tentativa ${tentativa}/${TENTATIVAS_CAMPO})`)
      await registrarCheckpointDoSO(`campo-${nome}-vazio`)
    }
    throw new Error(`A janela "Importar NF-e - XML" não aceitou o campo "${nome}" (código ${codigo}).`)
  }

  // "Importar XML" da janela filha abre o seletor de arquivo do SO ("Selecione a NF-e"), já com o
  // foco no campo Nome: digita o caminho completo e confirma com Enter.
  async selecionarArquivo(caminho) {
    await clicarFisicoNaJanelaDeTopo(JANELA_XML, IMPORTAR_XML_DA_JANELA.x, IMPORTAR_XML_DA_JANELA.y)
    await aguardarJanelaComTitulo('Selecione a NF-e')
    await pausa(1500)
    await digitar(caminho)
    await pausa(300)
    await teclar(VK.ENTER)
    return aguardarJanelaFechar('Selecione a NF-e', { timeoutMs: 15000 })
  }

  // Gravação de 2026-10-29: duplo clique no 1º item da grade abre "Relacionar produtos" e, a cada
  // `Incluir/ Alterar`, a janela avança sozinha para o item seguinte (some depois do último). Em cada
  // item: unidade `g` (o XML vem em kg e o produto estava em `u`) e a quantidade em gramas.
  async relacionarItens(quantidadesEmGramas) {
    await clicarDuploFisico(PRIMEIRO_ITEM.x, PRIMEIRO_ITEM.y)
    await aguardarJanelaComTitulo('Relacionar produtos')
    // O título aparece antes de a tela estar pronta (mesmo padrão da 145).
    await pausa(2500)
    for (const quantidade of quantidadesEmGramas) {
      await clicarFisicoNaJanelaDeTopo(JANELA_RELACIONAR, UNIDADE.x, UNIDADE.y)
      await pausa(800)
      // A lista do combo é um popup: sem reativar a janela, ou ela fecha.
      await clicarFisicoSemAtivar(UNIDADE_GRAMAS.x, UNIDADE_GRAMAS.y)
      await pausa(800)
      await clicarFisicoNaJanelaDeTopo(JANELA_RELACIONAR, QUANTIDADE.x, QUANTIDADE.y)
      // O campo já vem com a quantidade do XML ("3") e Home+Shift+End não seleciona campo numérico:
      // sem apagar, o texto digitado é acrescentado ("33.000", visto em 2026-10-29 16:40).
      await teclar(VK.END)
      for (let i = 0; i < 10; i++) await teclar(VK.BACKSPACE)
      await digitar(String(quantidade))
      await pausa(500)
      await clicarFisicoNaJanelaDeTopo(JANELA_RELACIONAR, INCLUIR_ALTERAR.x, INCLUIR_ALTERAR.y)
      await pausa(2000)
    }
    return aguardarJanelaFechar('Relacionar produtos', { timeoutMs: 15000 })
  }

  async importarNfe() {
    await clicarFisico(IMPORTAR_NFE.x, IMPORTAR_NFE.y)
  }
}
