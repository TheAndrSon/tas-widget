import { BrowserWindow, screen } from 'electron'
import type { WebContents } from 'electron'
import { join } from 'node:path'
import type { WidgetId } from '../shared/types'
import { WIDGETS } from '../shared/widgets'
import type { Store } from './store'

const GAP = 12
const MARGIN = 24

export class WidgetManager {
  private wins = new Map<WidgetId, BrowserWindow>()
  private moveTimers = new Map<WidgetId, NodeJS.Timeout>()
  private quitting = false

  constructor(private readonly store: Store) {}

  setQuitting(): void {
    this.quitting = true
  }

  restore(): void {
    for (const id of Object.keys(WIDGETS) as WidgetId[]) {
      if (WIDGETS[id].ready && this.store.state.widgets[id].enabled) this.open(id)
    }
  }

  isOpen(id: WidgetId): boolean {
    const win = this.wins.get(id)
    return Boolean(win && !win.isDestroyed())
  }

  idFor(contents: WebContents): WidgetId | null {
    for (const [id, win] of this.wins) {
      if (!win.isDestroyed() && win.webContents === contents) return id
    }
    return null
  }

  open(id: WidgetId): BrowserWindow | null {
    const meta = WIDGETS[id]
    if (!meta.ready) return null

    const existing = this.wins.get(id)
    if (existing && !existing.isDestroyed()) {
      existing.showInactive()
      return existing
    }

    const saved = this.store.state.widgets[id]
    const fallback = this.defaultPosition(id)
    const win = new BrowserWindow({
      width: meta.width,
      height: meta.height,
      x: saved.x ?? fallback.x,
      y: saved.y ?? fallback.y,
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

    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl) {
      void win.loadURL(`${devUrl}?widget=${id}`)
    } else {
      void win.loadFile(join(__dirname, '../renderer/index.html'), { query: { widget: id } })
    }

    win.once('ready-to-show', () => {
      win.showInactive()
    })

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
    })

    this.wins.set(id, win)
    this.store.setEnabled(id, true)
    return win
  }

  close(id: WidgetId): void {
    this.store.setEnabled(id, false)
    const win = this.wins.get(id)
    if (win && !win.isDestroyed()) win.close()
  }

  toggle(id: WidgetId): void {
    if (this.isOpen(id)) this.close(id)
    else this.open(id)
  }

  closeAll(): void {
    for (const id of [...this.wins.keys()]) this.close(id)
  }

  broadcast(channel: string, payload: unknown): void {
    for (const win of this.wins.values()) {
      if (win.isDestroyed()) continue
      win.webContents.send(channel, payload)
    }
  }

  private defaultPosition(id: WidgetId): { x: number; y: number } {
    const area = screen.getPrimaryDisplay().workArea
    let offset = MARGIN
    for (const [otherId, win] of this.wins) {
      if (win.isDestroyed()) continue
      offset += WIDGETS[otherId].height + GAP
    }
    return {
      x: area.x + area.width - WIDGETS[id].width - MARGIN,
      y: area.y + offset
    }
  }
}
