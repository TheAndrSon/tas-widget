import { useEffect, useRef, type ReactElement } from 'react'
import type { VisualizerSettings } from '@shared/types'
import { ensureAnalyser, readSpectrum, spectrumValueRange } from '../../audio'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  growth?: number
}

interface Wave {
  radius: number
  age: number
  strength: number
}

function hexToRgb(color: string): [number, number, number] {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!match) return [255, 255, 255]
  let hex = match[1]
  if (hex.length === 3)
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('')
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16)
  ]
}

function rgba(color: [number, number, number], alpha: number): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`
}

export function Visualizer({
  settings,
  className = '',
  flatWhenIdle = false
}: {
  settings: VisualizerSettings
  className?: string
  flatWhenIdle?: boolean
}): ReactElement | null {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  useEffect(() => {
    if (settings.mode === 'off') return
    void ensureAnalyser()

    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    let frame = 0
    let width = 0
    let height = 0
    let last = performance.now()
    let levels: number[] = []
    let particles: Particle[] = []
    let waves: Wave[] = []
    let waveClock = 0

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

    const draw = (now: number): void => {
      const delta = Math.min(56, now - last) / 1000
      last = now
      const s = settingsRef.current
      const [r1, g1, b1] = hexToRgb(s.color1)
      const [r2, g2, b2] = hexToRgb(s.color2)
      const time = now / 1000
      const count = s.bars
      const maxHeight = s.maxHeight / 100
      const intensity = s.intensity
      context.clearRect(0, 0, width, height)

      const spectrum = readSpectrum()
      if (levels.length !== count) levels = new Array(count).fill(0)
      const bins = s.halfSpectrum ? Math.max(1, Math.ceil(count / 2)) : count
      let energy = 0
      for (let index = 0; index < count; index += 1) {
        const source = s.halfSpectrum ? (index < bins ? index : count - 1 - index) : index
        const real = spectrum
          ? Math.pow(spectrumValueRange(source, bins, s.freqMin, s.freqMax, s.freqScale), 1.45) *
            1.9
          : 0
        const synthetic =
          0.28 +
          0.3 * Math.abs(Math.sin(time * 2.1 + source * 0.55)) +
          0.22 * Math.abs(Math.sin(time * 5.3 + source * 0.21)) +
          0.16 * Math.abs(Math.sin(time * 0.7 + source * 1.3))
        const target = spectrum ? Math.max(Math.min(1, real), 0.015) : synthetic
        levels[index] += (target - levels[index]) * (spectrum ? 0.42 : 0.2)
        energy += levels[index]
      }
      energy /= Math.max(1, count)

      const mirrorV = s.reflection === 'vertical' || s.reflection === 'both'
      const mirrorH = s.reflection === 'horizontal' || s.reflection === 'both'

      // Без звука эквалайзер превращается в тонкую линию, а не живёт синтетикой.
      if (flatWhenIdle && (!spectrum || energy < 0.02)) {
        context.fillStyle = rgba([r1, g1, b1], 0.5)
        context.fillRect(0, Math.max(0, Math.min(height - 1, Math.round(height * 0.5))), width, 1)
        frame = requestAnimationFrame(draw)
        return
      }

      context.save()
      context.translate(width / 2, height / 2)
      context.rotate((s.rotation * Math.PI) / 180)
      context.scale(s.mirrorX ? -1 : 1, s.mirrorY ? -1 : 1)
      context.translate(-width / 2, -height / 2)

      if (s.glowEnabled && (s.mode !== 'bars' || count <= 800)) {
        context.shadowColor = rgba([r1, g1, b1], s.glowIntensity)
        context.shadowBlur = s.glowSpread
      }

      if (s.mode === 'bars') {
        const step = s.barThickness + s.barGap
        const group = count * s.barThickness + Math.max(0, count - 1) * s.barGap
        const axisX = width * s.axis
        const startX = axisX - group / 2
        const limit = height * maxHeight
        const gradientCache = new Map<string, CanvasGradient>()

        const drawBar = (x: number, value: number, offsetY = 0): void => {
          const barHeight = Math.max(1, limit * Math.min(1, value * intensity * 1.3))
          const top = height - barHeight + offsetY
          const key = `${Math.round(barHeight)}:${Math.round(offsetY)}`
          let fill = gradientCache.get(key)
          if (!fill) {
            fill = context.createLinearGradient(0, top, 0, top + barHeight)
            fill.addColorStop(0, rgba([r2, g2, b2], 0.95))
            fill.addColorStop(1, rgba([r1, g1, b1], 0.2))
            gradientCache.set(key, fill)
          }
          context.fillStyle = fill
          context.beginPath()
          if (s.barShape === 'rounded' && s.barThickness >= 2) {
            context.roundRect(x, top, s.barThickness, barHeight, s.barThickness / 2)
          } else {
            context.rect(x, top, s.barThickness, barHeight)
          }
          context.fill()
        }

        for (let index = 0; index < count; index += 1) {
          const value = levels[index] ?? 0
          const x = startX + index * step
          drawBar(x, value)
          if (mirrorV) {
            drawBar(2 * axisX - x - s.barThickness + s.mirrorOffsetX, value, s.mirrorOffsetY)
          }
        }
      } else if (s.mode === 'radial') {
        const cx = width / 2
        const cy = height / 2
        const base = Math.min(width, height) * (s.radialRadius || 0.16)
        const length = Math.min(width, height) * (s.radialLength || 0.34) * maxHeight
        const spike = Math.max(1, s.barThickness * 0.55)

        context.strokeStyle = rgba([r1, g1, b1], 0.22)
        context.lineWidth = Math.max(1, s.lineThickness)
        context.beginPath()
        context.arc(cx, cy, base, 0, Math.PI * 2)
        context.stroke()

        for (let index = 0; index < count; index += 1) {
          const angle = s.radialHalf
            ? (index / count) * Math.PI - Math.PI / 2
            : (index / count) * Math.PI * 2 - Math.PI / 2
          const value = levels[index] ?? 0
          const len = Math.max(2, length * Math.min(1, value * intensity * 1.45))
          const gradient = context.createLinearGradient(
            cx + Math.cos(angle) * base,
            cy + Math.sin(angle) * base,
            cx + Math.cos(angle) * (base + len),
            cy + Math.sin(angle) * (base + len)
          )
          gradient.addColorStop(0, rgba([r1, g1, b1], 0.2))
          gradient.addColorStop(1, rgba([r2, g2, b2], 0.95))
          context.strokeStyle = gradient
          context.lineWidth = spike
          context.lineCap = 'round'
          context.beginPath()
          context.moveTo(cx + Math.cos(angle) * base, cy + Math.sin(angle) * base)
          context.lineTo(cx + Math.cos(angle) * (base + len), cy + Math.sin(angle) * (base + len))
          if (mirrorV) {
            const mx = s.mirrorOffsetX
            const my = s.mirrorOffsetY
            context.moveTo(cx - Math.cos(angle) * base + mx, cy - Math.sin(angle) * base + my)
            context.lineTo(
              cx - Math.cos(angle) * (base + len) + mx,
              cy - Math.sin(angle) * (base + len) + my
            )
          }
          context.stroke()
        }
      } else if (s.mode === 'line') {
        const axisY = height * s.axis
        const amplitude = height * 0.4 * maxHeight * intensity
        const points = Math.max(32, Math.floor(width / 3))
        const strokeLine = (mirrored: boolean): void => {
          context.beginPath()
          for (let index = 0; index <= points; index += 1) {
            const ratio = index / points
            const source = ratio * (count - 1)
            const low = Math.floor(source)
            const high = Math.min(count - 1, low + 1)
            const value =
              (levels[low] ?? 0) + ((levels[high] ?? 0) - (levels[low] ?? 0)) * (source - low)
            const x = ratio * width + (mirrored ? s.mirrorOffsetX : 0)
            const y =
              axisY + (mirrored ? 1 : -1) * value * amplitude + (mirrored ? s.mirrorOffsetY : 0)
            if (index === 0) context.moveTo(x, y)
            else context.lineTo(x, y)
          }
          context.stroke()
        }
        const gradient = context.createLinearGradient(0, 0, width, 0)
        gradient.addColorStop(0, rgba([r1, g1, b1], 0.2))
        gradient.addColorStop(0.5, rgba([r2, g2, b2], 0.9))
        gradient.addColorStop(1, rgba([r1, g1, b1], 0.2))
        context.strokeStyle = gradient
        context.lineWidth = s.lineThickness
        context.lineCap = 'round'
        strokeLine(false)
        if (mirrorV) strokeLine(true)
      } else if (s.mode === 'waveform') {
        const axisY = height * s.axis
        const amplitude = height * 0.38 * maxHeight * intensity
        const points = Math.max(48, Math.min(720, count))
        const values: number[] = []
        for (let index = 0; index < points; index += 1) {
          const source = (index / Math.max(1, points - 1)) * (count - 1)
          const low = Math.floor(source)
          const high = Math.min(count - 1, low + 1)
          let sum = 0
          let weight = 0
          for (let tap = -2; tap <= 2; tap += 1) {
            const sample = Math.max(0, Math.min(count - 1, low + tap))
            const factor = 3 - Math.abs(tap)
            sum += (levels[sample] ?? 0) * factor
            weight += factor
          }
          values.push(sum / Math.max(1, weight))
        }

        const drawShape = (): void => {
          context.beginPath()
          for (let index = 0; index < points; index += 1) {
            const x = (index / Math.max(1, points - 1)) * width
            const top = axisY - values[index] * amplitude
            if (index === 0) context.moveTo(x, top)
            else context.lineTo(x, top)
          }
          for (let index = points - 1; index >= 0; index -= 1) {
            const x = (index / Math.max(1, points - 1)) * width
            const bottom = axisY + values[index] * amplitude * 0.35
            context.lineTo(x, bottom)
          }
          context.closePath()
          const fill = context.createLinearGradient(
            0,
            axisY - amplitude,
            0,
            axisY + amplitude * 0.4
          )
          fill.addColorStop(0, rgba([r2, g2, b2], 0.85))
          fill.addColorStop(1, rgba([r1, g1, b1], 0.22))
          context.fillStyle = fill
          context.fill()
          context.strokeStyle = rgba([r2, g2, b2], 0.9)
          context.lineWidth = s.lineThickness
          context.stroke()
        }

        if (s.glowEnabled) {
          context.shadowColor = rgba([r1, g1, b1], s.glowIntensity)
          context.shadowBlur = s.glowSpread
        }
        drawShape()
        if (mirrorV) {
          context.save()
          context.translate(s.mirrorOffsetX, s.mirrorOffsetY)
          context.translate(0, 2 * axisY)
          context.scale(1, -1)
          drawShape()
          context.restore()
        }
        context.shadowBlur = 0
      } else if (s.mode === 'dots') {
        const cell = s.dotSize + s.barGap
        const columns = Math.max(1, Math.min(count, Math.floor(width / Math.max(2, cell))))
        const rows = Math.max(1, Math.floor(height / Math.max(2, cell)))
        const group = columns * cell - s.barGap
        const axisX = width * s.axis
        const startX = axisX - group / 2

        const drawGrid = (origin: number, direction: number, offsetX = 0, offsetY = 0): void => {
          for (let column = 0; column < columns; column += 1) {
            const sourceIndex = Math.min(
              count - 1,
              Math.round((column / Math.max(1, columns - 1)) * (count - 1))
            )
            const value = Math.min(1, (levels[sourceIndex] ?? 0) * intensity * 1.5)
            const active = Math.round(rows * value * maxHeight)
            for (let row = 0; row < rows; row += 1) {
              const x = origin + direction * (column * cell) + offsetX
              const y = height - (row + 1) * cell + s.barGap / 2 + offsetY
              context.fillStyle =
                row < active
                  ? rgba([r2, g2, b2], (0.35 + (row / rows) * 0.6) * (s.spectrumOpacity ?? 1))
                  : rgba([r1, g1, b1], s.inactiveOpacity ?? 0.07)
              context.beginPath()
              context.arc(x + s.dotSize / 2, y + s.dotSize / 2, s.dotSize / 2, 0, Math.PI * 2)
              context.fill()
            }
          }
        }

        drawGrid(startX, 1)
        if (mirrorV) {
          drawGrid(2 * axisX - startX, -1, s.mirrorOffsetX, s.mirrorOffsetY)
        }
      } else if (s.mode === 'particles') {
        const axisX = width * s.axis
        const reactivity = s.particleReactivity
        const speed = s.sparkSpeed * (0.25 + energy * 2.8 * reactivity)
        const spawnChance = 0.1 + energy * 1.8 * reactivity

        if (Math.random() < spawnChance) {
          const spread = Math.max(0.1, s.particleSpread)
          if (s.particleOrigin === 'center') {
            const angle = Math.random() * Math.PI * 2
            const distance = 8 + Math.sqrt(Math.random()) * Math.min(width, height) * 0.42 * spread
            const outward = 18 + Math.random() * 46
            particles.push({
              x: width / 2 + Math.cos(angle) * distance,
              y: height / 2 + Math.sin(angle) * distance,
              vx: Math.cos(angle) * outward,
              vy: Math.sin(angle) * outward,
              life: 0.8 + Math.random() * 1.4,
              size: s.sparkSize * (s.particleRandomSize ? 0.35 + Math.random() * 1.5 : 1)
            })
          } else {
            particles.push({
              x: axisX + (Math.random() - 0.5) * width * spread,
              y: height + Math.random() * 12,
              vx: (Math.random() - 0.5) * 26,
              vy: -(16 + Math.random() * 44) * (0.5 + s.sparkSpeed),
              life: 0.7 + Math.random() * 1.4,
              size: s.sparkSize * (s.particleRandomSize ? 0.35 + Math.random() * 1.5 : 1)
            })
          }
          particles = particles.slice(-s.particleCount)
        }

        if (s.glowEnabled) {
          context.shadowColor = rgba([r1, g1, b1], s.glowIntensity)
          context.shadowBlur = s.glowSpread
        }
        for (const particle of particles) {
          particle.x += particle.vx * delta * speed
          particle.y += particle.vy * delta * speed
          particle.life -= delta * 0.45
          context.fillStyle = rgba(
            Math.random() < 0.5 ? [r1, g1, b1] : [r2, g2, b2],
            Math.max(0, Math.min(1, particle.life)) * 0.85
          )
          context.beginPath()
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          context.fill()
          if (mirrorV) {
            context.beginPath()
            context.arc(
              2 * axisX - particle.x + s.mirrorOffsetX,
              particle.y + s.mirrorOffsetY,
              particle.size,
              0,
              Math.PI * 2
            )
            context.fill()
          }
        }
        context.shadowBlur = 0
        particles = particles.filter(
          (particle) => particle.life > 0 && particle.y > -80 && particle.y < height + 80
        )
      } else if (s.mode === 'face') {
        const cx = width / 2
        const cy = height / 2
        const axisX = width * s.axis
        const speedReact = s.particleSpeedReactivity
        const speed = s.sparkSpeed * (0.35 + energy * 2.8 * speedReact)
        const spawnChance = 0.12 + energy * 1.9 * Math.max(0.1, s.particleReactivity)

        if (Math.random() < spawnChance) {
          const variability = Math.max(0, Math.min(1, s.particleSizeVariability))
          const variation = 1 + (Math.random() * 2 - 1) * variability
          const x = cx + (Math.random() - 0.5) * width * (s.particleMaskWidth ?? 0.2)
          const y = cy + (Math.random() - 0.5) * height * (s.particleMaskHeight ?? 0.2)
          const dx = x - cx
          const dy = y - cy
          const distance = Math.hypot(dx, dy)
          const angle = distance > 1 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2
          particles.push({
            x,
            y,
            vx: Math.cos(angle) * (30 + Math.random() * 80),
            vy: Math.sin(angle) * (30 + Math.random() * 80),
            life: 1 + Math.random() * 1.6,
            size: Math.max(0.4, s.sparkSize * variation * 0.4),
            growth: s.sparkSize * (0.5 + Math.random() * 1.5) * Math.max(0.2, variation)
          })
          particles = particles.slice(-s.particleCount)
        }

        if (s.glowEnabled) {
          context.shadowColor = rgba([r1, g1, b1], s.glowIntensity)
          context.shadowBlur = s.glowSpread
        }
        for (const particle of particles) {
          particle.x += particle.vx * delta * speed
          particle.y += particle.vy * delta * speed
          particle.size += (particle.growth ?? 0) * delta * speed
          particle.life -= delta * 0.32
          const alpha = Math.max(0, Math.min(1, particle.life)) * 0.9
          context.fillStyle = rgba(Math.random() < 0.5 ? [r1, g1, b1] : [r2, g2, b2], alpha)
          context.beginPath()
          context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          context.fill()
          if (mirrorV) {
            context.beginPath()
            context.arc(
              2 * axisX - particle.x + s.mirrorOffsetX,
              particle.y + s.mirrorOffsetY,
              particle.size,
              0,
              Math.PI * 2
            )
            context.fill()
          }
        }
        context.shadowBlur = 0
        particles = particles.filter(
          (particle) =>
            particle.life > 0 &&
            particle.size < 180 &&
            particle.x > -particle.size &&
            particle.x < width + particle.size &&
            particle.y > -particle.size &&
            particle.y < height + particle.size
        )
      } else if (s.mode === 'waves') {
        const cx = width / 2
        const cy = height / 2
        const base = Math.max(2, s.waveRadius)
        const life = Math.max(0.4, s.waveLife)
        const wavePower = s.waveIntensity
        const pulse = 0.85 + energy * 0.5 * intensity
        waveClock -= delta

        if (waveClock <= 0 && energy > 0.02 && waves.length < s.waveCount) {
          waves.push({ radius: base, age: 0, strength: Math.min(1, 0.35 + energy * 1.4) })
          waveClock = 0.55 / Math.max(0.2, s.waveSpeed * (0.4 + energy))
        }

        const glow = context.createRadialGradient(cx, cy, base * 0.2, cx, cy, base * 2.4 * pulse)
        glow.addColorStop(0, rgba([r2, g2, b2], 0.5 * intensity * wavePower))
        glow.addColorStop(0.5, rgba([r1, g1, b1], 0.18 * intensity * wavePower))
        glow.addColorStop(1, rgba([r1, g1, b1], 0))
        context.fillStyle = glow
        context.fillRect(0, 0, width, height)

        context.strokeStyle = rgba([r2, g2, b2], 0.85)
        context.lineWidth = s.waveThickness
        if (s.glowEnabled) {
          context.shadowColor = rgba([r2, g2, b2], s.glowIntensity)
          context.shadowBlur = s.glowSpread
        }
        context.beginPath()
        context.arc(cx, cy, base * pulse, 0, Math.PI * 2)
        context.stroke()
        context.shadowBlur = 0

        waves = waves.filter((wave) => wave.age < life)
        for (const wave of waves) {
          wave.age += delta
          wave.radius += (70 + energy * 170) * s.waveSpeed * delta
          const progress = Math.min(1, wave.age / life)
          const fade = 1 - progress
          context.strokeStyle = rgba(
            wave.strength > 0.7 ? [r2, g2, b2] : [r1, g1, b1],
            0.65 * fade * wave.strength * wavePower
          )
          context.lineWidth = Math.max(1, s.waveThickness * fade)
          context.beginPath()
          context.arc(cx, cy, wave.radius, 0, Math.PI * 2)
          context.stroke()
        }
      }

      context.shadowBlur = 0
      context.restore()

      // Горизонтальная ось: зеркальная копия всего рисунка сверху-вниз.
      if (mirrorH) {
        context.save()
        context.setTransform(1, 0, 0, 1, 0, 0)
        context.globalCompositeOperation = 'source-over'
        context.translate(0, canvas.height)
        context.scale(1, -1)
        context.drawImage(canvas, 0, 0)
        context.restore()
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
