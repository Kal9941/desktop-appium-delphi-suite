# Manuais — Parte geral: servidor, backup, rótulos, fichas, desativar fórmula e NF-e

> Resumo de referência para escrita de cenários futuros, derivado dos PDFs em `docs/Manuais - Pharmacie/` (7 manuais).
> **Como foi feito (2026-10-28):** texto extraído dos PDFs com `pdftotext` e resumido por leitura integral, sem consultar o app.
> **Limites:** não inclui as imagens/prints dos PDFs; as setas dos caminhos de menu se perderam na extração (aqui aparecem como `>`);
> o manual quase nunca traz mensagens literais de erro/validação nem a lista de campos obrigatórios.
> **Uso:** ponto de partida, não verdade. Todo nome de menu, botão e seletor deve ser validado por inspeção ao vivo
> antes de virar teste (`AGENTS.md` `[R-SEL]`). Ações de risco listadas aqui seguem `[R-RISCO]` (não clicar sem confirmar).
> Índice geral e convenções transversais: `PROJECT_CONTEXT.md` § "Manuais do sistema".

---

# Resumo D1 - Manuais Parte geral (configuração, rótulos, fiscal)

Observação de leitura: os .txt estão em Windows-1252 e as setas de menu ("→") foram perdidas na extração; onde o manual usa setas, está escrito "A  B" separado por espaço no txt e aqui aparece com ">" (marcado como "setas perdidas"). O manual de Importação NF-e usa ">" literalmente. Nenhum manual traz os prints (imagens) do PDF.

---

## 1. Configuração do Servidor

- **Manual:** Configuracao do Servidor OK (Parte geral). Cabeçalho: "Manual de Configuração do Servidor Pharmacie", versão do sistema 26.2, 41 páginas, julho de 2026, elaborado por Thaiffane (Sucesso do Cliente).
- **Objetivo:** Instalar e configurar o servidor Pharmacie (Firebird 64 bits, aliases.conf, IBExpert, GSEC, Firewall) até a abertura do sistema.
- **Tela(s) e caminho de menu:** Nenhuma tela do Pharmacie, exceto a abertura de `PS01` (atalho da Área de Trabalho ou executável PS01 na pasta SisPs). Caminhos de arquivo citados: `C:\SisPs\BD`, "Este Computador > Disco Local (C:) > Arquivos de Programas > Firebird > Firebird_2_5" (aliases.conf, firebird.conf), "bin > fb_inet_server". Comando `firewall.cpl` (Windows + R).
- **Pré-requisitos:** Instalador do Firebird 64 bits e do IBExpert; sistema Pharmacie instalado (outro manual, via link); banco de dados e banco de imagens para copiar em `SisPs\BD`; execução como administrador. Confirmar se o computador já é servidor de outro sistema do cliente (principalmente em implantação).
- **Fluxo:**
  1. Instalar Firebird 64 bits (executar como administrador): idioma > OK; "Seguinte"; "Aceito o contrato"; manter caminho; componentes "Binários Classic Server"; manter pasta do Menu Iniciar; "Instalar"; desmarcar "After installation - What's next?" e "Concluir".
  2. Instalar o sistema Pharmacie (manual externo). Criar pasta `BD` dentro de `SisPs` e copiar banco de dados e banco de imagens.
  3. Editar `aliases.conf` (Bloco de Notas): apagar o conteúdo e digitar manualmente `pharmacie = C:\SisPs\BD\psbd.fdb` e `ps_img = C:\SisPs\BD\psbd_img.fdb`. Se o Windows não permitir salvar: Alt + Enter > guia "Segurança" > "Editar" > janela "Permissões para aliases" > marcar todas as opções da coluna "Permitir" para todos os grupos/usuários > "Aplicar" > "OK" > "Aplicar" > "OK"; reabrir e salvar.
  4. Clientes com filial: em `firebird.conf`, Ctrl + F "AUX_PORT", remover `#` e configurar `AUX_PORT = 3051`; salvar.
  5. Instalar IBExpert (administrador): "Avançar"; "Eu aceito os termos do contrato"; manter caminho; desmarcar "Não criar uma pasta no meu Menu Iniciar" e "Criar um ícone na Área de Trabalho"; "Instalar"; manter "Executar IBExpert by Porongo" e "Concluir". Se perguntar sobre a interface, escolher "MDI". Criar/registrar banco na tela "Criar Banco de Dados" e clicar "Register".
  6. Executar GSEC como administrador: campo "Sistema Operacional" = "Windows Seven" > "Alterar".
  7. Teste: abrir IBExpert, duplo clique no banco registrado, informar a senha > OK. Se abrir, configuração concluída.
  8. Firewall (`firewall.cpl`): "Alterar configurações" > "Permitir outro aplicativo" > "Procurar" > adicionar `PS01` e `PS04` (em `C:\SisPs`) e `fb_inet_server` (em `...\Firebird_2_5\bin`) > "Adicionar" > "OK". Depois "Ativar ou desativar o Firewall do Windows Defender" > "Desativar o Firewall do Windows Defender" > "OK".
  9. Abrir o sistema pelo atalho ou executável PS01.
