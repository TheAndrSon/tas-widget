import type { SimsAction, SimsMood } from './types'

export const NEEDS: Array<{ key: keyof Pick<SimsMood, 'hunger' | 'energy' | 'fun' | 'social' | 'hygiene'>; label: string; action: SimsAction }> = [
  { key: 'hunger', label: 'Голод', action: 'feed' },
  { key: 'energy', label: 'Энергия', action: 'sleep' },
  { key: 'fun', label: 'Веселье', action: 'play' },
  { key: 'social', label: 'Общение', action: 'chat' },
  { key: 'hygiene', label: 'Гигиена', action: 'shower' }
]

export function moodColor(mood: number): string {
  if (mood >= 80) return '#7ef29b'
  if (mood >= 62) return '#c7f26b'
  if (mood >= 45) return '#ffd166'
  if (mood >= 28) return '#ff9f5c'
  if (mood >= 15) return '#62a8ff'
  return '#ff6b6b'
}

export function moodLabel(mood: number): string {
  if (mood >= 80) return 'счастлив'
  if (mood >= 62) return 'хорошо'
  if (mood >= 45) return 'неуютно'
  if (mood >= 28) return 'напряжён'
  if (mood >= 15) return 'грустит'
  return 'злится'
}

export function moodState(mood: SimsMood): string {
  const lowest = NEEDS.reduce(
    (best, need) => (mood[need.key] < mood[best.key] ? need : best),
    NEEDS[0]
  )
  if (lowest.key === 'hunger') return 'проголодался'
  if (lowest.key === 'energy') return 'устал'
  if (lowest.key === 'fun') return 'скучает'
  if (lowest.key === 'social') return 'хочет общения'
  if (lowest.key === 'hygiene') return 'нужно помыться'
  return 'в порядке'
}

/** Автономное «угасание» потребностей, чтобы пламбоб жил между сессиями. */
export function decayMood(mood: SimsMood, now = Date.now()): SimsMood {
  const minutes = Math.min(720, Math.max(0, (now - mood.updatedAt) / 60_000))
  if (minutes < 8) return mood
  const factor = minutes / 60
  const drop = (value: number, perHour: number): number =>
    Math.max(0, Math.round(value - perHour * factor))
  return {
    ...mood,
    hunger: drop(mood.hunger, 3),
    energy: drop(mood.energy, 2),
    fun: drop(mood.fun, 2.5),
    social: drop(mood.social, 2),
    hygiene: drop(mood.hygiene, 1.5),
    points: mood.points ?? 0,
    updatedAt: now
  }
}
