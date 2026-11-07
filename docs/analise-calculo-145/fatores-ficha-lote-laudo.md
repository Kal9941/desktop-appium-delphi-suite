# Análise de fatores, lote, validade e preço: cadeia MOV_ATENDIMENTO_CALC1_I (Firebird 2.5, PS01)

## 0. Convenções

- As referências `ARQ:linha` apontam para os arquivos convertidos que gerei em
  `...\scratchpad\calc\procs\<NOME>.u.sql` (`tr '\r' '\n'` + `iconv latin1→utf8`).
  Atenção: nos fontes que tinham CRLF (CALC3, UTIL_CALC_PRODUTOS, CALC_ENZ, CALC_LTE, CALC1), a conversão
  intercala linhas em branco. Por isso a numeração **não** coincide com os `.n.sql` do outro analista.
- Abreviações: `C1I` = MOV_ATENDIMENTO_CALC1_I, `C7` = MOV_ATENDIMENTO_CALC7, `C3` = MOV_ATENDIMENTO_CALC3,
  `UCP` = UTIL_CALC_PRODUTOS, `C71` = MOV_ATENDIMENTO_CALC7_1, `ENZ` = MOV_ATENDIMENTO_CALC_ENZ,
  `LTE` = MOV_ATENDIMENTO_CALC_LTE, `C1` = MOV_ATENDIMENTO_CALC1 (consultado só em pontos de contato).
- **[LITERAL]**: está escrito no código. **[INFERÊNCIA]**: dedução minha (nomes, comportamento do Firebird,
  semântica). Os cabeçalhos das procedures (parâmetros e tipos) **não** foram extraídos: os arquivos começam
  no `DECLARE VARIABLE`/`BEGIN`. Por isso a ordem dos parâmetros vem das chamadas posicionais.
- **Não estão na pasta**: `UTIL_ESTOQUEH_LOTE` e `MOV_ESTOQUE_FATOR`. Não foi possível analisá-los.

### Assinaturas deduzidas das chamadas [INFERÊNCIA a partir de chamadas LITERAIS]
- `C1I(CODIGO_ATENDIMENTO_A1_IP, INCLUSAOAUTOMATICA_IP, CODIGO_FUNC_IP, NOVOCALCULO_IP, NUMEROFORMULA_IP, QVD_IP, PRODUTOS_IP, CODIGO_ESTOQUE_BAIXA_IP, CODIGO_FF_IP)`
  retorna `(OBSERVACAOSISTEMA_OP, ASSP_PROD_OP, PESOFORMULA_FM_OP, INDICEFORMULA_FM_OP, PRODUTO_DINAMIZADO_OP)` (C1:273-275).
- `C7(CODIGO_IP, CODIGO_ESTOQUE_BAIXA_IP, INCLUSAO_FORMULA_IP, DINAMIZACAO_IP, TIPOESCALA_IP, CODIGO_FF_IP)`, chamada em C1I:325
  com `(produto, estoque_baixa, IIF(INCLUSAOAUTOMATICA=10, 99, 0), QUANTIDADE, UNIDADE, CODIGO_FF)`.
  Isso significa que, para homeopatia, a **quantidade digitada é a dinamização** e a **unidade é a escala** (CH, D...). [INFERÊNCIA pelos nomes usados em C7:138,142]
- `C71(LOJA_IP, CODIGO_ESTOQUE_BAIXA_IP, MOVIMENTOESTOQUE_IP, USOVALIDADE_IP, VALIDADE_IP, CODIGOPRINCIPAL_IP, QUANTIDADE_CALCULO_IP)` (C1:1603).
- `ENZ(QUANTIDADE_IP, UNIDADE_IP, ENZIMA_IP, ATIVIDADE_ENZIMATICA_QTDE, ATIVIDADE_ENZIMATICA_UNID)` (C1:359).

---

## 1. PRODUTOS_IP: formato e conversão em linhas de ATENDIMENTO_CALC1

### Formato [LITERAL, UCP:11-43]
É uma string de **largura fixa: 41 caracteres por item**, concatenada sem separador.

| Posição (1-based) | Tamanho | Campo | Tratamento |
|---|---|---|---|
| 1-10 | 10 | CODIGOPRODUTO | `SUBSTRING(... FOR 10)`, sem TRIM, com cast implícito para o tipo do parâmetro de saída (UCP:23) |
| 11-20 | 10 | QUANTIDADE | sem TRIM, com cast implícito (UCP:25) |
| 21-30 | 10 | UNIDADE | `TRIM` (UCP:27) |
| 31-40 | 10 | QTDE_DEFINIDA_H | `TRIM` (UCP:29) |
| 41 | 1 | UNIDADE_DEFINIDA_H | `TRIM` (UCP:31) |

- Número de itens = `CHAR_LENGTH(PRODUTOS_IP)/41`, em divisão inteira. Um resto parcial é ignorado em silêncio (UCP:11).
- `INCLUSAOSISTEMA` é sempre 0 (UCP:33). `NUMEROLINHA` é sequencial a partir de 1 (UCP:17,43).
- [INFERÊNCIA] O separador decimal da quantidade precisa ser `.` (conversão string→NUMERIC do Firebird), e cabe só em 10 caracteres.
  Para os testes, a forma mais segura de obter a string real é ler `ATENDIMENTO_CALC1.PARAMETROS` da linha
  `NIVELCALCULO=0, NUMEROLINHA=1`: o C1 grava ali todos os parâmetros de entrada, incluindo `PRODUTOS_IP` (até 5000
  caracteres), separados por `;` (C1:279-287).

