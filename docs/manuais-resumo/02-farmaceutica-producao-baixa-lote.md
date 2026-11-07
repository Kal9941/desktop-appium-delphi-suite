# Manuais — Parte farmacêutica: baixa de fórmulas, conferência de lote, refazer e rastreabilidade básica

> Resumo de referência para escrita de cenários futuros, derivado dos PDFs em `docs/Manuais - OmniCare/` (8 manuais).
> **Como foi feito (2026-10-28):** texto extraído dos PDFs com `pdftotext` e resumido por leitura integral, sem consultar o app.
> **Limites:** não inclui as imagens/prints dos PDFs; as setas dos caminhos de menu se perderam na extração (aqui aparecem como `>`);
> o manual quase nunca traz mensagens literais de erro/validação nem a lista de campos obrigatórios.
> **Uso:** ponto de partida, não verdade. Todo nome de menu, botão e seletor deve ser validado por inspeção ao vivo
> antes de virar teste (`AGENTS.md` `[R-SEL]`). Ações de risco listadas aqui seguem `[R-RISCO]` (não clicar sem confirmar).
> Índice geral e convenções transversais: `PROJECT_CONTEXT.md` § "Manuais do sistema".

---

# Resumo B1 - Manuais Parte farmacêutica (produção/baixa e rastreabilidade básica)

Observação de extração: nos .txt as setas de menu (→) foram perdidas na conversão. Os caminhos de menu abaixo usam ">" no lugar do separador que o texto trazia em branco (ex.: "Movimentos  Produtos  Baixa de fórmula" no .txt = "Movimentos > Produtos > Baixa de fórmula"). Os termos entre aspas foram copiados literalmente. Todos os manuais, salvo o de lote manual, são da "Versão do sistema 26.2/26.5" e foram elaborados pela Thaiffane (Sucesso do Cliente / Implantação).

Manuais resumidos: 8.

---

## 1. Baixa e estorno de fórmulas

- **Manual:** Baixa e estorno de fórmulas OK (Parte farmacêutica). Versão do sistema 26.5, julho/2026, 10 páginas.
- **Objetivo:** Retirar do estoque as quantidades usadas dos lotes de insumos/matérias-primas de uma fórmula (baixa), estornar a baixa e registrá-la de novo.
- **Tela(s) e caminho de menu:** "Tela 433 - Baixa de Fórmulas (Receita)". Acessos: (1) "Tela 145 - Receita" > botão "Registrar baixa" na parte inferior; (2) "Movimentos > Produtos > Baixa de fórmula"; (3) campo de acesso por código da tela (canto inferior direito, perto da data e hora): digitar 433. Também citadas: tela "Pesagem monitorada".
- **Pré-requisitos:** Existir lote com saldo disponível para cada insumo/embalagem (sem saldo suficiente "o sistema não permitirá concluir a operação"). Receita/fórmula existente (código da receita e número da fórmula). Para pesagem monitorada: empresa usar balança com pesagem monitorada e insumos pesados.
- **Fluxo:**
  1. Abrir a Tela 433 por um dos 3 caminhos. Pelo menu ela abre em branco: informar "Código da receita" (1) e "Número da fórmula" (2) para localizar a fórmula. Pela Tela 145 abre já com a receita.
  2. (Só pesagem monitorada) Pesar todos os insumos; na Tela 433 clicar "Registrar peso" > abre tela "Pesagem monitorada" com insumos e embalagens da fórmula.
  3. Na "Pesagem monitorada": "Pesquisar por" (1) = código de barras do lote ou do produto, ou digitar no campo "Código produto" (2); pressionar Enter para carregar o lote; o sistema exibe a quantidade a pesar (3); pesar e clicar "Registrar peso" > nome do insumo fica verde. Repetir para todos e fechar a tela.
  4. Voltar à Tela 433, registrar baixa das embalagens; conferir (e alterar, se necessário) a data da baixa; clicar "Registrar baixa" > embalagens destacadas em verde = baixa concluída.
  5. Estornar: na Tela 433 alterar a opção "Baixa registrada" para "Não". Todos: botão direito > "Estornar baixa de todos os produtos". Um insumo: selecionar o item > botão direito > "Estornar baixa do produto". O sistema exibe mensagem de confirmação; confirmar.
  6. Recalcular: botão direito > "Recalcular fórmula" > o sistema exibe novamente os lotes dos insumos. Clicar "Gravar".
  7. Registrar baixa de novo: conferir a data da baixa; clicar "Registrar baixa".
  8. Após finalizar, insumos e embalagens ficam destacados em verde (baixa registrada).
