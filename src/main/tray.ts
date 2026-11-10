import { app, Menu, Tray, nativeImage } from 'electron'
import { join } from 'node:path'
import { readyWidgetIds, WIDGETS } from '../shared/widgets'
import type { WidgetManager } from './widgets'

export class AppTray {
  private tray: Tray | null = null

  constructor(private readonly manager: WidgetManager) {}

  create(): void {
    const image = nativeImage.createFromPath(this.iconPath())
    this.tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image)
    this.tray.setToolTip('TAS Widget')
    this.tray.on('right-click', () => this.popup())
    this.tray.on('click', () => this.popup())
  }

  private popup(): void {
    if (!this.tray) return
    this.tray.popUpContextMenu(this.menu())
  }

  private menu(): Menu {
    const items = readyWidgetIds().map(id => ({
      label: WIDGETS[id].title,
      type: 'checkbox' as const,
      checked: this.manager.isOpen(id),
      click: () => this.manager.toggle(id)
    }))

    return Menu.buildFromTemplate([
      ...items,
      { type: 'separator' },
      { label: 'Открыть все', click: () => this.manager.restore() },
      { label: 'Закрыть все', click: () => this.manager.closeAll() },
      { type: 'separator' },
      { label: 'Выход', click: () => app.quit() }
    ])
  }

  private iconPath(): string {
    return app.isPackaged
      ? join(process.resourcesPath, 'icon.png')
      : join(__dirname, '../../resources/icon.png')
  }
}
