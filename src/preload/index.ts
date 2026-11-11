import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppSettings,
  City,
  EqualizerInstance,
  EqualizerInstancePatch,
  ImageAsset,
  MusicAction,
  MusicSnapshot,
  SettingsPatch,
  SimsAction,
  SimsDifficulty,
  SimsInstance,
  SimsMode,
  SimsNeed,
  SimsSettings,
  SimsState,
  SystemSample,
  WeatherInstance,
  WeatherInstancePatch,
  WeatherProvider,
  WeatherResult,
  WeatherUnits,
  WidgetId,
  WindowLayer,
  WindowStyle,
  WindowStylePreset,
  WindowTarget
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
  setWindowLock: (target: WindowTarget, locked: boolean): Promise<boolean> =>
    ipcRenderer.invoke('window:setLock', target, locked),
  setWindowLayer: (target: WindowTarget, layer: WindowLayer): Promise<boolean> =>
    ipcRenderer.invoke('window:setLayer', target, layer),
  listImages: (): Promise<ImageAsset[]> => ipcRenderer.invoke('image:list'),
  addImage: (): Promise<ImageAsset | null> => ipcRenderer.invoke('image:add'),
  getImage: (id: string): Promise<string | null> => ipcRenderer.invoke('image:get', id),
  removeImage: (id: string): Promise<boolean> => ipcRenderer.invoke('image:remove', id),
  setWindowStyle: (target: WindowTarget, style: WindowStyle): Promise<boolean> =>
    ipcRenderer.invoke('window:setStyle', target, style),
  saveStyle: (name: string, style: WindowStyle): Promise<WindowStylePreset | null> =>
    ipcRenderer.invoke('style:save', name, style),
  removeStyle: (id: string): Promise<boolean> => ipcRenderer.invoke('style:remove', id),
  applyStyleToAll: (style: WindowStyle): Promise<boolean> =>
    ipcRenderer.invoke('style:applyAll', style),
  resetWindowPosition: (target: WindowTarget): Promise<boolean> =>
    ipcRenderer.invoke('window:resetPosition', target),
  lockAll: (locked: boolean): Promise<boolean> => ipcRenderer.invoke('windows:lockAll', locked),
  layerAll: (layer: WindowLayer): Promise<boolean> => ipcRenderer.invoke('windows:layerAll', layer),
  resetAllPositions: (): Promise<boolean> => ipcRenderer.invoke('windows:resetAll'),
  getDisplays: (): Promise<
    Array<{ id: number; label: string; width: number; height: number; x: number; y: number }>
  > => ipcRenderer.invoke('app:displays'),
  addEqualizer: (): Promise<EqualizerInstance | null> =>
    ipcRenderer.invoke('equalizer:add') as Promise<EqualizerInstance | null>,
  removeEqualizer: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('equalizer:remove', id) as Promise<boolean>,
  openEqualizer: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('equalizer:open', id) as Promise<boolean>,
  closeEqualizer: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('equalizer:close', id) as Promise<boolean>,
  patchEqualizer: (id: string, patch: EqualizerInstancePatch): Promise<EqualizerInstance | null> =>
    ipcRenderer.invoke('equalizer:patch', id, patch) as Promise<EqualizerInstance | null>,
  centerEqualizer: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('equalizer:center', id) as Promise<boolean>,
  getSims: (): Promise<Record<string, SimsState>> => ipcRenderer.invoke('sims:get'),
  onSimsChanged: (listener: (groups: Record<string, SimsState>) => void): (() => void) =>
    subscribe('sims:changed', listener),
  resetSims: (groupId: string): Promise<SimsState | null> =>
    ipcRenderer.invoke('sims:reset', groupId),
  addSims: (mode: SimsMode): Promise<SimsInstance | null> =>
    ipcRenderer.invoke('sims:add', mode) as Promise<SimsInstance | null>,
  removeSims: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('sims:remove', id) as Promise<boolean>,
  openSims: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('sims:open', id) as Promise<boolean>,
  closeSims: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('sims:close', id) as Promise<boolean>,
  patchSims: (
    id: string,
    patch: { settings?: Partial<SimsSettings>; groupId?: string }
  ): Promise<SimsInstance | null> =>
    ipcRenderer.invoke('sims:patch', id, patch) as Promise<SimsInstance | null>,
  simsAction: (
    groupId: string,
    action: SimsAction,
    need: SimsNeed,
    difficulty: SimsDifficulty
  ): Promise<SimsState | null> =>
    ipcRenderer.invoke(
      'sims:action',
      groupId,
      action,
      need,
      difficulty
    ) as Promise<SimsState | null>,
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
