import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings, SettingsPatch, SystemSample, WidgetId } from '../shared/types'

const api = {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
  patchSettings: (patch: SettingsPatch): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:patch', patch),
  openWidget: (id: WidgetId): Promise<boolean> => ipcRenderer.invoke('widget:open', id),
  closeWidget: (id: WidgetId): Promise<boolean> => ipcRenderer.invoke('widget:close', id),
  quit: (): Promise<boolean> => ipcRenderer.invoke('app:quit'),
  openSettings: (): Promise<boolean> => ipcRenderer.invoke('settings:open'),
  showContextMenu: (): Promise<boolean> => ipcRenderer.invoke('ui:context-menu'),
  onSystemSample: (listener: (sample: SystemSample) => void): (() => void) => {
    const handler = (_event: unknown, sample: SystemSample): void => listener(sample)
    ipcRenderer.on('system:sample', handler)
    return () => ipcRenderer.removeListener('system:sample', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type WidgetApi = typeof api
