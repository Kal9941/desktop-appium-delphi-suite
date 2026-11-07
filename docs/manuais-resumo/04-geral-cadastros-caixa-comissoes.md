# Manuais — Parte geral: cadastros, caixa, comissões, lotes de compra e A pagar

> Resumo de referência para escrita de cenários futuros, derivado dos PDFs em `docs/Manuais - OmniCare/` (13 manuais).
> **Como foi feito (2026-10-28):** texto extraído dos PDFs com `pdftotext` e resumido por leitura integral, sem consultar o app.
> **Limites:** não inclui as imagens/prints dos PDFs; as setas dos caminhos de menu se perderam na extração (aqui aparecem como `>`);
> o manual quase nunca traz mensagens literais de erro/validação nem a lista de campos obrigatórios.
> **Uso:** ponto de partida, não verdade. Todo nome de menu, botão e seletor deve ser validado por inspeção ao vivo
> antes de virar teste (`AGENTS.md` `[R-SEL]`). Ações de risco listadas aqui seguem `[R-RISCO]` (não clicar sem confirmar).
> Índice geral e convenções transversais: `PROJECT_CONTEXT.md` § "Manuais do sistema".

---

# Resumo dos manuais - Grupo C (Parte geral: cadastros, caixa, comissões, financeiro)

Fonte: textos extraídos em `...\scratchpad\txt\Parte__<manual>.txt`. 13 manuais.
Notas de leitura gerais:
- O separador de menu (seta) se perdeu na extração do texto (ex.: "Cadastros  Fornecedores  Ficha do fornecedor"). Abaixo grafado com ">" por convenção; os nomes dos itens são literais.
- Os prints do PDF não estão no texto: campos "obrigatórios" só são conhecidos quando o texto os cita.
- Todos os manuais são assinados por Thaiffane (Sucesso do Cliente / Implantação), versões do sistema 25.11 a 26.5.
- Pasta de todos: Parte geral (conforme designação do grupo).

---

## 1. Cadastro de Fornecedor Simples

- **Manual:** Cadastro de Fornecedor Simples (v. 26.5, ago/2026) - Parte geral
- **Objetivo:** Cadastrar um fornecedor na Tela 032, com preenchimento automático via consulta de CNPJ.
- **Tela(s) e caminho de menu:** "Cadastros > Fornecedores > Ficha do fornecedor"; "Tela 032 - Cadastro de Fornecedores"; tela auxiliar "Consulta de CNPJ".
- **Pré-requisitos:** não informado (a consulta de CNPJ pressupõe CNPJ válido e acesso à consulta; não dito).
- **Fluxo:**
  1. Menu "Cadastros > Fornecedores > Ficha do fornecedor" -> abre "Tela 032 - Cadastro de Fornecedores".
  2. Preencher os três campos obrigatórios: "CNPJ", "Nome fantasia" e "Razão social" (manual lista os campos; salvar exige os três).
  3. Alternativa: informar o CNPJ e clicar no ícone da lupa -> abre a tela "Consulta de CNPJ".
  4. Na tela "Consulta de CNPJ", clicar na lupa; após a consulta, clicar em "Copiar informações" -> o sistema preenche os campos disponíveis.
  5. Informar o "Nome fantasia" (não vem da consulta, segundo o manual) para concluir.
  6. Clicar em "Gravar".
- **Campos e regras de negócio:** Obrigatórios para salvar: CNPJ, Nome fantasia, Razão social. A consulta de CNPJ preenche "as informações disponíveis"; "Nome fantasia" precisa ser informado manualmente após a cópia.
- **Ações de risco:** "Gravar" (cria cadastro real). Nenhuma ação destrutiva citada.
- **Candidatos a cenário de teste:**
  1. Positivo: abrir Cadastros > Fornecedores > Ficha do fornecedor, preencher CNPJ, Nome fantasia, Razão social, Gravar -> assere cadastro gravado (código gerado/consulta localiza).
  2. Positivo: CNPJ + lupa + "Copiar informações" + Nome fantasia + Gravar -> assere campos preenchidos pela consulta.
  3. Validação: tentar Gravar sem CNPJ / sem Nome fantasia / sem Razão social -> assere bloqueio/mensagem (texto da mensagem não informado).
  4. Pós-cópia sem Nome fantasia: Gravar -> assere que não grava (inferência do "preencha os três obrigatórios").
- **Lacunas:** Mensagens de validação; formato/validação do CNPJ (dígito verificador); o que ocorre com CNPJ duplicado; se a consulta de CNPJ exige internet; demais abas/campos da Tela 032; título "Simples" sugere existir um cadastro completo, não coberto aqui.

---

## 2. Cadastro de Horários de Laboratório e Delivery

- **Manual:** Cadastro de Horarios de Laboratorio e Delivery OK (v. 26.2, jul/2026) - Parte geral
- **Objetivo:** Configurar horários de produção do laboratório, regras de data/hora de entrega ao cliente, horários de delivery, operações e o preenchimento automático na Tela 145.
- **Tela(s) e caminho de menu:** "Cadastros > Atendimentos > Horários"; "Tela 417 - Cadastro de Laboratórios"; "Cadastros > Atendimentos > Operações" -> "Tela 048 - Cadastro de Operações"; "Configurações > Atendimento" -> Tela 146; "Tela 145 - Atendimento ao Cliente/Receita".
- **Pré-requisitos:** Laboratório cadastrado (por tipo: Sólidos, Semissólidos, Líquidos; Alopatia ou Homeopatia na Tela 417); lojas cadastradas (regra de entrega pede "loja"); operação "Atendimento" ativa com "Tabela de horário" = 1.
- **Fluxo:**
  1. Menu "Cadastros > Atendimentos > Horários".
  2. Selecionar o laboratório pela seta do campo ou digitando o nome. Se não existe, clicar no ícone azul -> "Tela 417 - Cadastro de Laboratórios": escolher tipo "Alopatia" ou "Homeopatia", preencher e "Gravar".
  3. Seção "Horários de entrega do laboratório" (horário em que as fórmulas ficam prontas no laboratório; não é o horário de entrega ao cliente): clicar no ícone "+" ou botão direito > "Incluir"; informar dia da semana, horário de entrega e limite de fórmulas (ex.: segunda, 11:00, limite 20); "Gravar".
  4. Após gravar, o horário pode aparecer riscado (inativo): na coluna "AT" clicar no campo e marcar a caixa "OK" -> deixa de ficar riscado.
  5. Incluir segundo horário no mesmo dia se houver entrega à tarde (ex.: segunda 17:00, limite 20), "Gravar" e ativar na coluna "AT".
  6. Para os demais dias: após gravar, clicar "Limpar" e informar o próximo (sempre "Limpar" antes de preencher o próximo, senão o sistema pode reutilizar/alterar o horário anterior). Ao final, conferir "OK" em "AT" de todos e clicar "Gravar".
  7. Seção "Horários de entrega para o cliente": "+" ou botão direito > "Incluir"; informar loja, dia e horário-limite em que o pedido pode chegar, e dia e horário em que a fórmula será entregue; "Gravar". Exemplos do manual: pedido sábado até 10:00 -> entrega segunda 12:00; segunda até 10:00 -> mesmo dia 18:00; segunda até 18:00 -> terça 12:00; terça até 10:00 -> terça 18:00; terça até 18:00 -> quarta 12:00; quarta até 10:00 -> quarta 18:00.
  8. Delivery: em "Horários de entrega do laboratório" incluir e selecionar "2 - Horários do laboratório para o delivery" no campo "Tipo de tabela"; cadastrar dias/horários/limites; são identificados pela abreviação "DL". Não são copiados automaticamente dos horários de atendimento.
  9. Seção "Qtde. extra e prazo": quantidade extra (limite 20 + extra 5 = até 25 fórmulas no horário) e prazo mínimo de manipulação em horas (campo "apenas informativo na tela").
  10. Importar horários: abrir o laboratório com horários > botão de três pontos > "Importar horários"; em "IMPORTAR HORÁRIO" selecionar o laboratório que receberá e informar a loja de produção; "Importar horários"; confirmar "Sim"; fechar a área, selecionar o laboratório de destino, conferir; se riscados, marcar "OK" em "AT" e "Gravar".
  11. "Cadastros > Atendimentos > Operações" (Tela 048): lupa > pesquisar "Atendimento" > conferir "Ativo" marcado, "Tabela de horário" = 1 e "Atendimento" habilitada; corrigir e "Gravar" se necessário.
  12. Operação Delivery: "Limpar"; nome (ex.: "Delivery"); "Tabela de horário" = 2; marcar "Delivery"; "Gravar"; verificar "Ativo" (se desmarcado, marcar e "Gravar" de novo).
  13. "Configurações > Atendimento" (Tela 146): marcar "Utilizar tabela de horários (horário automático)". Efeito: a Tela 145 preenche automaticamente o horário de entrega; com delivery cadastrado, preenche também a data de entrega.
