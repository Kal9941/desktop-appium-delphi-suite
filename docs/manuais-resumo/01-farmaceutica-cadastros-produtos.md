# Manuais — Parte farmacêutica: cadastros de produtos, embalagens e formas farmacêuticas

> Resumo de referência para escrita de cenários futuros, derivado dos PDFs em `docs/Manuais - OmniCare/` (12 manuais).
> **Como foi feito (2026-10-28):** texto extraído dos PDFs com `pdftotext` e resumido por leitura integral, sem consultar o app.
> **Limites:** não inclui as imagens/prints dos PDFs; as setas dos caminhos de menu se perderam na extração (aqui aparecem como `>`);
> o manual quase nunca traz mensagens literais de erro/validação nem a lista de campos obrigatórios.
> **Uso:** ponto de partida, não verdade. Todo nome de menu, botão e seletor deve ser validado por inspeção ao vivo
> antes de virar teste (`AGENTS.md` `[R-SEL]`). Ações de risco listadas aqui seguem `[R-RISCO]` (não clicar sem confirmar).
> Índice geral e convenções transversais: `PROJECT_CONTEXT.md` § "Manuais do sistema".

---

# Resumo A - Parte farmacêutica: cadastros e produtos (12 manuais)

Convenções deste resumo:
- Nos caminhos de menu o txt perdeu o glifo de seta entre os níveis (aparece "Cadastros  Produtos  ..." com espaço duplo). Aqui o separador foi normalizado para " > ". Os nomes dos níveis são literais.
- Os txt estão em codificação legada (acentos corrompidos na leitura bruta); os termos abaixo foram restaurados ao pt-BR correto.
- Todos os manuais são de "Elaborado por: Thaiffane / Setor: Sucesso do Cliente", Goiânia, julho/agosto de 2026, com "Versão do sistema" 26.2 ou 26.4 (indicada em cada seção).
- Bloco comum a 5 manuais (valores): "Valor de compra" (valor pago ao fornecedor por grama, mililitro ou unidade), "Valor de custo" = Valor de compra x índice de custo, "Valor de venda" = Valor de custo x índice de venda, "Valor de referência" = Valor de custo x índice de referência. Exemplo do manual: R$ 2,00 x 1,50 = R$ 3,00 (custo); R$ 3,00 x 0,6667 = aprox. R$ 2,00 (venda); R$ 3,00 x 1,00 = R$ 3,00 (referência). Resultado do exemplo: custo R$ 3,00 e venda R$ 2,00, "diferença negativa de R$ 1,00, equivalente a 33,33% do valor de custo". Recomendação literal: "recomenda-se preencher os campos da seção Índices e valores antes de finalizar o cadastro" para o produto não ficar com valor zerado. Aparece em: Alopatia completo, Cadastro básico de embalagens, insumo de alopatia, homeopatia, revenda (referido abaixo como "bloco de valores").

---

## 1. Alopatia completo

- **Manual:** Alopatia completo OK (v. sistema 26.2, 9 págs.) - Parte farmacêutica
- **Objetivo:** Descrever todas as abas, campos e opções do cadastro de insumo de alopatia (Tela 112).
- **Tela(s) e caminho de menu:** "Tela 112 - Cadastro de Produtos (Alopatia)"; caminho: Cadastros > Produtos > Insumo (Alopatia) > Ficha do produto. Telas citadas de apoio: Tela 145 (Atendimento ao Cliente - Receita), Tela 106 (Cadastro de Forma Farmacêutica), Tela 135 (cotação), Tela 216 (Lote), Tela 470 (Laudo Interno).
- **Pré-requisitos:** Não informado de forma explícita. Citados: ter configurado a classificação "4 - Revestimento de capsula" e o valor de revestimento entérico na tela de volume (para usar "Revestimento entérico"); conferir configuração de vencimento na Tela 106 antes de preencher "Relação com a forma farmacêutica"; embalagem marcada "Transparente" para o bloqueio "Fotossensível" funcionar.
- **Fluxo:** (o manual é descritivo por seções, sem sequência única)
  1. Menu Cadastros > Produtos > Insumo (Alopatia) > Ficha do produto -> abre Tela 112.
  2. "Informações gerais": Código e Código de barras (gerados após gravar), Ativo, Localização, Número CAS, Número DCB, Tipo de uso (humano, veterinário ou ambos), Descrição no rótulo.
  3. "Agrupamentos": Grupo, Classificação, Linha, Classe, Categoria, Proibida, Marca, Fabricante, Tipo de estoque.
  4. "Índices e valores": ver bloco de valores.
  5. Áreas informativas: Estoque (lotes), Produtos em trânsito, Estoque mínimo e máximo.
  6. Opções do rodapé (checkboxes), Informações extras, Unidades e valores para cálculo, Fator de correção/equivalência/densidade/umidade, Fator utilizado, Informações biofarmacêuticas.
  7. Abas: Memorando, Informações fiscais, Sinônimos, Produção interna, Relação com a forma farmacêutica, SNGPC / Siproquim, Curva ABC.
  8. Menu de opções (ícone no canto superior direito): Estoque detalhado, Histórico de compra, Histórico de estoque, Histórico de preços, Cadastro de códigos de barras, Cadastro de estoque mín./máx., Cadastro de lotes e estoques, Cadastro de produção interna, Consultar último laudo, Relacionamentos, Curva ABC, Duplicar o produto, Importar tabela NCM, Log de alterações.
