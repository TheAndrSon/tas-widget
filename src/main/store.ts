import { app } from 'electron'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_SETTINGS } from '../shared/defaults'
import type { AppSettings, SettingsPatch, WidgetId } from '../shared/types'
import { WIDGET_IDS } from '../shared/widgets'

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

  const weather = source.weather
  if (weather) {
    const city = weather.city
    if (
      city &&
      typeof city.name === 'string' &&
      Number.isFinite(city.lat) &&
      Number.isFinite(city.lon)
    ) {
      state.weather.city = {
        id: Number(city.id) || 0,
        name: city.name,
        country: typeof city.country === 'string' ? city.country : '',
        admin1: typeof city.admin1 === 'string' ? city.admin1 : undefined,
        lat: city.lat,
        lon: city.lon,
        timezone: typeof city.timezone === 'string' ? city.timezone : undefined
      }
    } else if (city === null) {
      state.weather.city = null
    }
    if (weather.units === 'metric' || weather.units === 'imperial') {
      state.weather.units = weather.units
    }
    if (
      weather.provider === 'open-meteo' ||
      weather.provider === 'metno' ||
      weather.provider === 'wttr' ||
      weather.provider === 'yandex'
    ) {
      state.weather.provider = weather.provider
    }
    if (typeof weather.yandexKey === 'string') state.weather.yandexKey = weather.yandexKey
    if (typeof weather.atmosphere === 'boolean') state.weather.atmosphere = weather.atmosphere
    if (weather.forecastDays === 0 || weather.forecastDays === 3 || weather.forecastDays === 5) {
      state.weather.forecastDays = weather.forecastDays
    }
    for (const key of ['showCity', 'showFeelsLike', 'showWind', 'showHumidity'] as const) {
      const value = weather[key]
      if (typeof value === 'boolean') state.weather[key] = value
    }
    if (weather.sunMode === 'off' || weather.sunMode === 'compact' || weather.sunMode === 'arc') {
      state.weather.sunMode = weather.sunMode
    }
  }

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
    if (patch.weather) {
      this.state.weather = { ...this.state.weather, ...patch.weather }
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
