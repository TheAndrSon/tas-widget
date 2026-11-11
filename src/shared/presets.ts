import type {
  AmbientStyle,
  BackgroundStyle,
  BorderKind,
  BorderStyle,
  CursorEffect,
  FontEffects,
  ShapeId,
  StylePreset,
  TextAlign,
  TextureKind,
  VisualizerSettings,
  WidgetStyle,
  WidgetType
} from './types'
import { DEFAULT_PRESETS, DEFAULT_STYLES } from './default-design'

export const TYPE_ACCENTS: Record<WidgetType, string> = {
  weather: '#7cc4ff',
  music: '#a8e6c1',
  clock: '#e9ecff',
  weekday: '#c2b6ff',
  calendar: '#ffc48c',
  astro: '#d9b8ff',
  tarot: '#ff8f8f',
  dice: '#ffd166',
  equalizer: '#62e6ff',
  todo: '#f2c48d',
  sims: '#7ef29b',
  finance: '#9be7b0',
  twitch: '#c2a3ff',
  system: '#8fd8ff'
}

export const SHAPE_OPTIONS: Array<{ value: ShapeId; label: string; hint: string }> = [
  { value: 'squircle', label: 'Скруглённый', hint: 'мягкий прямоугольник' },
  { value: 'rect', label: 'Прямоугольный', hint: 'строгие углы' },
  { value: 'custom', label: 'Своя форма', hint: 'радиус каждого угла отдельно' }
]

export const CURSOR_EFFECT_OPTIONS: Array<{
  value: CursorEffect
  label: string
  hint: string
}> = [
  { value: 'none', label: 'Нет', hint: 'обычный курсор' },
  { value: 'glow', label: 'Свечение', hint: 'мягкое пятно света' },
  { value: 'ring', label: 'Кольцо', hint: 'тонкое кольцо вокруг' },
  { value: 'sparkles', label: 'Искры', hint: 'маленькие частицы' },
  { value: 'trail', label: 'Шлейф', hint: 'затухающий след' },
  { value: 'spotlight', label: 'Прожектор', hint: 'широкий свет' },
  { value: 'fairy', label: 'Фея', hint: 'искры при клике и шлейф' }
]

export const BORDER_OPTIONS: Array<{ value: BorderKind; label: string; hint: string }> = [
  { value: 'solid', label: 'Линия', hint: 'тонкая ровная обводка' },
  { value: 'dashed', label: 'Пунктир', hint: 'как в режиме редактирования' },
  { value: 'dotted', label: 'Точки', hint: 'мелкий пунктир' },
  { value: 'double', label: 'Двойная', hint: 'две тонкие линии' },
  { value: 'neon', label: 'Неон', hint: 'свечение с пульсацией' },
  { value: 'gradient', label: 'Перелив', hint: 'движущийся градиент' },
  { value: 'fireflies', label: 'Светлячки', hint: 'огоньки вокруг окна' }
]

export const FONT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "'Segoe UI Variable Text', 'Segoe UI', sans-serif", label: 'Segoe UI Variable' },
  { value: "'Segoe UI', sans-serif", label: 'Segoe UI' },
  { value: "'Inter', 'Segoe UI', sans-serif", label: 'Inter' },
  { value: "'Georgia', 'Times New Roman', serif", label: 'Georgia' },
  { value: "'Palatino Linotype', 'Book Antiqua', serif", label: 'Palatino' },
  { value: "'Times New Roman', serif", label: 'Times New Roman' },
  { value: "'Arial', sans-serif", label: 'Arial' },
  { value: "'Verdana', sans-serif", label: 'Verdana' },
  { value: "'Tahoma', sans-serif", label: 'Tahoma' },
  { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
  { value: "'Cascadia Mono', 'Consolas', monospace", label: 'Cascadia Mono' },
  { value: "'Consolas', monospace", label: 'Consolas' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: "'Old English Text MT', 'Blackadder ITC', Georgia, serif", label: 'Old English' },
  { value: "'Ink Free', 'Segoe Print', cursive", label: 'Ink Free' }
]

export const TEXT_ALIGN_OPTIONS: Array<{ value: TextAlign; label: string }> = [
  { value: 'left', label: 'По левому краю' },
  { value: 'center', label: 'По центру' },
  { value: 'right', label: 'По правому краю' }
]