- **Campos e regras de negócio:**
  - "Código" e "Código de barras": gerados automaticamente após a gravação.
  - "Ativo": marcado mantém o insumo disponível para uso.
  - "Classificação": exemplo "excipiente" vs "fórmula" (produção); facilita pesquisas/relatórios.
  - "Categoria": se cadastrado como monodroga, não deve ser associado a outros ativos.
  - "Proibida", "Reposição" e "Compras": "Funcionalidade pendente de validação".
  - "Marca": cadastra a marca e vincula ao fornecedor.
  - "Reservado": quantidade vinculada a fórmulas concluídas na Tela 145 mas sem baixa registrada. "Gasto (mês)": soma das baixas do mês. "Laboratório"/"Almoxarifado": quantidade disponível em cada estoque.
  - Rodapé: "Conservar em geladeira" (aparece no rótulo); "Bloquear perda no processo" (impede perda mesmo com % de perda na forma farmacêutica); "Bloquear excipiente" (impede uso com excipiente na Tela 145); "Fotossensível" (impede embalagens "Transparente"); "Baixa monitorada" (exige baixa monitorada mesmo sem balança); "Uso contínuo" (ao incluir na Tela 145 solicita data de retorno do cliente); "Unificar estoque" (na importação do XML unifica lotes e soma quantidades); "Usar no atendimento" (marcado por padrão; permite uso na Tela 145).
  - "Quantidade mínima e máxima para utilização no cálculo de fórmulas": só aplica se marcar as opções no campo "Checar".
  - UI, UTR, mEq, UFC, grau alcoólico e solubilidade: preencher conforme laudo (também cadastráveis na Tela 216 e Tela 470). UFC: padrão "bilhão por g"; no campo UFC/g informar só o número (laudo "120 bilhões" -> cadastrar 120). Cálculo na Tela 145 por regra de três (exemplo: "Lactobacillus bifidum 2 bilhões - 60 cápsulas", laudo 100 bilhões/g: 60 x 2 = 120 bilhões; x = 1,2 g).
  - "Unidade 1" (mg, mL ou g), "Unidade padrão" (apresentada ao digitar o insumo na Tela 145), "Unidade 2 para cálculo" (g ou mg; interfere diretamente no cálculo da Tela 145), "pH inicial"/"pH final" (ficha de pesagem), "Validade no atendimento (dias)" (usar quando menor que as validades das formas farmacêuticas).
  - "Fator de equivalência" e "Umidade (%)": preencher o valor e marcar a flag correspondente para o sistema considerar. "Enzima": produtos fora da lista -> "não aplicável".
  - "Fator utilizado": 1 - Ficha do produto; 2 - Lote / Ficha do produto; 3 - Controle de qualidade (laudo); 4 - Laudo / Lote / Ficha do produto (ordem de busca descrita no manual). "Lote Sis." preenchido se a opção considera o lote e há lote correspondente. "Fator final" calculado conforme o fator de correção.
  - "Classe biofarmacêutica": relaciona o insumo a excipientes com a mesma classificação.
  - Memorando: Observações "Produto" (Tela 112 e Tela 145), "Cotação" (Tela 135), "Cotação - Fornecedor", "Ficha de pesagem", "Rótulo de compra", "Características", "Indicação e contraindicação", "Avisos - Atendimento" (alerta ao incluir na Tela 145), "Bula".
  - Informações fiscais: NCM e CEST (seguir NCM e orientação da contabilidade).
  - Sinônimos: botão verde "+"; permite quantidade mínima, máxima e fator de equivalência.
  - SNGPC / Siproquim: lista, portaria e dados dos controlados; indicar se controlado pela Polícia Federal e Civil.
  - "Log de alterações": "No momento, esta opção não está disponível".
- **Ações de risco:** O manual não cita botões destrutivos. Pontos de cuidado: desmarcar "Ativo" (desativa o insumo); "Duplicar o produto" cria novo cadastro; "Importar tabela NCM" altera base; "Cadastro de lotes e estoques" gera lote/estoque; "Gravar" (implícito) persiste. Não há menção a "Excluir" nesta tela.
- **Candidatos a cenário de teste:**
  1. Abrir Tela 112 pelo caminho de menu e assertar título/identificação "Tela 112" e presença das abas (Memorando, Informações fiscais, Sinônimos, Produção interna, Relação com a forma farmacêutica, SNGPC / Siproquim, Curva ABC).
  2. Cálculo de valores: preencher Valor de compra 2,00 + índices (custo 1,50, venda 0,6667, referência 1,00) e assertar Valor de custo 3,00, Valor de venda ~2,00, Valor de referência 3,00.
  3. Código e Código de barras vazios antes de gravar e preenchidos (gerados) após gravar.
  4. "Usar no atendimento" vem marcado por padrão em insumo novo.
  5. Menu de opções: listar entradas esperadas (13 itens) e verificar que "Log de alterações" não está disponível.
  6. Opção "Uso contínuo": incluir insumo na Tela 145 e verificar solicitação da data de retorno (cenário cross-tela).
- **Lacunas:** Campos obrigatórios (asterisco) não indicados neste manual (ver manual "insumo de alopatia" para Nome, Grupo, Classificação, Tipo de estoque). Nomes exatos dos controles do menu de opções, ícone usado, valores dos combos de "Checar", "Tipo de uso", "Enzima" e as listas de SNGPC não constam. Localização visual das abas e dos campos de índice (custo/venda/referência) depende de ver a tela. Mensagens de validação não informadas.

---

## 2. Cadastro básico de embalagens

- **Manual:** Cadastro básico de embalagens OK (v. sistema 26.4, 4 págs.) - Parte farmacêutica
- **Objetivo:** Cadastrar uma embalagem (frasco, cápsula e outros) com campos obrigatórios, valores e peso médio.
- **Tela(s) e caminho de menu:** "Tela 123 - Cadastro de Produtos (Embalagens)"; caminho: Cadastros > Produtos > Embalagem (frasco, cápsula e outros) > Ficha do produto.
- **Pré-requisitos:** Não informado explicitamente. Classificação e Tipo de estoque precisam existir (podem ser consultados/cadastrados pelos ícones).
- **Fluxo:**
  1. Abrir o caminho de menu -> abre Tela 123.
  2. Preencher "Nome", "Classificação" e "Tipo de estoque" (campos obrigatórios).
  3. Preencher "Índices e valores" (ver bloco de valores).
  4. Informar "Peso médio" (peso da embalagem vazia) se a empresa usa controle de peso médio.
  5. Clicar em "Gravar" -> salva o cadastro.
- **Campos e regras de negócio:**
  - "Nome": identifica a embalagem no sistema.
  - "Classificação": deve ser preenchida corretamente porque "interfere na ficha de pesagem, nas informações das cápsulas e no cálculo do peso médio". Novo: ícone do "livro azul". Exemplos: cápsulas -> "Cápsulas"; potes ou frascos -> "Recipientes"; tampas -> "Produtos relacionados".
  - "Tipo de estoque": consultar opções pelo ícone da "lupa".
  - "Peso médio": peso da embalagem vazia; necessário para o cálculo correto se a empresa usa controle de peso médio.
- **Ações de risco:** "Gravar" (persistência). Sem ações destrutivas citadas.
- **Candidatos a cenário de teste:**
  1. Positivo: cadastrar embalagem tipo "Recipientes" com Nome, Classificação e Tipo de estoque e gravar; assertar que aparece/consulta.
  2. Negativo: tentar gravar sem Nome/Classificação/Tipo de estoque e assertar bloqueio (mensagem não informada no manual; descobrir na tela).
  3. Classificação "Cápsulas" e verificar que a embalagem fica disponível como cápsula (vínculos, ficha de pesagem).
  4. Valores: cálculo custo/venda/referência conforme exemplo.
  5. Peso médio preenchido persiste após regravar.
