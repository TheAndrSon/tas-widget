import { BrowserWindow, screen } from 'electron'
import { join } from 'node:path'

const WINDOW_WIDTH = 360
const WINDOW_HEIGHT = 520

export class RewardsWindow {
  private win: BrowserWindow | null = null
  private groupId: string | null = null

  open(groupId: string, anchor: Electron.Rectangle | null): void {
    if (this.win && !this.win.isDestroyed()) {
      if (this.groupId === groupId) {
        this.position(anchor)
        this.win.show()
        this.win.focus()
        return
      }
      this.close()
    }

    const display = anchor ? screen.getDisplayMatching(anchor) : screen.getPrimaryDisplay()
    const width = Math.min(WINDOW_WIDTH, display.workArea.width - 24)
    const height = Math.min(WINDOW_HEIGHT, display.workArea.height - 24)
    this.groupId = groupId
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
    this.win.on('closed', () => {
      this.win = null
      this.groupId = null
    })
    this.win.once('ready-to-show', () => {
      if (!this.win) return
      this.position(anchor)
      this.win.show()
      this.win.focus()
    })

    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl) {
      void this.win.loadURL(`${devUrl}/rewards.html#${encodeURIComponent(groupId)}`)
    } else {
      void this.win.loadFile(join(__dirname, '../renderer/rewards.html'), {
        hash: groupId
      })
    }
  }

  close(): void {
    if (this.win && !this.win.isDestroyed()) this.win.close()
    this.win = null
    this.groupId = null
  }

  /** Ищет свободную сторону вокруг блока потребностей: справа, слева, снизу, сверху. */
  private position(anchor: Electron.Rectangle | null): void {
    if (!this.win || this.win.isDestroyed()) return
    const display = anchor ? screen.getDisplayMatching(anchor) : screen.getPrimaryDisplay()
    const wa = display.workArea
    const bounds = this.win.getBounds()
    const width = bounds.width
    const height = bounds.height

    if (!anchor) {
      this.win.setBounds({
        x: wa.x + Math.round((wa.width - width) / 2),
        y: wa.y + Math.round((wa.height - height) / 2),
        width,
        height
      })
      return
    }

    const gap = 12
    const spaceRight = wa.x + wa.width - (anchor.x + anchor.width)
    const spaceLeft = anchor.x - wa.x
    const spaceBottom = wa.y + wa.height - (anchor.y + anchor.height)
    const spaceTop = anchor.y - wa.y

    let x: number
    let y: number
    if (spaceRight >= width + gap) {
      x = anchor.x + anchor.width + gap
      y = anchor.y + Math.round((anchor.height - height) / 2)
    } else if (spaceLeft >= width + gap) {
      x = anchor.x - width - gap
      y = anchor.y + Math.round((anchor.height - height) / 2)
    } else if (spaceBottom >= height + gap) {
      x = anchor.x + Math.round((anchor.width - width) / 2)
      y = anchor.y + anchor.height + gap
    } else if (spaceTop >= height + gap) {
      x = anchor.x + Math.round((anchor.width - width) / 2)
      y = anchor.y - height - gap
    } else {
      x = anchor.x + anchor.width + gap
      y = anchor.y
    }

    x = Math.max(wa.x + 8, Math.min(wa.x + wa.width - width - 8, x))
    y = Math.max(wa.y + 8, Math.min(wa.y + wa.height - height - 8, y))
    this.win.setBounds({ x: Math.round(x), y: Math.round(y), width, height })
  }
}
