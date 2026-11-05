import { Container, Stack, Text, Title } from '@mantine/core'

function App() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="xs">
        <Title order={1}>Календарь звонков</Title>
        <Text c="dimmed">Сервис для бронирования встреч</Text>
      </Stack>
    </Container>
  )
}

export default App