### Gravação em ATENDIMENTO_CALC1 (C1I:271-443) [LITERAL]
Para cada item retornado por UCP:
1. Na linha 1, o C1I apaga as linhas de `ATENDIMENTO_CALC1` do funcionário e do `NUMEROFORMULA_IP` (C1I:288).
2. Busca `UNIDADES.VALORUNIDADE, VALORINDICE, CALCULO` com `FIRST 1`, sem ORDER BY, onde `UNIDADE = :unidade AND CNPJ_FORNECEDOR_XML IS NULL AND CALCULO <> 20` (C1I:291-299).
3. Chama C7 para obter os fatores, o lote, os preços e a validade (C1I:303-347).
4. Insere uma linha em ATENDIMENTO_CALC1 (C1I:364-442) com:
   - `QUANTIDADE` = valor **cru** digitado (nenhum fator é aplicado aqui; o C1 calcula `QUANTIDADEG` depois);
   - `FATORCORRECAO` = `FATORCORRECAO_OP` do C7, que é o **fator total** (equivalência × correção × umidade);
   - `DENSIDADE, LOTE, VALORCUSTO, VALORVENDA, VALIDADE, UFC, UTR, UI, ATIVIDADE_ENZIMATICA_QTDE/UNID, TEXTO_VALIDADE, TEXTO_FATOR` vindos do C7;
   - `NIVELCALCULO = -1` se a unidade for `'qsp(ex)'`, senão 0 (C1I:405);
   - `VISUALIZARPRODUTO = -1` e `FORMAFARMACEUTICA = CODIGO_FF_IP`;
   - `PARAMETROS = ''`: `VAR_ALCOOL_DINAMIZACAO` é inicializada com 0 (C1I:36) e nunca muda, logo `'ALCOOLDIN'` nunca é gravado. O valor é sobrescrito depois por C1:283-287.
   - `VALORCOMPRA` **não** é gravado: o C1I não lê `VALORCOMPRA_OP` do C7.
5. Contador `ASSP_PROD_OP += 1` para cada `MOVIMENTOESTOQUE = 1` (C1I:361-362).
6. Fórmula dinamizada (`PRODUTO_DINAMIZADO_OP > 0`): `CODIGO_F` vira NULL e `PESOFORMULA_F` vira 0 (C1I:307,311).

### Ramo "novo cálculo de receita já gravada" (C1I:152-266) [LITERAL]
Quando `NOVOCALCULO_IP = -1`, há `CODIGO_ATENDIMENTO_A1_IP` e não é fórmula de manipulação, o C1I insere também os itens das
**outras** fórmulas concluídas (`ATENDIMENTO_A2.CONCLUIDOFORMULA=-1`). Entram só os itens com `A3.INCLUSAOSISTEMA=0` e
`EXCLUIRPRODUTO_CF IS NULL`, exceto embalagens (`MOVIMENTOESTOQUE<>4`). Essas linhas **não** recebem fatores, lote nem preço: servem
para a verificação de incompatibilidade. O MOVIMENTOESTOQUE e os dados de fórmula vêm de C3 (C3:5-71).

### Limpeza inicial (C1I:46-62) [LITERAL]
O C1I apaga ATENDIMENTO_CALC1 e ATENDIMENTO_CALC3 do funcionário em qualquer um destes casos:
- `NOVOCALCULO_IP=-1`;
- fórmula de manipulação (`INCLUSAOAUTOMATICA_IP=10`);
- existem linhas de outro atendimento para o mesmo funcionário.

### Fórmula de manipulação (`INCLUSAOAUTOMATICA_IP = 10`) (C1I:81-112, 351-352, 461-489) [LITERAL]
- `CODIGO_ATENDIMENTO_A1_IP` carrega o código de `ESTOQUEF`. Disso saem:
  - `PESOFORMULA_FM_OP` = `F.PESOFORMULA` (TIPOCADASTRO=1) ou 1 (TIPOCADASTRO=2), zerado quando `F.DINAMIZAR=-1`;
  - o mínimo `F.MANIPULACAO_MIN`.
- `INDICEFORMULA_FM_OP = QVD_IP / PESOFORMULA_FM_OP`, quando a fórmula não é dinamizada, `CALCULO` não é 9 nem 99 e o peso é maior que 0 (C1I:351-352). Esse índice é a proporção aplicada depois no C1.
- A partir daí `NUMEROFORMULA_IP = 1` (C1I:111) e o C7 é chamado com `INCLUSAO_FORMULA_IP=99`, o que força a validade pelo menor lote (ver §3).
- Ajuste de envase (C1I:461-489): para cada produto com `ESTOQUEF_DETALHE.CODIGO_PRODUTO_EMB > 0`, a quantidade da embalagem
  começa em 1 e é incrementada `WHILE (qtd > 10000) OR (qtde_envase > qtd * QTDE_PRODUTO_EMB)`.
  - [INFERÊNCIA/possível bug] Se a quantidade necessária passar de 10000, a condição `qtd > 10000` fica sempre verdadeira e o laço não termina.
  - O teste `VAR_CALCULO` em C1I:461 usa o `CALCULO` da **última** linha lida.

---

## 2. Fatores: origem, precedência e flags

### 2.1 Origem na ficha (ESTOQUE_GERAL) [LITERAL, C7:90-135]

