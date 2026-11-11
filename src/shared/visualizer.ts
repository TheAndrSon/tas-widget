import type { VisualizerSettings } from './types'

export const DEFAULT_VISUALIZER: VisualizerSettings = {
  mode: 'radial',
  palette: 'neon',
  color1: '#62e6ff',
  color2: '#a56bff',
  intensity: 0.9,
  bars: 64,
  barThickness: 6,
  barGap: 3,
  maxHeight: 90,
  mirror: false,
  axis: 0.5,
  rotation: 0,
  mirrorX: false,
  mirrorY: false,
  lineThickness: 2,
  dotSize: 3,
  sparkSize: 2,
  sparkSpeed: 1,
  waveCount: 4,
  waveSpeed: 1,
  waveThickness: 2,
  freqMin: 30,
  freqMax: 16000,
  freqScale: 'log'
}

export const VISUALIZER_MODES: Array<{ value: VisualizerSettings['mode']; label: string }> = [
  { value: 'off', label: 'Выкл' },
  { value: 'bars', label: 'Столбики' },
  { value: 'radial', label: 'Радиальные' },
  { value: 'line', label: 'Линия' },
  { value: 'dots', label: 'Точки' },
  { value: 'sparks', label: 'Искры' },
  { value: 'waves', label: 'Волны' }
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

export function normalizeVisualizer(
  input: Partial<VisualizerSettings> | null | undefined
): VisualizerSettings {
  const value = input ?? {}
  const palette = VISUALIZER_PALETTES.some(item => item.value === value.palette)
    ? (value.palette as VisualizerSettings['palette'])
    : 'neon'
  const preset = VISUALIZER_PALETTES.find(item => item.value === palette)

  return {
    mode: VISUALIZER_MODES.some(item => item.value === value.mode)
      ? (value.mode as VisualizerSettings['mode'])
      : 'off',
    palette,
    color1: value.color1 || preset?.color1 || '#62e6ff',
    color2: value.color2 || preset?.color2 || '#a56bff',
    intensity: Math.min(2, Math.max(0.2, Number(value.intensity ?? 0.9))),
    bars: Math.min(256, Math.max(12, Math.round(Number(value.bars ?? 64)))),
    barThickness: Math.min(60, Math.max(1, Math.round(Number(value.barThickness ?? 6)))),
    barGap: Math.min(40, Math.max(0, Math.round(Number(value.barGap ?? 3)))),
    maxHeight: Math.min(100, Math.max(10, Math.round(Number(value.maxHeight ?? 90)))),
    mirror: value.mirror ?? false,
    axis: Math.min(1, Math.max(0, Number(value.axis ?? 0.5))),
    rotation: Math.min(360, Math.max(0, Number(value.rotation ?? 0))),
    mirrorX: value.mirrorX ?? false,
    mirrorY: value.mirrorY ?? false,
    lineThickness: Math.min(24, Math.max(1, Number(value.lineThickness ?? 2))),
    dotSize: Math.min(30, Math.max(1, Number(value.dotSize ?? 3))),
    sparkSize: Math.min(20, Math.max(0.5, Number(value.sparkSize ?? 2))),
    sparkSpeed: Math.min(5, Math.max(0.2, Number(value.sparkSpeed ?? 1))),
    waveCount: Math.min(12, Math.max(1, Math.round(Number(value.waveCount ?? 4)))),
    waveSpeed: Math.min(5, Math.max(0.2, Number(value.waveSpeed ?? 1))),
    waveThickness: Math.min(24, Math.max(1, Number(value.waveThickness ?? 2))),
    freqMin: Math.min(8000, Math.max(20, Number(value.freqMin ?? 30))),
    freqMax: Math.min(
      22000,
      Math.max(Number(value.freqMin ?? 30) + 100, Number(value.freqMax ?? 16000))
    ),
    freqScale: value.freqScale === 'linear' ? 'linear' : 'log'
  }
}
