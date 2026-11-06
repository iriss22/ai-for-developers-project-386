import { Card, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { fetchMeetingTypes, type MeetingType } from '../../api/meetingTypes.ts'

function MeetingTypesTab() {
  const [types, setTypes] = useState<MeetingType[]>([])

  useEffect(() => {
    fetchMeetingTypes().then(setTypes)
  }, [])

  if (types.length === 0) {
    return <Text c="dimmed">Пока нет типов встреч</Text>
  }
  return (
    <Stack gap="sm">
      {types.map((type) => (
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
