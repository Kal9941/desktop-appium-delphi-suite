import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..', '..')

function deepMerge(base, override) {
  for (const key of Object.keys(override)) {
    if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
      base[key] = deepMerge(base[key] || {}, override[key])
    } else {
      base[key] = override[key]
    }
  }
  return base
}

// env.json é versionado: credenciais/segredos com placeholders vazios e a massa
// testData.* com valor. Credenciais reais vivem em env.local.json (gitignorado),
// mesclado por cima em profundidade: cada chave folha de lá vence a do env.json.
export function loadEnv() {
  const env = JSON.parse(readFileSync(path.join(rootDir, 'env.json'), 'utf-8'))
  const localPath = path.join(rootDir, 'env.local.json')
  const mesclado = existsSync(localPath) ? deepMerge(env, JSON.parse(readFileSync(localPath, 'utf-8'))) : env
  return aplicarVariaveisDeAmbiente(mesclado)
}

// Rodada contra OUTRO exe/banco sem editar env.local.json (2026-11-06: o 4.5 no exe 23.2.1.7 do
// backup, que usa outro banco): o exe e o banco precisam andar juntos, senão o teste lê os
// insumos e o orçamento num banco e o app grava em outro. Usuário e senha do banco seguem os do
// env.local.json. Ex. (PowerShell): $env:APP_EXECUTABLE_PATH='C:\Apps\ERPDesktop - BKP\app.exe'.
function aplicarVariaveisDeAmbiente(env) {
  if (process.env.APP_EXECUTABLE_PATH) env.app = { ...env.app, executablePath: process.env.APP_EXECUTABLE_PATH }
  if (process.env.BANCO_HOST) env.banco = { ...env.banco, host: process.env.BANCO_HOST }
  if (process.env.BANCO_DATABASE) env.banco = { ...env.banco, database: process.env.BANCO_DATABASE }
  return env
}
