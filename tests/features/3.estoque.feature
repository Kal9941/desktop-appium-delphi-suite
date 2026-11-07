# language: pt
Funcionalidade: Estoque
  Como responsável pelo estoque
  Quero repor o saldo de um lote de três formas diferentes
  Para ter matéria-prima disponível na baixa das receitas

  Cenário: 3.1 Repõe o estoque com a entrada de um lote novo
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    Quando abro o cadastro de produtos com o produto de estoque
    Então registro o checkpoint "produto-carregado" pela captura do SO
    Quando registro a entrada de um lote novo pela tela de lotes e estoques
    Então registro o checkpoint "lote-gravado" pela captura do SO

  Cenário: 3.2 Repõe o estoque com a conferência do saldo do lote
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    Quando abro o cadastro de produtos com o produto de estoque
    Então registro o checkpoint "produto-carregado" pela captura do SO
    Quando confiro o saldo do lote pela movimentação de estoque
    Então registro o checkpoint "saldo-conferido" pela captura do SO

  Cenário: 3.3 Repõe o estoque importando uma NF-e de compra
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    Quando abro a importação de NF-e e carrego uma NF-e nova
    Então registro o checkpoint "nfe-carregada" pela captura do SO
    Quando relaciono os itens da NF-e em gramas
    Então registro o checkpoint "itens-relacionados" pela captura do SO
    Quando importo a NF-e e consulto a compra gerada
    Então registro o checkpoint "compra-gerada" pela captura do SO
