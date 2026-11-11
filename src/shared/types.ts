/** Общие типы состояния и IPC-контракта. Используется в main, preload и renderer. */

export type WidgetType =
  | 'weather'
  | 'music'
  | 'clock'
  | 'weekday'
  | 'calendar'
  | 'astro'
  | 'tarot'
  | 'dice'
  | 'equalizer'
  | 'todo'
  | 'sims'
  | 'finance'
  | 'twitch'
  | 'system'
export type LayerMode = 'always' | 'desktop'
/** id экземпляра виджета или 'general' */
export type SettingsTab = string
export type WeatherUnits = 'metric' | 'imperial'
export type WeatherProvider = 'open-meteo' | 'metno' | 'wttr' | 'yandex'
export type CalendarView = 'week' | 'month' | '3months'
export type SunMode = 'off' | 'compact' | 'arc'

export const WIDGET_TYPES: WidgetType[] = [
  'weather',
  'music',
  'system',
  'sims',
  'finance',
  'equalizer',
  'calendar',
  'astro',
  'tarot',
  'clock',
  'weekday',
  'dice',
  'todo',
  'twitch'
]

export const DUPLICABLE_TYPES: WidgetType[] = [
  'weather',
  'calendar',
  'sims',
  'todo',
  'equalizer',
  'finance',
  'twitch',
  'system'
]
export const MAX_COPIES_PER_TYPE = 5

export const WIDGET_META: Record<
  WidgetType,
  { title: string; hint: string; defaultSize: { width: number; height: number } }
> = {
  weather: {
    title: 'Погода',
    hint: 'Текущая погода, прогноз и солнце',
    defaultSize: { width: 320, height: 300 }
  },
  music: {
    title: 'Музыка',
    hint: 'Что играет сейчас: трек, обложка, прогресс',
    defaultSize: { width: 340, height: 170 }
  },
  clock: {
    title: 'Время',
    hint: 'Большие часы и дата',
    defaultSize: { width: 260, height: 150 }
  },
  weekday: {
    title: 'День недели',
    hint: 'Текущий день недели и дата',
    defaultSize: { width: 260, height: 140 }
  },
  calendar: {
    title: 'Календарь',
    hint: 'Неделя, месяц или три месяца сразу',
    defaultSize: { width: 330, height: 400 }
  },
  astro: {
    title: 'Астро',
    hint: 'Знак зодиака, Луна и совет дня',
    defaultSize: { width: 300, height: 260 }
  },
  tarot: {
    title: 'Таро',
    hint: 'Расклад на день: прототип',
    defaultSize: { width: 340, height: 280 }
  },
  dice: {
    title: 'Кубик',
    hint: 'd6, d20 и монета',
    defaultSize: { width: 280, height: 220 }
  },
  equalizer: {
    title: 'Эквалайзер',
    hint: 'Живая визуализация музыки',
    defaultSize: { width: 320, height: 150 }
  },
  todo: {
    title: 'Дела на неделю',
    hint: 'Список дел, стикеры и заметки',
    defaultSize: { width: 330, height: 380 }
  },
  sims: {
    title: 'Sims',
    hint: 'Пламбоб и потребности персонажа',
    defaultSize: { width: 280, height: 300 }
  },
  finance: {
    title: 'Финансы',
    hint: 'Ставка ЦБ, курсы и калькулятор',
    defaultSize: { width: 330, height: 240 }
  },
  twitch: {
    title: 'Twitch',
    hint: 'Статус каналов и онлайн',
    defaultSize: { width: 300, height: 240 }
  },
  system: {
    title: 'Система',
    hint: 'Мини-монитор CPU, RAM, GPU и сети',
    defaultSize: { width: 300, height: 130 }
  }
}

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

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface CustomDate {
  id: string
  /** YYYY-MM-DD */
  date: string
  label: string
  color: string
  heart: boolean
}

export interface WeatherSettings {
  city: City | null
  units: WeatherUnits
  provider: WeatherProvider
  /** ключ Яндекс.Погоды, хранится локально */
  yandexKey: string
  /** отдельная атмосфера по времени суток */
  atmosphere: boolean
  forecastDays: 0 | 3 | 5
  showCity: boolean
  showFeelsLike: boolean
  showWind: boolean
  showHumidity: boolean
  sunMode: SunMode
}

