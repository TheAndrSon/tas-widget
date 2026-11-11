import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppSettings,
  MusicAction,
  MusicSnapshot,
  SettingsPatch,
  SystemSample,
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
  }
}

contextBridge.exposeInMainWorld('api', api)

export type WidgetApi = typeof api
