import type { AstroSettings, ZodiacSign } from './types'

export interface ZodiacInfo {
  id: ZodiacSign
  name: string
  dates: string
  element: 'Огонь' | 'Земля' | 'Воздух' | 'Вода'
  planet: string
  glyph: string
  short: string
}

export const ZODIAC: Record<ZodiacSign, ZodiacInfo> = {
  aries: {
    id: 'aries',
    name: 'Овен',
    dates: '21 марта — 19 апреля',
    element: 'Огонь',
    planet: 'Марс',
    glyph: '♈',
    short: 'первый импульс'
  },
  taurus: {
    id: 'taurus',
    name: 'Телец',
    dates: '20 апреля — 20 мая',
    element: 'Земля',
    planet: 'Венера',
    glyph: '♉',
    short: 'устойчивость'
  },
  gemini: {
    id: 'gemini',
    name: 'Близнецы',
    dates: '21 мая — 20 июня',
    element: 'Воздух',
    planet: 'Меркурий',
    glyph: '♊',
    short: 'любопытство'
  },
  cancer: {
    id: 'cancer',
    name: 'Рак',
    dates: '21 июня — 22 июля',
    element: 'Вода',
    planet: 'Луна',
    glyph: '♋',
    short: 'забота'
  },
  leo: {
    id: 'leo',
    name: 'Лев',
    dates: '23 июля — 22 августа',
    element: 'Огонь',
    planet: 'Солнце',
    glyph: '♌',
    short: 'выражение'
  },
  virgo: {
    id: 'virgo',
    name: 'Дева',
    dates: '23 августа — 22 сентября',
    element: 'Земля',
    planet: 'Меркурий',
    glyph: '♍',
    short: 'точность'
  },
  libra: {
    id: 'libra',
    name: 'Весы',
    dates: '23 сентября — 22 октября',
    element: 'Воздух',
    planet: 'Венера',
    glyph: '♎',
    short: 'равновесие'
  },
  scorpio: {
    id: 'scorpio',
    name: 'Скорпион',
    dates: '23 октября — 21 ноября',
    element: 'Вода',
    planet: 'Плутон',
    glyph: '♏',
    short: 'глубина'
  },
  sagittarius: {
    id: 'sagittarius',
    name: 'Стрелец',
    dates: '22 ноября — 21 декабря',
    element: 'Огонь',
    planet: 'Юпитер',
    glyph: '♐',
    short: 'горизонт'
  },
  capricorn: {
    id: 'capricorn',
    name: 'Козерог',
    dates: '22 декабря — 19 января',
    element: 'Земля',
    planet: 'Сатурн',
    glyph: '♑',
    short: 'структура'
  },
  aquarius: {
    id: 'aquarius',
    name: 'Водолей',
    dates: '20 января — 18 февраля',
    element: 'Воздух',
    planet: 'Уран',
    glyph: '♒',
    short: 'свобода'
  },
  pisces: {
    id: 'pisces',
    name: 'Рыбы',
    dates: '19 февраля — 20 марта',
    element: 'Вода',
    planet: 'Нептун',
    glyph: '♓',
    short: 'воображение'
  }
}

const RANGES: Array<{ sign: ZodiacSign; from: [number, number]; to: [number, number] }> = [
  { sign: 'capricorn', from: [12, 22], to: [1, 19] },
  { sign: 'aquarius', from: [1, 20], to: [2, 18] },
  { sign: 'pisces', from: [2, 19], to: [3, 20] },
  { sign: 'aries', from: [3, 21], to: [4, 19] },
  { sign: 'taurus', from: [4, 20], to: [5, 20] },
  { sign: 'gemini', from: [5, 21], to: [6, 20] },
  { sign: 'cancer', from: [6, 21], to: [7, 22] },
  { sign: 'leo', from: [7, 23], to: [8, 22] },
  { sign: 'virgo', from: [8, 23], to: [9, 22] },
  { sign: 'libra', from: [9, 23], to: [10, 22] },
  { sign: 'scorpio', from: [10, 23], to: [11, 21] },
  { sign: 'sagittarius', from: [11, 22], to: [12, 21] }
]

export function sunSign(date: Date): ZodiacSign {
  const month = date.getMonth() + 1
  const day = date.getDate()
  for (const range of RANGES) {
    const [fm, fd] = range.from
    const [tm, td] = range.to
    if (fm <= tm) {
      if ((month === fm && day >= fd) || (month === tm && day <= td) || (month > fm && month < tm)) {
        return range.sign
      }
    } else if ((month === fm && day >= fd) || (month === tm && day <= td)) {
      return range.sign
    }
  }
  return 'capricorn'
}