- **Campos e regras de negócio:** Siglas CB e EX: "CB - Cancelar a baixa: o insumo ou a embalagem marcada continuará sendo exibida na ficha de pesagem"; "EX - Excluir a baixa: o insumo ou a embalagem marcada não será exibida na ficha de pesagem". Demais siglas: botão direito > "Legenda". "A data da baixa impacta diretamente os produtos controlados. Sempre confira esse campo antes de concluir." Verde = baixa/pesagem registrada. Saldo insuficiente no lote bloqueia a operação.
- **Ações de risco:** "Registrar baixa" (movimenta estoque, afeta controlados); "Estornar baixa de todos os produtos"; "Estornar baixa do produto"; alterar "Baixa registrada" para "Não"; "EX" (exclui item da ficha de pesagem); "Gravar" após recalcular; "Recalcular fórmula".
- **Candidatos a cenário de teste:**
  1. Positivo: abrir Tela 433 pela Tela 145 > "Registrar baixa" e asserir insumos/embalagens em verde e "Baixa registrada" = sim.
  2. Positivo: abrir pelo menu "Movimentos > Produtos > Baixa de fórmula", informar código da receita + número da fórmula e asserir carga da fórmula (tela abre em branco).
  3. Positivo: abrir digitando 433 no campo de código da tela.
  4. Negativo: lote sem saldo suficiente > asserir que a baixa não conclui (mensagem não informada).
  5. Estorno: alterar "Baixa registrada" para "Não" > "Estornar baixa do produto" > confirmar > asserir item deixa de estar verde.
  6. Ciclo completo: estornar > "Recalcular fórmula" > "Gravar" > "Registrar baixa" e asserir data da baixa conferida e itens verdes.
- **Lacunas:** Texto das mensagens de confirmação e de erro (saldo insuficiente) não informado. Posição exata dos campos/botões e o que "Gravar" faz com a baixa depende de ver a tela. Não diz se "Baixa registrada" é combo/checkbox. Não informa permissões. Se o estorno exige perfil especial: não informado. Seção "Pesagem monitorada" rotulada "4." após "3." no mesmo bloco de acessos (numeração inconsistente).

---

## 2. Baixa geral de fórmulas

- **Manual:** Baixa geral de formulas OK (Parte farmacêutica). Versão do sistema 26.2, julho/2026, 6 páginas.
- **Objetivo:** Consultar todas as fórmulas ainda sem baixa registrada e baixá-las em lote.
- **Tela(s) e caminho de menu:** "Tela 433 - Baixa de Fórmulas (Receita)" (acesso: Tela 145 > "Registrar baixa"; "Movimentos > Produtos > Baixa de fórmula"; código 433 no campo de acesso) > botão "três pontos (...)" > opção "Baixa geral de fórmulas" > "Tela 241 - Baixa Geral de Fórmulas".
- **Pré-requisitos:** Fórmulas concluídas sem baixa; cada insumo/embalagem com lote (fórmula com item sem lote não é baixada).
- **Fluxo:**
  1. Abrir a Tela 433 (qualquer dos 3 acessos).
  2. Clicar nos três pontos (...) > "Baixa geral de fórmulas" > abre a Tela 241.
  3. No campo de pesquisa filtrar por tipo de data: "Data aviada" (data de conclusão da receita); "Data de cadastro" (data em que o orçamento foi gerado; a fórmula só aparece se a receita estiver concluída); "Data de entrega" (data de finalização da receita). Definir intervalo de datas.
  4. Filtrar por laboratório ("Sólidos, semissólidos e líquidos"), por loja (se houver mais de uma) e por forma farmacêutica. O sistema atualiza automaticamente a lista após definir filtros.
  5. Campo "Opções": "fórmulas sem controlados", "fórmulas com controlados" ou "fórmulas com Portaria 240".
  6. Definir a data da baixa e clicar "Registrar baixa geral" > o sistema baixa as fórmulas exibidas.
  7. Fórmulas que permanecem na tela: verificar insumo/embalagem sem lote (o sistema não baixa nesses casos). Corrigir e clicar de novo em "Registrar baixa geral".
  8. Alternativa para fórmula sem lote: marcar CB na Tela 433, clicar "gravar" e depois "Registrar Baixa" (texto do manual).
- **Campos e regras de negócio:** CB e EX: "CB - Cancelar a baixa: o item marcado continuará sendo exibido na ficha de pesagem"; "EX - Excluir a baixa: o item marcado não será exibido na ficha de pesagem e nem no refazer". Fórmula com insumo/embalagem sem lote não é baixada e permanece na lista. "Data de cadastro" só lista fórmulas de receitas concluídas. Lote por laboratório (sólidos/semissólidos/líquidos).
- **Ações de risco:** "Registrar baixa geral" (baixa em massa, impacta controlados/Portaria 240 e estoque; usar período/filtros mínimos); "EX"; "gravar"/"Registrar Baixa" na Tela 433.
- **Candidatos a cenário de teste:**
  1. Positivo: Tela 433 > "..." > "Baixa geral de fórmulas" abre a Tela 241 (asserir título e filtros).
  2. Filtros: alternar "Data aviada"/"Data de cadastro"/"Data de entrega" + intervalo e asserir mudança da lista.
  3. Filtro "Opções": "fórmulas com Portaria 240" lista só fórmulas com essa característica.
  4. Positivo: "Registrar baixa geral" com fórmulas válidas > lista esvazia (usar massa de teste isolada).
  5. Borda/negativo: fórmula com insumo sem lote permanece na tela após "Registrar baixa geral".
  6. Filtro por laboratório (Sólidos/Semissólidos/Líquidos) e por forma farmacêutica.
