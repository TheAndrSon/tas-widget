import { app } from 'electron'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  DEFAULT_EQUALIZER_HEIGHT,
  DEFAULT_EQUALIZER_WIDTH,
  DEFAULT_SETTINGS,
  MAX_EQUALIZER_COPIES,
  MAX_SIMS_INSTANCES,
  MAX_WEATHER_CITIES,
  defaultEqualizerSettings,
  defaultSimsSettings,
  defaultWeatherSettings,
  simsSize
} from '../shared/defaults'
import { createSimsState, simsAction, simsDecay } from '../shared/sims'
import type {
  AppSettings,
  City,
  EqualizerInstance,
  EqualizerInstancePatch,
  EqualizerSettings,
  SettingsPatch,
  SimsAction,
  SimsDifficulty,
  SimsInstance,
  SimsMode,
  SimsNeed,
  SimsSettings,
  SimsState,
  WeatherInstance,
  WeatherInstancePatch,
  WeatherSettings,
  WidgetId,
  WindowLayer,
  WindowStyle,
  WindowStylePreset,
  WindowTarget
} from '../shared/types'
import { normalizeVisualizer } from '../shared/visualizer'
import { normalizeWindowStyle } from '../shared/windowStyle'
import { WIDGET_IDS } from '../shared/widgets'

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function normalizeCity(raw: unknown): City | null {
  if (!raw || typeof raw !== 'object') return null
  const city = raw as Partial<City>
  if (typeof city.name !== 'string' || !Number.isFinite(city.lat) || !Number.isFinite(city.lon)) {
    return null
  }
  return {
    id: Number(city.id) || 0,
    name: city.name,
    country: typeof city.country === 'string' ? city.country : '',
    admin1: typeof city.admin1 === 'string' ? city.admin1 : undefined,
    lat: city.lat as number,
    lon: city.lon as number,
    timezone: typeof city.timezone === 'string' ? city.timezone : undefined
  }
}

function normalizeWeatherSettings(raw: unknown): WeatherSettings {
  const settings = defaultWeatherSettings()
  if (!raw || typeof raw !== 'object') return settings
  const source = raw as Partial<WeatherSettings>

  if (source.units === 'metric' || source.units === 'imperial') settings.units = source.units
  if (
    source.provider === 'open-meteo' ||
    source.provider === 'metno' ||
    source.provider === 'wttr' ||
    source.provider === 'yandex'
  ) {
    settings.provider = source.provider
  }
  if (typeof source.yandexKey === 'string') settings.yandexKey = source.yandexKey
  if (typeof source.atmosphere === 'boolean') settings.atmosphere = source.atmosphere

  const intensity = source.atmosphereIntensity
  if (intensity && typeof intensity === 'object') {
    for (const key of ['dawn', 'day', 'dusk', 'night'] as const) {
      const value = intensity[key]
      if (typeof value === 'number' && Number.isFinite(value)) {
        settings.atmosphereIntensity[key] = clamp01(value)
      }
    }
  }

  if (source.forecastDays === 0 || source.forecastDays === 3 || source.forecastDays === 5) {
    settings.forecastDays = source.forecastDays
  }
  for (const key of ['showCity', 'showFeelsLike', 'showWind', 'showHumidity'] as const) {
    const value = source[key]
    if (typeof value === 'boolean') settings[key] = value
  }
  if (source.sunMode === 'off' || source.sunMode === 'compact' || source.sunMode === 'arc') {
    settings.sunMode = source.sunMode
  }
  return settings
}

function normalizeEqualizerSettings(raw: unknown): EqualizerSettings {
  const settings = defaultEqualizerSettings()
  if (!raw || typeof raw !== 'object') return settings
  const source = raw as Partial<EqualizerSettings>
  settings.visualizer = normalizeVisualizer(source.visualizer)
  if (typeof source.windowed === 'boolean') settings.windowed = source.windowed
  if (typeof source.stretch === 'boolean') settings.stretch = source.stretch
  if (source.displayId === null || typeof source.displayId === 'number') {
    settings.displayId = source.displayId
  }
  return settings
}

