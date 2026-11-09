import nonWorkingRaw from './nonWorking.json'

/**
 * Нерабочие дни РФ. Базовые праздники заданы по ТК РФ (ст. 112),
 * дополнительные нерабочие дни (переносы) взяты из isdayoff.ru.
 * Для годов вне таблицы остаются только базовые праздники — календарь продолжит работать.
 */
const NON_WORKING = nonWorkingRaw as Record<string, string[]>

const FIXED_HOLIDAYS: Array<{ md: string; name: string }> = [
  { md: '01-01', name: 'Новый год' },
  { md: '01-02', name: 'Новогодние каникулы' },
  { md: '01-03', name: 'Новогодние каникулы' },
  { md: '01-04', name: 'Новогодние каникулы' },
  { md: '01-05', name: 'Новогодние каникулы' },
  { md: '01-06', name: 'Новогодние каникулы' },
  { md: '01-07', name: 'Рождество Христово' },
  { md: '01-08', name: 'Новогодние каникулы' },
  { md: '02-23', name: 'День защитника Отечества' },
  { md: '03-08', name: 'Международный женский день' },
  { md: '05-01', name: 'Праздник Весны и Труда' },
  { md: '05-09', name: 'День Победы' },
  { md: '06-12', name: 'День России' },
  { md: '11-04', name: 'День народного единства' }
]

const FIXED_MAP = new Map(FIXED_HOLIDAYS.map((h) => [h.md, h.name]))

export const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь'
]

export const MONTH_NAMES_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря'
]

export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const WEEKDAYS_FULL = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье'
]

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** Локальная дата в формате YYYY-MM-DD (без сдвига часового пояса). */
export function toISO(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function monthDayKey(date: Date): string {
  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export interface HolidayInfo {
  isHoliday: boolean
  name?: string
  /** официальный нерабочий день из переносов */
  transfer?: boolean
}

export function getHoliday(date: Date): HolidayInfo {
  const md = monthDayKey(date)
  const fixed = FIXED_MAP.get(md)
  if (fixed) return { isHoliday: true, name: fixed }
  const list = NON_WORKING[String(date.getFullYear())]
  if (list && list.includes(md)) return { isHoliday: true, name: 'Нерабочий день', transfer: true }
  return { isHoliday: false }
}

/** Понедельник = 0 ... воскресенье = 6 */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - weekdayIndex(d))
  return d
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  )
}

/** ISO-номер недели. */
export function isoWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export interface MonthCell {
  date: Date
  inMonth: boolean
}

/** Сетка месяца, неделя начинается с понедельника. */
export function monthMatrix(year: number, month: number): MonthCell[][] {
  const first = new Date(year, month, 1)
  const start = startOfWeek(first)
  const weeks: MonthCell[][] = []
  let cursor = start
  for (let w = 0; w < 6; w++) {
    const week: MonthCell[] = []
    for (let d = 0; d < 7; d++) {
      week.push({ date: cursor, inMonth: cursor.getMonth() === month })
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
  }
  return weeks
}
