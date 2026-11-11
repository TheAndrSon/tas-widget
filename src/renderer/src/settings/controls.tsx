import { useEffect, useState, type JSX, type ReactNode } from 'react'

export function Section({
  title,
  hint,
  children
}: {
  title: string
  hint?: string
  children: ReactNode
}): JSX.Element {
  return (
    <section className="section">
      <div className="section__title">
        {title}
        {hint && <span className="section__hint">{hint}</span>}
      </div>
      <div className="section__card">{children}</div>
    </section>
  )
}

export function Row({
  label,
  hint,
  children,
  stacked
}: {
  label: string
  hint?: string
  children: ReactNode
  stacked?: boolean
}): JSX.Element {
  return (
    <div className={`row${stacked ? ' row--stacked' : ''}`}>
      <div className="row__text">
        <div className="row__label">{label}</div>
        {hint && <div className="row__hint">{hint}</div>}
      </div>
      <div className="row__control">{children}</div>
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  disabled
}: {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`switch${checked ? ' is-on' : ''}`}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span className="switch__knob" />
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}): JSX.Element {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={option.value === value ? 'is-active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  format
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  format?: (value: number) => string
}): JSX.Element {
  return (
    <div className="slider">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="slider__value">{format ? format(value) : value}</span>
    </div>
  )
}

export function NumberSlider({
  value,
  min,
  max,
  step,
  onChange,
  unit
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  unit?: string
}): JSX.Element {
  const [text, setText] = useState(() => String(value))
  useEffect(() => {
    setText(String(value))
  }, [value])

  const commit = (): void => {
    const parsed = Number(text.replace(',', '.'))
    if (!Number.isFinite(parsed)) {
      setText(String(value))
      return
    }
    const clamped = Math.min(max, Math.max(min, parsed))
    const stepped = Number((Math.round(clamped / step) * step).toFixed(4))
    setText(String(stepped))
    onChange(stepped)
  }

  return (
    <div className="slider slider--number">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <input
        className="text-input slider__number"
        type="number"
        min={min}
        max={max}
        step={step}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
        }}
      />
      {unit && <span className="slider__unit">{unit}</span>}
    </div>
  )
}

export function Chip({
  children,
  tone = 'neutral'
}: {
  children: ReactNode
  tone?: 'neutral' | 'on' | 'off' | 'warn'
}): JSX.Element {
  return <span className={`chip chip--${tone}`}>{children}</span>
}
