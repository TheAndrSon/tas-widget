import { MONTH_NAMES_GENITIVE, pad2 } from '@shared/holidays'
import type { WeatherUnits } from '@shared/types'
import type { WeekdayLanguage } from '@shared/types'

const WEEKDAYS: Record<WeekdayLanguage, { full: string[]; short: string[] }> = {
  ru: {
    full: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'],
    short: ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
  },
  en: {
    full: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    short: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  }
}

export function weekdayName(date: Date, language: WeekdayLanguage, short: boolean): string {
  const index = (date.getDay() + 6) % 7
  return WEEKDAYS[language][short ? 'short' : 'full'][index]
}

export function formatWeekdayDate(
  date: Date,
  language: WeekdayLanguage,
  format: 'long' | 'numeric' | 'short'
): string {
  const locale = language === 'ru' ? 'ru-RU' : 'en-GB'
  if (format === 'numeric') {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  }
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: format === 'short' ? 'short' : 'long'
  }).format(date)
}

export function capitalize(text: string): string {
  return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

export function formatDayMonth(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES_GENITIVE[date.getMonth()]}`
}

export function pad2Date(date: Date): string {
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`
}

export function formatDateFull(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES_GENITIVE[date.getMonth()]} ${date.getFullYear()}`
}

export function formatWeekday(date: Date, short = false): string {
  return capitalize(
    new Intl.DateTimeFormat('ru-RU', { weekday: short ? 'short' : 'long' }).format(date)
  )
}

export function formatMonthYear(date: Date): string {
  return `${MONTH_NAMES_GENITIVE[date.getMonth()]} ${date.getFullYear()}`
}

export function formatMonthTitle(date: Date): string {
  const nominative = [
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
  return `${nominative[date.getMonth()]} ${date.getFullYear()}`
}

export function formatClock(date: Date, format24: boolean, seconds: boolean): {
  hh: string
  mm: string
  ss: string
  suffix: string
} {
  const h24 = date.getHours()
  const hour = format24 ? h24 : h24 % 12 || 12
  return {
    hh: pad2(hour),
    mm: pad2(date.getMinutes()),
    ss: pad2(date.getSeconds()),
    suffix: format24 ? '' : h24 < 12 ? 'AM' : 'PM'
  }
}

export function clockInZone(
  date: Date,
  timeZone: string | null | undefined,
  format24: boolean,
  seconds: boolean
): { hh: string; mm: string; ss: string; suffix: string } {
  if (!timeZone) return formatClock(date, format24, seconds)
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      ...(seconds ? { second: '2-digit' } : {}),
      hour12: !format24,
      timeZone
    }).formatToParts(date)
    const get = (type: string): string => parts.find((part) => part.type === type)?.value ?? ''
    return {
      hh: get('hour') || '00',
      mm: get('minute') || '00',
      ss: get('second') || '00',
      suffix: format24 ? '' : get('dayPeriod').toUpperCase()
    }
  } catch {
    return formatClock(date, format24, seconds)
  }
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0:00'
  const total = Math.floor(ms / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${pad2(seconds)}`
}

export function formatTemp(value: number, units: WeatherUnits): string {
  return `${value}°${units === 'imperial' ? 'F' : 'C'}`
}

export function formatWind(value: number, units: WeatherUnits): string {
  return units === 'imperial' ? `${value} миль/ч` : `${value} м/с`
}
