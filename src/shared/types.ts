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

export interface AppSettings {
  widgets: Record<WidgetId, WidgetPlacement>
  system: SystemSettings
}

export type SettingsPatch = {
  widgets?: Partial<Record<WidgetId, Partial<WidgetPlacement>>>
  system?: Partial<SystemSettings>
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
