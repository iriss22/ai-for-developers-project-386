import { ApiError } from './meetingTypes.ts'

export type Slot = {
  start: string
  status: 'free' | 'busy'
}

export async function fetchSlots(meetingTypeId: number, date: string): Promise<Slot[]> {
  const response = await fetch(`/api/slots?meetingTypeId=${meetingTypeId}&date=${date}`)
  if (!response.ok) {
    throw new ApiError(response.status)
  }
  return response.json()
}
