// Testes da lógica pura do gravador de sessão (sem E/S, sem PowerShell).
// Rodar com: npm run recorder:test
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TITULOS_SEM_TECLAS,
  extrairNumeroTela,
  telaPermiteUia,
  agruparTeclas,
  calcularAvisos,
  lerTrace,
  montarResumo,
  ps01EmExecucao,
  resolverTela,
} from './_recorderLogic.mjs'

// Fábrica de evento de tecla, para deixar cada teste só com o que importa.
function tecla(seq, t, caractere, { nome = caractere ?? 'Enter', modificadores = [], janela = '0x00010001' } = {}) {
  return { seq, t, tipo: 'tecla', tecla: { nome, caractere, modificadores }, janela }
}

test('TITULOS_SEM_TECLAS contém a janela de Login', () => {
  assert.deepEqual(TITULOS_SEM_TECLAS, ['Login'])
})

test('extrairNumeroTela devolve o número da classe Tf<MÓDULO>_<nº>', () => {
  assert.equal(extrairNumeroTela('TfSIS_145'), '145')
})

test('extrairNumeroTela normaliza zeros à esquerda para a notação do projeto (3 dígitos)', () => {
  assert.equal(extrairNumeroTela('TfSIS_0145'), '145')
  assert.equal(extrairNumeroTela('TfSIS_0007'), '007')
  assert.equal(extrairNumeroTela('TfSIS_0046'), '046')
})

test('extrairNumeroTela devolve null para classe de tela sem número', () => {
  assert.equal(extrairNumeroTela('TfUTI_PES'), null)
})

test('extrairNumeroTela devolve null para classe que não é de tela', () => {
  assert.equal(extrairNumeroTela('TBitBtn'), null)
})

test('telaPermiteUia aceita tela da lista segura', () => {
  assert.equal(telaPermiteUia('145', ['145']), true)
})

test('telaPermiteUia recusa tela fora da lista segura', () => {
  assert.equal(telaPermiteUia('433', ['145']), false)
})

test('telaPermiteUia recusa tela sem número', () => {
  assert.equal(telaPermiteUia(null, ['145']), false)
})

test('agruparTeclas junta teclas imprimíveis seguidas num único texto', () => {
  const saida = agruparTeclas([tecla(1, 0, 'a'), tecla(2, 100, 'b'), tecla(3, 200, 'c')])
  assert.equal(saida.length, 1)
  assert.equal(saida[0].tipo, 'texto')
  assert.equal(saida[0].texto, 'abc')
  assert.equal(saida[0].seq, 1)
  assert.equal(saida[0].t, 0)
})

test('agruparTeclas fecha o grupo numa tecla especial e a repassa como tecla', () => {
  const saida = agruparTeclas([
    tecla(1, 0, 'a'),
    tecla(2, 100, null, { nome: 'Enter' }),
    tecla(3, 200, 'b'),
  ])
  assert.deepEqual(
    saida.map((e) => e.tipo),
    ['texto', 'tecla', 'texto']
  )
  assert.equal(saida[1].tecla.nome, 'Enter')
})

test('agruparTeclas abre grupo novo quando a lacuna passa de 1500 ms', () => {
  const saida = agruparTeclas([tecla(1, 0, 'a'), tecla(2, 100, 'b'), tecla(3, 2100, 'c')])
  assert.deepEqual(
    saida.map((e) => e.texto),
    ['ab', 'c']
  )
})

test('agruparTeclas abre grupo novo quando a janela em foco muda', () => {
  const saida = agruparTeclas([
    tecla(1, 0, 'a', { janela: '0x00010001' }),
    tecla(2, 100, 'b', { janela: '0x00020002' }),
  ])
  assert.deepEqual(
    saida.map((e) => e.texto),
    ['a', 'b']
  )
})

test('agruparTeclas nunca agrupa tecla com Ctrl ou Alt', () => {
  const saida = agruparTeclas([
    tecla(1, 0, 'c', { nome: 'C', modificadores: ['ctrl'] }),
    tecla(2, 100, 'x', { nome: 'X', modificadores: ['alt'] }),
  ])
  assert.deepEqual(
    saida.map((e) => e.tipo),
    ['tecla', 'tecla']
  )
})

