import { Alert, Button, Card, Center, Group, Loader, Stack, Text } from '@mantine/core'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { fetchMeetingTypes, type MeetingType } from '../../api/meetingTypes.ts'
import MeetingTypeForm from './MeetingTypeForm.tsx'

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; types: MeetingType[] }

function MeetingTypesTab() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [formOpened, setFormOpened] = useState(false)

  const load = useCallback(() => {
    fetchMeetingTypes()
      .then((types) => setState({ status: 'ready', types }))
      .catch(() => setState({ status: 'error' }))
  }, [])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    load()
  }, [load])

  const handleCreated = useCallback((created: MeetingType) => {
    setState((prev) =>
      prev.status === 'ready' ? { status: 'ready', types: [...prev.types, created] } : prev,
    )
  }, [])

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
      <Alert color="red" title="Не удалось загрузить типы встреч">
        <Button variant="outline" color="red" size="xs" mt="sm" onClick={retry}>
          Повторить
        </Button>
      </Alert>
    )
  } else if (state.types.length === 0) {
    content = <Text c="dimmed">Пока нет типов встреч</Text>
  } else {
    content = (
      <Stack gap="sm">
        {state.types.map((type) => (
          <Card key={type.id} withBorder padding="md">
            <Text fw={600}>{type.name}</Text>
            {type.description && (
              <Text c="dimmed" size="sm">
                {type.description}
              </Text>
            )}
            <Text size="sm">{type.durationMinutes} мин</Text>
          </Card>
        ))}
      </Stack>
    )
  }

  return (
    <Stack gap="md">
      <Group justify="flex-end">
        <Button onClick={() => setFormOpened(true)}>Создать событие</Button>
      </Group>
      {content}
      <MeetingTypeForm
        opened={formOpened}
        onClose={() => setFormOpened(false)}
        onCreated={handleCreated}
      />
    </Stack>
  )
}

export default MeetingTypesTab
