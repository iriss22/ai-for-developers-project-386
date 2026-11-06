import { Alert, Button, Card, Center, Group, Loader, SimpleGrid, Stack, Text } from '@mantine/core'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { fetchSlots, type Slot } from '../../api/slots.ts'
import type { MeetingType } from '../../api/meetingTypes.ts'
import Calendar from './Calendar.tsx'
import { addDays, formatDateRu, OWNER_TIME_ZONE, slotTime, todayInOwnerZone } from './ownerTime.ts'

type SlotsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; slots: Slot[] }

type CalendarStepProps = {
  meetingType: MeetingType
  onContinue: () => void
}

function CalendarStep({ meetingType, onContinue }: CalendarStepProps) {
  const windowStart = useMemo(() => todayInOwnerZone(), [])
  const windowEnd = useMemo(() => addDays(windowStart, 13), [windowStart])

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slotsState, setSlotsState] = useState<SlotsState>({ status: 'idle' })

  const loadSlots = useCallback(
    (date: string) => {
      fetchSlots(meetingType.id, date)
        .then((slots) => setSlotsState({ status: 'ready', slots }))
        .catch(() => setSlotsState({ status: 'error' }))
    },
    [meetingType.id],
  )

  const selectDate = useCallback(
    (date: string) => {
      setSelectedDate(date)
      setSelectedSlot(null)
      setSlotsState({ status: 'loading' })
      loadSlots(date)
    },
    [loadSlots],
  )

  const retry = useCallback(() => {
    if (selectedDate) {
      setSlotsState({ status: 'loading' })
      loadSlots(selectedDate)
    }
  }, [selectedDate, loadSlots])

  let slotsContent: ReactNode = <Text c="dimmed">Выберите дату в календаре</Text>
  if (slotsState.status === 'loading') {
    slotsContent = (
      <Center py="md">
        <output aria-label="Загрузка">
          <Loader />
        </output>
      </Center>
    )
  } else if (slotsState.status === 'error') {
    slotsContent = (
      <Alert color="red" title="Не удалось загрузить слоты">
        <Button variant="outline" color="red" size="xs" mt="sm" onClick={retry}>
          Повторить
        </Button>
      </Alert>
    )
  } else if (slotsState.status === 'ready') {
    if (slotsState.slots.every((slot) => slot.status !== 'free')) {
      slotsContent = <Text c="dimmed">Нет свободных слотов</Text>
    } else {
      slotsContent = (
        <SimpleGrid cols={4} spacing="xs">
          {slotsState.slots.map((slot) => (
            <Button
              key={slot.start}
              size="compact-sm"
              variant={selectedSlot === slot.start ? 'filled' : 'light'}
              color={slot.status === 'free' ? undefined : 'gray'}
              disabled={slot.status !== 'free'}
              onClick={() => setSelectedSlot(slot.start)}
            >
              {slotTime(slot.start)}
            </Button>
          ))}
        </SimpleGrid>
      )
    }
  }

  return (
    <Group align="flex-start" gap="lg" mt="md">
      <Card withBorder padding="md" w={280}>
        <Stack gap="xs">
          <Text fw={600}>{meetingType.name}</Text>
          <Text size="sm" c="dimmed">
            {meetingType.durationMinutes} мин
          </Text>
          <Text size="sm" fw={500} mt="sm">
            Выбранная дата
          </Text>
          <Text size="sm">{selectedDate ? formatDateRu(selectedDate) : '—'}</Text>
          <Text size="sm" fw={500}>
            Выбранное время
          </Text>
          <Text size="sm">
            {selectedSlot ? `${slotTime(selectedSlot)} (${OWNER_TIME_ZONE})` : '—'}
          </Text>
          <Button mt="md" disabled={selectedSlot === null} onClick={onContinue}>
            Продолжить
          </Button>
        </Stack>
      </Card>
      <Stack gap="lg" style={{ flex: 1 }}>
        <section aria-label="Календарь">
          <Text fw={600} mb="xs">
            Календарь
          </Text>
          <Calendar
            windowStart={windowStart}
            windowEnd={windowEnd}
            selected={selectedDate}
            onSelect={selectDate}
          />
        </section>
        <section aria-label="Статус слотов">
          <Text fw={600} mb="xs">
            Статус слотов
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            Часовой пояс владельца: {OWNER_TIME_ZONE}
          </Text>
          {slotsContent}
        </section>
      </Stack>
    </Group>
  )
}

export default CalendarStep