export type VisualizerMode =
  'off' | 'bars' | 'radial' | 'line' | 'dots' | 'particles' | 'face' | 'waves' | 'waveform'
export type VisualizerPalette =
  'neon' | 'sunset' | 'ice' | 'matrix' | 'candy' | 'aurora' | 'fire' | 'custom'
export type BarShape = 'rounded' | 'rect'
export type AudioSource = 'system' | 'window' | 'multi'

export interface VisualizerSettings {
  mode: VisualizerMode
  palette: VisualizerPalette
  color1: string
  color2: string
  /** 0.2..2 */
  intensity: number
  /** 12..3600; по умолчанию 64 */
  bars: number
  barThickness: number
  barGap: number
  barShape: BarShape
  mirror: boolean
  axis: number
  rotation: number
  mirrorX: boolean
  mirrorY: boolean
  /** максимальная высота столбика, % высоты виджета */
  maxHeight: number
  source: AudioSource
  /** окна для режима «несколько окон» (пока системный микс) */
  audioWindowIds: string[]
  /** ось зеркала: от начала или от конца шкалы */
  mirrorOrigin: 'start' | 'end'
  /** нижняя и верхняя граница частот, Гц */
  freqMin: number
  freqMax: number
  freqScale: 'log' | 'linear'
  lineThickness: number
  dotSize: number
  sparkSize: number
  sparkSpeed: number
  particleOrigin: 'bottom' | 'center'
  particleCount: number
  particleReactivity: number
  particleSpread: number
  particleRandomSize: boolean
  /** 0..1 — разброс размера частиц в режиме «В лицо» */
  particleSizeVariability: number
  /** 0..3 — насколько звук ускоряет частицы в режиме «В лицо» */
  particleSpeedReactivity: number
  /** использовать половину спектра и отразить её */
  halfSpectrum: boolean
  radialHalf: boolean
  waveCount: number
  waveSpeed: number
  waveThickness: number
  waveLife: number
  waveIntensity: number
  waveRadius: number
  glowEnabled: boolean
  glowIntensity: number
  glowSpread: number
  mirrorOffsetX: number
  mirrorOffsetY: number
  /** устаревшие поля старых режимов, оставлены для миграции */
  ringThickness: number
  ringPulse: number
  gradientAngle: number
  gradientScale: number
  gradientSpeed: number
}

export interface MusicSettings {
  showArt: boolean
  showProgress: boolean
  showControls: boolean
  showSource: boolean
  interactiveWhenLocked: boolean
  visualizer: VisualizerSettings
}

export interface EqualizerSettings {
  visualizer: VisualizerSettings
  showTrack: boolean
  showLabel: boolean
  interactiveWhenLocked: boolean
  /** обычное окно или полоса по краю монитора */
  dock: 'free' | 'bottom' | 'top' | 'left' | 'right'
  dockThickness: number
  /** выбранный монитор; null — текущий */
  displayId: number | null
  /** 0.5..5 — масштаб свободной визуализации */
  scale: number
  /** растянуть на весь монитор вплотную к краям */
  stretch: boolean
  mirrorX: boolean
  mirrorY: boolean
}

export interface ClockSettings {
  format24: boolean
  showSeconds: boolean
  /** дополнительное время другого города */
  showCityTime: boolean
  city: City | null
  separator: 'dots' | 'colon' | 'bar' | 'none'
}

export type WeekdayLanguage = 'ru' | 'en'

export interface WeekdaySettings {
  showWeekday: boolean
  weekdayFormat: 'full' | 'short'
  uppercase: boolean
  language: WeekdayLanguage
  showSecondary: boolean
  showDate: boolean
  dateFormat: 'long' | 'numeric' | 'short'
  showWeekNumber: boolean
}

export interface CalendarSettings {
  view: CalendarView
  layout: 'row' | 'column'
  showHolidays: boolean
  showWeekNumbers: boolean
  /** цвет праздников по производственному календарю */
  holidayColor: string
  customDates: CustomDate[]
}

