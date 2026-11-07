# Manuais — Parte farmacêutica: rastreabilidade completa e conferência de processos

> Resumo de referência para escrita de cenários futuros, derivado dos PDFs em `docs/Manuais - Pharmacie/` (3 manuais).
> **Como foi feito (2026-10-28):** texto extraído dos PDFs com `pdftotext` e resumido por leitura integral, sem consultar o app.
> **Limites:** não inclui as imagens/prints dos PDFs; as setas dos caminhos de menu se perderam na extração (aqui aparecem como `>`);
> o manual quase nunca traz mensagens literais de erro/validação nem a lista de campos obrigatórios.
> **Uso:** ponto de partida, não verdade. Todo nome de menu, botão e seletor deve ser validado por inspeção ao vivo
> antes de virar teste (`AGENTS.md` `[R-SEL]`). Ações de risco listadas aqui seguem `[R-RISCO]` (não clicar sem confirmar).
> Índice geral e convenções transversais: `PROJECT_CONTEXT.md` § "Manuais do sistema".

---

# Resumo B2 - Rastreabilidade (Parte farmacêutica)

Convenção: os PDFs usam uma seta (perdida na extração) entre itens de menu; aqui escrita como " > ". Texto extraído sem imagens/prints. Versão do sistema nos manuais: 26.2 (jul/2026, autor "Thaiffane", Sucesso do Cliente).

Sobreposição: "Rastreabilidade completo" (43 p.) é o superconjunto. "Rastreabilidade OK" (41 p.) = completo menos sumário, menos exibição na ficha de pesagem (Tela 146) e menos assinatura do autor. "Conferencia de Processos" (27 p.) = capítulos 1 a 3 + Tela 600 (cap. 4) + detalhe extra de pesagem monitorada; não tem registro pela receita, processo padrão, Tela 267 nem registro sem login.

---

## 1. Rastreabilidade completo

- **Manual:** Rastreabilidade completo (Parte farmacêutica)
- **Objetivo:** Cadastrar processos de rastreabilidade (etapas de produção), vinculá-los às formas farmacêuticas e registrá-los por 4 vias (aba da receita, Tela 600, Tela 267, Tela 267 sem login).
- **Tela(s) e caminho de menu:**
  - Tela 229 - Cadastro de Processo de Produção/Rastreabilidade: "Cadastros > Atendimentos > Processos de Produção/Rastreabilidade"
  - Ficha da Forma Farmacêutica: "Cadastros > Atendimentos > Forma Farmacêutica > Ficha da Forma Farmacêutica" (sem número de tela no manual)
  - Tela 146 - Configurações (opção "Mostrar processos de produção na ficha de pesagem")
  - Tela 145 - Receita, aba "5 - Rastreabilidade de Processos"
  - Tela 600 - Conferência de Processos a Realizar: "Movimentos > Produtos > Controle de Qualidade > Conferência de Processo"
  - Tela 186 - Comunicação/SAC (aberta a partir da Tela 600 ao marcar Parado)
  - Tela 007 - Cadastro de Funcionários: "Cadastros > Funcionários > Ficha do Funcionário" (campo "Processo de Produção"; botão "Relatórios"; "Configurar relatório")
  - Tela 002 - Configuração de Relatório
  - Tela 267 - Rastreabilidade de Processos: acesso descrito apenas como "No sistema, acesse a opção: Rastreabilidade" (caminho exato de menu não informado)
  - Tela 433 - Baixa de fórmula; Tela 237 - Produção interna; Tela 232 - Revenda (citadas como telas que usam o processo padrão)
- **Pré-requisitos:**
  1. Processos cadastrados na Tela 229.
  2. Processos vinculados às formas farmacêuticas, na ordem correta.
  3. Receita criada DEPOIS da configuração (receitas antigas não recebem os novos processos automaticamente) e receita "concluída" para aparecer a aba 5.
  4. Para registro rápido: funcionário com "Processo de Produção" padrão (Tela 007).
  5. Para registro sem login: código de barras do funcionário impresso e leitor de código de barras.
  6. Para a "Mensagem enviada ao registrar o processo": integração WhatsApp no Pharmacie.
  7. Permissões dos usuários configuradas (cap. 10).
