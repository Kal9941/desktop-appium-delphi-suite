// Service Object — chamada HTTP direta à API de link de pagamento, sem UI.
// Única parte do app que fala REST; o restante do domínio é Firebird 2.5
// direto e fica fora do escopo de teste automatizado por enquanto
// (ver .agents/PROJECT_CONTEXT.md).
//
// PENDÊNCIA: baseUrl/apiKey ainda não fornecidos — preencher em env.json
// (paymentLinkApi.baseUrl / paymentLinkApi.apiKey) antes de usar em teste real.
export class PaymentLinkService {
  constructor({ baseUrl, apiKey }) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  async createPaymentLink(payload) {
    const response = await fetch(`${this.baseUrl}/payment-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`expected status 2xx, got status code ${response.status}`)
    }

    return response.json()
  }
}
