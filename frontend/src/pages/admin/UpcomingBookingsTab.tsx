import { Alert, Button, Card, Center, Loader, Stack, Text } from '@mantine/core'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { fetchBookings, type Booking } from '../../api/bookings.ts'
import { formatOwnerInterval } from '../../ownerTime.ts'

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; bookings: Booking[] }

function UpcomingBookingsTab() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(() => {
    fetchBookings()
      .then((bookings) => setState({ status: 'ready', bookings }))
      .catch(() => setState({ status: 'error' }))
  }, [])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    load()
  }, [load])

  useEffect(() => {
    load()
  }, [load])

  let content: ReactNode
  if (state.status === 'loading') {
    content = (
      <Center py="xl">
        <output aria-label="Загрузка">
          <Loader />
        </output>
      </Center>
    )
  } else if (state.status === 'error') {
    content = (
      <Alert color="red" title="Не удалось загрузить предстоящие встречи">
        <Button variant="outline" color="red" size="xs" mt="sm" onClick={retry}>
          Повторить
        </Button>
      </Alert>
    )
  } else if (state.bookings.length === 0) {
    content = <Text c="dimmed">Предстоящих встреч нет</Text>
  } else {
    content = (
      <Stack gap="sm">
        {state.bookings.map((booking) => (
          <Card key={booking.id} withBorder padding="md">
            <Text fw={600}>{booking.meetingType.name}</Text>
            <Text size="sm">
              {formatOwnerInterval(booking.start, booking.meetingType.durationMinutes)}
            </Text>
            <Text size="sm">{booking.guestName}</Text>
            <Text size="sm" c="dimmed">
              {booking.guestEmail}
            </Text>
            {booking.note && (
              <Text size="sm" c="dimmed">
                {booking.note}
              </Text>
            )}
          </Card>
        ))}
      </Stack>
    )
  }

  return content
}

export default UpcomingBookingsTab
