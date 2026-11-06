import { Alert, Button, Card, Center, Loader, Stack, Text } from '@mantine/core'
import { useCallback, useEffect, useState } from 'react'
import { fetchMeetingTypes, type MeetingType } from '../../api/meetingTypes.ts'

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; types: MeetingType[] }

function MeetingTypesTab() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(() => {
    fetchMeetingTypes()
      .then((types) => setState({ status: 'ready', types }))
      .catch(() => setState({ status: 'error' }))
  }, [])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    load()
  }, [load])

  useEffect(() => {
    load()
  }, [load])

  if (state.status === 'loading') {
    return (
      <Center py="xl">
        <output aria-label="Загрузка">
          <Loader />
        </output>
      </Center>
    )
  }

  if (state.status === 'error') {
    return (
      <Alert color="red" title="Не удалось загрузить типы встреч">
        <Button variant="outline" color="red" size="xs" mt="sm" onClick={retry}>
          Повторить
        </Button>
      </Alert>
    )
  }

  if (state.types.length === 0) {
    return <Text c="dimmed">Пока нет типов встреч</Text>
  }
  return (
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

export default MeetingTypesTab
