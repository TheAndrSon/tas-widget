import { useEffect, useRef, type JSX } from 'react'
import type { VisualizerSettings } from '@shared/types'
import { ensureAnalyser, readSpectrum, spectrumValueRange } from '../../audio'

interface Particle {
  x: number
  y: number
  vy: number
  vx: number
  life: number
  size: number
}

function hexToRgb(color: string): [number, number, number] {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!match) return [255, 255, 255]
  let hex = match[1]
  if (hex.length === 3) hex = hex.split('').map((char) => char + char).join('')
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16)
  ]
}

function rgba(color: [number, number, number], alpha: number): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`
}

const SPECTRUM_MODES = new Set(['bars', 'mirror', 'radial', 'wave', 'line', 'dots'])

export function Visualizer({
  settings,
  className = ''
}: {
  settings: VisualizerSettings
  className?: string
}): JSX.Element | null {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  useEffect(() => {
    if (settings.mode === 'off') return
    if (SPECTRUM_MODES.has(settings.mode)) void ensureAnalyser()
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    let frame = 0
    let width = 0
    let height = 0
    let particles: Particle[] = []
    let last = performance.now()
    let levels: number[] = []

    const resize = (): void => {
      const ratio = Math.min(2, window.devicePixelRatio || 1)
      width = Math.max(1, canvas.clientWidth)
      height = Math.max(1, canvas.clientHeight)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const spawn = (count: number, mode: string): void => {
      for (let index = 0; index < count; index += 1) {
        particles.push({
          x: Math.random() * width,
          y: mode === 'rain' ? -8 - Math.random() * 40 : height + 6,
          vy: mode === 'rain' ? 26 + Math.random() * 60 : -(12 + Math.random() * 38),
          vx: (Math.random() - 0.5) * 18,
          life: 0.6 + Math.random() * 1.4,
          size: 1 + Math.random() * 2.2
        })
      }
      particles = particles.slice(-160)
    }

    const draw = (now: number): void => {
      const delta = Math.min(56, now - last)
      last = now
      const current = settingsRef.current
      const [r1, g1, b1] = hexToRgb(current.color1)
      const [r2, g2, b2] = hexToRgb(current.color2)
      const intensity = current.intensity
      const time = now / 1000
      const maxHeight = Math.max(0.2, Math.min(1, current.maxHeight / 100))
      context.clearRect(0, 0, width, height)

      const spectrum = readSpectrum()
      const count = current.bars
      if (levels.length !== count) levels = new Array(count).fill(0)
      const energyBase = spectrum
        ? Array.from({ length: count }, (_, index) =>
            Math.pow(
              spectrumValueRange(
                index,
                count,
                current.freqMin ?? 30,
                current.freqMax ?? 16000,
                current.freqScale ?? 'log'
              ),
              1.45
            )
          )
        : null
      const energy = energyBase
        ? energyBase.reduce((sum, value) => sum + value, 0) / Math.max(1, energyBase.length)
        : 0
      for (let index = 0; index < count; index += 1) {
        const real = energyBase ? Math.min(1, energyBase[index] * 1.9) : 0
        const synthetic =
          0.28 +
          0.3 * Math.abs(Math.sin(time * 2.1 + index * 0.55)) +
          0.22 * Math.abs(Math.sin(time * 5.3 + index * 0.21)) +
          0.16 * Math.abs(Math.sin(time * 0.7 + index * 1.3))
        const target = spectrum ? Math.max(real, 0.015) : synthetic
        levels[index] += (target - levels[index]) * (spectrum ? 0.42 : 0.2)
      }

      if (current.mode === 'bars' || current.mode === 'mirror') {
        const half = current.mode === 'mirror'
        const columns = half ? Math.max(6, Math.floor(count / 2)) : count
        const usableWidth = half ? width / 2 : width
        const gap = columns > 128 ? 0 : Math.max(1, usableWidth / columns / 4)
        const barWidth = Math.max(0.4, usableWidth / columns - gap)
        const useShared = columns > 128
        const sharedVertical = context.createLinearGradient(0, height, 0, 0)
        sharedVertical.addColorStop(0, rgba([r1, g1, b1], 0.35))
        sharedVertical.addColorStop(1, rgba([r2, g2, b2], 0.95))
        const angle = (current.gradientAngle * Math.PI) / 180
        const dx = Math.cos(angle) * width * 0.5
        const dy = Math.sin(angle) * height * 0.5
        const sharedFlow = context.createLinearGradient(
          width / 2 - dx,
          height / 2 - dy,
          width / 2 + dx,
          height / 2 + dy
        )
        sharedFlow.addColorStop(0, rgba([r1, g1, b1], 0.9))
        sharedFlow.addColorStop(0.5, rgba([r2, g2, b2], 0.95))
        sharedFlow.addColorStop(1, rgba([r1, g1, b1], 0.35))
        const drawBar = (index: number, x: number, value: number): void => {
          const barHeight = Math.max(1, height * maxHeight * Math.min(1, value * intensity * 1.35))
          if (useShared) {
            context.fillStyle =
              current.palette === 'gradient' ? sharedFlow : sharedVertical
          } else {
            const gradient = context.createLinearGradient(0, height - barHeight, 0, height)
            if (current.palette === 'gradient') {
              const shift =
                (Math.sin(time * current.gradientSpeed * 0.8 + index * 0.05) * 0.5 + 0.5) *
                current.gradientScale
              const mid = Math.min(0.92, Math.max(0.08, 0.5 + (shift - 1) * 0.25))
              gradient.addColorStop(0, rgba([r2, g2, b2], 0.95))
              gradient.addColorStop(mid, rgba([r1, g1, b1], 0.9))
              gradient.addColorStop(1, rgba([r2, g2, b2], 0.2))
            } else {
              gradient.addColorStop(0, rgba([r2, g2, b2], 0.95))
              gradient.addColorStop(1, rgba([r1, g1, b1], 0.18))
            }
            context.fillStyle = gradient
          }
          context.beginPath()
          if (barWidth >= 2) {
            context.roundRect(x, height - barHeight, barWidth, barHeight, barWidth / 2)
          } else {
            context.rect(x, height - barHeight, barWidth, barHeight)
          }
          context.fill()
        }
        for (let index = 0; index < columns; index += 1) {
          const sourceIndex =
            current.mirrorOrigin === 'end' ? columns - 1 - index : index
          const value = levels[sourceIndex] ?? 0
          if (!half) {
            drawBar(index, index * (barWidth + gap), value)
          } else {
            const offset = index * (barWidth + gap)
            drawBar(index, offset, value)
            drawBar(index, width - offset - barWidth, value)
          }
        }
      } else if (current.mode === 'radial') {
        const cx = width / 2
        const cy = height / 2
        const radius = Math.min(width, height) * 0.2
        for (let index = 0; index < count; index += 1) {
          const angle = ((index + 0.5) / count) * Math.PI * 2 - Math.PI / 2
          const value = levels[index] ?? 0
          const length =
            Math.max(2, Math.min(width, height) * 0.28 * maxHeight * Math.min(1, value * intensity * 1.45))
          const x1 = cx + Math.cos(angle) * radius
          const y1 = cy + Math.sin(angle) * radius
          const x2 = cx + Math.cos(angle) * (radius + length)
          const y2 = cy + Math.sin(angle) * (radius + length)
          const gradient = context.createLinearGradient(x1, y1, x2, y2)
          gradient.addColorStop(0, rgba([r1, g1, b1], 0.15))
          gradient.addColorStop(1, rgba([r2, g2, b2], 0.95))
          context.strokeStyle = gradient
          context.lineWidth = Math.max(1.2, (Math.PI * radius) / count / 1.4)
          context.lineCap = 'round'
          context.beginPath()
          context.moveTo(x1, y1)
          context.lineTo(x2, y2)
          context.stroke()
        }
        context.strokeStyle = rgba([r1, g1, b1], 0.18)
        context.lineWidth = 1
        context.beginPath()
        context.arc(cx, cy, radius - 3, 0, Math.PI * 2)
        context.stroke()
      } else if (current.mode === 'line') {
        context.beginPath()
        const amplitude = height * 0.2 * intensity
        for (let x = 0; x <= width; x += 3) {
          const index = Math.floor((x / width) * count)
          const value = levels[index] ?? 0
          const y = height * 0.55 - value * amplitude
          if (x === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        }
        const gradient = context.createLinearGradient(0, 0, width, 0)
        gradient.addColorStop(0, rgba([r1, g1, b1], 0.15))
        gradient.addColorStop(0.5, rgba([r2, g2, b2], 0.85))
        gradient.addColorStop(1, rgba([r1, g1, b1], 0.15))
        context.strokeStyle = gradient
        context.lineWidth = 2
        context.stroke()
      } else if (current.mode === 'dots') {
        const columns = count
        const rows = Math.max(4, Math.round((height / width) * columns * 0.55))
        const cell = Math.min(width / columns, height / rows)
        for (let column = 0; column < columns; column += 1) {
          const value = Math.min(1, levels[column] * intensity * 1.5)
          const activeRows = Math.round(rows * value * maxHeight)
          for (let row = 0; row < rows; row += 1) {
            const x = width / 2 + (column - columns / 2) * cell
            const y = height - (row + 1) * cell
            context.fillStyle =
              row < activeRows
                ? rgba([r2, g2, b2], 0.35 + (row / rows) * 0.65)
                : rgba([r1, g1, b1], 0.08)
            context.beginPath()
            context.roundRect(x + 1, y + 1, cell - 2, cell - 2, 1.5)
            context.fill()
          }
        }
      } else if (current.mode === 'ring') {
        const thickness = Math.max(1, Number(current.ringThickness ?? 3))
        const pulsePower = Math.max(0, Number(current.ringPulse ?? 1))
        const base = Math.min(width, height) * 0.38
        const cx = width / 2
        const cy = height / 2
        context.save()
        for (let ring = 0; ring < 4; ring += 1) {
          const pulse = 0.5 + 0.5 * Math.sin(time * 2.2 - ring * 0.75)
          const radius = base - ring * (5 + thickness * 0.6) + pulse * pulsePower * 5
          if (radius < 4) continue
          context.beginPath()
          context.arc(cx, cy, radius, 0, Math.PI * 2)
          context.strokeStyle = rgba(
            ring % 2 === 0 ? [r1, g1, b1] : [r2, g2, b2],
            (0.12 + pulse * 0.2 + energy * 0.7) * intensity
          )
          context.lineWidth = thickness + pulse * pulsePower * 3 + energy * 5
          context.shadowColor = rgba([r1, g1, b1], 0.75)
          context.shadowBlur = 8 + energy * 16
          context.stroke()
        }
        context.restore()
      } else if (current.mode === 'sparks') {
        const speed = 0.25 + Math.min(1, energy * 2) * 2.5
        if (Math.random() < 0.35 + energy * 1.4) spawn(1 + Math.round(energy * 3), 'sparks')
        for (const particle of particles) {
          particle.x += particle.vx * (delta / 1000)
          particle.y += particle.vy * speed * (delta / 1000)
          const alpha = Math.max(0, Math.min(1, particle.life))
          context.beginPath()
          context.arc(particle.x, particle.y, particle.size * intensity, 0, Math.PI * 2)
          context.fillStyle = rgba(Math.random() < 0.5 ? [r1, g1, b1] : [r2, g2, b2], alpha * 0.8)
          context.shadowColor = rgba([r1, g1, b1], 0.9)
          context.shadowBlur = 8
          context.fill()
          particle.life -= delta / 2600
        }
        context.shadowBlur = 0
        particles = particles.filter((particle) => particle.life > 0 && particle.y > -20)
      }

      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [settings.mode])

  if (settings.mode === 'off') return null
  return <canvas ref={canvasRef} className={`visualizer ${className}`} aria-hidden="true" />
}
