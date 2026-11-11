import { net } from 'electron'
import { toISO } from '../shared/date'
import { sunTimes, moonTimes, zoneOffsetSeconds } from '../shared/sun'
import type {
  City,
  WeatherProvider,
  WeatherResult,
  WeatherSnapshot,
  WeatherSun,
  WeatherUnits
} from '../shared/types'

const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const SEVEN_TIMER_URL = 'https://www.7timer.info/bin/api.pl'
const METNO_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact'
const WTTR_URL = 'https://wttr.in'
const CACHE_TTL = 10 * 60 * 1000

interface CacheEntry {
  at: number
  data: WeatherSnapshot
}

async function fetchJson(url: string, timeoutMs = 12000): Promise<Record<string, unknown>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await net.fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TASWidget/0.4 (desktop widget)',
        Accept: 'application/json'
      }
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return (await response.json()) as Record<string, unknown>
  } finally {
    clearTimeout(timer)
  }
}

function errorText(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError') return 'сервер не ответил вовремя'
    if (error instanceof TypeError) return 'нет связи'
    return error.message
  }
  return String(error)
}

function clockTime(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = value.match(/T(\d{2}):(\d{2})/)
  if (match) return `${match[1]}:${match[2]}`
  const short = value.match(/^(\d{1,2}):(\d{2})/)
  if (short) return `${short[1].padStart(2, '0')}:${short[2]}`
  return null
}

function fallbackSun(city: City): WeatherSun | null {
  const times = sunTimes(new Date(), city.lat, city.lon)
  if (!times) return null
  const moon = moonTimes(new Date(), city.lat, city.lon)
  const systemOffset = -new Date().getTimezoneOffset() * 60
  const cityOffset = zoneOffsetSeconds(city.timezone)
  const shift = (cityOffset - systemOffset) / 60
  const adjust = (minutes: number): string => {
    const value = ((Math.round(minutes + shift) % 1440) + 1440) % 1440
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
  }
  return {
    sunrise: adjust(times.sunriseMinutes),
    sunset: adjust(times.sunsetMinutes),
    moonrise: moon?.moonrise,
    moonset: moon?.moonset
  }
}

function cityOffsetSeconds(city: City): number {
  return zoneOffsetSeconds(city.timezone)
}

function withMoon(sun: WeatherSun | null, city: City): WeatherSun | null {
  if (!sun) return null
  const moon = moonTimes(new Date(), city.lat, city.lon)
  return { ...sun, moonrise: moon?.moonrise, moonset: moon?.moonset }
}

function toDisplayTemp(celsius: number, units: WeatherUnits): number {
  return units === 'imperial' ? Math.round((celsius * 9) / 5 + 32) : Math.round(celsius)
}

function toDisplayWind(metersPerSecond: number, units: WeatherUnits): number {
  return units === 'imperial' ? Math.round(metersPerSecond * 2.23694) : Math.round(metersPerSecond)
}

/** Простое приближение «ощущается как» для провайдеров без этого поля. */
function feelsLike(celsius: number, windMs: number): number {
  if (celsius <= 10 && windMs > 1.3) {
    const v = Math.pow(windMs, 0.16)
    return Math.round(13.12 + 0.6215 * celsius - 11.37 * v + 0.3965 * celsius * v)
  }
  return Math.round(celsius)
}

function sevenTimerCode(weather: string): { code: number; isDay: boolean } {
  const isDay = !weather.endsWith('night')
  const base = weather.replace(/day$|night$/, '')
  const map: Record<string, number> = {
    clear: 0,
    pcloudy: 2,
    mcloudy: 3,
    cloudy: 3,
    humid: 45,
    lightrain: 61,
    oshower: 80,
    rain: 63,
    snow: 73,
    rainandsnow: 66,
    fog: 45,
    ts: 95,
    tsrain: 99
  }
  return { code: map[base] ?? 3, isDay }
}