- **Fluxo:**
  1. **Cadastro (Tela 229):** preencher "Nome do processo"; escolher "Tipo de processo" (1 - Produção, 2 - Impressão de rótulo, 3 - Impressão de fichas, 4 - Outros processos); escolher "Tipo de inclusão" (Fórmula | Receita); opcionais "Descrição ou assinatura na ficha de pesagem" e "Mensagem enviada ao registrar o processo"; marcar opções (ver regras) → clicar "Gravar" → clicar "Limpar" para cadastrar o próximo.
  2. **Vínculo (Ficha da Forma Farmacêutica):** selecionar a forma → no campo "Processo de Produção/Rastreabilidade" clicar botão direito ou botão "+" → tela de inclusão → selecionar processo → opcional "Pagar comissão" → ordenar com as setas do canto direito da tela (ex.: 1. Inicial; 2. Pesagem; 3. Final) → "Gravar". Botão direito > "Cadastro de Tipo de Produção" abre a Tela 229 (cadastrar/alterar/consultar); depois voltar, incluir na sequência e "Gravar".
  3. **Ficha de pesagem:** Tela 146 - Configurações → marcar "Mostrar processos de produção na ficha de pesagem" → "Gravar".
  4. **Via receita (Tela 145):** abrir receita concluída → aba "5 - Rastreabilidade de Processos" (lista os processos da forma farmacêutica) → marcar "OK" no processo realizado → sistema registra nome do colaborador, data e horário, consultáveis na própria receita.
  5. **Via Tela 600:** abrir a tela → escolher loja de produção e processo → lista de receitas aguardando o processo → (filtros/ações abaixo) → duplo clique no nome do cliente/registro abre a tela de registro do processo → marcar todas as confirmações "OK" → "Registrar processo" → mensagem de confirmação → "Sim" → mensagem de sucesso "processo foi registrado com sucesso"; a fórmula segue para a próxima etapa conforme a sequência da forma farmacêutica. Em receita com várias fórmulas, registrar em todas (se Tipo de inclusão = Fórmula).
  6. **Tela 600 - status:** botão direito na receita > "Alterar status para" > "Pendente" (volta a ficar disponível a outros colaboradores) ou "Parado" (impedimento; o sistema pode perguntar se deseja registrar comunicação interna: se sim abre Tela 186 - Comunicação/SAC; se não, fechar a Tela 186 e voltar à Tela 600). Observação do processo parado pode ser digitada na própria Tela 600 (visível só nela). Para sair de Parado: botão direito e voltar para "Pendente".
  7. **Pesagem monitorada (Tela 600):** botão "Registrar baixa" abre a tela de baixa de fórmulas → "Registrar peso" → ao fechar a tela de baixa volta à tela do processo.
  8. **Processo padrão (Tela 007):** localizar funcionário → campo "Processo de Produção" → selecionar → "Gravar". Depois o funcionário usa "Registrar processo" com o processo do seu cadastro; mensagem de sucesso; nome do colaborador aparece na aba "5 - Rastreabilidade de Processos". Usável nas Telas 145, 433, 237 e 232; "Ao clicar vai abrir um informativo de confirmação".
  9. **Tela 267 consultar:** opção "0 - Consultar" → tipo de movimento (Receita, Produção, Revenda, Entrega) → informar código (e número da fórmula se a receita tiver várias) → exibe nome do cliente, forma farmacêutica, data de entrega, prescritor, loja, processos já realizados.
  10. **Tela 267 registrar:** opção "1 - Registrar" → tipo de movimento → conferir o processo apresentado (pode vir preenchido pelo processo padrão do funcionário) → informar código da receita (leitor ou digitação manual) → Enter → mensagem de sucesso.
  11. **Sem login:** (a) Tela 007: gravar o cadastro do funcionário gera o código de barras; "Relatórios" > "Configurar relatório" (Tela 002): selecionar relatório, impressora, tipo de impressora, tipo de papel, "Posição cód. barras" (obrigatória) → "Gravar" e voltar; duplo clique no relatório abre a visualização com códigos de vários funcionários (setas de navegação para achar o desejado) → imprimir. (b) Na tela de login clicar no X ou ESC para fechar a janela de identificação → surge a opção "Rastreabilidade" → clicar → tela de autorização → ler o código de barras do funcionário → abre a Tela 267. (c) Ler o código do funcionário e depois o da receita; mensagem de sucesso.
