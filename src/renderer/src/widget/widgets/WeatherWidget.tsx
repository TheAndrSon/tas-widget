import type { JSX } from 'react'
import { useEffect } from 'react'
import { useWeather } from '../../hooks'
import { useNow } from '../../hooks'
import { formatTemp, formatWind } from '../../format'
import { WeatherIcon } from '../../ui/WeatherIcon'
import { IconDroplet, IconSunrise, IconSunset, IconThermometer, IconWind } from '../../ui/icons'
import { weatherInfo } from '@shared/weatherCodes'
import { WEEKDAYS_SHORT } from '@shared/holidays'
import { cityMinutes, formatDaylight, skyPeriod, SKY_PERIOD_LABELS } from '@shared/sun'
import type { WeatherSettings, WeatherSnapshot } from '@shared/types'

function minutes(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return 0
  return Number(match[1]) * 60 + Number(match[2])
}

function SunPanel({
  settings,
  data
}: {
  settings: WeatherSettings
  data: WeatherSnapshot
}): JSX.Element | null {
  const now = useNow(60_000)
  if (settings.sunMode === 'off') return null
  const sun = data.sun
  if (!sun) return null

  if (sun.sunrise === '—' || sun.sunset === '—') {
    return <div className="sun sun--empty">Полярный день или полярная ночь</div>
  }

  const rise = minutes(sun.sunrise)
  const set = minutes(sun.sunset)
  const daylight = set - rise
  const nowMinutes = cityMinutes(now, data.utcOffsetSeconds)
  const period = skyPeriod(nowMinutes, rise, set)
  const isNight = nowMinutes < rise || nowMinutes >= set
  const progress = daylight > 0 ? Math.min(1, Math.max(0, (nowMinutes - rise) / daylight)) : 0
  const nightLength = ((rise + 1440 - set) % 1440) || 1
  const sinceSunset = (nowMinutes - set + 1440) % 1440
  const nightProgress = Math.min(1, Math.max(0, sinceSunset / nightLength))

  if (settings.sunMode === 'compact') {
    return (
      <div className="sun sun--compact">
        <span className={`sun__state${isNight ? ' is-night' : ''}`}>
          {SKY_PERIOD_LABELS[period]}
        </span>
        <span className="sun__item">
          <IconSunrise size={13} />
          {sun.sunrise}
        </span>
        <span className="sun__item">
          <IconSunset size={13} />
          {sun.sunset}
        </span>
        <span className="sun__daylight">{formatDaylight(daylight)}</span>
      </div>
    )
  }

  // Ночью луна идёт по той же дуге слева направо от заката до рассвета.
  const t = isNight ? nightProgress : progress
  const x = (1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 136 + t * t * 262
  const y = (1 - t) * (1 - t) * 56 + 2 * (1 - t) * t * -8 + t * t * 56
  const orbColor = 'var(--widget-accent)'

  return (
    <div className="sun sun--arc">
      <svg viewBox="0 0 272 74" className="sun__svg" aria-hidden="true">
        <path d="M10 56 Q136 -8 262 56" className="sun__track" />
        <path
          d="M10 56 Q136 -8 262 56"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - t * 100}
          className="sun__progress"
        />
        <g
          className={`sun__orb${isNight ? ' is-night' : ''}`}
          style={{ transform: `translate(${x}px, ${y}px)`, transition: 'transform 1.2s ease' }}
        >
          <circle cx="0" cy="0" r="9" className="sun__halo" />
          {isNight ? (
            <path
              d="M3 -6.5A7 7 0 1 0 3 6.5A5.4 5.4 0 0 1 3 -6.5Z"
              fill={orbColor}
              className="sun__moon"
            />
          ) : (
            <>
              <circle cx="0" cy="0" r="4.2" className="sun__dot" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <line
                  key={angle}
                  x1={Math.cos((angle * Math.PI) / 180) * 6.5}
                  y1={Math.sin((angle * Math.PI) / 180) * 6.5}
                  x2={Math.cos((angle * Math.PI) / 180) * 9}
                  y2={Math.sin((angle * Math.PI) / 180) * 9}
                  stroke={orbColor}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              ))}
            </>
          )}
          {isNight && (
            <>
              <circle cx="-9" cy="-9" r="0.8" fill={orbColor} opacity="0.7" />
              <circle cx="10" cy="-7" r="0.7" fill={orbColor} opacity="0.5" />
              <circle cx="8" cy="8" r="0.6" fill={orbColor} opacity="0.6" />
            </>
          )}
        </g>
        <text x="10" y="71" className="sun__label">
          ↑ {sun.sunrise}
        </text>
        <text x="136" y="71" textAnchor="middle" className="sun__label sun__label--day">
          {SKY_PERIOD_LABELS[period]}
        </text>
        <text x="262" y="71" textAnchor="end" className="sun__label">
          ↓ {sun.sunset}
        </text>
      </svg>
    </div>
  )
}


