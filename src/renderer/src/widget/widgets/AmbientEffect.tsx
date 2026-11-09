import { useEffect, useRef, type JSX } from 'react'
import type { AmbientStyle } from '@shared/types'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  phase: number
  char?: string
}

function hexToRgb(color: string): [number, number, number] {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!match) return [255, 255, 255]
  let hex = match[1]
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16)
  ]
}

function rgba([r, g, b]: [number, number, number], a: number): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export function AmbientEffect({ settings }: { settings: AmbientStyle }): JSX.Element | null {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const kind = settings.kind

  useEffect(() => {
    if (kind === 'none' || kind === 'weather') return
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    let width = 0
    let height = 0
    let frame = 0
    let last = performance.now()
    let particles: Particle[] = []
    let shooting: { x: number; y: number; life: number } | null = null
    let nextShooting = performance.now() + 1500
    const ratio = Math.min(2, window.devicePixelRatio || 1)
    const glyphs = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン'

    const resize = (): void => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      const count = kind === 'matrix' ? Math.max(16, Math.round(width / 18)) : 44
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 6,
        vy: -(8 + Math.random() * 18),
        size: 1 + Math.random() * 2.4,
        life: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        char: glyphs[Math.floor(Math.random() * glyphs.length)]
      }))
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const draw = (now: number): void => {
      const delta = Math.min(48, now - last) / 1000
      last = now
      const current = settingsRef.current
      const color = hexToRgb(current.color)
      const alpha = current.intensity
      const time = now / 1000
      context.clearRect(0, 0, width, height)

      if (current.kind === 'stars') {
        if (!shooting && now >= nextShooting) {
          shooting = { x: Math.random() * width * 0.7, y: Math.random() * height * 0.35, life: 1 }
          nextShooting = now + Math.max(2, current.shootingFrequency) * 1000
        }
        for (const particle of particles) {
          const twinkle = 0.2 + 0.8 * Math.abs(Math.sin(time * 1.4 + particle.phase))
          context.fillStyle = rgba(color, particle.life * 0.72 * twinkle * alpha)
          context.beginPath()
          context.arc(particle.x, particle.y, particle.size * 0.75, 0, Math.PI * 2)
          context.fill()
        }
        if (shooting) {
          shooting.x += 150 * delta
          shooting.y += 65 * delta
          shooting.life -= delta * 0.65
          context.strokeStyle = rgba(color, Math.max(0, shooting.life) * 0.8 * alpha)
          context.lineWidth = 1.3
          context.beginPath()
          context.moveTo(shooting.x, shooting.y)
          context.lineTo(shooting.x - 42, shooting.y - 18)
          context.stroke()
          if (shooting.life <= 0) shooting = null
        }
      } else if (current.kind === 'synthwave') {
        const sky = context.createLinearGradient(0, 0, 0, height)
        sky.addColorStop(0, 'rgba(20, 6, 48, 0.28)')
        sky.addColorStop(0.55, 'rgba(80, 12, 70, 0.18)')
        sky.addColorStop(1, 'rgba(10, 4, 24, 0.22)')
        context.fillStyle = sky
        context.fillRect(0, 0, width, height)
        const cx = width / 2
        const sunY = height * 0.38
        const sunR = Math.min(width, height) * 0.16
        const sun = context.createLinearGradient(cx, sunY - sunR, cx, sunY + sunR)
        sun.addColorStop(0, 'rgba(255, 220, 120, 0.8)')
        sun.addColorStop(0.55, 'rgba(255, 110, 160, 0.65)')
        sun.addColorStop(1, 'rgba(120, 40, 180, 0.15)')
        context.fillStyle = sun
        context.beginPath()
        context.arc(cx, sunY, sunR, 0, Math.PI * 2)
        context.fill()
        context.strokeStyle = rgba(color, 0.35 * alpha)
        context.lineWidth = 1
        for (let index = 0; index < 9; index += 1) {
          const y = height * 0.58 + ((index / 9) ** 1.8) * height * 0.42
          context.beginPath()
          context.moveTo(0, y)
          context.lineTo(width, y)
          context.stroke()
        }
        for (let index = -6; index <= 6; index += 1) {
          context.beginPath()
          context.moveTo(cx, height * 0.55)
          context.lineTo(cx + index * width * 0.13, height)
          context.stroke()
        }
      } else if (current.kind === 'matrix') {
        context.font = '10px monospace'
        context.textAlign = 'center'
        for (const particle of particles) {
          particle.y += (26 + particle.size * 5) * delta
          if (particle.y > height + 12) {
            particle.y = -12
            particle.x = Math.random() * width
            particle.char = glyphs[Math.floor(Math.random() * glyphs.length)]
          }
          context.fillStyle = rgba(color, (0.25 + Math.random() * 0.55) * alpha)
          context.fillText(particle.char ?? '0', particle.x, particle.y)
        }
      } else {
        // fireflies
        for (const particle of particles) {
          particle.y += particle.vy * delta * 0.6
          particle.x += Math.sin(time * 1.4 + particle.phase) * 9 * delta
          if (particle.y < -10) {
            particle.y = height + 10
            particle.x = Math.random() * width
          }
          const pulse = 0.45 + 0.55 * Math.sin(time * 2 + particle.phase)
          context.beginPath()
          context.arc(particle.x, particle.y, particle.size * 1.4, 0, Math.PI * 2)
          context.fillStyle = rgba(color, 0.5 * pulse * alpha)
          context.shadowColor = rgba(color, 0.8)
          context.shadowBlur = 8
          context.fill()
        }
        context.shadowBlur = 0
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [kind])

  if (kind === 'none' || kind === 'weather') return null
  return <canvas ref={canvasRef} className="ambient-canvas" data-kind={kind} aria-hidden="true" />
}
