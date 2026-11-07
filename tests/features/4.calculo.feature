# language: pt
Funcionalidade: Cálculo da receita
  Como farmacêutico
  Quero que o orçamento calcule quantidade, fator e valor de cada fórmula corretamente
  Para cobrar e manipular o que a receita pede, de acordo com a ficha, o lote e a forma

  # Cada cenário é UM orçamento com várias fórmulas do mesmo tema, gravado para conferência.
  # O esperado vem do modelo (tests/support/calculo/modelo.js) com os insumos lidos do banco
  # na hora (somente leitura); massa em tests/fixtures/calculo/orcamentos.json.

  Cenário: 4.1 Unidades de prescrição em um orçamento
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    E os produtos do orçamento "unidades" têm a configuração esperada na ficha
    Quando abro a tela de receita
    E monto e calculo as fórmulas do orçamento "unidades"
    E escolho o paciente e o prescritor do orçamento
    Então cada fórmula calculada confere com o modelo de cálculo
    Quando recalculo e gravo o orçamento
    Então o orçamento gravado confere com o modelo de cálculo

  Cenário: 4.2 Fatores da ficha do produto em um orçamento
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    E os produtos do orçamento "fatores-ficha" têm a configuração esperada na ficha
    Quando abro a tela de receita
    E monto e calculo as fórmulas do orçamento "fatores-ficha"
    E escolho o paciente e o prescritor do orçamento
    Então cada fórmula calculada confere com o modelo de cálculo
    Quando recalculo e gravo o orçamento
    Então o orçamento gravado confere com o modelo de cálculo

  Cenário: 4.3 Fatores do lote e do laudo em um orçamento
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    E os produtos do orçamento "lote-laudo" têm a configuração esperada na ficha
    Quando abro a tela de receita
    E monto e calculo as fórmulas do orçamento "lote-laudo"
    E escolho o paciente e o prescritor do orçamento
    Então cada fórmula calculada confere com o modelo de cálculo
    Quando recalculo e gravo o orçamento
    Então o orçamento gravado confere com o modelo de cálculo

  Cenário: 4.4 Lactobacilos em bilhão, milhão e UFC digitados
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    E os produtos do orçamento "lactobacilos-digitados" têm a configuração esperada na ficha
    Quando abro a tela de receita
    E monto e calculo as fórmulas do orçamento "lactobacilos-digitados"
    E escolho o paciente e o prescritor do orçamento
    Então cada fórmula calculada confere com o modelo de cálculo
    Quando recalculo e gravo o orçamento
    Então o orçamento gravado confere com o modelo de cálculo

  Cenário: 4.6 Regras da forma farmacêutica em um orçamento
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    E os produtos do orçamento "regras-da-forma" têm a configuração esperada na ficha
    Quando abro a tela de receita
    E monto e calculo as fórmulas do orçamento "regras-da-forma"
    E escolho o paciente e o prescritor do orçamento
    Então cada fórmula calculada confere com o modelo de cálculo
    Quando recalculo e gravo o orçamento
    Então o orçamento gravado confere com o modelo de cálculo

  Cenário: 4.7 Múltiplo, taxa técnica e acréscimo do prescritor
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    E os produtos do orçamento "multiplo-prescritor" têm a configuração esperada na ficha
    Quando abro a tela de receita
    E monto e calculo as fórmulas do orçamento "multiplo-prescritor"
    E escolho o paciente e o prescritor do orçamento
    Então cada fórmula calculada confere com o modelo de cálculo
    Quando recalculo e gravo o orçamento
    Então o orçamento gravado confere com o modelo de cálculo

  # Bug do produto: item em milhão (mlh) de fórmula de produção interna usada na receita sai ×1000
  # (MOV_ATENDIMENTO_CALC2 reatribui quantidade ÷ UFC sem o ÷1000 do milhão). Os mesmos itens digitados
  # (4.4) calculam certo. Chamado: OS 362031. Vermelho proposital desde 2026-11-05: fora
  # da execução padrão (`npm run test:bugs`); quando corrigirem, tirar a tag @bug.
  @bug
  Cenário: 4.5 Lactobacilos por fórmula de produção interna
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    E os produtos do orçamento "lactobacilos-formula-interna" têm a configuração esperada na ficha
    Quando abro a tela de receita
    E monto e calculo as fórmulas do orçamento "lactobacilos-formula-interna"
    E escolho o paciente e o prescritor do orçamento
    Então cada fórmula calculada confere com o modelo de cálculo
    Quando recalculo e gravo o orçamento
    Então o orçamento gravado confere com o modelo de cálculo