interface LegacyEqualizer extends Partial<EqualizerSettings> {
  instances?: EqualizerInstance[]
}

function normalizeEqualizer(
  raw: unknown,
  legacyPlacement?: AppSettings['widgets']['equalizer']
): EqualizerInstance[] {
  const source = (raw ?? {}) as LegacyEqualizer
  if (!raw) return structuredClone(DEFAULT_SETTINGS.equalizer.instances)

  if (Array.isArray(source.instances)) {
    const seen = new Set<string>()
    return source.instances.slice(0, MAX_EQUALIZER_COPIES).flatMap((item, index) => {
      if (!item || typeof item !== 'object') return []
      let id = typeof item.id === 'string' && item.id ? item.id : `equalizer-${index + 1}`
      while (seen.has(id)) id = `${id}-copy`
      seen.add(id)
      return [
        {
          id,
          x: typeof item.x === 'number' ? item.x : null,
          y: typeof item.y === 'number' ? item.y : null,
          width: Math.min(
            2400,
            Math.max(160, Math.round(Number(item.width ?? DEFAULT_EQUALIZER_WIDTH)))
          ),
          height: Math.min(
            1600,
            Math.max(90, Math.round(Number(item.height ?? DEFAULT_EQUALIZER_HEIGHT)))
          ),
          enabled: typeof item.enabled === 'boolean' ? item.enabled : false,
          locked: typeof item.locked === 'boolean' ? item.locked : false,
          layer: item.layer === 0 || item.layer === 2 || item.layer === 3 ? item.layer : 1,
          style: normalizeWindowStyle(item.style, item.settings?.windowed === false),
          settings: normalizeEqualizerSettings(item.settings)
        }
      ]
    })
  }

  if ('visualizer' in source) {
    return [
      {
        id: 'equalizer-1',
        x: typeof legacyPlacement?.x === 'number' ? legacyPlacement.x : null,
        y: typeof legacyPlacement?.y === 'number' ? legacyPlacement.y : null,
        width: DEFAULT_EQUALIZER_WIDTH,
        height: DEFAULT_EQUALIZER_HEIGHT,
        enabled: typeof legacyPlacement?.enabled === 'boolean' ? legacyPlacement.enabled : false,
        locked: typeof legacyPlacement?.locked === 'boolean' ? legacyPlacement.locked : false,
        layer: legacyPlacement?.layer ?? 1,
        style: normalizeWindowStyle(
          legacyPlacement?.style,
          (source as Partial<EqualizerSettings>).windowed === false
        ),
        settings: normalizeEqualizerSettings(source)
      }
    ]
  }

  return structuredClone(DEFAULT_SETTINGS.equalizer.instances)
}

interface LegacyWeather extends Partial<WeatherSettings> {
  city?: City | null
  instances?: WeatherInstance[]
}

function normalizeWeather(
  raw: unknown,
  legacyPlacement?: AppSettings['widgets']['weather']
): WeatherInstance[] {
  const source = (raw ?? {}) as LegacyWeather
  if (!raw) return structuredClone(DEFAULT_SETTINGS.weather.instances)

  if (Array.isArray(source.instances)) {
    const seen = new Set<string>()
    return source.instances.slice(0, MAX_WEATHER_CITIES).flatMap((item, index) => {
      const city = normalizeCity(item?.city)
      if (!city) return []
      let id = typeof item.id === 'string' && item.id ? item.id : `weather-${index + 1}`
      while (seen.has(id)) id = `${id}-copy`
      seen.add(id)
      return [
        {
          id,
          city,
          x: typeof item.x === 'number' ? item.x : null,
          y: typeof item.y === 'number' ? item.y : null,
          enabled: typeof item.enabled === 'boolean' ? item.enabled : false,
          locked: typeof item.locked === 'boolean' ? item.locked : false,
          layer: item.layer === 0 || item.layer === 2 || item.layer === 3 ? item.layer : 1,
          style: normalizeWindowStyle(item.style),
          settings: normalizeWeatherSettings(item.settings)
        }
      ]
    })
  }

  if ('city' in source) {
    const city = normalizeCity(source.city)
    if (!city) return []
    return [
      {
        id: 'weather-1',
        city,
        x: typeof legacyPlacement?.x === 'number' ? legacyPlacement.x : null,
        y: typeof legacyPlacement?.y === 'number' ? legacyPlacement.y : null,
        enabled: typeof legacyPlacement?.enabled === 'boolean' ? legacyPlacement.enabled : false,
        locked: typeof legacyPlacement?.locked === 'boolean' ? legacyPlacement.locked : false,
        layer: legacyPlacement?.layer ?? 1,
        style: normalizeWindowStyle(legacyPlacement?.style),
        settings: normalizeWeatherSettings(source)
      }
    ]
  }

  return structuredClone(DEFAULT_SETTINGS.weather.instances)
}

