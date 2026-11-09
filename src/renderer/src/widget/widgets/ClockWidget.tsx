import type { JSX } from 'react'
import type { ClockSettings } from '@shared/types'
import { useNow } from '../../hooks'
import { clockInZone } from '../../format'

function Separator({
  kind,
  small
}: {
  kind: ClockSettings['separator']
  small?: boolean
}): JSX.Element | null {
  const extra = small ? ' clock-v2__sep--small' : ''
  if (kind === 'none') return <span className="clock-v2__gap" />
  if (kind === 'colon')
    return (
      <span className={`clock-v2__sep clock-v2__sep--colon${extra}`} aria-hidden="true">
        <i />
        <i />
      </span>
    )
  if (kind === 'bar')
    return <span className={`clock-v2__sep clock-v2__sep--bar${extra}`} aria-hidden="true" />
  return (
    <span className={`clock-v2__sep clock-v2__sep--dots${extra}`} aria-hidden="true">
      <i />
      <i />
    </span>
  )
}

export function ClockWidget({ settings }: { settings: ClockSettings }): JSX.Element {
  const now = useNow(1000)
  const time = clockInZone(now, null, settings.format24, settings.showSeconds)
  const cityTime = clockInZone(
    now,
    settings.city?.timezone ?? null,
    settings.format24,
    settings.showSeconds
  )

  return (
    <div className="clock-v2">
      <div className="clock-v2__time">
        <span className="clock-v2__hh">{time.hh}</span>
        <Separator kind={settings.separator} />
        <span className="clock-v2__mm">{time.mm}</span>
        {settings.showSeconds && (
          <>
            <Separator kind={settings.separator} small />
            <span className="clock-v2__ss">{time.ss}</span>
          </>
        )}
        {time.suffix && <span className="clock-v2__suffix">{time.suffix}</span>}
      </div>

      {settings.showCityTime && (
        <div className="clock-v2__city">
          <span className="clock-v2__city-name">
            {settings.city?.name ?? 'Город не выбран'}
          </span>
          {settings.city?.timezone && (
            <span className="clock-v2__city-time">
              <span>{cityTime.hh}</span>
              <Separator kind={settings.separator} />
              <span>{cityTime.mm}</span>
              {settings.showSeconds && (
                <>
                  <Separator kind={settings.separator} />
                  <span>{cityTime.ss}</span>
                </>
              )}
              {cityTime.suffix ? ` ${cityTime.suffix}` : ''}
            </span>
          )}
        </div>
      )}

      <div className="clock-v2__measure" aria-hidden="true">
        <span className="clock-v2__measure-main">{settings.format24 ? '88:88:88' : '88:88:88 AM'}</span>
        {settings.showCityTime && (
          <span className="clock-v2__measure-city">
            {settings.city?.name ?? 'Город не выбран'} 88:88:88 AM
          </span>
        )}
      </div>
    </div>
  )
}

