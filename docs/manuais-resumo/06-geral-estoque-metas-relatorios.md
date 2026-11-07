# Manuais — Parte geral: estoque, pagamento, metas, relatórios, ponto e entrega

> Resumo de referência para escrita de cenários futuros, derivado dos PDFs em `docs/Manuais - OmniCare/` (10 manuais).
> **Como foi feito (2026-10-28):** texto extraído dos PDFs com `pdftotext` e resumido por leitura integral, sem consultar o app.
> **Limites:** não inclui as imagens/prints dos PDFs; as setas dos caminhos de menu se perderam na extração (aqui aparecem como `>`);
> o manual quase nunca traz mensagens literais de erro/validação nem a lista de campos obrigatórios.
> **Uso:** ponto de partida, não verdade. Todo nome de menu, botão e seletor deve ser validado por inspeção ao vivo
> antes de virar teste (`AGENTS.md` `[R-SEL]`). Ações de risco listadas aqui seguem `[R-RISCO]` (não clicar sem confirmar).
> Índice geral e convenções transversais: `PROJECT_CONTEXT.md` § "Manuais do sistema".

---

# Resumo D2 - Parte geral (estoque, pagamento, metas, relatórios, entrega)

Notas gerais sobre a extração:
- Os .txt estão em Windows-1252; os acentos foram restaurados por contexto.
- O glifo de separador de menu nos manuais (seta) se perdeu na extração (aparece como "" ou espaço). Abaixo os caminhos usam " > " no lugar do glifo; os nomes dos itens são literais. Em "Registo de ponto" e "Metas - Vendas" o separador aparece como "-" ou espaços no texto original.
- Os PDFs trazem prints que não estão no texto; toda ambiguidade visual está em "Lacunas".
- Rodapés padrão: "Elaborado por: Thaiffane / Setor: Sucesso do Cliente" ou "Att. Thaiffane / Implantação".
- Datas dos manuais (ex.: "julho de 2026", "outubro de 2026") e "Versão do sistema" (25.11, 26.2, 26.5) variam; nenhum manual declara a versão exigida do robô.

---

## 1. Manual Cadastro Estoque atualizado

- **Manual:** Manual Cadastro Estoque atualizado (título interno: "Manual - Cadastro de Estoque da Loja", versão do sistema 26.2, 6 páginas) - Parte geral
- **Objetivo:** Cadastrar localizações de estoque da loja e configurar seu uso (produção/revenda, e-Commerce, tipos de produto) para que apareçam no cadastro de lotes.
- **Tela(s) e caminho de menu:**
  - "Cadastros > Produtos > Detalhes da Ficha do Produto > Localizações de Estoque" -> "Tela 104 - Cadastro de Localizações de Estoque"
  - "Cadastros > Produtos > Revenda > Ficha do Produto" -> "Tela 117 - Cadastro de Produtos (Revenda)"
  - "Tela 216 - Incluir/Alterar Lotes e Estoque" (aberta pelo botão verde "+" na Tela 117)
- **Pré-requisitos:** Loja cadastrada (campo "Loja" da Tela 104). Para o exemplo de lote: produto de revenda existente (localizar por nome na Tela 117). Para e-commerce: opção também marcada na ficha do produto de revenda.
- **Fluxo:**
  1. Abrir Tela 104 pelo caminho de menu.
  2. Informar "Nome do estoque" (ex.: Laboratório, Revenda, Almoxarifado) e selecionar "Loja".
  3. Em "Informações de uso", marcar "Produção/revenda" (baixa automática: Produção baixa insumos das fórmulas; Revenda baixa produtos no momento da venda) e/ou "Usar no e-Commerce".
  4. Em "Estoque p/ uso na localização" (o manual também chama "Estoque para uso na localização"), marcar os tipos de produto: "0 - Outros", "1 - Insumo (Alo)", "2 - Insumo (Hom)", "3 - Revenda", "4 - Embalagem".
  5. Clicar em "Gravar".
  6. Exemplo de lote: Cadastros > Produtos > Revenda > Ficha do Produto (Tela 117) -> localizar produto -> botão verde "+" -> abre Tela 216 -> no campo de localização clicar na lupa -> o sistema lista só estoques habilitados para o tipo "3 - Revenda".
- **Campos e regras de negócio:**
  - "Usar no e-Commerce" só exibe o produto no site se a opção também estiver marcada na ficha do produto de revenda (nas duas pontas).
  - Se um tipo de produto não estiver marcado em "Estoque p/ uso na localização", o estoque não é exibido para seleção no cadastro de lotes desse tipo.
  - Exemplo do manual: estoque "Laboratório" habilitado para 0, 1, 2 e 4, com "3 - Revenda" desmarcado -> não aparece no cadastro de lote de revenda.
  - O procedimento de lote vale também para insumos alopáticos, homeopáticos e embalagens.
  - "Produção/revenda" deve estar marcado quando for necessária a baixa automática do estoque.
- **Ações de risco:** Nenhuma destrutiva citada. "Gravar" persiste uma localização (cria cadastro).
- **Candidatos a cenário de teste:**
  1. Positivo: cadastrar localização com nome, loja e tipos marcados; "Gravar"; reabrir e verificar valores persistidos.
  2. Filtro por tipo: estoque com "3 - Revenda" desmarcado não aparece na lupa de localização da Tela 216 ao incluir lote de revenda; aparece quando marcado.
  3. Positivo: estoque com "3 - Revenda" marcado aparece na lupa da Tela 216.
  4. e-Commerce: "Usar no e-Commerce" marcado só na localização (não na ficha) -> não exibido; verificar apenas a configuração gravada (exibição no site está fora do escopo desktop).
  5. Borda: gravar sem "Nome do estoque" ou sem "Loja" (validação não descrita no manual - confirmar comportamento).