/** WWO (wttr.in) → WMO. */
function wttrCode(code: number): number {
  if (code === 113) return 0
  if ([116, 119, 122].includes(code)) return 3
  if ([143, 248, 260].includes(code)) return 45
  if ([176, 263, 266, 281, 284, 293, 296, 353].includes(code)) return 61
  if ([299, 302, 305, 308, 356, 359].includes(code)) return 63
  if ([179, 182, 185, 311, 314, 317, 320, 362, 365, 374, 377].includes(code)) return 66
  if ([227, 230, 323, 326, 329, 332, 335, 338, 368, 371].includes(code)) return 73
  if ([350, 392, 395].includes(code)) return 77
  if ([200, 386, 389].includes(code)) return 95
  if (code === 0) return 0
  return 3
}

/** MET Norway symbol_code → WMO. */
function metnoCode(symbol: string): number {
  const value = symbol.toLowerCase()
  if (value.includes('thunder')) return 95
  if (value.includes('sleet')) return 66
  if (value.includes('snow')) return 73
  if (value.includes('heavyrain')) return 65
  if (value.includes('lightrain')) return 61
  if (value.includes('rain')) return 63
  if (value.includes('drizzle')) return 53
  if (value.includes('fog')) return 45
  if (value.includes('partlycloudy')) return 2
  if (value.includes('cloudy')) return 3
  if (value.includes('fair')) return 1
  if (value.includes('clear')) return 0
  return 3
}

function isNightSymbol(symbol: string): boolean {
  return symbol.toLowerCase().includes('_night')
}

function yandexCode(condition: string): number {
  const value = condition.toLowerCase()
  if (value.includes('thunder')) return 95
  if (value.includes('hail')) return 96
  if (value.includes('heavy-rain') || value.includes('showers')) return 65
  if (value.includes('rain')) return 63
  if (value.includes('drizzle')) return 53
  if (value.includes('wet-snow') || value.includes('sleet')) return 66
  if (value.includes('snow')) return 73
  if (value.includes('fog') || value.includes('mist')) return 45
  if (value.includes('partly')) return 2
  if (value.includes('cloudy') || value.includes('overcast')) return 3
  if (value.includes('clear')) return 0
  return 3
}

export class WeatherService {
  private cache = new Map<string, CacheEntry>()

  async search(query: string): Promise<City[]> {
    const text = query.trim()
    if (text.length < 2) return []
    const url = `${GEO_URL}?name=${encodeURIComponent(text)}&count=8&language=ru&format=json`
    try {
      const json = await fetchJson(url, 9000)
      const results = Array.isArray(json.results) ? json.results : []
      return results
        .map(item => {
          const row = item as Record<string, unknown>
          return {
            id: Number(row.id) || 0,
            name: String(row.name ?? ''),
            country: String(row.country ?? row.country_code ?? ''),
            admin1: row.admin1 ? String(row.admin1) : undefined,
            lat: Number(row.latitude),
            lon: Number(row.longitude),
            timezone: row.timezone ? String(row.timezone) : undefined
          }
        })
        .filter(city => city.name && Number.isFinite(city.lat) && Number.isFinite(city.lon))
    } catch (error) {
      console.error('[weather] geocoding failed', errorText(error))
      return []
    }
  }

  async forecast(
    city: City,
    units: WeatherUnits,
    provider: WeatherProvider = 'open-meteo',
    yandexKey = ''
  ): Promise<WeatherResult> {
    if (!city || !Number.isFinite(city.lat) || !Number.isFinite(city.lon)) {
      return { ok: false, error: 'Город не выбран' }
    }
    const key = `${city.lat.toFixed(3)},${city.lon.toFixed(3)},${units},${provider}`
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.at < CACHE_TTL) return { ok: true, data: cached.data }

