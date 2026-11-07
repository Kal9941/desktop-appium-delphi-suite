# Análise: excipiente, cápsula, embalagem (CALC8 / CALC10 / CALC10_1 / CALC6 / CALC5 / CALC2)

Fontes lidas (convertidas `\r`→`\n`, latin1→utf8) na pasta `scratchpad\calc\procs\`:
`MOV_ATENDIMENTO_CALC8.n.sql` (1124 l), `MOV_ATENDIMENTO_CALC10.n.sql` (608), `MOV_ATENDIMENTO_CALC10_1.n.sql` (635),
`MOV_ATENDIMENTO_CALC6.n.sql` (913), `MOV_ATENDIMENTO_CALC5.n.sql` (172), `MOV_ATENDIMENTO_CALC2.n.sql` (767).
Trechos de apoio: `MOV_ATENDIMENTO_CALC1.n.sql` (chamadas) e `MOV_ATENDIMENTO_CALC7.n.sql` (densidade).
Referências no formato `ARQ:linha` sempre se referem aos arquivos `.n.sql`.

Legenda: **[LITERAL]** = está escrito no código; **[INFERÊNCIA]** = dedução minha (nome de coluna, semântica de código numérico, intenção).

Observação: os arquivos extraídos começam no `DECLARE` — **o cabeçalho com os parâmetros não está no dump**. Os nomes de parâmetros
abaixo vêm do uso no corpo + ordem nas chamadas (CALC1:1251, CALC10:477, CALC8:644). [INFERÊNCIA quanto à ordem, LITERAL quanto aos nomes usados no corpo]

---

## 0. Como CALC1 chama cada uma

| Chamada | Linha CALC1 | Condição | Parâmetros relevantes |
|---|---|---|---|
| CALC2 (explode fórmulas internas) | 1027 | `INCLUSAOAUTOMATICA_IP = -1`, `QUANTIDADEG > 0`, linhas `CODIGO_F>0 AND CANCELARBAIXA=0`, níveis 0..5 | TIPOINCLUSAO=6 |
| CALC5 (incompatibilidades) | 1043 | sempre | — |
| CALC6 (bases substituíveis, diluentes, conservantes, essências) | 1075-1079 | `INCLUSAOAUTOMATICA_IP = -1 AND V_LABORATORIO = 1` | QVD, FF, TIPOINFORME |
| CALC2 (2ª passada) | 1231 | após CALC6 | TIPOINCLUSAO = `INCLUSAOSISTEMA_OP` |
| CALC8 (cápsula/embalagem/excipiente/revestimento) | 1247-1253 | `INCLUSAOAUTOMATICA_IP = -1 OR V_CALCULOFORMULA > 0` | ver abaixo |

CALC8 recebe (CALC1:1251): `CODIGO_FUNC, NUMEROFORMULA, CODIGO_FORMAFARMAC, LOJA, TIPOINFORME_IP=V_TIPOINFORME,
QVD_IP = IIF(V_CALCULOFORMULA=2 AND V_TIPOINFORME=1, V_INDICEFORMULA_FM, QVD_IP), COBRARINCLUSAOSISTEMA_IP = FF.COBRARINCLUSAOSISTEMA,
LABORATORIO_IP = V_LABORATORIO, VERIFICA_DIN, CODIGO_ESTOQUE_BAIXA, EXCIPIENTE_IP = IIF(produto dinamizado,-20, IIF(V_CALCULOFORMULA=1,-10,0))`.

**Atenção – `LABORATORIO_IP` NÃO é o código do laboratório** [LITERAL]: CALC1:231-241 lê `FL.TIPOFORMULA` de
`FORMAFARMACEUTICA_LABORATORIO FL ON FL.CODIGO = FF.CODIGO_LABORATORIO` para `V_LABORATORIO`; CALC1:1 comenta
"TIPO DE LABORATÓRIO 1-ALOPATIA 2-HOMEOPATIA". Portanto o "laboratório 2 SÓLIDOS" da receita de teste tem que ter
`TIPOFORMULA = 1` para o excipiente entrar (o resultado gravado confirma isso). [INFERÊNCIA sobre o cadastro do laboratório 2]

`TIPOINFORME_IP`, `COBRARINCLUSAOSISTEMA_IP` vêm de `FORMAFARMACEUTICA` (CALC1:231). [LITERAL]

---

## 1. Volume dos ativos, tamanho e nº de cápsulas por dose

### 1.1 Volume (CALC8:99-207) [LITERAL]
Percorre `ATENDIMENTO_CALC1` da fórmula com `NIVELCALCULO >= 0`, `MOVIMENTOESTOQUE IN (1,2)` e **`INCLUSAOSISTEMA IN (0,2,3)`**
(CALC8:118-122 — "NÃO ENTRA EXCIPIENTES"). Ou seja: entram itens digitados (0), diluentes (2) e conservantes (3); **não** entram
base substituível (1), excipiente (4), revestimento (5), embalagens (7/8), essência (9). [códigos 1/2/3/9 confirmados em CALC6:382 e 857-861]

Para cada linha:
- `densidade = C1.DENSIDADE`; se nula/0 **ou** `FORMAFARMACEUTICA.NAO_UTILIZAR_DENSIDADE = -1` → densidade = 1 (CALC8:79-82, 189).
- Se `UNIDADE IN ('ml','qsp(ml)','cc','cm3','l', 'TM','SD','LM','FC','CH','C','K','DH','D','X','M','MM')` → `VOLUME += QUANTIDADEG` e `PESO += QUANTIDADEG` (sem densidade) (CALC8:190-196).
- Senão, se `UNIDADE <> 'u'` e unidade de estoque `<> 'u'` → `PESO += QUANTIDADEG`; `VOLUME += QUANTIDADEG / densidade` (CALC8:197-205).
- Exceção: `MOVIMENTOESTOQUE = 2` com `QUANTIDADE < QUANTIDADEG` usa `QUANTIDADE` (CALC8:192-193, 199-200).
- Linha que é fórmula interna por unidade (`UNIDADE='u' AND TIPOCADASTRO_F=2 AND CODIGO_F>0`, CALC8:114) é substituída pela soma dos
  filhos `NIVELCALCULO = nível+1`, `INCLUSAOSISTEMA = 6` (CALC8:143-185).
- `TIPOINFORME_IP = 20` (dinamização): o volume é zerado ao chegar na penúltima linha → só os dois últimos produtos contam (CALC8:85-97, 137-141).

**`QUANTIDADEG` já inclui o fator de correção** (é a quantidade total pesada; o fator 1,1695 aumenta o volume). A densidade usada é a gravada em
`ATENDIMENTO_CALC1.DENSIDADE`, que vem de `MOV_ATENDIMENTO_CALC7.DENSIDADE_OP` = `ESTOQUE_GERAL.DENSIDADE` (ou lote/laudo conforme fator de cálculo),
**forçada a 1 se `ATENDIMENTO_CONF.CALCULODENSIDADE_A = 0`** (CALC7:72-83, 496). [LITERAL]

### 1.2 Volume por dose (CALC8:221-240) [LITERAL]
```
se TIPOINFORME=1 e QVD>0 e FF.EMBALAGEM_SEMQVD=0:  VOL = CAST(VOL/QVD AS NUMERIC(18,6))
senão se TIPOINFORME=3 e QVD>0 e VOL>0 e NAO_UTILIZAR_DENSIDADE<>-1:
      VOLUMETOTAL = VOL;  VOL = QVD / (PESO/VOLUMETOTAL);  QVD = VOL      (QVD era peso total pedido → vira volume)