- **Campos e regras de negócio:** Instalar primeiro o Firebird 64 bits. Digitar o aliases.conf manualmente (copiar/colar "já causou erros de configuração em outras instalações"). No registro do banco no IBExpert, manter o campo "Password" em branco: "Nunca salve a senha do banco de dados nesse cadastro". Erros de acesso: verificar senha, se o GSEC foi executado como administrador, e se o aliases.conf foi digitado corretamente. Antes de abrir o sistema, confirmar que o PS01 está na mesma versão do banco (evita atualização na primeira execução); substituir o PS01 não altera as configurações do servidor.
- **Ações de risco:** INFRAESTRUTURA - NÃO EXPLORAR PELA UI. Instalar/alterar Firebird, editar aliases.conf e firebird.conf (aponta o banco), GSEC (usuários/senhas do banco), desativar o Firewall do Windows Defender, e registrar banco no IBExpert. O manual alerta que instalação incorreta "poderá interromper o funcionamento do banco de dados existente".
- **Candidatos a cenário de teste:** Não testável pela UI do Pharmacie de forma segura. Tudo ocorre fora do PS01 (instaladores, Bloco de Notas, IBExpert, firewall). O único ponto ligado ao sistema é a abertura do PS01 com o banco acessível (smoke de abertura/login, que já é coberto pelo setup do projeto). Nenhum cenário Cucumber de configuração é recomendado.
- **Lacunas:** Valores exatos digitados na tela "Criar Banco de Dados" (só em imagem); versão exata do instalador; senha do banco não informada; o manual manda desativar o Firewall inteiro (recomendação de segurança discutível, não justificada); "Windows Seven" no GSEC sem explicação; sem descrição de mensagens de erro do sistema.

---

## 2. Configuração de backup

- **Manual:** Configuração de backup OK (Parte geral). Título "PROCEDIMENTO PARA CONFIGURAR BACKUP", 15 páginas, julho de 2026, Thaiffane (Sucesso do Cliente). Versão do sistema: não informado.
- **Objetivo:** Instalar e configurar o "SisPS BKP - Gerenciador de Backup" (aplicativo separado do Pharmacie) para gerar backup automático do banco e iniciar com o Windows.
- **Tela(s) e caminho de menu:** Nenhuma tela numerada do Pharmacie. Menu do ícone da bandeja do Gerenciador: "Configurações > Banco de Dados > Selecionar" e "Configurações > Status" (setas perdidas). Pastas: `SisPS\BD`, `SisPS_BKP\BKP` (backups gerados), `SisPS BKP` (executável `PSBK`), `shell:startup`.
- **Pré-requisitos:** Instalador do Gerenciador de Backup; banco de dados em `C:\SisPS\BD`; direitos de administrador.
- **Fluxo:**
  1. Executar o instalador como Administrador; manter caminho padrão (pode ser outro disco local); deixar desmarcada "Criar um ícone na Área de Trabalho"; "Próximo" > "Instalar"; manter marcada "Iniciar o SisPS BKP - Gerenciador de Backup" > "Concluir".
  2. Localizar o ícone na barra de tarefas ou na área de ícones ocultos (seta ^).
  3. Botão direito no ícone > "Configurações > Banco de Dados > Selecionar" > Explorador: Este Computador > C: > SisPS > BD > selecionar o banco de dados > "Abrir".
  4. "Configurações > Status": escolher o intervalo do backup (definido com o cliente). O programa inicia automaticamente a primeira execução; aguardar e verificar o arquivo.
  5. Conferir em C: > `SisPS_BKP` > `BKP` se existe o arquivo de backup.
  6. Opcional: até 2 locais de cópia adicionais (qualquer local; recomenda OneDrive).
  7. Iniciar com o Windows: Windows + R > `shell:startup` > copiar o executável `PSBK` da pasta `SisPS BKP` e colar na pasta Inicializar.
  8. Teste final: reiniciar o computador e confirmar que o Gerenciador iniciou e o backup está sendo gerado.