export const DEFAULT_VISUALIZER: VisualizerSettings = {
  mode: 'off',
  palette: 'neon',
  color1: '#62e6ff',
  color2: '#a56bff',
  intensity: 1,
  bars: 64,
  barThickness: 6,
  barGap: 3,
  barShape: 'rounded',
  mirror: false,
  axis: 0.5,
  rotation: 0,
  mirrorX: false,
  mirrorY: false,
  maxHeight: 82,
  source: 'system',
  audioWindowIds: [],
  mirrorOrigin: 'start',
  freqMin: 30,
  freqMax: 16000,
  freqScale: 'log',
  lineThickness: 2,
  dotSize: 3,
  sparkSize: 2,
  sparkSpeed: 1,
  particleOrigin: 'bottom',
  particleCount: 120,
  particleReactivity: 1,
  particleSpread: 1,
  particleRandomSize: false,
  particleSizeVariability: 0.4,
  particleSpeedReactivity: 1,
  halfSpectrum: false,
  radialHalf: false,
  waveCount: 4,
  waveSpeed: 1,
  waveThickness: 2,
  waveLife: 2.4,
  waveIntensity: 1,
  waveRadius: 20,
  glowEnabled: false,
  glowIntensity: 0.5,
  glowSpread: 12,
  mirrorOffsetX: 0,
  mirrorOffsetY: 0,
  ringThickness: 3,
  ringPulse: 1,
  gradientAngle: 135,
  gradientScale: 1,
  gradientSpeed: 1
}

export const VISUALIZER_MODES: Array<{ value: VisualizerSettings['mode']; label: string }> = [
  { value: 'off', label: 'Выкл' },
  { value: 'bars', label: 'Столбики' },
  { value: 'radial', label: 'Радиальные' },
  { value: 'line', label: 'Линия' },
  { value: 'waveform', label: 'Сплошная волна' },
  { value: 'dots', label: 'Точки' },
  { value: 'particles', label: 'Частицы' },
  { value: 'face', label: 'В лицо' },
  { value: 'waves', label: 'Волны' }
]

export const AUDIO_SOURCES: Array<{ value: VisualizerSettings['source']; label: string }> = [
  { value: 'system', label: 'Вся система' },
  { value: 'window', label: 'Одно окно' },
  { value: 'multi', label: 'Несколько' }
]

export const VISUALIZER_PALETTES: Array<{
  value: VisualizerSettings['palette']
  label: string
  color1: string
  color2: string
}> = [
  { value: 'neon', label: 'Неон', color1: '#62e6ff', color2: '#a56bff' },
  { value: 'sunset', label: 'Закат', color1: '#ff9a5c', color2: '#ff5f9e' },
  { value: 'ice', label: 'Лёд', color1: '#9fe8ff', color2: '#5f8bff' },
  { value: 'matrix', label: 'Матрица', color1: '#7dff9e', color2: '#0f8f43' },
  { value: 'candy', label: 'Карамель', color1: '#ffd166', color2: '#ff7ac6' },
  { value: 'aurora', label: 'Аврора', color1: '#42ffd9', color2: '#2b6cff' },
  { value: 'fire', label: 'Огонь', color1: '#ffb347', color2: '#ff3d3d' },
  { value: 'custom', label: 'Свои цвета', color1: '#62e6ff', color2: '#a56bff' }
]

const crop = { x: 50, y: 50, zoom: 1 }

function bg(overrides: Partial<BackgroundStyle> = {}): BackgroundStyle {
  return {
    kind: 'glass',
    color: '#0d0f15',
    color2: '#2a3040',
    angle: 155,
    opacity: 0.9,
    blur: 24,
    darken: 0.12,
    imageId: null,
    crop: { ...crop },
    ...overrides
  }
}

function border(overrides: Partial<BorderStyle> = {}): BorderStyle {
  return {
    enabled: true,
    style: 'solid',
    width: 1,
    color: '#ffffff',
    color2: '#62e6ff',
    opacity: 0.12,
    glow: 0,
    glowSize: 8,
    animated: false,
    ...overrides
  }
}