- **Campos e regras de negócio:** Limite de fórmulas por horário + "Quantidade extra" (limite+extra = capacidade máxima). "Prazo mínimo" é só informativo. Horário gravado pode ficar inativo até marcar "OK" em "AT". "Tabela de horário": 1 = atendimento, 2 = delivery ("Tipo de tabela" "2 - Horários do laboratório para o delivery"). Regras de entrega: uma por período de recebimento; pedido até o limite da manhã -> entrega à tarde do mesmo dia; pedido até o limite do fim do dia -> manhã do próximo dia de funcionamento. Horário automático só atua com a opção da Tela 146 marcada.
- **Ações de risco:** "Importar horários" (+ confirmação "Sim", pode sobrescrever/duplicar horários do destino - não detalhado); botão direito > Excluir não citado, mas o menu de contexto existe; "Gravar" em configurações globais (Tela 146, operações) afeta todo o atendimento.
- **Candidatos a cenário de teste:**
  1. Positivo: incluir horário de laboratório (segunda 11:00, limite 20), Gravar, ativar "OK" em "AT" -> assere linha sem estar riscada.
  2. Positivo: incluir regra de entrega ao cliente (sábado até 10:00 -> segunda 12:00) -> assere linha na lista "Horários de entrega para o cliente".
  3. Positivo: horário de delivery com "Tipo de tabela" = "2 - Horários do laboratório para o delivery" -> assere abreviação "DL".
  4. Borda: "Qtde. extra" 5 com limite 20 -> assere 25 aceitas e 26ª não (comportamento de bloqueio não explicitado no manual).
  5. Integração: com "Utilizar tabela de horários (horário automático)" marcado na Tela 146 -> Tela 145 preenche horário de entrega automaticamente.
  6. Borda: gravar sem "Limpar" entre inclusões -> assere sobrescrita do registro anterior (comportamento alertado pelo manual).
- **Lacunas:** Rótulos exatos dos campos da tela de inclusão (a imagem não está no texto); o que acontece ao ultrapassar limite+extra; mensagens do sistema; se existe exclusão de horário; localização exata do botão de três pontos; se "Importar horários" substitui ou soma; título "Tela 146 - Configurações > Atendimento" (nome da tela exato não informado além do número).

---

## 3. Cadastro de Prescritor Completo (mais abrangente)

- **Manual:** Cadastro de Prescritor Completo OK (v. 26.2, jul/2026) - Parte geral
- **Objetivo:** Cadastrar prescritor na Tela 036 com todas as abas (dados, atendimento, representantes, visitas, Curva ABC) e menu de opções.
- **Tela(s) e caminho de menu:** "Cadastros > Prescritores > Ficha do Prescritor"; "Tela 036"; "Tela 040" (Cadastro de Especialidade); "Tela 011" (Cadastro de Grupo); "Tela 322" (Cadastro de Conselho Regional).
- **Pré-requisitos:** Especialidade, Grupo e Conselho Regional cadastrados (ou cadastráveis pelo ícone azul de cada campo); para Representantes/Visitas, representantes cadastrados.
- **Fluxo:**
  1. Menu "Cadastros > Prescritores > Ficha do Prescritor" -> Tela 036.
  2. Campo "Nome": nome completo do prescritor.
  3. Campo "Especialidade": selecionar (digitar o nome para localizar ou seta do campo); se não existir, ícone azul -> Tela 040: informar o nome; a seção "Valores e porcentagens de comissão" configura valores/percentuais de comissão das visitas do representante.
  4. Campo "Grupo": selecionar; se não existir, ícone azul -> Tela 011: informar nome e clicar "Gravar" (não é necessário marcar "Padrão").
  5. Dados pessoais: data de nascimento e sexo.
  6. "Conselho Regional": selecionar conselho, informar estado e número do registro profissional; se não existir, ícone azul -> Tela 322; campo "Abreviação no rótulo" (ex.: "Dr.", "Dra.").
  7. Observações (três campos): "Observação" (só na tela de cadastro do prescritor), "Observação da ficha de pesagem" (impressa na ficha enviada ao laboratório), "Observações extras" (informações adicionais independentes da observação principal).
  8. Seção "Informações para Atendimento": "Percentual de desconto padrão", "Percentual máximo de desconto", "Percentual de aumento aplicado às receitas"; restrições "Proibir desconto" (impede descontos nas receitas vinculadas) e "Proibir refazer fórmulas" (impede refazer fórmulas vinculadas).
  9. Aba "Representantes / Visitas Médicas": vincular representantes responsáveis.
  10. Aba "Locais de Atendimento": locais onde o prescritor atende (auxilia planejamento/controle de visitas).
  11. Aba "Controle de Visitas": histórico de visitas dos representantes.
  12. Aba "Curva ABC": indicadores (faturamento, giro, descontos concedidos, lucratividade).
  13. Botões: "Relatórios" (visualizar/imprimir), "Consultar" (localizar prescritores), "Digitalizar" (anexar documentos).
  14. Menu de opções (três pontos): "Controle de Visitas"; "Movimentação de Atendimento" (receitas e revendas vinculadas); "Movimentação Financeira" (consultar/registrar pagamentos ao prescritor); "Perfil do Prescritor" (perguntas e respostas); "Questionário"; "Reclamação / Sugestão" (ocorrências internas, reclamações, sugestões e soluções); "Locais de Atendimento / Secretárias".
  (Este manual não cita explicitamente o botão "Gravar" da Tela 036; o manual simples o cita.)
