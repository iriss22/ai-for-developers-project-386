import { MantineProvider } from '@mantine/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { theme } from './theme.ts'

function renderApp() {
  return render(
    <MantineProvider theme={theme}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </MantineProvider>,
  )
}

describe('Главная страница', () => {
  it('показывает название сервиса, описание и кнопку записи', () => {
    renderApp()

    expect(screen.getByRole('heading', { level: 1, name: 'Календарь звонков' })).toBeInTheDocument()
    expect(screen.getByText(/без переписки/)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Записаться' }).length).toBeGreaterThan(0)
  })

  it('ведёт на /book по кнопке «Записаться»', () => {
    renderApp()

    fireEvent.click(screen.getAllByRole('link', { name: 'Записаться' })[0])

    expect(screen.getByRole('heading', { name: 'Запись на встречу' })).toBeInTheDocument()
  })

  it('ведёт на /admin по кнопке «Админка»', () => {
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'Админка' }))

    expect(screen.getByRole('heading', { name: 'Админка' })).toBeInTheDocument()
  })
})
