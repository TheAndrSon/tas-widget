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

export type WeatherUnits = 'metric' | 'imperial'
export type WeatherProvider = 'open-meteo' | 'metno' | 'wttr' | 'yandex'
export type SunMode = 'off' | 'compact' | 'arc'

export interface City {
  id: number
  name: string
  country: string
  admin1?: string
  lat: number
  lon: number
  /** IANA-зона города, если известна */
  timezone?: string
}

export interface AtmosphereIntensity {
  dawn: number
  day: number
  dusk: number
  night: number
}

export interface WeatherSettings {
  units: WeatherUnits
  provider: WeatherProvider
  /** ключ Яндекс.Погоды, хранится локально */
  yandexKey: string
  /** отдельная атмосфера по времени суток */
  atmosphere: boolean
  /** яркость каждого состояния, 0..1 */
  atmosphereIntensity: AtmosphereIntensity
  forecastDays: 0 | 3 | 5
  showCity: boolean
  showFeelsLike: boolean
  showWind: boolean
  showHumidity: boolean
  sunMode: SunMode
}

export interface WeatherInstance {
  id: string
  city: City
  x: number | null
  y: number | null
  enabled: boolean
  settings: WeatherSettings
}

export interface WeatherState {
  instances: WeatherInstance[]
}

export interface WeatherInstancePatch {
  city?: City
  settings?: Partial<WeatherSettings>
}

export type VisualizerMode = 'off' | 'bars' | 'radial' | 'line' | 'dots' | 'sparks' | 'waves'
export type VisualizerPalette = 'neon' | 'sunset' | 'ice' | 'matrix' | 'candy' | 'custom'

export interface VisualizerSettings {
  mode: VisualizerMode
  palette: VisualizerPalette
  color1: string
  color2: string
  /** 0.2..2 */
  intensity: number
  /** количество столбиков, 12..256 */
  bars: number
  /** толщина столбика, px */
  barThickness: number
  /** расстояние между столбиками, px */
  barGap: number
  /** максимальная высота, % высоты окна */
  maxHeight: number
  /** зеркальная копия относительно оси */
  mirror: boolean
  /** положение оси отражения, 0..1 */
  axis: number
  /** поворот всей фигуры, градусы */
  rotation: number
  mirrorX: boolean
  mirrorY: boolean
  lineThickness: number
  dotSize: number
  sparkSize: number
  sparkSpeed: number
  waveCount: number
  waveSpeed: number
  waveThickness: number
  /** нижняя и верхняя граница частот, Гц */
  freqMin: number
  freqMax: number
  freqScale: 'log' | 'linear'
}

export interface EqualizerSettings {
  visualizer: VisualizerSettings
  /** окно с фоном или прозрачная визуализация без рамки */
  windowed: boolean
  /** выбранный монитор для центрирования; null — текущий */
  displayId: number | null
}

export interface EqualizerInstance {
  id: string
  x: number | null
  y: number | null
  width: number
  height: number
  enabled: boolean
  settings: EqualizerSettings
}

export interface EqualizerState {
  instances: EqualizerInstance[]
}

export interface EqualizerInstancePatch {
  settings?: Partial<EqualizerSettings>
}

export interface AppSettings {
  widgets: Record<WidgetId, WidgetPlacement>
  system: SystemSettings
  music: MusicSettings
  weather: WeatherState
  equalizer: EqualizerState
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

export interface WeatherSun {
  sunrise: string
  sunset: string
  moonrise?: string
  moonset?: string
  /** ISO 8601, локальное время города */
  firstLight?: string
  lastLight?: string
}

export interface WeatherSnapshot {
  city: City
  provider: 'open-meteo' | 'metno' | 'wttr' | 'yandex' | '7timer'
  fetchedAt: number
  timezone: string
  utcOffsetSeconds: number
  sun: WeatherSun | null
  current: {
    temp: number
    feelsLike: number
    code: number
    isDay: boolean
    wind: number
    humidity: number
  }
  daily: Array<{
    date: string
    code: number
    tMax: number
    tMin: number
  }>
}

export type WeatherResult = { ok: true; data: WeatherSnapshot } | { ok: false; error: string }