function font(overrides: Partial<FontEffects> = {}): FontEffects {
  return {
    outline: { enabled: false, width: 1, color: '#000000', opacity: 0.65, mode: 'center' },
    shadow: { enabled: false, color: '#000000', opacity: 0.45, blur: 6, offsetX: 0, offsetY: 1 },
    contrastPrimary: false,
    contrastSecondary: false,
    pattern: 'none',
    ...overrides
  }
}

const align = { primary: 'left' as TextAlign, secondary: 'left' as TextAlign }
const corners = { tl: 22, tr: 22, br: 22, bl: 22 }
const ambient: AmbientStyle = {
  kind: 'none',
  intensity: 0.6,
  color: '#ffffff',
  shootingFrequency: 8
}

function baseStyle(overrides: Partial<WidgetStyle> = {}): WidgetStyle {
  return {
    presetId: 'smoked',
    windowless: false,
    shape: 'squircle',
    radius: 22,
    corners: { ...corners },
    background: bg(),
    border: border(),
    textColor: '#f6f8ff',
    mutedColor: '#a9b1c7',
    accent: null,
    fontFamily: FONT_OPTIONS[0].value,
    fontScale: 1,
    font: font(),
    align: { ...align },
    underlay: null,
    overlay: null,
    frame: null,
    cursorEffect: 'none',
    texture: 'none',
    ambient: { ...ambient },
    ...overrides
  }
}

