import { Text } from '@mantine/core'
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
  return null
}

export default MeetingTypesTab
