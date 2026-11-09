/** Восход и закат по упрощённой формуле NOAA (точность ±1–2 минуты). */

const RAD = Math.PI / 180
const J2000 = 2451545.0
const DAY_MS = 86_400_000

export interface SunTimes {
  sunrise: string
  sunset: string
  /** минуты от полуночи по локальному времени */
  sunriseMinutes: number
  sunsetMinutes: number
  daylightMinutes: number
  polar: 'day' | 'night' | null
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function formatMinutes(minutes: number): string {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

export function sunTimes(date: Date, lat: number, lon: number): SunTimes | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const noon = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  const n = Math.floor((noon - Date.UTC(2000, 0, 1, 12)) / DAY_MS - lon / 360)
  const jStar = n - lon / 360
  const M = (357.5291 + 0.98560028 * jStar) % 360
  const C =
    1.9148 * Math.sin(M * RAD) +
    0.02 * Math.sin(2 * M * RAD) +
    0.0003 * Math.sin(3 * M * RAD)
  const lambda = (M + C + 180 + 102.9372) % 360
  const jTransit = J2000 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD)
  const declination = Math.asin(Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD))
  const cosOmega =
    (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(declination)) /
    (Math.cos(lat * RAD) * Math.cos(declination))

  if (cosOmega < -1) {
    return {
      sunrise: '—',
      sunset: '—',
      sunriseMinutes: 0,
      sunsetMinutes: 0,
      daylightMinutes: 1440,
      polar: 'day'
    }
  }
  if (cosOmega > 1) {
    return {
      sunrise: '—',
      sunset: '—',
      sunriseMinutes: 0,
      sunsetMinutes: 0,
      daylightMinutes: 0,
      polar: 'night'
    }
  }

  const omega = Math.acos(cosOmega) / RAD
  const riseJd = jTransit - omega / 360
  const setJd = jTransit + omega / 360
  const rise = new Date((riseJd - 2440587.5) * DAY_MS)
  const set = new Date((setJd - 2440587.5) * DAY_MS)
  const riseMinutes = rise.getHours() * 60 + rise.getMinutes()
  const setMinutes = set.getHours() * 60 + set.getMinutes()
  return {
    sunrise: formatMinutes(riseMinutes),
    sunset: formatMinutes(setMinutes),
    sunriseMinutes: riseMinutes,
    sunsetMinutes: setMinutes,
    daylightMinutes: Math.max(0, setMinutes - riseMinutes),
    polar: null
  }
}

/** Текущее время в часовом поясе города, в минутах от полуночи. */
export function cityMinutes(now: Date, utcOffsetSeconds: number): number {
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60
  return ((utcMinutes + utcOffsetSeconds / 60) % 1440 + 1440) % 1440
}

/** Смещение IANA-зоны в секундах; без зоны — системное. */
export function zoneOffsetSeconds(timeZone: string | undefined, date = new Date()): number {
  if (!timeZone) return -date.getTimezoneOffset() * 60
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset'
    }).formatToParts(date)
    const name = parts.find((part) => part.type === 'timeZoneName')?.value ?? ''
    const match = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name)
    if (match) {
      const sign = match[1] === '-' ? -1 : 1
      return sign * (Number(match[2]) * 3600 + Number(match[3] ?? 0) * 60)
    }
  } catch {
    /* неизвестная зона — системное время */
  }
  return -date.getTimezoneOffset() * 60
}

export function formatDaylight(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} мин`
  return `${h} ч ${pad(m)} мин`
}

/** Приблизительные восход и заход Луны (без внешнего API). */
export interface MoonTimes {
  moonrise: string
  moonset: string
  moonriseMinutes: number
  moonsetMinutes: number
}

const RAD2 = Math.PI / 180

function toDays(date: Date): number {
  return date.valueOf() / DAY_MS - 0.5 + 2440588 - J2000
}

function moonCoords(d: number): { ra: number; dec: number } {
  const L = RAD2 * (218.316 + 13.176396 * d)
  const M = RAD2 * (134.963 + 13.064993 * d)
  const F = RAD2 * (93.272 + 13.22935 * d)
  const l = L + RAD2 * 6.289 * Math.sin(M)
  const b = RAD2 * 5.128 * Math.sin(F)
  const e = RAD2 * 23.4397
  const ra = Math.atan2(
    Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e),
    Math.cos(l)
  )
  const dec = Math.asin(
    Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)
  )
  return { ra, dec }
}

function siderealTime(d: number, lon: number): number {
  return RAD2 * (280.16 + 360.9856235 * d) - lon * RAD2
}

export function moonTimes(date: Date, lat: number, lon: number): MoonTimes | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  const d = toDays(day)
  const coords = moonCoords(d)
  const h0 = -0.3 * RAD2
  const cosH =
    (Math.sin(h0) - Math.sin(lat * RAD2) * Math.sin(coords.dec)) /
    (Math.cos(lat * RAD2) * Math.cos(coords.dec))
  if (cosH < -1 || cosH > 1) {
    return { moonrise: '—', moonset: '—', moonriseMinutes: 0, moonsetMinutes: 0 }
  }
  const H = Math.acos(cosH)
  const st = siderealTime(d, lon)
  const riseHour = ((coords.ra - H - st) / (2 * Math.PI)) * 24 + 12
  const setHour = ((coords.ra + H - st) / (2 * Math.PI)) * 24 + 12
  const normalize = (value: number): number => {
    let result = value % 24
    if (result < 0) result += 24
    return result
  }
  const riseMinutes = Math.round(normalize(riseHour) * 60)
  const setMinutes = Math.round(normalize(setHour) * 60)
  return {
    moonrise: formatMinutes(riseMinutes),
    moonset: formatMinutes(setMinutes),
    moonriseMinutes: riseMinutes,
    moonsetMinutes: setMinutes
  }
}

export type SkyPeriod = 'morning' | 'day' | 'evening' | 'night'

export function skyPeriod(
  nowMinutes: number,
  sunriseMinutes: number,
  sunsetMinutes: number
): SkyPeriod {
  if (nowMinutes < sunriseMinutes - 45 || nowMinutes >= sunsetMinutes + 45) return 'night'
  if (nowMinutes < sunriseMinutes + 120) return 'morning'
  if (nowMinutes < sunsetMinutes - 150) return 'day'
  return 'evening'
}

export const SKY_PERIOD_LABELS: Record<SkyPeriod, string> = {
  morning: 'утро',
  day: 'день',
  evening: 'вечер',
  night: 'ночь'
}
