import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import type { SettingsPatch, WidgetId } from '../shared/types'
import type { Store } from './store'
import type { SystemMonitor } from './system-monitor'
import type { WidgetManager } from './widgets'

interface Deps {
  store: Store
  manager: WidgetManager
  monitor: SystemMonitor
}

export function registerIpc({ store, manager, monitor }: Deps): void {
  ipcMain.handle('settings:get', () => store.state)

  ipcMain.handle('settings:patch', (_event, patch: SettingsPatch) => {
    const previous = store.state.system.intervalMs
    const next = store.patch(patch)
    if (next.system.intervalMs !== previous) monitor.restart(next.system.intervalMs)
    return next
  })

  ipcMain.handle('widget:open', (_event, id: WidgetId) => {
    manager.open(id)
    return true
  })

  ipcMain.handle('widget:close', (_event, id: WidgetId) => {
    manager.close(id)
    return true
  })

  ipcMain.handle('app:quit', () => {
    app.quit()
    return true
  })

  ipcMain.handle('ui:context-menu', event => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return false
    const id = manager.idFor(event.sender)

    const template = [
      ...(id ? [{ label: 'Скрыть виджет', click: () => manager.close(id) } as const] : []),
      { type: 'separator' as const },
      { label: 'Выход', click: () => app.quit() }
    ]

    Menu.buildFromTemplate(template).popup({ window: win })
    return true
  })
}
