import { useEffect, useRef, type ReactElement } from 'react'
import type { WeatherSnapshot } from '@shared/types'
import { cityMinutes } from '@shared/sun'
import { useNow } from './useWeather'

function minutes(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0
}

export function WeatherAtmosphere({ data }: { data: WeatherSnapshot | null }): ReactElement | null {
  const now = useNow(60_000)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ dawn: 0, day: 0, dusk: 0, night: 0 })

  const rise = data?.sun ? minutes(data.sun.sunrise) : 6 * 60
  const set = data?.sun ? minutes(data.sun.sunset) : 20 * 60
  const current = cityMinutes(now, data?.utcOffsetSeconds ?? 0)
  const night = current < rise || current >= set
  stateRef.current = {
    dawn: night ? 0 : Math.max(0, 1 - Math.abs(current - rise) / 90),
    day: night
      ? 0
      : Math.min(
          1,
          Math.max(0, (current - rise) / 120) * Math.max(0, Math.min(1, (set - current) / 120))
        ),
    dusk: night ? 0 : Math.max(0, 1 - Math.abs(current - set) / 90),
    night: night ? 1 : 0
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    let width = 0
    let height = 0
    let frame = 0
    let last = performance.now()
    let stars = Array.from({ length: 44 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.8,
      size: 0.4 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2
    }))
    let shooting: { x: number; y: number; life: number } | null = null
    const ratio = Math.min(2, window.devicePixelRatio || 1)

    const resize = (): void => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      stars = stars.map(star => ({ ...star }))
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const draw = (timeNow: number): void => {
      const delta = Math.min(48, timeNow - last) / 1000
      last = timeNow
      const state = stateRef.current
      const t = timeNow / 1000
      context.clearRect(0, 0, width, height)

      const sky = context.createLinearGradient(0, 0, 0, height)
      if (state.night > 0.5) {
        sky.addColorStop(0, 'rgba(12, 18, 46, 0.5)')
        sky.addColorStop(0.55, 'rgba(24, 26, 64, 0.28)')
        sky.addColorStop(1, 'rgba(8, 10, 22, 0.12)')
      } else if (state.dusk > 0.25) {
        sky.addColorStop(0, 'rgba(255, 154, 92, 0.3)')
        sky.addColorStop(0.5, 'rgba(255, 92, 126, 0.14)')
        sky.addColorStop(1, 'rgba(40, 24, 60, 0.08)')
      } else if (state.dawn > 0.25) {
        sky.addColorStop(0, 'rgba(255, 194, 139, 0.25)')
        sky.addColorStop(1, 'rgba(90, 128, 190, 0.08)')
      } else {
        sky.addColorStop(0, 'rgba(255, 221, 150, 0.18)')
        sky.addColorStop(1, 'rgba(255, 210, 140, 0.03)')
      }
      context.fillStyle = sky
      context.fillRect(0, 0, width, height)

      if (state.night > 0.5) {
        for (const star of stars) {
          const twinkle = 0.25 + 0.75 * Math.abs(Math.sin(t * 1.3 + star.phase))
          context.fillStyle = `rgba(255, 255, 255, ${0.55 * twinkle})`
          context.beginPath()
          context.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2)
          context.fill()
        }
        if (!shooting && Math.random() < 0.012) {
          shooting = { x: Math.random() * width * 0.7, y: Math.random() * height * 0.35, life: 1 }
        }
        if (shooting) {
          shooting.x += 155 * delta
          shooting.y += 65 * delta
          shooting.life -= delta * 0.8
          context.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, shooting.life) * 0.6})`
          context.lineWidth = 1.2
          context.beginPath()
          context.moveTo(shooting.x, shooting.y)
          context.lineTo(shooting.x - 35, shooting.y - 14)
          context.stroke()
          if (shooting.life <= 0) shooting = null
        }
        const mx = width * 0.82 + Math.sin(t * 0.2) * 4
        const my = height * 0.15
        const mr = Math.min(width, height) * 0.09
        const glow = context.createRadialGradient(mx, my, 0, mx, my, mr * 3)
        glow.addColorStop(0, 'rgba(220, 225, 255, 0.18)')
        glow.addColorStop(1, 'rgba(220, 225, 255, 0)')
        context.fillStyle = glow
        context.fillRect(0, 0, width, height)
        context.fillStyle = 'rgba(238, 240, 255, 0.55)'
        context.beginPath()
        context.arc(mx, my, mr, 0, Math.PI * 2)
        context.fill()
        context.fillStyle = 'rgba(8, 10, 20, 0.92)'
        context.beginPath()
        context.arc(mx - mr * 0.32, my - mr * 0.1, mr * 0.88, 0, Math.PI * 2)
        context.fill()
      } else {
        const sx = width * (state.dusk > 0.25 ? 0.78 : state.dawn > 0.25 ? 0.22 : 0.82)
        const sy = height * (state.dusk > 0.25 ? 0.42 : 0.13)
        const radius = Math.min(width, height) * 0.14
        const glow = context.createRadialGradient(sx, sy, 0, sx, sy, radius * 3.2)
        glow.addColorStop(0, `rgba(255, 220, 150, ${0.28 + state.day * 0.1})`)
        glow.addColorStop(0.5, 'rgba(255, 180, 100, 0.08)')
        glow.addColorStop(1, 'rgba(255, 160, 80, 0)')
        context.fillStyle = glow
        context.fillRect(0, 0, width, height)
        context.fillStyle = `rgba(255, 235, 175, ${0.5 + state.day * 0.2})`
        context.beginPath()
        context.arc(sx, sy, radius, 0, Math.PI * 2)
        context.fill()
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="weather-atmosphere" aria-hidden="true" />
}
