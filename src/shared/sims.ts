import type { SimsAction, SimsDifficulty, SimsNeed, SimsState, SimsStats } from './types'

export const SIMS_NEEDS: Array<{ key: SimsNeed; label: string; action: SimsAction }> = [
  { key: 'hunger', label: 'Голод', action: 'feed' },
  { key: 'social', label: 'Общение', action: 'chat' },
  { key: 'hygiene', label: 'Гигиена', action: 'shower' },
  { key: 'energy', label: 'Сон', action: 'sleep' },
  { key: 'fun', label: 'Досуг', action: 'play' }
]

export const SIMS_ACHIEVEMENTS: Array<{
  id: string
  name: string
  hint: string
  check: (state: SimsState) => boolean
}> = [
  {
    id: 'first',
    name: 'Первые шаги',
    hint: 'Выполнить первое действие',
    check: s => s.stats.actions >= 1
  },
  {
    id: 'cozy',
    name: 'Домашний уют',
    hint: '3 дня со средним настроением 70+',
    check: s => s.stats.goodDays >= 3
  },
  {
    id: 'perfect',
    name: 'Полный порядок',
    hint: 'День, где все потребности 80+',
    check: s => s.stats.perfectDays >= 1
  },
  { id: 'veteran', name: 'Ветеран', hint: '7 дней с пламбобом', check: s => s.stats.days >= 7 },
  {
    id: 'collector',
    name: 'Коллекционер',
    hint: 'Накопить 300 звёзд за всё время',
    check: s => s.stats.pointsEarned >= 300
  },

  {
    id: 'mom-sims',
    name: 'Мама, я в Sims',
    hint: '50 действий',
    check: s => s.stats.actions >= 50
  },
  {
    id: 'stairs',
    name: 'Синдром лестницы',
    hint: 'Ухудшить любую потребность',
    check: s => s.stats.worsenCount >= 1
  },
  {
    id: 'dirty-dishes',
    name: 'Смерть от грязной посуды',
    hint: 'Гигиена упала до 5',
    check: s => s.hygiene <= 5
  },
  { id: 'sleepy-cat', name: 'Сонный кот', hint: 'Сон упал до 15', check: s => s.energy <= 15 },
  {
    id: 'endless-shower',
    name: 'Бесконечный душ',
    hint: '20 раз улучшить гигиену',
    check: s => s.stats.needActions.hygiene >= 20
  },
  {
    id: 'omelette',
    name: 'Омлет из холодильника',
    hint: '20 раз покормить',
    check: s => s.stats.needActions.hunger >= 20
  },
  {
    id: 'social-butterfly',
    name: 'Душа компании',
    hint: '20 раз пообщаться',
    check: s => s.stats.needActions.social >= 20
  },
  {
    id: 'mortgage',
    name: 'Симулятор ипотеки',
    hint: 'Заработать 250 звёзд',
    check: s => s.stats.pointsEarned >= 250
  },
  {
    id: 'star-hour',
    name: 'Звёздный час',
    hint: '100 звёзд на балансе',
    check: s => s.points >= 100
  },
  {
    id: 'roommate',
    name: 'Сосед по комнате',
    hint: '100 действий',
    check: s => s.stats.actions >= 100
  },
  {
    id: 'neon-crystal',
    name: 'Неоновый кристалл',
    hint: 'Настроение 95+',
    check: s => s.stats.bestMood >= 95
  },
  {
    id: 'cursed',
    name: 'Проклятый пламбоб',
    hint: 'Все потребности упали до 15',
    check: s => s.mood <= 20
  },

  ...SIMS_NEEDS.map(need => ({
    id: `fresh-${need.key}`,
    name: need.key === 'hygiene' ? 'Фреш' : `Крепкий ${need.label.toLowerCase()}`,
    hint: `${need.label} не ниже 30 десять дней подряд`,
    check: (s: SimsState) => s.stats.needStreaks[need.key] >= 10
  }))
]

export function moodColor(value: number): string {
  if (value >= 80) return '#7ef29b'
  if (value >= 62) return '#c7f26b'
  if (value >= 45) return '#ffd166'
  if (value >= 28) return '#ff9f5c'
  if (value >= 15) return '#62a8ff'
  return '#ff6b6b'
}

export function moodLabel(value: number): string {
  if (value >= 80) return 'счастлив'
  if (value >= 62) return 'хорошо'
  if (value >= 45) return 'неуютно'
  if (value >= 28) return 'напряжён'
  if (value >= 15) return 'грустит'
  return 'злится'
}

export function moodState(state: SimsState): string {
  const lowest = SIMS_NEEDS.reduce(
    (best, need) => (state[need.key] < state[best.key] ? need : best),
    SIMS_NEEDS[0]
  )
  if (lowest.key === 'hunger') return 'проголодался'
  if (lowest.key === 'energy') return 'устал'
  if (lowest.key === 'fun') return 'скучает'
  if (lowest.key === 'social') return 'хочет общения'
  return 'нужно помыться'
}

export function averageMood(state: Omit<SimsState, 'mood'>): number {
  return Math.round(SIMS_NEEDS.reduce((sum, need) => sum + state[need.key], 0) / SIMS_NEEDS.length)
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
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
    needActions: { hunger: 0, social: 0, hygiene: 0, energy: 0, fun: 0 },
    needMinToday: { hunger: 100, social: 100, hygiene: 100, energy: 100, fun: 100 },
    needStreaks: { hunger: 0, social: 0, hygiene: 0, energy: 0, fun: 0 },
    lastDay: new Date().toISOString().slice(0, 10),
    lastPenaltyAt: 0,
    lastBonusAt: 0
  }
}