- **Lacunas:** Mensagens de erro, quais campos são marcados como obrigatórios na tela, valores iniciais de índices, formato do Peso médio (g?) e se há campos adicionais (capacidade/volume é cadastrado na Tela 125) não informados.
- Sobreposição: seção de valores idêntica aos manuais de insumo de alopatia, homeopatia e revenda (bloco de valores).

---

## 3. Cadastro básico de insumo de alopatia

- **Manual:** Cadastro básico de insumo de alopatia OK (v. sistema 26.2, 4 págs.) - Parte farmacêutica
- **Objetivo:** Passo a passo mínimo para cadastrar um insumo de alopatia.
- **Tela(s) e caminho de menu:** "Tela 112"; caminho: Cadastros > Produtos > Insumo (Alopatia) > Ficha do produto.
- **Pré-requisitos:** Não informado. Grupo e classificação devem existir para seleção.
- **Fluxo:**
  1. Abrir o caminho de menu -> Tela 112.
  2. Preencher "Nome", "Grupo", "Classificação", "Tipo de estoque" (obrigatórios).
  3. Preencher "Índices e valores".
  4. Clicar em "Gravar" -> conclui o cadastro.
- **Campos e regras de negócio:**
  - Obrigatórios: "Nome", "Grupo" (selecionar), "Classificação" (excipiente vs fórmula), "Tipo de estoque" (informar o nome ou clicar na lupa "que vai ter o padrão").
  - Valores: ver bloco de valores.
- **Ações de risco:** "Gravar". Sem ações destrutivas.
- **Candidatos a cenário de teste:**
  1. Positivo: cadastrar insumo com os 4 obrigatórios + valor de compra e gravar; assertar Código gerado automaticamente.
  2. Negativo: gravar sem Grupo (e sem cada obrigatório) e assertar bloqueio.
  3. Classificação "excipiente" aparece depois como opção na Tela 021 (cross-tela; ver Excipiente).
  4. Valor de custo/venda/referência recalculados conforme índices.
  5. Cadastro sem valores: verificar se o produto fica com valor zerado (o manual só recomenda preencher).
- **Lacunas:** Mensagem de campo obrigatório, comportamento exato do campo Tipo de estoque, quais outros campos têm valor padrão. Complementa o manual "Alopatia completo" (Tela 112 detalhada).

---

## 4. Cadastro básico de produto homeopatia

- **Manual:** Cadastro básico de produto homeopatia OK (v. sistema 26.4, 3 págs.) - Parte farmacêutica
- **Objetivo:** Cadastrar insumo de homeopatia com campos obrigatórios e valores.
- **Tela(s) e caminho de menu:** "Tela 130 - Cadastro de produtos (Homeopatia)"; caminho: Cadastros > Produtos > Insumo (Homeopatia) > Ficha do produto.
- **Pré-requisitos:** Não informado. Classificação e Tipo de estoque cadastrados.
- **Fluxo:**
  1. Abrir o caminho -> Tela 130.
  2. Preencher "Nome", "Classificação", "Tipo de estoque".
  3. Preencher "Índices e valores".
  4. Clicar em "Gravar".
- **Campos e regras de negócio:**
  - "Nome": "o nome que identificará homeopatia no sistema" (literal).
  - "Classificação": novo pelo ícone do "livro azul"; consulta pela "lupa".
  - "Tipo de estoque": consulta pela "lupa".
  - Valores: ver bloco de valores. Nota: no texto o item "Valor de referência" aparece na página seguinte (quebra de página), mas pertence à mesma lista.
  - Diferença para alopatia: aqui NÃO há "Grupo" obrigatório citado.
- **Ações de risco:** "Gravar". Sem ações destrutivas.
- **Candidatos a cenário de teste:**
  1. Positivo: cadastrar homeopatia com Nome, Classificação e Tipo de estoque; gravar.
  2. Negativo: omitir cada obrigatório e assertar bloqueio.
  3. Verificar que o produto gravado aparece em Tela 161 (Vínculo matéria-prima/tipo de embalagem) quando tipo de produto = "Homeopatia".
  4. Cálculo custo/venda/referência.
- **Lacunas:** Campos específicos de homeopatia (dinamização, etc.) não descritos. Mensagens de validação não informadas.

---

## 5. Cadastro básico de produtos revenda

- **Manual:** Cadastro básico de produtos revenda OK (v. sistema 26.4, 3 págs.) - Parte farmacêutica
- **Objetivo:** Cadastrar produto de revenda (venda direta) com campos obrigatórios e valores.
- **Tela(s) e caminho de menu:** "Tela 117 - Cadastro de produtos (Revenda)"; caminho: Cadastros > Produtos > Revenda > Ficha do produto.
- **Pré-requisitos:** Não informado.
- **Fluxo:**
  1. Abrir o caminho -> Tela 117.
  2. Preencher "Nome da revenda", "Classificação", "Tipo de estoque".
  3. Preencher "Índices e valores".
  4. Clicar em "Gravar".
- **Campos e regras de negócio:**
  - "Nome da revenda": identifica a revenda no sistema.
  - "Classificação": novo pelo ícone do "livro azul"; consulta pela "lupa".
  - "Tipo de estoque": consulta pela "lupa".
  - Valores: ver bloco de valores (texto usa "insumo" por reaproveitamento do modelo).
- **Ações de risco:** "Gravar". Sem ações destrutivas.
- **Candidatos a cenário de teste:**
  1. Positivo: cadastrar revenda com os 3 obrigatórios e gravar.
  2. Negativo: omitir Nome da revenda e assertar bloqueio.
  3. Valores: cálculo custo/venda/referência.
  4. Produto de revenda gravado fica disponível para venda (Tela 145/venda; não descrito aqui).
- **Lacunas:** Não informa campos de estoque/fiscais específicos de revenda; mensagens de validação não informadas.
- Sobreposição: estrutura idêntica ao manual de homeopatia (muda apenas Tela 117 e o rótulo "Nome da revenda").

---

## 6. Cadastro de volume de embalagem