- **Lacunas:** Obrigatoriedade/mensagens de validação não informadas; se "Loja" é obrigatório não é dito; não informa se tipos vêm marcados por padrão; como editar/excluir uma localização não informado; não descreve o conteúdo exato da lupa na Tela 216 além da filtragem por tipo.

---

## 2. Manual Formas de Pagamento do Caixa

- **Manual:** Manual Formas de Pagamento do Caixa (título interno: "Manual de Cadastro de Formas de Pagamento do Caixa", versão 26.5, 5 páginas) - Parte geral
- **Objetivo:** Cadastrar formas de pagamento que ficarão disponíveis nas movimentações do caixa.
- **Tela(s) e caminho de menu:**
  - "Cadastros > Financeiro > Contas pag./rec. > Lançamentos" -> "tela 056 - Cadastro de Lançamentos Financeiros - Contas a Pagar/Receber"
  - "Tela 011 - Cadastro de Grupos" (ícone azul ao lado do campo "Grupo")
- **Pré-requisitos:** Grupo existente (ou criar na Tela 011); cadastros de "Situação", "Centro de receita" e "Fluxo de caixa" existentes (ou opção "Geral"). Para cartão: CNPJ da empresa responsável pela maquininha.
- **Fluxo:**
  1. Abrir Tela 056 pelo caminho de menu.
  2. "Tipo de lançamento": selecionar "Receita".
  3. "Nome": informar (ex.: Dinheiro, Pix, Cartão de Crédito).
  4. "Grupo": lupa para selecionar; se não existir, ícone azul -> Tela 011 -> informar nome do grupo -> "Gravar".
  5. "Tipo de movimento": selecionar entre "Dinheiro", "Cheque", "Cartão", "Convênio", "Cortesia", "Débito em folha", "Boleto", "Pix/Depósito" e "Crédito/Cashback".
  6. Preencher "Situação", "Centro de receita" e "Fluxo de caixa" (lupa em cada; opção "Geral" se a empresa não usa configuração específica; ícone azul cria novo).
  7. Marcar "Utilizar no caixa" para disponibilizar no caixa.
  8. Se tipo "Cartão": aba "Informações de contato" -> informar o CNPJ da empresa da maquininha ("Não informe o CNPJ da loja"); na seção de juros, multa, taxa administrativa e prazo, definir quantidade de parcelas e percentuais; campo "Tipo de integração": "TEF" ou "POS".
  9. Clicar em "Gravar".
- **Campos e regras de negócio:**
  - Em cada lançamento usado para pagamento é necessário incluir a "Forma de Pagamento" no doc. Fiscal para que NF-e/NFC-e saia com o tipo de pagamento correto exigido pela Sefaz.
  - "TEF": transação integrada diretamente ao sistema; "POS": maquininha independente.
  - Sem "Utilizar no caixa" marcado, a forma não fica disponível no caixa (inferência direta do texto).
  - CNPJ de cartão = empresa da maquininha, nunca o da loja.
- **Ações de risco:** Nenhuma destrutiva citada. "Gravar" cria cadastro financeiro e criação de grupo na Tela 011 gera dado persistente.
- **Candidatos a cenário de teste:**
  1. Positivo: cadastrar "Dinheiro" (Receita, grupo, tipo de movimento "Dinheiro", "Geral" nas classificações, "Utilizar no caixa") e verificar gravação.
  2. Positivo cartão: tipo "Cartão" com CNPJ na aba "Informações de contato", parcelas e "Tipo de integração" = "POS"/"TEF".
  3. Criação inline de grupo via ícone azul (Tela 011) e seleção do grupo recém-criado na Tela 056.
  4. Disponibilidade: forma com "Utilizar no caixa" marcado aparece nas opções de pagamento do caixa; desmarcado não aparece.
  5. Negativo: gravar sem "Nome" / sem "Grupo" (validação não descrita - verificar mensagem).
  6. Borda: tipo "Cartão" sem CNPJ da maquininha (comportamento não informado).
- **Lacunas:** Campos obrigatórios e mensagens de erro não informados; onde exatamente fica "Utilizar no caixa", "Tipo de integração" e a seção de juros na tela (só nos prints); como "Forma de Pagamento do doc. Fiscal" é selecionada (campo/aba) não é dito; se "Tipo de movimento" é obrigatório; sem regra sobre parcelas máximas ou limites de percentual.

---

## 3. Metas - Produção OK

- **Manual:** Metas - Produção OK (título interno: "Procedimento para cadastrar metas de produção", VER. 25.11, 4 páginas) - Parte geral
- **Objetivo:** Cadastrar o processo de produção e as metas de produção (com índices, horas de trabalho e bonificação).
- **Tela(s) e caminho de menu:** "Tela 229 - Cadastro de Processos de Produção / Rastreabilidade"; "Tela 625 - Cadastro de Metas - Produção". Caminho de menu não informado.
- **Pré-requisitos:** Processo de produção cadastrado na Tela 229 antes das metas.
- **Fluxo:**
  1. Acessar Tela 229 -> "Incluir" -> informar o nome do processo de produção -> "Gravar".
  2. Escolher o tipo de inclusão: "Receitas" (conjunto completo; receita com 10 fórmulas conta considerando as 10) ou "Fórmulas" (cada item individual da receita, registrado separadamente).
  3. Acessar Tela 625; incluir novo cadastro pelo botão "+" (ícone verde) ou botão direito no espaço em branco -> "Incluir".
  4. Preencher os campos da meta (índices e valores, horas de trabalho, bonificação, gratificação) e gravar.
