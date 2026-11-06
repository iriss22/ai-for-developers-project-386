import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
})