- **Campos e regras de negócio:** "Sempre configure primeiro o caminho do banco de dados. Somente depois configure o Status do backup." Selecionar apenas o banco de dados, NÃO o banco de imagens. Intervalo: opções não detalhadas no texto. Até 2 locais de cópia.
- **Ações de risco:** INFRAESTRUTURA - NÃO EXPLORAR PELA UI. Selecionar o banco errado, alterar "Status" (dispara backup imediato do banco), mexer na pasta Inicializar e reiniciar o computador. Ações de backup acessam o arquivo .fdb em uso.
- **Candidatos a cenário de teste:** Não testável pela UI do Pharmacie; é outro aplicativo (bandeja do Windows) e as verificações são no sistema de arquivos/reinicialização. Não recomendado em suíte Appium do PS01. Em ambiente isolado de laboratório, apenas verificação manual/script de arquivo (existência de arquivo em `C:\SisPS_BKP\BKP` após selecionar intervalo), fora do escopo Cucumber/PS01.
- **Lacunas:** Lista de intervalos disponíveis em "Status", nome/extensão do arquivo de backup, política de retenção, como configurar os 2 locais de cópia (menu não indicado), versão do sistema, comportamento quando o banco está em uso.

---

## 3. Configuração de rótulo de matéria-prima

- **Manual:** Configuração de rótulo de materia prima OK (Parte geral). Título "PROCEDIMENTO PARA IMPRIMIR ROTULO DE MATERIA PRIMA, EMBALAGEM E REVENDA", VER. 26.2, 14 páginas, abril de 2026, Thaiffane (Implantação).
- **Objetivo:** Imprimir e configurar o rótulo de lote de matéria-prima, embalagem e revenda a partir do estoque detalhado do produto.
- **Tela(s) e caminho de menu:** "Cadastro > Produtos > Alopatia > Ficha do Produto" (setas perdidas); Tela 112 - Cadastro de Produtos (Alopatia); Tela 160 - Estoque Detalhado; Tela 148 - Gerenciador de Impressão de Rótulos (Estoque Detalhado); Tela 002 - Configuração de Relatório.
- **Pré-requisitos:** Produto cadastrado com pelo menos um lote ("Só é possível imprimir rótulo se o produto possuir lote cadastrado. Sem lote, o sistema não permitirá a impressão"). Impressora configurada para imprimir (ou usar Visualizar).
- **Fluxo:**
  1. Menu "Cadastro > Produtos > Alopatia > Ficha do Produto" abre a Tela 112; pesquisar o produto.
  2. Na Tela 112, clicar nos "três pontinhos" > "Estoque Detalhado".
  3. Abre a Tela 160 - Estoque Detalhado (mostra "Lote" e "Quantidade disponível"); clicar em "Rótulos".
  4. Abre a Tela 148 - Gerenciador de Impressão de Rótulos. Se o lote não aparecer, verificar o status do lote.
  5. Marcar a opção "IR" no lote e clicar em "Rótulos".
  6. Na tela de rótulos: ajustar largura/altura e escolher o modelo de rótulo (todos vêm selecionados automaticamente; modelos com código de barras têm a descrição "c/ código de barra").
  7. Clicar em "Configurar Relatório" > Tela 002 - Configuração de Relatório: selecionar o modelo a configurar.
  8. Configurar impressão/fonte/margens/papel/layout (ver regras) e clicar em "Gravar configurações".
  9. Escolher "Visualizar" ou imprimir diretamente. Em "Visualizar": revisar tamanho, informações e alinhamento; imprimir pelo ícone de impressão no canto superior direito.
