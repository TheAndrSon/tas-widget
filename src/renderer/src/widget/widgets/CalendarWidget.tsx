import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type JSX } from 'react'
import type { CalendarSettings, CustomDate } from '@shared/types'
import {
  MONTH_NAMES,
  WEEKDAYS_SHORT,
  addDays,
  addMonths,
  getHoliday,
  isSameDay,
  isoWeek,
  monthMatrix,
  startOfWeek,
  toISO,
  weekdayIndex
} from '@shared/holidays'
import { useNow } from '../../hooks'
import { formatDayMonth, formatMonthTitle } from '../../format'
import { IconChevronLeft, IconChevronRight, IconHeart } from '../../ui/icons'

interface HoverInfo {
  date: Date
  holiday?: string
  custom: CustomDate[]
}

function buildInfo(date: Date, custom: CustomDate[], showHolidays: boolean): HoverInfo {
  const holiday = showHolidays ? getHoliday(date) : null
  return {
    date,
    holiday: holiday?.isHoliday ? holiday.name : undefined,
    custom
  }
}

function infoText(info: HoverInfo): string {
  const customLabels = info.custom.map((item) => item.label || 'Своя дата')
  return [formatDayMonth(info.date), info.holiday, ...customLabels].filter(Boolean).join(' · ')
}

interface DayProps {
  date: Date
  inMonth: boolean
  today: Date
  showHolidays: boolean
  holidayColor: string
  custom: CustomDate[]
  onHover: (info: HoverInfo) => void
}

function DayCell({ date, inMonth, today, showHolidays, holidayColor, custom, onHover }: DayProps): JSX.Element {
  const holiday = showHolidays ? getHoliday(date) : { isHoliday: false }
  const weekend = weekdayIndex(date) >= 5
  const isToday = isSameDay(date, today)
  const tooltip = [
    holiday.isHoliday ? holiday.name : null,
    ...custom.map((item) => item.label || 'Своя дата')
  ]
    .filter(Boolean)
    .join(' · ')

  const classes = [
    'cal-day',
    inMonth ? '' : 'is-out',
    weekend ? 'is-weekend' : '',
    holiday.isHoliday ? 'is-holiday' : '',
    isToday ? 'is-today' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      data-date={toISO(date)}
      title={tooltip || undefined}
      style={holiday.isHoliday ? { color: holidayColor } : undefined}
      onMouseEnter={() => onHover(buildInfo(date, custom, showHolidays))}
    >
      <span className="cal-day__num">{date.getDate()}</span>
      <span className="cal-day__marks">
        {showHolidays && holiday.isHoliday && <i className="cal-dot cal-dot--holiday" />}
        {custom.slice(0, 3).map((item) =>
          item.heart ? (
            <span key={item.id} className="cal-day__heart" style={{ color: item.color }}>
              <IconHeart size={7} />
            </span>
          ) : (
            <i key={item.id} className="cal-dot" style={{ background: item.color }} />
          )
        )}
      </span>
    </div>
  )
}

