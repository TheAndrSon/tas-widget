import { BrowserWindow, screen } from 'electron'
import type { Display, Rectangle, WebContents } from 'electron'
import { join } from 'node:path'
import type { EqualizerInstance, WeatherInstance, WidgetId } from '../shared/types'
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

interface WindowOptions {
  resizable?: boolean
  minWidth?: number
  minHeight?: number
}

export class WidgetManager {
  private wins = new Map<WidgetId, BrowserWindow>()
  private weatherWins = new Map<string, BrowserWindow>()
  private equalizerWins = new Map<string, BrowserWindow>()
  private timers = new Map<string, NodeJS.Timeout>()
  private applyingBounds = new Set<string>()
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
      if (id === 'weather' || id === 'equalizer') continue
      if (WIDGETS[id].ready && this.store.state.widgets[id].enabled) this.open(id)
    }
    for (const instance of this.store.state.weather.instances) {
      if (instance.enabled) this.openWeather(instance)
    }
    for (const instance of this.store.state.equalizer.instances) {
      if (instance.enabled) this.openEqualizer(instance)
    }
  }

  isOpen(id: WidgetId): boolean {
    if (id === 'weather') return this.weatherWins.size > 0
    if (id === 'equalizer') return this.equalizerWins.size > 0
    const win = this.wins.get(id)
    return Boolean(win && !win.isDestroyed())
  }

  isWeatherOpen(id: string): boolean {
    const win = this.weatherWins.get(id)
    return Boolean(win && !win.isDestroyed())
  }

  isEqualizerOpen(id: string): boolean {
    const win = this.equalizerWins.get(id)
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
    for (const [instanceId, win] of this.equalizerWins) {
      if (!win.isDestroyed() && win.webContents === contents) {
        return { type: 'equalizer', instanceId }
      }
    }
    return null
  }

  open(id: WidgetId): BrowserWindow | null {
    if (id === 'weather' || id === 'equalizer') return null
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
      if (this.applyingBounds.has(id)) return
      const [x, y] = win.getPosition()
      const timer = this.timers.get(id)
      if (timer) clearTimeout(timer)
      this.timers.set(
        id,
        setTimeout(() => this.store.setPlacement(id, x, y), 300)
      )
    })

    win.on('closed', () => {
      this.wins.delete(id)
      const timer = this.timers.get(id)
      if (timer) clearTimeout(timer)
      this.timers.delete(id)
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
    const key = `weather:${instance.id}`

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
      const timer = this.timers.get(key)
      if (timer) clearTimeout(timer)
      this.timers.set(
        key,
        setTimeout(() => this.store.setWeatherPlacement(instance.id, x, y), 300)
      )
    })

    win.on('closed', () => {
      this.weatherWins.delete(instance.id)
      const timer = this.timers.get(key)
      if (timer) clearTimeout(timer)
      this.timers.delete(key)
      if (!this.quitting) this.store.setWeatherEnabled(instance.id, false)
    })

    this.weatherWins.set(instance.id, win)
    this.store.setWeatherEnabled(instance.id, true)
    return win
  }

  openEqualizer(instance: EqualizerInstance): BrowserWindow | null {
    const meta = WIDGETS.equalizer
    if (!meta.ready) return null

    const existing = this.equalizerWins.get(instance.id)
    if (existing && !existing.isDestroyed()) {
      existing.showInactive()
      return existing
    }

    const fallback = this.defaultEqualizerPosition(instance.width, instance.height)
    const win = this.createWindow(
      { width: instance.width, height: instance.height },
      instance.x ?? fallback.x,
      instance.y ?? fallback.y,
      { resizable: true, minWidth: 160, minHeight: 90 }
    )
    const key = `equalizer:${instance.id}`

    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl) {
      void win.loadURL(`${devUrl}?widget=equalizer&instance=${encodeURIComponent(instance.id)}`)
    } else {
      void win.loadFile(join(__dirname, '../renderer/index.html'), {
        query: { widget: 'equalizer', instance: instance.id }
      })
    }

    win.webContents.on('did-fail-load', (_event, code, description, url) => {
      console.error(`[equalizer:${instance.id}] не загрузился ${url}: ${code} ${description}`)
      this.store.setEqualizerEnabled(instance.id, false)
    })

    win.on('moved', () => {
      if (this.applyingBounds.has(key)) return
      const [x, y] = win.getPosition()
      const timer = this.timers.get(key)
      if (timer) clearTimeout(timer)
      this.timers.set(
        key,
        setTimeout(() => this.store.setEqualizerPlacement(instance.id, x, y), 300)
      )
    })

    win.on('resize', () => {
      if (this.applyingBounds.has(key)) return
      const [width, height] = win.getSize()
      const timer = this.timers.get(`${key}:size`)
      if (timer) clearTimeout(timer)
      this.timers.set(
        `${key}:size`,
        setTimeout(() => this.store.setEqualizerSize(instance.id, width, height), 300)
      )
    })

    win.on('closed', () => {
      this.equalizerWins.delete(instance.id)
      for (const timerKey of [key, `${key}:size`]) {
        const timer = this.timers.get(timerKey)
        if (timer) clearTimeout(timer)
        this.timers.delete(timerKey)
      }
      if (!this.quitting) this.store.setEqualizerEnabled(instance.id, false)
    })

    this.equalizerWins.set(instance.id, win)
    this.store.setEqualizerEnabled(instance.id, true)
    return win
  }

  close(id: WidgetId): void {
    if (id === 'weather' || id === 'equalizer') return
    this.store.setEnabled(id, false)
    const win = this.wins.get(id)
    if (win && !win.isDestroyed()) win.close()
  }

  closeWeather(id: string): void {
    this.store.setWeatherEnabled(id, false)
    const win = this.weatherWins.get(id)
    if (win && !win.isDestroyed()) win.close()
  }

  closeEqualizer(id: string): void {
    this.store.setEqualizerEnabled(id, false)
    const win = this.equalizerWins.get(id)
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

  toggleEqualizer(id: string): void {
    if (this.isEqualizerOpen(id)) this.closeEqualizer(id)
    else {
      const instance = this.store.equalizerById(id)
      if (instance) this.openEqualizer(instance)
    }
  }

  centerEqualizer(id: string): void {
    const win = this.equalizerWins.get(id)
    const instance = this.store.equalizerById(id)
    if (!win || win.isDestroyed() || !instance) return
    const bounds = win.getBounds()
    const display = this.displayFor(instance.settings.displayId, bounds)
    const wa = display.workArea
    const x = wa.x + Math.round((wa.width - bounds.width) / 2)
    const y = wa.y + Math.round((wa.height - bounds.height) / 2)
    this.applyingBounds.add(`equalizer:${id}`)
    win.setBounds({ x, y, width: bounds.width, height: bounds.height })
    this.applyingBounds.delete(`equalizer:${id}`)
    this.store.setEqualizerPlacement(id, x, y)
  }

  closeAll(): void {
    for (const id of [...this.wins.keys()]) this.close(id)
    for (const id of [...this.weatherWins.keys()]) this.closeWeather(id)
    for (const id of [...this.equalizerWins.keys()]) this.closeEqualizer(id)
  }

  broadcast(channel: string, payload: unknown): void {
    for (const win of this.wins.values()) {
      if (!win.isDestroyed()) win.webContents.send(channel, payload)
    }
    for (const win of this.weatherWins.values()) {
      if (!win.isDestroyed()) win.webContents.send(channel, payload)
    }
    for (const win of this.equalizerWins.values()) {
      if (!win.isDestroyed()) win.webContents.send(channel, payload)
    }
  }

  private displayFor(displayId: number | null, bounds: Rectangle): Display {
    if (displayId != null) {
      const found = screen.getAllDisplays().find(display => display.id === displayId)
      if (found) return found
    }
    return screen.getDisplayMatching(bounds)
  }

  private createWindow(
    meta: { width: number; height: number },
    x: number,
    y: number,
    options: WindowOptions = {}
  ): BrowserWindow {
    const win = new BrowserWindow({
      width: meta.width,
      height: meta.height,
      x,
      y,
      show: false,
      frame: false,
      transparent: true,
      resizable: options.resizable ?? false,
      minWidth: options.minWidth,
      minHeight: options.minHeight,
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

  private defaultEqualizerPosition(width: number, height: number): { x: number; y: number } {
    const area = screen.getPrimaryDisplay().workArea
    const rows = Math.max(1, Math.floor((area.height - 2 * MARGIN + GAP) / (height + GAP)))
    const count = [...this.equalizerWins.values()].filter(win => !win.isDestroyed()).length
    const column = Math.floor(count / rows)
    const row = count % rows
    return {
      x: area.x + MARGIN + column * (width + GAP),
      y: area.y + area.height - height - MARGIN - row * (height + GAP)
    }
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