- **Campos e regras de negócio:**
  - Tipo de inclusão: "Fórmula" = registrar individualmente em cada fórmula (ex.: receita com 5 fórmulas, registrar na 1, depois na 2...); "Receita" = um registro grava em todas as fórmulas ao mesmo tempo.
  - "Descrição ou assinatura na ficha de pesagem": imprime o nome do processo seguido de linha de assinatura (ex.: "Conferência: ______"); só aparece se a Tela 146 tiver "Mostrar processos de produção na ficha de pesagem" marcado.
  - Opções da Tela 229: "Processo opcional" (fórmula avança mesmo sem registrar); "Comissão" (calcula comissão pelo cadastro de comissões); "Registrar baixa" (baixa automática dos produtos ao registrar o processo); "Bloquear receita" (impede alterações na receita após registrar); "Bloquear cálculo" (impede recalcular a fórmula); "Bloquear o registro do processo quando houver produto sem baixa" (impede registro PELA TELA 267 enquanto houver produto sem baixa; o manual cita só a Tela 267).
  - "Pagar comissão" (na forma farmacêutica) só deve ser marcado se a empresa usa comissão por processo realizado.
  - A ordem definida na forma farmacêutica rege a sequência da receita.
  - Tela 600: se alguma confirmação "OK" ficar desmarcada, o sistema não permite registrar o processo. Campos editáveis conforme permissão do usuário: texto do rótulo, observação do rótulo, posologia, observação da receita, observação da fórmula.
  - Tela 600: receita aberta por um colaborador fica azul para ele e sob sua responsabilidade (status em andamento) até voltar a "Pendente".
  - Filtros Tela 600: Data; Tipo de receita (humana/animal); Delivery (sim/não); Laboratório; Loja de captação; Produtos controlados; Situação do processo (Ambos, Pendente, Em andamento, Parado). Campos "Localizar receita" e "Abrir receita".
  - Colunas/infos da lista: tipo (humana/animal), código da receita, delivery, cliente, loja de captação, qtd de fórmulas, colaborador que aviou, data/hora aviada, data/hora entrega, horário de envio ao laboratório, loja de retirada, forma farmacêutica, responsável que abriu o processo.
  - Tela do processo: topo com Loja, código da receita, código do delivery (se houver), loja de retirada, loja de aviamento, colaborador do aviamento; ícone roxo abre a receita na Tela 145; ícone azul ao lado de cliente/prescritor abre o cadastro completo. Seção "Informações da fórmula": nº de fórmulas, laboratório, forma farmacêutica, qtd total de cápsulas, nº de vezes a manipular, insumos, observação do rótulo, posologia, observação da fórmula, observação da receita, volume, data/hora do laboratório, data de vencimento. Anexos (pedido médico) apresentados para conferência; anexos via WhatsApp/Omni Chanel entram automaticamente na receita.
  - Botões da tela do processo: "SNGPC" (dados dos insumos controlados), "Registrar processo", "Registrar baixa", botão de três pontos (opções de situação + "Enviar mensagens para o atendente", chat interno), "Refazer" (repetição/refazer fórmula), imprimir rótulos/fichas.
  - Tela 267 sem login: janela de 15 segundos após abrir, depois fecha sozinha; fixo, não configurável. Sem processo padrão é preciso selecionar o processo correto antes de registrar.
  - Aba 5 da Tela 145 só aparece com receita concluída e só traz processos para receitas criadas após a configuração.
