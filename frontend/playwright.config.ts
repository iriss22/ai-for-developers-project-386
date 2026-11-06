import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

// Бэкенд и фронтенд поднимаются на свободных портах (не совпадающих с dev-портами
// 8080/5173 из vite.config.ts), чтобы e2e не конфликтовал с параллельным `mise run dev`.
const BACKEND_PORT = 8099
const FRONTEND_PORT = 4399

// Имя env-переменной, через которую vite.config.ts узнаёт порт бэкенда для preview.proxy
// (см. CALENDAR_API_PORT в frontend/vite.config.ts).
const BACKEND_PORT_ENV_VAR = 'CALENDAR_API_PORT'

function findBackendJar(): string {
  const targetDir = join(import.meta.dirname, '../backend/target')
  if (!existsSync(targetDir)) {
    throw new Error(
      `Не найден backend/target: ${targetDir}. Соберите jar перед e2e (mise run build:backend).`,
    )
  }
  const jar = readdirSync(targetDir).find(
    (name) => name.endsWith('.jar') && !name.endsWith('-sources.jar'),
  )
  if (!jar) {
    throw new Error(
      `В ${targetDir} нет jar-файла. Соберите jar перед e2e (mise run build:backend).`,
    )
  }
  return join(targetDir, jar)
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      // Собранный бэкенд на свободном порту с пустым in-memory хранилищем (свежий процесс).
      command: `java -jar ${findBackendJar()}`,
      env: { SERVER_PORT: String(BACKEND_PORT) },
      url: `http://localhost:${BACKEND_PORT}/api/meeting-types`,
      reuseExistingServer: false,
      timeout: 60_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // Собранный фронтенд (vite preview), проксирующий /api на бэкенд выше (см. vite.config.ts).
      command: `npx vite preview --port ${FRONTEND_PORT} --strictPort`,
      env: { [BACKEND_PORT_ENV_VAR]: String(BACKEND_PORT) },
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: false,
      timeout: 30_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})
