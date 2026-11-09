import type { StickerKind } from './types'

export const CUTE_STICKERS: StickerKind[] = ['heart', 'sun', 'star', 'flower', 'smile', 'moon']
export const GOTHIC_STICKERS: StickerKind[] = ['skull', 'bat', 'moon', 'coffin', 'spider', 'star']

export const STICKER_LABELS: Record<StickerKind, string> = {
  heart: 'Сердечко',
  sun: 'Солнышко',
  star: 'Звёздочка',
  flower: 'Цветочек',
  smile: 'Смайлик',
  skull: 'Череп',
  bat: 'Летучая мышь',
  moon: 'Луна',
  coffin: 'Гроб',
  spider: 'Паук',
  custom: 'Своя картинка'
}

export function toIso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseIso(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

export function startOfWeek(date = new Date()): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = copy.getDay()
  const shift = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + shift)
  return copy
}

export function weekDates(date = new Date()): string[] {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return toIso(day)
  })
}

export function dayLabel(iso: string): string {
  const date = parseIso(iso)
  if (!date) return iso
  return date.toLocaleDateString('ru-RU', { weekday: 'short' })
}

export function shortDate(iso: string): string {
  const date = parseIso(iso)
  if (!date) return iso
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function isToday(iso: string): boolean {
  return iso === toIso(new Date())
}

export function uid(prefix = 'item'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}