| Fator | Expressão na ficha | Condição para não ser 1 |
|---|---|---|
| Fator de equivalência | `EG.FATOREQUIV` | `EG.MOVIMENTOESTOQUE = 1 AND EG.FATOREQUIV_UC = -1`, senão 1 (C7:95-98) |
| Umidade (fator) | `COALESCE(CAST(100/(100 - IIF(EG.UMIDADE=100,0,EG.UMIDADE)) AS NUMERIC(18,4)),1)` | `EG.MOVIMENTOESTOQUE < 2 AND EG.UMIDADE_UC = -1`, senão 1 (C7:100-103) |
| Fator de correção | `CAST(100 / EG.CONCENTRACAO AS NUMERIC(18,4))` | `EG.MOVIMENTOESTOQUE = 1`, senão 1 (C7:104). Sem COALESCE e sem proteção contra 0 |
| Densidade | `EG.DENSIDADE` | sempre lida (C7:105) |
| UFC / UTR / UI | `EG.UFC`, `EG.UTR`, `EG.UI` | (C7:110-112) |
| Atividade enzimática | `EG.ATIVIDADE_ENZIMATICA_QTDE/_UNID` | (C7:113-114) |
| Fonte dos fatores | `COALESCE(EG.FATORCALCULO,1)` | (C7:94) |
| MEQ | **não aparece** em C1I/C7/C3/UCP/C71/ENZ. É lido direto da ficha no C1: `QUANTIDADE / E.MEQ` quando a unidade é `'meq'` e `E.MEQ > 0` (C1:353) | |

**`ESTOQUE_GERAL.FATORCALCULO`** controla a fonte dos fatores (comentário em C7:39-43):
- 1: ficha;
- 2: lote (cai para a ficha se não houver);
- 3: laudo interno (cai para a ficha);
- 4: laudo, depois lote, depois ficha.

### 2.2 Origem no lote (ESTOQUE_LOTE) [LITERAL, C7:165-184 e os outros 3 SELECTs idênticos]
Valores calculados em todo SELECT de lote:
- umidade do lote = `COALESCE(CAST(100/(100-IIF(EL.UMIDADE=100,0,EL.UMIDADE)) AS NUMERIC(18,4)),1)` **se** `FATORCALCULO IN (2,4)`, senão a umidade da ficha;
- correção do lote = `CAST(100/EL.CONCENTRACAO AS NUMERIC(18,4))` **se** `FATORCALCULO IN (2,4)`, senão a correção da ficha. Sem COALESCE: se `EL.CONCENTRACAO` for NULL, o resultado é NULL;
- densidade do lote = `EL.DENSIDADE` **se** `FATORCALCULO IN (2,4)`, senão a densidade da ficha. Sem COALESCE;
- UFC/UTR/UI/atividade enzimática = colunas de `ESTOQUE_LOTE`, sempre lidas;
- validade do lote = `EL.VENCIMENTO_DT - CURRENT_DATE`, em dias (C7:179).

Os fatores ficam na tabela de lote `ESTOQUE_LOTE` (EL). `ESTOQUE_LOTE_LA` (LA) só fornece status, estoque, data de cadastro e saldo.

### 2.3 Origem no laudo interno (ESTOQUE_LAUDOINTERNO) [LITERAL, C7:404-428]
O laudo só é consultado se `MOVIMENTOESTOQUE=1`, se um lote foi encontrado (`V_CODIGO_ESTOQUE_LOTE IS NOT NULL`) e se `FATORCALCULO IN (3,4)`.
Usa a **média** dos laudos com `RESULTADO=-1` e `CANCELAMENTO_CF IS NULL` desse lote:
- densidade = `AVG(COALESCE(LI.DENSIDADE,1))`;
- correção = `100/AVG(COALESCE(LI.CONCENTRACAO,1))`;
- umidade = `100/(100-AVG(COALESCE(umidade,0)))`;
- UFC/UTR/UI = `AVG(...)`.

O agrupamento inclui `ATIVIDADE_ENZIMATICA_QTDE/UNID`, e a ordenação `ORDER BY MAX(CADASTRO_DT)` é ascendente. Com mais de um grupo, o `FIRST 1` pega o mais **antigo**.
- [INFERÊNCIA/armadilha] Laudo aprovado com `CONCENTRACAO` NULL gera **fator de correção 100** (100/1).

### 2.4 Precedência final [LITERAL, C7:470-493]
```
UMIDADE (C7:471-476):  FC=2 e umid_lote>0 → lote | FC∈{3,4} e umid_laudo>0 → laudo | FC=4 e laudo nulo/0 e lote>0 → lote | senão ficha
Depois (C7:478-493):
  FC=1                                   → TEXTO 'FATORES DA FICHA'
  FC∈{3,4} e correção_laudo NOT NULL     → 'FATORES DO LAUDO'; correção, umidade e densidade = laudo
  senão FC∈{2,4} e correção_lote NOT NULL → 'FATORES DO LOTE';  correção, umidade e densidade = lote
  (se não cair em nenhum: correção da ficha, umidade conforme C7:471, TEXTO sem cabeçalho)
UFC/UTR/UI (C7:435-454): mesma precedência, exigindo valor > 0 e caindo para a ficha.
ATIVIDADE ENZIMÁTICA (C7:456-468): mesma precedência, exigindo QTDE>0 e UNID<>''.
```
- O **fator de equivalência vem sempre da ficha**: lote e laudo não o alteram.
- [LITERAL/bug] Em C7:459 a condição é `(QTDE_LAUDO = 0 OR UNID_LAUDO <> '')`. Em C7:466 ela é `= ''`.
  Com `FATORCALCULO=4` e um laudo que tem quantidade mas sem unidade, a quantidade vem da ficha e a unidade vem do lote.
