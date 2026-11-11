export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** Локальная дата в формате YYYY-MM-DD (без сдвига часового пояса). */
export function toISO(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}
