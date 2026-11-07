# Manuais — Parte geral: Omni Channel (atendimentos)

> Resumo de referência para escrita de cenários futuros, derivado de `docs/Manuais - OmniCare/Parte geral/Manual para clientes do omni channel - atendimentos.pdf` (1 manual).
> **Como foi feito (2026-10-28):** texto extraído do PDF com `pdftotext` e lido por inteiro, sem consultar o app. Diferente dos outros 6 arquivos, este foi lido direto, sem subagente.
> **Limites:** não inclui as imagens/prints do PDF (o manual é quase todo figura + legenda numerada: os números entre parênteses referem-se a marcações nos prints que o texto não reproduz);
> não cita **nenhum número de tela**; não traz mensagens literais de erro/validação nem lista de campos obrigatórios.
> **Uso:** ponto de partida, não verdade. Nome de menu, botão e seletor se validam por inspeção ao vivo (`AGENTS.md` `[R-SEL]`). Ações de risco seguem `[R-RISCO]`.
> Já existe exploração real do Omni neste repositório: tela **418** (`Omni Channel > Atendimentos`) e filhas, em `PROJECT_CONTEXT.md` ("Omni channel testado com o telefone do operador") e `ROADMAP.md` P2-04. Ler lá antes de reexplorar; este manual dá a **intenção de negócio**, aquela exploração dá o **comportamento medido**.
> Índice geral e convenções transversais: `PROJECT_CONTEXT.md` § "Manuais do sistema".

---

- **Manual:** Manual para clientes do omni channel - atendimentos (título interno "Manual do Omni Channel: Atendimentos", REV. 00, 54 págs., dez/2025, autoria Klismam Monteiro) - Parte geral
- **Objetivo:** treinar o atendente no Omni Channel, a ferramenta de comunicação oficial da EnterpriseERP: conversar com clientes em tempo real (WhatsApp/Telegram), enviar orçamentos, refazer receitas e solicitar pagamento.
- **Tela(s) e caminho de menu:** o manual **não numera telas**. Caminhos citados literalmente:
  - Atendimentos (tela inicial e tela de detalhes): sem caminho no texto; pelo repositório é a tela 418, `Omni Channel > Atendimentos`
  - "Omni Channel > Cadastros > Mensagens > Mensagens Padrão" (mensagens padrão **e** cabeçalho/rodapé de orçamento: o manual repete o mesmo caminho nas duas seções)
  - "Omni channel > Cadastros > Arquivos p/ Envio"
  - "Omni channel > Cadastros > Status personalizado"
  - "Cadastros > questionários > ficha de questionário" (pesquisa de satisfação; fora do menu Omni)
  - "Omni channel > Consultas gráficos e relatórios" (tela de totalizações)
  - telas vizinhas acionadas por botão: ficha de cliente (cadastro completo), minitela de cadastro rápido, tela de atendimento/receita, tela de revenda, tela de refazer, tela de delivery, tela "pagamento On-line"
- **Pré-requisitos:**
  - grupos de atendimento cadastrados (mensagem e arquivo padrão são vinculados a um grupo; o cliente escolhe o grupo ao iniciar a conversa)
  - atendente com status "Disponível" para pegar atendimentos pendentes
  - "Orçamento IA" exige contrato com a PH24
  - link de pagamento exige o link/forma de pagamento já cadastrados
  - para refazer: cliente cadastrado