export const BUILTIN_PRESETS: StylePreset[] = [
  {
    id: 'smoked',
    name: 'Smoked Glass',
    builtin: true,
    style: baseStyle({
      presetId: 'smoked',
      radius: 22,
      corners: { tl: 22, tr: 22, br: 22, bl: 22 },
      background: bg({ opacity: 0.9, blur: 24, darken: 0.12 }),
      border: border({ width: 1, color: '#ffffff', opacity: 0.12 }),
      textColor: '#f6f8ff',
      mutedColor: '#a9b1c7',
      fontFamily: FONT_OPTIONS[0].value
    })
  },
  {
    id: 'fluent',
    name: 'Fluent Mica',
    builtin: true,
    style: baseStyle({
      presetId: 'fluent',
      radius: 8,
      corners: { tl: 8, tr: 8, br: 8, bl: 8 },
      background: bg({ color: '#1f1f1f', opacity: 0.93, blur: 30, darken: 0.18 }),
      border: border({ width: 1, color: '#ffffff', opacity: 0.08 }),
      textColor: '#f5f5f5',
      mutedColor: '#a8a8a8',
      accent: '#60cdff',
      fontFamily: FONT_OPTIONS[0].value
    })
  },
  {
    id: 'porcelain',
    name: 'Porcelain',
    builtin: true,
    style: baseStyle({
      presetId: 'porcelain',
      radius: 24,
      corners: { tl: 24, tr: 24, br: 24, bl: 24 },
      background: bg({ kind: 'color', color: '#f6f3ee', opacity: 1, blur: 0, darken: 0 }),
      border: border({ width: 1, color: '#23201c', opacity: 0.14 }),
      textColor: '#23201c',
      mutedColor: '#7c7468',
      accent: '#c96a4b',
      fontFamily: "'Georgia', 'Times New Roman', serif"
    })
  },
  {
    id: 'clay',
    name: 'Soft Clay',
    builtin: true,
    style: baseStyle({
      presetId: 'clay',
      radius: 26,
      corners: { tl: 26, tr: 26, br: 26, bl: 26 },
      background: bg({
        kind: 'gradient',
        color: '#f4ecff',
        color2: '#dff5ec',
        angle: 150,
        opacity: 1,
        blur: 0,
        darken: 0
      }),
      border: border({ width: 1, color: '#ffffff', opacity: 0.55 }),
      textColor: '#2f2a3a',
      mutedColor: '#6d647e',
      accent: '#f0a64a',
      fontFamily: FONT_OPTIONS[0].value
    })
  },
  {
    id: 'terminal',
    name: 'Terminal',
    builtin: true,
    style: baseStyle({
      presetId: 'terminal',
      radius: 4,
      corners: { tl: 4, tr: 4, br: 4, bl: 4 },
      background: bg({ kind: 'color', color: '#050807', opacity: 0.96, blur: 0, darken: 0 }),
      border: border({ width: 1, color: '#9dffb0', opacity: 0.35 }),
      textColor: '#9dffb0',
      mutedColor: '#6aa979',
      accent: '#9dffb0',
      fontFamily: "'Cascadia Mono', 'Consolas', monospace",
      texture: 'scanlines'
    })
  },
  {
    id: 'neon',
    name: 'Neon HUD',
    builtin: true,
    style: baseStyle({
      presetId: 'neon',
      radius: 18,
      corners: { tl: 18, tr: 18, br: 18, bl: 18 },
      background: bg({
        kind: 'gradient',
        color: '#0a0614',
        color2: '#06141a',
        angle: 135,
        opacity: 0.94,
        blur: 18,
        darken: 0.2
      }),
      border: border({
        style: 'neon',
        width: 2,
        color: '#785aff',
        color2: '#50dcff',
        opacity: 0.7,
        glow: 1.2,
        animated: true
      }),
      textColor: '#eef2ff',
      mutedColor: '#a5b2d8',
      accent: '#50dcff',
      texture: 'grid',
      cursorEffect: 'glow'
    })
  },
  {
    id: 'nocturne',
    name: 'Nocturne',
    builtin: true,
    style: baseStyle({
      presetId: 'nocturne',
      radius: 20,
      corners: { tl: 20, tr: 20, br: 20, bl: 20 },
      background: bg({ kind: 'color', color: '#070609', opacity: 0.96, blur: 0, darken: 0 }),
      border: border({ width: 2, color: '#efe9dc', opacity: 0.36 }),
      textColor: '#efe9dc',
      mutedColor: '#9a927f',
      accent: '#bfaeff',
      fontFamily: "'Palatino Linotype', 'Book Antiqua', serif",
      texture: 'noise'
    })
  },
  {
    id: 'chrome',
    name: 'Chrome',
    builtin: true,
    style: baseStyle({
      presetId: 'chrome',
      radius: 28,
      corners: { tl: 28, tr: 28, br: 28, bl: 28 },
      background: bg({
        kind: 'gradient',
        color: '#f8f9fb',
        color2: '#8b9199',
        angle: 135,
        opacity: 1,
        blur: 0,
        darken: 0
      }),
      border: border({
        style: 'gradient',
        width: 1,
        color: '#ffffff',
        color2: '#5d646d',
        opacity: 0.8,
        animated: true
      }),
      textColor: '#16181c',
      mutedColor: '#555b63',
      accent: '#4d545c',
      fontFamily: FONT_OPTIONS[0].value
    })
  },
  {
    id: 'ink',
    name: 'Ink',
    builtin: true,
    style: baseStyle({
      presetId: 'ink',
      radius: 30,
      corners: { tl: 30, tr: 30, br: 30, bl: 30 },
      background: bg({ kind: 'color', color: '#f2eee4', opacity: 0.98, blur: 0, darken: 0 }),
      border: border({ width: 1, color: '#141414', opacity: 0.25 }),
      textColor: '#141414',
      mutedColor: '#6a655c',
      accent: '#141414',
      fontFamily: "'Ink Free', 'Segoe Print', cursive"
    })
  },
  {
    id: 'crimson',
    name: 'Crimson Tarot',
    builtin: true,
    style: baseStyle({
      presetId: 'crimson',
      radius: 18,
      corners: { tl: 18, tr: 18, br: 18, bl: 18 },
      background: bg({
        kind: 'gradient',
        color: '#180709',
        color2: '#3d0c12',
        angle: 160,
        opacity: 0.97,
        blur: 0,
        darken: 0.25
      }),
      border: border({
        style: 'solid',
        width: 2,
        color: '#e0454b',
        color2: '#6b0d16',
        opacity: 0.55,
        glow: 0.3,
        animated: false
      }),
      textColor: '#f3e9e6',
      mutedColor: '#b98f8f',
      accent: '#e0454b',
      fontFamily: "'Georgia', 'Times New Roman', serif",
      texture: 'noise',
      cursorEffect: 'none'
    })
  },
  {
    id: 'cyan-sigil',
    name: 'Cyan Sigil',
    builtin: true,
    style: baseStyle({
      presetId: 'cyan-sigil',
      radius: 14,
      corners: { tl: 14, tr: 14, br: 14, bl: 14 },
      background: bg({ kind: 'color', color: '#040a0b', opacity: 0.97, blur: 0, darken: 0 }),
      border: border({
        style: 'neon',
        width: 1,
        color: '#35d6e8',
        color2: '#35d6e8',
        opacity: 0.6,
        glow: 0.9,
        animated: true
      }),
      textColor: '#e9ffff',
      mutedColor: '#7faeb3',
      accent: '#35d6e8',
      fontFamily: "'Cascadia Mono', 'Consolas', monospace",
      texture: 'grid',
      cursorEffect: 'ring'
    })
  },
  {
    id: 'notebook',
    name: 'Notebook',
    builtin: true,
    style: baseStyle({
      presetId: 'notebook',
      radius: 14,
      corners: { tl: 14, tr: 14, br: 14, bl: 14 },
      background: bg({ kind: 'color', color: '#f8f1dd', opacity: 1, blur: 0, darken: 0 }),
      border: border({ style: 'solid', width: 1, color: '#b08a5a', opacity: 0.4 }),
      textColor: '#3b3021',
      mutedColor: '#8a7458',
      accent: '#d98c6a',
      fontFamily: "'Ink Free', 'Segoe Print', cursive",
      texture: 'paper'
    })
  },
  {
    id: 'plumbob',
    name: 'Plumbob',
    builtin: true,
    style: baseStyle({
      presetId: 'plumbob',
      radius: 18,
      corners: { tl: 18, tr: 18, br: 18, bl: 18 },
      background: bg({
        kind: 'gradient',
        color: '#051a14',
        color2: '#0c3a2a',
        angle: 150,
        opacity: 0.93,
        blur: 20,
        darken: 0.15
      }),
      border: border({
        style: 'neon',
        width: 1.5,
        color: '#7ef29b',
        color2: '#39d6a0',
        opacity: 0.7,
        glow: 1.1,
        animated: true
      }),
      textColor: '#ecfff3',
      mutedColor: '#8fd9b0',
      accent: '#7ef29b',
      fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
      cursorEffect: 'fairy'
    })
  },
  ...DEFAULT_PRESETS
]

