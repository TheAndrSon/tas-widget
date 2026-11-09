import type { JSX, SVGProps } from 'react'

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

export function IconGear({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.5-1.2-1.7-3-1.8.7a7.6 7.6 0 0 0-2.6-1.5L14.5 3h-3.4l-.4 2.5a7.6 7.6 0 0 0-2.6 1.5l-1.8-.7-1.7 3 1.5 1.2a7.6 7.6 0 0 0 0 3l-1.5 1.2 1.7 3 1.8-.7a7.6 7.6 0 0 0 2.6 1.5l.4 2.5h3.4l.4-2.5a7.6 7.6 0 0 0 2.6-1.5l1.8.7 1.7-3-1.5-1.2Z" />
    </svg>
  )
}

export function IconLock({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.6" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  )
}

export function IconUnlock({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.6" />
      <path d="M8 10.5V8a4 4 0 0 1 7.5-1.8" />
    </svg>
  )
}

export function IconMove({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" />
    </svg>
  )
}

export function IconEyeOff({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.3A9.8 9.8 0 0 1 12 6.2c4.4 0 7.6 3.1 9 5.8-.5 1-1.4 2.2-2.6 3.2" />
      <path d="M6.2 7.6C4.5 8.9 3.4 10.5 3 11.9c1.4 2.7 4.6 5.9 9 5.9 1.5 0 2.8-.3 4-.9" />
      <path d="M9.9 10.2a3 3 0 0 0 4.1 4.2" />
    </svg>
  )
}

export function IconClose({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function IconChevronLeft({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  )
}

export function IconChevronRight({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </svg>
  )
}

export function IconChevronDown({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M5.5 9.5 12 16l6.5-6.5" />
    </svg>
  )
}

export function IconChevronUp({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M5.5 14.5 12 8l6.5 6.5" />
    </svg>
  )
}

export function IconPlay({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)} fill="currentColor" stroke="none">
      <path d="M8.2 5.6c0-.9 1-1.4 1.7-.9l8.3 5.5c.7.5.7 1.5 0 2l-8.3 5.5c-.7.5-1.7 0-1.7-.9V5.6Z" />
    </svg>
  )
}

export function IconPause({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)} fill="currentColor" stroke="none">
      <rect x="7" y="5.5" width="3.4" height="13" rx="1.2" />
      <rect x="13.6" y="5.5" width="3.4" height="13" rx="1.2" />
    </svg>
  )
}

export function IconPrev({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)} fill="currentColor" stroke="none">
      <rect x="5" y="5.5" width="2.5" height="13" rx="1" />
      <path d="M18.5 6.3c0-.9-1-1.4-1.7-.9l-7.3 5c-.6.4-.6 1.3 0 1.7l7.3 5c.7.5 1.7 0 1.7-1V6.3Z" />
    </svg>
  )
}

export function IconNext({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)} fill="currentColor" stroke="none">
      <rect x="16.5" y="5.5" width="2.5" height="13" rx="1" />
      <path d="M5.5 6.3c0-.9 1-1.4 1.7-.9l7.3 5c.6.4.6 1.3 0 1.7l-7.3 5c-.7.5-1.7 0-1.7-1V6.3Z" />
    </svg>
  )
}

export function IconNote({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M9 18V5.5l10-2v12" />
      <circle cx="6.5" cy="18" r="2.6" />
      <circle cx="16.5" cy="15.5" r="2.6" />
    </svg>
  )
}

export function IconClock({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.4V12l3.2 2" />
    </svg>
  )
}

export function IconWeekday({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="3.6" y="5" width="16.8" height="15" rx="3" />
      <path d="M3.6 9.4h16.8M8.2 3.2v3.4M15.8 3.2v3.4" />
      <path d="M7.6 13.4h2.2M11.3 13.4h2.2M15 13.4h1.6M7.6 16.6h2.2M11.3 16.6h2.2" />
    </svg>
  )
}

export function IconCalendar({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="3.2" y="4.8" width="17.6" height="15.4" rx="3" />
      <path d="M3.2 9.3h17.6M8 2.8v3.6M16 2.8v3.6" />
      <path d="M7.4 12.6h.01M12 12.6h.01M16.6 12.6h.01M7.4 16.4h.01M12 16.4h.01M16.6 16.4h.01" strokeWidth="2.1" />
    </svg>
  )
}

export function IconCloudSun({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 2.6v1.3M8 12.1v1.3M2.6 8h1.3M12.1 8h1.3M4.2 4.2l.9.9M10.9 10.9l.9.9M11.8 4.2l-.9.9" />
      <path d="M9.5 19.4h7.2a3.1 3.1 0 0 0 .4-6.2 4.4 4.4 0 0 0-8.4 1 2.7 2.7 0 0 0 .8 5.2Z" />
    </svg>
  )
}