- **Manual:** Cadastro de volume de embalagem OK (v. sistema 26.2, 6 págs.) - Parte farmacêutica
- **Objetivo:** Cadastrar o volume de cada embalagem e relacionar quantas cápsulas cabem em cada pote.
- **Tela(s) e caminho de menu:** "tela 125 - Volumes"; caminho literal: "Cadastro > Produtos > Embalagens > Volumes [125]" (aqui o manual usa "Cadastro" no singular e "Embalagens" no plural, diferente de "Cadastros > Produtos > Embalagem (frasco, cápsula e outros)" dos demais manuais).
- **Pré-requisitos:** Embalagens (Tela 123) já cadastradas, inclusive potes e cápsulas. Levantar quantas cápsulas cabem em cada pote.
- **Fluxo:**
  1. Abrir Tela 125 - Volumes.
  2. Incluir: botão "+" (verde) ou clique com o botão direito do mouse -> opção de incluir.
  3. Preencher "Embalagem" (nome), "Volume" (volume da cápsula) e "Volume p/ revestimentos (cm)" (apenas para revestimento entérico com banho). Repetir para as demais embalagens.
  4. Para relacionar cápsulas ao pote: na Tela 125 selecionar o POTE primeiro, clicar em "Lista de produtos relacionados ao volume", depois "+" para incluir.
  5. Na tela de inclusão: embalagem com volume principal = POTE; em "Produto relacionado à embalagem" selecionar a cápsula; informar a quantidade de cápsulas que cabem no pote.
  6. Repetir para todas as cápsulas e potes; após incluir, o vínculo aparece na tela de volume; "grave as informações".
- **Campos e regras de negócio:**
  - Dermato: cadastrar volume um pouco maior que o real, por causa da densidade das fórmulas. Exemplo: "Vidro 30ml -> cadastrar como 33ml".
  - Sólidos: sem ajuste. Potes: informar o volume total.
  - "Sempre selecionar o pote primeiro. Se selecionar a cápsula, estará incorreto".
  - Exemplo: "Pote R35: Cápsula 4 -> 80; Cápsula 3 -> 60".
  - Necessário informar para todos os potes "para que o sistema calcule corretamente na tela da receita".
  - Nota do manual: "Todas as imagens com volumes informados e apenas imagens de exemplo".
- **Ações de risco:** "Gravar". Incluir vínculo errado (cápsula selecionada em vez de pote) afeta cálculo na receita. Sem ações destrutivas citadas.
- **Candidatos a cenário de teste:**
  1. Positivo: incluir volume para embalagem (ex.: pote) e gravar; reabrir e assertar volume persistido.
  2. Relacionar cápsula ao pote (Pote R35 / Cápsula 4 = 80) e assertar que aparece na lista de produtos relacionados ao volume.
  3. Negativo/borda: tentar relacionar partindo da cápsula (selecionada em vez do pote) e verificar comportamento (incorreto segundo o manual).
  4. Dermato: volume cadastrado 33 para vidro de 30 mL e verificar uso na receita (cross-tela 145).
  5. Inclusão via clique direito vs botão "+" resultam no mesmo formulário.
- **Lacunas:** Obrigatoriedade/validações dos campos, unidade do campo "Volume" (mL? cm3?), mensagem ao gravar e rótulo exato da lista na tela dependem de ver a tela. O texto de "Volume p/ revestimentos (cm)" é ambíguo (unidade "cm").

---

## 7. Diluentes, conservantes e essência

- **Manual:** Diluentes, conservantes e essência OK (v. sistema 26.2, 6 págs., ago/2026) - Parte farmacêutica
- **Objetivo:** Cadastrar diluentes (exemplo) - processo semelhante para conservantes e essências - com produtos associados e formas farmacêuticas.
- **Tela(s) e caminho de menu:** "Tela 116 - Diluentes, Conservantes e Essências"; caminho: Cadastros > Produtos > Insumo (Alopatia) > Diluentes/Conservantes.
- **Pré-requisitos:** Insumo (Tela 112) e formas farmacêuticas (Tela 106) cadastrados; para "Incluir itens da fórmula" o diluente deve ter produção interna.
- **Fluxo:**
  1. Abrir o caminho -> Tela 116; selecionar o tipo de cadastro: "Diluentes", "Conservantes" ou "Essências".
  2. Incluir: clique direito -> "Incluir" ou botão "+" -> abre tela de cadastro.
  3. Preencher "Produto" (insumo usado como diluente) e "Ativo".
  4. Escolher "Tipo de inclusão" e marcar opções (Incluir itens da fórmula; Checar toda lista de produtos associados; Imprimir observação na ficha de pesagem); preencher "Observação".
  5. "Lista de produtos associados": clique direito -> "Incluir" ou "+" -> tela de inclusão -> selecionar o produto.
  6. "Lista de formas farmacêuticas": "Incluir" -> selecionar a forma farmacêutica.
  7. Clicar em "Gravar" para salvar.
- **Campos e regras de negócio:**
  - "Produto": informar o insumo que será usado.
  - "Ativo": ativa/desativa o diluente.
  - "Tipo de inclusão": "1 - Utilizar sobre o total do produto" (quantidade do produto x percentual) e "2 - Utilizar sobre o total da fórmula" (quantidade produzida x percentual).
  - "Incluir itens da fórmula": usar quando o diluente tem produção interna; o sistema apresenta os insumos usados na produção.
  - "Checar toda lista de produtos associados": o sistema verifica toda a lista de produtos vinculados aos insumos cadastrados.
  - "Imprimir observação na ficha de pesagem" + campo "Observação" (texto aparece na ficha de pesagem).
  - Forma farmacêutica vinculada: quando usada, o sistema considera o diluente correspondente.
  - Conservantes (específico, ao vincular produto na Lista de produtos associados): "Dose (mg)" (valor inicial e final) e "Exige excipiente mesmo com mais de 90% do volume preenchido".
- **Ações de risco:** "Gravar"; desmarcar "Ativo". Sem ações destrutivas citadas.
- **Candidatos a cenário de teste:**
  1. Positivo: na Tela 116 selecionar "Diluentes", incluir Produto + Tipo de inclusão "1 - Utilizar sobre o total do produto", gravar e reabrir.
  2. Variação do tipo de inclusão "2 - Utilizar sobre o total da fórmula" e assertar persistência.
  3. Vincular produto associado e forma farmacêutica; assertar presença nas listas.
  4. Conservante: informar "Dose (mg)" inicial/final e "Exige excipiente mesmo com mais de 90% do volume preenchido"; assertar persistência.
  5. Desmarcar "Ativo" e verificar que o diluente deixa de ser aplicado (cross-tela 145).
  6. Alternância do seletor Diluentes/Conservantes/Essências mostra listas distintas.
- **Lacunas:** Campos de percentual não são nomeados (o texto cita "percentual informado" sem nome do campo). Obrigatoriedade, mensagens, rótulo do seletor de tipo (radio? combo?) e comportamento da exigência de excipiente dependem da tela. Essências: nenhuma particularidade descrita.
- Sobreposição: estrutura muito parecida com o manual Excipiente (Tela 021), mas sem "Checar", "Prioridade" e "Percentual mín.".