export function createSimsState(groupId = 'default'): SimsState {
  const state = {
    groupId,
    hunger: 72,
    social: 68,
    hygiene: 74,
    energy: 70,
    fun: 66,
    points: 0,
    updatedAt: Date.now(),
    stats: createSimsStats(),
    unlocked: []
  }
  return { ...state, mood: averageMood(state) }
}

export function evaluateAchievements(state: SimsState): SimsState {
  const unlocked = new Set(state.unlocked)
  for (const achievement of SIMS_ACHIEVEMENTS) {
    if (!unlocked.has(achievement.id) && achievement.check(state)) {
      unlocked.add(achievement.id)
    }
  }
  return { ...state, unlocked: [...unlocked] }
}

export function simsDecay(
  state: SimsState,
  difficulty: SimsDifficulty,
  now = Date.now()
): SimsState {
  const hours = Math.min(168, Math.floor((now - state.updatedAt) / 3_600_000))
  if (hours <= 0) return state

  const next = { ...state, stats: { ...state.stats } }
  for (const need of SIMS_NEEDS) next[need.key] = state[need.key]
  let stamp = state.updatedAt

  for (let index = 0; index < hours; index += 1) {
    const hour = new Date(stamp + index * 3_600_000).getHours()
    const night = hour >= 20 || hour < 10
    const drop = night ? (difficulty === 'hard' ? 2 : 1) : 6
    for (const need of SIMS_NEEDS) {
      next[need.key] = clamp(next[need.key] - drop)
    }
    stamp += 3_600_000
  }
  next.updatedAt = stamp
  next.mood = averageMood(next)
  next.stats.bestMood = Math.max(next.stats.bestMood, next.mood)

  const lowNeeds = SIMS_NEEDS.filter(need => next[need.key] <= 15)
  if (lowNeeds.length > 0 && now - next.stats.lastPenaltyAt >= 3 * 3_600_000) {
    next.points = Math.max(0, next.points - lowNeeds.length)
    next.stats.lastPenaltyAt = now
  }
  if (next.mood >= 80 && now - next.stats.lastBonusAt >= 6 * 3_600_000) {
    const bonus = difficulty === 'hard' ? 2 : 3
    next.points += bonus
    next.stats.pointsEarned += bonus
    next.stats.lastBonusAt = now
  }

  const day = new Date(now).toISOString().slice(0, 10)
  if (next.stats.lastDay !== day) {
    next.stats.days += 1
    if (next.mood >= 70) next.stats.goodDays += 1
    if (SIMS_NEEDS.every(need => next[need.key] >= 80)) next.stats.perfectDays += 1
    for (const need of SIMS_NEEDS) {
      next.stats.needStreaks[need.key] =
        next.stats.needMinToday[need.key] >= 30 ? next.stats.needStreaks[need.key] + 1 : 0
      next.stats.needMinToday[need.key] = next[need.key]
    }
    next.stats.lastDay = day
  }
  for (const need of SIMS_NEEDS) {
    next.stats.needMinToday[need.key] = Math.min(next.stats.needMinToday[need.key], next[need.key])
  }
  return evaluateAchievements(next)
}

const GAIN: Record<Exclude<SimsAction, 'worsen'>, { light: number; hard: number }> = {
  feed: { light: 24, hard: 16 },
  chat: { light: 22, hard: 15 },
  shower: { light: 26, hard: 17 },
  sleep: { light: 28, hard: 18 },
  play: { light: 24, hard: 16 }
}

export function simsAction(
  state: SimsState,
  action: SimsAction,
  need: SimsNeed,
  difficulty: SimsDifficulty
): SimsState {
  const next = {
    ...state,
    stats: {
      ...state.stats,
      needActions: { ...state.stats.needActions },
      needMinToday: { ...state.stats.needMinToday },
      needStreaks: { ...state.stats.needStreaks }
    },
    unlocked: [...state.unlocked]
  }
  for (const item of SIMS_NEEDS) next[item.key] = state[item.key]

  if (action === 'worsen') {
    next[need] = clamp(next[need] - (difficulty === 'hard' ? 24 : 18))
    next.points = Math.max(0, next.points - 1)
    next.stats.worsenCount += 1
  } else {
    next[need] = clamp(next[need] + GAIN[action][difficulty])
    next.stats.actions += 1
    next.stats.needActions[need] += 1
    const points = difficulty === 'hard' ? 1 : 2
    next.points += points
    next.stats.pointsEarned += points
    if (difficulty === 'hard') {
      const side: SimsNeed = need === 'energy' ? 'hunger' : need === 'fun' ? 'energy' : 'fun'
      next[side] = clamp(next[side] - 4)
    }
  }

  next.mood = averageMood(next)
  next.updatedAt = Date.now()
  next.stats.bestMood = Math.max(next.stats.bestMood, next.mood)
  for (const item of SIMS_NEEDS) {
    next.stats.needMinToday[item.key] = Math.min(next.stats.needMinToday[item.key], next[item.key])
  }
  return evaluateAchievements(next)
}