- **Lacunas:** Mensagens do sistema não informadas. O que é "Data aviada" vs "Data de entrega" é descrito de forma quase sobreposta. Não diz se há confirmação antes de "Registrar baixa geral". Passo final da seção "Fórmulas sem lote" ("Após selecionar uma das opções, clique gravar e depois em Registrar Baixa") é ambíguo sobre qual opção (CB/EX) é selecionada. Não informa se é possível desmarcar fórmulas da lista antes da baixa. Sobreposição: acessos à Tela 433 repetem o manual "Baixa e estorno de fórmulas".

---

## 3. Conferência (de lote - Tela 425)

- **Manual:** Conferencia (título interno "CONFERÊNCIA DE LOTE - 425") (Parte farmacêutica). Versão do sistema 26.5, setembro/2026, 19 páginas.
- **Objetivo:** Conferir fisicamente lotes de estoque, ajustar quantidades, gerar lista de perda e, se necessário, nota fiscal da perda.
- **Tela(s) e caminho de menu:** "Movimentos - Produtos - Movimentações de estoque" > "Tela 425 - Movimentação de estoque" > "Tipo de movimento": "1 - Conferência - Lote". Telas citadas: tela de inclusão/retirada de produto; Tela 425 com tipo "5 - Perda".
- **Pré-requisitos:** Lotes cadastrados com saldo nos estoques (Almoxarifado/Laboratório). Perfil/usuário com permissão de Autorizar e Registrar (não informado). Para lista de perda: lotes cujo saldo do sistema seja maior que a quantidade física conferida.
- **Fluxo:**
  1. Acessar o menu e na Tela 425 selecionar "Tipo de movimento": "1 - Conferência - Lote".
  2. Método 1 - Produto por produto: botão direito > "Incluir" > tela de inclusão/retirada de produto. Selecionar "Tipo de produto"; "Estoque origem" (Almoxarifado ou Laboratório); selecionar produto (pesquisa por código ou nome); conferir "Status" do lote. O sistema exibe: "Lote Sis. LA", lote, concentração, fabricação, vencimento, "cód. compra", fornecedor, local e saldo.
  3. Informar em "Quantidade" a quantidade física correta e clicar "Incluir/Alterar" > retorna à Tela 425 com o valor informado. Repetir (botão direito > "Incluir") para outros itens.
  4. Método 2 - Gerar lista: botão direito > "Gerar lista p/ conferência". Preencher "Tipo produto"; critério de estoque: "0 - Estoque = 0" (só zerados); "1 - Estoque ≥ 0" (igual ou maior que zero, inclui sem saldo); "2 - Estoque > 0" (só saldo positivo); "3 - Estoque ≤ 0" (igual ou menor que zero, inclui zerados e negativos); "4 - Estoque < 0" (só negativos). (Os símbolos ≥/≤ foram perdidos na extração; interpretados pelas descrições.) Filtros opcionais: Grupo, Classificação, Classe, Linha, Categoria, Marca, Fabricante, Portaria e Fornecedor. Campo "Estoque" (local de onde carregar os lotes). "Vencimento máximo" (ex.: 20/09/2090 para incluir lotes com vencimento distante). Clicar "Gerar lista" > na mensagem de confirmação clicar "Sim".
  5. A lista traz produtos e lotes com quantidades zeradas e total de produtos no canto inferior da tela. Dois cliques no produto abre a tela de inclusão com saldo atual; informar "Quantidade" e "Incluir/Alterar". Alternativa: "Digitar qtde. p/ conferência" > área simplificada (produto, lote, quantidade em estoque): informar "Qtde. digitada" e Enter avança para o próximo insumo.
  6. Após conferir todos: "Gravar" > "Autorizar" > "Registrar" (registram no sistema o usuário responsável pela conferência).
  7. Lista de perda: após gravar, "Gerar lista de perda" > "Sim" > selecionar o motivo da perda > "Confirmar" > mensagem de que a lista foi gerada; "Sim" para abrir. A Tela 425 abre com o tipo "5 - Perda" mostrando insumos e valores de perda. Perda = saldo anterior - quantidade conferida (exemplo: saldo 100g, conferidas 50g = perda de 50g). Conferir valores, "Gravar" > "Autorizar" > "Registrar". Se necessário, "Gerar Nota Fiscal" (nota fiscal da perda).
  8. Consultar conferências anteriores: lupa da Tela 425 > movimentações dos últimos 30 dias.
  9. Outras opções da Tela 425: "Registrar lista" (mesma função ao lado de "Autorizar"), "Rótulos" (imprime rótulos de MP com quantidades atualizadas), "Fichas", "Consultar", "Gerar lista de perda", "Relatórios".
- **Campos e regras de negócio:** Lista gerada vem com quantidades zeradas (conferente digita o físico). Lista de perda só para lotes com saldo do sistema > quantidade conferida. Perda calculada pelo sistema. Autorizar/Registrar gravam o usuário responsável. Consulta anterior limitada aos últimos 30 dias.
- **Ações de risco:** "Gravar", "Autorizar", "Registrar"/"Registrar lista" (ajustam o estoque de forma definitiva); "Gerar lista de perda" e seu "Confirmar"; "Gerar Nota Fiscal" (emissão fiscal); Gravar/Autorizar/Registrar da lista de perda.
- **Candidatos a cenário de teste:**
  1. Positivo: Conferência produto a produto ("Incluir" > "Incluir/Alterar") e asserir valor exibido na Tela 425 (sem Gravar/Autorizar/Registrar, para não alterar estoque).
  2. Gerar lista p/ conferência com critério "2 - Estoque > 0" + "Vencimento máximo" 20/09/2090: asserir produtos listados, quantidades zeradas e total no rodapé.
  3. Critério "0 - Estoque = 0" vs "4 - Estoque < 0": asserir que só aparecem produtos correspondentes.
  4. "Digitar qtde. p/ conferência": informar "Qtde. digitada" + Enter avança para o próximo insumo.
  5. Lupa: consulta lista movimentações dos últimos 30 dias.
  6. Perda: saldo 100 / conferido 50 > perda 50 (só em massa de teste isolada, com confirmação do usuário).
