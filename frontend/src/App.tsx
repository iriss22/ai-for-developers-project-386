import { Anchor, AppShell, Button, Group } from '@mantine/core'
import { Link, Route, Routes } from 'react-router'
import HomePage from './pages/HomePage.tsx'
import StubPage from './pages/StubPage.tsx'

function App() {
  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Anchor component={Link} to="/" c="inherit" fw={700} underline="never">
            Календарь звонков
          </Anchor>
          <Group gap="sm">
            <Button component={Link} to="/admin" variant="subtle">
              Админка
            </Button>
            <Button component={Link} to="/book">
              Записаться
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<StubPage title="Запись на встречу" />} />
          <Route path="/admin" element={<StubPage title="Админка" />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App