test('agruparTeclas preserva acentos e cedilha no texto', () => {
  const saida = agruparTeclas([
    tecla(1, 0, 'ç'),
    tecla(2, 50, 'ã'),
    tecla(3, 100, 'é'),
    tecla(4, 150, 'o'),
  ])
  assert.equal(saida[0].texto, 'çãéo')
})

test('calcularAvisos sinaliza controle sem legenda e UIA pulado', () => {
  const avisos = calcularAvisos({ alvo: { classe: 'TBitBtn', titulo: '' }, uiaPulado: true })
  assert.ok(avisos.includes('sem-legenda'))
  assert.ok(avisos.includes('uia-pulado-tela-nao-segura'))
})

test('calcularAvisos sinaliza grid owner-drawn sem legenda', () => {
  const avisos = calcularAvisos({ alvo: { classe: 'TStringGrid', titulo: '' }, uiaPulado: false })
  assert.ok(avisos.includes('owner-drawn'))
})

test('calcularAvisos devolve lista vazia para controle com legenda e UIA feito', () => {
  const avisos = calcularAvisos({ alvo: { classe: 'TBitBtn', titulo: 'Gravar' }, uiaPulado: false })
  assert.deepEqual(avisos, [])
})

test('lerTrace ignora a última linha truncada e conta a linha inválida', () => {
  const { eventos, linhasInvalidas } = lerTrace('{"seq":1}\n{"seq":2}\n{"seq":')
  assert.equal(eventos.length, 2)
  assert.equal(linhasInvalidas, 1)
})

test('lerTrace aceita texto vazio', () => {
  assert.deepEqual(lerTrace(''), { eventos: [], linhasInvalidas: 0 })
})

test('montarResumo de gravação vazia não quebra e avisa', () => {
  assert.match(montarResumo([]), /Gravação vazia/)
})

