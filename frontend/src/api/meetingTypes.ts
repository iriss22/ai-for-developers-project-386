export type MeetingType = {
  id: number
  name: string
  description: string | null
  durationMinutes: number
}

export type NewMeetingType = {
  name: string
  description?: string
  durationMinutes: number
}

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

export async function fetchMeetingTypes(): Promise<MeetingType[]> {
  const response = await fetch('/api/meeting-types')
  if (!response.ok) {
    throw new ApiError(response.status)
  }
  return response.json()
}

export async function createMeetingType(payload: NewMeetingType): Promise<MeetingType> {
  const response = await fetch('/api/meeting-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (response.status === 400) {
    const body = (await response.json()) as { errors?: Record<string, string> }
    throw new ApiError(400, body.errors ?? {})
  }
  if (!response.ok) {
    throw new ApiError(response.status)
  }
  return response.json()
}