export function IconSliders({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1" />
      <circle cx="15" cy="7" r="1.9" />
      <circle cx="9" cy="12" r="1.9" />
      <circle cx="17" cy="17" r="1.9" />
    </svg>
  )
}

export function IconEye({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3 12c1.4-2.7 4.6-5.8 9-5.8s7.6 3.1 9 5.8c-1.4 2.7-4.6 5.8-9 5.8S4.4 14.7 3 12Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  )
}

export function IconHeart({ size = 12, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)} fill="currentColor" stroke="none">
      <path d="M12 20s-7.2-4.4-7.2-9.2A4.1 4.1 0 0 1 12 8.1a4.1 4.1 0 0 1 7.2 2.7C19.2 15.6 12 20 12 20Z" />
    </svg>
  )
}

export function IconPlus({ size = 14, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconTrash({ size = 14, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.8 12.2h9.4L17.5 7" />
      <path d="M10.4 10.6v5M13.6 10.6v5" />
    </svg>
  )
}

export function IconThermometer({ size = 12, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M10 13.8V5.4a2 2 0 1 1 4 0v8.4a4 4 0 1 1-4 0Z" />
      <path d="M12 10v6" />
    </svg>
  )
}

export function IconDroplet({ size = 12, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M12 3.8s5.4 5.3 5.4 9.1a5.4 5.4 0 1 1-10.8 0C6.6 9.1 12 3.8 12 3.8Z" />
    </svg>
  )
}

export function IconWind({ size = 12, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3 8.5h9.5a2.7 2.7 0 1 0-2.7-2.7M3 12.5h13.5a2.7 2.7 0 1 1-2.7 2.7M3 16.5h6.5" />
    </svg>
  )
}

export function IconSunrise({ size = 14, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="14" r="3.4" />
      <path d="M12 3.5v3M4.8 6.2l2 2M19.2 6.2l-2 2M2.5 18.5h19M5 22h14" />
      <path d="M8.5 18.5a3.5 3.5 0 0 1 7 0" />
    </svg>
  )
}

export function IconSunset({ size = 14, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <circle cx="12" cy="14" r="3.4" />
      <path d="M12 3.5v3M4.8 6.2l2 2M19.2 6.2l-2 2M2.5 18.5h19M5 22h14" />
      <path d="M8.5 14a3.5 3.5 0 0 1 7 0" />
    </svg>
  )
}

export function IconStar({ size = 14, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M12 3.5l2.4 5.3 5.8.7-4.3 3.9 1.2 5.7L12 16.3 6.9 19.1l1.2-5.7-4.3-3.9 5.8-.7L12 3.5Z" />
    </svg>
  )
}

export function IconMoon({ size = 14, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M20.2 14.4A8.4 8.4 0 0 1 9.6 3.8a8.6 8.6 0 1 0 10.6 10.6Z" />
    </svg>
  )
}

export function IconCard({ size = 14, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="6" y="3.5" width="12" height="17" rx="2" />
      <path d="M9 7.5h6M9 11h6M9 14.5h4" />
      <path d="M8.5 19.5 9 21l1.5-.7L12 21l1.5-.7 1.5.7.5-1.5" />
    </svg>
  )
}

export function IconDie({ size = 14, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="4" y="4" width="16" height="16" rx="3.2" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconEqualizer({ size = 14, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M4 19V9M9 19V5M14 19v-7M19 19V7" />
    </svg>
  )
}

export function IconTodo({ size = 14, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="5" y="4" width="14" height="17" rx="2.4" />
      <path d="M8.5 9.5 10 11l2.5-2.5M8.5 15.5 10 17l2.5-2.5M14.5 9.5H17M14.5 15.5H17" />
    </svg>
  )
}

export function IconSims({ size = 14, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M12 3.2 18.6 9 12 20.8 5.4 9Z" />
      <path d="M5.4 9h13.2M12 3.2v17.6M8.7 9l3.3 11.8L15.3 9" opacity="0.55" />
    </svg>
  )
}

export function IconFinance({ size = 14, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M4 19V11M8.5 19V6M13 19v-5M17.5 19V8M21 19H3" />
      <path d="m4 8 5-4 4 5 4-3 4 4" />
    </svg>
  )
}

export function IconTwitch({ size = 14, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M5 3.5h14v10l-4 4h-3l-3 3v-3H5Z" />
      <path d="M10 7.5v4M15 7.5v4" />
    </svg>
  )
}

export function IconSystem({ size = 14, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <rect x="3.5" y="5" width="17" height="11" rx="2" />
      <path d="M8 20h8M12 16v4" />
      <path d="M7 12h2l1.5-4 2 7 1.5-4h3" />
    </svg>
  )
}