export function parseBirthDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

export function signFromDayMonth(day: number, month: number): ZodiacSign {
  const safeDay = Math.min(31, Math.max(1, Math.round(day)))
  const safeMonth = Math.min(12, Math.max(1, Math.round(month)))
  return sunSign(new Date(2000, safeMonth - 1, safeDay))
}

export const ZODIAC_ORDER: ZodiacSign[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces'
]

export function resolveSign(settings: AstroSettings, now: Date): {
  sign: ZodiacSign
  source: 'birth' | 'manual' | 'season'
} {
  if (settings.sign !== 'auto') return { sign: settings.sign, source: 'manual' }
  const birth = parseBirthDate(settings.birthDate)
  if (birth) return { sign: sunSign(birth), source: 'birth' }
  return { sign: sunSign(now), source: 'season' }
}

export interface MoonInfo {
  phase: number
  name: string
  illumination: number
  waxing: boolean
}

const MOON_NAMES = [
  'Новолуние',
  'Растущий серп',
  'Первая четверть',
  'Растущая Луна',
  'Полнолуние',
  'Убывающая Луна',
  'Последняя четверть',
  'Убывающий серп'
]

export function moonPhase(date: Date): MoonInfo {
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14)
  const synodic = 29.530588853
  const days = (date.getTime() - knownNewMoon) / 86_400_000
  let phase = (days % synodic) / synodic
  if (phase < 0) phase += 1
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2
  const index = Math.round(phase * 8) % 8
  return {
    phase,
    name: MOON_NAMES[index],
    illumination,
    waxing: phase < 0.5
  }
}

const ADVICE: Record<ZodiacInfo['element'], string[]> = {
  Огонь: [
    'Начните с одного смелого шага — остальное подтянется.',
    'Энергии много: направьте её в конкретное дело, а не в спор.',
    'Хороший день, чтобы сказать «да» тому, что давно откладывали.',
    'Сбавьте темп на одном участке — иначе выгорите к вечеру.',
    'Кто-то рядом ждёт вашей инициативы. Сделайте первый ход.',
    'Сначала результат, потом признание. Не наоборот.',
    'Разрешите себе паузу: она вернёт ясность.',
    'Ваша прямота сегодня — преимущество. Но добавьте мягкости.'
  ],
  Земля: [
    'Маленький порядок в делах даст больше, чем большой план.',
    'Проверьте цифры дважды — сегодня это окупится.',
    'Откажитесь от одной лишней задачи в пользу главной.',
    'Тело знает лучше: не игнорируйте усталость.',
    'Хороший день для финансов и договорённостей.',
    'Не пытайтесь контролировать чужой темп.',
    'Сделайте запас на будущее — хотя бы небольшой.',
    'Ваша надёжность сегодня заметнее, чем кажется.'
  ],
  Воздух: [
    'Запишите идею, пока она не улетела.',
    'Разговор прояснит то, что вы додумывали в одиночку.',
    'Смените маршрут — это освежит голову.',
    'Не разменивайтесь на десять чатов сразу.',
    'Кому-то нужен ваш взгляд со стороны. Поделитесь.',
    'Сначала спросите, потом советуйте.',
    'Один короткий текст может исправить настроение.',
    'Дайте мыслям осесть перед решением.'
  ],
  Вода: [
    'Доверьтесь первому ощущению — оно точнее анализа.',
    'Побудьте немного в тишине, чтобы услышать себя.',
    'Не берите чужое настроение на себя.',
    'Тёплые слова сегодня работают лучше аргументов.',
    'Вспомните, что вас радовало в детстве. Это подсказка.',
    'Границы — это забота, а не холодность.',
    'Хороший день для музыки, воды и честного разговора.',
    'Отпустите то, что уже не ваше.'
  ]
}

export function dailyAdvice(sign: ZodiacSign, now: Date): string {
  const info = ZODIAC[sign]
  const dayOfYear = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) /
      86_400_000
  )
  const list = ADVICE[info.element]
  return list[dayOfYear % list.length]
}

export function zodiacFromDate(now: Date): ZodiacInfo {
  return ZODIAC[sunSign(now)]
}
