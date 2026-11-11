import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppSettings,
  City,
  MusicAction,
  MusicSnapshot,
  SettingsPatch,
  SystemSample,
  WeatherInstance,
  WeatherInstancePatch,
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
  openSettings: (tab?: WidgetId): Promise<boolean> => ipcRenderer.invoke('settings:open', tab),
  showContextMenu: (): Promise<boolean> => ipcRenderer.invoke('ui:context-menu'),
  onSystemSample: (listener: (sample: SystemSample) => void): (() => void) =>
    subscribe('system:sample', listener),
  onSettingsChanged: (listener: (settings: AppSettings) => void): (() => void) =>
    subscribe('settings:changed', listener),
  onSettingsTab: (listener: (tab: WidgetId) => void): (() => void) =>
    subscribe('settings:tab', listener),
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
    ) as Promise<WeatherResult>,
  addWeather: (city: City): Promise<WeatherInstance | null> =>
    ipcRenderer.invoke('weather:add', city) as Promise<WeatherInstance | null>,
  removeWeather: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('weather:remove', id) as Promise<boolean>,
  openWeather: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('weather:open', id) as Promise<boolean>,
  closeWeather: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('weather:close', id) as Promise<boolean>,
  patchWeather: (id: string, patch: WeatherInstancePatch): Promise<WeatherInstance | null> =>
    ipcRenderer.invoke('weather:patch', id, patch) as Promise<WeatherInstance | null>
}

contextBridge.exposeInMainWorld('api', api)

export type WidgetApi = typeof api