VOL = CAST(VOL AS NUMERIC(18,4))      -- CALC8:266  ← arredonda para 4 casas (importa no resultado!)
VOLUME_OP = VOL                       -- devolvido ao CALC1
```
Se não achou volume (só itens em 'u' digitados), soma `QUANTIDADEG` dos itens 'u' digitados (nível 0, INCLUSAOSISTEMA 0) e, se o item
for `ESTOQUE_CLASSIFICACAO.TIPOCLASSIFICACAO = 5` ("CÁPSULA PRONTA"), começa direto no envase secundário (CALC8:242-263, 286).

### 1.3 Escolha da cápsula (= envase primário, `TIPOENVASE = 0`) (CALC8:285-616) [LITERAL]
Laço externo `VAR_TIPOENVASE` de 0 a 3 (0 = primário/cápsula; 1,2,3 = secundário… [INFERÊNCIA nos nomes 1..3]).
Para o envase 0, sem vínculo de tipo de embalagem (caso normal, CALC8:397-468):

```
para LOOP = 1 .. 300                       -- LOOP = nº de cápsulas por dose
  para cada EVF em ESTOQUER_VINCULO_FF
        onde TIPO=0, CODIGO_FORMAFARMACEUTICA=FF, ESPECIFICO_TE=0, ATIVO=-1, ESTOQUE_GERAL.ATIVO=-1
        ORDER BY EVF.ORDENACAO
     se (nenhum ativo fotossensível) ou (fotossensível e ESTOQUE_GERAL.TRANSPARENTE = 0):
        SELECT de ESTOQUER_VOLUME V onde V.CODIGO = EVF.CODIGO_PRODUTO, V.ATIVO=-1, V.VOLUME>0,
               V.VOLUME*LOOP >= CAST(VOL AS NUMERIC(18,3))
               e (V.VOLUME*LOOP - VOL) >= EXCIPIENTE_IP
        → EMBALAGEM = V.CODIGO
          PREENCHIMENTO   = CAST(VOL AS NUMERIC(18,2))*100 / V.VOLUME / LOOP      (%)
          VOLUMEEXCIPIENTE = V.VOLUME*LOOP - VOL                                   (ml por dose)
          VOLUMEREVESTIMENTO = V.VOLUME REVESTIMENTO (por cápsula)
     primeira que servir encerra
