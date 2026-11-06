import { getJson, postJson } from './client.ts'

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

type NewBooking = {
  meetingTypeId: number
  start: string
  guestName: string
  guestEmail: string
  note?: string
}

export function fetchBookings(): Promise<Booking[]> {
  return getJson('/api/bookings')
}

export function createBooking(payload: NewBooking): Promise<Booking> {
  return postJson('/api/bookings', payload)
}
