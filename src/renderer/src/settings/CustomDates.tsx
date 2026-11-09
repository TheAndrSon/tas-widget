import { useState, type JSX } from 'react'
import type { CustomDate } from '@shared/types'
import { CUSTOM_DATE_COLORS } from '@shared/defaults'
import { toISO } from '@shared/holidays'
import { formatDateFull } from '../format'
import { IconHeart, IconPlus, IconTrash } from '../ui/icons'

export function CustomDates({
  dates,
  onChange
}: {
  dates: CustomDate[]
  onChange: (next: CustomDate[]) => void
}): JSX.Element {
  const [date, setDate] = useState(() => toISO(new Date()))
  const [label, setLabel] = useState('')
  const [color, setColor] = useState(CUSTOM_DATE_COLORS[4])
  const [heart, setHeart] = useState(false)

  const add = (): void => {
    if (!date) return
    const item: CustomDate = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date,
      label: label.trim(),
      color,
      heart
    }
    onChange([...dates, item])
    setLabel('')
    setHeart(false)
  }

  const sorted = [...dates].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="custom-dates">
      <div className="custom-dates__form">
        <div className="custom-dates__line">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <input
            type="text"
            className="custom-dates__label"
            placeholder="Подпись (необязательно)"
            value={label}
            maxLength={40}
            onChange={(event) => setLabel(event.target.value)}
          />
        </div>
        <div className="custom-dates__line">
          <div className="swatches">
            {CUSTOM_DATE_COLORS.map((value) => (
              <button
                type="button"
                key={value}
                className={`swatch${value === color ? ' is-active' : ''}`}
                style={{ background: value }}
                title={value}
                onClick={() => setColor(value)}
              />
            ))}
          </div>
          <button
            type="button"
            className={`heart-toggle${heart ? ' is-on' : ''}`}
            title="Отметить сердечком"
            onClick={() => setHeart((value) => !value)}
          >
            <IconHeart size={12} />
          </button>
          <button type="button" className="btn btn--primary" onClick={add}>
            <IconPlus size={13} />
            Добавить
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="custom-dates__empty">Своих дат пока нет</div>
      ) : (
        <div className="custom-dates__list">
          {sorted.map((item) => {
            const parsed = new Date(`${item.date}T12:00:00`)
            return (
              <div className="custom-dates__item" key={item.id}>
                <span className="custom-dates__mark" style={{ color: item.color }}>
                  {item.heart ? <IconHeart size={11} /> : <span className="custom-dates__dot" style={{ background: item.color }} />}
                </span>
                <div className="custom-dates__text">
                  <div className="custom-dates__date">{formatDateFull(parsed)}</div>
                  {item.label && <div className="custom-dates__caption">{item.label}</div>}
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  title="Удалить"
                  onClick={() => onChange(dates.filter((entry) => entry.id !== item.id))}
                >
                  <IconTrash size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
