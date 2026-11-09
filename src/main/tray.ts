import { Menu, Tray, nativeImage } from 'electron'
import { instanceLabel } from '../shared/labels'
import type { SettingsTab } from '../shared/types'
import type { Store } from './store'
import { resourcePath } from './paths'

export interface TrayActions {
  openSettings: (tab?: SettingsTab) => void
  setWidgetEnabled: (id: string, enabled: boolean) => void
  setLocked: (id: string, locked: boolean) => void
  setLockedAll: (locked: boolean) => void
  toggleAllWidgets: () => void
  resetPositions: () => void
  quit: () => void
}

export class TrayController {
  private tray: Tray | null = null

  constructor(
    private readonly store: Store,
    private readonly actions: TrayActions
  ) {}

  create(): void {
    if (this.tray) return
    const image = nativeImage.createFromPath(resourcePath('tray.png'))
    this.tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image)
    this.tray.setToolTip('TAS Widget — правый клик для меню')
    this.tray.on('click', () => this.actions.openSettings())
    this.tray.on('double-click', () => this.actions.openSettings())
    this.refresh()
  }

  refresh(): void {
    if (!this.tray || this.tray.isDestroyed()) return
    const widgets = this.store.state.widgets
    const anyEnabled = widgets.some((widget) => widget.enabled)
    const anyLocked = widgets.some((widget) => widget.enabled && widget.locked)
    const anyUnlocked = widgets.some((widget) => widget.enabled && !widget.locked)
    const label = (id: string): string => {
      const instance = widgets.find((widget) => widget.id === id)
      return instance ? instanceLabel(instance, widgets) : id
    }

    const menu = Menu.buildFromTemplate([
      {
        label: 'Настройки виджетов…',
        click: () => this.actions.openSettings()
      },
      { type: 'separator' },
      {
        label: 'Виджеты',
        submenu: widgets.map((widget) => ({
          label: label(widget.id),
          type: 'checkbox' as const,
          checked: widget.enabled,
          click: () => this.actions.setWidgetEnabled(widget.id, !widget.enabled)
        }))
      },
      {
        label: 'Редактирование',
        submenu: [
          {
            label: 'Разблокировать все',
            enabled: anyLocked,
            click: () => this.actions.setLockedAll(false)
          },
          {
            label: 'Заблокировать все',
            enabled: anyUnlocked,
            click: () => this.actions.setLockedAll(true)
          },
          { type: 'separator' },
          { label: 'По отдельности:', enabled: false },
          ...widgets.map((widget) => ({
            label: label(widget.id),
            type: 'checkbox' as const,
            checked: widget.enabled && !widget.locked,
            enabled: widget.enabled,
            click: () => this.actions.setLocked(widget.id, !widget.locked)
          }))
        ]
      },
      { type: 'separator' },
      {
        label: anyEnabled ? 'Скрыть все виджеты' : 'Показать все виджеты',
        click: () => this.actions.toggleAllWidgets()
      },
      {
        label: 'Сбросить положение',
        click: () => this.actions.resetPositions()
      },
      { type: 'separator' },
      {
        label: 'Выход',
        click: () => this.actions.quit()
      }
    ])
    this.tray.setContextMenu(menu)
  }

  destroy(): void {
    this.tray?.destroy()
    this.tray = null
  }
}