- **Lacunas:** Mensagens exatas e motivos de perda disponíveis não informados. Se a quantidade informada é o novo saldo ou a diferença: o texto diz "quantidade física correta" (ou seja, novo saldo). Nome exato dos valores de "Status" do lote não informado. Não diz o que acontece quando a quantidade conferida é maior que o saldo. Ordem/habilitação dos botões "Gravar/Autorizar/Registrar" depende da tela. Sem informação de permissões. O manual inclui os rótulos "Lote Sis. LA" sem explicar o que é "LA".

---

## 4. Incluir lote manual

- **Manual:** Incluir lote manual (título "INCLUSÃO LOTE MANUAL - ALOPATIA, REVENDA, EMBALAGENS", REV. 00) (Parte farmacêutica). Março/2026, 5 páginas (Implantação).
- **Objetivo:** Incluir manualmente um lote de insumo (alopatia, revenda, embalagens) e definir de onde o sistema obtém concentração/densidade/umidade etc. ("Fator utilizado").
- **Tela(s) e caminho de menu:** "tela 112 - Cadastro de Produtos (Alopatia)" > "tela 216 - Incluir/Alterar Lotes e Estoques". Caminho de menu para chegar à tela 112: não informado (o manual diz só "Acesse a tela do insumo").
- **Pré-requisitos:** Insumo/produto já cadastrado (tela 112). Fornecedor cadastrado para seleção.
- **Fluxo:**
  1. Acessar a tela do insumo (tela 112).
  2. Duas formas de incluir lote: Opção 1: botão direito sobre o campo de lotes (abre as opções); Opção 2: botão "+" (ícone verde) (exibe as mesmas opções de inclusão de lote).
  3. Abre a "tela 216 - Incluir/Alterar Lotes e Estoques". Preencher campos: "1 - Tipo de estoque", "2 - Status", "3 - Origem", "4 - Fornecedor", "5 - Qtde. entrada", "6 - Fabricação", "7 - Vencimento", "8 - Lote" (detalhes abaixo).
  4. Preencher, se houver, Concentração, Densidade, Umidade, UI, UTR ou UFC/g conforme a matéria-prima/documentação do fornecedor.
  5. Clicar "GRAVAR" para salvar o lote.
  6. Definir o "Fator utilizado" (de onde o sistema considera esses dados).
- **Campos e regras de negócio:**
  - Tipo de estoque: "Laboratório" ou "Almoxarifado".
  - Status: "ativo, fechado ou quarentena, entre outras".
  - Origem: país de fabricação.
  - Fornecedor: quem vendeu a matéria-prima.
  - Qtde. entrada: quantidade adicionada ao lote.
  - Fabricação: se não souber, "o campo pode ser deixado em branco, e o sistema preencherá automaticamente".
  - Vencimento: se não informado, "o sistema poderá gerar automaticamente com base na data de fabricação".
  - Lote: número da nota fiscal ou criado; se não informado "o sistema gerará automaticamente um código de lote aleatório".
  - "Fator utilizado": "1 - Ficha do produto"; "2 - Lote / Ficha do produto" (busca no lote, se não tiver lote busca na ficha); "3 - Controle de qualidade (Laudo)" (se sem laudo busca na ficha); "4 - Laudo / Lote / Ficha do produto" (ordem: Laudo, Lote, Ficha). Para usar a ficha do produto é necessário preencher previamente os campos dessa ficha. Sempre clicar GRAVAR após inserir/alterar.
- **Ações de risco:** "GRAVAR" (cria lote e movimenta estoque). Sem ações destrutivas explícitas.
- **Candidatos a cenário de teste:**
  1. Positivo: na tela 112, "+" abre a tela 216 (asserir título e campos 1 a 8).
  2. Positivo: botão direito no campo de lotes mostra as mesmas opções que o "+".
  3. Positivo: GRAVAR com Tipo de estoque, Status, Fornecedor, Qtde. entrada, Lote preenchidos > lote aparece na lista de lotes.
  4. Borda: Lote em branco > sistema gera código aleatório (asserir que não é vazio).
  5. Borda: Fabricação/Vencimento em branco > sistema preenche automaticamente (asserir não vazio; regra de cálculo não informada).
  6. "Fator utilizado" = "2 - Lote / Ficha do produto" sem dado no lote > usa ficha.
- **Lacunas:** Caminho de menu para a tela 112 não informado. Campos obrigatórios reais (além do GRAVAR) não informados. Valores completos de "Status" não listados. Onde fica o campo "Fator utilizado" (tela 216 ou 112) não está claro. A regra de geração automática de Fabricação/Vencimento não é detalhada. Manual de revisão diferente (REV. 00, endereço antigo da empresa) e não cita versão do sistema. Título cita revenda e embalagens, mas só descreve a tela 112 (Alopatia).