- **Ações de risco:**
  - "Registrar processo" + "Sim" (Tela 600), "OK" na aba 5 da receita, Enter na Tela 267: gravam registro de rastreabilidade com colaborador/data/hora; avançam a fórmula e, conforme opções ("Registrar baixa", "Bloquear receita", "Bloquear cálculo", "Comissão"), baixam estoque, travam receita/cálculo e geram comissão. Não há desfazer descrito (o manual não menciona estorno de registro).
  - "Registrar baixa" / "Registrar peso" (baixa de estoque).
  - "Gravar" na Tela 229 / forma farmacêutica / Tela 007 (altera configuração produtiva global; alterar ordem muda o fluxo de todas as receitas novas).
  - "Alterar status para" > "Parado" / "Pendente" (afeta fila de outros colaboradores).
  - "Refazer".
  - Editar texto de rótulo/posologia/observações durante conferência.
  - Impressão de rótulos/fichas e de código de barras.
  - "Enviar mensagens para o atendente" e "Mensagem enviada ao registrar o processo" (disparo ao cliente por WhatsApp).
  - Gravar cadastro de funcionário gera código de barras (efeito colateral).
- **Candidatos a cenário de teste:**
  1. (Positivo) Cadastrar processo na Tela 229 (nome, tipo 1 - Produção, tipo de inclusão Fórmula) e "Gravar"; assertar mensagem de gravação e reaparecimento do processo ao consultar/na lista da forma farmacêutica.
  2. (Positivo) Vincular dois processos a uma forma farmacêutica, reordenar com as setas, "Gravar"; criar receita nova e conferir na aba "5 - Rastreabilidade de Processos" a ordem exibida.
  3. (Positivo) Marcar "OK" na aba 5 de receita concluída; assertar colaborador logado, data e hora preenchidos.
  4. (Negativo/validação) Na Tela 600 abrir fórmula, deixar uma confirmação "OK" desmarcada e clicar "Registrar processo"; assertar bloqueio (sistema não registra).
  5. (Positivo/Tela 600) Selecionar loja e processo, aplicar filtro Situação = Pendente/Parado, validar listagem; botão direito > "Alterar status para" > "Parado" e voltar a "Pendente"; assertar a mudança de situação (somente em massa de teste).
  6. (Borda/Tela 267) "1 - Registrar", código de receita via digitação + Enter; assertar mensagem de sucesso. Variante: "0 - Consultar" com receita de várias fórmulas exigindo o número da fórmula. Variante de borda: acesso sem login fecha sozinho após 15 s (difícil de automatizar com leitor de código de barras).
- **Lacunas:**
  - Mensagens literais de erro/sucesso (apenas "processo foi registrado com sucesso" parafraseado).
  - Layout, campos obrigatórios e validações do cadastro da Tela 229 (o manual não diz quais são obrigatórios nem se nomes duplicados são rejeitados).
  - Caminho de menu exato da Tela 267 (só "Rastreabilidade").
  - Como a aba 5 representa o estado após marcar "OK" (se é possível desmarcar).
  - O que é o "informativo de confirmação" da Seção 7.3.
  - Se "Bloquear o registro... produto sem baixa" vale também para Tela 600/receita.
  - O manual não diz o texto exato da mensagem de bloqueio nem as permissões necessárias.
  - Numeração do manual pula 2.3 e 3.1.
  - Significado de "Em andamento" além da cor azul; como o status é exibido.
  - Ícones (roxo/azul, três pontos) só visíveis em prints.

---

## 2. Rastreabilidade OK

- **Manual:** Rastreabilidade OK (Parte farmacêutica)
- **Sobreposição:** idêntico ao "Rastreabilidade completo" em conteúdo funcional (cap. 1 a 10, 41 p.). Resumo só das diferenças.
- **Diferenças:**
  - Sem sumário e sem cabeçalho de "Versão do sistema" nem rodapé de autoria.
  - AUSENTE nesta versão: seção "Exibição dos processos na ficha de pesagem" (Tela 146 - Configurações, opção "Mostrar processos de produção na ficha de pesagem"). O campo "Descrição ou assinatura na ficha de pesagem" ainda é descrito, mas sem dizer como habilitar a exibição.
  - Texto das demais seções é o mesmo (Tela 229, forma farmacêutica, aba 5 da Tela 145, Tela 600, processo padrão Tela 007, Tela 267, registro sem login 15 s, recomendações cap. 10).
