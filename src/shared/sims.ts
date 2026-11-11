import type { SimsAction, SimsDifficulty, SimsMood, SimsStats } from './types'

type NeedKey = 'hunger' | 'energy' | 'fun' | 'social' | 'hygiene'

export const NEEDS: Array<{ key: NeedKey; label: string; action: SimsAction }> = [
  { key: 'hunger', label: 'Голод', action: 'feed' },
  { key: 'energy', label: 'Энергия', action: 'sleep' },
  { key: 'fun', label: 'Веселье', action: 'play' },
  { key: 'social', label: 'Общение', action: 'chat' },
  { key: 'hygiene', label: 'Гигиена', action: 'shower' }
]

const KEYS: NeedKey[] = ['hunger', 'energy', 'fun', 'social', 'hygiene']

export const SIMS_ACHIEVEMENTS: Array<{
  id: string
  name: string
  hint: string
  check: (mood: SimsMood) => boolean
}> = [
  {
    id: 'first',
    name: 'Первые шаги',
    hint: 'Выполнить первое действие',
    check: (m) => m.stats.actions >= 1
  },
  {
    id: 'cozy',
    name: 'Домашний уют',
    hint: '3 дня со средним настроением 70+',
    check: (m) => m.stats.goodDays >= 3
  },
  {
    id: 'perfect',
    name: 'Полный порядок',
    hint: 'День, где все потребности 80+',
    check: (m) => m.stats.perfectDays >= 1
  },
  { id: 'veteran', name: 'Ветеран', hint: '7 дней с пламбобом', check: (m) => m.stats.days >= 7 },
  {
    id: 'collector',
    name: 'Коллекционер',
    hint: 'Накопить 300 звёзд',
    check: (m) => m.stats.pointsEarned >= 300
  },
  {
    id: 'mom-sims',
    name: 'Мама, я в Sims',
    hint: '50 действий',
    check: (m) => m.stats.actions >= 50
  },
  {
    id: 'stairs',
    name: 'Синдром лестницы',
    hint: 'Ухудшить любую потребность',
    check: (m) => m.stats.worsenCount >= 1
  },
  {
    id: 'dirty-dishes',
    name: 'Смерть от грязной посуды',
    hint: 'Гигиена упала до 5',
    check: (m) => m.hygiene <= 5
  },
  { id: 'sleepy-cat', name: 'Сонный кот', hint: 'Сон упал до 15', check: (m) => m.energy <= 15 },
  {
    id: 'endless-shower',
    name: 'Бесконечный душ',
    hint: '20 раз улучшить гигиену',
    check: (m) => m.stats.needActions.hygiene >= 20
  },
  {
    id: 'omelette',
    name: 'Омлет из холодильника',
    hint: '20 раз покормить',
    check: (m) => m.stats.needActions.hunger >= 20
  },
  {
    id: 'social-butterfly',
    name: 'Душа компании',
    hint: '20 раз пообщаться',
    check: (m) => m.stats.needActions.social >= 20
  },
  {
    id: 'mortgage',
    name: 'Симулятор ипотеки',
    hint: 'Заработать 250 звёзд',
    check: (m) => m.stats.pointsEarned >= 250
  },
  {
    id: 'star-hour',
    name: 'Звёздный час',
    hint: '100 звёзд на балансе',
    check: (m) => m.points >= 100
  },
  {
    id: 'roommate',
    name: 'Сосед по комнате',
    hint: '100 действий',
    check: (m) => m.stats.actions >= 100
  },
  {
    id: 'neon-crystal',
    name: 'Неоновый кристалл',
    hint: 'Настроение 95+',
    check: (m) => m.stats.bestMood >= 95
  },
  {
    id: 'cursed',
    name: 'Проклятый пламбоб',
    hint: 'Все потребности упали до 15',
    check: (m) => m.mood <= 20
  },
  ...NEEDS.map((need) => ({
    id: `fresh-${need.key}`,
    name: need.key === 'hygiene' ? 'Фреш' : `Крепкий ${need.label.toLowerCase()}`,
    hint: `${need.label} не ниже 30 десять дней подряд`,
    check: (m: SimsMood) => m.stats.needStreaks[need.key] >= 10
  }))
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
  return 'нужно помыться'
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function average(mood: SimsMood): number {
  return Math.round(KEYS.reduce((sum, key) => sum + mood[key], 0) / KEYS.length)
}

export function createSimsStats(): SimsStats {
  return {
    actions: 0,
    days: 0,
    goodDays: 0,
    perfectDays: 0,
    bestMood: 50,
    pointsEarned: 0,
    worsenCount: 0,
    needActions: { hunger: 0, energy: 0, fun: 0, social: 0, hygiene: 0 },
    needMinToday: { hunger: 100, energy: 100, fun: 100, social: 100, hygiene: 100 },
    needStreaks: { hunger: 0, energy: 0, fun: 0, social: 0, hygiene: 0 },
    lastDay: new Date().toISOString().slice(0, 10),
    lastPenaltyAt: 0,
    lastBonusAt: 0
  }
}

export function evaluateAchievements(mood: SimsMood): SimsMood {
  const unlocked = new Set(mood.unlocked ?? [])
  for (const item of SIMS_ACHIEVEMENTS) {
    if (!unlocked.has(item.id) && item.check(mood)) unlocked.add(item.id)
  }
  return { ...mood, unlocked: [...unlocked] }
}

export function decayMood(
  mood: SimsMood,
  now = Date.now(),
  difficulty: SimsDifficulty = 'classic'
): SimsMood {
  const hours = Math.min(168, Math.floor((now - mood.updatedAt) / 3_600_000))
  if (hours <= 0) return mood
  const hard = difficulty === 'hard'
  const next: SimsMood = {
    ...mood,
    stats: {
      ...mood.stats,
      needActions: { ...mood.stats.needActions },
      needMinToday: { ...mood.stats.needMinToday },
      needStreaks: { ...mood.stats.needStreaks }
    },
    unlocked: [...(mood.unlocked ?? [])]
  }
  let stamp = mood.updatedAt
  for (let index = 0; index < hours; index += 1) {
    const hour = new Date(stamp + index * 3_600_000).getHours()
    const night = hour >= 20 || hour < 10
    const drop = night ? (hard ? 2 : 1) : 6
    for (const key of KEYS) next[key] = clamp(next[key] - drop)
    stamp += 3_600_000
  }
  next.updatedAt = stamp
  next.mood = average(next)
  next.stats.bestMood = Math.max(next.stats.bestMood, next.mood)

  const low = KEYS.filter((key) => next[key] <= 15)
  if (low.length > 0 && now - next.stats.lastPenaltyAt >= 3 * 3_600_000) {
    next.points = Math.max(0, next.points - low.length)
    next.stats.lastPenaltyAt = now
  }
  if (next.mood >= 80 && now - next.stats.lastBonusAt >= 6 * 3_600_000) {
    const bonus = hard ? 2 : 3
    next.points += bonus
    next.stats.pointsEarned += bonus
    next.stats.lastBonusAt = now
  }

  const day = new Date(now).toISOString().slice(0, 10)
  if (next.stats.lastDay !== day) {
    next.stats.days += 1
    if (next.mood >= 70) next.stats.goodDays += 1
    if (KEYS.every((key) => next[key] >= 80)) next.stats.perfectDays += 1
    for (const key of KEYS) {
      next.stats.needStreaks[key] =
        next.stats.needMinToday[key] >= 30 ? next.stats.needStreaks[key] + 1 : 0
      next.stats.needMinToday[key] = next[key]
    }
    next.stats.lastDay = day
  }
  for (const key of KEYS) {
    next.stats.needMinToday[key] = Math.min(next.stats.needMinToday[key], next[key])
  }
  return evaluateAchievements(next)
}

const GAIN: Record<Exclude<SimsAction, 'worsen' | 'reset'>, number> = {
  feed: 24,
  chat: 22,
  shower: 26,
  sleep: 28,
  play: 24
}

export function simsDo(
  mood: SimsMood,
  action: SimsAction,
  difficulty: SimsDifficulty,
  need?: NeedKey
): SimsMood {
  const hard = difficulty === 'hard'
  const next: SimsMood = {
    ...mood,
    stats: {
      ...mood.stats,
      needActions: { ...mood.stats.needActions },
      needMinToday: { ...mood.stats.needMinToday },
      needStreaks: { ...mood.stats.needStreaks }
    },
    unlocked: [...(mood.unlocked ?? [])]
  }
  for (const key of KEYS) next[key] = mood[key]

  if (action === 'reset') {
    return {
      ...mood,
      mood: 72,
      hunger: 65,
      energy: 70,
      fun: 68,
      social: 62,
      hygiene: 72,
      points: 0,
      updatedAt: Date.now(),
      stats: createSimsStats(),
      unlocked: []
    }
  }

  if (action === 'worsen') {
    const target = need && KEYS.includes(need) ? need : null
    const amount = hard ? 24 : 18
    if (target) next[target] = clamp(next[target] - amount)
    else for (const key of KEYS) next[key] = clamp(next[key] - amount)
    next.points = Math.max(0, next.points - 1)
    next.stats.worsenCount += 1
  } else {
    const target = need && KEYS.includes(need) ? need : null
    const actionNeed = NEEDS.find((item) => item.action === action)?.key
    const key = target ?? actionNeed
    if (key) {
      next[key] = clamp(
        next[key] + (hard ? 16 : (GAIN[action as Exclude<SimsAction, 'worsen' | 'reset'>] ?? 20))
      )
      next.stats.needActions[key] += 1
      if (hard) {
        const side: NeedKey = key === 'energy' ? 'hunger' : key === 'fun' ? 'energy' : 'fun'
        next[side] = clamp(next[side] - 4)
      }
    }
    next.stats.actions += 1
    const points = hard ? 1 : 2
    next.points += points
    next.stats.pointsEarned += points
  }

  next.mood = average(next)
  next.updatedAt = Date.now()
  next.stats.bestMood = Math.max(next.stats.bestMood, next.mood)
  for (const key of KEYS) {
    next.stats.needMinToday[key] = Math.min(next.stats.needMinToday[key], next[key])
  }
  return evaluateAchievements(next)
}
