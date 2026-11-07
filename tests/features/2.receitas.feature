# language: pt
Funcionalidade: Receitas
  Como atendente do sistema
  Quero criar e acompanhar receitas alopáticas
  Para atender o paciente da entrada do orçamento até a baixa

  Cenário: 2.1 Cria orçamento de receita alopática
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    Quando abro a tela de receita
    E monto a fórmula de teste com o produto de teste
    E calculo a fórmula
    E escolho o paciente e o prescritor de teste
    E recalculo a fórmula e gravo a receita
    Então a receita recebe um código
    E registro o checkpoint "receita-gravada"

  Cenário: 2.2 Conclui a receita com entrega para amanhã
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    Quando preparo uma receita alopática gravada
    E marco a receita como concluída e informo a entrega para amanhã às 10h
    E gravo a receita concluída
    Então registro o checkpoint "receita-concluida"

  # @pesagem: antes de abrir o app, confere no banco a 445 deste computador (SEM BALANÇA) e o
  # processo padrão do funcionário da suíte (hook Before em 2.receitas.steps.js, 2026-11-06).
  @pesagem
  Cenário: 2.3 Registra o processo e a baixa da receita concluída
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    Quando preparo uma receita alopática concluída
    Quando registro a baixa da receita pela pesagem monitorada
    Então registro o checkpoint "baixa-registrada"

  Cenário: 2.4 Cria a receita pelo Omni Channel e envia o orçamento
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    Quando abro o Omni Channel e inicio o atendimento com o telefone do operador
    Então registro o checkpoint "atendimento-aberto" pela captura do SO
    Quando desmarco os movimentos que já estavam no atendimento do Omni
    Então registro o checkpoint "movimentos-desmarcados" pela captura do SO
    Quando crio o orçamento da receita pelo atendimento do Omni
    Então registro o checkpoint "orcamento-gravado" pela captura do SO
    Quando fecho a receita e envio o orçamento pelo Omni
    Então a mensagem enviada pelo Omni traz só o orçamento novo
    E registro o checkpoint "orcamento-enviado" pela captura do SO