- **Campos e regras de negócio:**
  - Tipo 1 - Processos / Receitas / Vendas: 1 processo por receita (receita com 10 fórmulas conta 1).
  - Tipo 2 - Produção de cápsulas / Sachês / Supositórios: conta pelo total informado na receita (180 cápsulas = 180 unidades).
  - Tipo 3 - Fórmulas: conta pela quantidade de fórmulas da receita (10 fórmulas = 10).
  - Tipo 4 - Fórmulas (Quantidade Múltipla): total final de todas as fórmulas (3 fórmulas de 30 cápsulas = 90 cápsulas).
  - Campos de horas: "Horas trabalhadas no sábado", "Horas trabalhadas durante a semana", "Quantidade estimada de produção por hora do processo" (ex.: 200 cápsulas/hora).
  - "Bonificação": valor pago quando a meta é atingida. "Gratificação por atingir a meta": valor adicional como recompensa.
- **Ações de risco:** Nenhuma destrutiva citada.
- **Candidatos a cenário de teste:**
  1. Positivo: incluir processo na Tela 229 ("Incluir" -> nome -> "Gravar") e verificar na lista.
  2. Positivo: incluir meta na Tela 625 via botão "+" e via botão direito -> "Incluir"; verificar persistência de tipo, horas, quantidade/hora, bonificação e gratificação.
  3. Parametrizado por tipo 1-4: validar que a seleção do tipo é aceita (o cálculo em si exige produção real - fora do escopo da tela de cadastro).
  4. Dependência: meta só pode ser criada com processo previamente cadastrado (processo aparece como opção).
  5. Negativo: gravar processo sem nome (validação não descrita).
- **Lacunas:** Rótulos exatos dos campos/combo do tipo (se aparece "Tipo 1"... ou só descrição) só nos prints; como a meta se relaciona ao funcionário/período não informado; "Receitas" vs "Fórmulas" como "tipo de inclusão" é descrito no processo (Tela 229), mas a relação com os Tipos 1-4 da Tela 625 não é explicitada; campos obrigatórios e validações ausentes. Sobreposição: tema "metas" também em "Metas - Vendas OK" (mesmos autor/versão 25.11, mas escopo distinto: setor/funcionário de venda).

---

## 4. Metas - Vendas OK

- **Manual:** Metas - Vendas OK (título interno: "Cadastro de Metas de Vendas", VER. 25.11, 9 páginas) - Parte geral
- **Objetivo:** Cadastrar metas de vendas por loja/setor/funcionário, habilitar a contabilização e permitir consulta e análise.
- **Tela(s) e caminho de menu:** "Cadastro > Funcionários > Metas" -> "Tela 491" (cadastro de metas); "Tela 146" (habilitar conclusão da receita); "tela 379" (opção "OK" ao concluir movimento no caixa); "Permissão 410" e "Permissão 411".
- **Pré-requisitos:** Funcionários e setores de venda cadastrados; configuração na Tela 146 habilitada para contabilizar a meta; permissões 410/411 para o funcionário ver "Meta" na receita.
- **Fluxo:**
  1. Abrir Tela 491 (Cadastro > Funcionários > Metas); incluir com botão "+" (ícone verde) ou botão direito -> "Incluir" (abre nova tela).
  2. Cadastrar mês a mês; limpar a tela antes de iniciar novo mês.
  3. Configurar funcionamento de sábados e domingos: "Dia útil = 24 horas", "½ Dia útil = 12 horas", "1/3 Dia útil = 8 horas", "¼ Dia útil = 4 horas" (o símbolo das frações se perdeu na extração; rótulos exatos inferidos). Preencher valores de metas e gravar.
  4. Metas por setor de venda: "+" ou botão direito -> "Incluir"; informar valor da meta do setor e funcionário responsável; "Gravar".
  5. Metas por funcionário: "+" ou botão direito -> "Incluir"; selecionar funcionário e definir meta individual.
  6. Em "Revendas/Receitas - índices e valores da meta (valores individuais)": "Valor da meta para o setor de vendas" (preenchido automaticamente); "Valor mensal da meta para o funcionário" (em valor ou porcentagem, campos interligados); "Valor da gratificação para meta alcançada"; tipo: "Individual", "Sobre o setor" ou "Sobre a loja".
  7. "Receita - Percentual de bonificação sobre o valor da comissão": percentual aplicado sobre a comissão de receita e revenda; gravar.
  8. Habilitar na Tela 146 a opção correspondente à conclusão da receita (meta contabilizada só quando o funcionário finalizar a receita).
  9. No caixa: "concluir movimento" -> tela 379 -> marcar "OK" -> receita finalizada, meta gerada, status da receita = "FINALIZADO".
  10. Liberar Permissão 410 e 411 -> aparece a opção "Meta" na tela da receita, com metas do mês do funcionário.
  11. Análise por "Loja" (total consolidado), "Funcionário" (individual) e "Setor de Venda" (valores vendidos por setor).
