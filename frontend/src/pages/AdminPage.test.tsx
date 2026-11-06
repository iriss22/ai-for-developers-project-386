import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server.ts'
import { theme } from '../theme.ts'
import AdminPage from './AdminPage.tsx'

function renderAdmin() {
  return render(
    <MantineProvider theme={theme}>
      <AdminPage />
    </MantineProvider>,
  )
}

describe('Админка: вкладка «Типы встреч»', () => {
  it('показывает заглушку, когда типов встреч нет', async () => {
    renderAdmin()

    expect(await screen.findByText('Пока нет типов встреч')).toBeInTheDocument()
  })

  it('показывает список типов встреч с названием, описанием и длительностью', async () => {
    server.use(
      http.get('/api/meeting-types', () =>
        HttpResponse.json([
          { id: 1, name: 'Интервью', description: 'Техническое интервью', durationMinutes: 60 },
          { id: 2, name: 'Разбор резюме', description: null, durationMinutes: 30 },
        ]),
      ),
    )
    renderAdmin()

    expect(await screen.findByText('Интервью')).toBeInTheDocument()
    expect(screen.getByText('Техническое интервью')).toBeInTheDocument()
    expect(screen.getByText('60 мин')).toBeInTheDocument()
    expect(screen.getByText('Разбор резюме')).toBeInTheDocument()
    expect(screen.getByText('30 мин')).toBeInTheDocument()
  })
})