---

## 5. Refazer (receita de cliente)

- **Manual:** Refazer OK (Parte farmacêutica). Versão do sistema 26.2, julho/2026, 16 páginas.
- **Objetivo:** Refazer uma receita de cliente reaproveitando os dados da anterior (fórmula, posologia, rótulo, observação).
- **Tela(s) e caminho de menu:** "Movimentos > Atendimento > Refazer" (1º método) ou "Movimentos > Atendimento > Receita" (2º método). Telas: "Tela 378 - Atendimento ao Cliente - Refazer"; "Tela 046 - Cadastro de Clientes"; "Tela 145 - Atendimento ao Cliente - Receita".
- **Pré-requisitos:** Receita anterior cadastrada para o cliente (status Orçamento, Concluídas, Cancelado ou Descartado). Cliente cadastrado.
- **Fluxo (1º método - tela de Refazer):**
  1. Acessar "Movimentos > Atendimento > Refazer" > Tela 378.
  2. Informar a data; escolher tipo de pesquisa "Por cliente" ou "Por produto". Também é possível pesquisar pelo código do movimento (digitar e pressionar Enter).
  3. Verificar o status selecionado na pesquisa (se nenhum resultado aparecer, confira se o status corresponde ao movimento).
  4. Para pesquisar por cliente, clicar no ícone azul > Tela 046 - Cadastro de Clientes: pesquisar o nome, confirmar os dados e fechar a tela.
  5. De volta à Tela 378 aparecem as receitas já cadastradas. Filtros por status: "Orçamento" (receitas em orçamento), "Concluídas" (finalizadas), "Cancelado" (vendas canceladas - revenda), "Descartado" (receitas descartadas); e por tipo: "Receita humana", "Receita animal", "Revenda".
  6. Lista de movimentos exibe: código da receita, nome do cliente, prescritor, loja, data, valores, desconto, "IMG" (imagem anexada), "CO" (copiar observação).
  7. Lista de fórmulas mostra laboratório, forma farmacêutica e quantidade; ao selecionar exibe insumos e quantidades.
  8. Marcar "RF" na fórmula a refazer > a linha fica verde.
  9. Em "Lista de fórmulas selecionadas p/ o refazer" o sistema mostra: quantidade de fórmulas, laboratório, forma farmacêutica, quantidade, valor.
  10. Opções: "IA - Inclusão automática (já vem marcada)"; "FA - Fórmula aviada (já vem marcada)"; "CP - Copiar posologia"; "CR - Copiar texto do rótulo"; "CO - Copiar observação"; "RF - Selecionar para refazer". Ao marcar CR o sistema pergunta se deseja copiar o rótulo > "SIM".
  11. Clicar "Processar Refazer" e confirmar a operação.
  12. O sistema abre a Tela 145 - Atendimento ao Cliente - Receita com cliente, prescritor, informativo de refazer e fórmula completa.
  13. Os insumos aparecem riscados; clicar "Calcular" > o sistema calcula automaticamente as embalagens e as exibe corretamente.
- **Fluxo (2º método - pela Receita):** "Movimentos > Atendimento > Receita" (Tela 145) > ícone azul em "Paciente" > Tela 046: pesquisar o cliente, confirmar os dados, clicar "REFAZER" > abre a Tela 378 - Refazer e segue os mesmos passos do 1º método.
- **Campos e regras de negócio:** "IA" e "FA" vêm marcadas por padrão. Linha selecionada para refazer fica verde. Insumos aparecem riscados na nova receita até "Calcular", que recalcula embalagens. Filtro de status pode esconder resultados. "O refazer permite reaproveitar todas as informações da receita anterior".
- **Ações de risco:** "Processar Refazer" (cria nova receita/movimento) e sua confirmação; "Calcular" na nova receita; marcar CR/CP/CO (apenas cópia).
- **Candidatos a cenário de teste:**
  1. Positivo: "Movimentos > Atendimento > Refazer" abre Tela 378 (asserir título).
  2. Positivo: pesquisa por cliente via ícone azul > Tela 046 e retorno à 378 com receitas listadas.
  3. Filtros por status/tipo ("Concluídas", "Orçamento", "Descartado", "Receita humana"...): asserir que a lista muda.
  4. Pesquisa por código do movimento + Enter.
  5. Marcar "RF" > linha verde e fórmula aparece em "Lista de fórmulas selecionadas p/ o refazer"; "IA"/"FA" marcadas por padrão.
  6. Marcar "CR" > pergunta de cópia de rótulo > "SIM" (e "Processar Refazer" apenas com confirmação do usuário, pois cria receita).
  7. 2º método: Tela 145 > Paciente > Tela 046 > "REFAZER" abre Tela 378.
- **Lacunas:** Texto das mensagens de confirmação não informado. Os dois itens vazios no fim da lista de "Lista de movimentos" (bullets sem texto) indicam colunas não capturadas. Se "Calcular" é obrigatório e quais embalagens serão calculadas: depende da tela. Comportamento quando nenhuma fórmula é marcada "RF" ao clicar "Processar Refazer": não informado. Sobreposição: Tela 145 e Tela 046 aparecem também em outros manuais de atendimento.