export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces'

export type AstroView = 'sign' | 'check' | 'all'

export interface AstroSettings {
  /** YYYY-MM-DD; пусто — знак дня по текущей дате */
  birthDate: string
  sign: ZodiacSign | 'auto'
  view: AstroView
  checkDay: number
  checkMonth: number
  showMoon: boolean
  showPhrase: boolean
  showElement: boolean
  zodiacPackId: string | null
}

export interface TarotSettings {
  spread: 1 | 3 | 5
  reversed: boolean
  showMeanings: boolean
  interactiveWhenLocked: boolean
  /** карты сначала рубашкой; переворачиваются по клику */
  faceDown: boolean
  deckId: string | null
  /** своя рубашка для этого виджета */
  back: ImageSlot | null
}

export type DiceKind = 'd6' | 'd20' | 'coin'

export interface DiceSettings {
  die: DiceKind
  count: 1 | 2 | 3
  crit: boolean
  interactiveWhenLocked: boolean
  showPips: boolean
  showFaceText: boolean
  /** подписи «Орёл/Решка» на самой монете */
  showCoinLabel: boolean
  /** отключить рамку/свечение кубика при своём скине */
  hideOutline: boolean
  diceSkin: ImageSlot | null
  coinHeads: ImageSlot | null
  coinTails: ImageSlot | null
  /** свои тексты критических исходов, до 70 символов */
  critText: string
  failText: string
}

export interface TodoItem {
  id: string
  text: string
  /** YYYY-MM-DD */
  date: string
  done: boolean
}

export type StickerKind =
  | 'heart'
  | 'sun'
  | 'star'
  | 'flower'
  | 'smile'
  | 'skull'
  | 'bat'
  | 'moon'
  | 'coffin'
  | 'spider'
  | 'custom'

export interface TodoSticker {
  id: string
  kind: StickerKind
  imageId: string | null
  crop: ImageCrop
  /** 0..1 относительно карточки */
  x: number
  y: number
  /** 0.4..2 */
  scale: number
  /** -35..35 */
  rotation: number
}

export interface TodoSettings {
  view: 'today' | 'week'
  items: TodoItem[]
  stickers: TodoSticker[]
  stickerSet: 'cute' | 'gothic' | 'custom'
  showCompleted: boolean
  interactiveWhenLocked: boolean
}

export type SimsMode = 'plumbob' | 'needs'
export type SimsAnimation = 'float' | 'spin' | 'pulse' | 'none'
export type SimsDifficulty = 'classic' | 'hard'

export interface SimsSettings {
  mode: SimsMode
  /** общая группа: несколько виджетов реагируют друг на друга */
  groupId: string
  /** подпись на виджете */
  label: string
  difficulty: SimsDifficulty
  showPoints: boolean
  showDifficulty: boolean
  showMoodValue: boolean
  /** тонкая стрелка у пламбоба, открывающая меню */
  showArrow: boolean
  /** classic — текущие лепестки, faceted — кристалл из граней */
  plumbobVariant: 'classic' | 'faceted'
  colorMode: 'mood' | 'custom'
  color: string
  showLabel: boolean
  animation: SimsAnimation
  bling: boolean
  blingIntensity: number
  interactiveWhenLocked: boolean
}

export interface SimsStats {
  actions: number
  days: number
  goodDays: number
  perfectDays: number
  bestMood: number
  pointsEarned: number
  worsenCount: number
  needActions: Record<'hunger' | 'energy' | 'fun' | 'social' | 'hygiene', number>
  needMinToday: Record<'hunger' | 'energy' | 'fun' | 'social' | 'hygiene', number>
  needStreaks: Record<'hunger' | 'energy' | 'fun' | 'social' | 'hygiene', number>
  lastDay: string
  lastPenaltyAt: number
  lastBonusAt: number
}

export interface SimsMood {
  /** 0..100 */
  mood: number
  hunger: number
  energy: number
  fun: number
  social: number
  hygiene: number
  /** игровые баллы, общие для группы */
  points: number
  updatedAt: number
  stats: SimsStats
  unlocked: string[]
}

