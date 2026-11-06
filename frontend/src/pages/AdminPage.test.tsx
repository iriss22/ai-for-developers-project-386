import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
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

  it('показывает индикатор загрузки, пока список загружается', async () => {
    server.use(
      http.get('/api/meeting-types', async () => {
        await delay(100)
        return HttpResponse.json([])
      }),
    )
    renderAdmin()

    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
    expect(await screen.findByText('Пока нет типов встреч')).toBeInTheDocument()
  })

  it('показывает сообщение об ошибке с кнопкой «Повторить» и загружает список повторно', async () => {
    server.use(http.get('/api/meeting-types', () => HttpResponse.error()))
    renderAdmin()

    expect(await screen.findByText('Не удалось загрузить типы встреч')).toBeInTheDocument()

    server.use(
      http.get('/api/meeting-types', () =>
        HttpResponse.json([{ id: 1, name: 'Интервью', description: null, durationMinutes: 60 }]),
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(await screen.findByText('Интервью')).toBeInTheDocument()
  })

  it('создаёт тип встречи через форму по кнопке «Создать событие»', async () => {
    let requestBody: unknown
    server.use(
      http.post('/api/meeting-types', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json(
          { id: 1, name: 'Интервью', description: 'Техническое интервью', durationMinutes: 60 },
          { status: 201 },
        )
      }),
    )
    renderAdmin()

    fireEvent.click(await screen.findByRole('button', { name: 'Создать событие' }))
    fireEvent.change(await screen.findByRole('textbox', { name: 'Название' }), {
      target: { value: 'Интервью' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Описание' }), {
      target: { value: 'Техническое интервью' },
    })
    fireEvent.click(screen.getByRole('radio', { name: '60 минут' }))
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(await screen.findByText('Интервью')).toBeInTheDocument()
    expect(screen.getByText('60 мин')).toBeInTheDocument()
    expect(requestBody).toEqual({
      name: 'Интервью',
      description: 'Техническое интервью',
      durationMinutes: 60,
    })
  })
})