- **Fluxo:**
  1. **Tela inicial.** Lista de "omnis" com intervalo de datas (padrão 2 dias), filtro por status (padrão: todos), filtros rápidos por status, botão de status do atendente ("Disponível"/"Ocupado"), "Iniciar atendimento", opções, atualizar, relatórios/consultas, e filtros por canal, grupo, atendente, janela da conversa e nome/telefone (botão exibir/ocultar filtros).
  2. **Colunas da lista:** TP (WhatsApp ou Telegram), Código (gerado: ANO + MÊS + nº incremental), Data/Hora, Janela (reservado ao WhatsApp oficial), Últ. Msg. cliente (em horas), Últ. Msg. Atend. (em horas), Nome do cliente, Telefone/e-mail, Grupo, Atendente, Status, TM (tempo médio) e "!" (mensagens não lidas do cliente).
  3. **Mensagem padrão:** em Mensagens Padrão escolher/criar grupo > "+" > tipo de mensagem > título > grupo de mensagens > texto (aceita caracteres especiais do WhatsApp) > gravar; depois vincular a um grupo de atendimento. No Omni: "mensagem padrão" > localizar > "copiar" > enviar.
  4. **Arquivo padrão:** "+" > nome > sexo do cliente para o qual pode ser exibido > tipo > "anexo" (explorador de arquivos) > descrição opcional (há pré-visualização quando possível) > gravar; vincular a grupo. No Omni: "anexar arq. Padrão" > escolher > conferir arquivo e mensagem > **enviar agora ou agendar**.
  5. **Cabeçalho e rodapé de orçamento:** na mesma tela, mudar o tipo para "cabeçalho e rodapé de orçamento" > título > grupo > texto de cabeçalho e de rodapé > gravar; depois mudar o tipo para 1, selecionar o criado, "+" e vincular a grupo de atendimento. No Omni: "enviar orçamento" > mensagem padrão de orçamento > conferir a flag "enviar mensagem padrão" > enviar com ou sem link de pagamento, ou agendar.
  6. **Status personalizado:** o sistema vem com 0 PENDENTE, 1 EM ANDAMENTO, 2 CONCLUIDO, 3 FINALIZADO, 4 DESCARTADO. Esses 5 **não podem ser alterados nem apagados**; cada um aceita "sub status" (selecionar o status padrão > "+" > nome > cor da fonte > imagem de fundo > gravar). Setas definem a ordem de exibição na tela de atendimento. Recomendação do manual: incluir sub status só em "em andamento".
  7. **Detalhes do atendimento:** opções (Transferir atendimento, Mensagem interna visível só a outros atendentes, Detalhes do registro); botões de interação (LINK DE PAGAMENTO, ENVIAR ORÇAMENTO, INFO DE PRODUTO, GRAVAR AUDIO, MENSAGEM PADRÃO, ANEXAR ARQ. PADRÃO, PASTA DO ATEND., IMAGENS DO ATEND.); botões de orçamento (ORÇAMENTO IA, ORÇAMENTO RECEITA, ORÇAMENTO REVENDA, REFAZER); enviar mensagem (atalho tab); lista de movimentos (receitas, revendas e deliverys do cliente); abas OBSERVAÇÃO, TRANSFERENCIAS, ATENDIMENTOS; cabeçalho com usuário da plataforma, e-mail, ID/celular, cliente, status, código e data/hora.
  8. **Iniciar atendimento (enviando):** botão "iniciar atendimento" (canto superior direito) > canal > grupo > cliente (opcional, se o número já está cadastrado) ou número com DDD > mensagem > enviar.
  9. **Receber mensagem:** o cliente escolhe o grupo entre os cadastrados; a conversa aparece na lista com status Pendente; abrir com clique duplo.
  10. **Cadastrar cliente:** (a) pela ficha do cliente (botão na tela de detalhes), gravar e fechar: a tela do Omni se atualiza sozinha; (b) pelo ícone "olho", minitela de cadastro rápido, gravar (poucos campos: para mais dados, usar a ficha completa).
  11. **Orçamento pela IA:** aguardar o cliente mandar a receita (imagem ou PDF) > "Orçamento IA" > selecionar o arquivo > enviar > aguardar o processamento > o orçamento aparece na lista de movimentos > clique duplo para **conferir a receita** na tela de atendimento > enviar ao cliente.
  12. **Orçamento de receita e revenda:** "Orçamento receita" ou "Orçamento revenda" abre a tela de atendimento/revenda já com o cliente e **vinculada ao omni de origem**; ao fechar, o orçamento aparece na lista de movimentos do Omni.
  13. **Delivery:** clicar um movimento > ícone de delivery na tela de atendimento > a tela de delivery já traz o orçamento; "incluir movimento" para mais; escolher forma de pagamento e taxa de entrega; no Omni, conferir na lista (usar "atualizar" se não aparecer).
  14. **Enviar orçamento:** marcar os orçamentos > "enviar orçamento" > cabeçalho/rodapé padrão (flag "enviar mensagens padrão") > arquivo padrão (flag "enviar arquivo") > enviar só o orçamento, enviar com link de pagamento ou agendar. Após o cliente aprovar, o link também sai por: selecionar orçamento > "link de pagamento" > forma de pagamento > "enviar link".
  15. **Acompanhar pagamento:** botão direito na área indicada > "pagamento On-line": status do pagamento, resumo do pedido, link enviado e envio do link por e-mail. Pago: confirmação no chat e **movimentos ficam verdes**.
  16. **Pesquisa de satisfação:** "Cadastros > questionários > ficha de questionário": tipo (2 - Omni channel - sem venda, 3 - Omni channel - com venda), nome, descrição, "alvo" e "colaborador" (valores indicados só no print), departamento e área livres, **delay** em minutos (quanto tempo depois de finalizar a conversa a pesquisa é enviada) e validade; "+" para incluir pergunta com tipo de resposta 1 - Notas (0-10), 2 - Definir respostas ou 3 - Dissertação própria; incluir/alterar; gravar. A pesquisa vai sempre que o atendimento é finalizado. Para outra pesquisa do mesmo tipo, desmarcar "ativo" na atual.
  17. **Totalizações:** "Omni channel > Consultas gráficos e relatórios": resumo por intervalo de datas (padrão: data atual) com quantidade de atendimentos, orçamentos, atendimentos por usuário e grau de satisfação.
