import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

// Dígito verificador da chave de acesso da NF-e (módulo 11, pesos 2 a 9 da direita para a esquerda).
function digitoVerificador(chaveSemDigito) {
  let soma = 0
  let peso = 2
  for (let i = chaveSemDigito.length - 1; i >= 0; i--) {
    soma += Number(chaveSemDigito[i]) * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

// O app barra a importação de uma NF-e já importada (mesma chave): cada execução gera uma cópia do
// XML modelo com número e chave novos. A assinatura digital do XML deixa de valer, e o app não a
// confere (visto na importação manual de 2026-10-29). Devolve o caminho absoluto do XML gerado.
export function gerarXmlDeNfeNova(caminhoModelo, pastaDestino) {
  const xml = readFileSync(caminhoModelo, 'utf-8')
  const numeroAntigo = /<nNF>(\d+)<\/nNF>/.exec(xml)[1]
  const chaveAntiga = /Id="NFe(\d{44})"/.exec(xml)[1]

  // 7 dígitos derivados do relógio: únicos por execução, sem colidir com notas reais do modelo.
  const numeroNovo = String(Date.now() % 9000000 + 1000000)
  const chaveBase =
    chaveAntiga.slice(0, 25) + numeroNovo.padStart(9, '0') + chaveAntiga.slice(34, 43)
  const chaveNova = chaveBase + digitoVerificador(chaveBase)

  const novo = xml
    .replaceAll(chaveAntiga, chaveNova)
    .replace(`<nNF>${numeroAntigo}</nNF>`, `<nNF>${numeroNovo}</nNF>`)
    .replace(`<nFat>${numeroAntigo.padStart(9, '0')}</nFat>`, `<nFat>${numeroNovo.padStart(9, '0')}</nFat>`)

  mkdirSync(pastaDestino, { recursive: true })
  const destino = path.resolve(pastaDestino, `nfe-${numeroNovo}.xml`)
  writeFileSync(destino, novo, 'utf-8')
  return { caminho: destino, numero: numeroNovo, chave: chaveNova }
}