```
Consequências:
- **Ordem de decisão = menor nº de cápsulas por dose primeiro; dentro do mesmo nº, a primeira por `ESTOQUER_VINCULO_FF.ORDENACAO`**
  (não é "a de menor volume" — o `ORDER BY V.VOLUME` do select singleton é irrelevante, há 1 linha por produto).
- Tamanho (n.00, 0, 1…) = qual produto-cápsula está vinculado à FF em `ESTOQUER_VINCULO_FF` e seu `ESTOQUER_VOLUME.VOLUME` (ml).
- Ativo fotossensível (`ESTOQUE_GERAL.FOTOSSENSIVEL = -1` em qualquer item; "pegajoso", CALC8:105-108) exclui cápsulas/embalagens primárias `TRANSPARENTE <> 0` (CALC8:425).
- `EXCIPIENTE_IP > 0` (só na recursão por percentual mínimo, ver §2.4) exige sobra mínima de volume.
- `ESTOQUE_GERAL.GELADEIRA` é lido (CALC8:109-112) mas **não usado** em CALC8. [LITERAL]

Vínculo por **tipo de embalagem** (`ESTOQUER_VINCULO_TE` + `_TE_FF`, CALC8:315-340): se algum produto da fórmula (MOV<3, INCLUSAOSISTEMA<7) tem vínculo ativo
para o envase/FF, pega o 1º por `TIPOVINCULO, PRIORIDADE, INCLUSAOSISTEMA, NUMEROLINHA`:
- `TIPOVINCULO>0`: procura só EVF com `CODIGO_TIPOEMBALAGEM = tipo` (CALC8:471-542).
- `TIPOVINCULO = 2` e não achou: cai para EVF `ESPECIFICO_TE=0` de outro tipo (CALC8:545-616) → **preferencial**.
- `TIPOVINCULO = 1` e não achou: **nenhuma embalagem** (obrigatório; comentário "VINCULO OBRIGATÓRIO" em CALC8:1039). [LITERAL o comportamento; nomes "obrigatório/preferencial" do comentário]

Embalagem **digitada** pelo usuário (linha nível 0, `MOVIMENTOESTOQUE=4`, `'u'`, `INCLUSAOSISTEMA=0`, vinculada em `ESTOQUER_VINCULO_FF` para o envase):
o laço começa em `LOOP = QUANTIDADE digitada` e testa só aquele produto (CALC8:273-283, 293-313, 342-394); no final a linha digitada é
**UPDATE** (QUANTIDADEG, preços cheios — sem olhar COBRARINCLUSAOSISTEMA) em vez de INSERT (CALC8:970-987).

### 1.4 Quantidades gravadas da cápsula (CALC8:619-637, 884-969) [LITERAL]
```
QTDE_LOOP = LOOP
se TIPOINFORME=1, QVD>0, envase 0, MOV=4, EMBALAGEM_SEMQVD=0:
     VOLUMEEXCIPIENTE *= QVD;  VOLUMEREVESTIMENTO *= QVD;  QTDE_LOOP = LOOP*QVD
senão se TIPOINFORME=3 ... : multiplica por CAST(VOLUMETOTAL/QVD AS INTEGER)
INSERT ATENDIMENTO_CALC1: QUANTIDADE = QTDE_LOOP/QVD (=LOOP, "u por dose") [ou QTDE_LOOP se SEMQVD]
                          QUANTIDADEG = QTDE_LOOP, UNIDADE 'u', INCLUSAOSISTEMA 7, MOVIMENTOESTOQUE 4,
                          VALORVENDA = IIF(COBRARINCLUSAOSISTEMA=-1, ESTOQUE_GERAL.VALORVENDA, 0),
                          CAPSULA = 1 se ESTOQUE_CLASSIFICACAO.TIPOCLASSIFICACAO = 1 (envase 0, QVD>0)
                          AVISO_ROTULO = dobra (ver §6)
```

---

## 2. Excipiente

### 2.1 Quando entra (CALC8:640-656) [LITERAL]
`LABORATORIO_IP = 1` (TIPOFORMULA alopatia) **e** embalagem com MOV=4 **e** envase 0 **e** `TIPOINFORME IN (1,3)` **e** `QVD > 0`.
`FORMAFARMACEUTICA.CALCULO_EXCIPIENTE = 0` → `MOV_ATENDIMENTO_CALC10`; qualquer outro valor → `MOV_ATENDIMENTO_CALC10_1`.
Parâmetros: `QTDE_EXCIPIENTE_IP = VOLUMEEXCIPIENTE` (ml **total**, já ×QVD), `PREENCHIMENTO_IP`, `RECURSIVO_IP = IIF(EXCIPIENTE_IP>0,1,0)`.

### 2.2 Quantidade = **complemento do volume da cápsula × densidade do excipiente** [LITERAL]
```
vol_dose   = ROUND4( Σ(QUANTIDADEG/dens) / QVD )                         CALC8:232,266
vol_exc    = (V.VOLUME_capsula × nCaps − vol_dose) × QVD                  CALC8:430,628   (ml total)
QUANTIDADEG_exc = vol_exc × DENSIDADE_excipiente                          CALC10:487 / CALC10_1:514
QUANTIDADE_exc  = QUANTIDADEG_exc / QVD   (g por dose, UNIDADE 'g')       CALC10:556-558
INCLUSAOSISTEMA 4, VALORVENDA = ESTOQUE_GERAL/CALC7 VALORVENDA (cheio, NÃO depende de COBRARINCLUSAOSISTEMA)  CALC10:559,567
```
A densidade do excipiente vem de `MOV_ATENDIMENTO_CALC7(...).DENSIDADE_OP` (CALC10:385/405) → vira 1 se `ATENDIMENTO_CONF.CALCULODENSIDADE_A = 0` (CALC7:496).
Não é percentual; percentual só entra como **mínimo** (§2.4). Só é inserido se `QTDE_EXCIPIENTE_IP > 0` (CALC10:495) e insere **um único** excipiente (`LEAVE`, CALC10:576).
Se o usuário já digitou esse excipiente (`INCLUSAOSISTEMA=0`), a linha dele é **UPDATE** com a quantidade calculada (CALC10:578-603).

### 2.3 Reprodução com a receita de teste — **fecha exatamente**
```
ativo 1004866: QUANTIDADEG = 0,250 g × 30 × 1,1695 = 8,77125 g ; densidade 1 → 8,77125 ml
vol_dose = 8,77125 / 30 = 0,292375  → CAST(...,18,4) = 0,2924 ml               (CALC8:232, 266)
cápsula 4000080: 1 u/dose (LOOP=1) ⇒ V.VOLUME ≥ 0,292
vol_exc/dose = V − 0,2924 ;  ×30 ;  ×0,8
  9,3024 g = (V − 0,2924) × 30 × 0,8  ⇒  V − 0,2924 = 0,3876  ⇒  V = 0,6800 ml  (volume típico de cápsula nº 0)