---

## 8. Excipiente

- **Manual:** Excipiente OK (v. sistema 26.2, 6 págs.) - Parte farmacêutica
- **Objetivo:** Configurar excipientes e os critérios de escolha automática na fórmula.
- **Tela(s) e caminho de menu:** "Tela 021 - Excipientes"; caminho: Cadastros > Produtos > Insumo (Alopatia) > Excipientes. Citadas: Tela 112, Tela 106 (campo "Cálculo do excipiente").
- **Pré-requisitos:** Excipiente já cadastrado como produto na Tela 112 ("Caso ainda não esteja cadastrado, realize o cadastro na Tela 112 - Cadastro de Produto (Alopatia)"); formas farmacêuticas cadastradas; revisar "Cálculo do excipiente" na Tela 106.
- **Fluxo:**
  1. Abrir o caminho -> Tela 021.
  2. Clique direito -> "Incluir" ou botão "+" -> abre tela de inclusão/alteração.
  3. Informações gerais: "Excipiente", "Checar", "Dose (mg)", "Percentual mín.", "Prioridade", "Ativo", opções, "Referências", "Observação".
  4. Clicar em "Incluir/Alterar" para salvar o cadastro; para outro excipiente, clicar em "Limpar" e preencher.
  5. "Lista de produtos associados": clique direito "Incluir" ou "+"; informar Produto; "Dose (mg)" e "Percentual mín." opcionais; "Prioridade", "Completar volume"; clicar "Incluir/Alterar" para confirmar o vínculo.
  6. "Lista de formas farmacêuticas": "Incluir" -> selecionar forma -> "Incluir/Alterar".
  7. Concluídos cadastros e vínculos, clicar "Gravar".
- **Campos e regras de negócio:**
  - "Checar" define o critério de escolha do excipiente: "Lista de produtos associados" (insumos vinculados), "Classificação biofarmacêutica" (definida na Tela 112 em Informações Extras), "Forma farmacêutica".
  - "Dose (mg)": faixa inicial/final. O campo "Cálculo do excipiente" da Tela 106 determina o uso: "Opção 0: dose informada = faixa de utilização do excipiente"; "Opção 1: dose considerada pela quantidade dos insumos na fórmula" (ex.: faixa 0,001 a 10.000; se o limite máximo for ultrapassado, o sistema usa outro excipiente aplicável).
  - "Percentual mín.": percentual mínimo na fórmula - "não o percentual total do excipiente".
  - "Prioridade": ordem de uso pelo sistema (no excipiente e, separadamente, do insumo em relação ao excipiente).
  - "Ativo": mantém o excipiente ativo.
  - "Incluir itens da fórmula": para excipiente de produção interna.
  - "Imprimir observação na ficha de pesagem": imprime o campo Observação.
  - "Checar toda lista de produtos associados": verifica toda a lista de produtos vinculados.
  - "Referências": campo para consulta na própria tela.
  - "Completar volume" (nos produtos associados): se marcado, obriga completar o volume a 100% da capacidade; se não marcado, só completa se o volume preenchido for inferior a 90%.
- **Ações de risco:** "Incluir/Alterar" (altera excipiente existente); "Limpar" (descarta o formulário em edição); "Gravar" (persiste); desmarcar "Ativo". Sem "Excluir" citado.
- **Candidatos a cenário de teste:**
  1. Positivo: incluir excipiente com critério "Forma farmacêutica", vincular forma e gravar; reabrir e assertar.
  2. Critério "Lista de produtos associados": incluir produto com Dose (mg) e Percentual mín., assertar na lista.
  3. "Limpar" esvazia o formulário para novo cadastro.
  4. Borda: faixa de dose 0,001 a 10.000 e uso de outro excipiente quando ultrapassar (cross-tela 145, requer Cálculo do excipiente = 1 na Tela 106).
  5. "Completar volume" marcado vs desmarcado: assertar completar a 100% vs só abaixo de 90% (cross-tela 145).
  6. Negativo: incluir sem preencher "Excipiente" (mensagem não informada).
- **Lacunas:** Obrigatoriedade/validações, formato numérico de Dose e Percentual mín., e o que "Prioridade" aceita (menor número = maior prioridade?) não informados. Diferença visual entre "Incluir/Alterar" e "Gravar" depende da tela. Mensagens do sistema não constam.
- Sobreposição: ver Diluentes (Tela 116) e Manual Cadastro Formas Farmacêuticas (Tela 106 "Cálculo do excipiente").

---

## 9. Manual Cadastro Formas Farmacêuticas

- **Manual:** Manual Cadastro Formas Farmaceuticas (v. sistema 26.4, 7 págs.) - Parte farmacêutica
- **Objetivo:** Cadastrar a forma farmacêutica com tipos de informe, cálculo de excipiente, rótulo, vencimento, taxas e laboratórios de produção.
- **Tela(s) e caminho de menu:** "Tela 106 - Cadastro de Formas Farmacêuticas"; caminho: Cadastros > Atendimentos > Forma Farmacêutica > Ficha da Forma Farmacêutica. Citada: Tela 145.
- **Pré-requisitos:** Não informado explicitamente. Citados: lojas e estoque de laboratório cadastrados (aba "Laboratórios de produção"), processos de produção/rastreabilidade.
- **Fluxo:**
  1. Abrir o caminho -> Tela 106.
  2. Preencher obrigatórios: "Nome", "Nome do rótulo", "Laboratório" (sólido, semissólido ou líquido), "Tipo de uso" (interno ou externo).
  3. Selecionar "Tipo de utilização", "Tipo de informe", "Cálculo do excipiente" e demais campos de cálculo.
  4. Aba "Opções do rótulo": Quantidade de cópias, Descrição, Utilizar descrição no rótulo, Tipo de texto, Opções de vencimento, Mostrar excipiente no rótulo.
  5. Configurar outras opções (gotas, taxa técnica etc.), "Valor mínimo por quantidade", e abas/itens: Processos de produção/rastreabilidade, Laboratórios de produção, Posologia, Observação do rótulo, Controle de qualidade (ficha de pesagem), Controle de qualidade (ficha de produção).
  6. Aba "Laboratórios de produção": botão "+" ou clique direito em área em branco -> "Incluir"; preencher "Loja", "Localização do estoque", "Tipo de taxa técnica" (valor ou porcentagem) + valor, "Observação do rótulo".
  7. Clicar "incluir" e depois "gravar" para salvar.
