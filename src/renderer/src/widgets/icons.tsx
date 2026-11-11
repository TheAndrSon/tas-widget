import type { ReactElement, SVGProps } from 'react'

type IconProps = { size?: number; className?: string }

function svgProps(size: number, className?: string): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className
  }
}

export function IconPlay({ size = 16, className }: IconProps): ReactElement {
  return (
    <svg {...svgProps(size, className)} fill="currentColor" stroke="none">
      <path d="M8.2 5.6c0-.9 1-1.4 1.7-.9l8.3 5.5c.7.5.7 1.5 0 2l-8.3 5.5c-.7.5-1.7 0-1.7-.9V5.6Z" />
    </svg>
  )
}

export function IconPause({ size = 16, className }: IconProps): ReactElement {
  return (
    <svg {...svgProps(size, className)} fill="currentColor" stroke="none">
      <rect x="7" y="5.5" width="3.4" height="13" rx="1.2" />
      <rect x="13.6" y="5.5" width="3.4" height="13" rx="1.2" />
    </svg>
  )
}

export function IconPrev({ size = 16, className }: IconProps): ReactElement {
  return (
    <svg {...svgProps(size, className)} fill="currentColor" stroke="none">
      <rect x="5" y="5.5" width="2.5" height="13" rx="1" />
      <path d="M18.5 6.3c0-.9-1-1.4-1.7-.9l-7.3 5c-.6.4-.6 1.3 0 1.7l7.3 5c.7.5 1.7 0 1.7-1V6.3Z" />
    </svg>
  )
}

export function IconNext({ size = 16, className }: IconProps): ReactElement {
  return (
    <svg {...svgProps(size, className)} fill="currentColor" stroke="none">
      <rect x="16.5" y="5.5" width="2.5" height="13" rx="1" />
      <path d="M5.5 6.3c0-.9 1-1.4 1.7-.9l7.3 5c.6.4.6 1.3 0 1.7l-7.3 5c-.7.5-1.7 0-1.7-1V6.3Z" />
    </svg>
  )
}

export function IconNote({ size = 16, className }: IconProps): ReactElement {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M9 18V5.5l10-2v12" />
      <circle cx="6.5" cy="18" r="2.6" />
      <circle cx="16.5" cy="15.5" r="2.6" />
    </svg>
  )
}

export function IconThermometer({ size = 12, className }: IconProps): ReactElement {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M10 13.8V5.4a2 2 0 1 1 4 0v8.4a4 4 0 1 1-4 0Z" />
      <path d="M12 10v6" />
    </svg>
  )
}

export function IconDroplet({ size = 12, className }: IconProps): ReactElement {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M12 3.8s5.4 5.3 5.4 9.1a5.4 5.4 0 1 1-10.8 0C6.6 9.1 12 3.8 12 3.8Z" />
    </svg>
  )
}

export function IconWind({ size = 12, className }: IconProps): ReactElement {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3 8.5h9.5a2.7 2.7 0 1 0-2.7-2.7M3 12.5h13.5a2.7 2.7 0 1 1-2.7 2.7M3 16.5h6.5" />
    </svg>
  )
}

export function IconSunrise({ size = 14, className }: IconProps): ReactElement {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="14" r="3.4" />
      <path d="M12 3.5v3M4.8 6.2l2 2M19.2 6.2l-2 2M2.5 18.5h19M5 22h14" />
      <path d="M8.5 18.5a3.5 3.5 0 0 1 7 0" />
    </svg>
  )
}

export function IconSunset({ size = 14, className }: IconProps): ReactElement {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="14" r="3.4" />
      <path d="M12 3.5v3M4.8 6.2l2 2M19.2 6.2l-2 2M2.5 18.5h19M5 22h14" />
      <path d="M8.5 14a3.5 3.5 0 0 1 7 0" />
    </svg>
  )
}
