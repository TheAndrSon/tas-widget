import { useEffect, useRef, type ReactElement } from 'react'
import type { WeatherSnapshot } from '@shared/types'

type WeatherFx = 'rain' | 'snow' | 'fog' | 'storm'

function effectFor(code: number): WeatherFx | null {
  if ([95, 96, 99].includes(code)) return 'storm'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code === 45 || code === 48) return 'fog'
  return null
}

interface Drop {
  x: number
  y: number
  speed: number
  size: number
  drift: number
  alpha: number
}

export function WeatherEffect({ data }: { data: WeatherSnapshot | null }): ReactElement | null {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const effectRef = useRef<WeatherFx | null>(null)
  const code = data?.current.code ?? 0
  effectRef.current = effectFor(code)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    let width = 0
    let height = 0
    let drops: Drop[] = []
    let frame = 0
    let last = performance.now()
    const ratio = Math.min(2, window.devicePixelRatio || 1)

    const resize = (): void => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      const count = effectRef.current === 'snow' ? 55 : effectRef.current === 'fog' ? 10 : 90
      drops = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 8 + Math.random() * 26,
        size: 1 + Math.random() * 2.4,
        drift: (Math.random() - 0.5) * 16,
        alpha: 0.25 + Math.random() * 0.45
      }))
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const draw = (now: number): void => {
      const delta = Math.min(50, now - last) / 1000
      last = now
      const effect = effectRef.current
      context.clearRect(0, 0, width, height)

      if (!effect) {
        frame = requestAnimationFrame(draw)
        return
      }

      if (effect === 'fog') {
        const t = now / 1000
        for (let index = 0; index < 4; index += 1) {
          const x = ((t * (6 + index * 3) + index * width * 0.27) % (width * 1.4)) - width * 0.2
          const gradient = context.createRadialGradient(
            x,
            height * 0.6,
            0,
            x,
            height * 0.6,
            width * 0.55
          )
          gradient.addColorStop(0, 'rgba(255,255,255,0.11)')
          gradient.addColorStop(1, 'rgba(255,255,255,0)')
          context.fillStyle = gradient
          context.fillRect(0, 0, width, height)
        }
      } else if (effect === 'rain' || effect === 'storm') {
        context.strokeStyle =
          effect === 'storm' ? 'rgba(180,205,255,0.5)' : 'rgba(190,220,255,0.38)'
        context.lineWidth = 1.1
        for (const drop of drops) {
          drop.y += drop.speed * 7 * delta
          drop.x += drop.drift * delta
          if (drop.y > height + 12) {
            drop.y = -12
            drop.x = Math.random() * width
          }
          context.globalAlpha = drop.alpha
          context.beginPath()
          context.moveTo(drop.x, drop.y)
          context.lineTo(drop.x - 1.4, drop.y + 8)
          context.stroke()
        }
        if (effect === 'storm' && Math.random() < 0.004) {
          context.globalAlpha = 0.28
          context.fillStyle = '#dfe9ff'
          context.fillRect(0, 0, width, height)
        }
      } else if (effect === 'snow') {
        context.fillStyle = 'rgba(255,255,255,0.78)'
        for (const drop of drops) {
          drop.y += drop.speed * 1.7 * delta
          drop.x += Math.sin(now / 900 + drop.y * 0.03) * 10 * delta + drop.drift * 0.2 * delta
          if (drop.y > height + 6) {
            drop.y = -6
            drop.x = Math.random() * width
          }
          context.globalAlpha = drop.alpha
          context.beginPath()
          context.arc(drop.x, drop.y, drop.size * 0.9, 0, Math.PI * 2)
          context.fill()
        }
      }
      context.globalAlpha = 1
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [code])

  return <canvas ref={canvasRef} className="weather-fx" aria-hidden="true" />
}