---

## 6. Rastreabilidade - Registro pela tela 267

- **Manual:** Rastreabilidade - Registro pela tela 267 (Parte farmacêutica). Versão do sistema 26.2, julho/2026, 6 páginas.
- **Objetivo:** Consultar ou registrar processos de rastreabilidade (receita, produção, revenda, entrega) pela Tela 267 usando o código da receita.
- **Tela(s) e caminho de menu:** "Tela 267 - Rastreabilidade de Processos" (menu: "Rastreabilidade"); configuração de código de barras: "Atendimento > Configurações" > "Tela 146 - Configurações" > aba/opção "Geral" > "Imprimir código de barras nas fichas do atendimento".
- **Pré-requisitos:** Processos cadastrados e vinculados às formas farmacêuticas, na ordem correta; processo padrão do funcionário quando necessário; permissões configuradas; impressão de códigos de barras testada; métodos de registro definidos (checklist final do manual). Para leitor de código de barras: opção de impressão do código na ficha habilitada.
- **Fluxo:**
  1. (Se o código de barras não aparece na ficha) Menu "Atendimento > Configurações" > Tela 146 > "Geral" > marcar "Imprimir código de barras nas fichas do atendimento" e salvar.
  2. Menu "Rastreabilidade" abre a Tela 267 (consultar e registrar receitas ou produções).
  3. Consultar: selecionar "0 - Consultar"; escolher o tipo de movimento: "Receita", "Produção", "Revenda" ou "Entrega"; informar o código. O sistema pode exibir: nome do cliente, forma farmacêutica, data de entrega, prescritor, loja, processos já realizados.
  4. Registrar: selecionar "1 - Registrar"; escolher o tipo de movimento a registrar. Conferir o processo apresentado na tela (se o funcionário tem processo padrão, o sistema pode preenchê-lo automaticamente).
  5. Informar o código da receita por leitor de código de barras ou digitação manual e pressionar Enter > o sistema registra e exibe mensagem informando que o processo foi registrado com sucesso.
- **Campos e regras de negócio:** Opções da tela: "0 - Consultar", "1 - Registrar"; tipos de movimento: Receita/Produção/Revenda/Entrega. Processo padrão do funcionário pré-preenche o processo. Recomenda-se testar com uma receita antes de usar em todas as produções.
- **Ações de risco:** Registrar processo (Enter após código com "1 - Registrar" grava de fato; sem etapa de confirmação descrita); salvar configuração da Tela 146.
- **Candidatos a cenário de teste:**
  1. Positivo: menu "Rastreabilidade" abre Tela 267.
  2. Positivo: "0 - Consultar" > tipo "Receita" > código > asserir exibição de cliente, forma farmacêutica, data de entrega, prescritor, loja e processos realizados.
  3. Consultar para cada tipo (Receita, Produção, Revenda, Entrega).
  4. Positivo: "1 - Registrar" + código + Enter > mensagem de sucesso (em massa descartável).
  5. Preenchimento automático do processo quando o funcionário possui processo padrão.
  6. Configuração: Tela 146 > "Geral" > "Imprimir código de barras nas fichas do atendimento" marcado.
- **Lacunas:** Texto exato da mensagem de sucesso, de código inválido ou de processo fora da ordem: não informado. Como é a seleção do processo na tela e se há validação de ordem: depende da tela. Sobreposição: os manuais "Acesso sem Login" e "Registro Manual e Processo Padrão" repetem a introdução e o checklist final. Neste manual o checklist inclui "A impressão dos códigos de barras foi testada" (ausente no manual "Registro Manual e Processo Padrão").

---

## 7. Rastreabilidade Acesso sem Login

- **Manual:** Rastreabilidade Acesso sem Login (título "RASTREABILIDADE - TELA 267 E REGISTRO SEM LOGIN") (Parte farmacêutica). Versão do sistema 26.2, julho/2026, 8 páginas.
- **Objetivo:** Registrar rastreabilidade de processos sem entrar no sistema com usuário e senha, usando código de barras do funcionário.
- **Tela(s) e caminho de menu:** "Cadastros > Funcionários > Ficha do Funcionário" > "Tela 007 - Cadastro de Funcionários" > "Relatórios" > "Configurar relatório" > "Tela 002 - Configuração de Relatório". Na tela de login: opção "Rastreabilidade" > tela de autorização > "Tela 267 - Rastreabilidade de Processos".
- **Pré-requisitos:** Código de barras do funcionário (gerado ao gravar o cadastro) e leitor de código de barras. Impressora e papel configurados. Processos cadastrados/vinculados; processo padrão do funcionário (recomendado).
- **Fluxo:**
  1. Gerar o código do funcionário: "Cadastros > Funcionários > Ficha do Funcionário" > Tela 007; ao gravar o cadastro o sistema cria o código de barras.
  2. Na Tela 007 acessar "Relatórios"; antes de visualizar/imprimir clicar "Configurar relatório" > Tela 002.
  3. Na Tela 002: selecionar o relatório; selecionar a impressora; informar o tipo de impressora; informar o tipo de papel; configurar "Posição cód. barras" (obrigatória para imprimir corretamente); "Gravar" e retornar.
  4. Na tela de relatórios, dois cliques no relatório para visualizar; o relatório pode ter códigos de vários funcionários (usar setas de navegação para localizar); imprimir.
  5. Na tela de login do sistema, clicar no X ou apertar ESC para fechar a janela de identificação; surge a opção "Rastreabilidade"; clicar.
  6. Abre tela de autorização: ler o código de barras do funcionário > abre a Tela 267 - Rastreabilidade de Processos.
  7. O usuário tem 15 segundos para registrar ou consultar uma receita; depois a tela fecha automaticamente (tempo padrão, não alterável).
  8. Recomendação: ler o código do funcionário e em seguida o código da receita. Sem processo padrão, selecionar o processo correto antes de registrar. Ao informar o código da receita aparece mensagem confirmando que o processo foi registrado com sucesso.
