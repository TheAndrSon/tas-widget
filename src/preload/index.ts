import { contextBridge, ipcRenderer } from 'electron'
import type {
  AlignAction,
  City,
  DeepPartial,
  GeneralSettings,
  ImageAsset,
  LayerMode,
  MoveModifiers,
  MusicAction,
  MusicSnapshot,
  PersistedState,
  RuntimeInfo,
  SettingsTab,
  SimsAction,
  Size,
  StylePreset,
  TarotDeck,
  FinanceResult,
  SystemResult,
  TwitchResult,
  WeatherProvider,
  WeatherResult,
  WeatherUnits,
  WidgetApi,
  WidgetInstance,
  WidgetSettings,
  WidgetStyle,
  WidgetType,
  ZodiacPack
} from '../shared/types'

function subscribe<T>(channel: string, callback: (value: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, value: T): void => callback(value)
  ipcRenderer.on(channel, handler)
  return () => {
    ipcRenderer.removeListener(channel, handler)
  }
}

const api: WidgetApi = {
  getState: () => ipcRenderer.invoke('state:get') as Promise<PersistedState>,
  onState: (callback) => subscribe<PersistedState>('state:changed', callback),

  updateWidget: (id: string, patch: Partial<WidgetInstance>) =>
    ipcRenderer.invoke('widget:update', id, patch) as Promise<PersistedState>,
  updateWidgetSettings: (id: string, patch: DeepPartial<WidgetSettings>) =>
    ipcRenderer.invoke('widget:update-settings', id, patch) as Promise<PersistedState>,
  updateGeneral: (patch: Partial<GeneralSettings>) =>
    ipcRenderer.invoke('general:update', patch) as Promise<PersistedState>,
  addWidget: (type: WidgetType, sourceId?: string) =>
    ipcRenderer.invoke('widget:add', type, sourceId) as Promise<WidgetInstance | null>,
  removeWidget: (id: string) => ipcRenderer.invoke('widget:remove', id) as Promise<boolean>,

  setLocked: (id, locked) => ipcRenderer.invoke('widget:set-locked', id, locked) as Promise<void>,
  setLockedAll: (locked) => ipcRenderer.invoke('widget:set-locked-all', locked) as Promise<void>,
  setLayerAll: (layer: LayerMode) =>
    ipcRenderer.invoke('widget:set-layer-all', layer) as Promise<void>,

  openSettings: (tab?: SettingsTab) => ipcRenderer.send('settings:open', tab),
  closeSettings: () => ipcRenderer.send('settings:close'),
  setSettingsCollapsed: (collapsed: boolean) =>
    ipcRenderer.send('settings:set-collapsed', collapsed),

  setContentSize: (id, width, height) => ipcRenderer.send('widget:content-size', id, width, height),
  setManualSize: (id, size: Size | null) => ipcRenderer.send('widget:set-manual-size', id, size),
  resetPositions: () => ipcRenderer.invoke('widget:reset-positions') as Promise<void>,
  setLayoutMode: (enabled: boolean) =>
    ipcRenderer.invoke('layout:set', enabled) as Promise<PersistedState>,
  setArrowMove: (enabled: boolean) =>
    ipcRenderer.invoke('layout:arrow-move', enabled) as Promise<PersistedState>,
  selectLayoutWidget: (id: string | null) =>
    ipcRenderer.invoke('layout:select', id) as Promise<PersistedState>,
  toggleGrid: () => ipcRenderer.invoke('layout:toggle-grid') as Promise<PersistedState>,
  alignWidget: (id: string, action: AlignAction) =>
    ipcRenderer.invoke('layout:align', id, action) as Promise<PersistedState>,
  moveWidgetBy: (id: string, dx: number, dy: number, modifiers: MoveModifiers) =>
    ipcRenderer.invoke('layout:move', id, dx, dy, modifiers) as Promise<void>,
  moveWindowBy: (id: string, dx: number, dy: number) =>
    ipcRenderer.invoke('widget:move-window', id, dx, dy) as Promise<void>,
  offsetWindowBy: (id: string, dx: number, dy: number) =>
    ipcRenderer.invoke('widget:offset-window', id, dx, dy) as Promise<void>,

  searchCity: (query: string) => ipcRenderer.invoke('weather:search', query) as Promise<City[]>,
  getWeather: (city: City, units: WeatherUnits, provider: WeatherProvider, yandexKey?: string) =>
    ipcRenderer.invoke('weather:forecast', city, units, provider, yandexKey) as Promise<WeatherResult>,
  getFinance: (codes: string[]) =>
    ipcRenderer.invoke('finance:get', codes) as Promise<FinanceResult>,
  getTwitch: (settings: { channels: string[]; clientId: string; clientSecret: string }) =>
    ipcRenderer.invoke('twitch:get', settings) as Promise<TwitchResult>,
  getSystem: () => ipcRenderer.invoke('system:get') as Promise<SystemResult>,
  getFonts: () => ipcRenderer.invoke('fonts:list') as Promise<string[]>,

  getMusic: () => ipcRenderer.invoke('music:get') as Promise<MusicSnapshot>,
  onMusic: (callback) => subscribe<MusicSnapshot>('music:updated', callback),
  musicControl: (action: MusicAction, positionMs?: number) =>
    ipcRenderer.send('music:control', action, positionMs),

  pickImage: () => ipcRenderer.invoke('image:pick') as Promise<ImageAsset | null>,
  deleteImage: (id: string) =>
    ipcRenderer.invoke('image:delete', id) as Promise<{ ok: boolean; used?: boolean }>,
  savePreset: (name: string, style: WidgetStyle) =>
    ipcRenderer.invoke('preset:save', name, style) as Promise<StylePreset>,
  deletePreset: (id: string) => ipcRenderer.invoke('preset:delete', id) as Promise<boolean>,

  saveZodiacPack: (pack: ZodiacPack) =>
    ipcRenderer.invoke('zodiac:save', pack) as Promise<ZodiacPack>,
  deleteZodiacPack: (id: string) =>
    ipcRenderer.invoke('zodiac:delete', id) as Promise<boolean>,
  saveTarotDeck: (deck: TarotDeck) =>
    ipcRenderer.invoke('tarot:save-deck', deck) as Promise<TarotDeck>,
  deleteTarotDeck: (id: string) =>
    ipcRenderer.invoke('tarot:delete-deck', id) as Promise<boolean>,
  simsAction: (groupId: string, action: SimsAction, difficulty?: 'classic' | 'hard') =>
    ipcRenderer.invoke('sims:action', groupId, action, difficulty) as Promise<PersistedState>,
  openSimsMenu: (id: string) => ipcRenderer.send('sims:open-menu', id),
  closeSimsMenu: () => ipcRenderer.send('sims:close-menu'),
  alignEqualizer: (id: string, edge: 'top' | 'bottom' | 'left' | 'right') =>
    ipcRenderer.invoke('equalizer:align', id, edge) as Promise<void>,

  onSelectTab: (callback) => subscribe<SettingsTab>('settings:select', callback),
  onSettingsFocus: (callback) => subscribe<string | null>('settings:focus', callback),
  setSettingsTab: (tab: SettingsTab) => ipcRenderer.send('settings:active', tab),
  onCursor: (callback) =>
    subscribe<{ x: number; y: number }>('cursor:position', callback),
  getRuntime: () => ipcRenderer.invoke('app:runtime') as Promise<RuntimeInfo>,
  openExternal: (url: string) => ipcRenderer.send('external:open', url),
  quit: () => ipcRenderer.send('app:quit')
}

contextBridge.exposeInMainWorld('widgets', api)
