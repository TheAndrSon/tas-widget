import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppSettings,
  City,
  MusicAction,
  MusicSnapshot,
  SettingsPatch,
  SystemSample,
  WeatherProvider,
  WeatherResult,
  WeatherUnits,
  WidgetId
} from '../shared/types'

function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
  const handler = (_event: unknown, payload: T): void => listener(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const api = {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  patchSettings: (patch: SettingsPatch): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:patch', patch),
  openWidget: (id: WidgetId): Promise<boolean> => ipcRenderer.invoke('widget:open', id),
  closeWidget: (id: WidgetId): Promise<boolean> => ipcRenderer.invoke('widget:close', id),
  quit: (): Promise<boolean> => ipcRenderer.invoke('app:quit'),
  openSettings: (): Promise<boolean> => ipcRenderer.invoke('settings:open'),
  showContextMenu: (): Promise<boolean> => ipcRenderer.invoke('ui:context-menu'),
  onSystemSample: (listener: (sample: SystemSample) => void): (() => void) =>
    subscribe('system:sample', listener),
  onSettingsChanged: (listener: (settings: AppSettings) => void): (() => void) =>
    subscribe('settings:changed', listener),
  getMusic: (): Promise<MusicSnapshot> => ipcRenderer.invoke('music:get'),
  onMusicSample: (listener: (snapshot: MusicSnapshot) => void): (() => void) =>
    subscribe('music:sample', listener),
  musicControl: (action: MusicAction, positionMs?: number): void => {
    ipcRenderer.send('music:control', action, positionMs)
  },
  searchCity: (query: string): Promise<City[]> =>
    ipcRenderer.invoke('weather:search', query) as Promise<City[]>,
  getWeather: (
    city: City,
    units: WeatherUnits,
    provider: WeatherProvider,
    yandexKey = ''
  ): Promise<WeatherResult> =>
    ipcRenderer.invoke(
      'weather:forecast',
      city,
      units,
      provider,
      yandexKey
    ) as Promise<WeatherResult>
}

contextBridge.exposeInMainWorld('api', api)

export type WidgetApi = typeof api
