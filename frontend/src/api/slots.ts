import { getJson } from './client.ts'

export type Slot = {
  start: string
  status: 'free' | 'busy'
}

export function fetchSlots(meetingTypeId: number, date: string): Promise<Slot[]> {
  const query = new URLSearchParams({ meetingTypeId: String(meetingTypeId), date })
  return getJson(`/api/slots?${query}`)
}
