import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import type {
  City,
  MusicAction,
  SettingsPatch,
  WeatherProvider,
  WeatherUnits,
  WidgetId
} from '../shared/types'
import type { MusicService } from './music'
import { openSettingsWindow } from './settings-window'
import type { Store } from './store'
import type { SystemMonitor } from './system-monitor'
import type { WeatherService } from './weather'
import type { WidgetManager } from './widgets'

interface Deps {
  store: Store
  manager: WidgetManager
  monitor: SystemMonitor
  music: MusicService
  weather: WeatherService
}

export function registerIpc({ store, manager, monitor, music, weather }: Deps): void {
  ipcMain.handle('settings:get', () => store.state)

  ipcMain.handle('settings:patch', (_event, patch: SettingsPatch) => {
    const previous = store.state.system.intervalMs
    const next = store.patch(patch)
    if (next.system.intervalMs !== previous) monitor.restart(next.system.intervalMs)
    manager.broadcast('settings:changed', next)
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

  ipcMain.handle('settings:open', () => {
    openSettingsWindow()
    return true
  })

  ipcMain.handle('weather:search', (_event, query: unknown) =>
    weather.search(typeof query === 'string' ? query : '')
  )

  ipcMain.handle(
    'weather:forecast',
    (_event, city: unknown, units: unknown, provider: unknown, yandexKey: unknown) => {
      if (!city || typeof city !== 'object') {
        return { ok: false, error: 'Город не выбран' }
      }
      const safeUnits: WeatherUnits = units === 'imperial' ? 'imperial' : 'metric'
      const safeProvider: WeatherProvider =
        provider === 'metno' || provider === 'wttr' || provider === 'yandex'
          ? provider
          : 'open-meteo'
      return weather.forecast(
        city as City,
        safeUnits,
        safeProvider,
        typeof yandexKey === 'string' ? yandexKey : ''
      )
    }
  )

  ipcMain.handle('music:get', () => music.getSnapshot())

  ipcMain.on('music:control', (_event, action: unknown, positionMs: unknown) => {
    if (action === 'seek') {
      if (typeof positionMs === 'number' && Number.isFinite(positionMs)) {
        music.seek(positionMs)
      }
      return
    }
    if (action === 'toggle' || action === 'next' || action === 'prev') {
      music.control(action as MusicAction)
    }
  })

  ipcMain.handle('ui:context-menu', event => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return false
    const id = manager.idFor(event.sender)

    const template = [
      ...(id ? [{ label: 'Настройки…', click: () => openSettingsWindow() } as const] : []),
      ...(id ? [{ label: 'Скрыть виджет', click: () => manager.close(id) } as const] : []),
      { type: 'separator' as const },
      { label: 'Выход', click: () => app.quit() }
    ]

    Menu.buildFromTemplate(template).popup({ window: win })
    return true
  })
}
