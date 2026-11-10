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