QUANTIDADEG = 0,3876 × 30 = 11,628 ml × 0,8 = 9,3024 g   ✔
QUANTIDADE  = 9,3024 / 30 = 0,31008 g/cáps              ✔
cápsula: QUANTIDADE = 30/30 = 1 u/dose ; QUANTIDADEG = 1×30 = 30   ✔
PREENCHIMENTO = 0,29×100/0,68/1 = 42,65 %
```
Prova do arredondamento da linha 266: sem ele, `(0,68−0,292375)×30×0,8 = 9,3030` (0,3101 g/cáps) — o valor gravado 9,3024 só sai com 0,2924.
**[INFERÊNCIA]** `ESTOQUER_VOLUME.VOLUME` do 4000080 = 0,68 (deduzido; conferir com `SELECT VOLUME FROM ESTOQUER_VOLUME WHERE CODIGO=4000080`).
Para ter caído no 4000080 com 1 u/dose, ele deve ser o 1º em `ESTOQUER_VINCULO_FF.ORDENACAO` (TIPO 0, FF 2) com volume ≥ 0,292 — se houvesse
cápsula nº 3/nº 2 (0,30/0,37 ml) antes na ordenação, ela teria sido escolhida. [INFERÊNCIA]

Exemplo PASSIFLORA (3.000 mg × 60): com densidade ~1, 3,0 ml/dose; 1, 2 e 3 cápsulas n.00 (≈0,95 ml) não comportam (2,85 < 3,0) → LOOP=4
(4 u/dose, 240 u) — **coerente com o algoritmo**. Excipiente 0,557 g/cáps = (4×V₀₀ − vol_dose)×dens_exc; com V₀₀=0,95 e dens 0,8 implicaria
vol_dose ≈ 3,104 ml (fator/densidade do PASSIFLORA ≠ 1). Não dá para fechar sem `ESTOQUER_VOLUME` do n.00, densidade/fator do ativo e do
excipiente daquela época. [INFERÊNCIA] Também implica que não havia cápsula n.000 vinculada à FF (3×1,37 ml teria vencido com LOOP=3).

### 2.4 Qual excipiente (CALC10 / CALC10_1) [LITERAL]
Tabela de trabalho `ATENDIMENTO_CALC4` (zerada em CALC10:53).
1. **Excipiente forçado**: se há linha da fórmula com `UNIDADE='qsp(ex)'`, `MOVIMENTOESTOQUE=1` cujo produto é `ESTOQUEA_EXCIPIENTE.CODIGO_PRODUTO` (ativo),
   ele é o candidato (FIRST 1, prioridade 1, CHECAR_TODOS=10) (CALC10:67-111).
2. Senão, para cada item MOV=1 (ordem NUMEROLINHA) (CALC10:114-324):
   - `ESTOQUE_GERAL.BLOQUEAREXCIPIENTE = -1` em **qualquer** item → `EXIT`: **nenhum excipiente** (CALC10:140-141).
   - dose do item `= QUANTIDADEG/FATORCORRECAO × 1000 / QVD` (mg por dose prescrita) (CALC10:157-159).
   - **Por ativo**: `ESTOQUEA_EXCIPIENTE_DETALHE ED` (CODIGO_PRODUTO = ativo, faixa `ED.DOSE_INICIAL/FINAL` em mg/dose; 0 = sem limite) ⨝
     `ESTOQUEA_EXCIPIENTE_FF` (FF) → `ESTOQUEA_EXCIPIENTE EC` com `ATIVO=-1`, **`CLASSE_BIOFARMACEUTICA = 0`** e faixa `EC.DOSE_INICIAL/FINAL`
     comparada a:
       - CALC10 (CALCULO_EXCIPIENTE=0): `V_VOLUME_EXC = QTDE_EXCIPIENTE_IP*1000/QVD` → **volume de excipiente por dose em µl** (CALC10:63, 195-196);
       - CALC10_1: dose do ativo em mg (CALC10_1:212-213).
     Entra no CALC4 se `PERCENTUAL_MIN>0` OU `FF.PERCENTUAL_PRE=0` OU `PREENCHIMENTO < FF.PERCENTUAL_PRE` OU `ED.COMPLETAR_VE=-1` (default -1) (CALC10:205).
   - **Só pela forma farmacêutica** (fallback, uma vez só, quando o item não achou excipiente próprio) (CALC10:254-323):
     `ESTOQUEA_EXCIPIENTE` ⨝ `_FF` com `CLASSE_BIOFARMACEUTICA = 7` (qualquer) ou = classe do ativo ou grupo
     (classe 1/3→5, 2/4→6, 0→99 = só a 7) (CALC10:144-152, 272), mesma faixa de dose/volume, mesma regra de preenchimento.
     CALC10_1: COMPLETAR_VE fixo -1 e prioridade de produto fixa 10 (diff 280-285).
3. Escolha final (CALC10:327-606): ordena CALC4 por `EC.PRIORIDADE, PRIORIDADE_PRODUTO, QTDEPRODUTO DESC`, filtrando
   `CHECAR_TODOS IN (0,10)` ou todos os produtos do detalhe presentes; exige algum produto do detalhe na fórmula (ou CHECAR_TODOS=10);
   descarta se incompatível (`ESTOQUEA_INCOMPATIBILIDADE` tipo 1/3 com algum item `INCOMPATIBILIDADE=1`, inclusive itens da fórmula do excipiente).
   O 1º compatível é inserido e `LEAVE`.
4. **Percentual mínimo** (CALC10:468-482): `min = Σ QUANTIDADEG(MOV=1, INCLUSAOSISTEMA≠6) × PERCENTUAL_MIN/100` (PERCENTUAL_MIN do detalhe se >0, senão do EC).
   Se `min > QTDE_EXCIPIENTE_IP` (compara g com ml) e não recursivo → **chama CALC8 de novo com `EXCIPIENTE_IP = min/QVD`**, que reescolhe a cápsula
   exigindo sobra ≥ min/QVD (pode aumentar tamanho/quantidade de cápsulas) e sai (CALC8:650-655 propaga).

Diferenças CALC10_1 × CALC10 (diff completo): faixa `EC.DOSE_*` usa dose do ativo (mg) em vez de volume do excipiente; `V_QTDECALC_DOSE` NUMERIC(18,2);
PERCENTUAL_PRE lido dentro do laço; fallback por FF sem `LEFT JOIN` no detalhe (COMPLETAR_VE=-1, prioridade 10); OBSERVACAOSISTEMA sempre
`NOME || ' - ' || OBS` (sem o IIF de vazio); MAX(NUMEROLINHA) sem filtro de nível. Mesma fórmula de quantidade.

**Nome no rótulo**: `FORMAFARMACEUTICA.EXCIPIENTE_ROTULO <> -1` → `NOMEPRODUTO_ROTULO = NULL` (CALC10:484-485) — só rótulo.

---

## 3. Embalagem secundária (frasco/pote) e acessórios

### 3.1 Frasco/pote (envase 1..3) (CALC8:443-461, 1117-1122) [LITERAL]
Após o envase 0: `QTDE_ENVASE = QTDE_LOOP` (total de cápsulas, ex.: 30), `CODIGO_ESTOQUER_VOLUME = código da cápsula` (CALC8:622, 1118).
Para envase ≥1 (ou matéria-prima unitária) **não é volume em ml**, é **capacidade cadastrada**:
```
para LOOP = 1..300, para EVF (TIPO=envase, FF, ESPECIFICO_TE=0, ATIVO) ORDER BY ORDENACAO:
   SELECT FIRST 1 de ESTOQUER_VOLUME_DETALHE VD
     onde VD.CODIGO_ESTOQUER_VOLUME = EVF.CODIGO_PRODUTO (o frasco)
       e  VD.CODIGO_PRODUTO        = item do envase anterior (a cápsula)
       e  VD.QUANTIDADE * LOOP     >= QTDE_ENVASE
