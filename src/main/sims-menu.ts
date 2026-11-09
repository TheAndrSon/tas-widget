import { BrowserWindow, screen } from 'electron'
import { join } from 'node:path'

const MENU_WIDTH = 286
const MENU_HEIGHT = 258

export class SimsMenu {
  private win: BrowserWindow | null = null
  private instanceId: string | null = null

  open(instanceId: string, anchor: Electron.Rectangle): void {
    if (this.win && !this.win.isDestroyed()) {
      this.instanceId = instanceId
      this.position(anchor)
      this.win.show()
      this.win.focus()
      return
    }

    const display = screen.getDisplayMatching(anchor)
    const width = Math.min(MENU_WIDTH, display.workArea.width - 24)
    const height = Math.min(MENU_HEIGHT, display.workArea.height - 24)
    this.instanceId = instanceId
    this.win = new BrowserWindow({
      width,
      height,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      backgroundMaterial: 'none',
      hasShadow: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      show: false,
      acceptFirstMouse: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        sandbox: false,
        spellcheck: false
      }
    })
    this.win.setMenu(null)
    this.win.setAlwaysOnTop(true, 'pop-up-menu')
    this.win.on('blur', () => this.close())
    this.win.on('closed', () => {
      this.win = null
      this.instanceId = null
    })
    this.win.once('ready-to-show', () => {
      if (!this.win) return
      this.position(anchor)
      this.win.show()
      this.win.focus()
    })

    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl) {
      void this.win.loadURL(`${devUrl}/sims-menu.html#${encodeURIComponent(instanceId)}`)
    } else {
      void this.win.loadFile(join(__dirname, '../renderer/sims-menu.html'), {
        hash: instanceId
      })
    }
  }

  close(): void {
    if (this.win && !this.win.isDestroyed()) this.win.close()
    this.win = null
    this.instanceId = null
  }

  private position(anchor: Electron.Rectangle): void {
    if (!this.win || this.win.isDestroyed()) return
    const bounds = this.win.getBounds()
    const display = screen.getDisplayMatching(anchor)
    const wa = display.workArea
    const spaceRight = wa.x + wa.width - (anchor.x + anchor.width)
    const x =
      spaceRight >= bounds.width + 12
        ? anchor.x + anchor.width + 10
        : anchor.x - bounds.width - 10
    const y = anchor.y + Math.round((anchor.height - bounds.height) / 2)
    this.win.setBounds({
      x: Math.max(wa.x + 8, Math.min(wa.x + wa.width - bounds.width - 8, x)),
      y: Math.max(wa.y + 8, Math.min(wa.y + wa.height - bounds.height - 8, y)),
      width: bounds.width,
      height: bounds.height
    })
  }

  get activeId(): string | null {
    return this.instanceId
  }
}