- **Campos e regras de negócio:** Descontos: percentual padrão <= máximo (relação não afirmada, mas implícita). "Proibir desconto" impede qualquer desconto nas receitas do prescritor; "Proibir refazer fórmulas" impede refazer. "Abreviação no rótulo" define o que aparece no rótulo. Observação da ficha de pesagem é impressa. Campos obrigatórios: não informado.
- **Ações de risco:** "Gravar"; gravar novos cadastros auxiliares (Tela 040, 011, 322); "Movimentação Financeira" (registrar pagamentos ao prescritor); "Digitalizar" (anexa arquivo); restrições "Proibir desconto"/"Proibir refazer fórmulas" alteram o comportamento de receitas futuras.
- **Candidatos a cenário de teste:**
  1. Positivo: criar prescritor com Nome, Especialidade, Grupo, nascimento, sexo, Conselho/UF/registro e Gravar -> assere localização via "Consultar".
  2. Positivo: criar Especialidade nova pelo ícone azul (Tela 040) e vê-la no combo.
  3. Regra: marcar "Proibir desconto" e tentar desconto numa receita (Tela 145) do prescritor -> assere bloqueio (comportamento esperado derivado do manual; mensagem não informada).
  4. Regra: "Proibir refazer fórmulas" -> assere que "Refazer" fica impedido para fórmulas do prescritor.
  5. Navegação: abrir cada aba (Representantes / Visitas Médicas, Locais de Atendimento, Controle de Visitas, Curva ABC) e itens do menu de três pontos -> assere abertura sem erro.
  6. Borda: percentual máximo de desconto menor que o padrão -> comportamento não informado (verificar na tela).
- **Lacunas:** Campos obrigatórios; mensagens de validação; botão "Gravar" não citado aqui; formato do número de registro; regra de duplicidade (mesmo conselho/UF/registro); o que ocorre quando percentual padrão > máximo; colunas/campos de cada aba.

---

## 4. Cadastro de Prescritor simples (diferencial)

- **Manual:** Cadastro de Prescritor simples OK (v. 26.2, jul/2026) - Parte geral
- **Objetivo:** Versão reduzida do cadastro da Tela 036 (nome, especialidade, grupo, dados pessoais, conselho, observações) e "Gravar".
- **Diferencial em relação ao Completo:** mesmo caminho ("Cadastros > Prescritores > Ficha do Prescritor", Tela 036) e mesmas seções 2.1 a 2.5 e 3 (telas 040, 011, 322, três campos de observação), textos idênticos. NÃO inclui: "Informações para Atendimento" (descontos/Proibir desconto/Proibir refazer fórmulas), abas "Representantes / Visitas Médicas", "Locais de Atendimento", "Controle de Visitas", "Curva ABC", botões "Relatórios"/"Consultar"/"Digitalizar" e o menu de três pontos. ACRESCENTA: passo final explícito "Após preencher os campos necessários, clique em Gravar para salvar as informações."
- **Candidatos a cenário de teste:** o cenário positivo mínimo (Nome, Especialidade, Grupo, nascimento, sexo, Conselho/UF/registro -> Gravar) é o mesmo do Completo; cobre-se uma única vez.
- **Lacunas:** idem Completo (campos obrigatórios, mensagens). Fica ambíguo se "simples" e "completo" são a mesma tela 036 (parece que sim: o "simples" é apenas o roteiro mínimo).

---

## 5. Caixa

- **Manual:** Caixa OK - "Manual - Como Utilizar o Caixa (Sistema OmniCare)" (v. 26.2, abril/2026) - Parte geral
- **Objetivo:** Operação completa do caixa: abertura, movimentações, configuração, baixa de receita, nota fiscal, finalização, conferência e fechamento.
- **Tela(s) e caminho de menu:** "PDV Frente de Caixa (Tela 395)"; opção "Controle de Caixa" -> "Tela 047"; "Alívio de Dinheiro" -> "tela 049 - Controle de Sangria"; três pontos > "Configurações" -> "Tela 568"; "Tela 056 (Lançamentos)"; (finalização da receita: tela não numerada neste manual).
- **Pré-requisitos:** Caixa aberto antes de qualquer movimento ("é obrigatório realizar a abertura do caixa antes de registrar qualquer movimento"); na Tela 568: "À vista" = dinheiro e "A pagar" = método "A pagar" (se não existir, cadastrar na Tela 056 - Lançamentos); fórmula concluída com financeiro gerado para aparecer em "CONSULTAR"; sistema homologado para NFS-e.
- **Fluxo:**
  1. Acessar a "Tela 395 - PDV Frente de Caixa".
  2. Abertura: na Tela 395 opção "Controle de Caixa" -> Tela 047 (mostra data/horário de abertura e operador). Opções: "Abrir caixa da loja" (usar diariamente) e "Abrir caixa do delivery" (abre automaticamente junto com o da loja).
  3. Movimentações: "Alívio de Dinheiro" (Tela 049 - Controle de Sangria; retirada para compras emergenciais/necessidades internas; imprime comprovante); "Sangria para Pagamento" (destino: Fornecedor, Cliente, Médico, Funcionário, Banco; é necessário selecionar o tipo de destino); alternativa "Alívio de Caixa": em "Informações do Alívio" informar o lançamento, inserir o valor e (opcional) observação; "Alívio de Cheque" (pagar cheque com valor do caixa); "Suprimento (Fundo de Caixa)" (inserir dinheiro, geralmente no início do expediente; imprime comprovante).
  4. Configuração: Tela 395 > três pontos > "Configurações" -> Tela 568; campos obrigatórios "À vista" (definir como dinheiro) e "A pagar" (método "A pagar"); demais: setor de venda e tipo de operação (lupa), impressora de cupom; "Gravar".
  5. Localizar receita na Tela 395: digitar o código da receita OU "CONSULTAR" (receitas concluídas); se não achar: filtrar pela data, verificar se a fórmula está concluída, confirmar se já existe financeiro gerado. Selecionar a opção "CF" e clicar "CONTINUAR".
  6. Incluir mais fórmulas (opcional): digitar outro código ou "CONSULTAR"; "ENTER" para avançar para a tela de pagamento.
  7. Forma de pagamento: clicar na lupa e selecionar. Múltiplas formas: digitar valor pago na 1ª forma (ex.: dinheiro) -> ENTER -> o sistema mostra valor pago e valor restante -> selecionar 2ª forma -> ENTER -> confirmar valor restante -> ENTER novamente para finalizar.
  8. Confirmação do financeiro: tela com formas e valores; clicar "Concluir Movimento".
  9. Notas: NFS-e, NFC-e, NF-e. Para NFS-e: selecionar o código da receita, botão direito > "NFS-e", clicar "Autorizar NFS-e" (sistema deve estar homologado; se não aparecer, contatar equipe responsável).
  10. Finalização da receita: marcar "OK - Para finalizar a receita" (regra: primeiro finalizar a receita, depois a entrega; "O sistema não permite finalizar entrega sem a receita finalizada"); o item fica destacado em verde; o status da receita é atualizado; após marcar, pode fechar a tela.
  11. Controle de Caixa (Tela 047): após finalizar a receita e fechar a tela, reabrir "Controle de Caixa" na Tela 395. Exibe valores movimentados, formas de pagamento, código financeiro, código da receita, total de todas as formas, valores cancelados, valores de alívio (dinheiro e cheque), suprimento; botão "OK" valida os lançamentos (conferência).
  12. Fechamento: selecionar cada forma de pagamento e informar os valores recebidos (o sistema filtra automaticamente por forma: Dinheiro mostra só dinheiro, Cartão só cartão); conferir; clicar "Fechar Caixa".
  13. Comprovante: o sistema imprime relatório de fechamento; se não imprimir, verificar a configuração da impressora/contatar suporte.
