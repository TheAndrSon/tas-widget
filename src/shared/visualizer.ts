import type { VisualizerSettings } from './types'

export const DEFAULT_VISUALIZER: VisualizerSettings = {
  mode: 'radial',
  palette: 'neon',
  color1: '#62e6ff',
  color2: '#a56bff',
  intensity: 0.9,
  bars: 64,
  maxHeight: 100,
  source: 'system',
  audioWindowIds: [],
  mirrorOrigin: 'start',
  freqMin: 30,
  freqMax: 16000,
  freqScale: 'log',
  ringThickness: 3,
  ringPulse: 1,
  gradientAngle: 135,
  gradientScale: 1,
  gradientSpeed: 1
}

export const VISUALIZER_MODES: Array<{ value: VisualizerSettings['mode']; label: string }> = [
  { value: 'off', label: 'Выкл' },
  { value: 'bars', label: 'Столбики' },
  { value: 'mirror', label: 'Зеркало' },
  { value: 'radial', label: 'Радиальные' },
  { value: 'line', label: 'Линия' },
  { value: 'dots', label: 'Точки' },
  { value: 'ring', label: 'Обводка' },
  { value: 'sparks', label: 'Искры' }
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
  { value: 'gradient', label: 'Перелив', color1: '#62e6ff', color2: '#ff7ac6' },
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
    intensity: Math.min(2, Math.max(0.2, Number(value.intensity ?? 1))),
    bars: Math.min(1200, Math.max(12, Math.round(Number(value.bars ?? 64)))),
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
    ringThickness: Math.min(24, Math.max(1, Number(value.ringThickness ?? 3))),
    ringPulse: Math.min(2, Math.max(0, Number(value.ringPulse ?? 1))),
    gradientAngle: Math.min(360, Math.max(0, Number(value.gradientAngle ?? 135))),
    gradientScale: Math.min(5, Math.max(0.2, Number(value.gradientScale ?? 1))),
    gradientSpeed: Math.min(5, Math.max(0.2, Number(value.gradientSpeed ?? 1)))
  }
}