export interface FinanceSettings {
  currencyCodes: string[]
  showKeyRate: boolean
  calculatorOpen: boolean
  calculatorMode: 'credit' | 'mortgage' | 'deposit'
  amount: number
  rate: number
  months: number
  downPayment: number
  paymentType: 'annuity' | 'differentiated'
  monthlyExtra: number
}

export interface TwitchSettings {
  channels: string[]
  clientId: string
  clientSecret: string
  showOffline: boolean
}

export interface SystemSettings {
  orientation: 'horizontal' | 'vertical'
  showCpu: boolean
  showRam: boolean
  showGpu: boolean
  showNetwork: boolean
  showDisks: boolean
}

export interface WidgetSettingsMap {
  weather: WeatherSettings
  music: MusicSettings
  clock: ClockSettings
  weekday: WeekdaySettings
  calendar: CalendarSettings
  astro: AstroSettings
  tarot: TarotSettings
  dice: DiceSettings
  equalizer: EqualizerSettings
  todo: TodoSettings
  sims: SimsSettings
  finance: FinanceSettings
  twitch: TwitchSettings
  system: SystemSettings
}

export type WidgetSettings = WidgetSettingsMap[WidgetType]

/* ------------------------------------------------------------------ */
/* Стили и фоны                                                        */
/* ------------------------------------------------------------------ */

export type ShapeId = 'squircle' | 'rect' | 'custom'
export type CursorEffect = 'none' | 'glow' | 'ring' | 'sparkles' | 'trail' | 'spotlight' | 'fairy'
export type BackgroundKind = 'glass' | 'color' | 'gradient' | 'image'
export type TextureKind = 'none' | 'noise' | 'grid' | 'scanlines' | 'paper'
export type AmbientKind = 'none' | 'stars' | 'weather' | 'fireflies' | 'matrix' | 'synthwave'
export type BorderKind =
  'solid' | 'dashed' | 'dotted' | 'double' | 'neon' | 'gradient' | 'fireflies'
export type TextAlign = 'left' | 'center' | 'right'
export type OutlineMode = 'center' | 'outside'
export type TextPattern = 'none' | 'horizontal' | 'diagonal' | 'dots' | 'grid'

export interface ImageCrop {
  /** 0..100 — object-position */
  x: number
  y: number
  /** 1..3 */
  zoom: number
}

export interface ImageAsset {
  id: string
  name: string
  file: string
  width: number
  height: number
}

export interface BackgroundStyle {
  kind: BackgroundKind
  color: string
  color2: string
  angle: number
  opacity: number
  blur: number
  darken: number
  imageId: string | null
  crop: ImageCrop
}

export interface FramePlacement {
  /** % ширины/высоты карточки */
  x: number
  y: number
  /** 100 = вписать по размеру */
  scaleX: number
  scaleY: number
  rotate: number
  /** растягивать по обеим осям независимо */
  stretch: boolean
}

export interface ImageSlot {
  enabled: boolean
  imageId: string
  crop: ImageCrop
  opacity: number
  darken: number
  blend: 'normal' | 'screen' | 'multiply' | 'overlay' | 'soft-light'
  /** сдвиг рамки наружу, % (для frame) */
  inset: number
  /** для frame: behind — под карточкой, above — поверх контента */
  position: 'behind' | 'above'
  placement: FramePlacement
}

export interface BorderStyle {
  enabled: boolean
  style: BorderKind
  width: number
  color: string
  color2: string
  opacity: number
  /** 0..2 — сила свечения */
  glow: number
  /** 0..48 — радиус/размер свечения, px */
  glowSize: number
  animated: boolean
}

export interface FontEffects {
  outline: {
    enabled: boolean
    width: number
    color: string
    opacity: number
    mode: OutlineMode
  }
  shadow: {
    enabled: boolean
    color: string
    opacity: number
    blur: number
    offsetX: number
    offsetY: number
  }
  contrastPrimary: boolean
  contrastSecondary: boolean
  /** декоративный паттерн заливки текста */
  pattern: TextPattern
}

