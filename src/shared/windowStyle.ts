import type { WindowImageLayer, WindowStyle, WindowStylePreset } from './types'

export const DEFAULT_WINDOW_STYLE: WindowStyle = {
  windowless: false,
  radius: 18,
  background: { color1: '#141824', color2: '#090b11', angle: 160, opacity: 0.94 },
  images: [],
  outline: {
    enabled: false,
    placement: 'under',
    color: '#62e6ff',
    thickness: 1.5,
    glow: 12,
    intensity: 0.8,
    lamp: false
  },
  glow: { enabled: false, color: '#4aa8ff', intensity: 0.35, spread: 14 },
  accent: { enabled: false, color: '#4aa8ff', intensity: 0.28, size: 55, x: 82, y: -8 }
}

export function defaultWindowStyle(windowless = false): WindowStyle {
  const style = structuredClone(DEFAULT_WINDOW_STYLE)
  style.windowless = windowless
  return style
}

function color(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback
}

function normalizeImage(raw: unknown): WindowImageLayer | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Partial<WindowImageLayer>
  return {
    assetId: typeof item.assetId === 'string' ? item.assetId : null,
    zoom: clamp(item.zoom, 1, 6, 1),
    x: clamp(item.x, 0, 100, 50),
    y: clamp(item.y, 0, 100, 50),
    opacity: clamp(item.opacity, 0, 1, 1),
    dim: clamp(item.dim, 0, 1, 0),
    saturation: clamp(item.saturation, 0, 2, 1)
  }
}

export function normalizeWindowStyle(
  raw: Partial<WindowStyle> | null | undefined,
  fallbackWindowless = false
): WindowStyle {
  const value = raw ?? {}
  const background = (value.background ?? {}) as Partial<WindowStyle['background']>
  const outline = (value.outline ?? {}) as Partial<WindowStyle['outline']>
  const glow = (value.glow ?? {}) as Partial<WindowStyle['glow']>
  const accent = (value.accent ?? {}) as Partial<WindowStyle['accent']>
  const base = defaultWindowStyle(fallbackWindowless)

  return {
    windowless: typeof value.windowless === 'boolean' ? value.windowless : fallbackWindowless,
    radius: clamp(value.radius, 0, 48, base.radius),
    background: {
      color1: color(background.color1, base.background.color1),
      color2: color(background.color2, base.background.color2),
      angle: clamp(background.angle, 0, 360, base.background.angle),
      opacity: clamp(background.opacity, 0, 1, base.background.opacity)
    },
    images: (Array.isArray(value.images) ? value.images : [])
      .slice(0, 2)
      .map(normalizeImage)
      .filter((item): item is WindowImageLayer => Boolean(item)),
    outline: {
      enabled: Boolean(outline.enabled),
      placement: outline.placement === 'over' ? 'over' : 'under',
      color: color(outline.color, base.outline.color),
      thickness: clamp(outline.thickness, 0.5, 12, base.outline.thickness),
      glow: clamp(outline.glow, 0, 24, base.outline.glow),
      intensity: clamp(outline.intensity, 0, 1, base.outline.intensity),
      lamp: Boolean(outline.lamp)
    },
    glow: {
      enabled: Boolean(glow.enabled),
      color: color(glow.color, base.glow.color),
      intensity: clamp(glow.intensity, 0, 1, base.glow.intensity),
      spread: clamp(glow.spread, 0, 24, base.glow.spread)
    },
    accent: {
      enabled: Boolean(accent.enabled),
      color: color(accent.color, base.accent.color),
      intensity: clamp(accent.intensity, 0, 1, base.accent.intensity),
      size: clamp(accent.size, 15, 100, base.accent.size),
      x: clamp(accent.x, 0, 100, base.accent.x),
      y: clamp(accent.y, 0, 100, base.accent.y)
    }
  }
}

function preset(id: string, name: string, overrides: Partial<WindowStyle>): WindowStylePreset {
  const style = defaultWindowStyle()
  return {
    id,
    name,
    style: normalizeWindowStyle({
      ...style,
      ...overrides,
      background: { ...style.background, ...overrides.background },
      outline: { ...style.outline, ...overrides.outline },
      glow: { ...style.glow, ...overrides.glow },
      accent: { ...style.accent, ...overrides.accent }
    })
  }
}

export const WINDOW_PRESETS: WindowStylePreset[] = [
  preset('glass', 'Стекло', {}),
  preset('neon', 'Неон', {
    radius: 16,
    background: { color1: '#101a24', color2: '#070b12', angle: 155, opacity: 0.92 },
    outline: {
      enabled: true,
      placement: 'under',
      color: '#62e6ff',
      thickness: 1.5,
      glow: 16,
      intensity: 0.9,
      lamp: false
    },
    glow: { enabled: true, color: '#62e6ff', intensity: 0.45, spread: 18 },
    accent: { enabled: true, color: '#62e6ff', intensity: 0.3, size: 60, x: 80, y: -6 }
  }),
  preset('emerald', 'Изумруд', {
    radius: 20,
    background: { color1: '#0d1b16', color2: '#06100c', angle: 150, opacity: 0.94 },
    outline: {
      enabled: true,
      placement: 'over',
      color: '#4dffb8',
      thickness: 1,
      glow: 10,
      intensity: 0.7,
      lamp: false
    },
    glow: { enabled: true, color: '#4dffb8', intensity: 0.28, spread: 14 },
    accent: { enabled: true, color: '#4dffb8', intensity: 0.22, size: 50, x: 20, y: -10 }
  }),
  preset('sunset', 'Закат', {
    radius: 22,
    background: { color1: '#241320', color2: '#0d070d', angle: 165, opacity: 0.94 },
    outline: {
      enabled: true,
      placement: 'under',
      color: '#ff7a9e',
      thickness: 1.5,
      glow: 18,
      intensity: 0.8,
      lamp: true
    },
    glow: { enabled: true, color: '#ff7a9e', intensity: 0.35, spread: 20 },
    accent: { enabled: true, color: '#ff9a5c', intensity: 0.3, size: 65, x: 75, y: 10 }
  }),
  preset('minimal', 'Минимал', {
    radius: 8,
    background: { color1: '#0e1118', color2: '#0b0e14', angle: 180, opacity: 0.96 },
    outline: {
      enabled: false,
      placement: 'under',
      color: '#ffffff',
      thickness: 1,
      glow: 0,
      intensity: 0.2,
      lamp: false
    },
    glow: { enabled: false, color: '#ffffff', intensity: 0.2, spread: 10 },
    accent: { enabled: false, color: '#ffffff', intensity: 0.15, size: 40, x: 50, y: 0 }
  })
]