export function WeatherWidget({
  settings,
  instanceId
}: {
  settings: WeatherSettings
  instanceId: string
}): JSX.Element {
  const { data, error, loading } = useWeather(
    settings.city,
    settings.units,
    settings.provider,
    settings.yandexKey
  )
  useEffect(() => {
    if (settings.provider !== 'yandex') return
    if (settings.yandexKey && data) return
    const timer = window.setTimeout(() => {
      void window.widgets.updateWidgetSettings(instanceId, { provider: 'open-meteo' })
    }, 10 * 60 * 1000)
    return () => window.clearTimeout(timer)
  }, [settings.provider, settings.yandexKey, data, instanceId])

  if (!settings.city) {
    return (
      <div className="wx wx--empty">
        <div className="wx__empty-title">Город не выбран</div>
        <div className="wx__empty-hint">Откройте настройки виджета</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="wx wx--empty">
        <div className="wx__empty-title">{error ? 'Нет данных о погоде' : 'Загружаем погоду…'}</div>
        <div className="wx__empty-hint">{error ?? settings.city.name}</div>
      </div>
    )
  }

  const info = weatherInfo(data.current.code)
  const forecast = data.daily.slice(1, 1 + settings.forecastDays)

  return (
    <div className="wx">
      <div className="wx__top">
        <div className="wx__icon">
          <WeatherIcon code={data.current.code} isDay={data.current.isDay} size={34} />
        </div>
        <div className="wx__temp">
          {data.current.temp}
          <span className="wx__deg">°</span>
        </div>
        <div className="wx__place">
          {settings.showCity && <div className="wx__city">{data.city.name}</div>}
          <div className="wx__cond">{info.label}</div>
        </div>
      </div>

      <div className="wx__meta">
        {settings.showFeelsLike && (
          <span className="wx__meta-item" title="Ощущается как">
            <IconThermometer size={12} />
            {formatTemp(data.current.feelsLike, settings.units)}
          </span>
        )}
        {settings.showWind && (
          <span className="wx__meta-item" title="Ветер">
            <IconWind size={12} />
            {formatWind(data.current.wind, settings.units)}
          </span>
        )}
        {settings.showHumidity && (
          <span className="wx__meta-item" title="Влажность">
            <IconDroplet size={12} />
            {data.current.humidity}%
          </span>
        )}
        {!settings.showFeelsLike && !settings.showWind && !settings.showHumidity && (
          <span className="wx__meta-item wx__meta-item--muted">
            обновлено {new Date(data.fetchedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <SunPanel settings={settings} data={data} />

      {settings.forecastDays > 0 && (
        <div className="wx__forecast">
          {forecast.map((day) => {
            const date = new Date(`${day.date}T12:00:00`)
            const dayInfo = weatherInfo(day.code)
            return (
              <div className="wx__day" key={day.date} title={dayInfo.label}>
                <div className="wx__day-name">{WEEKDAYS_SHORT[(date.getDay() + 6) % 7]}</div>
                <WeatherIcon code={day.code} size={20} className="wx__day-icon" />
                <div className="wx__day-temp">
                  <span>{day.tMax}°</span>
                  <span className="wx__day-min">{day.tMin}°</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error && (
        <div className="wx__error" title={error}>
          данные могли устареть
        </div>
      )}
      {!error && <div className="wx__status-space" aria-hidden="true" />}
      {loading && !data && <div className="wx__loading" />}
    </div>
  )
}
