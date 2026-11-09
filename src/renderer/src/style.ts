import type { CSSProperties } from 'react'
import { TYPE_ACCENTS } from '@shared/presets'
import type { ImageCrop, ImageSlot, WidgetStyle, WidgetType } from '@shared/types'

export function withAlpha(color: string, alpha: number): string {
  const value = (color || '').trim()
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)
  if (!match) return value || 'rgba(255,255,255,0.5)'
  let hex = match[1]
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function luminance(color: string): number {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((color || '').trim())
  if (!match) return 1
  let hex = match[1]
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  const r = Number.parseInt(hex.slice(0, 2), 16) / 255
  const g = Number.parseInt(hex.slice(2, 4), 16) / 255
  const b = Number.parseInt(hex.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function styleVars(style: WidgetStyle, type: WidgetType): CSSProperties {
  const accent = style.accent || TYPE_ACCENTS[type] || '#cdd8ff'
  const darkSurface = luminance(style.textColor) > 0.55
  const radius = style.radius
  const corners = style.corners
  const outline = style.font.outline
  const shadow = style.font.shadow
  const outlineColor = withAlpha(outline.color, outline.opacity)
  const contrastColor = darkSurface ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)'
  const primaryOutline = style.font.contrastPrimary ? contrastColor : outlineColor
  const secondaryOutline = style.font.contrastSecondary ? contrastColor : outlineColor
  const outlineWidth = outline.enabled ? outline.width : 0
  const primaryWidth = style.font.contrastPrimary ? Math.max(1, outlineWidth) : outlineWidth
  const secondaryWidth = style.font.contrastSecondary ? Math.max(1, outlineWidth) : outlineWidth
  const shadowColor = withAlpha(shadow.color, shadow.opacity)
  return {
    '--widget-font': style.fontFamily,
    '--widget-accent': accent,
    '--w-weather': accent,
    '--w-music': accent,
    '--w-clock': accent,
    '--w-weekday': accent,
    '--w-calendar': accent,
    '--w-astro': accent,
    '--w-tarot': accent,
    '--w-dice': accent,
    '--w-equalizer': accent,
    '--w-todo': accent,
    '--w-sims': accent,
    '--widget-text': style.textColor,
    '--text': style.textColor,
    '--text-soft': withAlpha(style.textColor, 0.78),
    '--text-muted': style.mutedColor,
    '--text-faint': withAlpha(style.mutedColor, 0.58),
    '--line': withAlpha(style.textColor, 0.1),
    '--line-strong': withAlpha(style.textColor, 0.18),
    '--widget-control-bg': darkSurface
      ? 'rgba(255,255,255,0.07)'
      : 'rgba(255,255,255,0.62)',
    '--widget-control-hover': darkSurface
      ? 'rgba(255,255,255,0.15)'
      : 'rgba(255,255,255,0.88)',
    '--widget-control-border': darkSurface
      ? 'rgba(255,255,255,0.13)'
      : 'rgba(0,0,0,0.14)',
    '--widget-control-text': darkSurface
      ? 'rgba(255,255,255,0.78)'
      : 'rgba(0,0,0,0.68)',
    '--widget-border-color': withAlpha(style.border.color, style.border.opacity),
    '--widget-border-color2': withAlpha(style.border.color2, style.border.opacity),
    '--widget-border-width': `${style.border.width}px`,
    '--widget-border-glow': String(style.border.glow),
    '--widget-border-glow-size': String(style.border.glowSize),
    '--widget-radius': `${radius}px`,
    '--widget-radius-tl': `${style.shape === 'rect' ? 0 : style.shape === 'custom' ? corners.tl : radius}px`,
    '--widget-radius-tr': `${style.shape === 'rect' ? 0 : style.shape === 'custom' ? corners.tr : radius}px`,
    '--widget-radius-br': `${style.shape === 'rect' ? 0 : style.shape === 'custom' ? corners.br : radius}px`,
    '--widget-radius-bl': `${style.shape === 'rect' ? 0 : style.shape === 'custom' ? corners.bl : radius}px`,
    '--widget-bg-color': style.background.color,
    '--widget-bg-color2': style.background.color2,
    '--widget-bg-angle': `${style.background.angle}deg`,
    '--widget-bg-opacity': String(style.background.opacity),
    '--widget-bg-blur': `${style.background.blur}px`,
    '--widget-darken': String(style.background.darken),
    '--widget-font-scale': String(style.fontScale),
    '--font-outline-width': `${outlineWidth}px`,
    '--font-outline-color': primaryOutline,
    '--font-outline-primary-width': `${primaryWidth}px`,
    '--font-outline-primary-color': primaryOutline,
    '--font-outline-secondary-width': `${secondaryWidth}px`,
    '--font-outline-secondary-color': secondaryOutline,
    '--font-outline-order': outline.mode === 'outside' ? 'stroke fill' : 'normal',
    '--font-shadow': shadow.enabled
      ? `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadowColor}`
      : 'none',
    '--text-align-primary': style.align.primary,
    '--text-align-secondary': style.align.secondary,
    '--ambient-color': style.ambient.color,
    '--ambient-intensity': String(style.ambient.intensity)
  } as CSSProperties
}

export function backgroundCss(style: WidgetStyle): CSSProperties {
  const background = style.background
  switch (background.kind) {
    case 'color':
      return { background: background.color }
    case 'gradient':
      return {
        background: `linear-gradient(${background.angle}deg, ${background.color}, ${background.color2})`
      }
    case 'image':
      return { background: 'transparent' }
    case 'glass':
    default:
      return {
        background: `linear-gradient(155deg, rgba(255,255,255,0.13), rgba(255,255,255,0.035) 42%, rgba(255,255,255,0.015)), ${background.color}`
      }
  }
}

export function imageUrl(id: string | null | undefined): string {
  return id ? `tasimage://asset/${encodeURIComponent(id)}` : ''
}

export function cropImageStyle(crop: ImageCrop): CSSProperties {
  return {
    objectFit: 'cover',
    objectPosition: `${crop.x}% ${crop.y}%`,
    transform: `scale(${crop.zoom})`,
    transformOrigin: `${crop.x}% ${crop.y}%`
  }
}

export function frameImageStyle(): CSSProperties {
  return {
    objectFit: 'fill',
    width: '100%',
    height: '100%'
  }
}

/** Рамка может выходить за карточку и двигаться/масштабироваться отдельно. */
export function frameLayerStyle(slot: ImageSlot): CSSProperties {
  const placement = slot.placement
  const scaleX = placement.scaleX / 100
  const scaleY = placement.stretch ? placement.scaleY / 100 : scaleX
  const inset = slot.inset
  return {
    left: `${-inset}%`,
    top: `${-inset}%`,
    width: `${100 + inset * 2}%`,
    height: `${100 + inset * 2}%`,
    opacity: slot.enabled ? slot.opacity : 0,
    transform: `translate(${placement.x}%, ${placement.y}%) rotate(${placement.rotate}deg) scale(${scaleX}, ${scaleY})`,
    transformOrigin: 'center'
  }
}

export function slotLayerStyle(slot: ImageSlot): CSSProperties {
  return {
    opacity: slot.enabled ? slot.opacity : 0,
    mixBlendMode: slot.blend
  }
}

export function presetPreviewStyle(style: WidgetStyle): CSSProperties {
  const background = style.background
  if (background.kind === 'image') {
    return {
      background: imageUrl(background.imageId)
        ? `linear-gradient(160deg, rgba(0,0,0,0.05), rgba(0,0,0,0.35)), url("${imageUrl(background.imageId)}") center / cover`
        : 'rgba(255,255,255,0.08)'
    }
  }
  return backgroundCss(style)
}

export function radiusStyle(style: WidgetStyle): CSSProperties {
  if (style.shape === 'rect') return { borderRadius: 0 }
  if (style.shape === 'custom') {
    const c = style.corners
    return { borderRadius: `${c.tl}px ${c.tr}px ${c.br}px ${c.bl}px` }
  }
  return { borderRadius: style.radius }
}
