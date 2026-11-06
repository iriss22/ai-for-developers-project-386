import {
  Alert,
  Button,
  Card,
  Center,
  Container,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { fetchMeetingTypes, type MeetingType } from '../api/meetingTypes.ts'
import StubPage from './StubPage.tsx'
import CalendarStep from './book/CalendarStep.tsx'

type TypesState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; types: MeetingType[] }

function BookPage() {
  const [typesState, setTypesState] = useState<TypesState>({ status: 'loading' })
  const [selectedType, setSelectedType] = useState<MeetingType | null>(null)
  const [continued, setContinued] = useState(false)

  const load = useCallback(() => {
    fetchMeetingTypes()
      .then((types) => setTypesState({ status: 'ready', types }))
      .catch(() => setTypesState({ status: 'error' }))
  }, [])

  const retry = useCallback(() => {
    setTypesState({ status: 'loading' })
    load()
  }, [load])

  useEffect(() => {
    load()
  }, [load])

  if (continued && selectedType) {
    // Заглушка следующего шага мастера: форму бронирования добавит тикет #13
    return <StubPage title="Форма бронирования" />
  }

  let content: ReactNode
  if (selectedType) {
    content = <CalendarStep meetingType={selectedType} onContinue={() => setContinued(true)} />
  } else if (typesState.status === 'loading') {
    content = (
      <Center py="xl">
        <output aria-label="Загрузка">
          <Loader />
        </output>
      </Center>
    )
  } else if (typesState.status === 'error') {
    content = (
      <Alert color="red" title="Не удалось загрузить типы встреч">
        <Button variant="outline" color="red" size="xs" mt="sm" onClick={retry}>
          Повторить
        </Button>
      </Alert>
    )
  } else if (typesState.types.length === 0) {
    content = <Text c="dimmed">Пока нет доступных встреч</Text>
  } else {
    content = (
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {typesState.types.map((type) => (
          <UnstyledButton key={type.id} onClick={() => setSelectedType(type)}>
            <Card withBorder padding="md" h="100%">
              <Text fw={600}>{type.name}</Text>
              {type.description && (
                <Text c="dimmed" size="sm">
                  {type.description}
                </Text>
              )}
              <Text size="sm">{type.durationMinutes} мин</Text>
            </Card>
          </UnstyledButton>
        ))}
      </SimpleGrid>
    )
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2}>Запись на встречу</Title>
      {!selectedType && (
        <Title order={3} mt="md">
          Выберите тип события
        </Title>
      )}
      <Stack gap="md" mt="md">
        {content}
      </Stack>
    </Container>
  )
}

export default BookPage