function normalizeCustomStyles(raw: unknown): WindowStylePreset[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 30).flatMap(item => {
    if (!item || typeof item !== 'object') return []
    const preset = item as Partial<WindowStylePreset>
    if (typeof preset.id !== 'string' || typeof preset.name !== 'string') return []
    return [{ id: preset.id, name: preset.name, style: normalizeWindowStyle(preset.style) }]
  })
}

const SIMS_KEYS: SimsNeed[] = ['hunger', 'social', 'hygiene', 'energy', 'fun']

function normalizeSimsGroup(raw: unknown, groupId: string): SimsState {
  const base = createSimsState(groupId)
  if (!raw || typeof raw !== 'object') return base
  const source = raw as Partial<SimsState>
  const state: SimsState = {
    ...base,
    groupId,
    points: Math.max(0, Math.round(Number(source.points ?? 0))),
    updatedAt: Number(source.updatedAt ?? Date.now()),
    stats: { ...base.stats, ...source.stats },
    unlocked: Array.isArray(source.unlocked)
      ? source.unlocked.filter((id): id is string => typeof id === 'string')
      : []
  }
  for (const key of SIMS_KEYS) {
    state[key] = Math.min(100, Math.max(0, Math.round(Number(source[key] ?? base[key]))))
  }
  state.mood = Math.min(100, Math.max(0, Math.round(Number(source.mood ?? state.mood))))
  return state
}

function normalizeSimsSettings(raw: unknown): SimsSettings {
  const base = defaultSimsSettings()
  if (!raw || typeof raw !== 'object') return base
  const source = raw as Partial<SimsSettings>
  return {
    ...base,
    ...source,
    difficulty: source.difficulty === 'hard' ? 'hard' : 'light',
    showNeeds: { ...base.showNeeds, ...source.showNeeds },
    animation:
      source.animation === 'spin' || source.animation === 'pulse' || source.animation === 'none'
        ? source.animation
        : 'float',
    label: typeof source.label === 'string' ? source.label : base.label
  }
}

function normalizeSims(raw: unknown): AppSettings['sims'] {
  if (!raw || typeof raw !== 'object') return structuredClone(DEFAULT_SETTINGS.sims)
  const source = raw as Partial<AppSettings['sims']>
  const groups: Record<string, SimsState> = {}
  const rawGroups = source.groups ?? {}
  for (const [groupId, state] of Object.entries(rawGroups)) {
    groups[groupId] = normalizeSimsGroup(state, groupId)
  }
  if (Object.keys(groups).length === 0) groups.default = createSimsState('default')

  const instances = Array.isArray(source.instances)
    ? source.instances.slice(0, MAX_SIMS_INSTANCES).flatMap((item, index) => {
        if (!item || typeof item !== 'object') return []
        const mode: SimsMode = item.mode === 'needs' ? 'needs' : 'plumbob'
        const size = simsSize(mode)
        return [
          {
            id: typeof item.id === 'string' && item.id ? item.id : `sims-${index + 1}`,
            mode,
            groupId: typeof item.groupId === 'string' ? item.groupId : 'default',
            x: typeof item.x === 'number' ? item.x : null,
            y: typeof item.y === 'number' ? item.y : null,
            width: Math.min(1600, Math.max(120, Number(item.width ?? size.width))),
            height: Math.min(1200, Math.max(90, Number(item.height ?? size.height))),
            enabled: Boolean(item.enabled),
            locked: Boolean(item.locked),
            layer: (item.layer === 0 || item.layer === 2 || item.layer === 3 ? item.layer : 1) as
              0 | 1 | 2 | 3,
            style: normalizeWindowStyle(item.style),
            settings: normalizeSimsSettings(item.settings)
          }
        ]
      })
    : structuredClone(DEFAULT_SETTINGS.sims.instances)
  return { groups, instances }
}

