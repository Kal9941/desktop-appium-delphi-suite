// Classificador de erro — categoriza toda falha em causas conhecidas para que
// o relatório cite a categoria, nunca "parece que o seletor está errado".
// Adaptado de cypress-pharmacie-web/cypress/support/errorHandler.js para o
// vocabulário de UI Automation (categorias em .agents/AGENTS.md §2).
import {
  existsSync, readFileSync, writeFileSync, mkdirSync,
} from 'node:fs'
import path from 'node:path'

export const ErrorCategory = {
  ELEMENT_NOT_FOUND: 'elemento_ausente_na_arvore_uia',
  WAIT_TIMEOUT: 'timeout_de_espera_por_controle',
  APP_NOT_RESPONDING: 'app_nao_responde_ou_crash',
  ELEMENT_NOT_INTERACTABLE: 'elemento_encontrado_mas_nao_interagivel',
  HTTP_CONTRACT_FAILURE: 'falha_de_contrato_http',
  PROCESS_INIT_FAILURE: 'falha_de_inicializacao_do_processo',
  // Suíte 4.calculo (mensagens montadas em tests/support/calculo/).
  PRECONDICAO_DE_MASSA: 'precondicao_de_massa',
  DIVERGENCIA_DE_CALCULO: 'divergencia_de_calculo',
  INTERFERENCIA_NA_TABELA: 'interferencia_na_tabela_de_trabalho',
  FALHA_DE_ACESSO_AO_BANCO: 'falha_de_acesso_ao_banco',
  ENTRADA_DIVERGENTE_DA_MASSA: 'entrada_divergente_da_massa',
  UNKNOWN: 'causa_nao_classificada',
}

const RULES = [
  // As do cálculo vêm primeiro: a queda do Firebird traz "ECONNREFUSED", que a regra de app
  // travado abaixo também casaria.
  // A mensagem pode chegar com o prefixo "Error: " (visto no 4.1): aceito antes do texto.
  { category: ErrorCategory.FALHA_DE_ACESSO_AO_BANCO, match: /^(Error: )?Sem acesso ao Firebird|Preencha "banco" em env\.local\.json/ },
  { category: ErrorCategory.PRECONDICAO_DE_MASSA, match: /^(Error: )?pré-condição:/ },
  { category: ErrorCategory.DIVERGENCIA_DE_CALCULO, match: /^(Error: )?divergência de cálculo/ },
  { category: ErrorCategory.INTERFERENCIA_NA_TABELA, match: /^(Error: )?interferência na tabela de trabalho/ },
  { category: ErrorCategory.ENTRADA_DIVERGENTE_DA_MASSA, match: /^(Error: )?entrada divergente da massa/ },
  { category: ErrorCategory.ELEMENT_NOT_FOUND, match: /no such element|could not locate|NoSuchElement/i },
  { category: ErrorCategory.WAIT_TIMEOUT, match: /wait for.*(to be|to exist)|timed out while waiting/i },
  { category: ErrorCategory.ELEMENT_NOT_INTERACTABLE, match: /not interactable|element not visible|is not clickable/i },
  { category: ErrorCategory.APP_NOT_RESPONDING, match: /not responding|ECONNREFUSED|session not created|crashed/i },
  { category: ErrorCategory.HTTP_CONTRACT_FAILURE, match: /expected status|status code \d+|schema validation/i },
  { category: ErrorCategory.PROCESS_INIT_FAILURE, match: /failed to start|unable to launch|spawn.*ENOENT/i },
]

// Registro de categorias descobertas automaticamente, compartilhado entre
// execuções (igual allure-results: sem namespace por sessionLabel, sem
// política de exclusão — só cresce). Todo erro que não bate com nenhuma RULE
// acima cai aqui: em vez de se perder dentro de um único
// "causa_nao_classificada" genérico pra sempre, a mesma FORMA de erro
// desconhecido (normalizada — ver normalizeSignature) sempre recebe a MESMA
// categoria nova entre rodadas, e uma forma nunca vista antes gera uma
// categoria nova na hora.
const REGISTRY_PATH = path.join('tests', 'reports', 'error-categories.json')

let registryCache = null

function loadRegistry() {
  if (registryCache) return registryCache
  if (!existsSync(REGISTRY_PATH)) {
    registryCache = {}
    return registryCache
  }
  try {
    registryCache = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'))
  } catch {
    registryCache = {}
  }
  return registryCache
}

function saveRegistry(registry) {
  mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true })
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8')
}

// Remove as partes variáveis da mensagem (UUID, número, texto entre aspas)
// pra que a MESMA falha com um AutomationId/linha/valor diferente ainda caia
// na mesma categoria descoberta, em vez de gerar uma categoria nova a cada
// execução.
function normalizeSignature(message) {
  return message
    .toLowerCase()
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<uuid>')
    .replace(/"[^"]*"|'[^']*'/g, '<valor>')
    .replace(/\d+/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
}

function slugifyForCategory(message) {
  const words = message
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
  const slug = words.join('_') || 'sem_descricao'
  return `descoberta_${slug}`.slice(0, 80)
}

function classifyUnknown(message) {
  if (!message) return { category: ErrorCategory.UNKNOWN, discovered: false }

  const signature = normalizeSignature(message)
  const registry = loadRegistry()
  if (registry[signature]) {
    return { category: registry[signature], discovered: true }
  }

  const category = slugifyForCategory(message)
  registry[signature] = category
  saveRegistry(registry)
  return { category, discovered: true }
}

export function classifyError(error) {
  const message = error?.message ?? String(error)
  const rule = RULES.find((r) => r.match.test(message))
  if (rule) {
    return {
      category: rule.category, message, stack: error?.stack, discovered: false,
    }
  }

  const { category, discovered } = classifyUnknown(message)
  return {
    category, message, stack: error?.stack, discovered,
  }
}