- **Campos e regras de negócio:**
  - Valor e porcentagem da meta individual são interligados: informar a porcentagem calcula o valor.
  - Configuração de sábado/domingo é usada no cálculo das metas de fim de semana.
  - Bonificação é aplicada quando o funcionário ultrapassa a meta. Exemplo do manual: índice 50%; se atingir 60% da meta, recebe o valor do índice de 50% mais o valor adicional da bonificação.
  - Ao incluir outro funcionário, o sistema exibe um alerta oferecendo reaproveitar as informações já cadastradas (texto da mensagem não informado).
  - Sem concluir a receita ("OK"), a meta/comissão não é validada.
  - Remover permissões 410/411 impede o funcionário de ver suas metas.
- **Ações de risco:** "Gravar" em metas altera base de comissão/gratificação; marcar "OK" na tela 379 finaliza a receita de forma que gera meta (efeito de negócio, não descrito como reversível). Nenhuma exclusão citada.
- **Candidatos a cenário de teste:**
  1. Positivo: incluir meta de setor (valor + funcionário responsável) e gravar.
  2. Positivo: incluir meta individual com tipo "Individual"/"Sobre o setor"/"Sobre a loja", validar que valor e % se recalculam mutuamente.
  3. Reaproveitamento: ao incluir segundo funcionário, o sistema exibe o alerta de reaproveitamento (assertar presença do diálogo).
  4. Fluxo ponta a ponta: com Tela 146 habilitada, concluir movimento no caixa, marcar "OK" na tela 379 e verificar status "FINALIZADO" e meta gerada.
  5. Permissões: com 410/411 liberadas aparece "Meta" na receita; sem elas não aparece.
  6. Limpeza de tela entre meses (assertar que campos do mês anterior não vêm reaproveitados).
- **Lacunas:** Nome exato da opção em Tela 146 não informado; texto do alerta de reaproveitamento não informado; título/forma de selecionar o mês não informado; campos obrigatórios; o exemplo de bonificação (50%/60%) é ambíguo quanto à fórmula; "Tela 379" é referida também como "tela correspondente" do movimento no caixa (nome não informado); aparenta numeração duplicada no passo "5. Selecione o funcionário..." dentro da seção 4 (erro de numeração do manual). Sobreposição: Produção em "Metas - Produção OK"; comissão em "Comissão vendas OK" (outro grupo).

---

## 5. Pegar xml de notas OK

- **Manual:** Pegar xml de notas OK (título interno: "Procedimento para pegar XML de notas", VER. 26.2, 9 páginas) - Parte geral
- **Objetivo:** Localizar e copiar/compactar os XMLs de notas fiscais (para contabilidade), pela pasta do sistema ou por telas de documentos fiscais.
- **Tela(s) e caminho de menu:** "Movimentos - Documentos Fiscais"; "NF-e - Tela 444"; "NFC-e - Tela 606"; "NFS-e - Tela 616". Pasta: Este computador > Disco Local (C:) > "AppERP" > "ARQ" > "_docs_fiscais" > tipo de nota (NF-e, NFS-e, NFC-e) > pasta com CNPJ da loja > "ANO-MÊS".
- **Pré-requisitos:** Notas já emitidas; acesso ao Windows Explorer na máquina do servidor/sistema (1º método).
- **Fluxo:**
  - 1º método (Explorador de Arquivos): abrir Explorador (tecla Windows + E, ou ícone do Windows) -> "Este computador" -> "Disco Local (C:)" -> pasta "AppERP" -> "ARQ" -> "_docs_fiscais" -> tipo de nota (NF-e / NFS-e / NFC-e) -> pasta com número do CNPJ da loja -> pasta de mês no formato "ANO-MÊS" (ex.: "202604" = 2026 ano e 04 mês) -> copiar a pasta ou compactar em .zip.
  - 2º método (pelo sistema): "Movimentos - Documentos Fiscais" -> escolher o tipo (NF-e Tela 444, NFC-e Tela 606, NFS-e Tela 616) -> "Ao abrir a tela, selecione esta opção" (nome da opção só no print) -> o sistema abre automaticamente a pasta onde ficam os XMLs.
- **Campos e regras de negócio:** Organização por ano-mês "AAAAMM"; uma pasta por tipo de nota e por CNPJ da loja; mesmos passos para os três tipos.
- **Ações de risco:** Nenhuma citada; cuidado geral ao manipular arquivos fiscais (copiar, não mover/excluir - o manual só fala em copiar ou compactar).
- **Candidatos a cenário de teste:**
  1. Navegar "Movimentos - Documentos Fiscais" e abrir cada tela (444, 606, 616) verificando título.
  2. Na tela de NF-e (444), acionar a opção que abre a pasta de XMLs e verificar que o Explorador abre no caminho "...\AppERP\ARQ\_docs_fiscais\NF-e\..." (teste de verificação de artefato do SO, sujeito à opção citada).
  3. Verificação de arquivo (fora da UI do app): existência da pasta "C:\Apps\ERPDesktop\ARQ\_docs_fiscais\<tipo>\<CNPJ>\AAAAMM".
  4. Borda: tipo de nota sem XMLs no mês (comportamento não informado).
- **Lacunas:** Nome do botão/opção que abre a pasta no 2º método não é dito (só prints); não diz se a pasta "AAAAMM" usa mês de emissão ou autorização; não diz se há XMLs de cancelamento/inutilização em subpastas; "[Disco Local (C:)]" assumido; não informa como proceder em instalação em rede/outro drive.

---

## 6. Registo de ponto