export interface AmbientStyle {
  kind: AmbientKind
  intensity: number
  color: string
  /** частота падающих звёзд для режима «Звёзды» */
  shootingFrequency: number
}

export interface CornerRadii {
  tl: number
  tr: number
  br: number
  bl: number
}

export interface WidgetStyle {
  presetId: string | null
  /** полностью прозрачное окно: только контент и паддинг */
  windowless: boolean
  shape: ShapeId
  radius: number
  corners: CornerRadii
  background: BackgroundStyle
  border: BorderStyle
  textColor: string
  mutedColor: string
  accent: string | null
  fontFamily: string
  fontScale: number
  font: FontEffects
  align: { primary: TextAlign; secondary: TextAlign }
  underlay: ImageSlot | null
  overlay: ImageSlot | null
  frame: ImageSlot | null
  cursorEffect: CursorEffect
  texture: TextureKind
  ambient: AmbientStyle
}

export interface WidgetInstance {
  id: string
  type: WidgetType
  enabled: boolean
  locked: boolean
  layer: LayerMode
  opacity: number
  scale: number
  position: Position | null
  contentSize: Size | null
  manualSize: Size | null
  /** монитор, на котором виджет закреплён при блокировке */
  displayId?: number | null
  settings: WidgetSettings
  style: WidgetStyle
}

export interface GridSettings {
  enabled: boolean
  step: number
  showGrid: boolean
  snapEdges: boolean
}

export interface GeneralSettings {
  autostart: boolean
  /** 0 — монитор с курсором, иначе display.id */
  defaultDisplayId: number
  layoutMode: boolean
  arrowMove: boolean
  layoutFocusId: string | null
  grid: GridSettings
}

export interface StylePreset {
  id: string
  name: string
  builtin: boolean
  style: WidgetStyle
}

export interface ZodiacPack {
  id: string
  name: string
  builtin: boolean
  images: Partial<Record<ZodiacSign, ImageSlot | null>>
}

export interface TarotDeck {
  id: string
  name: string
  builtin: boolean
  cards: Record<string, ImageSlot | null>
  /** своя рубашка всей колоды */
  back?: ImageSlot | null
  /** свои названия и значения карт для кастомной колоды */
  meanings?: Record<string, { name?: string; upright?: string; reversed?: string }>
}

export interface PersistedState {
  version: number
  widgets: WidgetInstance[]
  general: GeneralSettings
  customPresets: StylePreset[]
  images: ImageAsset[]
  zodiacPacks: ZodiacPack[]
  tarotDecks: TarotDeck[]
  sims: Record<string, SimsMood>
}

export interface DisplayInfo {
  id: number
  label: string
  primary: boolean
  workArea: { x: number; y: number; width: number; height: number }
  scaleFactor: number
}

export interface RuntimeInfo {
  version: string
  electron: string
  platform: string
  displays: DisplayInfo[]
  hotkey: string
  packaged: boolean
}

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
export type SimsAction = 'feed' | 'play' | 'sleep' | 'shower' | 'chat' | 'worsen' | 'reset'

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Array<unknown>
      ? T[K]
      : DeepPartial<T[K]>
    : T[K]
}

export type FinanceResult =
  | {
      ok: true
      keyRate: number | null
      keyRateDate: string | null
      currencies: Array<{
        code: string
        name: string
        nominal: number
        value: number
        previous: number
        change: number
      }>
      fetchedAt: number
    }
  | { ok: false; error: string }

export interface TwitchChannelInfo {
  login: string
  displayName: string
  live: boolean
  title?: string
  game?: string
  viewers?: number
  startedAt?: string
  thumbnail?: string
  url: string
}

export type TwitchResult =
  | { ok: true; channels: TwitchChannelInfo[]; configured: boolean; fetchedAt: number }
  | { ok: false; error: string; configured: boolean }

export interface SystemDisk {
  mount: string
  size: number
  used: number
}

export interface SystemSnapshot {
  cpu: number
  cpuTemp: number | null
  ramUsed: number
  ramTotal: number
  gpu: string | null
  gpuLoad: number | null
  gpuTemp: number | null
  netRx: number
  netTx: number
  disks: SystemDisk[]
  fetchedAt: number
}