export function getPreset(id: string | null | undefined): StylePreset | undefined {
  if (!id) return undefined
  return BUILTIN_PRESETS.find((preset) => preset.id === id)
}

export function createDefaultStyle(type: WidgetType): WidgetStyle {
  return structuredClone(DEFAULT_STYLES[type] ?? DEFAULT_STYLES.weather)
}

export function createBlankStyle(): WidgetStyle {
  return baseStyle({
    presetId: null,
    radius: 20,
    corners: { tl: 20, tr: 20, br: 20, bl: 20 },
    background: bg({ kind: 'color', color: '#101216', opacity: 0.75, blur: 0, darken: 0 }),
    border: border({ enabled: false, width: 1, color: '#ffffff', opacity: 0.1 }),
    textColor: '#f6f8ff',
    mutedColor: '#a9b1c7',
    accent: null,
    fontFamily: FONT_OPTIONS[0].value,
    cursorEffect: 'none',
    texture: 'none'
  })
}

/** Приводит стиль с диска/из IPC к актуальной форме. */
export function normalizeStyle(
  input: Partial<WidgetStyle> | null | undefined,
  type: WidgetType
): WidgetStyle {
  const defaults = createDefaultStyle(type)
  if (!input) return defaults

  const background = { ...defaults.background, ...(input.background ?? {}) }
  const legacyBorder = (input.border ?? {}) as Partial<BorderStyle> & { width?: number }
  const borderValue: BorderStyle = {
    ...defaults.border,
    ...legacyBorder,
    enabled:
      typeof legacyBorder.enabled === 'boolean'
        ? legacyBorder.enabled
        : Number(legacyBorder.width ?? 1) > 0
  }
  borderValue.glow = Math.min(2, Math.max(0, Number(borderValue.glow ?? 0)))
  borderValue.glowSize = Math.min(48, Math.max(0, Number(borderValue.glowSize ?? 8)))
  const inputFont = (input.font ?? {}) as Partial<FontEffects>
  const fontValue: FontEffects = {
    outline: {
      ...defaults.font.outline,
      ...(inputFont.outline ?? {})
    },
    shadow: { ...defaults.font.shadow, ...(inputFont.shadow ?? {}) },
    contrastPrimary: Boolean(inputFont.contrastPrimary),
    contrastSecondary: Boolean(inputFont.contrastSecondary),
    pattern: ['none', 'horizontal', 'diagonal', 'dots', 'grid'].includes(inputFont.pattern ?? '')
      ? (inputFont.pattern as FontEffects['pattern'])
      : 'none'
  }
  if (fontValue.outline.mode !== 'center' && fontValue.outline.mode !== 'outside') {
    fontValue.outline.mode = 'center'
  }
  const alignValue = { ...defaults.align, ...(input.align ?? {}) }
  const ambientValue: AmbientStyle = {
    ...defaults.ambient,
    ...(input.ambient ?? {}),
    shootingFrequency: Math.min(60, Math.max(1, Number(input.ambient?.shootingFrequency ?? 8)))
  }
  const radius = Number(input.radius ?? defaults.radius) || 0
  const cornersValue = {
    tl: Number(input.corners?.tl ?? radius),
    tr: Number(input.corners?.tr ?? radius),
    br: Number(input.corners?.br ?? radius),
    bl: Number(input.corners?.bl ?? radius)
  }

  const style: WidgetStyle = {
    ...defaults,
    ...input,
    background,
    border: borderValue,
    font: fontValue,
    align: alignValue,
    ambient: ambientValue,
    corners: cornersValue,
    underlay: input.underlay ?? null,
    overlay: input.overlay ?? null,
    frame: input.frame ?? null
  }

  // старые фигурные формы больше не поддерживаются: все пресеты — обычное окно
  if (style.shape !== 'squircle' && style.shape !== 'rect' && style.shape !== 'custom') {
    style.shape = 'squircle'
  }
  if (style.shape === 'rect') style.radius = 0
  style.windowless = Boolean(style.windowless)
  const kinds = ['glass', 'color', 'gradient', 'image']
  if (!kinds.includes(background.kind)) background.kind = 'glass'
  if (!['none', 'noise', 'grid', 'scanlines', 'paper'].includes(style.texture))
    style.texture = 'none'
  if (!CURSOR_EFFECT_OPTIONS.some((effect) => effect.value === style.cursorEffect)) {
    style.cursorEffect = 'none'
  }
  if (style.presetId === 'crimson' && style.cursorEffect === 'sparkles') {
    style.cursorEffect = 'none'
  }
  if (
    !['none', 'stars', 'weather', 'fireflies', 'matrix', 'synthwave'].includes(ambientValue.kind)
  ) {
    ambientValue.kind = 'none'
  }
  if (!['left', 'center', 'right'].includes(style.align.primary)) style.align.primary = 'left'
  if (!['left', 'center', 'right'].includes(style.align.secondary)) style.align.secondary = 'left'
  if (!BORDER_OPTIONS.some((option) => option.value === style.border.style)) {
    style.border.style = 'solid'
  }

  style.fontScale = Math.min(2.4, Math.max(0.5, Number(style.fontScale) || 1))
  style.radius = Math.min(120, Math.max(0, Number(style.radius) || 0))
  style.corners = {
    tl: Math.min(120, Math.max(0, Number(cornersValue.tl) || 0)),
    tr: Math.min(120, Math.max(0, Number(cornersValue.tr) || 0)),
    br: Math.min(120, Math.max(0, Number(cornersValue.br) || 0)),
    bl: Math.min(120, Math.max(0, Number(cornersValue.bl) || 0))
  }
  background.opacity = Math.min(1, Math.max(0, Number(background.opacity) || 0))
  background.blur = Math.min(60, Math.max(0, Number(background.blur) || 0))
  background.darken = Math.min(0.85, Math.max(0, Number(background.darken) || 0))
  background.crop = normalizeCrop(background.crop)
  style.border.width = Math.min(8, Math.max(0, Number(style.border.width) || 0))
  style.border.opacity = Math.min(1, Math.max(0, Number(style.border.opacity) || 0))
  style.border.glow = Math.min(2, Math.max(0, Number(style.border.glow) || 0))
  style.font.outline.width = Math.min(4, Math.max(0, Number(style.font.outline.width) || 0))
  style.font.outline.opacity = Math.min(1, Math.max(0, Number(style.font.outline.opacity) || 0))
  style.font.shadow.opacity = Math.min(1, Math.max(0, Number(style.font.shadow.opacity) || 0))
  style.font.shadow.blur = Math.min(30, Math.max(0, Number(style.font.shadow.blur) || 0))
  style.font.shadow.offsetX = Math.min(20, Math.max(-20, Number(style.font.shadow.offsetX) || 0))
  style.font.shadow.offsetY = Math.min(20, Math.max(-20, Number(style.font.shadow.offsetY) || 0))
  style.ambient.intensity = Math.min(1.5, Math.max(0.1, Number(style.ambient.intensity) || 0.6))
  if (style.underlay) style.underlay = normalizeSlot(style.underlay)
  if (style.overlay) style.overlay = normalizeSlot(style.overlay)
  if (style.frame) style.frame = normalizeSlot(style.frame)
  return style
}