- **Campos e regras de negócio:** Abertura obrigatória antes de qualquer movimento. "Abrir caixa do delivery" abre junto com o da loja. Sangrias e suprimentos NÃO podem ser cancelados ("Não é possível realizar o cancelamento dos movimentos de sangrias" / "...de suprimento"). Sangria e suprimento imprimem comprovante. Configuração: "À vista" = dinheiro, "A pagar" obrigatórios. Pagamento: ENTER confirma valor e mostra restante. Ordem obrigatória: finalizar receita antes de finalizar entrega. "Após o fechamento, não é possível corrigir" - revisar valores antes.
- **Ações de risco:** "Fechar Caixa" (irreversível); "Alívio de Dinheiro"/"Sangria para Pagamento"/"Alívio de Cheque"/"Suprimento" (sem cancelamento); "Concluir Movimento"; "OK - Para finalizar a receita" (muda status, gera comissão); "Autorizar NFS-e" (emissão fiscal); "Gravar" na Tela 568.
- **Candidatos a cenário de teste:**
  1. Positivo: abrir caixa da loja pela Tela 047 -> assere data/hora de abertura e operador exibidos; caixa do delivery aberto junto.
  2. Positivo: suprimento de R$ X -> assere aparecer em "Valores de suprimento" na Tela 047 e comprovante impresso.
  3. Positivo: baixar uma receita (código -> "CF" -> "CONTINUAR" -> forma de pagamento -> "Concluir Movimento") -> assere linha na Tela 047 com código financeiro e da receita.
  4. Pagamento misto: dinheiro parcial + segunda forma pelo valor restante -> assere "Valor restante" correto e soma = total.
  5. Negativo: tentar movimentar sem caixa aberto -> assere bloqueio (mensagem não informada).
  6. Negativo/regra: tentar finalizar entrega sem receita finalizada -> assere bloqueio; e ver que sangria/suprimento não têm opção de cancelar.
  7. Fechamento (somente em ambiente descartável): "Fechar Caixa" e relatório de fechamento.
- **Lacunas:** Número da tela de finalização ("OK - Para finalizar a receita"; o manual de comissão a chama de tela 379 e o de A pagar usa tela 379 em "CONCLUIR MOVIMENTOS"); significado exato de "CF" (não explicado); mensagens de erro; comportamento ao abrir caixa já aberto; permissões necessárias; como o fechamento trata diferenças entre valor informado e sistema.

---

## 6. Cancelar lote e incluir lote pela tela de compra

- **Manual:** Cancelar lote e incluir lote pela tela de compra OK (título interno "Exclusão e inclusão de lote pela tela de compra"; v. 26.2, março/2026) - Parte geral
- **Objetivo:** Corrigir um lote/produto lançado errado em nota de compra: cancelar o lote registrado, corrigir/excluir/incluir o produto e registrar o lote novamente.
- **Tela(s) e caminho de menu:** "Notas de Compra" -> "tela 444"; três pontinhos > "REGISTRO DE LOTES ESTOQUE" -> "tela 155"; "tela 132" (edição do produto da nota); menu de contexto "CANCELAR LOTES REGISTRADOS" / "INCLUIR LOTE".
- **Pré-requisitos:** Nota de compra do tipo RECEBIDAS já lançada com lote registrado e erro identificado (quantidade, unidade ou produto errado).
- **Fluxo:**
  1. Abrir a tela de "Notas de Compra" (tela 444): "Tipo de Nota Fiscal" = "RECEBIDAS"; "Intervalo de Data de Emissão" = data de emissão; clicar no ícone verde para atualizar.
  2. Dar duplo clique na nota na lista para abrir.
  3. Na tela da compra, clicar nos três pontinhos > "REGISTRO DE LOTES ESTOQUE" -> tela 155.
  4. Selecionar o produto, botão direito > "CANCELAR LOTES REGISTRADOS"; confirmar a operação; clicar em "GRAVAR".
  5. Tela 132: localizar o produto com erro e dar duplo clique; ajustar a quantidade ou a unidade conforme o erro.
  6. Se o produto lançado está errado: botão direito no produto > "EXCLUIR" (excluir somente após cancelar o registro de lote); depois botão direito na tela ou botão "+" para incluir o produto correto; preencher nome do produto, quantidade, valores e informações fiscais (campos destacados em vermelho são obrigatórios); clicar em "incluir".
  7. Verificar se os valores do produto foram alterados automaticamente; se correto, clicar em "INCLUIR"; depois "GRAVAR".
  8. Três pontinhos > "REGISTRO DE LOTE E ESTOQUE" (grafia do passo 12) -> tela 155: botão direito no produto > "INCLUIR LOTE"; preencher apenas os campos obrigatórios (vermelho) e clicar "INCLUIR".
  9. Clicar "GRAVAR" -> "as informações do lote estarão corrigidas no sistema".
- **Campos e regras de negócio:** Ordem obrigatória: cancelar lote registrado ANTES de excluir o produto. Campos obrigatórios destacados em vermelho (nome do produto, quantidade, valores, informações fiscais; no lote, só os destacados). Após alterar quantidade/unidade, valores do produto podem recalcular automaticamente (verificar).
- **Ações de risco:** "CANCELAR LOTES REGISTRADOS" (altera estoque; com confirmação); "EXCLUIR" produto da nota; "GRAVAR" (definitivo, afeta estoque e fiscal); "INCLUIR LOTE".
- **Candidatos a cenário de teste:**
  1. Positivo (ambiente de teste com nota própria): cancelar lote registrado de um item e reincluir lote -> assere lote final correto na tela 155.
  2. Positivo: corrigir quantidade/unidade na tela 132 -> assere valores recalculados.
  3. Positivo: excluir produto errado e incluir o correto -> assere item novo na nota.
  4. Negativo/ordem: tentar excluir produto com lote ainda registrado -> assere bloqueio (a observação do manual implica; mensagem não informada).
  5. Validação: incluir produto/lote sem campos vermelhos -> assere não aceitar.