- [LITERAL] Com `FATORCALCULO=2` e lote de `CONCENTRACAO` NULL, o resultado mistura fontes: correção da **ficha** com umidade do **lote**
  (C7:472 já trocou a umidade). O texto fica sem cabeçalho.

### 2.5 Densidade: flag de configuração [LITERAL, C7:496]
`IF (ATENDIMENTO_CONF.CALCULODENSIDADE_A = 0) THEN DENSIDADE_OP = 1`.
Com NULL, a densidade **não** é zerada. A aplicação da densidade (ml→g e preço × densidade) acontece no C1 (C1:1619 em diante e
1631-1633), fora desta fatia. O C1 também lê `FORMAFARMACEUTICA.NAO_UTILIZAR_DENSIDADE` (C1:241).

### 2.6 Fórmula do fator total [LITERAL, C7:563]
```
FATORCORRECAO_OP = CAST( FATOREQUIV × FATORCORRECAO × IIF(EG.UMIDADE_UC = -1, UMIDADE, 1) AS NUMERIC(18,4) )
```
Esse valor vai para `ATENDIMENTO_CALC1.FATORCORRECAO` (C1I:428). O C1 aplica assim:
`QUANTIDADEG = CAST(DOUBLE(QUANTIDADEG) × DOUBLE(FATORCORRECAO) AS NUMERIC(18,6))`, somente quando
`MOVIMENTOESTOQUE=1 AND UNIDADES.CALCULO IN (1,2,3,4,5,6,7,9)` (C1:553-559). Para CALCULO 4/5/6 fora de ufc/blh/mlh e com `UNIDADE_UMU=0`, o C1 divide ainda por 1000 (C1:561).

UFC/UTR/UI **não** entram no fator. No C1 eles **dividem** a quantidade digitada (C1:339, 349, 351), e o MEQ também divide (C1:353).

### 2.7 O caso real: por que 1,1695 se o texto diz "UMIDADE … NÃO UTILIZADA"
Rastro: `FATORES DO LOTE / FATOR EQUIV. = 1.0000 / FATOR CORREÇÃO = 1.1111 / UMIDADE = 1.0526 NÃO UTILIZADA P/ CÁLCULO / DENSIDADE = 1.0000`.

- O texto (C7:502) é `'UMIDADE = ' || V_UMIDADE || IIF(V_UMIDADE_UC = -1, ' NÃO UTILIZADA P/ CÁLCULO', '')`.
  O sufixo aparece **quando `ESTOQUE_GERAL.UMIDADE_UC = -1`** [LITERAL].
- O cálculo (C7:563) multiplica a umidade **quando `UMIDADE_UC = -1`** [LITERAL].
- Conclusão: **a condição do texto está invertida em relação ao cálculo**. Com `UMIDADE_UC=-1`, a umidade **é usada** e o
  texto diz o contrário. Com `UMIDADE_UC<>-1`, ela não é usada e o texto não traz o aviso.
  A evidência de que -1 significa "usar" [INFERÊNCIA forte]:
  - C7:101 só calcula a umidade da ficha quando `UMIDADE_UC=-1`;
  - `FATOREQUIV_UC=-1` liga a equivalência (C7:96), o mesmo padrão `_UC`;
  - o outro motor faz igual (`LTE:893` multiplica quando -1; `LTE:847` acrescenta `' NU'` quando -1).

  Para decidir de que lado está o bug (texto ou cálculo), é preciso ver a legenda do checkbox de `UMIDADE_UC` na ficha do produto, no Delphi. Isso o SQL não mostra.
- Os números: lote com `CONCENTRACAO = 90` dá 100/90 = 1,1111; lote com `UMIDADE = 5` dá 100/95 = 1,0526.
  `1,0000 × 1,1111 × 1,0526 = 1,16954386`, que o CAST(18,4) leva a **1,1695**.
  Depois, C1:559 faz `7,5 × 1,1695 = 8,77125`. Bate exatamente com o observado.
  Para chegar a "FATORES DO LOTE", `ESTOQUE_GERAL.FATORCALCULO` era 2, ou 4 sem laudo [INFERÊNCIA].
- Nota de precisão [INFERÊNCIA, comportamento do Firebird e não do fonte]:
  - Divisão de numéricos exatos **trunca** na escala resultante (soma das escalas). `100/EL.CONCENTRACAO` tem a escala da coluna, e a precisão de 4 casas observada sugere colunas com escala ≥ 4.
  - `CAST` e atribuição a NUMERIC de escala menor **arredondam**.
  - Para o oráculo do teste: fator parcial = `trunc4(100/c)`, fator total = `round4(produto)`. Exemplo: concentração 15 dá 6,6666 (truncado), e não 6,6667.

### 2.8 Atividade enzimática (ENZ) [LITERAL]
O C1 chama ENZ quando `UNIDADES.TIPOUNIDADE = 12` e `C1.ATIVIDADE_ENZIMATICA_QTDE > 0`, com `ENZIMA = ESTOQUE_GERAL.ENZIMA` (C1:359).
A fórmula final é `QUANTIDADE_OP = QUANTIDADE_IP / ATIVIDADE_CONVERTIDA` (ENZ:197). Antes, a atividade do lote, do laudo ou da ficha é convertida para a unidade prescrita:

| ENZIMA | Enzima | Unidades aceitas | Conversões (atividade cadastrada → unidade prescrita) | Linhas |
|---|---|---|---|---|
| 0 | n/a | exige `UNIDADE = ATIV_UNID`, senão retorna 0 | nenhuma | ENZ:29-39 |
| 1 | Alfa-amilase | SKB, FAU, DU | SKB/DU→FAU: ÷15,4; FAU→SKB/DU: ×15,4 | ENZ:45-69 |
| 2 | Bromelina | GDU, U.FIP, PU | GDU→U.FIP ×2,1666…; GDU→PU ×15000; U.FIP→GDU ÷2,1666…; U.FIP→PU ÷2,1666…×15000; PU→GDU ÷15000; PU→U.FIP ÷15000×2,1666… | ENZ:75-115 |
| 3 | Protease ácida | HUT, SAP | HUT→SAP ÷100; SAP→HUT ×100 | ENZ:121-145 |
| 4 | Papaína | PU, U.USP, senão retorna 0 | nenhuma | ENZ:151-161 |
| 5 | Pepsina | código morto (ver abaixo) | (FCC↔U.USP ÷/×6000, nunca executa) | ENZ:167-191 |

- Se `QUANTIDADE_IP` ou a atividade forem 0 ou NULL, a quantidade é devolvida sem alteração (ENZ:13-21).
- [INFERÊNCIA, regra do "dangling else" do PSQL] O `ELSE IF (ENZIMA=5)` de ENZ:167 se liga ao `IF` interno de ENZ:153, que não tem ELSE.
  Resultado: o ramo da pepsina nunca roda. ENZIMA=5, ou qualquer valor ≥ 6 ou NULL, cai direto na divisão, sem validar nem converter unidade.
  Mesmo que rodasse, o ramo testa `HUT/SAP` mas converte `FCC/U.USP` [LITERAL, bug].

---

## 3. Escolha do lote e validade

### 3.1 Lote no C7 (o que alimenta fatores, lote exibido e validade por item) [LITERAL]
1. **Homeopatia**: com `MOVIMENTOESTOQUE=2` e unidade/escala em `('C','CH','FC','SD','PC','M','MM','K','D','DH','X','TM')`, o lote vem de
   `UTIL_ESTOQUEH_LOTE(estoque, produto, dinamização, escala, ATENDIMENTO_CONF.FECHARLOTE_H, 1, FORMAFARMACEUTICA.UTILIZAR_LOTE_POT_ANT)`
   (C7:138-145). Essa procedure não está na pasta. [INFERÊNCIA] `UTILIZAR_LOTE_POT_ANT` = usar o lote da potência anterior, e `FECHARLOTE_H` = exigir saldo (é o que o LTE faz em LTE:179).
2. **Demais casos**: só procura lote se **existir qualquer** `ESTOQUE_LOTE` do produto não vencido, sem filtro de loja, estoque ou status (C7:150-158).
   Para embalagem (`MOVIMENTOESTOQUE=4`) com `ATENDIMENTO_CONF.VALIDAR_ESTOQUE_EMBALAGEM_A=-1`, lote vencido também vale.
3. A busca segue até 3 etapas, cada uma `SELECT FIRST 1`. Filtros comuns:
   - `LA.CANCELAMENTO_LJ IS NULL`;
   - não vencido (mesma exceção para embalagem);
   - `LA.STATUSLOTE = 1`, ou `STATUSLOTE = 2` quando `ATENDIMENTO_CONF.CALCULAR_ESTOQUE_QUARENTENA_A = -1`.
     [INFERÊNCIA] 1 = liberado, 2 = quarentena.

| Etapa | Estoques | Ordenação | Linhas |
|---|---|---|---|
| a | `LA.CODIGO_ESTOQUE = estoque de baixa` e `EST.PRODUCAO=-1` | `SELECAO_LOTE_CALCULO_A ∈ {0,10}` (ou NULL): `LA.CADASTRO_DT DESC` (lote **cadastrado mais recentemente**, não FIFO). Outros valores (1, 11...): `EL.VENCIMENTO_DT ASC` (FEFO) | C7:162-251 |
| b | outros estoques da **mesma loja** com `PRODUCAO=-1` | igual à etapa a | C7:256-351 |
| c | almoxarifado: mesma loja, `PRODUCAO=0`; só se `MOVIMENTOESTOQUE ∈ {1,4}` e `SELECAO ∈ {0,1}` | `VENCIMENTO_DT ASC` | C7:354-398 |

- Significado dos valores de `SELECAO_LOTE_CALCULO` (comentário em LTE:61-69): 0 = data de entrada no laboratório; 1 = vencimento;
  10 = entrada, só produção; 11 = vencimento, só produção. Em C7, 10 e 11 pulam a etapa c, o que é coerente com "só produção".
- **Saldo não é verificado no C7** [LITERAL: nenhuma condição sobre `LA.SALDO`]. Um lote com saldo 0 pode fornecer os fatores.
- Em empate de data, o `FIRST 1` sem segunda chave de ordenação é **não determinístico** [INFERÊNCIA]. Nos testes, evite lotes com a mesma data.
- A loja é `ESTOQUE.CODIGO_EMPRESA` do estoque de baixa (C7:67-70). A configuração vem de `ATENDIMENTO_CONF` dessa loja (C7:72-85).