- **Impacto para testes:** usar o "completo" como referência; este não acrescenta nenhuma regra nova. Cenários, ações de risco e lacunas são os mesmos da seção 1 (exceto o cenário/pré-requisito da Tela 146, que aqui não consta).

---

## 3. Rastreabilidade Conferencia de Processos

- **Manual:** Rastreabilidade Conferencia de Processos - título interno "Manual de Rastreabilidade - Tela 600: Conferência de Processos" (Parte farmacêutica; 27 p.)
- **Objetivo:** Operar a Tela 600 para conferir e registrar o processo de rastreabilidade das fórmulas pendentes, incluindo pesagem monitorada e baixa de insumos; traz o pré-requisito de cadastro (Tela 229, forma farmacêutica, Tela 146) e a seção de recomendações.
- **Sobreposição:** caps. 1 a 3 (conceito, Tela 229, vínculo à forma farmacêutica, Tela 146) e cap. 4 (Tela 600, subseções 4.1 a 4.17) são iguais às seções equivalentes do "completo" (6.1 a 6.17). Abaixo só o que é próprio ou adicional; mas o tema Tela 600 é distinto o bastante para ter fluxo completo.
- **Tela(s) e caminho de menu:**
  - Tela 600 - Conferência de Processos a Realizar: "Movimentos > Produtos > Controle de Qualidade > Conferência de Processo"
  - Tela 229: "Cadastros > Atendimentos > Processos de Produção/Rastreabilidade"
  - Ficha da Forma Farmacêutica: "Cadastros > Atendimentos > Forma Farmacêutica > Ficha da Forma Farmacêutica"
  - Tela 146 - Configurações ("Mostrar processos de produção na ficha de pesagem")
  - Tela 186 - Comunicação/SAC; Tela 145 (receita, via ícone roxo); Tela 433 (baixa de fórmulas, citada explicitamente no fim do manual)
- **Pré-requisitos:** processos cadastrados (Tela 229) e vinculados às formas farmacêuticas na ordem correta; receitas com fórmulas aguardando o processo na loja de produção; permissões configuradas; para pesagem monitorada, empresa que utilize pesagem monitorada e rótulos de matéria-prima (impressos pelo sistema para leitura por código de barras). Cap. 5 não lista "processo padrão do funcionário" nem "impressão de código de barras testada".
- **Fluxo (Tela 600):**
  1. Abrir "Movimentos > Produtos > Controle de Qualidade > Conferência de Processo" → Tela 600.
  2. Informar a loja de produção e o processo a acompanhar → lista de receitas aguardando o processo.
  3. Opcional: filtros (Data; Tipo de receita humana/animal; Delivery sim/não; Laboratório; Loja de captação; Produtos controlados; Situação do processo: Ambos / Pendente / Em andamento / Parado); campos "Localizar receita" e "Abrir receita".
  4. Receita aberta por um colaborador fica azul para ele (em andamento, sob responsabilidade dele).
  5. Botão direito na receita > "Alterar status para" > "Pendente" (libera) ou "Parado" (impedimento; pode perguntar se quer registrar comunicação interna → Tela 186 - Comunicação/SAC; senão fechar a Tela 186). Observação do processo parado digitada na Tela 600 (visível só nela). Voltar ao fluxo = "Pendente".
  6. Duplo clique no nome do cliente ou no registro → tela de registro do processo (topo: loja, código da receita, código do delivery, loja de retirada, loja de aviamento, colaborador do aviamento; ícone roxo abre Tela 145; ícone azul abre cadastro de cliente/prescritor; botão de três pontos com opções de situação e "Enviar mensagens para o atendente").
  7. Conferir "Informações da fórmula", anexos (pedido médico; anexo automático via WhatsApp/Omni Chanel) e marcar todas as confirmações "OK".
  8. Opcional: editar texto do rótulo, observação do rótulo, posologia, observação da receita/fórmula (conforme permissão); "SNGPC"; "Refazer"; imprimir rótulos/fichas.
  9. Clicar "Registrar processo" → mensagem de confirmação → "Sim" → mensagem de sucesso; a fórmula segue para a próxima etapa da forma farmacêutica. Receita com várias fórmulas: registrar em todas.
  10. **Pesagem monitorada (extra deste manual):** quando a próxima etapa exigir, clicar "Registrar baixa" → tela de baixa de fórmulas → "Registrar peso" (pesagem monitorada dos insumos) → a tela lista todos os insumos da fórmula → localizar cada item pesquisando por código do produto, código do lote ou código de barras do rótulo da matéria-prima (se o rótulo foi impresso pelo sistema, basta o leitor de código de barras) → cada item identificado corretamente fica destacado em verde → na parte inferior aparece a quantidade a pesar de cada insumo → após pesar todos, voltar à Tela 433 e clicar "Registrar baixa" → o sistema baixa embalagens e demais itens restantes.