- **Lacunas:** Mensagem de confirmação do cancelamento; campos exatos do lote (número, validade, fabricação etc.); efeito no estoque; se há restrição para lote já consumido; nomes diferentes do mesmo item de menu ("REGISTRO DE LOTES ESTOQUE" vs "REGISTRO DE LOTE E ESTOQUE"); nome de menu para chegar a "Notas de Compra" não informado.

---

## 7. Comissão vendas

- **Manual:** Comissão  vendas OK - "Como cadastrar comissão de vendas" (v. 25.11, 06/março/2026) - Parte geral
- **Objetivo:** Configurar e calcular a comissão de vendas de funcionários (ativação, tipos, receitas/revenda, validação na finalização e geração na Tela 041).
- **Tela(s) e caminho de menu:** "Tela 007 - Cadastro de Funcionário" (ficha); "Cadastro > funcionário > comissões" (tela de Comissão, opção "1 - Vendas"); "tela 146" (opção para pagar o orçamentista); "tela 379" (marcar "OK"); "Movimentos > Funcionários > Comissão" -> "tela 041 - Comissões".
- **Pré-requisitos:** Funcionário cadastrado; para revenda: grupo, linha e classe cadastrados (na ficha do produto de revenda); receita finalizada para a comissão ser gerada.
- **Fluxo:**
  1. Tela 007: na ficha do funcionário marcar "Ativar comissão" e informar a data de início do cálculo da comissão.
  2. "Cadastro > funcionário > comissões": na tela Comissão selecionar "1 - Vendas"; opções via botão direito do mouse ou menu no canto superior direito.
  3. Selecionar o funcionário e definir o tipo de comissão: "1 - Comissão sobre as vendas do funcionário selecionado" (receitas concluídas por ele); "2 - Comissão sobre as vendas do funcionário + comissão da loja" (receitas próprias e dos demais); "3 - Comissão sobre as vendas da loja (GERAL)" (todas as receitas da loja).
  4. Preencher as informações das opções "Receitas" e "Revenda". Exemplo: Receita 100 (VALOR FINAL), comissão 2% -> 100 x 0,02 = 2.
  5. "Comissão proporcional ao desconto": receita de R$ 100,00 com 2% de desconto aplicado pelo funcionário; o valor final (após desconto) é usado para calcular a comissão pelo percentual cadastrado.
  6. Revenda: opção 0 exibe campo para o percentual; opções 1, 2, 3 ou 4 ocultam o campo (percentual definido nas configurações dessas opções, selecionando o funcionário e clicando no "+" > incluir: tela para selecionar nome da classe e percentual). Novos nomes de grupo, linha e classe são cadastrados na ficha do produto de revenda.
  7. Tela 146: para pagar o orçamentista, habilitar uma opção (o nome da opção não aparece no texto).
  8. Validação: para validar, finalizar a receita pela tela correspondente; no caixa, clicar na opção "concluir movimento"; na tela 379 marcar "OK" -> receita finalizada e comissão do funcionário gerada.
  9. Gerar valores: "Movimentos > Funcionários > Comissão" -> tela 041 - Comissões: informar mês, ano e intervalos; clicar "Calcular comissão" -> lista funcionários e valores; inconsistências são apontadas pelo sistema. Na mesma tela, várias opções de relatório.
- **Campos e regras de negócio:** Base de cálculo: valor final da receita x percentual. 3 tipos de comissão (1, 2, 3). Revenda: opção 0 = percentual direto; 1-4 = percentual por funcionário/classe. A comissão só é gerada após finalizar a receita (marcar "OK" na tela 379). Data de início do cálculo definida na ficha.
- **Ações de risco:** "OK" na tela 379 (finaliza receita e gera comissão); "Concluir movimento"; botão direito > incluir/alterar/excluir comissões (exclusão não citada neste manual, só no de laboratório).
- **Candidatos a cenário de teste:**
  1. Positivo: ativar comissão + data início na Tela 007 -> assere gravado.
  2. Positivo: receita de R$ 100, comissão 2%, tipo 1 -> após finalizar receita, Tela 041 > "Calcular comissão" -> assere comissão = 2,00.
  3. Regra: "Comissão proporcional ao desconto" com 2% de desconto -> assere cálculo sobre valor final (98,00 x percentual).
  4. Negativo: receita não finalizada (sem "OK" na tela 379) -> assere que não entra na comissão.
  5. Regra de tipo: tipo 3 (loja geral) vs tipo 1 -> assere funcionário recebe sobre receitas de outros.
  6. Revenda: opção 0 mostra campo de percentual; opção 1-4 oculta -> assere visibilidade do campo.
- **Lacunas:** Rótulos exatos e posição dos campos de "Receitas"/"Revenda" (o que significam as opções 0, 1, 2, 3, 4 de revenda não é explicado: só se diz que 1-4 ocultam o campo); nome da opção da tela 146 para orçamentista; nome da tela da "finalização" além da tela 379; intervalos exatos (datas) na Tela 041; mensagens de inconsistência; "Calcular comissão" é persistente ou apenas consulta.

---

## 8. Comissão laboratório

- **Manual:** Comissão laboratorio OK - "Como cadastrar comissão de laboratório" / "Comissão da Produção de Laboratório" (v. 25.11, março/2026) - Parte geral
- **Objetivo:** Configurar e calcular comissão da produção do laboratório por processo de rastreabilidade (por cápsulas, fórmulas ou múltiplo), com índices por quantidade de itens.
- **Tela(s) e caminho de menu:** "Tela 007 - Cadastro de Funcionário"; "tela 229" (rastreabilidade/processos); "Tela 146 - Configuração de Atendimento"; "Movimentos - Funcionários - Comissão" -> "tela 041 Comissões".
- **Pré-requisitos:** Funcionário com "Ativar comissão" e data de início; processos de rastreabilidade criados (nome, tipo, tipo de inclusão, "Pagar comissão"); comissão do colaborador do laboratório cadastrada ("Para iniciar o cálculo de comissão é necessário cadastrar a comissão do colaborador do laboratório").
- **Fluxo:**
  1. Tela 007: marcar "Ativar comissão" e informar data de início do cálculo.
  2. Tela 229: criar processos de rastreabilidade: nome do processo, tipo do processo, tipo de inclusão ("Receitas" = conjunto completo, uma receita com 10 fórmulas registra as 10 juntas; "Fórmulas" = cada item individual registrado separadamente); em "Opções" marcar "Pagar comissão" e gravar.
  3. Se há colaboradores fixos por processo, vincular o processo diretamente na ficha do funcionário (Rastreabilidade, Tela 229).
  4. Cadastro da comissão do colaborador (botão direito: incluir novo valor, alterar, excluir) com campos "Forma farmacêutica", "Tipo de produção", "Tipo de cálculo".
  5. Tela 146 (Configuração de Atendimento): definir se o cálculo considera "Data do processo de rastreabilidade" ou "data da baixa da fórmula" (determina quando a comissão é contabilizada).
  6. "Movimentos - Funcionários - Comissão" -> tela 041: informar mês, ano e intervalos; "Calcular comissão" -> lista funcionários e valores; inconsistências são exibidas; relatórios na mesma tela.
