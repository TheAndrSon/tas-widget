import { app } from 'electron'
import { join } from 'node:path'
import { registerIpc } from './ipc'
import { Store } from './store'
import { SystemMonitor } from './system-monitor'
import { AppTray } from './tray'
import { WidgetManager } from './widgets'

// Отдельная папка данных: не пересекаемся со старой версией TAS Widget.
app.setPath('userData', join(app.getPath('appData'), 'tas-widgets'))

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  const store = new Store()
  let manager: WidgetManager | null = null

  app.on('second-instance', () => manager?.restore())

  void app.whenReady().then(() => {
    store.load()
    manager = new WidgetManager(store)
    const active = manager
    const monitor = new SystemMonitor(sample => active.broadcast('system:sample', sample))

    registerIpc({ store, manager: active, monitor })
    new AppTray(active).create()
    active.restore()
    monitor.start(store.state.system.intervalMs)

    app.on('activate', () => active.restore())
  })

  app.on('window-all-closed', () => {
    // Приложение живёт в трее: закрытие виджетов не завершает процесс.
  })

  app.on('before-quit', () => {
    manager?.setQuitting()
    store.flush()
  })
}