- **Campos e regras de negócio:**
  - "Tipo de utilização": "Nenhum" (forma não mais utilizada), "Atendimento" (receitas), "Produção" (produções internas), "Ambos".
  - "Tipo de informe": "0. Nenhum" (cremes e géis; quantidade informada ao final do orçamento); "1. Quantidade total (múltiplo)" (cápsulas, envelopes, sachês, óvulos); "2. Quantidade total (final)" (ex.: creme 5 mg/1 mL; quantidade informada no início do atendimento); "3. Dose tomada" (ex.: "Passiflora 100 g - 100 doses"; ajusta cálculo ao tamanho da cápsula e permite selecionar o pote).
  - "Cálculo do excipiente": "0. Pela quantidade necessária do excipiente"; "1. Pela quantidade dos componentes na fórmula" (soma das doses).
  - "Vol. de excipiente": % mínimo de preenchimento antes de incluir excipiente; se ativos >= %, não adiciona excipiente; se < %, adiciona até completar 100% do volume.
  - "Qtde. p/ 1 gota" (cálculos da Tela 145); "Perda de processo" (% estimado); "Máximo desc."; "Vlr. mín. receita" (exemplo: orçamento R$ 20,00 e mínimo R$ 50,00 -> considera R$ 50,00); "Proibir desconto" (impede desconto quando usada na receita).
  - "Descrição": "#" representa a quantidade produzida (ex.: "# cápsulas"); só impressa se "Utilizar descrição no rótulo" marcado.
  - "Opções de vencimento": 0 - Usar validade da forma farmacêutica (não checar produtos); 1 - ... (checar produtos); 2 - Usar a menor validade dos lotes dos produtos; 3 - Usar a validade da ficha do produto; 4 - Utilizar vencimento da solução hidroalcoólica (homeopatia). Para as opções baseadas na forma farmacêutica, preencher "Validade em dias".
  - Outras opções: "Utilizar quantidade de gotas no rótulo"; "Mostrar nome da fórmula de manipulação na ficha de pesagem" (sem descrição no manual); "Não multiplicar embalagem pela quantidade múltipla" (produto calculado pelo total final e dispensado em uma embalagem, ex.: pó a granel em um pote); "Multiplicar no atendimento o valor da taxa técnica pela quantidade de repetição da fórmula" (2 potes de 30 cápsulas = 2 taxas técnicas).
  - "Valor mínimo por quantidade": preço mínimo por quantidade produzida (100 cápsulas = R$ 150,00; 50 = R$ 80,00; dermatológicas 100 mL = R$ 180,00; 20 mL = R$ 100,00).
  - "Posologia": posologias predefinidas, selecionáveis na Tela 145. "Laboratórios de produção": define estoque usado para baixa dos insumos. "Observação do rótulo": texto fixo impresso sempre que a forma é usada.
- **Ações de risco:** "Gravar" (persistência); alterar "Tipo de utilização" para "Nenhum" (retira a forma de uso); "Proibir desconto", "Vlr. mín. receita" e "Máximo desc." impactam preços/orçamentos na Tela 145. Sem "Excluir" citado.
- **Candidatos a cenário de teste:**
  1. Positivo: cadastrar forma com Nome, Nome do rótulo, Laboratório "sólido", Tipo de uso "interno", gravar e reabrir.
  2. Negativo: omitir cada obrigatório (Nome, Nome do rótulo, Laboratório, Tipo de uso) e assertar bloqueio.
  3. "Tipo de informe" 1 - Quantidade total (múltiplo): na Tela 145 verificar comportamento de cápsulas (cross-tela).
  4. "Vlr. mín. receita" R$ 50,00 com orçamento R$ 20,00 -> valor cobrado R$ 50,00 (cross-tela).
  5. "Proibir desconto" marcado: desconto bloqueado na receita.
  6. Aba "Laboratórios de produção": incluir Loja + Localização do estoque + Tipo de taxa técnica (valor/porcentagem) e assertar o item na lista.
- **Lacunas:** Valores possíveis de "Tipo de texto", "Laboratório"/"Tipo de uso" e unidade da "Qtde. p/ 1 gota" não informados. "Mostrar nome da fórmula de manipulação na ficha de pesagem" sem explicação. Nome exato das abas além de "Opções do rótulo" e "Laboratórios de produção" não informado. O fluxo final diz "incluir e depois gravar" (botão "incluir" no contexto de laboratório) - ambíguo. Mensagens e campo "Validade em dias" (rótulo/posição) dependem da tela.
- Sobreposição: "Cálculo do excipiente" e "Dose (mg)" estão detalhados em Excipiente (Tela 021); Vínculos com embalagem usam esta forma (Telas 126/161).

---

## 10. Vínculo matéria-prima com embalagem

- **Manual:** Vinculo materia prima embalagem OK (v. sistema 26.2, 8 págs., ago/2026) - Parte farmacêutica
- **Objetivo:** Vincular matéria-prima a uma embalagem específica (tipo de embalagem) e à forma farmacêutica, e validar na receita.
- **Tela(s) e caminho de menu:** "Tela 161 - Vínculo matéria-prima com tipo de embalagem"; caminho: Cadastros > Produtos > Embalagem (frasco, cápsula e outros) > Vínculo matéria-prima/tipo de embalagem. Também "Tela 078 - Cadastro de Tipos de Embalagem", "Tela 126 - Vínculo forma farmacêutica com embalagem" (caminho: Cadastros > Produtos > Embalagem (frasco, cápsula e outros) > Vínculo forma farmacêutica/embalagem) e "Tela 145 - Atendimento ao Cliente - Receita".
- **Pré-requisitos:** Matéria-prima (Tela 112/130), forma farmacêutica (Tela 106) e embalagens cadastradas; tipo de embalagem (criado na Tela 078 neste fluxo).
- **Fluxo:**
  1. Abrir o caminho -> Tela 161; selecionar o tipo de produto: "Alopatia" ou "Homeopatia".
  2. Clicar no ícone azul para cadastrar o tipo de embalagem -> abre Tela 078; informar o nome, "Gravar" e fechar.
  3. Voltar ao campo "Tipo de embalagem" e selecionar o tipo recém-cadastrado.
  4. Incluir a matéria-prima: clique direito na lista -> "Incluir" ou ícone verde "+".
  5. Na tela de inclusão: "Produto", "Tipo de vínculo", "Prioridade", "Tipo de envase". Clicar "Incluir/Alterar" e em seguida "Voltar".
  6. Matéria-prima aparece na lista. Em "Lista de formas farmacêuticas": clique direito -> "Incluir" ou "+" -> selecionar a forma -> "Incluir/Alterar" -> "Voltar".
  7. Clicar "Gravar".
  8. Consultas inferiores: "Lista de tipos de embalagens relacionadas ao produto" e "Lista de embalagens relacionadas ao tipo de embalagem".
  9. Acessar Tela 126: selecionar primeiro a forma farmacêutica, dar dois cliques na embalagem a usar com a matéria-prima; na tela de inclusão preencher "Tipo de embalagem" (cadastro da Tela 161), "Tipo" (igual ao configurado na Tela 161) e "Embalagem específica se tiver produto com o mesmo tipo de embalagem relacionado".
  10. Validar na Tela 145: incluir a matéria-prima na fórmula e verificar se a embalagem configurada é apresentada; se não, revisar Telas 161 e 126.