- **Manual:** Registo de ponto (título interno: "Procedimento para registro de ponto no sistema OmniCare", REV. 00, 23 páginas, nov/2025) - Parte geral
- **Objetivo:** Configurar horários, justificativas, habilitar colaborador e máquina e registrar/consultar/editar ponto.
- **Tela(s) e caminho de menu:**
  - "Cadastros - Funcionários - Folha de ponto - Horários"
  - "Cadastros - Funcionários - Folha de ponto - Justificativas"
  - "Cadastro - Funcionários - Ficha do funcionário" (aba "Registro de Ponto")
  - "Configurações - sistema"
  - "Movimentos - Funcionários - Folha de ponto - Lista de registro de ponto"
  - Números de tela não informados.
- **Pré-requisitos:** Colaborador cadastrado; horários e justificativas cadastrados; colaborador habilitado na ficha; máquina autorizada; reinício do sistema após habilitar máquina.
- **Fluxo:**
  1. Horários: selecionar colaborador -> "+" ou botão direito > "Incluir" -> selecionar dia da semana; informar entrada, saída e intervalo de almoço; definir tolerância de atraso (se aplicável); marcar "Justificar atraso"; "Incluir"; "Gravar".
  2. Pausas: preencher pausas de 15 ou 20 minutos, quando houver; "Incluir" e "Gravar".
  3. Otimização: após cadastrar um dia, selecionar o registro e clicar "LIMPAR" (mantém os dados e permite mudar só o dia da semana), alterar o dia, "Incluir"; repetir.
  4. Justificativas de atraso: tela de justificativas -> selecionar "GERAL" -> botão direito -> "Incluir" -> informar justificativa -> "Incluir" -> "Gravar" (fica disponível no momento do registro do ponto).
  5. Habilitar colaborador: Ficha do funcionário -> aba "Registro de Ponto" -> marcar "Registrar ponto ao conectar no sistema" -> tipo de registro "SISTEMA" -> "Gravar".
  6. Habilitar computador: "Configurações - sistema" -> marcar "Máquina autorizada a registrar o ponto" -> "Gravar" -> reiniciar o sistema -> ícone de relógio aparece no canto superior direito.
  7. Consulta: "Movimentos - Funcionários - Folha de ponto - Lista de registro de ponto" -> informar período/data -> ícone verde para atualizar -> duplo clique no nome do colaborador para ver registros, atrasos e justificativas.
  8. Edição: campos em branco são editáveis (faltas, atestados, férias); as justificativas escolhidas no registro com atraso aparecem em observações; "Justificativas para Ausências": selecionar status no registro; ícone do livro azul cadastra novo (botão direito > "Incluir" -> informar justificativa -> "Incluir" -> "Gravar"; associação: lupa -> selecionar a justificativa criada -> "Gravar").
  9. Registro pelo colaborador: clicar no ícone de registro de ponto -> aparecem informações do colaborador -> clicar uma vez no relógio roxo; se houver atraso, selecionar a justificativa e clicar no relógio roxo novamente.
- **Campos e regras de negócio:**
  - Sistema registra automaticamente data, horário e usuário de alterações manuais (histórico de alterações).
  - Registro de ponto manual só em horários ausentes (campos em branco editáveis).
  - Só colaboradores e máquinas habilitados registram ponto; a habilitação da máquina exige reinício.
  - Justificativa é selecionada no momento do registro quando há atraso.
- **Ações de risco:** Registrar ponto cria registro real (relógio roxo; efeito persistente na folha); edição manual da folha altera dados trabalhistas (fica em histórico); reiniciar o sistema após habilitar máquina. Nenhuma exclusão descrita.
- **Candidatos a cenário de teste:**
  1. Cadastro de horário semanal: incluir segunda-feira com entrada/saída/almoço e verificar na lista; usar "LIMPAR" para reaproveitar para terça-feira.
  2. Cadastro de justificativa "GERAL" via botão direito -> "Incluir" e disponibilidade posterior no registro do ponto.
  3. Habilitação do colaborador (aba "Registro de Ponto", "Registrar ponto ao conectar no sistema", tipo "SISTEMA") e da máquina ("Máquina autorizada a registrar o ponto"); após reinício o ícone de relógio aparece (assertar visibilidade).
  4. Consulta: filtrar período, atualizar (ícone verde) e abrir detalhamento por duplo clique no colaborador.
  5. Histórico: editar campo em branco manualmente e verificar o registro de data, hora e usuário.
  6. Negativo: colaborador sem habilitação não exibe fluxo de registro (inferido, não explicitado).
- **Lacunas:** Nenhum número de tela; locais exatos dos botões "Incluir"/"Gravar"/"LIMPAR" só nos prints; "Registrar ponto ao conectar no sistema" - quando o registro automático ocorre não é detalhado; regras de tolerância (unidade, comportamento) e de "Justificar atraso" não detalhadas; separador de menu aparece como "-", diferente de outros manuais; "Registo" no nome do arquivo é erro de digitação (é Registro).

---

## 7. Relatórios A4