- **Campos e regras de negócio:** Tipos de cálculo: Tipo 1 - Valor x Quantidade (valor x quantidade de cápsulas na receita; ex.: 90 + 60 = 150 cápsulas x R$ 2,00 = R$ 300,00); Tipo 2 - Valor x Nº de Fórmulas (Múltiplo) (fórmulas x repetição/múltiplo x valor; ex.: 2 fórmulas, múltiplo 3, R$ 2,00 -> 2 x 3 = 6; 6 x 2,00 = R$ 12,00); Tipo 3 - Valor x Nº de Fórmulas (ex.: 2 fórmulas x R$ 2,00 = R$ 4,00). Índices: valor da comissão x índice x quantidade (ex.: fórmula com 3 itens, índice 1,5, comissão R$ 1,00, total múltiplo 30 -> 30 x 1,5 x 1,00 = R$ 45,00); o sistema usa automaticamente o índice correspondente à quantidade de itens cadastrados. Tela 146 decide a data de referência (rastreabilidade vs baixa).
- **Ações de risco:** botão direito > "Excluir comissão"; "Gravar" processos/comissões; "Calcular comissão" (a persistência não é dita).
- **Candidatos a cenário de teste:**
  1. Positivo: criar processo na Tela 229 com "Pagar comissão" marcado -> assere gravado e opção ativa.
  2. Cálculo Tipo 1: 150 cápsulas x R$ 2,00 -> assere R$ 300,00 na Tela 041.
  3. Cálculo Tipo 3: 2 fórmulas x R$ 2,00 -> assere R$ 4,00; Tipo 2 com múltiplo 3 -> R$ 12,00.
  4. Índice: fórmula com 3 itens, índice 1,5 -> assere 45,00 (com total múltiplo 30 e R$ 1,00).
  5. Configuração: alternar na Tela 146 "data do processo de rastreabilidade" vs "data da baixa da fórmula" e ver impacto no período calculado.
  6. Negativo: funcionário sem "Ativar comissão"/sem comissão cadastrada -> assere que não aparece na Tela 041 (ou aparece inconsistência).
- **Lacunas:** Rótulos exatos das opções da Tela 146; como se define o "múltiplo" e a "repetição da receita"; tabela de índices (onde cadastrar índice por quantidade de itens); valores possíveis de "Tipo de processo" e "Tipo de produção"; mensagens de inconsistência; os exemplos mostram "Total múltiplo: 30" sem origem explicada; menu para chegar à Tela 229 não é informado.

---

## 9. Como abrir solicitação no sistema OmniCare

- **Manual:** Como abrir solicitação no sistema OmniCare - "Manual de como abrir uma solicitação no sistema" (v. 26.2, maio/2026) - Parte geral
- **Objetivo:** Abrir e acompanhar solicitação/contato com a EnterpriseERP dentro do sistema.
- **Tela(s) e caminho de menu:** "AppERP > Contato/Solicitação"; "tela 016 - EnterpriseERP (Contato/Solicitação)".
- **Pré-requisitos:** Usuário logado; máximo de 5 solicitações abertas por usuário.
- **Fluxo:**
  1. Entrar no sistema com o usuário; menu "AppERP > Contato/Solicitação" -> tela 016.
  2. Clicar no "+" verde para nova solicitação.
  3. Primeiro destino: informar o departamento; segundo destino: informar o tipo de solicitação.
  4. No campo "Contato/Solicitação" escrever o texto; selecionar "Enviar".
  5. Acompanhar: o sistema mostra código da solicitação, data e horário, nome do solicitante, responsável do departamento, último contato, data de previsão, status e quantidade de mensagens "!"; também as mensagens enviadas e respostas do responsável.
  6. Opções na tela: Opção 1 abrir pasta com arquivos anexados no chat; Opção 2 limpar o texto; Opção 3 anexar arquivos (prints, vídeos, documentos); Opção 4 gravar áudio; Opção 5 enviar a mensagem.
  7. Limite: ao atingir 5 abertas, avaliar uma concluída: botão direito sobre a solicitação concluída > "Avaliar" -> libera nova abertura.
- **Campos e regras de negócio:** Limite de 5 solicitações abertas por usuário; para abrir mais, avaliar solicitação concluída ou contatar Sucesso do Cliente. Os dados do manual são apenas exemplos ("Importante: As informações mostradas neste manual são apenas exemplos").
- **Ações de risco:** "Enviar" (cria solicitação real para a EnterpriseERP - não usar em exploração); "Avaliar" (fecha o ciclo de uma solicitação concluída); anexar/gravar áudio.
- **Candidatos a cenário de teste:**
  1. Navegação: AppERP > Contato/Solicitação -> assere abertura da tela 016.
  2. Positivo (apenas com autorização, pois envia ao suporte real): nova solicitação com departamento, tipo e texto -> assere linha com código, status e data.
  3. Validação: "Enviar" com texto vazio -> assere bloqueio (comportamento não informado).
  4. Borda: 5 abertas -> sexta bloqueada até "Avaliar" uma concluída.
- **Lacunas:** Valores dos departamentos/tipos; mensagem exibida ao atingir limite; campos obrigatórios; status possíveis; se o "+" verde é bloqueado ou mostra mensagem no limite.

---

## 10. Como alterar data de entrega de fórmulas ao cliente

- **Manual:** Como alterar data de entrega de fórmulas ao cliente - "Manual - Alterar Horário de Entrega" (v. 26.5, julho/2026) - Parte geral
- **Objetivo:** Alterar data e horário de entrega de uma receita na Tela 145 por dois métodos (calendário e lápis com permissão 320).
- **Tela(s) e caminho de menu:** "Tela 145 - Atendimento ao Cliente - Receita"; tela "Alterar horário de entrega"; permissão 320. (O texto cita "Tela 125 - Atendimento ao cliente - Receita" no título do método 1: provável erro de digitação, ver Lacunas.)
- **Pré-requisitos:** Receita aberta na Tela 145; para o Método 2, usuário/senha de quem tenha a permissão 320; horários de laboratório cadastrados (influenciam o resultado).
- **Fluxo:**
  1. Método 1 - Calendário: clicar no calendário azul, selecionar a nova data e clicar "Continuar"; informar o novo horário de entrega e clicar "Gravar".
  2. Método 2 - Lápis: clicar no ícone de lápis (exige permissão 320); informar usuário e senha de um usuário com a permissão; na tela "Alterar horário de entrega" informar nova data e novo horário.
  3. Gravar: clicar "Gravar" nessa tela e depois "Gravar" novamente na Tela 145 para salvar a alteração.
