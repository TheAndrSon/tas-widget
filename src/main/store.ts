import { app } from 'electron'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_SETTINGS, MAX_WEATHER_CITIES, defaultWeatherSettings } from '../shared/defaults'
import type {
  AppSettings,
  City,
  EqualizerSettings,
  SettingsPatch,
  WeatherInstance,
  WeatherInstancePatch,
  WeatherSettings,
  WidgetId
} from '../shared/types'
import { normalizeVisualizer } from '../shared/visualizer'
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

function normalizeEqualizer(raw: unknown): EqualizerSettings {
  const settings = structuredClone(DEFAULT_SETTINGS.equalizer)
  if (!raw || typeof raw !== 'object') return settings
  const source = raw as Partial<EqualizerSettings>
  settings.visualizer = normalizeVisualizer(source.visualizer)
  if (
    source.dock === 'free' ||
    source.dock === 'top' ||
    source.dock === 'bottom' ||
    source.dock === 'left' ||
    source.dock === 'right'
  ) {
    settings.dock = source.dock
  }
  if (typeof source.dockThickness === 'number' && Number.isFinite(source.dockThickness)) {
    settings.dockThickness = Math.min(360, Math.max(48, Math.round(source.dockThickness)))
  }
  if (source.displayId === null || typeof source.displayId === 'number') {
    settings.displayId = source.displayId
  }
  if (typeof source.scale === 'number' && Number.isFinite(source.scale)) {
    settings.scale = Math.min(3, Math.max(0.5, source.scale))
  }
  if (typeof source.mirrorX === 'boolean') settings.mirrorX = source.mirrorX
  if (typeof source.mirrorY === 'boolean') settings.mirrorY = source.mirrorY
  return settings
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
        settings: normalizeWeatherSettings(source)
      }
    ]
  }

  return structuredClone(DEFAULT_SETTINGS.weather.instances)
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
      enabled: typeof item.enabled === 'boolean' ? item.enabled : false
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

  state.weather.instances = normalizeWeather(source.weather, source.widgets?.weather)
  state.equalizer = normalizeEqualizer(source.equalizer)

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
    }
    if (patch.equalizer) {
      const next = { ...this.state.equalizer, ...patch.equalizer }
      if (patch.equalizer.visualizer) {
        next.visualizer = normalizeVisualizer(patch.equalizer.visualizer)
      }
      next.dockThickness = Math.min(360, Math.max(48, Math.round(next.dockThickness)))
      next.scale = Math.min(3, Math.max(0.5, next.scale))
      this.state.equalizer = next
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
