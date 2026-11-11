import type { ReactElement } from 'react'
import { weatherKind } from '@shared/weatherCodes'

interface Props {
  code: number
  isDay?: boolean
  size?: number
  className?: string
}

function Sun({
  cx = 12,
  cy = 12,
  r = 4,
  rays = 8
}: {
  cx?: number
  cy?: number
  r?: number
  rays?: number
}): ReactElement {
  const items: ReactElement[] = []
  for (let i = 0; i < rays; i++) {
    const angle = (Math.PI * 2 * i) / rays - Math.PI / 2
    const inner = r + 2.1
    const outer = r + 4
    items.push(
      <line
        key={i}
        x1={cx + Math.cos(angle) * inner}
        y1={cy + Math.sin(angle) * inner}
        x2={cx + Math.cos(angle) * outer}
        y2={cy + Math.sin(angle) * outer}
      />
    )
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} />
      {items}
    </g>
  )
}

function Moon(): ReactElement {
  return <path d="M20.2 14.4A8.4 8.4 0 0 1 9.6 3.8a8.6 8.6 0 1 0 10.6 10.6Z" />
}

function Cloud({
  x = 0,
  y = 0,
  scale = 1
}: {
  x?: number
  y?: number
  scale?: number
}): ReactElement {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${scale})`}
      d="M7.1 17.4h9.2a3.6 3.6 0 0 0 .5-7.15 5.1 5.1 0 0 0-9.85 1.1A3.15 3.15 0 0 0 7.1 17.4Z"
    />
  )
}

export function WeatherIcon({ code, isDay = true, size = 28, className }: Props): ReactElement {
  const kind = weatherKind(code)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {kind === 'clear' && (isDay ? <Sun r={4.2} /> : <Moon />)}

      {kind === 'partly' && (
        <>
          <Sun cx={16.4} cy={7.4} r={2.9} rays={6} />
          <path d="M6.4 18.2h8.7a3.3 3.3 0 0 0 .5-6.55 4.7 4.7 0 0 0-9.05 1A2.9 2.9 0 0 0 6.4 18.2Z" />
        </>
      )}

      {kind === 'cloudy' && (
        <>
          <path
            d="M5.6 15.2h8.6a3.2 3.2 0 0 0 .4-6.35 4.6 4.6 0 0 0-8.9 1A2.8 2.8 0 0 0 5.6 15.2Z"
            opacity="0.55"
          />
          <path d="M7.6 18.9h9.6a3.6 3.6 0 0 0 .5-7.1 5 5 0 0 0-9.7 1.05A3.1 3.1 0 0 0 7.6 18.9Z" />
        </>
      )}

      {kind === 'fog' && (
        <>
          <Cloud y={-1.4} />
          <path d="M4.4 19.2h10.2M17.4 19.2h2.2M7.2 21.6h5.4" opacity="0.7" />
        </>
      )}

      {kind === 'drizzle' && (
        <>
          <Cloud y={-1.6} />
          <path d="M8.4 18.4l-.7 1.9M12 18.4l-.7 1.9M15.6 18.4l-.7 1.9" opacity="0.8" />
        </>
      )}

      {kind === 'rain' && (
        <>
          <Cloud y={-1.8} />
          <path d="M7.9 18.2l-1 2.4M12 18.2l-1 2.4M16.1 18.2l-1 2.4" />
        </>
      )}

      {kind === 'snow' && (
        <>
          <Cloud y={-1.6} />
          <path d="M8.2 18.6v2.6M7.1 19.9h2.2M15.4 18.6v2.6M14.3 19.9h2.2" opacity="0.9" />
          <circle cx="11.9" cy="20.1" r="0.7" fill="currentColor" stroke="none" />
        </>
      )}

      {kind === 'thunder' && (
        <>
          <Cloud y={-1.4} />
          <path d="M13.2 17.4l-2.6 3.3h2.7l-1.5 2.5" />
        </>
      )}
    </svg>
  )
}
