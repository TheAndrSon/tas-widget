/**
 * Фиксирует текущее оформление виджетов как встроенные значения по умолчанию.
 *
 * Использование:
 *   node tools/generate-default-design.mjs "%APPDATA%\TAS Widget\state.json"
 *
 * Скрипт берёт первый экземпляр каждого типа, очищает неиспользуемые слои
 * изображений и записывает src/shared/default-design.ts.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const WIDGET_TYPES = [
  'weather',
  'music',
  'clock',
  'weekday',
  'calendar',
  'astro',
  'tarot',
  'dice',
  'equalizer',
  'todo',
  'sims',
  'finance',
  'twitch',
  'system'
]

const input = process.argv[2]
if (!input) {
  console.error('Укажите путь к state.json')
  process.exit(1)
}

const state = JSON.parse(readFileSync(input, 'utf8'))
const firstByType = new Map()
for (const widget of state.widgets ?? []) {
  if (!firstByType.has(widget.type)) firstByType.set(widget.type, widget)
}

const PRESET_IDS = {
  tribe_one: 'tribe-one',
  calendar: 'notebook-light'
}

function mapPresetId(style, sourcePresetId) {
  if (typeof sourcePresetId === 'string' && PRESET_IDS[sourcePresetId]) {
    return PRESET_IDS[sourcePresetId]
  }
  if (typeof sourcePresetId === 'string' && !sourcePresetId.startsWith('custom-')) {
    return sourcePresetId
  }
  return style.background?.kind === 'color' && style.texture === 'paper'
    ? 'notebook-light'
    : 'tribe-one'
}

const MOSCOW = {
  id: 524901,
  name: 'Москва',
  country: 'Россия',
  admin1: 'Москва',
  lat: 55.7558,
  lon: 37.6173,
  timezone: 'Europe/Moscow'
}

function cleanSettings(type, inputSettings) {
  const value = structuredClone(inputSettings)
  // Личные данные не должны попадать в публичные значения по умолчанию.
  if (type === 'weather') value.city = structuredClone(MOSCOW)
  if (type === 'astro') value.birthDate = ''
  if (value.visualizer) {
    // Полный слышимый диапазон и мягкий лимитер задаются в коде визуализатора.
    value.visualizer.freqMin = 20
    value.visualizer.freqMax = 20000
    value.visualizer.freqScale = 'log'
    value.visualizer.spectrumSmoothing = value.visualizer.spectrumSmoothing ?? 0.25
    value.visualizer.twoColors = value.visualizer.twoColors ?? true
    value.visualizer.radialMaxHeight = value.visualizer.radialMaxHeight ?? 100
    value.visualizer.particleMaskWidth = value.visualizer.particleMaskWidth ?? 0.6
    value.visualizer.particleMaskHeight = value.visualizer.particleMaskHeight ?? 0.6
    delete value.visualizer.glowEnabled
    delete value.visualizer.glowIntensity
    delete value.visualizer.glowSpread
  }
  return value
}

function cleanStyle(inputStyle) {
  const style = structuredClone(inputStyle)
  style.underlay = null
  style.overlay = null
  style.presetId = mapPresetId(style, style.presetId)
  return style
}

const styles = {}
const settings = {}
const enabled = {}

for (const type of WIDGET_TYPES) {
  const widget = firstByType.get(type)
  if (!widget) {
    console.warn(`[generate] нет экземпляра типа ${type}`)
    continue
  }
  styles[type] = cleanStyle(widget.style)
  settings[type] = cleanSettings(type, widget.settings)
  enabled[type] = Boolean(widget.enabled)
}

const presets = []
for (const preset of state.customPresets ?? []) {
  const id = PRESET_IDS[preset.name]
  if (!id) continue
  presets.push({
    id,
    name: preset.name === 'tribe_one' ? 'Tribe One' : 'Notebook Light',
    builtin: true,
    style: cleanStyle(preset.style)
  })
}

const header = `/**
 * Сгенерировано tools/generate-default-design.mjs из рабочего state.json.
 * Это зафиксированное оформление виджетов по умолчанию: фоны, рамки, шрифты,
 * текстуры, эффекты и настройки отображения.
 */
import type { StylePreset, WidgetSettings, WidgetStyle, WidgetType } from './types'

/** Картинка, которую установщик кладёт в userData/images. */
export const DEFAULT_BACKGROUND_IMAGE_ID = 'img-mw8rt5d7-99623796'

/** Виджеты, которые временно отключены до доработки. */
export const DEFAULT_ENABLED = ${JSON.stringify(enabled, null, 2)} as Record<WidgetType, boolean>

export const DEFAULT_STYLES = ${JSON.stringify(styles, null, 2)} as unknown as Record<WidgetType, WidgetStyle>

export const DEFAULT_SETTINGS = ${JSON.stringify(settings, null, 2)} as unknown as Record<WidgetType, WidgetSettings>

export const DEFAULT_PRESETS = ${JSON.stringify(presets, null, 2)} as StylePreset[]
`

writeFileSync(join(process.cwd(), 'src', 'shared', 'default-design.ts'), header, 'utf8')
console.log('Готово: src/shared/default-design.ts')
console.log('Типы:', Object.keys(styles).join(', '))
console.log('Пресеты:', presets.map((preset) => preset.name).join(', ') || 'нет')
