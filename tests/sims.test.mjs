import assert from 'node:assert/strict'
import test from 'node:test'
import {
  NEEDS,
  createSimsStats,
  decayMood,
  evaluateAchievements,
  moodColor,
  moodLabel,
  simsDo
} from '../src/shared/sims.ts'

function mood(overrides = {}) {
  return {
    mood: 100,
    hunger: 100,
    energy: 100,
    fun: 100,
    social: 100,
    hygiene: 100,
    points: 0,
    updatedAt: Date.now(),
    stats: createSimsStats(),
    unlocked: [],
    ...overrides
  }
}

const HOUR = 3_600_000

test('потребности: пять шкал в новом порядке', () => {
  assert.equal(NEEDS.length, 5)
  assert.deepEqual(
    NEEDS.map((item) => item.action),
    ['feed', 'chat', 'shower', 'sleep', 'play']
  )
  assert.deepEqual(
    NEEDS.map((item) => item.label),
    ['Голод', 'Общение', 'Гигиена', 'Сон', 'Досуг']
  )
})

test('просадка: без прошедших часов состояние не меняется', () => {
  const source = mood()
  assert.equal(decayMood(source, source.updatedAt), source)
})

test('просадка: днём по 6 за час, лайт', () => {
  const now = new Date(2026, 0, 15, 12, 0, 0).getTime()
  const next = decayMood(mood({ updatedAt: now - 2 * HOUR }), now, 'classic')
  assert.equal(next.hunger, 88)
  assert.equal(next.energy, 88)
  assert.equal(next.mood, 88)
  assert.equal(next.updatedAt, now)
})

test('просадка: ночью медленнее и жёстче на харде', () => {
  const now = new Date(2026, 0, 16, 0, 0, 0).getTime()
  const source = mood({ updatedAt: new Date(2026, 0, 15, 23, 0, 0).getTime() })
  assert.equal(decayMood(source, now, 'classic').hunger, 99)
  assert.equal(decayMood(source, now, 'hard').hunger, 98)
})

test('просадка: не больше 168 часов и не ниже нуля', () => {
  const now = Date.now()
  const next = decayMood(mood({ updatedAt: now - 1_000 * HOUR }), now, 'classic')
  assert.equal(next.hunger, 0)
  assert.equal(next.mood, 0)
  assert.ok(next.updatedAt <= now)
})

test('просадка: штраф за низкие потребности списывает очки', () => {
  const now = new Date(2026, 0, 15, 12, 0, 0).getTime()
  const source = mood({
    mood: 10,
    hunger: 10,
    energy: 10,
    fun: 10,
    social: 10,
    hygiene: 10,
    points: 5,
    updatedAt: now - HOUR
  })
  const next = decayMood(source, now, 'classic')
  assert.equal(next.points, 0)
  assert.equal(next.stats.lastPenaltyAt, now)
})

test('просадка: бонус за высокое настроение начисляет очки', () => {
  const now = new Date(2026, 0, 15, 12, 0, 0).getTime()
  const source = mood({ updatedAt: now - HOUR })
  const classic = decayMood(source, now, 'classic')
  assert.equal(classic.points, 3)
  assert.equal(classic.stats.pointsEarned, 3)
  const hard = decayMood(source, now, 'hard')
  assert.equal(hard.points, 2)
})

test('действие: лайт даёт больше, чем хард', () => {
  const now = Date.now()
  const source = mood({ hunger: 40, mood: 40, updatedAt: now })
  const classic = simsDo(source, 'feed', 'classic', 'hunger')
  const hard = simsDo(source, 'feed', 'hard', 'hunger')
  assert.equal(classic.hunger, 64)
  assert.equal(hard.hunger, 56)
  assert.equal(classic.points, 2)
  assert.equal(hard.points, 1)
})

test('действие: на харде побочная потребность падает', () => {
  const source = mood({ hunger: 40, fun: 50 })
  const next = simsDo(source, 'feed', 'hard', 'hunger')
  assert.equal(next.fun, 46)
})

test('действие: ухудшение снижает потребность и очки', () => {
  const source = mood({ hunger: 80, points: 4 })
  const classic = simsDo(source, 'worsen', 'classic', 'hunger')
  assert.equal(classic.hunger, 62)
  assert.equal(classic.points, 3)
  const hard = simsDo(source, 'worsen', 'hard', 'hunger')
  assert.equal(hard.hunger, 56)
})

test('действие: сброс обнуляет статистику и награды', () => {
  const source = mood({ points: 12, unlocked: ['first'] })
  source.stats.actions = 9
  const next = simsDo(source, 'reset', 'classic')
  assert.equal(next.points, 0)
  assert.equal(next.stats.actions, 0)
  assert.deepEqual(next.unlocked, [])
  assert.equal(next.mood, 72)
})

test('награды: первое действие открывает достижение', () => {
  const next = simsDo(mood(), 'play', 'classic')
  assert.ok(next.unlocked.includes('first'))
})

test('награды: evaluateAchievements не дублирует записи', () => {
  const source = mood({ unlocked: ['first'] })
  source.stats.actions = 5
  const next = evaluateAchievements(source)
  assert.equal(next.unlocked.filter((id) => id === 'first').length, 1)
})

test('подписи и цвет зависят от настроения', () => {
  assert.match(moodColor(90), /^#[0-9a-f]{6}$/i)
  assert.notEqual(moodColor(90), moodColor(10))
  assert.equal(typeof moodLabel(90), 'string')
  assert.ok(moodLabel(90).length > 0)
})
