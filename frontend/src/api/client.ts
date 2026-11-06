export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, fieldErrors: Record<string, string> = {}) {
    super(`Запрос завершился со статусом ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// Общий разбор ответа API: 400 → ApiError с ошибками полей из тела {"errors": {...}},
// прочие неуспешные статусы → ApiError со статусом
async function parse<T>(response: Response): Promise<T> {
  if (response.status === 400) {
    const body = (await response.json().catch(() => ({}))) as {
      errors?: Record<string, string>
    }
    throw new ApiError(400, body.errors ?? {})
  }
  if (!response.ok) {
    throw new ApiError(response.status)
  }
  return response.json() as Promise<T>
}

export async function getJson<T>(url: string): Promise<T> {
  return parse<T>(await fetch(url))
}

export async function postJson<T>(url: string, payload: unknown): Promise<T> {
  return parse<T>(
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  )
}
