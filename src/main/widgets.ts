import { BrowserWindow, screen } from 'electron'
import type { WebContents } from 'electron'
import { join } from 'node:path'
import type { WeatherInstance, WidgetId } from '../shared/types'
import { WIDGET_IDS, WIDGETS } from '../shared/widgets'
import type { Store } from './store'

const GAP = 12
const MARGIN = 24

interface WidgetHooks {
  onOpen?: (id: WidgetId) => void
  onClose?: (id: WidgetId) => void
}

export interface WidgetWindowInfo {
  type: WidgetId
  instanceId?: string
}

export class WidgetManager {
  private wins = new Map<WidgetId, BrowserWindow>()
  private weatherWins = new Map<string, BrowserWindow>()
  private moveTimers = new Map<string, NodeJS.Timeout>()
  private quitting = false

  constructor(
    private readonly store: Store,
    private readonly hooks: WidgetHooks = {}
  ) {}

  setQuitting(): void {
    this.quitting = true
  }

  restore(): void {
    for (const id of WIDGET_IDS) {
      if (id === 'weather') continue
      if (WIDGETS[id].ready && this.store.state.widgets[id].enabled) this.open(id)
    }
    for (const instance of this.store.state.weather.instances) {
      if (instance.enabled) this.openWeather(instance)
    }
  }

  isOpen(id: WidgetId): boolean {
    if (id === 'weather') return this.weatherWins.size > 0
    const win = this.wins.get(id)
    return Boolean(win && !win.isDestroyed())
  }

  isWeatherOpen(id: string): boolean {
    const win = this.weatherWins.get(id)
    return Boolean(win && !win.isDestroyed())
  }

  describe(contents: WebContents): WidgetWindowInfo | null {
    for (const [id, win] of this.wins) {
      if (!win.isDestroyed() && win.webContents === contents) return { type: id }
    }
    for (const [instanceId, win] of this.weatherWins) {
      if (!win.isDestroyed() && win.webContents === contents) {
        return { type: 'weather', instanceId }
      }
    }
    return null
  }

  open(id: WidgetId): BrowserWindow | null {
    if (id === 'weather') return null
    const meta = WIDGETS[id]
    if (!meta.ready) return null

    const existing = this.wins.get(id)
    if (existing && !existing.isDestroyed()) {
      existing.showInactive()
      return existing
    }

    const saved = this.store.state.widgets[id]
    const fallback = this.defaultPosition(id)
    const win = this.createWindow(meta, saved.x ?? fallback.x, saved.y ?? fallback.y)

    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl) {
      void win.loadURL(`${devUrl}?widget=${id}`)
    } else {
      void win.loadFile(join(__dirname, '../renderer/index.html'), { query: { widget: id } })
    }

    win.webContents.on('did-fail-load', (_event, code, description, url) => {
      console.error(`[widget:${id}] не загрузился ${url}: ${code} ${description}`)
      this.store.setEnabled(id, false)
    })

    win.on('moved', () => {
      const [x, y] = win.getPosition()
      const timer = this.moveTimers.get(id)
      if (timer) clearTimeout(timer)
      this.moveTimers.set(
        id,
        setTimeout(() => this.store.setPlacement(id, x, y), 300)
      )
    })

    win.on('closed', () => {
      this.wins.delete(id)
      const timer = this.moveTimers.get(id)
      if (timer) clearTimeout(timer)
      this.moveTimers.delete(id)
      if (!this.quitting) this.store.setEnabled(id, false)
      this.hooks.onClose?.(id)
    })

