export type WidgetId = 'system' | 'music' | 'weather' | 'equalizer' | 'plumbob'

export interface WidgetMeta {
  id: WidgetId
  title: string
  width: number
  height: number
  /** Готов ли виджет к запуску. Плановые показываем только в документации. */
  ready: boolean
}

export interface WidgetPlacement {
  /** null — позиция по умолчанию (правый верхний угол). */
  x: number | null
  y: number | null
  enabled: boolean
}

export interface SystemSettings {
  /** Период опроса в миллисекундах. */
  intervalMs: number
}

export interface MusicSettings {
  showArt: boolean
  showProgress: boolean
  showControls: boolean
  showSource: boolean
}

export interface AppSettings {
  widgets: Record<WidgetId, WidgetPlacement>
  system: SystemSettings
  music: MusicSettings
}

export type SettingsPatch = {
  widgets?: Partial<Record<WidgetId, Partial<WidgetPlacement>>>
  system?: Partial<SystemSettings>
  music?: Partial<MusicSettings>
}

export interface DiskSample {
  mount: string
  used: number
  size: number
}

export interface SystemSample {
  cpu: number
  memUsed: number
  memTotal: number
  disks: DiskSample[]
  at: number
}

export type MusicStatus = 'playing' | 'paused' | 'stopped' | 'closed' | 'unavailable'

export interface MusicSnapshot {
  status: MusicStatus
  title?: string
  artist?: string
  album?: string
  source?: string
  positionMs?: number
  durationMs?: number
  playbackRate?: number
  canPlay?: boolean
  canNext?: boolean
  canPrev?: boolean
  canSeek?: boolean
  artwork?: string
  artworkKey?: string
  updatedAt: number
  error?: string
}

export type MusicAction = 'toggle' | 'next' | 'prev' | 'seek'
