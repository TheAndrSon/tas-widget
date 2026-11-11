import type { WidgetId, WidgetMeta } from './types'

/** Каталог виджетов: размеры окна и готовность. */
export const WIDGETS: Record<WidgetId, WidgetMeta> = {
  system: { id: 'system', title: 'Система', width: 280, height: 224, ready: true },
  music: { id: 'music', title: 'Музыка', width: 340, height: 150, ready: true },
  weather: { id: 'weather', title: 'Погода', width: 320, height: 300, ready: true },
  equalizer: { id: 'equalizer', title: 'Эквалайзер', width: 320, height: 160, ready: true },
  plumbob: { id: 'plumbob', title: 'Пламбоб', width: 220, height: 260, ready: true }
}

export const WIDGET_IDS = Object.keys(WIDGETS) as WidgetId[]

export function readyWidgetIds(): WidgetId[] {
  return WIDGET_IDS.filter(id => WIDGETS[id].ready)
}