- **Campos e regras de negócio:**
  - "Tipo de vínculo": "Obrigatório" ou "Preferencial". Obrigatório tem prioridade sobre preferenciais; entre preferenciais vale o campo "Prioridade".
  - "Tipo de envase": "0 - Envase da dose/fórmula" (contato direto, ex.: cápsula ou bisnaga); "1 - 1º envase intermediário"; "2 - 2º envase intermediário"; "3 - 3º envase intermediário"; "4 - Produtos relacionados" (considera "Lista de produtos relacionados à embalagem").
  - "Importante": o Tipo de envase deve corresponder à configuração da Tela 126; "Se as informações forem diferentes, o sistema não apresentará o vínculo".
  - "Embalagem específica...": se não marcada, "o sistema não apresentará a embalagem específica".
- **Ações de risco:** "Gravar" (Telas 078, 161 e 126); "Incluir/Alterar" (pode sobrescrever vínculo); vínculo obrigatório muda o comportamento de todas as receitas com a matéria-prima. Sem "Excluir" citado.
- **Candidatos a cenário de teste:**
  1. Fluxo completo positivo: criar tipo de embalagem na Tela 078, vincular matéria-prima (Tipo de vínculo "Obrigatório", Tipo de envase "0 - Envase da dose/fórmula") e forma farmacêutica na Tela 161, vincular na Tela 126 e validar na Tela 145 que a embalagem aparece.
  2. Negativo: Tipo de envase divergente entre Tela 161 e Tela 126 -> embalagem não apresentada na Tela 145.
  3. Negativo: "Embalagem específica ..." desmarcada na Tela 126 -> embalagem específica não apresentada.
  4. Prioridade: dois vínculos "Preferencial" com Prioridade diferentes e um "Obrigatório"; assertar que o Obrigatório prevalece e a ordem dos preferenciais.
  5. Alternância "Alopatia"/"Homeopatia" na Tela 161 lista produtos do tipo correspondente.
- **Lacunas:** Sentido da Prioridade (menor = maior?) não informado; mensagens de validação ausentes; como a Tela 145 "apresenta" a embalagem (campo/lista) depende da tela; textos de botões "Voltar"/"Incluir/Alterar" precisam ser vistos. Numeração dos passos tem ambiguidade ("Embalagem específica..." no passo 15 vs fluxo da Tela 161).
- Sobreposição: Tela 126 também detalhada no manual "Vínculo de forma farmacêutica com embalagem"; no texto da Tela 126 aqui os rótulos de "Tipo" diferem (ver manual 11).

---

## 11. Vínculo de forma farmacêutica com embalagem

- **Manual:** Vínculo de forma farmacêutica com embalagem OK (v. sistema 26.2, 9 págs.) - Parte farmacêutica
- **Objetivo:** Vincular embalagens (cápsula, pote, itens adicionais) a uma forma farmacêutica para a Tela de receita escolher embalagem por volume.
- **Tela(s) e caminho de menu:** "Tela 126" ("Vínculo Forma Farmacêutica com Embalagem [126]"); caminho literal: "Cadastro > Produtos > Embalagens > Vínculo Forma Farmacêutica com Embalagem [126]". Citada: Tela 125 (Volumes) e "tela da receita".
- **Pré-requisitos:** Volumes cadastrados na Tela 125 (ver manual 6); embalagens e formas farmacêuticas cadastradas; vínculos de cápsulas/potes na Tela 125.
- **Fluxo:**
  1. Abrir Tela 126.
  2. Selecionar a forma farmacêutica.
  3. Clicar no botão "+" (verde) para incluir.
  4. Na tela de inclusão: "Embalagem" (nome ou pesquisa pelo final do código) e "Tipo de embal." (usado quando há vínculo específico com matéria-prima; aparece se existir esse cadastro); campo "Tipo"; "Embalagem específica"; clicar "Incluir".
  5. Após incluir, os potes relacionados às cápsulas já aparecem; clicar "Gravar".
  6. Incluir o pote: "Incluir" novamente; no "Tipo" usar "1º envase intermediário"; "Incluir"; depois "Gravar".
  7. Após gravar, o sistema mostra os volumes cadastrados na Tela 125.
  8. Itens adicionais (tampas, sílicas, rótulos): ainda na Tela 126, usar "Lista de produtos relacionados à embalagem" (selecionar o pote primeiro); "Incluir": "Produto", "Quantidade", "Número do item"; opções; "Incluir" e "Gravar".
  9. Teste final: testar na tela da receita e validar os vínculos.
- **Campos e regras de negócio:**
  - Campo "Tipo": "Envase primário" (contato direto, ex.: cápsula, bisnaga); "1º envase intermediário" (acondiciona o primário); "2º envase intermediário" (acondiciona o 1º); "e assim por diante".
  - "Embalagem específica": para vínculos com matéria-prima; marcar quando aplicável.
  - Volumes na Tela 126: ordenar "do menor para o maior" para o sistema puxar corretamente conforme o volume da tela de receita. "Volume zerado" = volume não cadastrado corretamente na Tela 125.
  - Itens adicionais: vínculo deve ser feito com o POTE, "Nunca com a cápsula; sempre selecionar o pote primeiro".
  - "Número do item": define a sequência (1, 2, 3, 4); sequência errada -> o sistema não puxa corretamente.
  - "Produto relacionado será multiplicado pela quantidade da embalagem principal": marcado = acompanha a quantidade de potes; desmarcado = sempre traz apenas 1.
  - "Forçar inclusão na ficha de pesagem": faz o item aparecer na ficha.