- **Campos e regras de negócio:**
  - Impressora; Tipo de impressora: "Jato de tinta" = Impressora A4; "Matricial" = impressoras térmicas.
  - Orientação: "Retrato" / "Paisagem".
  - Tipo de papel: "1 - A4", "2 - Carta", "3 - Personalizado (rótulo)", "4 - A5".
  - "Posição cód. barra": se não selecionada, o rótulo sai sem código de barras.
  - Fonte: tipo de letra (geralmente Arial), tamanho (padrão normalmente 6), "Negrito".
  - Margens (cm): Superior (move conteúdo para baixo), Inferior (para cima), Esquerda (para a direita), Direita (para a esquerda).
  - Tamanho do papel: Largura e Altura do rótulo. "Grade (cm)" e "tam. Coluna(cm)" só para rótulos múltiplos (opcionais).
  - Layout da coluna: "Abaixo e à direita" = impressão diagonal; "Direita e abaixo" = impressão horizontal.
  - Modelo de tamanho diferente do físico: informações podem sair cortadas. Sempre selecionar o modelo que foi configurado.
- **Ações de risco:** "Gravar configurações" (altera configuração de relatório persistente, global ao sistema/impressora); imprimir diretamente (envia à impressora). Visualizar é seguro.
- **Candidatos a cenário de teste:**
  1. Positivo: produto Alopatia com lote > Tela 112 > "Estoque Detalhado" > Tela 160 mostra "Lote" e "Quantidade disponível" > "Rótulos" abre Tela 148 (assertar títulos das telas 160/148).
  2. Positivo: marcar "IR" > "Rótulos" > "Visualizar" abre a pré-visualização do rótulo (assertar tela de visualização aberta, sem imprimir).
  3. Negativo: produto sem lote (ou lote não listado por status) > o sistema não permite imprimir / lote não aparece na Tela 148 (assertar ausência do lote ou mensagem; mensagem literal não informada).
  4. Configuração (cautela): na Tela 002, alterar margem e "Gravar configurações" e reabrir confirmando persistência; requer restaurar valores originais (efeito persistente).
  5. Borda: modelo "c/ código de barra" sem "Posição cód. barra" selecionada gera rótulo sem código de barras (verificável só visualmente).
- **Lacunas:** Mensagem exata quando o produto não tem lote; quais status de lote impedem aparecer na Tela 148; o que é a opção "IR" (rótulo do campo; provavelmente "imprimir rótulo") e onde fica; ícone "três pontinhos" (posição só na imagem); nomes dos modelos de rótulo; tela de "Visualizar" não numerada; valores padrão das margens.
- **Sobreposição:** Seções de Tela 002 (impressão/fonte/margens/papel/layout) repetem o manual de rótulo de receita e o de Fichas 40 colunas.

---

## 4. Configuração de rótulo de receita

- **Manual:** Configuração de rótulo de receita OK (Parte geral). Título "RÓTULO - CONFIGURAÇÕES", VER. 26.2, 14 páginas, abril de 2026, Thaiffane (Implantação).
- **Objetivo:** Acessar a tela de rótulos de uma fórmula/receita, configurar layout/margens/impressora e definir rótulo padrão.
- **Tela(s) e caminho de menu:** Tela 145 (Opção 1: digitar o código da fórmula, Enter, clicar em "rótulos"); menu "Relatório - Rótulos" (Opção 2: busca direta; escrito assim, traço no txt). A tela de configuração é a mesma de rótulos (Tela 002 não é citada nominalmente neste manual).
- **Pré-requisitos:** Fórmula concluída ("A fórmula precisa estar concluída; caso esteja em orçamento, não haverá informações disponíveis"). Impressora para teste de impressão.
- **Fluxo:**
  1. Opção 1: Tela 145 > digitar o código da fórmula > Enter > "rótulos"; a tela abre com informações já preenchidas.
  2. Opção 2: "Relatório - Rótulos" > informar "Código da receita" e "número da fórmula" no segundo campo > Enter; informações carregadas automaticamente.
  3. Ao abrir a tela de configuração, campos podem estar em branco ou padrão. Se já configurado: duplo clique no rótulo padrão para carregar margens e impressora; selecionar o rótulo desejado, clicar "OK" e gravar. Se nunca configurado: ajustes iniciais.
  4. Para editar um rótulo específico, clicar no campo amarelo "OK".
  5. Configurar impressão, fonte, margens, tamanho do papel e layout da coluna (mesmos campos do manual de matéria-prima) e clicar em "Gravar configurações".
  6. Definir padrão: botão direito sobre o rótulo > "Definir como padrão"; o modelo vem automaticamente preenchido nas próximas aberturas.
