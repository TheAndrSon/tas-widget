import type { CalendarSettings, WeatherSettings, WidgetInstance } from './types'
import { WIDGET_META } from './types'

export const CALENDAR_VIEW_LABELS: Record<string, string> = {
  week: 'неделя',
  month: 'месяц',
  '3months': '3 месяца'
}

export function instanceDetail(instance: WidgetInstance): string | null {
  switch (instance.type) {
    case 'weather':
      return (instance.settings as WeatherSettings).city?.name ?? null
    case 'calendar':
      return CALENDAR_VIEW_LABELS[(instance.settings as CalendarSettings).view] ?? null
    default:
      return null
  }
}

export function instanceSubtitle(instance: WidgetInstance): string {
  switch (instance.type) {
    case 'weather': {
      const city = (instance.settings as WeatherSettings).city
      return city ? [city.name, city.admin1].filter(Boolean).join(', ') : 'Город не выбран'
    }
    case 'calendar': {
      const calendar = instance.settings as CalendarSettings
      const view = CALENDAR_VIEW_LABELS[calendar.view] ?? ''
      return calendar.view === '3months'
        ? `${view} · ${calendar.layout === 'row' ? 'в ряд' : 'в столбик'}`
        : view
    }
    case 'music':
      return 'медиа-сессия Windows'
    case 'clock':
      return 'часы'
    case 'weekday':
      return 'день недели'
    case 'astro':
      return 'знак, луна и совет'
    case 'tarot':
      return 'расклад и колода'
    case 'dice':
      return 'кубики и монета'
    case 'equalizer':
      return 'визуализация музыки'
    case 'todo':
      return 'список и стикеры'
    case 'sims':
      return 'пламбоб и потребности'
    default:
      return ''
  }
}

/** Одна строка для трея и заголовка панели. */
export function instanceLabel(instance: WidgetInstance, all: WidgetInstance[]): string {
  const base = WIDGET_META[instance.type].title
  const detail = instanceDetail(instance)
  const detailLabel = detail ? detail.charAt(0).toUpperCase() + detail.slice(1) : ''
  const sameDetail = all.filter((item) => item.type === instance.type && instanceDetail(item) === detail)
  const suffix =
    sameDetail.length > 1 ? ` (${sameDetail.findIndex((item) => item.id === instance.id) + 1})` : ''
  return detailLabel ? `${base} · ${detailLabel}${suffix}` : `${base}${suffix}`
}