function normalize(raw: unknown): AppSettings {
  const source = (raw ?? {}) as Partial<AppSettings>
  const state: AppSettings = structuredClone(DEFAULT_SETTINGS)

  for (const id of WIDGET_IDS) {
    const item = source.widgets?.[id]
    if (!item) continue
    state.widgets[id] = {
      x: typeof item.x === 'number' ? item.x : null,
      y: typeof item.y === 'number' ? item.y : null,
      enabled: typeof item.enabled === 'boolean' ? item.enabled : false,
      locked: typeof item.locked === 'boolean' ? item.locked : false,
      layer: item.layer === 0 || item.layer === 2 || item.layer === 3 ? item.layer : 1,
      style: normalizeWindowStyle(item.style)
    }
  }

  const interval = source.system?.intervalMs
  if (typeof interval === 'number') {
    state.system.intervalMs = Math.min(10000, Math.max(500, Math.round(interval)))
  }

  for (const key of ['showArt', 'showProgress', 'showControls', 'showSource'] as const) {
    const value = source.music?.[key]
    if (typeof value === 'boolean') state.music[key] = value
  }
  if (source.music?.visualizer) {
    state.music.visualizer = normalizeVisualizer(source.music.visualizer)
  }

  state.weather.instances = normalizeWeather(source.weather, source.widgets?.weather)
  state.equalizer.instances = normalizeEqualizer(source.equalizer, source.widgets?.equalizer)
  state.sims = normalizeSims(source.sims)
  state.customStyles = normalizeCustomStyles(source.customStyles)

  return state
}

export class Store {
  state: AppSettings = structuredClone(DEFAULT_SETTINGS)
  private file = ''
  private timer: NodeJS.Timeout | null = null

  load(): void {
    this.file = join(app.getPath('userData'), 'settings.json')
    try {
      this.state = normalize(JSON.parse(readFileSync(this.file, 'utf8')))
    } catch {
      this.state = structuredClone(DEFAULT_SETTINGS)
    }
  }

  patch(patch: SettingsPatch): AppSettings {
    if (patch.system) {
      this.state.system = { ...this.state.system, ...patch.system }
      const interval = this.state.system.intervalMs
      this.state.system.intervalMs = Math.min(10000, Math.max(500, Math.round(interval)))
    }
    if (patch.music) {
      this.state.music = { ...this.state.music, ...patch.music }
      if (patch.music.visualizer) {
        this.state.music.visualizer = normalizeVisualizer(patch.music.visualizer)
      }
    }
    if (patch.widgets) {
      for (const id of WIDGET_IDS) {
        const item = patch.widgets[id]
        if (item) this.state.widgets[id] = { ...this.state.widgets[id], ...item }
      }
    }
    this.scheduleSave()
    return this.state
  }

  setPlacement(id: WidgetId, x: number, y: number): void {
    this.state.widgets[id] = { ...this.state.widgets[id], x, y }
    this.scheduleSave()
  }

  setEnabled(id: WidgetId, enabled: boolean): void {
    this.state.widgets[id] = { ...this.state.widgets[id], enabled }
    this.scheduleSave()
  }

