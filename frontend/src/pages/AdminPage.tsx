import { Container, Tabs, Text, Title } from '@mantine/core'
import MeetingTypesTab from './admin/MeetingTypesTab.tsx'

function AdminPage() {
  return (
    <Container size="md" py="xl">
      <Title order={2}>Админка</Title>
      <Tabs defaultValue="meeting-types" mt="md">
        <Tabs.List>
          <Tabs.Tab value="meeting-types">Типы встреч</Tabs.Tab>
          <Tabs.Tab value="upcoming">Предстоящие встречи</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="meeting-types" pt="md">
          <MeetingTypesTab />
        </Tabs.Panel>
        <Tabs.Panel value="upcoming" pt="md">
          <Text c="dimmed">Страница в разработке</Text>
        </Tabs.Panel>
      </Tabs>
    </Container>
  )
}

export default AdminPage