export type SystemResult = { ok: true; data: SystemSnapshot } | { ok: false; error: string }

export interface WidgetApi {
  getState(): Promise<PersistedState>
  onState(cb: (state: PersistedState) => void): () => void

  updateWidget(id: string, patch: Partial<WidgetInstance>): Promise<PersistedState>
  updateWidgetSettings(id: string, patch: DeepPartial<WidgetSettings>): Promise<PersistedState>
  updateGeneral(patch: Partial<GeneralSettings>): Promise<PersistedState>
  addWidget(type: WidgetType, sourceId?: string): Promise<WidgetInstance | null>
  removeWidget(id: string): Promise<boolean>

  setLocked(id: string, locked: boolean): Promise<void>
  setLockedAll(locked: boolean): Promise<void>
  setLayerAll(layer: LayerMode): Promise<void>

  openSettings(tab?: SettingsTab): void
  closeSettings(): void
  setSettingsCollapsed(collapsed: boolean): void

  setContentSize(id: string, width: number, height: number): void
  setManualSize(id: string, size: Size | null): void
  resetPositions(): Promise<void>
  setLayoutMode(enabled: boolean): Promise<PersistedState>
  setArrowMove(enabled: boolean): Promise<PersistedState>
  selectLayoutWidget(id: string | null): Promise<PersistedState>
  toggleGrid(): Promise<PersistedState>
  alignWidget(id: string, action: AlignAction): Promise<PersistedState>
  moveWidgetBy(id: string, dx: number, dy: number, modifiers: MoveModifiers): Promise<void>
  moveWindowBy(id: string, dx: number, dy: number): Promise<void>
  offsetWindowBy(id: string, dx: number, dy: number): Promise<void>

  searchCity(query: string): Promise<City[]>
  getWeather(
    city: City,
    units: WeatherUnits,
    provider: WeatherProvider,
    yandexKey?: string
  ): Promise<WeatherResult>
  getMusic(): Promise<MusicSnapshot>
  onMusic(cb: (snap: MusicSnapshot) => void): () => void
  musicControl(action: MusicAction, positionMs?: number): void
  getFinance(codes: string[]): Promise<FinanceResult>
  getTwitch(settings: {
    channels: string[]
    clientId: string
    clientSecret: string
  }): Promise<TwitchResult>
  getSystem(): Promise<SystemResult>
  getFonts(): Promise<string[]>

  pickImage(): Promise<ImageAsset | null>
  deleteImage(id: string): Promise<{ ok: boolean; used?: boolean }>
  savePreset(name: string, style: WidgetStyle): Promise<StylePreset>
  deletePreset(id: string): Promise<boolean>

  saveZodiacPack(pack: ZodiacPack): Promise<ZodiacPack>
  deleteZodiacPack(id: string): Promise<boolean>
  saveTarotDeck(deck: TarotDeck): Promise<TarotDeck>
  deleteTarotDeck(id: string): Promise<boolean>
  simsAction(
    groupId: string,
    action: SimsAction,
    difficulty?: SimsDifficulty,
    need?: 'hunger' | 'energy' | 'fun' | 'social' | 'hygiene'
  ): Promise<PersistedState>
  openSimsMenu(id: string): void
  closeSimsMenu(): void
  openSimsRewards(id: string, groupId: string): void
  closeSimsRewards(): void
  alignEqualizer(id: string, edge: 'top' | 'bottom' | 'left' | 'right'): Promise<void>
  setEqualizerStretch(id: string, stretch: boolean): Promise<PersistedState>

  onSelectTab(cb: (tab: SettingsTab) => void): () => void
  onSettingsFocus(cb: (id: string | null) => void): () => void
  setSettingsTab(tab: SettingsTab): void
  onCursor(cb: (point: { x: number; y: number }) => void): () => void
  getRuntime(): Promise<RuntimeInfo>
  openExternal(url: string): void
  quit(): void
}

export type AlignAction = 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom' | 'grid'

export interface MoveModifiers {
  alt: boolean
  ctrl: boolean
  shift: boolean
}