  setWindowLocked(target: WindowTarget, locked: boolean): void {
    if (target.type === 'weather' && target.instanceId) {
      const instance = this.weatherById(target.instanceId)
      if (instance) instance.locked = locked
    } else if (target.type === 'equalizer' && target.instanceId) {
      const instance = this.equalizerById(target.instanceId)
      if (instance) instance.locked = locked
    } else if (target.type !== 'weather' && target.type !== 'equalizer') {
      this.state.widgets[target.type].locked = locked
    }
    this.scheduleSave()
  }

  setWindowLayer(target: WindowTarget, layer: WindowLayer): void {
    const safe: WindowLayer = layer === 0 || layer === 2 || layer === 3 ? layer : 1
    if (target.type === 'weather' && target.instanceId) {
      const instance = this.weatherById(target.instanceId)
      if (instance) instance.layer = safe
    } else if (target.type === 'equalizer' && target.instanceId) {
      const instance = this.equalizerById(target.instanceId)
      if (instance) instance.layer = safe
    } else if (target.type !== 'weather' && target.type !== 'equalizer') {
      this.state.widgets[target.type].layer = safe
    }
    this.scheduleSave()
  }

  setWindowStyle(target: WindowTarget, style: WindowStyle): void {
    const normalized = normalizeWindowStyle(style)
    if (target.type === 'weather' && target.instanceId) {
      const instance = this.weatherById(target.instanceId)
      if (instance) instance.style = normalized
    } else if (target.type === 'equalizer' && target.instanceId) {
      const instance = this.equalizerById(target.instanceId)
      if (instance) instance.style = normalized
    } else if (target.type !== 'weather' && target.type !== 'equalizer') {
      this.state.widgets[target.type].style = normalized
    }
    this.scheduleSave()
  }

  applyStyleToAll(style: WindowStyle): void {
    const normalized = normalizeWindowStyle(style)
    for (const id of WIDGET_IDS) this.state.widgets[id].style = structuredClone(normalized)
    for (const instance of this.state.weather.instances) {
      instance.style = structuredClone(normalized)
    }
    for (const instance of this.state.equalizer.instances) {
      instance.style = structuredClone(normalized)
    }
    this.scheduleSave()
  }

  saveCustomStyle(name: string, style: WindowStyle): WindowStylePreset {
    let id = `style-${Date.now().toString(36)}`
    while (this.state.customStyles.some(preset => preset.id === id)) {
      id = `${id}-x`
    }
    const preset: WindowStylePreset = {
      id,
      name: name.trim() || 'Мой стиль',
      style: normalizeWindowStyle(style)
    }
    this.state.customStyles.push(preset)
    this.scheduleSave()
    return preset
  }

  removeCustomStyle(id: string): void {
    this.state.customStyles = this.state.customStyles.filter(preset => preset.id !== id)
    this.scheduleSave()
  }

  setAllLocked(locked: boolean): void {
    for (const id of WIDGET_IDS) this.state.widgets[id].locked = locked
    for (const instance of this.state.weather.instances) instance.locked = locked
    for (const instance of this.state.equalizer.instances) instance.locked = locked
    this.scheduleSave()
  }

  resetPlacement(target: WindowTarget): void {
    if (target.type === 'weather' && target.instanceId) {
      const instance = this.weatherById(target.instanceId)
      if (instance) {
        instance.x = null
        instance.y = null
      }
    } else if (target.type === 'equalizer' && target.instanceId) {
      const instance = this.equalizerById(target.instanceId)
      if (instance) {
        instance.x = null
        instance.y = null
      }
    } else if (target.type !== 'weather' && target.type !== 'equalizer') {
      this.state.widgets[target.type].x = null
      this.state.widgets[target.type].y = null
    }
    this.scheduleSave()
  }

  setAllLayers(layer: WindowLayer): void {
    const safe: WindowLayer = layer === 0 || layer === 2 || layer === 3 ? layer : 1
    for (const id of WIDGET_IDS) this.state.widgets[id].layer = safe
    for (const instance of this.state.weather.instances) instance.layer = safe
    for (const instance of this.state.equalizer.instances) instance.layer = safe
    this.scheduleSave()
  }

