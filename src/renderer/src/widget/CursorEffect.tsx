import { useEffect, useRef, useState, type CSSProperties, type JSX } from 'react'
import type { CursorEffect as CursorEffectId } from '@shared/types'

interface Point {
  x: number
  y: number
  id: number
}

interface Burst {
  id: number
  x: number
  y: number
}

export function CursorEffect({ effect }: { effect: CursorEffectId }): JSX.Element {
  const layerRef = useRef<HTMLDivElement>(null)
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null)
  const [trail, setTrail] = useState<Point[]>([])
  const [bursts, setBursts] = useState<Burst[]>([])
  const counter = useRef(0)

  useEffect(() => {
    if (effect === 'none') {
      setPoint(null)
      setTrail([])
      return
    }
    let alive = true
    const off = window.widgets.onCursor((cursor) => {
      if (!alive) return
      const layer = layerRef.current
      if (!layer) return
      const x = cursor.x - window.screenX
      const y = cursor.y - window.screenY
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) {
        setPoint(null)
        return
      }
      setPoint({ x, y })
      if (effect === 'trail' || effect === 'fairy') {
        counter.current += 1
        setTrail((previous) => [...previous.slice(-8), { x, y, id: counter.current }])
      }
    })
    return () => {
      alive = false
      off()
    }
  }, [effect])

  useEffect(() => {
    if (effect !== 'fairy') return
    const handler = (event: PointerEvent): void => {
      const layer = layerRef.current
      if (!layer) return
      const rect = layer.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return
      counter.current += 1
      const burst = { id: counter.current, x, y }
      setBursts((previous) => [...previous, burst])
      window.setTimeout(() => {
        setBursts((previous) => previous.filter((item) => item.id !== burst.id))
      }, 900)
    }
    window.addEventListener('pointerdown', handler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [effect])

  const transform = point
    ? { transform: `translate3d(${point.x}px, ${point.y}px, 0)` }
    : undefined

  return (
    <div className={`cursor-layer${point ? ' is-visible' : ''}`} ref={layerRef} aria-hidden="true">
      {point && effect === 'glow' && <div className="cursor-fx cursor-fx--glow" style={transform} />}
      {point && effect === 'ring' && <div className="cursor-fx cursor-fx--ring" style={transform} />}
      {point && effect === 'spotlight' && (
        <div className="cursor-fx cursor-fx--spot" style={transform} />
      )}
      {point && effect === 'sparkles' && (
        <div className="cursor-sparkles" style={transform}>
          {[0, 1, 2, 3, 4].map((index) => (
            <span className="cursor-spark" key={index} />
          ))}
        </div>
      )}
      {point && effect === 'fairy' && (
        <div className="cursor-fx cursor-fx--fairy" style={transform}>
          <span className="cursor-fx__core" />
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <span className="cursor-fx__petal" key={index} />
          ))}
        </div>
      )}
      {(effect === 'trail' || effect === 'fairy') &&
        trail.map((item, index) => {
          const age = trail.length - 1 - index
          return (
            <span
              className={`cursor-trail-dot${effect === 'fairy' ? ' cursor-trail-dot--fairy' : ''}`}
              key={item.id}
              style={{
                transform: `translate3d(${item.x}px, ${item.y}px, 0) scale(${Math.max(0.25, 1 - age * 0.09)})`,
                width: Math.max(2, 7 - age),
                height: Math.max(2, 7 - age),
                opacity: Math.max(0.04, 0.32 - age * 0.04)
              }}
            />
          )
        })}
      {bursts.map((burst) => (
        <span
          className="cursor-burst"
          key={burst.id}
          style={{ left: burst.x, top: burst.y }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
            <span
              key={index}
              className="cursor-burst__spark"
              style={
                {
                  '--angle': `${index * 45}deg`,
                  animationDelay: `${index * 12}ms`
                } as CSSProperties
              }
            />
          ))}
        </span>
      ))}
    </div>
  )
}
