import { useEffect, useRef, type CSSProperties, type JSX } from 'react'
import type { SimsAction, SimsSettings } from '@shared/types'
import { NEEDS, decayMood, moodColor, moodLabel, moodState } from '@shared/sims'
import { useAppState } from '../../hooks'

function hexRgb(color: string): [number, number, number] {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!match) return [126, 242, 155]
  let hex = match[1]
  if (hex.length === 3) hex = hex.split('').map((char) => char + char).join('')
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16)
  ]
}

function PlumbobFaceted({
  spinning,
  color
}: {
  spinning: boolean
  color: string
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spinRef = useRef(spinning)
  spinRef.current = spinning
  const colorRef = useRef(color)
  colorRef.current = color

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const width = 90
    const height = 118
    const ratio = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = width * ratio
    canvas.height = height * ratio
    context.setTransform(ratio, 0, 0, ratio, 0, 0)

    const top = { x: 0, y: -54, z: 0 }
    const bottom = { x: 0, y: 54, z: 0 }
    const ring = [
      { x: 42, y: 2, z: 0 },
      { x: 0, y: 2, z: 42 },
      { x: -42, y: 2, z: 0 },
      { x: 0, y: 2, z: -42 }
    ]
    const faces = [
      [top, ring[0], ring[1]],
      [top, ring[1], ring[2]],
      [top, ring[2], ring[3]],
      [top, ring[3], ring[0]],
      [bottom, ring[1], ring[0]],
      [bottom, ring[2], ring[1]],
      [bottom, ring[3], ring[2]],
      [bottom, ring[0], ring[3]]
    ].flatMap(([a, b, c]) => {
      const ab = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 }
      const bc = { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2, z: (b.z + c.z) / 2 }
      const ca = { x: (c.x + a.x) / 2, y: (c.y + a.y) / 2, z: (c.z + a.z) / 2 }
      return [
        [a, ab, ca],
        [ab, b, bc],
        [ca, bc, c],
        [ab, bc, ca]
      ]
    })

    const rotateY = (point: { x: number; y: number; z: number }, angle: number): typeof point => {
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      return {
        x: point.x * cos - point.z * sin,
        y: point.y,
        z: point.x * sin + point.z * cos
      }
    }
    const project = (point: { x: number; y: number; z: number }): { x: number; y: number } => {
      const perspective = 420 / (420 + point.z)
      return {
        x: width / 2 + point.x * perspective,
        y: height / 2 + point.y * perspective
      }
    }

    let frame = 0
    let angle = -0.55
    let last = performance.now()
    const draw = (now: number): void => {
      const delta = Math.min(50, now - last)
      last = now
      if (spinRef.current) angle += delta * 0.0015
      context.clearRect(0, 0, width, height)
      const rgb = hexRgb(colorRef.current)
      const rotated = faces.map((face) =>
        face.map((point) => rotateY(point, angle))
      )
      const items = rotated.map((face) => {
        const a = face[0]
        const b = face[1]
        const c = face[2]
        const ux = b.x - a.x
        const uy = b.y - a.y
        const uz = b.z - a.z
        const vx = c.x - a.x
        const vy = c.y - a.y
        const vz = c.z - a.z
        const nx = uy * vz - uz * vy
        const ny = uz * vx - ux * vz
        const nz = ux * vy - uy * vx
        const length = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
        const light = (-nx * 0.28 - ny * 0.5 - nz * 0.78) / length
        return {
          points: face.map(project),
          z: (a.z + b.z + c.z) / 3,
          light
        }
      })
      items.sort((a, b) => a.z - b.z)
      for (const item of items) {
        const shade = Math.max(0.68, Math.min(1.55, 1.02 + item.light * 0.42))
        context.beginPath()
        context.moveTo(item.points[0].x, item.points[0].y)
        context.lineTo(item.points[1].x, item.points[1].y)
        context.lineTo(item.points[2].x, item.points[2].y)
        context.closePath()
        context.fillStyle = `rgb(${Math.min(255, Math.round(rgb[0] * shade))}, ${Math.min(255, Math.round(rgb[1] * shade))}, ${Math.min(255, Math.round(rgb[2] * shade))})`
        context.fill()
        context.strokeStyle = 'rgba(255, 255, 255, 0.22)'
        context.lineWidth = 0.7
        context.stroke()
      }
      const glow = context.createRadialGradient(width * 0.5, height * 0.47, 0, width * 0.5, height * 0.47, 42)
      glow.addColorStop(0, 'rgba(255, 255, 255, 0.55)')
      glow.addColorStop(0.45, 'rgba(255, 255, 255, 0.16)')
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])

  return <canvas ref={canvasRef} className="plumbob-faceted__canvas" aria-hidden="true" />
}

