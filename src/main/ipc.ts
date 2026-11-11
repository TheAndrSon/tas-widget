import { app, BrowserWindow, Menu, ipcMain, screen } from 'electron'
import type {
  City,
  EqualizerInstancePatch,
  MusicAction,
  SettingsPatch,
  WeatherInstancePatch,
  WeatherProvider,
  WeatherUnits,
  WidgetId,
  WindowLayer,
  WindowStyle,
  WindowTarget
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

  ipcMain.handle('window:setLock', (_event, target: unknown, locked: unknown) => {
    if (!target || typeof target !== 'object') return false
    store.setWindowLocked(target as WindowTarget, Boolean(locked))
    manager.broadcast('settings:changed', store.state)
    return true
  })

  ipcMain.handle('window:setLayer', (_event, target: unknown, layer: unknown) => {
    if (!target || typeof target !== 'object') return false
    const safe = Number(layer)
    if (safe !== 0 && safe !== 1 && safe !== 2 && safe !== 3) return false
    store.setWindowLayer(target as WindowTarget, safe as WindowLayer)
    manager.applyLayer(target as WindowTarget)
    manager.broadcast('settings:changed', store.state)
    return true
  })

  ipcMain.handle('window:setStyle', (_event, target: unknown, style: unknown) => {
    if (!target || typeof target !== 'object' || !style || typeof style !== 'object') {
      return false
    }
    store.setWindowStyle(target as WindowTarget, style as WindowStyle)
    manager.broadcast('settings:changed', store.state)
    return true
  })

  ipcMain.handle('style:save', (_event, name: unknown, style: unknown) => {
    if (!style || typeof style !== 'object') return null
    const preset = store.saveCustomStyle(typeof name === 'string' ? name : '', style as WindowStyle)
    manager.broadcast('settings:changed', store.state)
    return preset
  })

  ipcMain.handle('style:remove', (_event, id: unknown) => {
    if (typeof id !== 'string') return false
    store.removeCustomStyle(id)
    manager.broadcast('settings:changed', store.state)
    return true
  })

  ipcMain.handle('style:applyAll', (_event, style: unknown) => {
    if (!style || typeof style !== 'object') return false
    store.applyStyleToAll(style as WindowStyle)
    manager.broadcast('settings:changed', store.state)
    return true
  })

  ipcMain.handle('window:resetPosition', (_event, target: unknown) => {
    if (!target || typeof target !== 'object') return false
    manager.resetWindowPosition(target as WindowTarget)
    manager.broadcast('settings:changed', store.state)
    return true
  })

  ipcMain.handle('windows:lockAll', (_event, locked: unknown) => {
    store.setAllLocked(Boolean(locked))
    manager.broadcast('settings:changed', store.state)
    return true
  })

  ipcMain.handle('windows:layerAll', (_event, layer: unknown) => {
    const safe = Number(layer)
    if (safe !== 0 && safe !== 1 && safe !== 2 && safe !== 3) return false
    store.setAllLayers(safe as WindowLayer)
    manager.reorderWindows()
    manager.broadcast('settings:changed', store.state)
    return true
  })

  ipcMain.handle('windows:resetAll', () => {
    manager.resetAllPositions()
    manager.broadcast('settings:changed', store.state)
    return true
  })

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

  ipcMain.handle('equalizer:add', () => {
    const instance = store.addEqualizer()
    if (!instance) return null
    manager.openEqualizer(instance)
    manager.broadcast('settings:changed', store.state)
    return instance
  })

  ipcMain.handle('equalizer:remove', (_event, id: unknown) => {
    if (typeof id !== 'string') return false
    manager.closeEqualizer(id)
    const removed = store.removeEqualizer(id)
    if (removed) manager.broadcast('settings:changed', store.state)
    return removed
  })

  ipcMain.handle('equalizer:open', (_event, id: unknown) => {
    if (typeof id !== 'string') return false
    const instance = store.equalizerById(id)
    if (!instance) return false
    manager.openEqualizer(instance)
    return true
  })

  ipcMain.handle('equalizer:close', (_event, id: unknown) => {
    if (typeof id !== 'string') return false
    manager.closeEqualizer(id)
    return true
  })

  ipcMain.handle('equalizer:patch', (_event, id: unknown, patch: unknown) => {
    if (typeof id !== 'string' || !patch || typeof patch !== 'object') return null
    const instance = store.updateEqualizer(id, patch as EqualizerInstancePatch)
    if (instance) manager.broadcast('settings:changed', store.state)
    return instance
  })

  ipcMain.handle('equalizer:center', (_event, id: unknown) => {
    if (typeof id !== 'string') return false
    manager.centerEqualizer(id)
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
              label: info.instanceId
                ? info.type === 'equalizer'
                  ? 'Скрыть эквалайзер'
                  : 'Скрыть город'
                : 'Скрыть виджет',
              click: () => {
                if (info.instanceId) {
                  if (info.type === 'equalizer') manager.closeEqualizer(info.instanceId)
                  else manager.closeWeather(info.instanceId)
                } else {
                  manager.close(info.type)
                }
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