export function normalizeCrop(value: Partial<{ x: number; y: number; zoom: number }> | undefined): {
  x: number
  y: number
  zoom: number
} {
  return {
    x: Math.min(100, Math.max(0, Number(value?.x ?? 50))),
    y: Math.min(100, Math.max(0, Number(value?.y ?? 50))),
    zoom: Math.min(3, Math.max(1, Number(value?.zoom ?? 1)))
  }
}

export function normalizeSlot(slot: WidgetStyle['underlay']): NonNullable<WidgetStyle['underlay']> {
  const value = slot as NonNullable<WidgetStyle['underlay']>
  const placement = value.placement ?? ({} as NonNullable<WidgetStyle['underlay']>['placement'])
  return {
    enabled: value.enabled !== false,
    imageId: String(value.imageId ?? ''),
    crop: normalizeCrop(value.crop),
    opacity: Math.min(1, Math.max(0, Number(value.opacity ?? 1))),
    darken: Math.min(0.9, Math.max(0, Number(value.darken ?? 0))),
    blend: ['normal', 'screen', 'multiply', 'overlay', 'soft-light'].includes(value.blend)
      ? value.blend
      : 'normal',
    inset: Math.min(80, Math.max(-60, Number(value.inset ?? 0))),
    position: value.position === 'above' ? 'above' : 'behind',
    placement: {
      x: Math.min(100, Math.max(-100, Number(placement.x ?? 0))),
      y: Math.min(100, Math.max(-100, Number(placement.y ?? 0))),
      scaleX: Math.min(400, Math.max(20, Number(placement.scaleX ?? 100))),
      scaleY: Math.min(400, Math.max(20, Number(placement.scaleY ?? 100))),
      rotate: Math.min(180, Math.max(-180, Number(placement.rotate ?? 0))),
      stretch: value.placement?.stretch !== false
    }
  }
}