function Plumbob3D({
  spinning,
  variant,
  color
}: {
  spinning: boolean
  variant: 'classic' | 'faceted'
  color: string
}): JSX.Element {
  if (variant === 'faceted') {
    return (
      <div className={`plumbob-3d plumbob-faceted${spinning ? ' is-spinning' : ''}`}>
        <div className="plumbob-3d__glow" />
        <PlumbobFaceted spinning={spinning} color={color} />
      </div>
    )
  }
  return (
    <div className={`plumbob-3d${spinning ? ' is-spinning' : ''}`}>
      <div className="plumbob-3d__glow" />
      <div className="plumbob-3d__gem">
        {[0, 30, 60, 90, 120, 150].map((angle) => (
          <span
            className="plumbob-3d__facet"
            key={angle}
            style={{ transform: `rotateY(${angle}deg)` }}
          />
        ))}
      </div>
      <span className="plumbob-3d__shine" />
    </div>
  )
}

export function SimsWidget({
  settings,
  interactive,
  instanceId
}: {
  settings: SimsSettings
  interactive: boolean
  instanceId: string
}): JSX.Element {
  const state = useAppState()
  const stored = state?.sims[settings.groupId]
  if (!stored) {
    return (
      <div className="sims">
        <div className="sims__empty">Группа «{settings.groupId}» не найдена</div>
      </div>
    )
  }
  const mood = decayMood(stored)
  const color = settings.colorMode === 'custom' ? settings.color : moodColor(mood.mood)
  const style = {
    '--sims-color': color,
    '--bling': String(settings.blingIntensity)
  } as CSSProperties
  const act = (action: SimsAction): void => {
    void window.widgets.simsAction(settings.groupId, action, settings.difficulty)
  }

  return (
    <div className={`sims${settings.mode === 'needs' ? ' sims--needs' : ' sims--plumbob'} sims-anim-${settings.animation}`} style={style}>
      {settings.mode === 'needs' ? (
        <>
          <div className="sims__head">
            <span className="sims__dot" />
            <div className="sims__headtext">
              <div className="sims__title">Потребности</div>
              <div className="sims__caption">
                {moodLabel(mood.mood)} · {moodState(mood)}
              </div>
            </div>
            <span className="sims__mood">{Math.round(mood.mood)}</span>
          </div>

          <div className="sims__needs">
            {NEEDS.map((need) => (
              <div className="sims-need" key={need.key}>
                <span className="sims-need__label">{need.label}</span>
                <span className="sims-need__track">
                  <span
                    className="sims-need__fill"
                    style={{ width: `${mood[need.key]}%`, background: moodColor(mood[need.key]) }}
                  />
                </span>
                <span className="sims-need__value">{mood[need.key]}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="plumbob-stage">
            <Plumbob3D
              spinning={settings.animation === 'spin'}
              variant={settings.plumbobVariant}
              color={color}
            />
            {settings.bling && (
              <div className="sims-bling" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                  <span key={index} className={`sims-bling__spark sims-bling__spark--${index}`} />
                ))}
              </div>
            )}
            {settings.showArrow && (
              <button
                type="button"
                className="sims__menu-arrow no-drag"
                title="Действия и потребности"
                onClick={() => window.widgets.openSimsMenu(instanceId)}
              >
                ›
              </button>
            )}
          </div>
          {settings.showLabel && (
            <div className="sims__label">
              <span className="sims__label-name">{settings.label || 'Пламбоб'}</span>
              <span className="sims__caption">
                {moodLabel(mood.mood)} · {moodState(mood)}
              </span>
            </div>
          )}
        </>
      )}

      {(settings.showPoints || settings.showDifficulty || settings.showMoodValue) && (
        <div className="sims__scoreline">
          {settings.showPoints && <span className="sims__points">★ {mood.points}</span>}
          {settings.showDifficulty && (
            <span className={`sims__difficulty${settings.difficulty === 'hard' ? ' is-hard' : ''}`}>
              {settings.difficulty === 'hard' ? 'хард' : 'база'}
            </span>
          )}
          {settings.showMoodValue && <span className="sims__moodvalue">{Math.round(mood.mood)}</span>}
        </div>
      )}

      {settings.mode === 'needs' && (
        <div className="sims__actions">
          {NEEDS.map((need) => (
            <button
              type="button"
              key={need.key}
              disabled={!interactive}
              onClick={() => act(need.action)}
              title={need.label}
            >
              {need.label}
            </button>
          ))}
          <button
            type="button"
            className="sims__worsen"
            disabled={!interactive}
            onClick={() => act('worsen')}
            title="Ухудшить состояние"
          >
            Ухудшить
          </button>
        </div>
      )}
      {!interactive && <div className="sims__hint">Разблокируйте виджет, чтобы играть</div>}
    </div>
  )
}
