# language: pt
Funcionalidade: OS abertas
  Como QA de Automa��o
  Quero reproduzir no app o problema de cada OS aberta
  Para confirmar no exe corrigido que o comportamento pedido pelo cliente voltou

  # OS 364644 (cliente 827, 26.5.1.9): na 418, abrir o atendimento de OUTRO atendente apagava
  # o "!" (mensagens não lidas). Esperado: só o responsável, ao abrir, marca como lido. Roda em
  # cada regra da 635 "Mensagens lidas" (0 = quando o atendente visualizar; 1 = visualizar ou
  # alguém responder; 2 = quando alguém responder): em nenhuma, abrir o de outro marca como lido.
  # A regra é configuração global: o cenário devolve o valor original no fim (e o After, se falhar).
  # A massa vem do banco a cada rodada (hook Before em 0.os.steps.js).
  @os-364644
  Esquema do Cenário: 0.1 OS 364644 - abrir atendimento de outro atendente mantém a notificação de não lidas (regra <regra>)
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    Quando configuro na 635 as mensagens lidas com a regra <regra>
    E abro na 418 o atendimento de outro atendente com mensagens não lidas
    E fecho o atendimento e atualizo a lista
    Então a notificação de mensagens não lidas continua no atendimento com a regra <regra>
    E restauro na 635 a regra original de mensagens lidas

    Exemplos:
      | regra |
      | 0     |
      | 1     |
      | 2     |

  # @bug (2026-11-06, OS 361422, ROADMAP P2-15): na 145, forma com informe por Total múltiplo, o item em %
  # incluído à mão ignora os ativos em mg/mcg (MOV_ATENDIMENTO_CALC1 ordena pela quantidade digitada e
  # V_QTDEMAIOR substitui em vez de somar). Mesma fórmula da receita 261001707 (demostore): esperado
  # 0,4245 g de essência (10% da soma dos ativos, como pelo vínculo dos conservantes); hoje sai 0,37.
  # Fica fora da execução padrão; roda com npm run test:bugs. Sai do @bug quando a OS for corrigida.
  @bug @os-361422
  Cenário: 0.2 OS 361422 - item em percentual considera os ativos em mg na forma por Total múltiplo
    Dado que estou na tela de login
    Quando informo usuário e senha válidos
    Então vejo a tela principal
    Quando abro a tela de receita
    E monto e calculo a fórmula da OS 361422 com a essência em percentual incluída à mão
    E escolho o paciente e o prescritor de teste
    E recalculo e gravo a receita da OS 361422
    Então a essência em percentual é calculada sobre todos os ativos da fórmula, inclusive os em mg