test('montarResumo agrupa por tela e descreve cliques e texto', () => {
  const resumo = montarResumo([
    { seq: 1, t: 0, tipo: 'clique', tela: { numero: '145', titulo: 'Atendimento' }, alvo: { classe: 'TBitBtn', titulo: 'Gravar' }, rx: 10, ry: 20, avisos: [] },
    { seq: 2, t: 500, tipo: 'texto', tela: { numero: '145', titulo: 'Atendimento' }, texto: 'Maria' },
    { seq: 3, t: 900, tipo: 'clique', tela: { numero: '433', titulo: 'Baixa de fórmulas' }, alvo: { classe: 'TBitBtn', titulo: 'Registrar baixa' }, rx: 5, ry: 6, avisos: [] },
  ])
  assert.match(resumo, /## Tela 145/)
  assert.match(resumo, /## Tela 433/)
  assert.ok(resumo.includes('"Gravar" (TBitBtn)'))
  assert.ok(resumo.includes('digitou "Maria"'))
})

test('montarResumo mostra o checkpoint com a nota do operador', () => {
  const resumo = montarResumo([
    { seq: 5, t: 0, tipo: 'checkpoint', tela: { numero: '145', titulo: 'Atendimento' } },
    { seq: 6, t: 10, tipo: 'nota', ref: 5, texto: 'Receita concluída' },
  ])
  assert.ok(resumo.includes('**CHECKPOINT**'))
  assert.ok(resumo.includes('Receita concluída'))
})

test('montarResumo mostra clique sem número de tela e sem legenda', () => {
  const resumo = montarResumo([
    { seq: 1, t: 0, tipo: 'clique', tela: { numero: null, titulo: '' }, alvo: { classe: 'TStringGrid', titulo: '' }, rx: 12, ry: 34, avisos: ['owner-drawn'] },
  ])
  assert.match(resumo, /## Tela sem número/)
  assert.ok(resumo.includes('sem legenda (TStringGrid) em (12,34)'))
  assert.ok(resumo.includes('[owner-drawn]'))
})

test('ps01EmExecucao reconhece o processo na saída do tasklist', () => {
  assert.equal(ps01EmExecucao('PS01.exe    1234 Console    1   80.000 K', 'PS01.exe'), true)
})

test('ps01EmExecucao devolve false quando o tasklist não encontra o processo', () => {
  assert.equal(ps01EmExecucao('INFORMAÇÕES: nenhuma tarefa em execução correspondente aos critérios especificados.', 'PS01.exe'), false)
})

// --- achados da calibração de 2026-10-28 ---

test('agruparTeclas trata Esc e Enter como tecla, nunca como texto', () => {
  const saida = agruparTeclas([
    tecla(1, 0, '\u001b', { nome: 'Esc' }),
    tecla(2, 100, '1'),
    tecla(3, 150, '4'),
    tecla(4, 200, '5'),
    tecla(5, 250, '\r', { nome: 'Enter' }),
  ])
  assert.deepEqual(
    saida.map((e) => e.tipo),
    ['tecla', 'texto', 'tecla']
  )
  assert.equal(saida[1].texto, '145')
  assert.equal(saida[2].tecla.nome, 'Enter')
})

test('montarResumo mostra as coordenadas mesmo quando o alvo tem legenda (clique em menu)', () => {
  const resumo = montarResumo([
    { seq: 4, t: 0, tipo: 'clique', tela: { numero: null, titulo: 'SisPS' }, alvo: { classe: 'TfSIS_PS', titulo: 'SisPS - Soluções Inteligentes' }, rx: 40, ry: 52, avisos: [] },
  ])
  assert.ok(resumo.includes('"SisPS - Soluções Inteligentes" (TfSIS_PS) em (40,52)'))
})

test('montarResumo mostra a legenda sem o atalho & (o UIA devolve o Name sem ele)', () => {
  const resumo = montarResumo([
    { seq: 54, t: 0, tipo: 'clique', tela: { numero: '145', titulo: 'Atendimento' }, alvo: { classe: 'TBitBtn', titulo: '&Gravar' }, rx: 5, ry: 6, avisos: [] },
  ])
  assert.ok(resumo.includes('"Gravar" (TBitBtn)'))
  assert.ok(!resumo.includes('&Gravar'))
})

test('montarResumo mostra o que o UIA devolveu (Name e tipo de controle)', () => {
  const resumo = montarResumo([
    {
      seq: 54, t: 0, tipo: 'clique', tela: { numero: '145', titulo: 'Atendimento' },
      alvo: { classe: 'TBitBtn', titulo: '&Gravar' }, rx: 5, ry: 6, avisos: [],
      uia: { name: 'Gravar', className: 'TBitBtn', controlType: 'ControlType.Button', path: 'x' },
    },
  ])
  assert.ok(resumo.includes('UIA name="Gravar" Button'))
})

test('resolverTela acha o número na cadeia do controle clicado', () => {
  const tela = resolverTela({
    alvo: { classe: 'TBitBtn', titulo: 'Gravar' },
    cadeia: [{ classe: 'TPanel', titulo: '' }, { classe: 'TfSIS_145', titulo: '[ 145 ] - Atendimento' }],
    janelaTopo: { classe: 'TfSIS_PS', titulo: 'SisPS' },
  })
  assert.deepEqual(tela, { numero: '145', titulo: 'SisPS' })
})

test('resolverTela usa a primeira classe visível quando não houve clique (checkpoint)', () => {
  const tela = resolverTela({
    classesVisiveis: ['TfSIS_PS', 'TfSIS_145', 'TfSIS_433'],
    foco: { titulo: 'SisPS - Soluções Inteligentes', handle: '0x1' },
  })
  assert.deepEqual(tela, { numero: '145', titulo: 'SisPS - Soluções Inteligentes' })
})

test('resolverTela devolve número null e título vazio quando nada identifica a tela', () => {
  assert.deepEqual(resolverTela({}), { numero: null, titulo: '' })
})
