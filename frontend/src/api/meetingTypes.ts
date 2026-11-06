import { getJson, postJson } from './client.ts'

export type MeetingType = {
  id: number
  name: string
  description: string | null
  durationMinutes: number
}

type NewMeetingType = {
  name: string
  description?: string
  durationMinutes: number
}

export function fetchMeetingTypes(): Promise<MeetingType[]> {
  return getJson('/api/meeting-types')
}

export function createMeetingType(payload: NewMeetingType): Promise<MeetingType> {
  return postJson('/api/meeting-types', payload)
}