- **Campos e regras de negócio:** Mesmos campos do item 3: Impressora, Tipo de impressora ("Jato de tinta" = Impressora A4; "Matricial" = térmicas), Orientação (Retrato/Paisagem), Tipo de papel ("1 - A4", "2 - Carta", "3 - Personalizado (rótulo)", "4 - A5"), "Posição cód. barra", Fonte (Arial; padrão tamanho 6; Negrito), Margens (cm) Superior/Inferior/Esquerda/Direita, Largura/Altura, "Grade (cm)", "tam. Coluna(cm)" (opcionais), Layout da coluna ("Abaixo e à direita" diagonal; "Direita e abaixo" horizontal). Fórmula em orçamento não carrega dados de rótulo.
- **Ações de risco:** "Gravar configurações" e "Definir como padrão" alteram configuração persistente e global; imprimir. Tela 145 é a tela de receita (regra do projeto: cuidado com ações de gravação).
- **Candidatos a cenário de teste:**
  1. Positivo: Tela 145 com fórmula concluída > Enter no código > "rótulos" abre a tela de rótulos já preenchida (assertar campos preenchidos).
  2. Positivo: "Relatório - Rótulos" > código da receita + número da fórmula + Enter carrega as informações (assertar campos).
  3. Negativo: fórmula em orçamento (não concluída) > a tela de rótulos não traz informações (assertar vazio; comportamento exato não informado).
  4. Persistência (cautela): duplo clique no rótulo já configurado carrega margens/impressora gravadas.
  5. "Definir como padrão" persiste para as próximas aberturas (requer restaurar o padrão anterior).
- **Lacunas:** Rótulo "padrão" vs "Definir como padrão" (qual nome do rótulo na lista); o que é o campo amarelo "OK" (rótulo/botão) na imagem; em Opção 2 não é dito quais campos exatos (primeiro e segundo); menu "Relatório - Rótulos": nível do menu não informado (setas perdidas); sem mensagem para orçamento; caminho "Movimentos > ... > Receita" para a Tela 145 não consta aqui.
- **Sobreposição:** Seções 4 a 7 e Tela de configuração idênticas ao manual de matéria-prima (item 3) e parte do de Fichas 40 colunas (item 6).

---

## 5. Desativar fórmula

- **Manual:** Desativar formula (Parte geral). Título "DESATIVAR FÓRMULA CONCLUÍDA", versão do sistema 26.5, 2 páginas, julho de 2026, Thaiffane (Sucesso do Cliente).
- **Objetivo:** Desativar uma fórmula concluída de uma receita (fórmulas não podem ser excluídas).
- **Tela(s) e caminho de menu:** "Movimentos > Atendimentos > Receitas" (setas perdidas); Tela 145 - Atendimento ao Cliente - Receita.
- **Pré-requisitos:** Receita com fórmula marcada como "Concluído".
- **Fluxo:**
  1. Menu Movimentos > Atendimentos > Receitas abre a Tela 145.
  2. Informar a receita a consultar.
  3. Selecionar a fórmula a desativar.
  4. Desmarcar a opção "Concluído".
  5. Clicar em "Gravar".
  6. Resultado: insumos aparecem riscados na tela; não é gerada ficha de pesagem; o valor da fórmula não é cobrado.
- **Campos e regras de negócio:** As fórmulas não podem ser excluídas, só desativadas. Desativar = desmarcar "Concluído" e "Gravar". Efeitos: insumos riscados, sem ficha de pesagem, valor não cobrado (impacto no total da receita não detalhado). Manual não diz se é reversível (reativar marcando "Concluído" não é descrito).
- **Ações de risco:** ALTO. "Gravar" na Tela 145 altera receita real e valores cobrados/fichas; pelas regras do projeto exige confirmação antes de executar em exploração. Em testes, usar receita criada pelo próprio teste.
- **Candidatos a cenário de teste:**
  1. Positivo: receita com fórmula concluída > desmarcar "Concluído" > "Gravar" > insumos riscados (assertar atributo/estilo, se visível na árvore de acessibilidade; caso contrário, assertar estado do checkbox).
  2. Positivo: após desativar, o valor total da receita não inclui a fórmula desativada (assertar total antes/depois).
  3. Positivo: após desativar, não há ficha de pesagem para a fórmula (verificar na lista de fichas, Tela 145 > "Fichas").
  4. Borda: confirmar que não existe ação de excluir fórmula (assertar ausência de botão/opção).
  5. Borda: reativar marcando "Concluído" novamente (não documentado; só como exploração).