    this.wins.set(id, win)
    this.store.setEnabled(id, true)
    this.hooks.onOpen?.(id)
    return win
  }

  openWeather(instance: WeatherInstance): BrowserWindow | null {
    const meta = WIDGETS.weather
    if (!meta.ready) return null

    const existing = this.weatherWins.get(instance.id)
    if (existing && !existing.isDestroyed()) {
      existing.showInactive()
      return existing
    }

    const fallback = this.defaultPosition('weather')
    const win = this.createWindow(meta, instance.x ?? fallback.x, instance.y ?? fallback.y)

    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl) {
      void win.loadURL(`${devUrl}?widget=weather&instance=${encodeURIComponent(instance.id)}`)
    } else {
      void win.loadFile(join(__dirname, '../renderer/index.html'), {
        query: { widget: 'weather', instance: instance.id }
      })
    }

    win.webContents.on('did-fail-load', (_event, code, description, url) => {
      console.error(`[weather:${instance.id}] не загрузился ${url}: ${code} ${description}`)
      this.store.setWeatherEnabled(instance.id, false)
    })

    win.on('moved', () => {
      const [x, y] = win.getPosition()
      const key = `weather:${instance.id}`
      const timer = this.moveTimers.get(key)
      if (timer) clearTimeout(timer)
      this.moveTimers.set(
        key,
        setTimeout(() => this.store.setWeatherPlacement(instance.id, x, y), 300)
      )
    })

    win.on('closed', () => {
      this.weatherWins.delete(instance.id)
      const key = `weather:${instance.id}`
      const timer = this.moveTimers.get(key)
      if (timer) clearTimeout(timer)
      this.moveTimers.delete(key)
      if (!this.quitting) this.store.setWeatherEnabled(instance.id, false)
    })

    this.weatherWins.set(instance.id, win)
    this.store.setWeatherEnabled(instance.id, true)
    return win
  }

  close(id: WidgetId): void {
    if (id === 'weather') return
    this.store.setEnabled(id, false)
    const win = this.wins.get(id)
    if (win && !win.isDestroyed()) win.close()
  }

  closeWeather(id: string): void {
    this.store.setWeatherEnabled(id, false)
    const win = this.weatherWins.get(id)
    if (win && !win.isDestroyed()) win.close()
  }

  toggle(id: WidgetId): void {
    if (this.isOpen(id)) this.close(id)
    else this.open(id)
  }

  toggleWeather(id: string): void {
    if (this.isWeatherOpen(id)) this.closeWeather(id)
    else {
      const instance = this.store.weatherById(id)
      if (instance) this.openWeather(instance)
    }
  }

  closeAll(): void {
    for (const id of [...this.wins.keys()]) this.close(id)
    for (const id of [...this.weatherWins.keys()]) this.closeWeather(id)
  }

  broadcast(channel: string, payload: unknown): void {
    for (const win of this.wins.values()) {
      if (win.isDestroyed()) continue
      win.webContents.send(channel, payload)
    }
    for (const win of this.weatherWins.values()) {
      if (win.isDestroyed()) continue
      win.webContents.send(channel, payload)
    }
  }

  private createWindow(
    meta: { width: number; height: number },
    x: number,
    y: number
  ): BrowserWindow {
    const win = new BrowserWindow({
      width: meta.width,
      height: meta.height,
      x,
      y,
      show: false,
      frame: false,
      transparent: true,
      resizable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      hasShadow: false,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    win.setAlwaysOnTop(true, 'floating')
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

    win.once('ready-to-show', () => {
      win.showInactive()
    })

    return win
  }

  private defaultPosition(id: WidgetId): { x: number; y: number } {
    const area = screen.getPrimaryDisplay().workArea
    const meta = WIDGETS[id]

    if (id === 'weather') {
      let baseY = MARGIN
      for (const [otherId, win] of this.wins) {
        if (win.isDestroyed()) continue
        baseY += WIDGETS[otherId].height + GAP
      }
      const rows = Math.max(
        1,
        Math.floor((area.height - baseY - MARGIN + GAP) / (meta.height + GAP))
      )
      const count = [...this.weatherWins.values()].filter(win => !win.isDestroyed()).length
      const column = Math.floor(count / rows)
      const row = count % rows
      return {
        x: area.x + area.width - meta.width - MARGIN - column * (meta.width + GAP),
        y: area.y + baseY + row * (meta.height + GAP)
      }
    }

    let offset = MARGIN
    for (const [otherId, win] of this.wins) {
      if (win.isDestroyed()) continue
      offset += WIDGETS[otherId].height + GAP
    }
    for (const win of this.weatherWins.values()) {
      if (win.isDestroyed()) continue
      offset += WIDGETS.weather.height + GAP
    }
    return {
      x: area.x + area.width - meta.width - MARGIN,
      y: area.y + offset
    }
  }
}