- **Campos e regras de negócio:** Permissão 320 necessária para o lápis (pede usuário e senha de um usuário autorizado). "Importante: Caso existam horários de laboratório cadastrados, a data e o horário irão prevalecer conforme a disponibilidade configurada nos horários de laboratório": ex.: se se escolhe segunda 31/08/2026 18:00 e todos os horários de segunda estão ocupados, o sistema pode alterar automaticamente para a próxima data/horário disponível ao gravar.
- **Ações de risco:** "Gravar" (duas vezes) altera a data de entrega da receita; autenticação com credenciais de outro usuário (permissão 320).
- **Candidatos a cenário de teste:**
  1. Positivo Método 1: calendário azul -> nova data -> "Continuar" -> novo horário -> "Gravar" (tela) -> "Gravar" (Tela 145) -> assere nova data/hora exibida.
  2. Positivo Método 2: lápis -> usuário/senha com permissão 320 -> nova data/hora -> Gravar x2.
  3. Negativo: lápis com usuário sem permissão 320 -> assere recusa (mensagem não informada).
  4. Borda: escolher horário já lotado com horários de laboratório cadastrados -> assere reajuste automático para próximo disponível.
  5. Regra: não clicar no segundo "Gravar" da Tela 145 -> assere que a alteração não persiste.
- **Lacunas:** Número real da tela do método 1 (125 vs 145); mensagens de erro/permissão; mensagem ou sinalização do reajuste automático; formato de data/hora dos campos; o nome do campo do usuário/senha no pop-up.

---

## 11. Como cadastrar funcionário (completo - mais abrangente)

- **Manual:** Como cadastrar funcionário OK - "Como cadastrar funcionário e permissões" (v. 26.2, abril/2026) - Parte geral
- **Objetivo:** Cadastrar funcionário (Tela 007), criar usuário/permissões (Tela 018), grupos de permissões, cópia e consulta de permissões.
- **Tela(s) e caminho de menu:** "Cadastro > Funcionário > Ficha do funcionário" -> "Tela 007" (abas "Info. pessoais" e "Classificações"); "Usuário > Permissões" -> "Tela 018".
- **Pré-requisitos:** Campos obrigatórios das abas "Info. pessoais" e "Classificações" (não listados); para copiar permissões, o usuário de destino precisa já ter senha criada e intervalo de conexão definido.
- **Fluxo:**
  1. Menu "Cadastro > Funcionário > Ficha do funcionário" -> Tela 007; preencher obrigatórios da aba "Info. pessoais".
  2. Aba "Classificações": preencher obrigatórios e "Gravar" -> o sistema gera um código do funcionário, usado para login.
  3. Menu "Usuário > Permissões" -> Tela 018: informar o código ou nome do usuário; criar senha inicial (ex.: 12345; após o primeiro acesso o sistema solicita alteração); preencher "Intervalo permitido p/ conexão" (ex.: 08:00 às 18:00); "Gravar".
  4. Entender permissões: botão direito > "Legenda". Siglas: "AT" permissão ativa; "I" incluir novos registros; "A" alterar registros existentes; "E" excluir ou cancelar registros.
  5. Liberar: botão direito > "Ativar todas as permissões", ou ativar manualmente apenas as necessárias. Obs.: "Caso o cadastro seja gravado sem permissões, o usuário não conseguirá acessar o sistema."
  6. Filtros: nas abas Consultas e Relatórios usar o filtro de grupos; é necessário liberar permissões nas três categorias: 1. "Formulários - Telas", 2. "Consultas - Consultas do sistema para visualização de informações", 3. "Relatórios - Relatórios do sistema"; senão, ao acessar consultas/relatórios aparece alerta informando que o usuário não possui permissão.
  7. Copiar permissões: "Copiar permissões para outro usuário": Campo 1 = usuário que possui as permissões; Campo 2 = usuário que receberá; clicar no ícone Play. "Se preencher invertido, o usuário com permissões pode perdê-las."
  8. Grupos de permissões: criar grupos por setor (Atendimento, Farmacêutico, Financeiro, Diretoria): no campo "Grupo" informar o nome, pressionar Enter duas vezes, "Gravar"; depois liberar as permissões do grupo. "Sempre realize alterações de permissões no grupo, e não diretamente no usuário."
  9. Vincular usuário ao grupo: selecionar o usuário, "Incluir permissões do grupo", escolher o grupo, ícone Play, confirmar a operação.
  10. Consulta: opção "Lista de usuário e grupo por permissão": ver quem tem determinada permissão, a qual grupo cada usuário pertence, consultar por grupo ou usuário, incluir/remover permissões; filtros (ex.: "CAIXA") e opções 1. Formulários - Telas, 2. Consultas, 3. Relatórios.
  11. Filtros avançados (parte inferior): "Lista de usuários" (todos) e "Lista de grupos de permissões"; filtros "Ativo", "Incluir", "Alterar", "Excluir" com "Sim" mostrando só quem tem a permissão ativa.
- **Campos e regras de negócio:** O código gerado ao gravar o funcionário é o login. Senha inicial obrigatoriamente trocada no primeiro acesso. "Intervalo permitido p/ conexão" restringe horário de login. Sem permissões o usuário não acessa o sistema. Permissões em três categorias (Telas, Consultas, Relatórios). Preferir alterar no grupo.
- **Ações de risco:** "Ativar todas as permissões" (acesso total); "Copiar permissões para outro usuário" (campos invertidos fazem o usuário de origem perder permissões); remover permissões; "Incluir permissões do grupo"; flag "E" (excluir/cancelar); Gravar.
- **Candidatos a cenário de teste:**
  1. Positivo: cadastrar funcionário (obrigatórios nas duas abas) e Gravar -> assere código gerado.
  2. Positivo: criar usuário na Tela 018 com senha inicial e intervalo 08:00-18:00 -> Gravar.
  3. Negativo: usuário sem nenhuma permissão tenta logar -> assere que não acessa o sistema.
  4. Regra: usuário com Telas liberadas e sem Consultas/Relatórios -> assere alerta de falta de permissão.
  5. Positivo: vincular usuário a grupo e conferir em "Lista de usuário e grupo por permissão" com filtro (ex.: CAIXA).
  6. Primeiro login: assere solicitação de troca de senha.
  7. Borda: login fora do "Intervalo permitido p/ conexão" -> assere bloqueio (comportamento esperado, não detalhado).
- **Lacunas:** Campos obrigatórios das abas; regras de senha (tamanho/complexidade); mensagem do alerta de permissão; comportamento exato fora do intervalo; onde fica o botão "Copiar permissões..." e a "Lista de usuário e grupo por permissão"; menu "Cadastro" (singular) vs "Cadastros" nos outros manuais.