- **Lacunas:** Se existe mensagem de confirmação; como o sistema trata receita com uma única fórmula; se reativação é permitida e o efeito; o que acontece com estoque já baixado/pesagem já feita; se "Concluído" está habilitado para qualquer status da receita; a versão (26.5) difere da dos demais manuais (26.2); o menu "Movimentos > Atendimentos > Receitas" difere do manual de Fichas 40 colunas ("Movimentos > Produtos > Receita") para a mesma Tela 145.

---

## 6. Fichas 40 colunas

- **Manual:** Fichas 40 colunas OK (Parte geral). Título "CONFIGURAÇÃO FICHA 40 COL." / "Manual - Configuração de Fichas de 40 Colunas", versão do sistema 26.5, 11 páginas, setembro de 2026, Thaiffane (Sucesso do Cliente).
- **Objetivo:** Configurar impressão (impressora, papel, margens, layout) das fichas de 40 colunas (matricial) da Tela 145 e reaproveitar a configuração.
- **Tela(s) e caminho de menu:** "Movimentos > Produtos > Receita" (setas perdidas); Tela 145 - Atendimento ao Cliente - Receita (botão "Fichas"); Tela 002 - Configuração de Relatório. Existem outras telas com fichas de 40 colunas; "o processo de configuração é o mesmo".
- **Pré-requisitos:** Receita aberta/disponível na Tela 145 para listar fichas (não explícito); impressora instalada. Os valores de margem do manual são "apenas exemplos e sugestões".
- **Fluxo:**
  1. Menu Movimentos > Produtos > Receita abre a Tela 145; clicar em "Fichas" para ver as fichas.
  2. Clicar em "Configurar Relatório" > abre Tela 002 - Configuração de Relatório; selecionar a ficha de 40 colunas e ajustar na área "Configuração do Relatório".
  3. Definir Impressora, Tipo de impressora, Orientação, Tipo de papel, "Posição Cód. Barras", Fonte, Margens, Tamanho do papel, Layout da coluna.
  4. Clicar em "Gravar"; depois "Visualizar" ou enviar direto para "Impressão" (em "Visualizar" também é possível imprimir depois).
  5. Ajustar configuração existente: duplo clique na ficha já configurada; o sistema carrega os valores; alterar o necessário e "Gravar".
  6. Reutilizar: duplo clique em ficha já configurada, aguardar carregar, selecionar as demais fichas de 40 colunas e "Gravar" (aplica mesmas margens/configurações às selecionadas).
- **Campos e regras de negócio:**
  - Tipo de impressora: "0 - Matricial" (modelos mais antigos), "1 - Matricial rápida" (mais recentes); influencia o resultado da impressão.
  - Orientação: "1 - Retrato" (normal para 40 colunas), "2 - Paisagem".
  - Tipo de papel: usar "Personalizado" (permite definir dimensões e margens).
  - "Posição Cód. Barras": selecionar posição se precisar de código de barras; caso contrário, manter padrão da empresa.
  - Fonte: Arial ou Calibri normalmente.
  - Margens: Superior (conteúdo para baixo), Inferior (para cima), Esquerda (para a direita), Direita (para a esquerda).
  - Tamanho do papel: Largura (medir com régua); Altura (se desconhecida, usar 20 como referência inicial).
  - "Grade (cm)" e "Tam. Coluna (cm)": só para múltiplas colunas; opcionais.
  - Layout da coluna: "Abaixo e à direita" (primeiro para baixo, depois à direita); "Direita e abaixo" (primeiro à direita, depois para baixo).
  - Algumas fichas imprimem SEMPRE DUAS VIAS (1ª via: ficha da loja; 2ª via: ficha do cliente); fixo, não alterável. Para uma via só, na visualização selecionar somente a página desejada ("1 de 1" em vez de "1 de 2").
- **Ações de risco:** "Gravar" na Tela 002 altera configuração persistente, e "Gravar" após selecionar várias fichas sobrescreve as configurações de todas as selecionadas (aplicação em lote). Imprimir envia à impressora. "Visualizar" é seguro.
- **Candidatos a cenário de teste:**
  1. Positivo: Tela 145 > "Fichas" lista as fichas; "Configurar Relatório" abre a Tela 002 (assertar título e a área "Configuração do Relatório").
  2. Positivo: Tela 002 com ficha 40 colunas selecionada expõe os campos "Tipo de impressora" com opções "0 - Matricial" e "1 - Matricial rápida" e "Orientação" com "1 - Retrato"/"2 - Paisagem" (assertar opções).
  3. Persistência (cautela): duplo clique em ficha configurada carrega os valores gravados (assertar margens carregadas).
  4. Positivo: "Visualizar" ficha de duas vias exibe 2 páginas ("1 de 2"), uma da loja e uma do cliente.
  5. Borda: preencher margens/dimensões e restaurar valores originais depois (efeito persistente).