### 3.2 Relote no C1 via C71 [LITERAL]
O C1 verifica o saldo somado dos lotes da loja. Se for menor que `QUANTIDADE_CALCULO`, gera o aviso de estoque insuficiente e zera o lote (C1:1563-1591).
Com lote vazio, chama C71 (C1:1599-1605), que difere do C7:
- exige `LA.SALDO >= QUANTIDADE_CALCULO_IP` (C71:22,43,67,88);
- aceita **só** `STATUSLOTE=1`: a quarentena é ignorada mesmo com a flag ligada (C71:18);
- ordena por `CADASTRO_DT DESC` só quando `COALESCE(SELECAO,0)=0`. Para 10, 1 e 11 ordena por vencimento (C71:7-9,57-69). O valor 10 se comporta diferente do C7;
- a 2ª etapa vai direto ao almoxarifado (`PRODUCAO=0`) da loja, para qualquer modo (C71:30-50, 75-95);
- a validade que o C71 calcula (C71:13) é **descartada**: o C1 lê só `LOTE_OP` (C1:1601). O C71 só muda o **lote exibido**, não os números.

### 3.3 Validade por item (C7:524-560) [LITERAL]
Fontes: `FF.VALIDADE` (FORMAFARMACEUTICA), `V_VALIDADE_LOTE` = dias até `EL.VENCIMENTO_DT` (0 se não houver lote), e `V_VALIDADE_EST` = `ESTOQUE_GERAL.VALIDADE_ATENDIMENTO`.
Todas são comparadas diretamente entre si, então estão em **dias** [INFERÊNCIA].

| `FORMAFARMACEUTICA.USOVALIDADE` | VALIDADE_OP do item | TEXTO_VALIDADE |
|---|---|---|
| 0 ou 1 | `FF.VALIDADE`. Se lote > 0 e menor, ou se o valor for 0, vira o lote. Em seguida, se a ficha > 0 e for menor, ou se o valor ainda for 0, vira a ficha | 'VALIDADE DA FORMA FARMACÊUTICA' / 'VALIDADE DO LOTE x' / 'VALIDADE DA FICHA x' (concatena o lote por engano) |
| 2 | dias do lote (0 sem lote) | 'VALIDADE DO LOTE x' |
| 3 | `VALIDADE_ATENDIMENTO` da ficha | 'VALIDADE DA FICHA' |
| 4 | ficha, se > 0; senão lote | idem |

- Fórmula de manipulação (`INCLUSAO_FORMULA_IP=99`): força `USOVALIDADE=2` e `UTILIZAR_LOTE_POT_ANT=0` (C7:59-64).
- Lote que vence hoje tem validade 0 e é tratado como "sem validade" em 0/1.
- Embalagem vencida (com a flag de embalagem) gera validade **negativa** em USOVALIDADE=2 [INFERÊNCIA]. Isso dispara 'Lote vencido!' no C1 (C1:1551-1553).
- A **validade da fórmula** (o mínimo entre itens, `VALIDADE_ATENDIMENTO_MAX` e regras de ml/g da homeopatia) é composta no C1 (C1:1473-1475, 1547, 1617, 1665-1701), fora desta fatia.
- O oráculo depende de `CURRENT_DATE`: calcule a validade esperada na data da execução do teste.

---

## 4. Preço (C7:106-108, 565-572) [LITERAL]
- `VALORCOMPRA`, `VALORCUSTO` e `VALORVENDA` vêm **sempre da ficha** (`ESTOQUE_GERAL`, com COALESCE 0). Lote e laudo não têm preço aqui.
  Os valores estão na unidade de estoque da ficha. O C7 não converte unidade; o C1 lê `E.UNIDADE` (C1:373) [INFERÊNCIA: a conversão fica no C1].
- Quando `ATENDIMENTO_CONF.NAO_UTILIZAR_FATOR_CALC_PRECO_A` é NULL ou 0, os três preços são **divididos por `V_FATORCORRECAO`** (C7:566-572).
  Esse é **só o fator de correção** após a precedência de §2.4: não entram equivalência nem umidade (a linha comentada C7:568 confirma a intenção). Se o fator for 0, divide por 1.
  Com qualquer outro valor (-1), não há divisão.
- O resultado é guardado em `VAR_VALORVENDA/CUSTO NUMERIC(18,4)` (C1I:11-12), ou seja, 4 casas.
- [INFERÊNCIA, a confirmar com quem analisa o C1] O C1 multiplica o preço unitário pela quantidade já corrigida (`V_VALORVENDA * V_QUANTIDADEG`, C1:607, após C1:559). Então:
  - flag 0/NULL: `preço ≈ Qtd × FEq × U × VV_ficha` (a correção se anula, mas equivalência e umidade **encarecem**);
  - flag -1: `preço = Qtd × FEq × FC × U × VV_ficha`.
  - Caso real: `8,77125 × round4(VV/1,1111)` ≈ `7,5 × 1,0526 × VV`.
- A densidade multiplica o preço no C1 (C1:1631-1633). O percentual de perda é aplicado em C1:1719-1721.

---

## 5. Tabela de flags e colunas que alteram números