export function normalizeVisualizer(
  input: Partial<VisualizerSettings> | null | undefined
): VisualizerSettings {
  const value = input ?? {}
  const rawMode = String(value.mode ?? 'off')
  const mode = rawMode === 'sparks' ? 'particles' : rawMode
  const palette = VISUALIZER_PALETTES.some((item) => item.value === value.palette)
    ? (value.palette as VisualizerSettings['palette'])
    : 'neon'
  const preset = VISUALIZER_PALETTES.find((item) => item.value === palette)
  return {
    mode: VISUALIZER_MODES.some((item) => item.value === mode)
      ? (mode as VisualizerSettings['mode'])
      : 'off',
    palette,
    color1: value.color1 || preset?.color1 || '#62e6ff',
    color2: value.color2 || preset?.color2 || '#a56bff',
    intensity: Math.min(2, Math.max(0.2, Number(value.intensity ?? 1))),
    bars: Math.min(3600, Math.max(12, Math.round(Number(value.bars ?? 64)))),
    barThickness: Math.min(60, Math.max(1, Number(value.barThickness ?? 6))),
    barGap: Math.min(40, Math.max(0, Number(value.barGap ?? 3))),
    barShape: value.barShape === 'rect' ? 'rect' : 'rounded',
    mirror: Boolean(value.mirror),
    axis: Math.min(1, Math.max(0, Number(value.axis ?? 0.5))),
    rotation: Math.min(360, Math.max(0, Number(value.rotation ?? 0))),
    mirrorX: Boolean(value.mirrorX),
    mirrorY: Boolean(value.mirrorY),
    maxHeight: Math.min(100, Math.max(20, Math.round(Number(value.maxHeight ?? 82)))),
    source: ['system', 'window', 'multi'].includes(value.source ?? '')
      ? (value.source as VisualizerSettings['source'])
      : 'system',
    audioWindowIds: Array.isArray(value.audioWindowIds)
      ? value.audioWindowIds.filter((id): id is string => typeof id === 'string').slice(0, 6)
      : [],
    mirrorOrigin: value.mirrorOrigin === 'end' ? 'end' : 'start',
    freqMin: Math.min(8000, Math.max(20, Number(value.freqMin ?? 30))),
    freqMax: Math.min(
      22000,
      Math.max(Number(value.freqMin ?? 30) + 100, Number(value.freqMax ?? 16000))
    ),
    freqScale: value.freqScale === 'linear' ? 'linear' : 'log',
    lineThickness: Math.min(24, Math.max(1, Number(value.lineThickness ?? 2))),
    dotSize: Math.min(30, Math.max(1, Number(value.dotSize ?? 3))),
    sparkSize: Math.min(20, Math.max(0.5, Number(value.sparkSize ?? 2))),
    sparkSpeed: Math.min(5, Math.max(0.2, Number(value.sparkSpeed ?? 1))),
    particleOrigin: value.particleOrigin === 'center' ? 'center' : 'bottom',
    particleCount: Math.min(1200, Math.max(20, Math.round(Number(value.particleCount ?? 120)))),
    particleReactivity: Math.min(3, Math.max(0, Number(value.particleReactivity ?? 1))),
    particleSpread: Math.min(1, Math.max(0.1, Number(value.particleSpread ?? 1))),
    particleRandomSize: Boolean(value.particleRandomSize),
    particleSizeVariability: Math.min(1, Math.max(0, Number(value.particleSizeVariability ?? 0.4))),
    particleSpeedReactivity: Math.min(3, Math.max(0, Number(value.particleSpeedReactivity ?? 1))),
    halfSpectrum: Boolean(value.halfSpectrum),
    radialHalf: Boolean(value.radialHalf),
    waveCount: Math.min(24, Math.max(1, Math.round(Number(value.waveCount ?? 4)))),
    waveSpeed: Math.min(5, Math.max(0.2, Number(value.waveSpeed ?? 1))),
    waveThickness: Math.min(24, Math.max(1, Number(value.waveThickness ?? 2))),
    waveLife: Math.min(8, Math.max(0.4, Number(value.waveLife ?? 2.4))),
    waveIntensity: Math.min(2, Math.max(0.1, Number(value.waveIntensity ?? 1))),
    waveRadius: Math.min(400, Math.max(2, Number(value.waveRadius ?? 20))),
    glowEnabled: Boolean(value.glowEnabled),
    glowIntensity: Math.min(1, Math.max(0, Number(value.glowIntensity ?? 0.5))),
    glowSpread: Math.min(60, Math.max(0, Number(value.glowSpread ?? 12))),
    mirrorOffsetX: Math.min(600, Math.max(-600, Number(value.mirrorOffsetX ?? 0))),
    mirrorOffsetY: Math.min(600, Math.max(-600, Number(value.mirrorOffsetY ?? 0))),
    ringThickness: Math.min(24, Math.max(1, Number(value.ringThickness ?? 3))),
    ringPulse: Math.min(2, Math.max(0, Number(value.ringPulse ?? 1))),
    gradientAngle: Math.min(360, Math.max(0, Number(value.gradientAngle ?? 135))),
    gradientScale: Math.min(5, Math.max(0.2, Number(value.gradientScale ?? 1))),
    gradientSpeed: Math.min(5, Math.max(0.2, Number(value.gradientSpeed ?? 1)))
  }
}

export const TEXTURE_OPTIONS: Array<{ value: TextureKind; label: string }> = [
  { value: 'none', label: 'Без текстуры' },
  { value: 'noise', label: 'Шум' },
  { value: 'grid', label: 'Сетка' },
  { value: 'scanlines', label: 'Скан-линии' },
  { value: 'paper', label: 'Бумага в линейку' }
]