- **Campos e regras de negócio:** "A configuração da posição do código de barras é obrigatória". Janela de 15 segundos fixa. Funcionário sem processo padrão precisa selecionar o processo. Introdução: a rastreabilidade registra processo, colaborador, data/horário, etapa atual e processos pendentes; exemplos de processos: Pesagem, Encapsulamento, Conferência, Impressão de rótulo, Impressão de ficha, Controle de qualidade, Liberação da fórmula.
- **Ações de risco:** Registro de processo (grava sob identidade do funcionário do código lido); "Gravar" na Tela 002 e no cadastro do funcionário (alteram configuração/cadastro). Fechar a janela de login (X/ESC) é o caminho de acesso, não destrutivo.
- **Candidatos a cenário de teste:**
  1. Positivo: na tela de login, ESC/X fecha a identificação e aparece a opção "Rastreabilidade".
  2. Positivo: leitura de código de funcionário (simulada por digitação/teclado se possível) abre a Tela 267.
  3. Borda: após abrir pela via sem login, a tela fecha automaticamente em 15 segundos (asserir fechamento entre ~15s).
  4. Positivo: relatório de código de barras na Tela 007 > "Relatórios" > "Configurar relatório" (Tela 002) exige "Posição cód. barras".
  5. Positivo: registrar processo com código da receita e verificar mensagem de sucesso.
  6. Negativo: funcionário sem processo padrão precisa selecionar o processo antes de registrar.
- **Lacunas:** O manual não informa o formato do código de barras do funcionário nem como simulá-lo sem leitor (leitor emula teclado: não informado). Texto da tela de autorização e das mensagens: não informado. Não informa o que acontece se o código for inválido ou a leitura falhar. O texto fala em "tela de login" com janela de identificação, mas não detalha elementos. Duas seções numeradas "1." no PDF (numeração duplicada). Sobreposição: seções 1 e 2 repetem o manual "Registro pela tela 267"; o assunto de impressão do código de barras do funcionário é exclusivo deste manual.

---

## 8. Rastreabilidade Registro Manual e Processo Padrão

- **Manual:** Rastreabilidade Registro Manual e Processo Padrao (título "RASTREABILIDADE - REGISTRO MANUAL E PROCESSO PADRÃO") (Parte farmacêutica). Versão do sistema 26.2, julho/2026, 16 páginas.
- **Objetivo:** Cadastrar processos de rastreabilidade, vinculá-los às formas farmacêuticas, registrar manualmente pela receita (Tela 145) e definir o processo padrão do funcionário.
- **Tela(s) e caminho de menu:** "Cadastros > Atendimentos > Processos de Produção/Rastreabilidade" > "Tela 229 - Cadastro de Processo de Produção/Rastreabilidade". "Cadastros > Atendimentos > Forma Farmacêutica > Ficha da Forma Farmacêutica" (campo "Processo de Produção/Rastreabilidade"). "Tela 146 - Configurações" (opção "Mostrar processos de produção na ficha de pesagem"). "Tela 145 - Receita" (aba "5 - Rastreabilidade de Processos"). "Cadastros > Funcionários > Ficha do Funcionário" > "Tela 007 - Cadastro de Funcionários" (opção "Processo de Produção"). Processo padrão pode ser usado nas telas: "Tela 145 - Receita; Tela 433 - Baixa de fórmula; Tela 237 - Produção interna; Tela 232 - Revenda".
- **Pré-requisitos:** Processos cadastrados (Tela 229) e vinculados à forma farmacêutica. Receita concluída (para ver a aba 5) e criada após a configuração da rastreabilidade ("Receitas antigas não receberão automaticamente os novos processos"). Integração do WhatsApp no OmniCare (apenas para a mensagem ao cliente). Funcionário com processo padrão (para uso de "Registrar processo").
- **Fluxo:**
  1. Cadastrar processo: "Cadastros > Atendimentos > Processos de Produção/Rastreabilidade" > Tela 229. Preencher "Nome do processo"; "Tipo de processo": "1 - Produção", "2 - Impressão de rótulo", "3 - Impressão de fichas", "4 - Outros processos"; "Tipo de inclusão": "Fórmula" (registrar individualmente em cada fórmula) ou "Receita" (registra em todas as fórmulas da receita ao mesmo tempo); "Descrição ou assinatura na ficha de pesagem" (exibe o nome do processo e espaço para assinatura, ex.: "Conferência: ______"); "Mensagem enviada ao registrar o processo" (ex.: "Sua fórmula está na etapa de conferência."; requer integração WhatsApp).
  2. Opções da Tela 229: "Processo opcional"; "Comissão"; "Registrar baixa" (baixa automática dos produtos ao registrar o processo); "Bloquear receita" (impede alterações na receita após registro); "Bloquear cálculo" (impede recalcular a fórmula); "Bloquear o registro do processo quando houver produto sem baixa" (não permite registrar pela Tela 267 enquanto houver produto sem baixa).
  3. Clicar "Gravar"; depois "Limpar" para cadastrar o próximo; repetir.
  4. Vincular: "Cadastros > Atendimentos > Forma Farmacêutica > Ficha da Forma Farmacêutica" > selecionar a forma > campo "Processo de Produção/Rastreabilidade": botão direito no campo ou botão "+" > selecionar o processo. "Pagar comissão" define se o colaborador recebe comissão pelo processo (somente se a empresa usa comissão por processo realizado). Ordenar com as setas do canto direito (exemplo: 1. Inicial; 2. Pesagem; 3. Final); "Gravar". Botão direito > "Cadastro de Tipo de Produção" abre a Tela 229 (cadastrar, alterar, consultar); depois voltar, incluir o processo na sequência e "Gravar".
  5. Exibir na ficha de pesagem: Tela 146 - Configurações > marcar "Mostrar processos de produção na ficha de pesagem" > "Gravar".
  6. Registro manual pela receita: abrir a receita na Tela 145 (precisa estar concluída) > aba "5 - Rastreabilidade de Processos" lista os processos vinculados à forma farmacêutica. Marcar "OK" no processo realizado > o sistema registra nome do colaborador, data e horário, consultáveis na própria receita.
  7. Processo padrão do funcionário: "Cadastros > Funcionários > Ficha do Funcionário" > Tela 007 > localizar o funcionário > opção "Processo de Produção" > selecionar > "Gravar". Depois o funcionário pode usar "Registrar processo" conforme o processo do cadastro; ao confirmar, o sistema mostra mensagem de que o processo foi registrado com sucesso e o nome do colaborador fica na aba "5 - Rastreabilidade de Processos". Ao clicar, abre informativo de confirmação.