  weatherById(id: string): WeatherInstance | undefined {
    return this.state.weather.instances.find(instance => instance.id === id)
  }

  addWeather(city: City): WeatherInstance | null {
    const instances = this.state.weather.instances
    if (instances.length >= MAX_WEATHER_CITIES) return null

    let index = 1
    while (instances.some(instance => instance.id === `weather-${index}`)) index += 1

    const base = instances[0]?.settings
    const instance: WeatherInstance = {
      id: `weather-${index}`,
      city: structuredClone(city),
      x: null,
      y: null,
      enabled: true,
      locked: false,
      layer: 1,
      style: this.state.weather.instances[0]?.style
        ? structuredClone(this.state.weather.instances[0].style)
        : normalizeWindowStyle(null),
      settings: base ? structuredClone(base) : defaultWeatherSettings()
    }
    instances.push(instance)
    this.scheduleSave()
    return instance
  }

  removeWeather(id: string): boolean {
    const before = this.state.weather.instances.length
    this.state.weather.instances = this.state.weather.instances.filter(
      instance => instance.id !== id
    )
    if (this.state.weather.instances.length === before) return false
    this.scheduleSave()
    return true
  }

  setWeatherEnabled(id: string, enabled: boolean): void {
    const instance = this.weatherById(id)
    if (!instance) return
    instance.enabled = enabled
    this.scheduleSave()
  }

  setWeatherPlacement(id: string, x: number, y: number): void {
    const instance = this.weatherById(id)
    if (!instance) return
    instance.x = x
    instance.y = y
    this.scheduleSave()
  }

  updateWeather(id: string, patch: WeatherInstancePatch): WeatherInstance | null {
    const instance = this.weatherById(id)
    if (!instance) return null
    if (patch.city) instance.city = structuredClone(patch.city)
    if (patch.settings) instance.settings = { ...instance.settings, ...patch.settings }
    this.scheduleSave()
    return instance
  }

  equalizerById(id: string): EqualizerInstance | undefined {
    return this.state.equalizer.instances.find(instance => instance.id === id)
  }

  addEqualizer(): EqualizerInstance | null {
    const instances = this.state.equalizer.instances
    if (instances.length >= MAX_EQUALIZER_COPIES) return null

    let index = 1
    while (instances.some(instance => instance.id === `equalizer-${index}`)) index += 1

    const base = instances[0]?.settings
    const instance: EqualizerInstance = {
      id: `equalizer-${index}`,
      x: null,
      y: null,
      width: DEFAULT_EQUALIZER_WIDTH,
      height: DEFAULT_EQUALIZER_HEIGHT,
      enabled: true,
      locked: false,
      layer: 1,
      style: this.state.equalizer.instances[0]?.style
        ? structuredClone(this.state.equalizer.instances[0].style)
        : normalizeWindowStyle(null),
      settings: base ? structuredClone(base) : defaultEqualizerSettings()
    }
    instances.push(instance)
    this.scheduleSave()
    return instance
  }

  removeEqualizer(id: string): boolean {
    const before = this.state.equalizer.instances.length
    this.state.equalizer.instances = this.state.equalizer.instances.filter(
      instance => instance.id !== id
    )
    if (this.state.equalizer.instances.length === before) return false
    this.scheduleSave()
    return true
  }

  setEqualizerEnabled(id: string, enabled: boolean): void {
    const instance = this.equalizerById(id)
    if (!instance) return
    instance.enabled = enabled
    this.scheduleSave()
  }

  setEqualizerPlacement(id: string, x: number, y: number): void {
    const instance = this.equalizerById(id)
    if (!instance) return
    instance.x = x
    instance.y = y
    this.scheduleSave()
  }

  setEqualizerSize(id: string, width: number, height: number): void {
    const instance = this.equalizerById(id)
    if (!instance) return
    instance.width = Math.min(2400, Math.max(160, Math.round(width)))
    instance.height = Math.min(1600, Math.max(90, Math.round(height)))
    this.scheduleSave()
  }