- **Manual:** Relatórios A4 (título interno: "Manual - Configuração de Relatórios e Fichas em A4", versão 26.5, 5 páginas) - Parte geral
- **Objetivo:** Configurar impressora, tipo de papel, margens, layout e código de barras para relatórios/fichas A4.
- **Tela(s) e caminho de menu:** "Relatórios > Relatórios do Sistema" -> botão "Configurar Relatório" -> "Tela 002 - Configuração de Relatório"; "Configuração > Atendimento" -> "Tela 146 - Configuração do Atendimento" (opção "GERAL").
- **Pré-requisitos:** Impressora instalada no Windows (para seleção); ficha de produção configurada (para o caso do código de barras).
- **Fluxo:**
  1. "Relatórios > Relatórios do Sistema" -> clicar "Configurar Relatório" (abre Tela 002).
  2. Selecionar todos (botão direito -> opção correspondente) ou apenas um relatório (marcar "Sel").
  3. Na área "Configuração do Relatório": selecionar a impressora; "Tipo de impressora" = "2 - Jato de tinta/Laser" (para P&B ou colorida); selecionar tipo de papel "A4"; gravar.
  4. Código de barras (fichas de produção e do laboratório): definir posição em que será impresso na ficha.
  5. Margens (cm): exemplo valor 1 para Superior, Inferior, Esquerda e Direita. Layout: "Abaixo e à direita" ou "Direita e abaixo"; gravar.
  6. Código de barras não aparece: "Configuração > Atendimento" (Tela 146) -> "GERAL" -> marcar "Imprimir código de barra nas fichas do atendimento" -> "Gravar" -> reabrir a ficha de produção e conferir.
- **Campos e regras de negócio:**
  - Margens: Superior move o conteúdo para baixo; Inferior para cima; Esquerda para a direita; Direita para a esquerda.
  - "Tam. papel (cm)" não pode ser alterado com papel A4 (sistema usa as dimensões automáticas).
  - "Grade (cm)" e "Tam. coluna (cm)" não precisam ser alterados e não influenciam a impressão.
  - Tipo de impressora sempre "2 - Jato de tinta/Laser" para P&B ou colorida.
- **Ações de risco:** Alterar configuração de "todos" os relatórios (seleção em massa) afeta todos os relatórios; sem confirmação descrita. Impressão física não acionada pelo manual.
- **Candidatos a cenário de teste:**
  1. Abrir Tela 002 via "Relatórios > Relatórios do Sistema" -> "Configurar Relatório" e verificar título.
  2. Selecionar um relatório ("Sel"), definir tipo "2 - Jato de tinta/Laser", papel "A4", margens 1/1/1/1 e gravar; reabrir e conferir persistência.
  3. Assertar que "Tam. papel (cm)" fica não editável com A4.
  4. Tela 146: marcar "Imprimir código de barra nas fichas do atendimento" em "GERAL" e gravar; verificar persistência.
  5. Layout: alternar "Abaixo e à direita"/"Direita e abaixo" e gravar.
- **Lacunas:** Nome exato do botão/menu de "selecionar todos" no botão direito não informado; se há confirmação ao gravar em lote não informado; nomes dos relatórios não listados; posição do código de barras (opções) só no print; "Configuração > Atendimento" (singular) aparece também como "Configurações > Atendimento" em "Valor de custo" (mesma Tela 146).

---

## 8. Taxa de entrega regiões OK

- **Manual:** Taxa de entrega regiões OK (título interno: "Cadastro de Regiões de Entrega", versão 26.2, 13 páginas) - Parte geral
- **Objetivo:** Cadastrar regiões de entrega (valor de entrega/coleta, mínimo, comissão do entregador) e vincular bairros.
- **Tela(s) e caminho de menu:**
  - "Cadastros > Entregas em domicílio > Regiões de entrega" -> "Tela 030 - Cadastro de Regiões de Entrega"
  - "Cadastros > Funcionários > Ficha do funcionário" -> "Tela 007 - Cadastro do Funcionário"
  - "Tela 009 - Cadastro de Bairros"; "Tela 010 - Cadastro de Cidades"
  - "Movimento > Funcionários > Comissões" -> "Tela 041 - Comissões"
- **Pré-requisitos:** Entregador (funcionário) cadastrado; cidade cadastrada para criar bairros; a região precisa ser gravada (gera código) antes de incluir bairros.
- **Fluxo:**
  1. Tela 030: informar "Nome da região", "Entregador responsável", valores (entrega, coleta, mínimo, comissão) e demais configurações; "Gravar" -> o sistema gera um código da região (só depois é possível incluir bairros).
  2. Novo entregador: ícone azul na Tela 030 ou "Cadastros > Funcionários > Ficha do funcionário" (Tela 007). Obrigatórios: "Loja", "Grupo", "Classificação", "Nickname"; seção "Informações Pessoais": "Data de nascimento", "Sexo", "Estado civil"; seção "Classificações": "Função", "Área", "Departamento". "Gravar" e fechar; retornar à Tela 030, onde o entregador está disponível.
  3. Bairros: botão direito na área de bairros ou botão verde "+" -> abre Tela 009. Em "Informações Gerais": "UF", "Cidade", "Nome do bairro".
  4. Cidade inexistente: ícone azul ao lado de "Cidade" -> Tela 010: "UF", "Nome da cidade", "Código do país" (padrão "1058 - Brasil"), "Código do IBGE" (lupa azul pesquisa se desconhecido) -> "Gravar". Voltar à Tela 009, selecionar a cidade, informar "Nome".
  5. Seção "Delivery Normal": selecionar a região; campo "Autorização": "Autorizar entregas", "Autorizar coletas", "Autorizar entregas e coletas" ou "Não autorizar atendimento".
  6. "Delivery Expressa": selecionar a região correspondente (com campo de região em branco, o bairro não é apresentado corretamente nas opções de região da entrega expressa).
  7. "Gravar"; retornar à Tela 030, limpar campos, localizar novamente a região -> bairros vinculados aparecem.
  8. Comissão do entregador: "Movimento > Funcionários > Comissões" (Tela 041) -> opção "Delivery" -> período/data -> "Calcular comissão" -> conferir -> "Gravar".
