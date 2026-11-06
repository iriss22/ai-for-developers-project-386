import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '../test/server.ts'
import { theme } from '../theme.ts'
import BookPage from './BookPage.tsx'

const INTERVIEW = {
  id: 1,
  name: 'Интервью',
  description: 'Техническое интервью',
  durationMinutes: 60,
}
const RESUME = { id: 2, name: 'Разбор резюме', description: null, durationMinutes: 30 }

function renderBook() {
  return render(
    <MantineProvider theme={theme}>
      <BookPage />
    </MantineProvider>,
  )
}

describe('Мастер записи: шаг 1 «Выберите тип события»', () => {
  it('показывает карточки типов встреч и ведёт на шаг календаря по клику', async () => {
    server.use(http.get('/api/meeting-types', () => HttpResponse.json([INTERVIEW, RESUME])))
    renderBook()

    expect(await screen.findByRole('button', { name: /Интервью/ })).toBeInTheDocument()
    expect(screen.getByText('Техническое интервью')).toBeInTheDocument()
    expect(screen.getByText('60 мин')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Разбор резюме/ })).toBeInTheDocument()
    expect(screen.getByText('30 мин')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Интервью/ }))

    expect(await screen.findByText('Календарь')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Разбор резюме/ })).not.toBeInTheDocument()
  })

  it('показывает заглушку «Пока нет доступных встреч», когда типов нет, и не даёт пройти дальше', async () => {
    renderBook()

    expect(await screen.findByText('Пока нет доступных встреч')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Интервью/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Календарь')).not.toBeInTheDocument()
  })

  it('показывает индикатор загрузки, пока типы загружаются', async () => {
    server.use(
      http.get('/api/meeting-types', async () => {
        await delay(100)
        return HttpResponse.json([])
      }),
    )
    renderBook()

    expect(screen.getByRole('status', { name: 'Загрузка' })).toBeInTheDocument()
    expect(await screen.findByText('Пока нет доступных встреч')).toBeInTheDocument()
  })

  it('показывает сообщение об ошибке с кнопкой «Повторить» и загружает типы повторно', async () => {
    server.use(http.get('/api/meeting-types', () => HttpResponse.error()))
    renderBook()

    expect(await screen.findByText('Не удалось загрузить типы встреч')).toBeInTheDocument()

    server.use(http.get('/api/meeting-types', () => HttpResponse.json([INTERVIEW])))
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(await screen.findByRole('button', { name: /Интервью/ })).toBeInTheDocument()
  })
})

describe('Мастер записи: шаг 2 — календарь и слоты', () => {
  beforeEach(() => {
    // «Сейчас» — 25.11.2026 09:00 по поясу владельца: окно записи 25.11–08.12
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-25T09:00:00+03:00'))
    server.use(http.get('/api/meeting-types', () => HttpResponse.json([INTERVIEW])))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  async function goToCalendarStep() {
    renderBook()
    fireEvent.click(await screen.findByRole('button', { name: /Интервью/ }))
    await screen.findByText('Календарь')
  }

  it('приглушает дни вне окна записи и не даёт их выбрать', async () => {
    await goToCalendarStep()

    expect(screen.getByRole('button', { name: '24' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '25' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '30' })).toBeEnabled()
  })

  it('листает стрелками только месяцы, пересекающие окно записи', async () => {
    await goToCalendarStep()

    expect(screen.getByText(/ноябрь 2026/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Предыдущий месяц' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Следующий месяц' }))

    expect(screen.getByText(/декабрь 2026/i)).toBeInTheDocument()
    // Последний день окна — 8 декабря: день 8 доступен, день 9 — нет
    expect(screen.getByRole('button', { name: '8' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '9' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Следующий месяц' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Предыдущий месяц' })).toBeEnabled()
  })

  it('держит «Продолжить» неактивной, пока не выбран слот, и показывает выбор с подписью пояса', async () => {
    server.use(
      http.get('/api/slots', ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('meetingTypeId')).toBe('1')
        expect(url.searchParams.get('date')).toBe('2026-11-26')
        return HttpResponse.json([
          { start: '2026-11-26T09:00:00+03:00', status: 'free' },
          { start: '2026-11-26T09:15:00+03:00', status: 'busy' },
        ])
      }),
    )
    await goToCalendarStep()

    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: '26' }))

    const freeSlot = await screen.findByRole('button', { name: '09:00' })
    // Занятый слот выбрать нельзя
    expect(screen.getByRole('button', { name: '09:15' })).toBeDisabled()

    fireEvent.click(freeSlot)

    expect(screen.getByText('Выбранная дата')).toBeInTheDocument()
    expect(screen.getByText('26.11.2026')).toBeInTheDocument()
    expect(screen.getByText('Выбранное время')).toBeInTheDocument()
    expect(screen.getByText('09:00 (Europe/Moscow)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeEnabled()
  })

  it('показывает заглушку «Нет свободных слотов», когда на дату ничего нет', async () => {
    server.use(http.get('/api/slots', () => HttpResponse.json([])))
    await goToCalendarStep()

    fireEvent.click(screen.getByRole('button', { name: '26' }))

    expect(await screen.findByText('Нет свободных слотов')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeDisabled()
  })

  it('показывает ошибку загрузки слотов с кнопкой «Повторить»', async () => {
    server.use(http.get('/api/slots', () => HttpResponse.error()))
    await goToCalendarStep()

    fireEvent.click(screen.getByRole('button', { name: '26' }))

    expect(await screen.findByText('Не удалось загрузить слоты')).toBeInTheDocument()

    server.use(
      http.get('/api/slots', () =>
        HttpResponse.json([{ start: '2026-11-26T09:00:00+03:00', status: 'free' }]),
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(await screen.findByRole('button', { name: '09:00' })).toBeInTheDocument()
  })

  it('ведёт кнопкой «Продолжить» на заглушку следующего шага', async () => {
    server.use(
      http.get('/api/slots', () =>
        HttpResponse.json([{ start: '2026-11-26T09:00:00+03:00', status: 'free' }]),
      ),
    )
    await goToCalendarStep()

    fireEvent.click(screen.getByRole('button', { name: '26' }))
    fireEvent.click(await screen.findByRole('button', { name: '09:00' }))
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }))

    expect(await screen.findByText('Страница в разработке')).toBeInTheDocument()
  })
})