- **Campos e regras de negócio:** "Tipo de inclusão" Fórmula vs Receita (exemplo: receita com 5 fórmulas: individual em cada uma vs todas de uma vez). "Processo opcional" permite a fórmula seguir mesmo sem registrar esse processo. "Registrar baixa" (no processo) dá baixa automática ao registrar. "Bloquear receita"/"Bloquear cálculo" travam alteração/recálculo após registro. "Bloquear o registro ... quando houver produto sem baixa" vale para a Tela 267. A ordem definida na forma farmacêutica é a ordem seguida pela receita. Aba "5 - Rastreabilidade de Processos" só aparece com a receita concluída e só em receitas criadas após a configuração. Mensagem ao cliente exige WhatsApp integrado. "Pagar comissão" só se a empresa usa comissão por processo realizado.
- **Ações de risco:** "Gravar" na Tela 229 (cria/altera processo); "Limpar"; reordenar/"Gravar" na ficha da forma farmacêutica (altera fluxo de produção para novas receitas); "Registrar baixa"/"Bloquear receita"/"Bloquear cálculo" (efeitos irreversíveis na receita após registro do processo); marcar "OK" na aba 5 (registra com nome/data/hora do usuário); "Registrar processo" do funcionário. Não há exclusão descrita.
- **Candidatos a cenário de teste:**
  1. Positivo: Tela 229 abre por "Cadastros > Atendimentos > Processos de Produção/Rastreabilidade" (asserir título e campos "Nome do processo", "Tipo de processo", "Tipo de inclusão").
  2. Positivo: cadastrar processo (tipo "1 - Produção", inclusão "Fórmula") > "Gravar" > "Limpar" (tela pronta para o próximo).
  3. Positivo: vincular processo à "Ficha da Forma Farmacêutica" via "+" e ordenar com as setas; "Gravar".
  4. Positivo: receita concluída > aba "5 - Rastreabilidade de Processos" lista os processos da forma; marcar "OK" registra colaborador/data/hora.
  5. Negativo/borda: receita antiga (criada antes da configuração) não exibe os novos processos; receita não concluída não exibe a aba 5.
  6. Processo padrão: Tela 007 > "Processo de Produção" > "Gravar"; "Registrar processo" usa o processo definido e exibe mensagem de sucesso.
- **Lacunas:** Tela 146 aparece aqui como "Tela 146 - Configurações" (e é a mesma citada no manual 6 com caminho "Atendimento > Configurações"). Mensagens do sistema não informadas. Onde exatamente está o botão "Registrar processo" na Tela 145/433/237/232 não é descrito. Se "Gravar" em Tela 229 valida campos obrigatórios: não informado. Numeração de seções com saltos (2.1, 2.2, 2.4; 3.2 sem 3.1; 6 recomendações). Sobreposição: introdução e checklist repetem os outros dois manuais de rastreabilidade; seção "Registro pela tela 267" detalhada no manual 6; "Bloquear o registro ... produto sem baixa" liga este manual aos manuais de baixa (1 e 2).