| tabela.coluna | valores | efeito | linha |
|---|---|---|---|
| ESTOQUE_GERAL.FATORCALCULO | 1 (padrão/NULL), 2, 3, 4 | fonte de correção, umidade, densidade, UFC, UTR, UI e atividade enzimática: ficha / lote / laudo / laudo→lote→ficha | C7:94, 167-175, 404, 435-493 |
| ESTOQUE_GERAL.MOVIMENTOESTOQUE | 1 MP, 2 homeo, 3 ?, 4 embalagem | equivalência e correção só para 1; umidade da ficha para <2; laudo só para 1; texto de fatores só para 1 e 2; almoxarifado só para 1 e 4; homeopatia busca lote por dinamização | C7:96,101,104,138,354,404,498; C1I:212 |
| ESTOQUE_GERAL.FATOREQUIV_UC | -1 / outro | -1 multiplica por `FATOREQUIV` | C7:96 |
| ESTOQUE_GERAL.FATOREQUIV | número | fator de equivalência (sempre da ficha). NULL com UC=-1 gera fator total NULL [INFERÊNCIA] | C7:96, 563 |
| ESTOQUE_GERAL.UMIDADE_UC | -1 / outro | -1 multiplica a umidade no fator (e o texto diz "NÃO UTILIZADA", invertido) | C7:101, 502, 563 |
| ESTOQUE_GERAL.UMIDADE | % | 100/(100-u); 100 é tratado como 0 | C7:101 |
| ESTOQUE_GERAL.CONCENTRACAO | % | correção = 100/c (MP). Valor 0 gera erro de divisão [INFERÊNCIA] | C7:104 |
| ESTOQUE_GERAL.DENSIDADE | número | densidade da ficha | C7:105 |
| ESTOQUE_GERAL.UFC / UTR / UI | número | divisores no C1 | C7:110-112; C1:339,349,351 |
| ESTOQUE_GERAL.MEQ | número | divisor no C1 para a unidade 'meq' | C1:353 |
| ESTOQUE_GERAL.ATIVIDADE_ENZIMATICA_QTDE/_UNID | número / texto | atividade da ficha | C7:113-114 |
| ESTOQUE_GERAL.ENZIMA | 0..5 | regra de conversão do ENZ | C1:359; ENZ |
| ESTOQUE_GERAL.VALORCOMPRA/VALORCUSTO/VALORVENDA | R$ | preço base do item | C7:106-108 |
| ESTOQUE_GERAL.VALIDADE_ATENDIMENTO | dias | validade da ficha | C7:109, 537-560 |
| ESTOQUE_LOTE.CONCENTRACAO / UMIDADE / DENSIDADE | % / % / número | fatores do lote (FATORCALCULO 2 ou 4) | C7:167-175 |
| ESTOQUE_LOTE.UFC/UTR/UI/ATIVIDADE_ENZIMATICA_* | | idem | C7:180-184 |
| ESTOQUE_LOTE.VENCIMENTO_DT | data | elegibilidade, FEFO e validade em dias | C7:158,179,239 |
| ESTOQUE_LOTE_LA.STATUSLOTE | 1, 2 | 1 sempre elegível; 2 só com a flag de quarentena (C7); C71 só aceita 1 | C7:189; C71:18 |
| ESTOQUE_LOTE_LA.CADASTRO_DT | data | ordenação nos modos 0 e 10 | C7:194 |
| ESTOQUE_LOTE_LA.CANCELAMENTO_LJ | NULL / não NULL | lote cancelado é ignorado | C7:191 |
| ESTOQUE_LOTE_LA.SALDO | número | **ignorado no C7**; exigido ≥ qtd no C71 | C71:22 |
| ESTOQUE.PRODUCAO | -1 / 0 | estoque de produção / almoxarifado | C7:192,385 |
| ESTOQUE_LAUDOINTERNO.CONCENTRACAO/UMIDADE/DENSIDADE/UFC/UTR/UI, RESULTADO=-1, CANCELAMENTO_CF | | fatores do laudo (média) com FATORCALCULO 3 ou 4 | C7:406-419 |
| ATENDIMENTO_CONF.SELECAO_LOTE_CALCULO_A | 0 (NULL), 1, 10, 11 | ordem de escolha do lote e uso do almoxarifado | C7:162,259,354; C71:9 |
| ATENDIMENTO_CONF.CALCULAR_ESTOQUE_QUARENTENA_A | -1 / outro | lote em quarentena pode fornecer fatores | C7:189 |
| ATENDIMENTO_CONF.VALIDAR_ESTOQUE_EMBALAGEM_A | -1 / outro | embalagem pode usar lote vencido | C7:158,193 |
| ATENDIMENTO_CONF.CALCULODENSIDADE_A | 0 / outro / NULL | 0 força densidade 1 | C7:496 |
| ATENDIMENTO_CONF.NAO_UTILIZAR_FATOR_CALC_PRECO_A | NULL/0 ou -1 | NULL/0 divide os preços pelo fator de correção | C7:566-572 |
| ATENDIMENTO_CONF.FECHARLOTE_H | -1/0 | repassado ao lote de homeopatia | C7:142 |
| FORMAFARMACEUTICA.USOVALIDADE | 0, 1, 2, 3, 4 | regra de validade do item | C7:525-560 |
| FORMAFARMACEUTICA.VALIDADE | dias | validade da forma farmacêutica | C7:46, 527 |
| FORMAFARMACEUTICA.UTILIZAR_LOTE_POT_ANT | -1/0 | lote de homeopatia | C7:47,142 |
| UNIDADES.VALORUNIDADE/VALORINDICE/CALCULO (CNPJ_FORNECEDOR_XML NULL, CALCULO<>20) | | conversão de unidade e se o fator é aplicado (no C1) | C1I:291-299; C1:343-357,553 |
| ESTOQUEF.PESOFORMULA/TIPOCADASTRO/DINAMIZAR/MANIPULACAO_MIN | | índice da fórmula de manipulação = QVD/peso; mínimo | C1I:84-98,351 |
| ESTOQUEF_DETALHE.QTDE_PRODUTO_EMB / CODIGO_PRODUTO_EMB | | quantidade de embalagem de envase | C1I:461-489 |
| ESTOQUEA_EXCIPIENTE.ATIVO | -1 | MP 'qsp(ex)' precisa estar cadastrada como excipiente | C1I:445-458 |
| PERMISSAO_DETALHE (182) / FORMAFARMACEUTICA_PROCESSO_TIPO.BLOQUEAR_CALCULO | | bloqueia o cálculo | C1I:121-141 |