```
→ 1º frasco (por ORDENACAO) que comporta as N cápsulas daquele tamanho; LOOP = nº de frascos. Grava `QUANTIDADE = QUANTIDADEG = LOOP`, 'u',
INCLUSAOSISTEMA 7, preço por COBRARINCLUSAOSISTEMA. Ex.: frasco PET 75 ml comporta ≥30 cápsulas nº 0; pote 520 ml comporta ≥240 n.00.
Para formas não-cápsula (TIPOINFORME 2, cremes etc.) o envase 0 usa `ESTOQUER_VOLUME.VOLUME*LOOP >= volume total` (pote por volume) e **não** há excipiente.
Envase 2/3 repetem com o frasco como conteúdo. (Se um envase não achar nada, `QTDE_ENVASE` vira 0 no seguinte — CALC8:1118-1119 — e qualquer VD serve. [LITERAL, provável bug])

### 3.2 Tampa, rótulos, sílica (INCLUSAOSISTEMA 8) (CALC8:988-1115) [LITERAL]
Vêm de **`ESTOQUER_VINCULO_FF_DET`** do vínculo escolhido (`CODIGO_ESTOQUER_VINCULO_FF = EVF.CODIGO` do frasco/cápsula escolhido), ORDER BY NUMEROITEM:
```
qtd = IIF(MULTIPLICARQUANTIDADE=-1, QTDE_LOOP / QUANTIDADE_PRODUTO * QUANTIDADE, QUANTIDADE);  0 → 1;  arredonda PARA CIMA
```
Filtro de tipo (envase 4 de `ESTOQUER_VINCULO_TE`): entra se NUMEROITEM novo e (vínculo obrigatório e mesmo tipo) ou (`ESPECIFICO_TE=-1` e mesmo tipo)
ou (sem tipo e `ESPECIFICO_TE=0`) ou (vínculo preferencial e `ESPECIFICO_TE=0`) — 1 por NUMEROITEM.
Grava `MOVIMENTOESTOQUE 4`, 'u', `INCLUSAOSISTEMA 8`, `VALORVENDA = IIF(COBRARINCLUSAOSISTEMA=-1, VALORVENDA, 0)`.
Não verifica se já existe → insere sempre. Na receita de teste, tampa/etiquetas/sílica (8) estão no DET do frasco PET 75 ml (e/ou da cápsula). [INFERÊNCIA]

### 3.3 Revestimento entérico (INCLUSAOSISTEMA 5) (CALC8:657-830) [LITERAL]
Se `LABORATORIO_IP=1`, MOV=4, `VOLUMEREVESTIMENTO>0` (`ESTOQUER_VOLUME.VOLUMEREVESTIMENTO` × QVD) e algum item tem `ATENDIMENTO_CALC1.CODIGOREVESTIMENTO>0`:
insere esse produto com `QUANTIDADEG = VOLUMEREVESTIMENTO` e `QUANTIDADE = /QVD` (se <0,1 → ×1000 em 'mg'), preço cheio, salvo incompatível.
**Não multiplica pelo nº de cápsulas por dose** (só por QVD — CALC8:629). [LITERAL; provável bug se LOOP>1]
Depois, se entrou excipiente ou revestimento, explode via CALC2 as linhas `CODIGO_F>0` com INCLUSAOSISTEMA 4/5 ou 'qsp(ex)' (CALC8:832-869).

---

## 4. CALC5, CALC6, CALC2

**CALC5 – incompatibilidades (não mexe em números)** [LITERAL]: compara todos os pares `INCOMPATIBILIDADE=1` do atendimento (todas as fórmulas do
funcionário) em `ESTOQUEA_INCOMPATIBILIDADE (CODIGO_PRODUTO1, CODIGO_PRODUTO2)`; tipo 3 sempre, tipo 1 (química) só na mesma fórmula, tipo 2
(farmacológica) só entre fórmulas diferentes; grava em `ATENDIMENTO_CALC3` com `BLOQUEARCALCULO` (CALC5:87-167). CALC1:1049-1069 bloqueia se
`BLOQUEARCALCULO = -1`.

**CALC6 – bases substituíveis, diluentes, conservantes, essências** (só alopatia + inclusão automática) [LITERAL]:
- *Base substituível* (`ESTOQUEA_BASE` ⨝ `_FF` ⨝ `_LISTA` por PRIORIDADE; `_DETALHE` + CHECAR_TODOS): a linha digitada fica com `CANCELARBAIXA=-1`,
  visível, e recebe `QUANTIDADEG = CAST(QUANTIDADEG/FATORCORRECAO_antigo,4) × FATOR_novo`, densidade e preços da base nova; insere a base nova com
  INCLUSAOSISTEMA 1, invisível, que dá baixa (CALC6:285-396). Volume (CALC8) conta a linha original (INCLUSAOSISTEMA 0) já com a qtd nova.
- *Diluente/conservante/essência* (`ESTOQUEA_CONSERVANTE` ⨝ `_DETALHE` (faixa dose mg: `QUANTIDADEG/FATOR×1000/QVD` se TIPOINFORME 1, senão ×1000) ⨝ `_FF`):
  ```
  base = TIPOINCLUSAO=1 ? Σ QUANTIDADEG dos produtos da sequência : Σ QUANTIDADEG de todos MOV=1 (INCLUSAOSISTEMA ∉ {2,3,10}, CANCELARBAIXA=0)
  QUANTIDADEG = base × FATOR_conservante × PORCENTO/100 ; QUANTIDADE = PORCENTO ; UNIDADE '%'      (CALC6:747-784, 854-856)
  INCLUSAOSISTEMA = 2 diluente / 3 conservante / 9 essência ; preços × FATOR (sempre cobrados)     (CALC6:857-870)
  ```
  Ordem TIPO_CD (diluente primeiro), PRIORIDADE; um de prioridade menor já incluído do mesmo tipo bloqueia (CALC6:637-642).
  Diluente e conservante **somam no volume** da cápsula (CALC8:122); essência (9) não.
- Bugs/curiosidades literais: CALC6:137 usa a variável `VAR_CHECAR_TODOS` (último valor) e não `C5.CHECAR_TODOS`; CALC6:632-633 o `LEAVE` do
  CHECAR_TODOS=-1 só roda para TIPO_CD fora de 1..3, então na prática basta **um** produto da sequência.

**CALC2 – explode fórmula padrão interna (`ESTOQUEF`/`ESTOQUEF_DETALHE`) em linhas nível+1** [LITERAL]:
- conversão por `UNIDADES.CALCULO/VALORINDICE/VALORUNIDADE`, UI/UTR/MEQ/UFC/enzima (CALC2:226-247, 359-366);
- × fator de correção do componente (MOV=1, CALCULO ∈ {1..7,9}) (CALC2:376-382);
- × `CAST(QTDE_FORMULA/PESOFORMULA AS NUMERIC(18,4))` (proporção) (CALC2:384); unitários arredondados para cima (CALC2:404-409);
- QSP: `QSP -= (SOMAG+SOMAML+SOMA_PG+SOMA_PML) × participação` (CALC2:728-749); se algum componente ≥ soma dos QSP, apaga e sai (CALC2:565-575);
- homeopatia (CALCULO 99) via FF.QTDEMEDICAMENTO_* / METODOUTILIZACAO e preço por `ESTOQUEH_TABELA` (CALC2:412-505);
- preços × `ESTOQUEF.INDICECALCULO` (CALC2:603-608); INCLUSAOSISTEMA dos filhos = TIPOINCLUSAO se `OPCAO_ATENDIMENTO>1` ou CHECARFORMULA=-1, senão 99 (só preço) (CALC2:676-679);
- pai fica `CANCELARBAIXA = 0` se `OPCAO_ATENDIMENTO IN (0,1,4)`, senão -1 (baixa pelos filhos) (CALC2:752-756).
No contexto do excipiente: se o excipiente for fórmula com `INCLUIRFORMULA=-1`/PRECOSISTEMA=1/TIPOCADASTRO∈{1,2,3,5}, recebe CODIGO_F e é explodido. [LITERAL]

---

## 5. Flags/colunas que alteram números

| tabela.coluna | valores | efeito | linha |
|---|---|---|---|
| FORMAFARMACEUTICA.TIPOINFORME | 1 / 3 / 20 / outros | 1: volume ÷QVD, cápsulas e excipiente ×QVD; 3: QVD (peso) → volume pela densidade final; 20: só 2 últimos itens no volume; excipiente só com 1/3 | CALC8:85,231-240,626-637,640 |
| FORMAFARMACEUTICA.EMBALAGEM_SEMQVD | 0 / ≠0 | 0: cálculo por dose ×QVD; ≠0: volume total, sem ×QVD, QUANTIDADE=QTDE_LOOP | CALC8:223,231,626,791,953,974 |
| FORMAFARMACEUTICA.CALCULO_EXCIPIENTE | 0 / ≠0 | CALC10 (faixa EC por volume excip. µl/dose) × CALC10_1 (faixa por dose mg do ativo) | CALC8:643-648 |
| FORMAFARMACEUTICA.NAO_UTILIZAR_DENSIDADE | -1 / 0 | -1: densidade 1 no volume e desliga recálculo TIPOINFORME 3; (CALC1:245 zera CALCULODENSIDADE) | CALC8:79,167,189,234 |
| FORMAFARMACEUTICA.PERCENTUAL_PRE | 0 / % | >0: excipiente só se preenchimento < PRE (ou PERCENTUAL_MIN>0 ou COMPLETAR_VE=-1) | CALC10:57-61,205,286 |
| FORMAFARMACEUTICA.COBRARINCLUSAOSISTEMA | -1 / outro | -1: cápsula/frasco (7) e acessórios (8) com VALORVENDA; senão 0. Não afeta excipiente, revestimento, CALC6 | CALC8:963-966,1110-1113 |
| FORMAFARMACEUTICA.EXCIPIENTE_ROTULO | -1 / outro | só nome do excipiente no rótulo | CALC10:484 |
| FORMAFARMACEUTICA_LABORATORIO.TIPOFORMULA (via FF.CODIGO_LABORATORIO) | 1 alopatia / 2 homeopatia | 1: liga CALC6, excipiente, revestimento | CALC1:231-241,1075; CALC8:640,657,832 |
| ATENDIMENTO_CONF.CALCULODENSIDADE_A | 0 / ≠0 | 0: DENSIDADE=1 para tudo (volume e g de excipiente: 9,3024→11,628) | CALC7:72-83,496 |
| ATENDIMENTO_CONF.INFORMARDOBRACAPS_A | 1,-1 / 2 / outro | texto de dobra no AVISO_ROTULO (não muda número) | CALC8:74-77,894-900 |
| ATENDIMENTO_CONF.VALIDAR_ESTOQUE_EMBALAGEM_A | -1 / 0 | fora da fatia: CALC7 aceita lote vencido de embalagem; CALC1 valida estoque/validade de embalagem (avisos, não quantidade) | CALC7:158…; CALC1:1551,1563,1611,1685 |
| ESTOQUE_GERAL.DENSIDADE (ou lote/laudo) | num | divisor do volume do ativo; multiplicador do excipiente | CALC8:203; CALC10:487 |
| ESTOQUE_GERAL.FOTOSSENSIVEL / TRANSPARENTE | -1 / 0 | ativo fotossensível exclui embalagem primária transparente | CALC8:105,425,498,573 |
| ESTOQUE_GERAL.BLOQUEAREXCIPIENTE | -1 | nenhum excipiente na fórmula | CALC10:140 |
| ESTOQUE_GERAL.CLASSE_BIOFARMACEUTICA | 0..4 | escolhe excipiente no fallback por FF (1,3→5; 2,4→6; 0→só 7) | CALC10:144-152,272 |
| ESTOQUE_CLASSIFICACAO.TIPOCLASSIFICACAO | 1 / 5 | 1: CAPSULA=1 + aviso de dobra; 5: cápsula pronta começa no envase secundário | CALC8:247,888-893 |
| ESTOQUER_VINCULO_FF.(TIPO, ORDENACAO, ATIVO, ESPECIFICO_TE, CODIGO_TIPOEMBALAGEM) | — | candidatos de cápsula/frasco por FF e ordem de teste | CALC8:405-417,478-490,552-565 |
| ESTOQUER_VOLUME.VOLUME / VOLUMEREVESTIMENTO / ATIVO | ml | tamanho da cápsula/pote; complemento → excipiente; revestimento | CALC8:428-442 |
| ESTOQUER_VOLUME_DETALHE.QUANTIDADE | nº | capacidade do frasco para o item anterior → escolha do frasco | CALC8:456-461 |
| ESTOQUER_VINCULO_FF_DET.(QUANTIDADE, MULTIPLICARQUANTIDADE, QUANTIDADE_PRODUTO, ESPECIFICO_TE, CODIGO_TIPOEMBALAGEM, NUMEROITEM) | — | acessórios (8) e quantidades | CALC8:1020-1050 |
| ESTOQUER_VINCULO_TE(+_FF).(TIPOVINCULO, TIPOENVASE, PRIORIDADE) | 1 obrig. / 2 pref. | restringe tipo de embalagem por produto | CALC8:315-340,471,545,991-1015 |
| ESTOQUEA_EXCIPIENTE.(CLASSE_BIOFARMACEUTICA, DOSE_INICIAL/FINAL, PRIORIDADE, PERCENTUAL_MIN, CHECAR_TODOS, INCLUIRFORMULA, ATIVO) | — | qual excipiente; mínimo % (recursão em CALC8) | CALC10:182-203,257-283,327-345,468-482 |
| ESTOQUEA_EXCIPIENTE_DETALHE.(DOSE_INICIAL/FINAL, PRIORIDADE, COMPLETAR_VE, PERCENTUAL_MIN) | — | excipiente por ativo/faixa de dose | CALC10:163-178,352-367 |
| ESTOQUEA_EXCIPIENTE_FF | — | excipiente habilitado para a FF | CALC10:168,269 |
| ATENDIMENTO_CALC1.UNIDADE='qsp(ex)' | — | força o excipiente digitado | CALC10:67-111; CALC8:845,852 |
| ATENDIMENTO_CALC1.CODIGOREVESTIMENTO | >0 | inclui revestimento entérico | CALC8:659-664 |
| ESTOQUEA_CONSERVANTE.(PORCENTO, TIPOINCLUSAO, TIPO_CD, PRIORIDADE, CHECAR_TODOS) + _DETALHE.DOSE_* + _FF | — | diluente/conservante/essência = % da base | CALC6:444-469,747-784 |
| ESTOQUEA_BASE(+_FF,_LISTA.PRIORIDADE,_DETALHE) | — | substituição de base (qtd × fator novo) | CALC6:50-404 |
| ESTOQUEF.(PESOFORMULA, TIPOCADASTRO, OPCAO_ATENDIMENTO, INDICECALCULO) | — | proporção/explosão/preço de fórmula interna | CALC2:132-191,384,603,752 |
| ESTOQUEA_INCOMPATIBILIDADE.(TIPOINCOMPATIBILIDADE, BLOQUEARCALCULO) | 1/2/3, -1 | descarta excipiente/conservante/base incompatível; bloqueia cálculo | CALC5; CALC10:429; CALC6:242,702 |
| Parâmetro EXCIPIENTE_IP (CALC1) | -10/-20/0/>0 | -10 (CALCULOFORMULA=1) e -20 (dinamizado): CALC8 só devolve volume, sem embalagem; >0 mínimo de sobra | CALC8:209-214,436 |

---

## 6. Mensagens geradas (texto literal; acentos reconstruídos do mojibake)

| Texto | Onde | Condição |
|---|---|---|
| `'1 DOSE = ' || n || ' CÁPSULAS'` (AVISO_ROTULO da cápsula) | CALC8:896-897 | envase 0, QVD>0, classificação TIPOCLASSIFICACAO=1, n=cápsulas/dose >1, `INFORMARDOBRACAPS_A IN (1,-1)` |
| `'CADA CÁPSULA CONTÉM 1/' || n || ' DA DOSE'` | CALC8:898-899 | idem com `INFORMARDOBRACAPS_A = 2` |
| `NOMEPRODUTO || ' - ' || OBSERVACAO` (OBSERVACAOSISTEMA do excipiente) | CALC10:568, 589; CALC10_1 (sem IIF) | `ESTOQUEA_EXCIPIENTE.OBSERVACAO_FP = -1` |
| `NOMEPRODUTO || ' - ' || OBSERVACAO` (diluente/conservante) | CALC6:871 | `ESTOQUEA_CONSERVANTE.OBSERVACAO_FP = -1` |
| `'INCOMPATIBILIDADE QUÍMICA ENTRE ' X ' E ' Y` | CALC5:161 | mesma fórmula, tipo 1 ou 3 |
| `'INCOMPATIBILIDADE FARMACOLÓGICA ENTRE ' X ' FÓRMULA:' n ' E ' Y ' FÓRMULA:' m` | CALC5:163 | fórmulas diferentes, tipo 2 ou 3 |
| `... || 'CÁLCULO PROIBIDO'` (bloqueio) | CALC1:1069 | alguma incompatibilidade com `BLOQUEARCALCULO = -1` |
| `'Dinamização inexistente no estoque!'` (AVISO_ATENDIMENTO) | CALC2:543 | homeopatia, `VERIFICA_DIN_IP = -1`, sem ESTOQUEH_QTDE_DIN/lote |

**Não há mensagem nem erro** em CALC8 quando não acha cápsula/frasco (LOOP chega a 300 sem achar → nada é inserido), quando
`BLOQUEAREXCIPIENTE` impede o excipiente, ou quando o vínculo obrigatório (TIPOVINCULO=1) não encontra embalagem. Em teste de UI isso aparece
apenas como **ausência da linha**. [LITERAL]

---

## Consultas sugeridas para fechar as inferências (somente leitura)
```sql
SELECT CODIGO, VOLUME, VOLUMEREVESTIMENTO, ATIVO FROM ESTOQUER_VOLUME WHERE CODIGO IN (4000080, 4000170);
SELECT CODIGO, CODIGO_PRODUTO, TIPO, ORDENACAO, ESPECIFICO_TE, CODIGO_TIPOEMBALAGEM FROM ESTOQUER_VINCULO_FF WHERE CODIGO_FORMAFARMACEUTICA = 2 AND ATIVO = -1 ORDER BY TIPO, ORDENACAO;
SELECT * FROM ESTOQUER_VOLUME_DETALHE WHERE CODIGO_ESTOQUER_VOLUME = 4000170;
SELECT * FROM ESTOQUER_VINCULO_FF_DET WHERE CODIGO_ESTOQUER_VINCULO_FF IN (<EVF.CODIGO da cápsula e do frasco>);
SELECT TIPOINFORME, EMBALAGEM_SEMQVD, CALCULO_EXCIPIENTE, NAO_UTILIZAR_DENSIDADE, PERCENTUAL_PRE, COBRARINCLUSAOSISTEMA, CODIGO_LABORATORIO FROM FORMAFARMACEUTICA WHERE CODIGO = 2;
SELECT TIPOFORMULA FROM FORMAFARMACEUTICA_LABORATORIO WHERE CODIGO = 2;
SELECT CALCULODENSIDADE_A, INFORMARDOBRACAPS_A FROM ATENDIMENTO_CONF;
```
