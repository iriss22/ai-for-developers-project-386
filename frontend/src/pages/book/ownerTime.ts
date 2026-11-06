// Часовой пояс владельца — тот же, что в конфигурации бэкенда (calendar.owner-timezone).
// В нём заданы границы дня и окно записи; гость видит время в нём же, конвертации нет.
export const OWNER_TIME_ZONE = 'Europe/Moscow'

const ownerDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: OWNER_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function todayInOwnerZone(): string {
  return ownerDateFormatter.format(new Date())
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

// 'YYYY-MM-DD' → 'dd.mm.yyyy'
export function formatDateRu(date: string): string {
  const [year, month, day] = date.split('-')
  return `${day}.${month}.${year}`
}

// Время старта слота из ISO-строки с offset пояса владельца: '2026-11-26T09:00:00+03:00' → '09:00'
export function slotTime(start: string): string {
  return start.slice(11, 16)
}
