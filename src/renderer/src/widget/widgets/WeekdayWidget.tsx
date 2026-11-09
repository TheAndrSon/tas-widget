import type { JSX } from 'react'
import type { WeekdaySettings } from '@shared/types'
import { useNow } from '../../hooks'
import { formatWeekdayDate, weekdayName } from '../../format'
import { isoWeek } from '@shared/holidays'

function dateSamples(now: Date): Date[] {
  return Array.from({ length: 12 }, (_, month) => new Date(now.getFullYear(), month, 28, 12))
}

export function WeekdayWidget({ settings }: { settings: WeekdaySettings }): JSX.Element {
  const now = useNow(60_000)
  const main = weekdayName(now, settings.language, settings.weekdayFormat === 'short')
  const short = weekdayName(now, settings.language, true)
  const date = formatWeekdayDate(now, settings.language, settings.dateFormat)
  const week = isoWeek(now)

  return (
    <div className="weekday-v2">
      {settings.showWeekday && (
        <div className={`weekday-v2__name${settings.uppercase ? ' is-uppercase' : ''}`}>
          {main}
        </div>
      )}

      {settings.showSecondary && (
        <div className="weekday-v2__secondary">
          <span className="weekday-v2__short">{short}</span>
          {settings.showDate && (
            <>
              <span className="weekday-v2__dot">,</span>
              <span className="weekday-v2__date"> {date}</span>
            </>
          )}
        </div>
      )}

      {settings.showWeekNumber && <div className="weekday-v2__week">{week} неделя</div>}

      <div className="weekday-v2__measure" aria-hidden="true">
        {(['ru', 'en'] as const).map((language) =>
          [0, 1, 2, 3, 4, 5, 6].map((day) => {
            const sample = new Date(2024, 0, 1 + day, 12)
            return (
              <span key={`${language}-${day}`}>{weekdayName(sample, language, false)}</span>
            )
          })
        )}
        {dateSamples(now).map((sample) => (
          <span key={sample.getMonth()}>
            {weekdayName(sample, settings.language, true)},{' '}
            {formatWeekdayDate(sample, settings.language, settings.dateFormat)}
          </span>
        ))}
      </div>
    </div>
  )
}
