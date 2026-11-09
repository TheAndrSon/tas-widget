export type WeatherKind =
  | 'clear'
  | 'partly'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'thunder'

interface WeatherInfo {
  label: string
  kind: WeatherKind
}

const CODES: Record<number, WeatherInfo> = {
  0: { label: 'Ясно', kind: 'clear' },
  1: { label: 'Преимущественно ясно', kind: 'partly' },
  2: { label: 'Переменная облачность', kind: 'partly' },
  3: { label: 'Пасмурно', kind: 'cloudy' },
  45: { label: 'Туман', kind: 'fog' },
  48: { label: 'Изморозь', kind: 'fog' },
  51: { label: 'Слабая морось', kind: 'drizzle' },
  53: { label: 'Морось', kind: 'drizzle' },
  55: { label: 'Сильная морось', kind: 'drizzle' },
  56: { label: 'Ледяная морось', kind: 'drizzle' },
  57: { label: 'Сильная ледяная морось', kind: 'drizzle' },
  61: { label: 'Небольшой дождь', kind: 'rain' },
  63: { label: 'Дождь', kind: 'rain' },
  65: { label: 'Сильный дождь', kind: 'rain' },
  66: { label: 'Ледяной дождь', kind: 'rain' },
  67: { label: 'Сильный ледяной дождь', kind: 'rain' },
  71: { label: 'Небольшой снег', kind: 'snow' },
  73: { label: 'Снег', kind: 'snow' },
  75: { label: 'Сильный снег', kind: 'snow' },
  77: { label: 'Снежные зёрна', kind: 'snow' },
  80: { label: 'Небольшой ливень', kind: 'rain' },
  81: { label: 'Ливень', kind: 'rain' },
  82: { label: 'Сильный ливень', kind: 'rain' },
  85: { label: 'Небольшой снегопад', kind: 'snow' },
  86: { label: 'Сильный снегопад', kind: 'snow' },
  95: { label: 'Гроза', kind: 'thunder' },
  96: { label: 'Гроза с градом', kind: 'thunder' },
  99: { label: 'Сильная гроза с градом', kind: 'thunder' }
}

export function weatherInfo(code: number): WeatherInfo {
  return CODES[code] ?? { label: 'Неизвестно', kind: 'cloudy' }
}

export function weatherKind(code: number): WeatherKind {
  return weatherInfo(code).kind
}
