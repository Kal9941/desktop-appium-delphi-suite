# Suite `2.receitas` — desenho

Data: 2026-10-28 · Aprovado pelo operador em conversa (desenho) · Fase: primeiros cenários.

## Objetivo
Cobrir, em `Cenário`s de ponta a ponta no app desktop PS01, o ciclo da receita alopática: criar o orçamento, concluir, registrar processo e baixa, e enviar o orçamento pelo Omni Channel. O conhecimento vem de `PROJECT_CONTEXT.md` (§ "Piloto 145 a 433 gravado" e § "Omni channel testado" / "Fluxo completo Omni → receita → orçamento").

## Cenários (numeração conferida por Grep antes de criar)
| # | Cenário | Parte de | Termina em |
|---|---|---|---|
| 2.1 | Criar orçamento de receita | 145 vazia | código atribuído ao `Gravar` |
| 2.2 | Concluir a receita | receita calculada (própria) | `Concluído` + entrega + `Gravar` |
| 2.3 | Registrar processo e baixa | receita concluída (própria) | 433 com baixa registrada |
| 2.4 | Omni: orçamento enviado | 418 | `Enviar orçamento` aceito no chat |

## Regras de projeto que valem aqui
- `[R-ISOL]`/co-dependência zero: cada cenário monta a própria receita por `Dado` compartilhado; nenhum depende de estado de outro.
- `[R-SEL]`: seletor validado por dump UIA ao vivo antes de escrever o Page Object; sem UIA, `ClassName`+posição ou coordenada, justificada em comentário. Telas MDI do Omni (418 e filhas) fecham se a sessão consulta a UIA: entrada física do SO.
- `[R-POM]`: Page Object só com seletor e interação.
- `[R-RUN-ISO]`: cada cenário validado exatamente 2x isolado antes de seguir; só depois o arquivo inteiro.
- Pagamento só em Dinheiro; banco de homologação; sem limpeza de massa na v1.
- Precondição da 445 ("Tipo de uso = 0 - SEM BALANÇA") assumida; o teste não altera configuração global.
- **Checkpoints**: o operador informa o que validar em cada um, depois. Até lá o cenário só marca o ponto (captura de tela) e espera o que é objetivo do fluxo (ex.: código atribuído); nenhuma asserção de negócio é inferida.

## Dados (`env.json` só com placeholders; valores reais em `env.local.json`)
- Paciente/comprador: `testData.clienteId` = 867092.
- Receita: loja 1, tipo Humana, laboratório 2 (SOLIDOS), forma 2 (CAPSULAS), total múltiplo 30, produto 1004866 (PASSIFLORA EXTRATO SECO) 250 mg, prescritor 1, entrega 29/10/2026 10:00.
- Omni (2.4): celular = `credentials.telefone`; `Iniciar atendimento` com canal 3 e grupo 7, respondendo `Sim` ao aviso de atendimento aberto (reaproveita o existente; se não houver, cria um).

## Page Objects
`ReceitaPage` (145), `PrescritorPage` (036), `BaixaPage` (433 e Pesagem monitorada), `OmniPage` (418, detalhe e "Enviar orçamento"; entrada física do SO via helper novo em `tests/support/windowsNative.js`).

## Riscos assumidos
- Cada rodada cria uma receita em homologação; o 2.4 também manda uma mensagem real ao WhatsApp do operador.
- O 2.3 depende de a 445 estar em "SEM BALANÇA".
- O ✓ do WhatsApp (canal 3) só indica que o sistema aceitou o envio.

## Fora do escopo
CEP/ViaCEP (consulta quebrada por TLS neste ambiente), cliente novo por rodada, link de pagamento, entrega com documento fiscal, áudio e envio agendado.

## Execução
Ordem 2.1 → 2.4, um por vez, em branch `feat/suite-receitas`. O plano de tarefas é este quadro: sem documento de plano separado (o operador autorizou seguir direto).