- **Lacunas:** Quais fichas são de 40 colunas (nomes); mensagens de validação; limites de margem; padrão de "Posição Cód. Barras"; em qual momento a receita precisa estar concluída para listar fichas; nomes literais das outras telas com fichas 40 col.; caminho de menu difere do manual de Desativar fórmula.
- **Sobreposição:** Campos de impressão/margens/papel/layout equivalem aos manuais de rótulo de matéria-prima e de receita (Tela 002); diferença: aqui "Tipo de impressora" tem "0 - Matricial"/"1 - Matricial rápida", enquanto nos rótulos tem "Jato de tinta"/"Matricial", e a orientação aqui é "1 - Retrato"/"2 - Paisagem" (com numeração).

---

## 7. Importação NF-e

- **Manual:** Importação NF-e OK (Parte geral). Título "Manual de Importação de NF-e", versão do sistema 26.2, 13 páginas, julho de 2026, Thaiffane (Sucesso do Cliente).
- **Objetivo:** Importar manualmente um XML de NF-e de compra, cadastrando/relacionando insumos e dando entrada de lotes no estoque.
- **Tela(s) e caminho de menu:** "Movimentos > Produtos > Compras > Importar NFe"; Tela 218 - Importar NF-e (opção "Importação manual" + botão "Importar XML"); Tela 218 - Importar NF-e - XML; tela de inclusão e relacionamento do produto (sem número); Tela 056 - Cadastro de Lançamento Financeiro - Contas a Pagar/Receber (para criar lançamento/duplicata); Tela 132 - Nota Fiscal (Compra); Tela 145 - Receita (citada como destino do nome do insumo).
- **Pré-requisitos:** Arquivo XML da NF-e acessível ao Explorador de Arquivos; Lançamento financeiro (duplicata) já cadastrado, selecionável (criar na Tela 056 se necessário); cadastros de origem, localização do estoque, natureza de operação; fornecedor/insumos podem estar já cadastrados ou ser criados no fluxo.
- **Fluxo:**
  1. Menu "Movimentos > Produtos > Compras > Importar NFe" abre a Tela 218 - Importar NF-e; marcar "Importação manual" (1) e clicar "Importar XML" (2).
  2. Tela 218 - Importar NF-e - XML: preencher "Origem", "Localização do estoque" (ex.: almoxarifado/laboratório), "Lançamento (Duplicata)", "Natureza de operação", "Status do lote" (ex.: "Liberado", "Quarentena", "Fechado"); clicar "Importar XML".
  3. Explorador de Arquivos: selecionar o XML > "Abrir".
  4. A Tela 218 mostra fornecedor, série, número da nota, data de emissão, valor total; lista com nome do insumo, quantidade, unidade (kg, g, ml e u), valor unitário, desconto e valor total. Insumos em VERMELHO = ainda não cadastrados; em PRETO = já existe cadastro.
  5. Duplo clique no item para cadastrar/relacionar. Na tela de inclusão e relacionamento, conferir o "Tipo de produto" (ex.: não cadastrar embalagem como Alopatia); se cadastrado, clicar na lupa para localizar; se não, "Cadastrar novo produto".
  6. Novo insumo: preencher "Nome" (somente o nome; sem lote/peso; aparece na Tela 145 - Receita), "Descrição no rótulo" (preenchido automaticamente no primeiro cadastro, a partir do nome), "Grupo", "Classificação" (ex.: excipiente, fórmula), "Tipo de estoque"; demais campos pelo padrão da loja (ícone azul cria novos cadastros). Seção "Índices e valores": preencher "Valor de compra", "Valor de custo", "Valor de venda", "Valor de referência". "Gravar" e fechar a tela.
  7. De volta à tela de inclusão: nome do insumo, código de barras, NCM, lote, fabricação e vencimento são preenchidos; informar quantidade e unidade; para mais lotes do mesmo insumo usar "Incluir novo lote"; preencher "Concentração (%)", "Densidade" e "Umidade" conforme a nota; clicar "Incluir/Alterar".
  8. O insumo fica VERDE (informações preenchidas). Repetir para todos até todos os itens ficarem verdes. Na parte inferior aparecem informações do lote selecionado e das duplicatas. Clicar "Importar NFe".
  9. Mensagem de confirmação da importação: "Sim". Depois, mensagem perguntando se deseja consultar a nota: "Sim".
  10. Abre a Tela 132 - Nota Fiscal (Compra): valores, informações complementares, chave da NF-e, data de emissão, série, número. Opção "2 - Lista de produtos": insumos, quantidades, CFOP, valor total, ST.
  11. Para ver o lote que deu entrada: selecionar o item, botão direito > "Abrir ficha do produto".