- **Campos e regras de negócio:**
  - Valor de entrega e coleta na Tela 030 vale para todos os bairros da região (ex.: 10 bairros a R$ 15,00); na Tela 009 é por bairro (requer informar região, valor de entrega e valor de coleta em cada bairro). Recomendado Tela 030 quando valores são iguais.
  - "Valor mínimo": valor mínimo do pedido para a entrega ser realizada naquela região.
  - Coleta: entregador/motoboy retira item do cliente (ex.: fórmula devolvida); aplica o valor da região.
  - Comissão: valor fixo por entrega realizada.
  - Região precisa estar gravada (código gerado) antes de vincular bairros.
- **Ações de risco:** Nenhuma destrutiva citada. "Gravar" na Tela 041 registra comissão financeira (efeito persistente).
- **Candidatos a cenário de teste:**
  1. Positivo: cadastrar região (nome, entregador, valor entrega/coleta/mínimo, comissão) e verificar o código gerado após "Gravar".
  2. Dependência: tentar incluir bairro antes de gravar a região (comportamento esperado: só possível após o código ser gerado - verificar).
  3. Vincular bairro via "+" (Tela 009) com cidade existente; reabrir Tela 030, limpar, localizar a região e conferir bairro listado.
  4. Criar cidade via ícone azul (Tela 010) com "Código do país" padrão "1058 - Brasil" e "Código do IBGE".
  5. Valores Tela 030 x Tela 009: bairro herda valor da região; valor individual no bairro.
  6. Autorização: bairro com "Não autorizar atendimento".
- **Lacunas:** O manual diz "duas formas" de cadastro mas descreve só a por região (a outra é inferida como cadastro por bairro, Tela 009); exemplo de comissão inconsistente (quatro entregas, mas cálculo "3 entregas × R$ 10,00 = R$ 30,00"); "Link do manual: [inserir link]" placeholder (manual de Coletas); onde ficam no cadastro de bairro os campos Delivery Normal/Expressa só no print; campos obrigatórios da Tela 030 não informados; regras para valor mínimo vs. valor do pedido (comportamento na venda) não informadas; seções finais numeradas "1." e "2." reiniciadas (erro de numeração).

---

## 9. Valor de custo

- **Manual:** Valor de custo (título interno: "Valor de custo da receita", versão 26.5, 3 páginas, out/2026) - Parte geral
- **Objetivo:** Explicar o cálculo do custo da fórmula (itens + taxa técnica) mostrado na receita.
- **Tela(s) e caminho de menu:** "Configurações > Atendimento" -> "tela 146 - Configurações do atendimento" (campo do percentual da taxa técnica); "tela 145 - Atendimento ao cliente (Receita)" (consulta do valor da taxa técnica da fórmula).
- **Pré-requisitos:** Receita com matérias-primas e embalagens com custo cadastrado; percentual de taxa técnica configurado na tela 146 (opcional).
- **Fluxo (cálculo, sem passos de tela):**
  1. Custo de cada item = valor de custo × quantidade utilizada: Morosil R$ 2,7818 × 9 = R$ 25,0362; Dilucap R$ 0,085 × 2,035 = R$ 0,1730 (aprox.); Cápsulas R$ 0,0265 × 30 = R$ 0,7950; Pote R$ 1,1536 × 1 = R$ 1,1536; Tampa R$ 0,6958 × 1 = R$ 0,6958. Total dos itens: R$ 27,8536.
  2. Consultar o percentual em Configurações > Atendimento (tela 146): no exemplo, 50%.
  3. Na tela 145 consultar o valor da taxa técnica da fórmula (exemplo R$ 25,00).
  4. Taxa técnica calculada: R$ 25,00 × 50% = R$ 12,50.
  5. Custo total = R$ 12,50 + R$ 27,853575 = R$ 40,353575 (aprox. R$ 40,35).
- **Campos e regras de negócio:**
  - Custo da fórmula considera matérias-primas e embalagens conforme quantidades calculadas.
  - Custo total = (valor da taxa técnica × percentual da tela 146) + soma dos custos dos itens.
  - Se o percentual não estiver informado na tela 146, o sistema NÃO acrescenta taxa técnica e considera só os custos dos itens.
- **Ações de risco:** Alterar o percentual na tela 146 muda o custo apresentado em todas as fórmulas (configuração global); nenhuma ação destrutiva citada.
- **Candidatos a cenário de teste:**
  1. Cálculo: receita com itens conhecidos; verificar custo exibido = soma dos itens + taxa técnica × percentual (tolerância para arredondamento de 4 casas; ex. R$ 40,35).
  2. Borda: percentual da taxa técnica vazio na tela 146 -> custo = apenas soma dos itens (R$ 27,85 no exemplo).
  3. Positivo: percentual 50% com taxa técnica R$ 25,00 -> acréscimo de R$ 12,50.
  4. Verificar que o campo de percentual existe em Configurações > Atendimento (tela 146) e que a tela 145 exibe a taxa técnica.