    const attempts: Array<() => Promise<WeatherSnapshot>> = []
    if (provider === 'metno') attempts.push(() => this.metno(city, units))
    if (provider === 'wttr') attempts.push(() => this.wttr(city, units))
    if (provider === 'yandex') {
      attempts.push(() => this.yandex(city, units, yandexKey))
    }
    attempts.push(() => this.openMeteo(city, units))
    attempts.push(() => this.sevenTimer(city, units))

    let snapshot: WeatherSnapshot | null = null
    let lastError = 'Нет связи с серверами погоды'
    for (const attempt of attempts) {
      try {
        snapshot = await attempt()
        break
      } catch (error) {
        lastError = errorText(error)
        console.warn('[weather] источник недоступен:', lastError)
      }
    }
    if (!snapshot) return { ok: false, error: lastError }

    this.cache.set(key, { at: Date.now(), data: snapshot })
    if (this.cache.size > 60) {
      const oldest = [...this.cache.entries()].sort((a, b) => a[1].at - b[1].at)[0]
      if (oldest) this.cache.delete(oldest[0])
    }
    return { ok: true, data: snapshot }
  }

  private async openMeteo(city: City, units: WeatherUnits): Promise<WeatherSnapshot> {
    const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius'
    const windUnit = units === 'imperial' ? 'mph' : 'ms'
    const url =
      `${FORECAST_URL}?latitude=${city.lat}&longitude=${city.lon}` +
      '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset' +
      `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}` +
      '&timezone=auto&forecast_days=7'

    const json = await fetchJson(url, 5000)
    const current = (json.current ?? {}) as Record<string, number>
    const daily = (json.daily ?? {}) as Record<string, Array<number | string>>
    const dates = Array.isArray(daily.time) ? daily.time : []
    const sunrise = clockTime(daily.sunrise?.[0])
    const sunset = clockTime(daily.sunset?.[0])
    const sun: WeatherSun | null = sunrise && sunset ? { sunrise, sunset } : fallbackSun(city)

    return {
      city,
      provider: 'open-meteo',
      fetchedAt: Date.now(),
      timezone: String(json.timezone ?? ''),
      utcOffsetSeconds: Number(json.utc_offset_seconds ?? 0),
      sun: withMoon(sun, city),
      current: {
        temp: Math.round(Number(current.temperature_2m ?? 0)),
        feelsLike: Math.round(Number(current.apparent_temperature ?? 0)),
        code: Number(current.weather_code ?? 0),
        isDay: Number(current.is_day ?? 1) === 1,
        wind: Math.round(Number(current.wind_speed_10m ?? 0)),
        humidity: Math.round(Number(current.relative_humidity_2m ?? 0))
      },
      daily: dates.map((date, index) => ({
        date: String(date),
        code: Number(daily.weather_code?.[index] ?? 0),
        tMax: Math.round(Number(daily.temperature_2m_max?.[index] ?? 0)),
        tMin: Math.round(Number(daily.temperature_2m_min?.[index] ?? 0))
      }))
    }
  }

  private async yandex(city: City, units: WeatherUnits, key: string): Promise<WeatherSnapshot> {
    if (!key.trim()) throw new Error('Не задан ключ Яндекс.Погоды')
    const url = `https://api.weather.yandex.ru/v2/forecast?lat=${city.lat.toFixed(4)}&lon=${city.lon.toFixed(4)}&lang=ru_RU&limit=7&hours=false&extra=false`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    let json: Record<string, unknown>
    try {
      const response = await net.fetch(url, {
        signal: controller.signal,
        headers: {
          'X-Yandex-API-Key': key,
          'User-Agent': 'TASWidget/0.5'
        }
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      json = (await response.json()) as Record<string, unknown>
    } finally {
      clearTimeout(timer)
    }
    const fact = (json.fact ?? {}) as Record<string, unknown>
    const forecasts = Array.isArray(json.forecasts)
      ? (json.forecasts as Array<Record<string, unknown>>)
      : []
    const first = forecasts[0] ?? {}
    const parts = (first.parts ?? {}) as Record<string, unknown>
    const day = (parts.day ?? {}) as Record<string, unknown>
    const sunrise = typeof first.sunrise === 'string' ? first.sunrise : null
    const sunset = typeof first.sunset === 'string' ? first.sunset : null
    const daily = forecasts.map(forecast => {
      const dayPart = ((forecast.parts ?? {}) as Record<string, unknown>).day as
        Record<string, unknown> | undefined
      return {
        date: String(forecast.date ?? ''),
        code: yandexCode(String(dayPart?.condition ?? '')),
        tMax: toDisplayTemp(Number(dayPart?.temp_max ?? 0), units),
        tMin: toDisplayTemp(Number(dayPart?.temp_min ?? 0), units)
      }
    })
    const temp = Number(fact.temp ?? 0)
    return {
      city,
      provider: 'yandex',
      fetchedAt: Date.now(),
      timezone: '',
      utcOffsetSeconds: cityOffsetSeconds(city),
      sun: withMoon(sunrise && sunset ? { sunrise, sunset } : null, city) ?? fallbackSun(city),
      current: {
        temp: toDisplayTemp(temp, units),
        feelsLike: toDisplayTemp(Number(fact.feels_like ?? temp), units),
        code: yandexCode(String(fact.condition ?? day.condition ?? '')),
        isDay: Number(fact.is_day ?? 1) === 1,
        wind: toDisplayWind(Number(fact.wind_speed ?? 0), units),
        humidity: Math.round(Number(fact.humidity ?? 0))
      },
      daily
    }
  }

  private async metno(city: City, units: WeatherUnits): Promise<WeatherSnapshot> {
    const url = `${METNO_URL}?lat=${city.lat.toFixed(4)}&lon=${city.lon.toFixed(4)}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    let json: Record<string, unknown>
    try {
      const response = await net.fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'TASWidget/0.4 (desktop widget; local build)',
          Accept: 'application/json'
        }
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      json = (await response.json()) as Record<string, unknown>
    } finally {
      clearTimeout(timer)
    }

    const properties = (json.properties ?? {}) as Record<string, unknown>
    const timeseries = Array.isArray(properties.timeseries)
      ? (properties.timeseries as Array<Record<string, unknown>>)
      : []
    if (timeseries.length === 0) throw new Error('пустой прогноз MET Norway')

    interface Point {
      time: number
      temp: number
      wind: number
      humidity: number
      code: number
      isDay: boolean
    }
    const points: Point[] = timeseries.map(entry => {
      const time = Date.parse(String(entry.time ?? ''))
      const data = (entry.data ?? {}) as Record<string, unknown>
      const instant = (data.instant ?? {}) as Record<string, unknown>
      const details = (instant.details ?? {}) as Record<string, unknown>
      const next = (data.next_1_hours ?? data.next_6_hours ?? {}) as Record<string, unknown>
      const summary = (next.summary ?? {}) as Record<string, unknown>
      const symbol = String(summary.symbol_code ?? 'cloudy')
      return {
        time: Number.isFinite(time) ? time : Date.now(),
        temp: Number(details.air_temperature ?? 0),
        wind: Number(details.wind_speed ?? 0),
        humidity: Number(details.relative_humidity ?? 0),
        code: metnoCode(symbol),
        isDay: !isNightSymbol(symbol)
      }
    })

    const now = Date.now()
    let current = points[0]
    let best = Number.POSITIVE_INFINITY
    for (const point of points) {
      const distance = Math.abs(point.time - now)
      if (distance < best) {
        best = distance
        current = point
      }
    }

    const byDay = new Map<string, Point[]>()
    for (const point of points) {
      const date = new Date(point.time)
      const key = toISO(date)
      const list = byDay.get(key) ?? []
      list.push(point)
      byDay.set(key, list)
    }
    const daily = [...byDay.entries()].slice(0, 7).map(([date, list]) => {
      const midday =
        list.reduce((bestPoint, point) => {
          const hour = new Date(point.time).getHours()
          const bestHour = new Date(bestPoint.time).getHours()
          return Math.abs(hour - 12) < Math.abs(bestHour - 12) ? point : bestPoint
        }, list[0]) ?? list[0]
      return {
        date,
        code: midday.code,
        tMax: toDisplayTemp(Math.max(...list.map(point => point.temp)), units),
        tMin: toDisplayTemp(Math.min(...list.map(point => point.temp)), units)
      }
    })

    return {
      city,
      provider: 'metno',
      fetchedAt: Date.now(),
      timezone: '',
      utcOffsetSeconds: cityOffsetSeconds(city),
      sun: fallbackSun(city),
      current: {
        temp: toDisplayTemp(current.temp, units),
        feelsLike: toDisplayTemp(feelsLike(current.temp, current.wind), units),
        code: current.code,
        isDay: current.isDay,
        wind: toDisplayWind(current.wind, units),
        humidity: Math.round(current.humidity)
      },
      daily
    }
  }

  private async wttr(city: City, units: WeatherUnits): Promise<WeatherSnapshot> {
    const url = `${WTTR_URL}/${city.lat.toFixed(4)},${city.lon.toFixed(4)}?format=j1&lang=ru`
    const json = await fetchJson(url, 12000)
    const currentList = Array.isArray(json.current_condition)
      ? (json.current_condition as Array<Record<string, unknown>>)
      : []
    const weather = Array.isArray(json.weather)
      ? (json.weather as Array<Record<string, unknown>>)
      : []
    const currentRaw = currentList[0]
    if (!currentRaw) throw new Error('пустой прогноз wttr.in')

    const hour = new Date().getHours()
    const currentTemp = Number(currentRaw.temp_C ?? 0)
    const windKmph = Number(currentRaw.windspeedKmph ?? 0)
    const astronomy = (weather[0]?.astronomy ?? {}) as Record<string, unknown>
    const sunrise = clockTime(astronomy.sunrise)
    const sunset = clockTime(astronomy.sunset)

    const daily = weather.slice(0, 7).map(day => {
      const date = String(day.date ?? '')
      const hourly = Array.isArray(day.hourly) ? (day.hourly as Array<Record<string, unknown>>) : []
      const midday = hourly.find(item => String(item.time ?? '') === '1200') ?? hourly[0] ?? {}
      return {
        date,
        code: wttrCode(Number(midday.weatherCode ?? 0)),
        tMax: toDisplayTemp(Number(day.maxtempC ?? 0), units),
        tMin: toDisplayTemp(Number(day.mintempC ?? 0), units)
      }
    })

    return {
      city,
      provider: 'wttr',
      fetchedAt: Date.now(),
      timezone: '',
      utcOffsetSeconds: cityOffsetSeconds(city),
      sun: withMoon(sunrise && sunset ? { sunrise, sunset } : fallbackSun(city), city),
      current: {
        temp: toDisplayTemp(currentTemp, units),
        feelsLike: toDisplayTemp(Number(currentRaw.FeelsLikeC ?? currentTemp), units),
        code: wttrCode(Number(currentRaw.weatherCode ?? 0)),
        isDay: hour >= 6 && hour < 20,
        wind: toDisplayWind(windKmph / 3.6, units),
        humidity: Math.round(Number(currentRaw.humidity ?? 0))
      },
      daily
    }
  }

  private async sevenTimer(city: City, units: WeatherUnits): Promise<WeatherSnapshot> {
    const base = `${SEVEN_TIMER_URL}?lon=${city.lon}&lat=${city.lat}`
    const [civilJson, lightJson] = await Promise.all([
      fetchJson(`${base}&product=civil&output=json`, 20000),
      fetchJson(`${base}&product=civillight&output=json`, 20000).catch(() => null)
    ])
    const series = Array.isArray(civilJson.dataseries) ? civilJson.dataseries : []
    if (series.length === 0) throw new Error('пустой прогноз')

    const init = String(civilJson.init ?? '')
    if (init.length < 10) throw new Error('некорректный ответ')
    const baseTime = Date.UTC(
      Number(init.slice(0, 4)),
      Number(init.slice(4, 6)) - 1,
      Number(init.slice(6, 8)),
      Number(init.slice(8, 10))
    )

    interface Point {
      time: number
      temp: number
      wind: number
      humidity: number
      code: number
      isDay: boolean
    }

    const points: Point[] = series.map(raw => {
      const item = raw as Record<string, unknown>
      const wind = item.wind10m as Record<string, unknown> | undefined
      const parsed = sevenTimerCode(String(item.weather ?? 'cloudyday'))
      const humidity = Number.parseFloat(String(item.rh2m ?? '0').replace('%', ''))
      return {
        time: baseTime + Number(item.timepoint ?? 0) * 3600 * 1000,
        temp: Number(item.temp2m ?? 0),
        wind: Number(wind?.speed ?? 0),
        humidity: Number.isFinite(humidity) ? humidity : 0,
        code: parsed.code,
        isDay: parsed.isDay
      }
    })

    const now = Date.now()
    let current = points[0]
    let bestDistance = Number.POSITIVE_INFINITY
    for (const point of points) {
      const distance = Math.abs(point.time - now)
      if (distance < bestDistance) {
        bestDistance = distance
        current = point
      }
    }

    // civillight даёт 7 дней — этого хватает для настройки «5 дней».
    const lightSeries = Array.isArray(lightJson?.dataseries) ? lightJson!.dataseries : []
    let daily = lightSeries
      .slice(0, 7)
      .map(raw => {
        const item = raw as Record<string, unknown>
        const temp = (item.temp2m ?? {}) as Record<string, unknown>
        const dateCode = String(item.date ?? '')
        const date =
          dateCode.length >= 8
            ? `${dateCode.slice(0, 4)}-${dateCode.slice(4, 6)}-${dateCode.slice(6, 8)}`
            : ''
        return {
          date,
          code: sevenTimerCode(String(item.weather ?? 'cloudy')).code,
          tMax: toDisplayTemp(Number(temp.max ?? 0), units),
          tMin: toDisplayTemp(Number(temp.min ?? 0), units)
        }
      })
      .filter(item => item.date)

    if (daily.length === 0) {
      const byDay = new Map<string, Point[]>()
      for (const point of points) {
        const date = new Date(point.time)
        const key = toISO(date)
        const list = byDay.get(key) ?? []
        list.push(point)
        byDay.set(key, list)
      }
      daily = [...byDay.entries()].slice(0, 7).map(([date, list]) => {
        const midday =
          list.reduce((best, point) => {
            const hour = new Date(point.time).getHours()
            const bestHour = new Date(best.time).getHours()
            return Math.abs(hour - 12) < Math.abs(bestHour - 12) ? point : best
          }, list[0]) ?? list[0]
        return {
          date,
          code: midday.code,
          tMax: toDisplayTemp(Math.max(...list.map(point => point.temp)), units),
          tMin: toDisplayTemp(Math.min(...list.map(point => point.temp)), units)
        }
      })
    }

    return {
      city,
      provider: '7timer',
      fetchedAt: Date.now(),
      timezone: '',
      utcOffsetSeconds: cityOffsetSeconds(city),
      sun: fallbackSun(city),
      current: {
        temp: toDisplayTemp(current.temp, units),
        feelsLike: toDisplayTemp(feelsLike(current.temp, current.wind), units),
        code: current.code,
        isDay: current.isDay,
        wind: toDisplayWind(current.wind, units),
        humidity: Math.round(current.humidity)
      },
      daily
    }
  }
}
