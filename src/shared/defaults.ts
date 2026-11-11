import type {
  City,
  ClockSettings,
  DiceSettings,
  EqualizerSettings,
  GeneralSettings,
  MusicSettings,
  PersistedState,
  SimsMood,
  TarotSettings,
  WidgetInstance,
  WidgetSettings,
  WidgetType
} from './types'
import { WIDGET_TYPES } from './types'
import {
  DEFAULT_VISUALIZER,
  createDefaultStyle,
  normalizeStyle,
  normalizeSlot,
  normalizeVisualizer
} from './presets'
import { DEFAULT_ENABLED, DEFAULT_SETTINGS } from './default-design'

export const STATE_VERSION = 7

export const CITY_PRESETS: City[] = [
  {
    id: 524901,
    name: 'Москва',
    country: 'Россия',
    admin1: 'Москва',
    lat: 55.7558,
    lon: 37.6173,
    timezone: 'Europe/Moscow'
  },
  {
    id: 498817,
    name: 'Санкт-Петербург',
    country: 'Россия',
    admin1: 'Санкт-Петербург',
    lat: 59.9386,
    lon: 30.3141,
    timezone: 'Europe/Moscow'
  },
  {
    id: 1496747,
    name: 'Новосибирск',
    country: 'Россия',
    admin1: 'Новосибирская область',
    lat: 55.0415,
    lon: 82.9346,
    timezone: 'Asia/Novosibirsk'
  },
  {
    id: 511196,
    name: 'Пермь',
    country: 'Россия',
    admin1: 'Пермский край',
    lat: 58.0105,
    lon: 56.2502,
    timezone: 'Asia/Yekaterinburg'
  },
  {
    id: 1486209,
    name: 'Екатеринбург',
    country: 'Россия',
    admin1: 'Свердловская область',
    lat: 56.8575,
    lon: 60.6125,
    timezone: 'Asia/Yekaterinburg'
  },
  {
    id: 2643743,
    name: 'Лондон',
    country: 'Великобритания',
    lat: 51.5085,
    lon: -0.1257,
    timezone: 'Europe/London'
  },
  {
    id: 5128581,
    name: 'Нью-Йорк',
    country: 'США',
    lat: 40.7143,
    lon: -74.006,
    timezone: 'America/New_York'
  },
  {
    id: 1850147,
    name: 'Токио',
    country: 'Япония',
    lat: 35.6895,
    lon: 139.6917,
    timezone: 'Asia/Tokyo'
  }
]

export const CUSTOM_DATE_COLORS = [
  '#ff8f8f',
  '#ffc46b',
  '#ffe27a',
  '#9be7a4',
  '#7fd4ff',
  '#b3a8ff',
  '#f5a3d0'
]

export const DEFAULT_SIMS_MOOD: SimsMood = {
  mood: 72,
  hunger: 62,
  energy: 68,
  fun: 70,
  social: 58,
  hygiene: 74,
  points: 0,
  updatedAt: Date.now(),
  stats: {
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
  },
  unlocked: []
}

export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function createDefaultSettings(type: WidgetType): WidgetSettings {
  return structuredClone(DEFAULT_SETTINGS[type] ?? DEFAULT_SETTINGS.weather)
}

export function createWidgetInstance(
  type: WidgetType,
  id: string,
  settings?: WidgetSettings
): WidgetInstance {
  return {
    id,
    type,
    enabled: true,
    locked: false,
    layer: 'desktop',
    opacity: 1,
    scale: 1,
    position: null,
    contentSize: null,
    manualSize: null,
    settings: settings ? structuredClone(settings) : createDefaultSettings(type),
    style: createDefaultStyle(type)
  }
}

export function createDefaultGeneral(): GeneralSettings {
  return {
    autostart: false,
    defaultDisplayId: 0,
    layoutMode: false,
    arrowMove: false,
    layoutFocusId: null,
    grid: {
      enabled: true,
      step: 16,
      showGrid: true,
      snapEdges: true
    }
  }
}

export function createDefaultState(): PersistedState {
  return {
    version: STATE_VERSION,
    widgets: WIDGET_TYPES.map((type) => ({
      ...createWidgetInstance(type, `${type}-1`),
      enabled: DEFAULT_ENABLED[type]
    })),
    general: createDefaultGeneral(),
    customPresets: [],
    images: [],
    zodiacPacks: [],
    tarotDecks: [],
    sims: {
      'sim-1': structuredClone(DEFAULT_SIMS_MOOD)
    }
  }
}

/** Убирает мусор из состояния, пришедшего с диска/из IPC. */
export function clampInstance(instance: WidgetInstance): WidgetInstance {
  const manual = instance.manualSize
  return {
    ...instance,
    opacity: Math.min(1, Math.max(0.15, Number(instance.opacity) || 1)),
    scale: Math.min(1.6, Math.max(0.8, Number(instance.scale) || 1)),
    manualSize:
      manual && Number.isFinite(manual.width) && Number.isFinite(manual.height)
        ? {
            width: Math.max(80, Math.round(manual.width)),
            height: Math.max(60, Math.round(manual.height))
          }
        : null,
    style: normalizeStyle(instance.style, instance.type)
  }
}

/** Приводит настройки к актуальной форме (после миграции/частичных патчей). */
export function normalizeSettings(type: WidgetType, input: WidgetSettings): WidgetSettings {
  const defaults = createDefaultSettings(type)
  if (input && typeof input === 'object') {
    const merged = { ...defaults, ...(input as unknown as Record<string, unknown>) } as Record<
      string,
      unknown
    >
    if (type === 'music') {
      merged.visualizer = normalizeVisualizer(
        (input as MusicSettings).visualizer ?? DEFAULT_VISUALIZER
      )
    }
    if (type === 'equalizer') {
      merged.visualizer = normalizeVisualizer(
        (input as EqualizerSettings).visualizer ?? DEFAULT_VISUALIZER
      )
      merged.scale = Math.min(5, Math.max(0.5, Number((input as EqualizerSettings).scale ?? 1)))
    }
    if (type === 'tarot') {
      const tarot = input as TarotSettings
      merged.back = tarot.back?.imageId ? normalizeSlot(tarot.back) : null
    }
    if (type === 'clock') {
      const clock = input as ClockSettings
      if (!['dots', 'colon', 'bar', 'none'].includes(clock.separator ?? '')) {
        merged.separator = 'dots'
      }
    }
    if (type === 'dice') {
      const dice = input as DiceSettings
      merged.diceSkin = dice.diceSkin ? normalizeSlot(dice.diceSkin) : null
      merged.coinHeads = dice.coinHeads ? normalizeSlot(dice.coinHeads) : null
      merged.coinTails = dice.coinTails ? normalizeSlot(dice.coinTails) : null
    }
    return merged as unknown as WidgetSettings
  }
  return defaults
}

/** Клонирует настройки для новой копии виджета. */
export function cloneWidgetSettings(settings: WidgetSettings): WidgetSettings {
  return structuredClone(settings)
}

export function cloneWidgetStyle(style: WidgetInstance['style']): WidgetInstance['style'] {
  return structuredClone(style)
}
