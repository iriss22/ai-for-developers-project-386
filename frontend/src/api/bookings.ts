import { ApiError } from './meetingTypes.ts'

type BookingMeetingType = {
  id: number
  name: string
  durationMinutes: number
}

export type Booking = {
  id: number
  start: string
  guestName: string
  guestEmail: string
  note: string | null
  meetingType: BookingMeetingType
}

export type NewBooking = {
  meetingTypeId: number
  start: string
  guestName: string
  guestEmail: string
  note?: string
}

export async function createBooking(payload: NewBooking): Promise<Booking> {
  const response = await fetch('/api/bookings', {
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
