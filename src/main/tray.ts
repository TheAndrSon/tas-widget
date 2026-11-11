import { app, Menu, Tray, nativeImage } from 'electron'
import { join } from 'node:path'
import { readyWidgetIds, WIDGETS } from '../shared/widgets'
import { openSettingsWindow } from './settings-window'
import type { Store } from './store'
import type { WidgetManager } from './widgets'

export class AppTray {
  private tray: Tray | null = null

  constructor(
    private readonly manager: WidgetManager,
    private readonly store: Store
  ) {}

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
    const items = readyWidgetIds()
      .filter(id => id !== 'weather' && id !== 'equalizer' && id !== 'plumbob')
      .map(id => ({
        label: WIDGETS[id].title,
        type: 'checkbox' as const,
        checked: this.manager.isOpen(id),
        click: () => this.manager.toggle(id)
      }))

    const cities = this.store.state.weather.instances.map(instance => ({
      label: instance.city.name,
      type: 'checkbox' as const,
      checked: this.manager.isWeatherOpen(instance.id),
      click: () => this.manager.toggleWeather(instance.id)
    }))

    const weatherMenu = [
      ...cities,
      ...(cities.length > 0 ? [{ type: 'separator' as const }] : []),
      { label: 'Добавить город…', click: () => openSettingsWindow('weather') },
      { label: 'Настройки погоды…', click: () => openSettingsWindow('weather') }
    ]

    const equalizers = this.store.state.equalizer.instances.map((instance, index) => ({
      label: `Эквалайзер ${index + 1}`,
      type: 'checkbox' as const,
      checked: this.manager.isEqualizerOpen(instance.id),
      click: () => this.manager.toggleEqualizer(instance.id)
    }))

    const equalizerMenu = [
      ...equalizers,
      ...(equalizers.length > 0 ? [{ type: 'separator' as const }] : []),
      { label: 'Добавить эквалайзер…', click: () => openSettingsWindow('equalizer') },
      { label: 'Настройки эквалайзера…', click: () => openSettingsWindow('equalizer') }
    ]

    const simsItems = this.store.state.sims.instances.map((instance, index) => ({
      label: instance.mode === 'needs' ? `Потребности ${index + 1}` : `Пламбоб ${index + 1}`,
      type: 'checkbox' as const,
      checked: this.manager.isSimsOpen(instance.id),
      click: () => this.manager.toggleSims(instance.id)
    }))

    const simsMenu = [
      ...simsItems,
      ...(simsItems.length > 0 ? [{ type: 'separator' as const }] : []),
      { label: 'Добавить пламбоб…', click: () => openSettingsWindow('plumbob') },
      { label: 'Добавить потребности…', click: () => openSettingsWindow('plumbob') },
      { label: 'Настройки пламбоба…', click: () => openSettingsWindow('plumbob') }
    ]

    return Menu.buildFromTemplate([
      ...items,
      { label: 'Погода', submenu: weatherMenu },
      { label: 'Эквалайзер', submenu: equalizerMenu },
      { label: 'Пламбоб', submenu: simsMenu },
      { type: 'separator' },
      { label: 'Открыть все', click: () => this.manager.restore() },
      { label: 'Закрыть все', click: () => this.manager.closeAll() },
      { type: 'separator' },
      { label: 'Настройки…', click: () => openSettingsWindow() },
      { label: 'Выход', click: () => app.quit() }
    ])
  }

  private iconPath(): string {
    return app.isPackaged
      ? join(process.resourcesPath, 'icon.png')
      : join(__dirname, '../../resources/icon.png')
  }
}
