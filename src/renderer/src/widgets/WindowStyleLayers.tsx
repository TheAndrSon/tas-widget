import type { CSSProperties, ReactElement } from 'react'
import type { WindowImageLayer, WindowStyle } from '@shared/types'
import { useAssetUrl } from './useAssetUrl'

function rgba(hex: string, alpha: number): string {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!match) return `rgba(255,255,255,${alpha})`
  return `rgba(${Number.parseInt(match[1], 16)}, ${Number.parseInt(match[2], 16)}, ${Number.parseInt(match[3], 16)}, ${alpha})`
}

export function windowStyleClass(style: WindowStyle): string {
  const classes: string[] = []
  if (style.windowless) classes.push('ws-windowless')
  if (style.outline.enabled && style.outline.placement === 'over') classes.push('ws-outline-over')
  if (style.outline.lamp) classes.push('ws-lamp')
  return classes.join(' ')
}

export function windowStyleVars(style: WindowStyle): CSSProperties {
  const vars: Record<string, string | number> = {
    '--ws-radius': `${style.radius}px`,
    '--ws-outline-color': rgba(style.outline.color, style.outline.intensity),
    '--ws-outline-thickness': `${style.outline.thickness}px`,
    '--ws-outline-glow': `${style.outline.glow}px`
  }

  const shadows: string[] = ['inset 0 1px 0 rgba(255,255,255,0.06)']
  if (style.outline.enabled && style.outline.placement === 'under') {
    shadows.unshift(
      `0 0 0 ${style.outline.thickness}px ${rgba(style.outline.color, style.outline.intensity)}`,
      `0 0 ${style.outline.glow}px ${rgba(style.outline.color, style.outline.intensity)}`
    )
  }
  if (style.glow.enabled) {
    shadows.push(
      `0 0 ${style.glow.spread}px ${rgba(style.glow.color, style.glow.intensity)}`,
      `0 0 ${style.glow.spread * 1.8}px ${rgba(style.glow.color, style.glow.intensity * 0.5)}`
    )
  }

  vars['--ws-shadow'] = style.windowless ? 'none' : shadows.join(', ')
  return vars as CSSProperties
}

function StyleImage({ layer }: { layer: WindowImageLayer }): ReactElement | null {
  const url = useAssetUrl(layer.assetId)
  if (!url) return null

  return (
    <div
      className="frame-image"
      style={{
        backgroundImage: `url(${url})`,
        opacity: layer.opacity,
        filter: `saturate(${layer.saturation}) brightness(${1 - layer.dim * 0.6})`,
        backgroundSize: `${layer.zoom * 100}%`,
        backgroundPosition: `${layer.x}% ${layer.y}%`
      }}
    />
  )
}

export function WindowStyleLayers({
  style,
  accent
}: {
  style: WindowStyle
  accent: boolean
}): ReactElement {
  const accentStyle: CSSProperties = {
    background: `radial-gradient(circle at ${style.accent.x}% ${style.accent.y}%, ${rgba(
      style.accent.color,
      style.accent.intensity
    )} 0%, transparent ${style.accent.size}%)`
  }

  return (
    <div className="frame-layers" aria-hidden="true">
      <div
        className="frame-bg"
        style={{
          background: `linear-gradient(${style.background.angle}deg, ${style.background.color1}, ${style.background.color2})`,
          opacity: style.background.opacity
        }}
      />
      {style.images.map((image, index) => (
        <StyleImage key={`${image.assetId ?? 'empty'}-${index}`} layer={image} />
      ))}
      {accent && style.accent.enabled && <div className="frame-accent" style={accentStyle} />}
    </div>
  )
}