  updateEqualizer(id: string, patch: EqualizerInstancePatch): EqualizerInstance | null {
    const instance = this.equalizerById(id)
    if (!instance) return null
    if (patch.settings) {
      const settings = { ...instance.settings, ...patch.settings }
      if (patch.settings.visualizer) {
        settings.visualizer = normalizeVisualizer(patch.settings.visualizer)
      }
      instance.settings = settings
    }
    this.scheduleSave()
    return instance
  }

  simsById(id: string): SimsInstance | undefined {
    return this.state.sims.instances.find(instance => instance.id === id)
  }

  addSims(mode: SimsMode): SimsInstance | null {
    const instances = this.state.sims.instances
    if (instances.length >= MAX_SIMS_INSTANCES) return null
    let index = 1
    while (instances.some(instance => instance.id === `sims-${index}`)) index += 1
    const size = simsSize(mode)
    const instance: SimsInstance = {
      id: `sims-${index}`,
      mode,
      groupId: 'default',
      x: null,
      y: null,
      width: size.width,
      height: size.height,
      enabled: true,
      locked: false,
      layer: 1,
      style: instances[0]?.style ? structuredClone(instances[0].style) : normalizeWindowStyle(null),
      settings: defaultSimsSettings()
    }
    instances.push(instance)
    this.scheduleSave()
    return instance
  }

  removeSims(id: string): boolean {
    const before = this.state.sims.instances.length
    this.state.sims.instances = this.state.sims.instances.filter(instance => instance.id !== id)
    if (this.state.sims.instances.length === before) return false
    this.scheduleSave()
    return true
  }

  setSimsEnabled(id: string, enabled: boolean): void {
    const instance = this.simsById(id)
    if (!instance) return
    instance.enabled = enabled
    this.scheduleSave()
  }

  setSimsPlacement(id: string, x: number, y: number): void {
    const instance = this.simsById(id)
    if (!instance) return
    instance.x = x
    instance.y = y
    this.scheduleSave()
  }

  updateSims(
    id: string,
    patch: { settings?: Partial<SimsSettings>; groupId?: string }
  ): SimsInstance | null {
    const instance = this.simsById(id)
    if (!instance) return null
    if (patch.settings) instance.settings = { ...instance.settings, ...patch.settings }
    if (typeof patch.groupId === 'string' && patch.groupId.trim()) {
      instance.groupId = patch.groupId.trim()
    }
    this.scheduleSave()
    return instance
  }

  simsDo(
    groupId: string,
    action: SimsAction,
    need: SimsNeed,
    difficulty: SimsDifficulty
  ): SimsState {
    const current = this.state.sims.groups[groupId] ?? createSimsState(groupId)
    const next = simsAction(current, action, need, difficulty)
    this.state.sims.groups[groupId] = next
    this.scheduleSave()
    return next
  }

  resetSims(groupId: string): SimsState {
    const state = createSimsState(groupId)
    this.state.sims.groups[groupId] = state
    this.scheduleSave()
    return state
  }

  tickSims(): Record<string, SimsState> {
    for (const [groupId, state] of Object.entries(this.state.sims.groups)) {
      const hard = this.state.sims.instances.some(
        instance => instance.groupId === groupId && instance.settings.difficulty === 'hard'
      )
      const next = simsDecay(state, hard ? 'hard' : 'light')
      if (next !== state) this.state.sims.groups[groupId] = next
    }
    this.scheduleSave()
    return this.state.sims.groups
  }

  private scheduleSave(): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => this.flush(), 300)
  }

  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (!this.file) return
    try {
      mkdirSync(app.getPath('userData'), { recursive: true })
      const tmp = `${this.file}.tmp`
      writeFileSync(tmp, JSON.stringify(this.state, null, 2), 'utf8')
      renameSync(tmp, this.file)
    } catch {
      // Настройки не критичны для работы виджетов.
    }
  }
}
