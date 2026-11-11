import { app, BrowserWindow, Menu, ipcMain, screen } from 'electron'
import type {
  City,
  MusicAction,
  SettingsPatch,
  WeatherInstancePatch,
  WeatherProvider,
  WeatherUnits,
  WidgetId
} from '../shared/types'
import { WIDGET_IDS } from '../shared/widgets'
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
    if (patch.equalizer) manager.applyEqualizerLayout()
    manager.broadcast('settings:changed', next)
    return next
  })

  ipcMain.handle('widget:open', (_event, id: WidgetId) => Boolean(manager.open(id)))

  ipcMain.handle('widget:close', (_event, id: WidgetId) => {
    manager.close(id)
    return true
  })

  ipcMain.handle('app:quit', () => {
    app.quit()
    return true
  })

  ipcMain.handle('settings:open', (_event, tab: unknown) => {
    openSettingsWindow(WIDGET_IDS.includes(tab as WidgetId) ? (tab as WidgetId) : undefined)
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

  ipcMain.handle('app:displays', () =>
    screen.getAllDisplays().map(display => ({
      id: display.id,
      label: display.label || `Монитор ${display.id}`,
      width: display.bounds.width,
      height: display.bounds.height,
      x: display.bounds.x,
      y: display.bounds.y
    }))
  )

  ipcMain.handle('equalizer:align', (_event, edge: unknown) => {
    if (edge === 'top' || edge === 'bottom' || edge === 'left' || edge === 'right') {
      manager.alignEqualizer(edge)
    }
    return true
  })

  ipcMain.handle('weather:add', (_event, city: unknown) => {
    if (!city || typeof city !== 'object') return null
    const instance = store.addWeather(city as City)
    if (!instance) return null
    manager.openWeather(instance)
    manager.broadcast('settings:changed', store.state)
    return instance
  })

  ipcMain.handle('weather:remove', (_event, id: unknown) => {
    if (typeof id !== 'string') return false
    manager.closeWeather(id)
    const removed = store.removeWeather(id)
    if (removed) manager.broadcast('settings:changed', store.state)
    return removed
  })

  ipcMain.handle('weather:open', (_event, id: unknown) => {
    if (typeof id !== 'string') return false
    const instance = store.weatherById(id)
    if (!instance) return false
    manager.openWeather(instance)
    return true
  })

  ipcMain.handle('weather:close', (_event, id: unknown) => {
    if (typeof id !== 'string') return false
    manager.closeWeather(id)
    return true
  })

  ipcMain.handle('weather:patch', (_event, id: unknown, patch: unknown) => {
    if (typeof id !== 'string' || !patch || typeof patch !== 'object') return null
    const instance = store.updateWeather(id, patch as WeatherInstancePatch)
    if (instance) manager.broadcast('settings:changed', store.state)
    return instance
  })

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
    const info = manager.describe(event.sender)

    const template = [
      ...(info
        ? [{ label: 'Настройки…', click: () => openSettingsWindow(info.type) } as const]
        : []),
      ...(info
        ? [
            {
              label: info.instanceId ? 'Скрыть город' : 'Скрыть виджет',
              click: () => {
                if (info.instanceId) manager.closeWeather(info.instanceId)
                else manager.close(info.type)
              }
            } as const
          ]
        : []),
      { type: 'separator' as const },
      { label: 'Выход', click: () => app.quit() }
    ]

    Menu.buildFromTemplate(template).popup({ window: win })
    return true
  })
}