---

## 6. Mensagens (texto literal, com acentos restaurados) e condições

Todas as mensagens do C1I são **bloqueantes**: o C1I faz `SUSPEND; EXIT`, e o C1 também retorna ao receber `OBSERVACAOSISTEMA_OP` não vazio (C1:289).

| Mensagem | Condição | Linha |
|---|---|---|
| `Fórmula já teve a baixa registrada` | receita: `ATENDIMENTO_A2.BAIXA_REGISTRO_LJ IS NOT NULL` para a fórmula. Fórmula de manipulação: `FORMULAMANIPULACAO.BAIXA_REGISTRO_LJ IS NOT NULL` | C1I:72, 104 |
| `Fórmula com produtos com lote reservado para baixa` | `ATENDIMENTO_A3.PESAGEM_LJ IS NOT NULL` (ou `FORMULAMANIPULACAO_DETALHE.PESAGEM_LJ`) | C1I:78, 109 |
| `Quantidade inferior ao mínimo estipulado no cadastro da fórmula!` | fórmula de manipulação com `ESTOQUEF.MANIPULACAO_MIN > QVD`. Pode ser sobrescrita pelas duas anteriores | C1I:98 |
| `Fórmula bloqueada para alteração! Processo: <NOMETIPO>` | existe `PROCESSO_MANIPULACAO` da fórmula com tipo `BLOQUEAR_CALCULO=-1` e o funcionário não tem a permissão 182 ativa | C1I:121-140 |
| `Não foi informado o estoque de baixa para a produção da fórmula!` | `CODIGO_ESTOQUE_BAIXA_IP IS NULL` | C1I:143-147 |
| `Para dinamizações, é obrigatório que a dinamização inicial tenha lote disponível. <NOME> <int(qtd)><unid> sem estoque` | fórmula dinamizada, linha 1 é o próprio produto dinamizado e o C7 não encontrou lote | C1I:354-359 |
| `<NOME> Não pode ser utilizado como excipiente` | alguma MP com unidade `'qsp(ex)'` fora de `ESTOQUEA_EXCIPIENTE` ativo. **Bug** [LITERAL]: `<NOME>` é o do **último** produto do laço, não necessariamente o culpado | C1I:445-458 |

Textos informativos, não bloqueantes, gravados por item:
- `TEXTO_FATOR`: `'FATORES DA FICHA'`, `'FATORES DO LAUDO'` ou `'FATORES DO LOTE'`, seguidos de linhas separadas por CR:
  `'FATOR EQUIV. = '`, `'FATOR CORREÇÃO = '`, `'UMIDADE = ' [+ ' NÃO UTILIZADA P/ CÁLCULO']`, `'DENSIDADE = '`,
  `'UFC|UTR|UI (LOTE|LAUDO|FICHA) = '` (C7:478-521).
  - Gerado só para MOVIMENTOESTOQUE 1 e 2.
  - [LITERAL/bug] Nas linhas de UFC, UTR e UI o código concatena `TEXTO || (TEXTO || CR || 'UFC…')`, o que **duplica** o texto inteiro, depois cortado em 1000 caracteres (C7:504-521).
- `TEXTO_VALIDADE`: ver §3.3.

Avisos do C1 relacionados (fora da fatia): `Lote vencido!` (C1:1553), `Estoque insuficiente para fazer a fórmula!` (C1:1589/1613).

---

## 7. MOV_ATENDIMENTO_CALC_LTE e MOV_ESTOQUE_FATOR: relevância
- **CALC_LTE não faz parte da cadeia do CALC1.** Quem o chama são `MOV_ATENDIMENTO_CALC_CLC` (linha 271 do arquivo convertido com `tr`) e `MOV_ATENDIMENTO_CALC_EMB` (549).
  Pelos `grep` de chamadas, o C1 chama C1_I, C2, C5, C6, C7_1, C8, C9, C12, ENZ, UTIL_ESTOQUEH_LOTE e UTIL_SPLIT_STRING.
  [INFERÊNCIA] Só importa se a tela 145 usar o motor CLC. Diferenças úteis caso use:
  - verifica o saldo com o fator: `SALDO > qtd × FEq × (100/conc ou FATORCALCULO)` (LTE:389);
  - a umidade só entra se `UMIDADE_OP > 0` (LTE:893);
  - ordenação com mais níveis (LTE:185, 397);
  - texto `' NU'` no lugar de "NÃO UTILIZADA" (LTE:847).
- **MOV_ESTOQUE_FATOR** não está na pasta e não aparece em nenhum dos fontes extraídos. Não há evidência de que pertença a esta cadeia.