- **Ações de risco:** "Gravar"; "Incluir" (altera vínculos que impactam receitas); sequência/ordem de volumes incorreta afeta seleção de embalagem na receita. Sem "Excluir" citado.
- **Candidatos a cenário de teste:**
  1. Positivo: selecionar forma farmacêutica, incluir cápsula (Tipo "Envase primário") e pote ("1º envase intermediário"), gravar e assertar listagem de volumes.
  2. Borda: volumes ordenados do menor para o maior; assertar a ordem exibida e o volume escolhido na receita.
  3. Negativo: volume zerado aparece quando Tela 125 não tem volume cadastrado.
  4. Itens adicionais: incluir tampa com Quantidade e "Número do item" 1, marcar "Produto relacionado será multiplicado..." e verificar na receita que a quantidade acompanha os potes (marcado) vs 1 (desmarcado).
  5. "Forçar inclusão na ficha de pesagem": item aparece na ficha de pesagem.
- **Lacunas:** Rótulos exatos de alguns controles são parafraseados (o manual descreve opções com marcado/desmarcado sem nome literal do checkbox além do texto citado). Obrigatoriedade/mensagens não informadas. Caminho de menu usa "Cadastro > Produtos > Embalagens" (diferente do manual 10, ver observações transversais).
- Sobreposição: Tela 126 complementada pelo manual "Vínculo matéria-prima com embalagem" (passos 13 a 15) e pelo manual "Cadastro de volume de embalagem" (Tela 125).

---

## 12. Manual_Mapa_Veterinario

- **Manual:** Manual_Mapa_Veterinario OK (v. sistema 26.4, 5 págs.) - Parte farmacêutica
- **Objetivo:** Gerar a planilha Excel do Mapa Veterinário (Relatório 1305) a partir do Livro de Controlados.
- **Tela(s) e caminho de menu:** "Tela 109 - Livro de Controlados"; caminho: Movimentos > Produtos > SNGPC > Livro de Controlados. Permissão: Usuários > Permissões (pesquisar código 11305). Também "Tela 036 - Cadastro de Prescritores" (campo "Nº Cadastro MAPA").
- **Pré-requisitos:** Permissão do relatório liberada ("Relatório 1305", pesquisar "11305" em Usuários > Permissões); prescritores com "Nº Cadastro MAPA" preenchido; movimentações das substâncias das listas registradas no sistema.
- **Fluxo:**
  1. Usuários > Permissões -> pesquisar o código 11305 e liberar a permissão.
  2. Menu Movimentos > Produtos > SNGPC > Livro de Controlados -> Tela 109.
  3. Clicar em "Relatórios"; preencher intervalo de datas e "Relatório": "1305 - Relatório Excel Mapa Veterinário". Se o relatório não aparecer, verificar a permissão.
  4. Informar o intervalo e clicar na opção "Excel" para gerar o arquivo.
  5. Após a geração, dar dois cliques no registro para abrir a pasta onde o documento foi salvo.
  6. Arquivo gerado com três abas: "Estoque inicial", "Entradas" e "Saídas".
  7. Enviar informações ao MAPA pelo portal do Governo Federal (link do manual do MAPA indicado).
- **Campos e regras de negócio:**
  - Aba "Estoque inicial": Substância; Quantidade.
  - Aba "Entradas": Substância; Tipo de entrada; Quantidade; Identificação - CNPJ do comprador; Nome; Número da nota fiscal; Data da nota fiscal.
  - Aba "Saídas": Substância; Tipo de saída; Quantidade; Identificação - CPF do comprador; Nome; Prescritor; Número de cadastro do prescritor no MAPA; Número da ordem de manipulação; Número da nota fiscal; Data da nota fiscal.
  - Cadastro do prescritor no MAPA: campo "Nº Cadastro MAPA" na Tela 036, conforme receita do prescritor; "esse cadastro é atualizado apenas uma vez" -> verificar se já foi registrado antes de alterar.
  - Listas sujeitas à escrituração e ao relatório semestral (enviado ao MAPA a cada seis meses): A1 - Entorpecentes; A2 - Entorpecentes; A3 - Psicotrópicos; B1 - Psicotrópicos; C2 - Substâncias retinoicas; C5 - Anabolizantes.
- **Ações de risco:** Alterar "Nº Cadastro MAPA" já registrado (o manual alerta para conferir antes); gerar/exportar relatório é leitura. Sem ações destrutivas.
- **Candidatos a cenário de teste:**
  1. Positivo: com permissão 11305, abrir Livro de Controlados > Relatórios, selecionar "1305 - Relatório Excel Mapa Veterinário", informar intervalo e clicar "Excel"; assertar geração do arquivo.
  2. Negativo: sem a permissão, o relatório 1305 não aparece na lista de relatórios.
  3. Conteúdo: arquivo gerado contém as 3 abas "Estoque inicial", "Entradas", "Saídas" com os cabeçalhos listados.
  4. Prescritor com "Nº Cadastro MAPA" preenchido na Tela 036 aparece na aba "Saídas".
  5. Borda: intervalo de datas sem movimentação (resultado/abas vazias; comportamento não descrito).
- **Lacunas:** Tipos de entrada/saída (valores) não detalhados; formato/nome do arquivo e pasta de destino não informados; comportamento com intervalo vazio ou sem permissão além de "o relatório não será apresentado"; o resumo semestral é obrigação externa, sem tela descrita. Rótulos das listas A1 a C5 terminam em ":" sem texto (provável perda na extração). Validação de conteúdo da planilha depende de abrir o arquivo Excel.
- Inconsistência: o texto cita "Relatório 1305" e permissão com código "11305" (provavelmente prefixo 1 + 1305; o manual não explica).

---

## Observações transversais (para referência rápida)

- Padrão de inclusão: nas telas com lista (125, 126, 161, 021, 116) o manual usa "clique com o botão direito -> Incluir" OU botão/ícone verde "+". Confirmadores variam: "Gravar" (Tela 112/123/130/117/116/106), "Incluir/Alterar" (Telas 021 e 161, depois "Voltar"), "Incluir" na Tela 126 e "Limpar" na Tela 021.
- Ícones recorrentes: "lupa" (consulta de opções cadastradas) e "livro azul" (cadastrar nova classificação) nos campos Classificação/Tipo de estoque; "ícone azul" para cadastrar tipo de embalagem na Tela 161.
- Telas citadas: 021 Excipientes; 036 Prescritores; 078 Tipos de Embalagem; 106 Formas Farmacêuticas; 109 Livro de Controlados; 112 Alopatia; 116 Diluentes/Conservantes/Essências; 117 Revenda; 123 Embalagens; 125 Volumes; 126 Vínculo forma farmacêutica/embalagem; 130 Homeopatia; 135 cotação; 145 Atendimento ao Cliente - Receita; 161 Vínculo matéria-prima/tipo de embalagem; 216 Lote; 470 Laudo Interno.