- **Campos e regras de negócio:**
  - status do atendente "Disponível": pega atendimentos pendentes; se não pegar, o sistema **distribui automaticamente** entre os atendentes com o mesmo status (o manual recomenda não deixar ligado sempre, por sobrecarga). "Ocupado": só interage com omnis "em andamento"
  - o código do omni segue ANO + MÊS + nº incremental
  - os 5 status padrão são imutáveis; sub status só sob um status padrão
  - mensagem padrão e arquivo padrão só ficam disponíveis no Omni depois de vinculados a grupo de atendimento
  - orçamento aberto pelo Omni traz o cliente e vincula o atendimento ao omni; o aberto pela tela comum não
  - "enviar mensagem padrão" e "enviar arquivo" são flags que precisam estar marcadas para o cabeçalho/rodapé e o arquivo irem junto
  - só uma pesquisa ativa por tipo (com venda / sem venda)
  - existem 2 canais citados: WhatsApp e Telegram (o repositório mediu também "WhatsApp não oficial" × oficial; ver `PROJECT_CONTEXT.md`)
- **Ações de risco:** quase tudo aqui **sai do sistema para um cliente real**, sem desfazer descrito.
  - "Enviar" mensagem, mensagem padrão, arquivo padrão, áudio, orçamento e **link de pagamento** (cobrança real)
  - agendamentos de envio
  - "Iniciar atendimento" para um número digitado
  - "Transferir atendimento"
  - pesquisa de satisfação que dispara sozinha ao finalizar o atendimento (e "Finalizar" muda o status do atendimento)
  - "Orçamento IA" (depende de contrato PH24 e pode ter custo)
  - gravar status personalizado, mensagem, arquivo, cabeçalho/rodapé e questionário altera cadastro persistente (nunca apagar os 5 status padrão: o sistema já bloqueia)
  - nos testes, usar só o telefone do operador (como já feito em 2026-10-26)
- **Candidatos a cenário de teste:**
  1. Cadastrar mensagem padrão, vincular a um grupo e enviá-la no omni: asserir texto enviado ao telefone do operador e registro no banco (`OC_ATENDIMENTO_MSG`; resposta pode demorar minutos, ver lição em `AGENTS.md` §4)
  2. Status personalizado: criar sub status em "em andamento" e verificar a ordem; tentar alterar/apagar um dos 5 padrão e asserir o bloqueio (negativo)
  3. Iniciar atendimento com canal + grupo + número com DDD e verificar o novo omni (código `ANO+MÊS+incremental`, status Pendente, grupo correto)
  4. Filtros da lista: intervalo padrão de 2 dias, filtro por status/canal/grupo/atendente/nome e botão exibir/ocultar filtros
  5. Orçamento de receita aberto pelo Omni: cliente preenchido automaticamente e orçamento visível na lista de movimentos (contraste com o aberto pela tela comum)
  6. Orçamento de revenda + delivery pela tela do omni: movimentos listados e delivery com forma de pagamento/taxa
  7. Enviar orçamento com flags "enviar mensagem padrão" e "enviar arquivo" marcadas e desmarcadas (borda: sem a flag o cabeçalho/rodapé não vai)
  8. Questionário: cadastrar pesquisa de um tipo e tentar ativar uma segunda do mesmo tipo (regra de uma ativa); delay e validade
  9. Tela de totalizações: contadores por intervalo e por usuário
- **Lacunas:**
  - nenhum número de tela; o caminho de menu de "Atendimentos" não está escrito
  - o campo "Janela" (WhatsApp oficial) é "reservado, verificar com o Sucesso do Cliente"
  - valores de "alvo" e "colaborador" do questionário só aparecem no print
  - não diz o que acontece ao marcar uma flag inconsistente nem as mensagens de erro
  - não explica como/quando o status vai a "Concluído", "Finalizado" ou "Descartado"
  - o manual afirma que o cliente escolhe o grupo ao mandar mensagem "por padrão", sem dizer onde isso se configura
  - a legenda numera 15 itens mas o texto não diz quais são botões e quais são colunas na ordem do print
  - "Mensagens padrão" é o caminho dado para cadastrar mensagem **e** cabeçalho/rodapé, sem distinguir no menu
  - erro de digitação no original ("variais informações")
  - a seção de arquivo padrão cita o tipo de arquivo como campo "(4)" antes do anexo "(3)" (numeração do print fora de ordem)