function MonthGrid({
  month,
  today,
  settings,
  customByDay,
  compact,
  onHover
}: {
  month: Date
  today: Date
  settings: CalendarSettings
  customByDay: Map<string, CustomDate[]>
  compact: boolean
  onHover: (info: HoverInfo) => void
}): JSX.Element {
  const weeks = useMemo(
    () => monthMatrix(month.getFullYear(), month.getMonth()),
    [month.getFullYear(), month.getMonth()]
  )
  const columns = settings.showWeekNumbers ? 8 : 7

  return (
    <div
      className={`cal-month${compact ? ' is-compact' : ''}`}
      style={{ '--holiday-color': settings.holidayColor } as CSSProperties}
    >
      {compact && <div className="cal-month__title">{formatMonthTitle(month)}</div>}
      <div className="cal-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {settings.showWeekNumbers && <div className="cal-grid__head" />}
        {WEEKDAYS_SHORT.map((label) => (
          <div className="cal-grid__head" key={label}>
            {label}
          </div>
        ))}
        {weeks.map((week) => (
          <Fragment key={toISO(week[0].date)}>
            {settings.showWeekNumbers && (
              <div className="cal-grid__weeknum">{isoWeek(week[0].date)}</div>
            )}
            {week.map((cell) => (
              <DayCell
                key={toISO(cell.date)}
                date={cell.date}
                inMonth={cell.inMonth}
                today={today}
                showHolidays={settings.showHolidays}
                holidayColor={settings.holidayColor}
                custom={customByDay.get(toISO(cell.date)) ?? []}
                onHover={onHover}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function WeekStrip({
  start,
  today,
  settings,
  customByDay,
  onHover
}: {
  start: Date
  today: Date
  settings: CalendarSettings
  customByDay: Map<string, CustomDate[]>
  onHover: (info: HoverInfo) => void
}): JSX.Element {
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index))

  return (
    <div
      className="cal-week"
      style={{ '--holiday-color': settings.holidayColor } as CSSProperties}
    >
      {days.map((date, index) => {
        const holiday = settings.showHolidays ? getHoliday(date) : { isHoliday: false }
        const custom = customByDay.get(toISO(date)) ?? []
        const isToday = isSameDay(date, today)
        const classes = [
          'cal-week__day',
          isToday ? 'is-today' : '',
          holiday.isHoliday ? 'is-holiday' : ''
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <div
            className={classes}
            key={toISO(date)}
            data-date={toISO(date)}
            title={[holiday.isHoliday ? holiday.name : null, ...custom.map((c) => c.label)]
              .filter(Boolean)
              .join(' · ')}
            onMouseEnter={() => onHover(buildInfo(date, custom, settings.showHolidays))}
          >
            <span className="cal-week__dow">{WEEKDAYS_SHORT[index]}</span>
            <span className="cal-week__num">{date.getDate()}</span>
            <span className="cal-week__marks">
              {settings.showHolidays && holiday.isHoliday && <i className="cal-dot cal-dot--holiday" />}
              {custom.slice(0, 3).map((item) =>
                item.heart ? (
                  <span key={item.id} className="cal-day__heart" style={{ color: item.color }}>
                    <IconHeart size={7} />
                  </span>
                ) : (
                  <i key={item.id} className="cal-dot" style={{ background: item.color }} />
                )
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function CalendarWidget({
  settings,
  unlocked
}: {
  settings: CalendarSettings
  unlocked: boolean
}): JSX.Element {
  const now = useNow(60_000)
  const [offset, setOffset] = useState(0)
  const [hovered, setHovered] = useState<HoverInfo | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const hoveredIso = useRef<string | null>(null)
  const cursorHandler = useRef<(point: { x: number; y: number }) => void>(() => {})

  useEffect(() => {
    setOffset(0)
    setHovered(null)
    hoveredIso.current = null
  }, [settings.view])

  const customByDay = useMemo(() => {
    const map = new Map<string, CustomDate[]>()
    for (const item of settings.customDates) {
      const list = map.get(item.date) ?? []
      list.push(item)
      map.set(item.date, list)
    }
    return map
  }, [settings.customDates])

  cursorHandler.current = (point) => {
    const root = rootRef.current
    if (!root) return
    const x = point.x - window.screenX
    const y = point.y - window.screenY
    const rect = root.getBoundingClientRect()
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      if (hoveredIso.current !== null) {
        hoveredIso.current = null
        setHovered(null)
      }
      return
    }
    const element = document.elementFromPoint(x, y)?.closest('[data-date]') as HTMLElement | null
    const iso = element?.dataset.date ?? ''
    if (!iso) {
      if (hoveredIso.current !== null) {
        hoveredIso.current = null
        setHovered(null)
      }
      return
    }
    if (iso === hoveredIso.current) return
    hoveredIso.current = iso
    setHovered(
      buildInfo(new Date(`${iso}T12:00:00`), customByDay.get(iso) ?? [], settings.showHolidays)
    )
  }

  useEffect(() => {
    return window.widgets.onCursor((point) => cursorHandler.current(point))
  }, [])

  const onHover = (info: HoverInfo): void => {
    hoveredIso.current = toISO(info.date)
    setHovered(info)
  }

  const clearHover = (): void => {
    hoveredIso.current = null
    setHovered(null)
  }


  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthBase = addMonths(today, offset)
  const weekStart = addDays(startOfWeek(today), offset * 7)
  const months = [0, 1, 2].map((index) => addMonths(monthBase, index))

  const title =
    settings.view === 'week'
      ? `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()}`
      : settings.view === 'month'
        ? formatMonthTitle(monthBase)
        : `${formatMonthTitle(months[0])} — ${formatMonthTitle(months[2])}`

  const wrap =
    settings.view === '3months' ? `cal cal--months is-${settings.layout}` : `cal cal--${settings.view}`

  const todayHoliday = settings.showHolidays ? getHoliday(today) : null
  const info = hovered
    ? infoText(hovered)
    : todayHoliday?.isHoliday
      ? `Сегодня · ${todayHoliday.name}`
      : unlocked
        ? 'Наведите на день, чтобы увидеть праздник'
        : ''

  return (
    <div className={wrap} ref={rootRef} onMouseLeave={clearHover}>
      <div className="cal__head">
        <div className="cal__title">{title}</div>
        {unlocked && (
          <div className="cal__nav no-drag">
            {offset !== 0 && (
              <button className="cal__today" title="Вернуться к сегодня" onClick={() => setOffset(0)}>
                сегодня
              </button>
            )}
            <button title="Назад" onClick={() => setOffset((value) => value - 1)}>
              <IconChevronLeft size={14} />
            </button>
            <button title="Вперёд" onClick={() => setOffset((value) => value + 1)}>
              <IconChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {settings.view === 'week' && (
        <WeekStrip
          start={weekStart}
          today={today}
          settings={settings}
          customByDay={customByDay}
          onHover={onHover}
        />
      )}

      {settings.view === 'month' && (
        <MonthGrid
          month={monthBase}
          today={today}
          settings={settings}
          customByDay={customByDay}
          compact={false}
          onHover={onHover}
        />
      )}

      {settings.view === '3months' && (
        <div className={`cal-months is-${settings.layout}`}>
          {months.map((month) => (
            <MonthGrid
              key={`${month.getFullYear()}-${month.getMonth()}`}
              month={month}
              today={today}
              settings={settings}
              customByDay={customByDay}
              compact
              onHover={onHover}
            />
          ))}
        </div>
      )}

      <div className="cal-info" title={info || undefined}>
        {info || '\u00A0'}
      </div>
    </div>
  )
}
