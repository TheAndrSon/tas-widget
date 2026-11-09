import { BrowserWindow } from 'electron'
import { join } from 'node:path'
import type { SettingsTab } from '../shared/types'
import { resolveTargetDisplay } from './displays'

export class SettingsWindow {
  private win: BrowserWindow | null = null
  private collapsed = false
  private expandedBounds: Electron.Rectangle | null = null
  private activeTab: SettingsTab | null = null

  constructor(private readonly onActiveTab?: (tab: SettingsTab | null) => void) {}

  open(tab?: SettingsTab, displayId?: number): void {
    if (tab) this.activeTab = tab
    this.onActiveTab?.(this.activeTab)
    if (this.win && !this.win.isDestroyed()) {
      if (this.collapsed) this.setCollapsed(false)
      if (tab) this.win.webContents.send('settings:select', tab)
      this.win.show()
      this.win.focus()
      return
    }

    const display = resolveTargetDisplay(displayId)
    const width = Math.min(1060, display.workArea.width - 80)
    const height = Math.min(780, display.workArea.height - 80)

    this.win = new BrowserWindow({
      width,
      height,
      minWidth: 780,
      minHeight: 560,
      x: Math.round(display.workArea.x + (display.workArea.width - width) / 2),
      y: Math.round(display.workArea.y + (display.workArea.height - height) / 2),
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      backgroundMaterial: 'none',
      hasShadow: false,
      roundedCorners: true,
      resizable: true,
      minimizable: true,
      maximizable: false,
      fullscreenable: false,
      alwaysOnTop: false,
      skipTaskbar: false,
      title: 'Настройки TAS Widget',
      show: false,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        sandbox: false,
        spellcheck: false
      }
    })

    this.win.setMenu(null)
    this.win.setAlwaysOnTop(false)
    // Настройки — обычное окно в Alt+Tab и на панели задач, не поверх браузера.
    this.win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    this.win.webContents.on('will-navigate', (event) => event.preventDefault())
    this.win.on('closed', () => {
      this.win = null
      this.collapsed = false
      this.expandedBounds = null
      this.activeTab = null
      this.onActiveTab?.(null)
    })
    this.win.once('ready-to-show', () => {
      this.win?.show()
      this.win?.focus()
    })

    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl) {
      void this.win.loadURL(`${devUrl}/settings.html${tab ? `#${tab}` : ''}`)
    } else if (tab) {
      void this.win.loadFile(join(__dirname, '../renderer/settings.html'), { hash: tab })
    } else {
      void this.win.loadFile(join(__dirname, '../renderer/settings.html'))
    }
  }

  select(tab: SettingsTab): void {
    if (this.win && !this.win.isDestroyed()) {
      this.win.webContents.send('settings:select', tab)
    }
  }

  setCollapsed(collapsed: boolean): void {
    if (!this.win || this.win.isDestroyed()) return
    if (this.collapsed === collapsed) return
    if (collapsed) {
      this.expandedBounds = this.win.getBounds()
      this.collapsed = true
      this.win.setMinimumSize(780, 54)
      this.win.setResizable(false)
      this.win.setBounds({
        x: this.expandedBounds.x,
        y: this.expandedBounds.y,
        width: this.expandedBounds.width,
        height: 54
      })
    } else {
      this.collapsed = false
      this.win.setResizable(true)
      this.win.setMinimumSize(780, 560)
      if (this.expandedBounds) {
        this.win.setBounds(this.expandedBounds)
        this.expandedBounds = null
      }
    }
  }

  close(): void {
    if (this.win && !this.win.isDestroyed()) this.win.close()
  }

  get window(): BrowserWindow | null {
    return this.win && !this.win.isDestroyed() ? this.win : null
  }
}
