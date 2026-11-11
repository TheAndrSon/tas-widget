import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DUPLICABLE_TYPES,
  MAX_COPIES_PER_TYPE,
  WIDGET_META,
  WIDGET_TYPES
} from '../src/shared/types.ts'
import { DEFAULT_ENABLED, DEFAULT_SETTINGS } from '../src/shared/default-design.ts'

const EXPECTED_ORDER = [
  'weather',
  'music',
  'system',
  'sims',
  'finance',
  'equalizer',
  'calendar',
  'astro',
  'tarot',
  'clock',
  'weekday',
  'dice',
  'todo',
  'twitch'
]

test('порядок виджетов в настройках', () => {
  assert.deepEqual(WIDGET_TYPES, EXPECTED_ORDER)
})

test('у каждого типа есть метаданные и размер по умолчанию', () => {
  for (const type of WIDGET_TYPES) {
    const meta = WIDGET_META[type]
    assert.ok(meta, `нет метаданных для ${type}`)
    assert.ok(meta.title.length > 0)
    assert.ok(meta.hint.length > 0)
    assert.ok(meta.defaultSize.width > 0)
    assert.ok(meta.defaultSize.height > 0)
  }
  assert.equal(Object.keys(WIDGET_META).length, WIDGET_TYPES.length)
})

test('дублируемые типы входят в список виджетов', () => {
  for (const type of DUPLICABLE_TYPES) assert.ok(WIDGET_TYPES.includes(type))
  assert.ok(MAX_COPIES_PER_TYPE > 1)
})

test('дефолты включения и настроек покрывают все типы', () => {
  for (const type of WIDGET_TYPES) {
    assert.equal(typeof DEFAULT_ENABLED[type], 'boolean', `нет DEFAULT_ENABLED для ${type}`)
    assert.ok(DEFAULT_SETTINGS[type], `нет DEFAULT_SETTINGS для ${type}`)
  }
})

test('системный виджет: диски — отдельная настройка', () => {
  assert.equal(typeof DEFAULT_SETTINGS.system.showDisks, 'boolean')
  assert.equal(typeof DEFAULT_SETTINGS.system.showCpu, 'boolean')
})

test('визуализатор музыки: частоты и количество элементов', () => {
  const music = DEFAULT_SETTINGS.music.visualizer
  assert.ok(music.freqMin > 0)
  assert.ok(music.freqMax > music.freqMin)
  assert.ok(music.bars >= 12)
  assert.ok(['log', 'linear'].includes(music.freqScale))
})
