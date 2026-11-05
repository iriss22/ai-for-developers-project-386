import { Container, Text, Title } from '@mantine/core'

type StubPageProps = {
  title: string
}

function StubPage({ title }: StubPageProps) {
  return (
    <Container size="sm" py="xl">
      <Title order={2}>{title}</Title>
      <Text c="dimmed" mt="xs">
        Страница в разработке
      </Text>
    </Container>
  )
}

export default StubPage