- **Lacunas:** Rótulo exato do campo de percentual na tela 146 e do campo de custo/taxa técnica na tela 145 só nos prints; origem do "valor de taxa técnica R$ 25,00" (por fórmula, tabela?) não explicada; arredondamento inconsistente (R$ 27,8536 vs R$ 27,853575); quantidade de Dilucap (2,035) calculada pela fórmula sem explicar; não diz onde o custo total R$ 40,35 é exibido; "Atenção: percentual 'n/informado'" tratado como vazio (não diz se 0 equivale). Sobreposição: tela 146 também em "Relatórios A4" e "Metas - Vendas OK"; tela 145 em "Visualizacao de Pendencias e Orcamentos OK".

---

## 10. Visualizacao de Pendenciase Orcamentos OK

- **Manual:** Visualizacao de Pendenciase Orcamentos OK (título interno: "Manual de Visualização de Receitas Pendências e Em Orçamentos", versão 26.2, 4 páginas) - Parte geral
- **Objetivo:** Consultar receitas pendentes e orçamentos em aberto por dois métodos (Tela 145 e consulta de movimentações).
- **Tela(s) e caminho de menu:**
  - 1º método: "Movimentos > Atendimento > Receita" -> "Tela 145 - Atendimento ao Cliente - Receita" -> "Orçamentos" ("Consulta 10922") e "Pendências" ("Consulta 10919")
  - 2º método: "Consultas > Movimentações > Atendimento" -> "Tela 391 - Consultar Movimentações do Atendimento"
- **Pré-requisitos:** Receitas em orçamento/pendentes existentes. 1º método só mostra os últimos 90 dias.
- **Fluxo:**
  1. 1º método: "Movimentos > Atendimento > Receita" (Tela 145); no canto superior direito, opções "Orçamentos" e "Pendências".
  2. "Orçamentos" -> abre "Consulta 10922" (informações das receitas e quantidade de dias desde o cadastro); duplo clique no registro abre a receita.
  3. "Pendências" -> abre "Consulta 10919" (receitas pendentes e dias desde o cadastro); duplo clique abre a receita.
  4. 2º método: "Consultas > Movimentações > Atendimento" (Tela 391) -> escolher filtro entre "Cliente", "Funcionário", "Loja" ou "Prescritor" -> informar dado no campo de pesquisa -> definir intervalo de datas -> clicar no ícone verde para atualizar.
  5. Campo "Tipo de movimento": "Ambos", "Receita" ou "Revenda"; filtro "Status": "Ambos", "Orçamentos" ou "Concluídos".
  6. Há opção para exibir todos os movimentos com comissão (se a empresa trabalha com comissão), exportação para Excel e filtros por "Loja", "Tipo de operação" e "Situação".
  7. Abrir movimento: duplo clique, ou botão direito -> "Abrir Movimento (Receita ou Revenda)", "Atualizar", "Legenda", "Consultar Delivery", "Consultar Financeiro".
- **Campos e regras de negócio:**
  - 1º método limitado aos últimos 90 dias; 2º método permite consulta detalhada por filtros (sem limite informado).
  - Resultado traz datas de receitas ou revendas finalizadas, delivery, financeiro, valores e descontos.
  - Opção de comissão só se a empresa trabalha com comissão.
- **Ações de risco:** Nenhuma destrutiva (apenas consulta). Abrir receita por duplo clique abre o movimento existente; evitar alterá-lo/gravar sem necessidade. Exportar para Excel gera arquivo local.
- **Candidatos a cenário de teste:**
  1. Abrir Tela 145 (Movimentos > Atendimento > Receita) e verificar presença dos botões "Orçamentos" e "Pendências".
  2. "Orçamentos" abre a Consulta 10922; "Pendências" abre a Consulta 10919 (assertar título e colunas de "dias desde o cadastro").
  3. Duplo clique em registro abre a receita correspondente.
  4. Tela 391: filtrar por "Cliente"/"Funcionário"/"Loja"/"Prescritor" + intervalo de datas e ícone verde; assertar resultados coerentes.
  5. Filtro "Status" = "Orçamentos" vs "Concluídos" e "Tipo de movimento" = "Receita"/"Revenda"/"Ambos".
  6. Menu de contexto do registro (botão direito): itens "Abrir Movimento (Receita ou Revenda)", "Atualizar", "Legenda", "Consultar Delivery", "Consultar Financeiro".
- **Lacunas:** Colunas e legenda das Consultas 10922/10919 não listadas; nome exato do item de comissão e dos checkboxes não informado; "Situação" e "Tipo de operação" valores não listados; não diz se Pendências/Orçamentos respeita a loja atual; abrir a receita por duplo clique pode alterar estado (não detalhado); numeração do manual mistura passos de 2 métodos.

---

# Sobreposições e referências cruzadas
- Metas - Produção OK <-> Metas - Vendas OK: mesma família (versão 25.11, autor Thaiffane); produção = Tela 229/625, vendas = Tela 491/146/379.
- Tela 146 (Configuração do Atendimento): citada em Relatórios A4 (código de barras nas fichas), Valor de custo (percentual de taxa técnica) e Metas - Vendas OK (habilitar conclusão da receita).
- Tela 145 (Atendimento - Receita): citada em Valor de custo e em Visualização de Pendências/Orçamentos.
- Comissão do entregador (Tela 041) em Taxa de entrega regiões OK; o grupo "Comissão" de outro manual (Comissão vendas OK / Comissão laboratório OK) não é de D2.
- Cadastro de funcionário (Tela 007): citado em Taxa de entrega regiões OK; também ficha do funcionário em Registo de ponto (aba "Registro de Ponto") e em Metas - Vendas OK (funcionários).