- **Campos e regras de negócio:**
  - Cálculo de valores (exemplo do manual): Valor de custo = Valor de compra × índice de custo (R$ 2,00 × 1,50 = R$ 3,00; índice 1,50 = acréscimo de 50%). Valor de venda = Valor de custo × índice de venda (R$ 3,00 × 0,6667 ≈ R$ 2,00; redução de 33,33%). Valor de referência = Valor de venda × índice de referência (R$ 2,00 × 1,00 = R$ 2,00). No exemplo, custo R$ 3,00 e venda R$ 2,00, diferença negativa de R$ 1,00 (33,33% do custo).
  - "Valor de compra": valor pago ao fornecedor por grama, mililitro ou unidade. Preencher os valores antes de finalizar para não deixar o insumo com valor zerado.
  - Quantidades no Pharmacie são em gramas, mililitros ou unidades.
  - "Tipo de produto" incorreto leva a nota importada com cadastro inadequado (ex.: Embalagem cadastrada como Alopatia).
  - "Nome" não deve conter lote/peso (aparece na Tela 145 e "Descrição no rótulo" alimenta o rótulo da matéria-prima).
  - Cores: vermelho = não cadastrado; preto = cadastrado; verde = preenchido. Só importa quando todos os itens estão verdes.
  - Status do lote: "Liberado", "Quarentena" ou "Fechado" (exemplos).
- **Ações de risco:** ALTO. "Importar NFe" (confirmar "Sim") dá entrada de estoque, cria lotes/duplicatas/lançamento financeiro e cadastra produtos reais e não é descrito como reversível no manual. "Cadastrar novo produto", "Incluir/Alterar" e "Gravar" criam cadastros permanentes. Em exploração, só até o carregamento do XML/visualização de itens, sem clicar "Importar NFe" nem "Sim" sem confirmação.
- **Candidatos a cenário de teste:**
  1. Positivo (E2E, ambiente de teste, com confirmação): Tela 218 > "Importação manual" > "Importar XML" > preencher Origem/Localização/Lançamento/Natureza/Status do lote > selecionar XML > itens listados (assertar fornecedor, série, número, valor total e itens).
  2. Cores: item com insumo não cadastrado aparece em vermelho; após cadastrar e "Incluir/Alterar" fica verde (assertar a cor/estado, se acessível).
  3. Positivo: importar nota completa (todos verdes) > "Importar NFe" > "Sim" > "Sim" (consultar) > Tela 132 mostra chave, série, número; "2 - Lista de produtos" traz CFOP e ST (assertar dados da nota).
  4. Positivo: lote entra na ficha: botão direito > "Abrir ficha do produto" mostra o lote com o "Status do lote" informado e a quantidade.
  5. Negativo/validação: tentar "Importar NFe" com item vermelho/sem preencher (comportamento não descrito: explorar); "Importar XML" sem preencher campos obrigatórios (obrigatoriedade não informada).
  6. Cálculo: valor de custo = compra × índice de custo; venda = custo × índice de venda; referência = venda × índice de referência (assertar nos campos da seção "Índices e valores" com o exemplo 2,00/1,50/0,6667/1,00).
- **Lacunas:** Obrigatoriedade/validação de cada campo da Tela 218 - XML e mensagens de erro; comportamento com XML inválido/duplicado (NF já importada); NF-e com fornecedor não cadastrado; "Importação automática" (existe a opção "manual" implicando outra, não descrita; ver manual "Pegar xml de notas" de outro grupo, se aplicável); como estornar uma importação; valores padrão dos índices; quais campos são obrigatórios no cadastro de novo produto; sem nome numerado para a tela de inclusão/relacionamento.
- **Sobreposição:** O cadastro de insumo e "Índices e valores" se sobrepõem aos manuais de cadastro de insumo de alopatia / Valor de custo (outro grupo).
