import { BrowserWindow, screen } from 'electron'
import type { Display, Rectangle, WebContents } from 'electron'
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
  private applyingBounds = new Set<WidgetId>()
  private equalizerFreeBounds: Rectangle | null = null
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
      if (this.applyingBounds.has(id)) return
      const [x, y] = win.getPosition()
      if (id === 'equalizer' && this.store.state.equalizer.dock === 'free') {
        this.equalizerFreeBounds = win.getBounds()
      }
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
    if (id === 'equalizer') this.applyEqualizerLayout()
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

  applyEqualizerLayout(): void {
    const win = this.wins.get('equalizer')
    if (!win || win.isDestroyed()) return
    const settings = this.store.state.equalizer
    const meta = WIDGETS.equalizer
    const bounds = win.getBounds()
    let next: Rectangle

    if (settings.dock === 'free') {
      const saved = this.store.state.widgets.equalizer
      const width = Math.round(meta.width * settings.scale)
      const height = Math.round(meta.height * settings.scale)
      const wa = this.equalizerDisplay(bounds).workArea
      const base = this.equalizerFreeBounds ?? {
        x: saved.x ?? bounds.x,
        y: saved.y ?? bounds.y,
        width,
        height
      }
      next = {
        x: Math.min(Math.max(base.x, wa.x), wa.x + wa.width - width),
        y: Math.min(Math.max(base.y, wa.y), wa.y + wa.height - height),
        width,
        height
      }
      this.equalizerFreeBounds = next
    } else {
      const wa = this.equalizerDisplay(bounds).workArea
      const thickness = Math.min(360, Math.max(48, Math.round(settings.dockThickness)))
      if (settings.dock === 'bottom') {
        next = { x: wa.x, y: wa.y + wa.height - thickness, width: wa.width, height: thickness }
      } else if (settings.dock === 'top') {
        next = { x: wa.x, y: wa.y, width: wa.width, height: thickness }
      } else if (settings.dock === 'left') {
        next = { x: wa.x, y: wa.y, width: thickness, height: wa.height }
      } else {
        next = {
          x: wa.x + wa.width - thickness,
          y: wa.y,
          width: thickness,
          height: wa.height
        }
      }
    }

    if (
      bounds.x === next.x &&
      bounds.y === next.y &&
      bounds.width === next.width &&
      bounds.height === next.height
    ) {
      return
    }

    this.applyingBounds.add('equalizer')
    win.setBounds(next)
    this.applyingBounds.delete('equalizer')
    if (settings.dock === 'free') {
      this.store.setPlacement('equalizer', next.x, next.y)
    }
  }

  alignEqualizer(edge: 'top' | 'bottom' | 'left' | 'right'): void {
    const win = this.wins.get('equalizer')
    if (!win || win.isDestroyed()) return
    if (this.store.state.equalizer.dock !== 'free') return
    const bounds = win.getBounds()
    const wa = this.equalizerDisplay(bounds).workArea
    const margin = 12
    let x = bounds.x
    let y = bounds.y
    if (edge === 'top') {
      x = wa.x + Math.round((wa.width - bounds.width) / 2)
      y = wa.y + margin
    } else if (edge === 'bottom') {
      x = wa.x + Math.round((wa.width - bounds.width) / 2)
      y = wa.y + wa.height - bounds.height - margin
    } else if (edge === 'left') {
      x = wa.x + margin
      y = wa.y + Math.round((wa.height - bounds.height) / 2)
    } else {
      x = wa.x + wa.width - bounds.width - margin
      y = wa.y + Math.round((wa.height - bounds.height) / 2)
    }
    const next = { x, y, width: bounds.width, height: bounds.height }
    this.applyingBounds.add('equalizer')
    win.setBounds(next)
    this.applyingBounds.delete('equalizer')
    this.equalizerFreeBounds = next
    this.store.setPlacement('equalizer', x, y)
  }

  private equalizerDisplay(bounds: Rectangle): Display {
    const { displayId } = this.store.state.equalizer
    if (displayId != null) {
      const found = screen.getAllDisplays().find(display => display.id === displayId)
      if (found) return found
    }
    return screen.getDisplayMatching(bounds)
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
