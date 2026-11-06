import { Alert, Button, Card, Center, Group, Loader, SimpleGrid, Stack, Text } from '@mantine/core'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchSlots, type Slot } from '../../api/slots.ts'
import type { MeetingType } from '../../api/meetingTypes.ts'
import Calendar from './Calendar.tsx'
import {
  addDays,
  formatDateRu,
  OWNER_TIME_ZONE,
  slotTime,
  todayInOwnerZone,
} from '../../ownerTime.ts'

type SlotsResult = { status: 'ready'; slots: Slot[] } | { status: 'error' }

type CalendarStepProps = {
  meetingType: MeetingType
  selectedDate: string | null
  selectedSlot: string | null
  onSelectDate: (date: string) => void
  onSelectSlot: (slot: string) => void
  onContinue: () => void
  onBack: () => void
  // Увеличивается при возврате на шаг после гонки (409): слоты перезапрашиваются
  reloadToken: number
  // Показать сообщение о проигранной гонке за слот
  slotTaken: boolean
}

function CalendarStep({
  meetingType,
  selectedDate,
  selectedSlot,
  onSelectDate,
  onSelectSlot,
  onContinue,
  onBack,
  reloadToken,
  slotTaken,
}: CalendarStepProps) {
  const windowStart = useMemo(() => todayInOwnerZone(), [])
  const windowEnd = useMemo(() => addDays(windowStart, 13), [windowStart])

  // Кнопка «Повторить» при ошибке загрузки перезапрашивает слоты
  const [retryToken, setRetryToken] = useState(0)
  const requestKey = `${selectedDate ?? ''}#${reloadToken}#${retryToken}`
  // Результат последнего завершённого запроса слотов; пока ключ не совпал — идёт загрузка
  const [result, setResult] = useState<{ key: string; value: SlotsResult } | null>(null)

  useEffect(() => {
    if (!selectedDate) {
      return
    }
    const key = `${selectedDate}#${reloadToken}#${retryToken}`
    let cancelled = false
    fetchSlots(meetingType.id, selectedDate)
      .then((slots) => {
        if (!cancelled) {
          setResult({ key, value: { status: 'ready', slots } })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ key, value: { status: 'error' } })
        }
      })
    return () => {
      cancelled = true
    }
  }, [selectedDate, reloadToken, retryToken, meetingType.id])

  const retry = useCallback(() => {
    setRetryToken((token) => token + 1)
  }, [])

  const current = result?.key === requestKey ? result.value : null

  let slotsContent: ReactNode = <Text c="dimmed">Выберите дату в календаре</Text>
  if (selectedDate && current === null) {
    slotsContent = (
      <Center py="md">
        <output aria-label="Загрузка">
          <Loader />
        </output>
      </Center>
    )
  } else if (current?.status === 'error') {
    slotsContent = (
      <Alert color="red" title="Не удалось загрузить слоты">
        <Button variant="outline" color="red" size="xs" mt="sm" onClick={retry}>
          Повторить
        </Button>
      </Alert>
    )
  } else if (current?.status === 'ready') {
    // Заглушка — только когда слотов нет вовсе; занятые слоты показываются с меткой «Занято»
    if (current.slots.length === 0) {
      slotsContent = <Text c="dimmed">Нет свободных слотов</Text>
    } else {
      slotsContent = (
        <SimpleGrid cols={4} spacing="xs">
          {current.slots.map((slot) =>
            slot.status === 'free' ? (
              <Button
                key={slot.start}
                size="compact-sm"
                variant={selectedSlot === slot.start ? 'filled' : 'light'}
                onClick={() => onSelectSlot(slot.start)}
              >
                {slotTime(slot.start)}
              </Button>
            ) : (
              // Занятый слот виден гостю с меткой «Занято», но недоступен для выбора
              <Button key={slot.start} size="compact-sm" variant="light" color="gray" disabled>
                {slotTime(slot.start)} · Занято
              </Button>
            ),
          )}
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
          <Group mt="md" grow>
            <Button variant="default" onClick={onBack}>
              Назад
            </Button>
            <Button disabled={selectedSlot === null} onClick={onContinue}>
              Продолжить
            </Button>
          </Group>
        </Stack>
      </Card>
      <Stack gap="lg" style={{ flex: 1 }}>
        {slotTaken && <Alert color="orange" title="Это время уже занято" />}
        <section aria-label="Календарь">
          <Text fw={600} mb="xs">
            Календарь
          </Text>
          <Calendar
            windowStart={windowStart}
            windowEnd={windowEnd}
            selected={selectedDate}
            onSelect={onSelectDate}
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