- **Campos e regras de negócio:**
  - Regras da Tela 600 iguais às do completo: sem todos os "OK" marcados o sistema não permite registrar; edição de campos depende de permissão; tipo de inclusão Fórmula x Receita define se é preciso registrar fórmula a fórmula.
  - Exclusivo deste manual: a baixa de embalagens e itens restantes só ocorre ao clicar "Registrar baixa" de volta na Tela 433, após a pesagem de todos os insumos.
  - Empresas sem pesagem monitorada podem configurar a opção "Registrar baixa" no processo (Tela 229) para baixa automática ao registrar a rastreabilidade.
  - Identificação correta de insumo = destaque verde (feedback visual para asserção).
  - Cap. 5 (Recomendações): checar processos cadastrados, vinculados, ordem correta, permissões e métodos de registro definidos; testar com uma receita antes de usar em todas as produções.
- **Ações de risco:** "Registrar processo" e "Sim"; "Registrar baixa" (Tela 433, baixa de embalagens/itens restantes) e "Registrar peso"; "Alterar status para" Parado/Pendente; "Refazer"; edição de rótulo/posologia/observações; impressão de rótulos/fichas; "Enviar mensagens para o atendente"; "Gravar" nas telas de cadastro (Tela 229, forma farmacêutica, Tela 146).
- **Candidatos a cenário de teste:**
  1. (Positivo) Tela 600: selecionar loja de produção e processo; assertar que a lista exibe apenas receitas do processo escolhido com as colunas previstas.
  2. (Filtro) Aplicar cada valor de Situação (Ambos, Pendente, Em andamento, Parado) e assertar que a lista corresponde; usar "Localizar receita" por código existente e inexistente.
  3. (Positivo) Duplo clique em receita, marcar todos os "OK", "Registrar processo" > "Sim"; assertar mensagem de sucesso e que a receita sai da lista do processo atual (somente em massa de teste).
  4. (Negativo) Tentar "Registrar processo" com um "OK" desmarcado; assertar bloqueio.
  5. (Status) "Alterar status para" > "Parado" e responder ao diálogo da Tela 186 (fechar sem registrar); assertar situação Parado e observação visível só na Tela 600; reverter para "Pendente".
  6. (Pesagem monitorada, borda) Em "Registrar baixa" > "Registrar peso", informar código de produto/lote e assertar destaque verde do insumo e quantidade a pesar exibida; só viável com leitor/massa preparada.
- **Lacunas:**
  - Texto literal do diálogo de confirmação e da mensagem de sucesso.
  - Mensagem exata de bloqueio por "OK" desmarcado.
  - Cores/estados de "Em andamento" e "Parado" em prints.
  - Dependência de permissão não detalhada.
  - Se "Registrar peso" abre outra tela ou é botão na tela de baixa (Tela 433).
  - O manual no cap. 4.18 diz só "tela de baixa de fórmulas" e apenas no fim cita "Tela 433".
  - Como identificar na lista a coluna "Responsável que abriu o processo".
  - Comportamento de "Refazer" e "SNGPC" não detalhado.
  - Não cobre "Processo padrão" nem Tela 267, ao contrário do completo.