---

## 12. Como cadastrar funcionário básico (diferencial)

- **Manual:** Como cadastrar funcionário básico OK - "Manual - Cadastro de Funcionário no Sistema OmniCare" (v. 26.2, julho/2026) - Parte geral
- **Objetivo:** Roteiro mínimo: cadastrar funcionário, criar usuário/senha/intervalo e liberar permissões.
- **Diferencial em relação ao completo:** Mesmo caminho ("Cadastro > Funcionário > Ficha do funcionário", Tela 007; "Usuário > Permissões", Tela 018) e mesmos passos 1 a 4 (cadastro, código de login, senha inicial 12345, "Intervalo permitido p/ conexão" 08:00 às 18:00, legenda AT/I/A/E, "Ativar todas as permissões" e a observação de usuário sem permissões não acessar). NÃO inclui: filtros de Formulários/Consultas/Relatórios, "Copiar permissões para outro usuário", grupos de permissões, vinculação a grupo, "Lista de usuário e grupo por permissão" e filtros avançados.
- **Candidatos a cenário de teste:** cenários 1, 2, 3 e 6 do manual completo; sem cobertura de grupos.
- **Lacunas:** as mesmas do completo.

---

## 13. Como utilizar A PAGAR

- **Manual:** Como utilizar  A PAGAR - OK - "Como cadastrar A pagar / Como usar o A pagar" (v. 26.2, março/2026) - Parte geral
- **Objetivo:** Cadastrar o lançamento "A pagar", configurá-lo no caixa e usá-lo para receber pagamento parcial (sinal) deixando saldo em aberto, quitar depois e consultar débitos.
- **Tela(s) e caminho de menu:** "tela de lançamentos" -> "Tela 056"; "Tela 011" (grupo); "tela 395 - PDV Frente de Caixa" > três pontinhos > "Configurações" -> "tela 568"; "CONCLUIR MOVIMENTOS" -> "Tela 379"; "Consultas > Movimentações > Atendimento" -> "Tela 391"; "Tela 145" (receita); relatório "184 - Débitos do Cliente"; consulta "1264".
- **Pré-requisitos:** Lançamento "A pagar" cadastrado (Tela 056); caixa configurado (Tela 568); receita concluída com financeiro gerado; caixa aberto (ver manual Caixa).
- **Fluxo:**
  1. Cadastro: acessar a tela de lançamentos (Tela 056): "Tipo de lançamento" = "Receita"; "Tipo de movimento" = "Dinheiro"; "Nome do lançamento" = "A pagar".
  2. Grupo: ícone azul -> Tela 011: nome "MOVIMENTAÇÃO DE CAIXA (A PAGAR)" e "Gravar".
  3. Preencher "Situação" e "Centro de receita" e "Gravar".
  4. Configurar caixa: Tela 395 > três pontinhos > "Configurações" -> tela 568: em "A PAGAR" clicar a lupa, selecionar a forma de pagamento "A pagar" e "Gravar".
  5. Uso: Tela 395; localizar receita por código ou "CONSULTAR" (filtrar por data; verificar fórmula concluída; confirmar financeiro gerado); selecionar "CF" e "CONTINUAR"; opcionalmente incluir mais fórmulas; ENTER para tela de pagamento.
  6. Pagamento parcial (sinal): informar forma de pagamento e valor pago (ex.: R$ 20,00); ENTER; para o restante selecionar "A PAGAR" (botão verde) e confirmar a operação.
  7. O sistema abre a tela de financeiro com valor pago e valor pendente; na tela da receita (Tela 145) é exibido o código do financeiro; ícone de dinheiro mostra valor pago, forma de pagamento e valor pendente do cliente. "Apenas o valor pago aparecerá no caixa do funcionário."
  8. Quitar: voltar à Tela 395 > "CONCLUIR MOVIMENTOS" -> Tela 379: usar "Movimento = Código da receita" ou "Financeiro = Código do financeiro", digitar o código e ENTER (ou usar consulta). Para achar o código: "Consultas > Movimentações > Atendimento" (Tela 391): informar a data, opção "CLIENTE", nome do cliente, ícone verde para atualizar, Status "2 - Concluídos"; duplo clique no atendimento ou copiar o código.
  9. Realizar pagamento: após o código, ENTER; informar forma de pagamento e valor pago; ENTER (pode usar mais de uma forma); conferir valores e selecionar "OK" para finalizar e mudar o status da receita -> na Tela 145 o status passa a "FINALIZADO".
  10. Relatório "184 - Débitos do Cliente": informar o código 184; botão direito > "incluir" filtro (Tipo de filtro, Campo, Condição, Valor "A pagar"; "Incluir"); período opcional; visualizar (duplo clique ou "visualizar"). Exibe nome do cliente, valores em aberto, código do financeiro.
  11. Consulta de movimentos: em "OPÇÕES" > "CONSULTA", no campo "FILTRAR" digitar 1264, duplo clique no nome; informar período e "EXECUTAR" -> receitas com "A pagar" em aberto, "Cód. Venda" e código da receita.
- **Campos e regras de negócio:** Lançamento "A pagar" é Receita + Dinheiro; configuração obrigatória na Tela 568. Pagamento parcial: a diferença vai para "A PAGAR"; só o valor pago entra no caixa do funcionário. O status da receita só vira "FINALIZADO" ao quitar e marcar "OK" na Tela 379. Quitação aceita múltiplas formas.
- **Ações de risco:** "A PAGAR" (gera débito do cliente); "OK" que finaliza a receita; "Gravar" na Tela 568/056; "CONCLUIR MOVIMENTOS".
- **Candidatos a cenário de teste:**
  1. Positivo: cadastrar lançamento "A pagar" (Receita/Dinheiro, grupo "MOVIMENTAÇÃO DE CAIXA (A PAGAR)") -> assere gravado e selecionável na Tela 568.
  2. Positivo: receita de R$ X com sinal R$ 20,00 + restante "A PAGAR" -> assere tela de financeiro: pago 20,00 e pendente X-20; código financeiro na Tela 145.
  3. Regra: caixa do funcionário mostra apenas o valor pago.
  4. Positivo: quitar pelo "CONCLUIR MOVIMENTOS" (Tela 379) com código da receita -> assere status "FINALIZADO" na Tela 145.
  5. Consulta: relatório 184 com filtro Valor = "A pagar" lista o cliente e o código financeiro; consulta 1264 lista a receita.
  6. Negativo: receita sem financeiro gerado não aparece em "CONSULTAR".
- **Lacunas:** Valores de "Situação" e "Centro de receita"; botão exato "A PAGAR" (verde) no layout; mensagem de confirmação; o papel de "CF"; filtros de data/tipo no relatório 184; comportamento ao quitar parcialmente em novo pagamento; título duplo do PDF ("Como cadastrar A pagar" / "Como usar o A pagar").
