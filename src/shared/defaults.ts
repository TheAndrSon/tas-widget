import type { AppSettings, WidgetId, WidgetPlacement } from './types'
import { WIDGETS, readyWidgetIds } from './widgets'

function placement(id: WidgetId): WidgetPlacement {
  return { x: null, y: null, enabled: WIDGETS[id].ready && id === 'system' }
}

const widgets = Object.fromEntries(
  Object.keys(WIDGETS).map(id => [id, placement(id as WidgetId)])
) as Record<WidgetId, WidgetPlacement>

export const DEFAULT_SETTINGS: AppSettings = {
  widgets,
  system: { intervalMs: 2000 },
  music: {
    showArt: true,
    showProgress: true,
    showControls: true,
    showSource: true
  }
}

export function defaultPlacement(id: WidgetId): WidgetPlacement {
  return placement(id)
}

export function defaultEnabledIds(): WidgetId[] {
  return readyWidgetIds().filter(id => DEFAULT_SETTINGS.widgets[id].enabled)
}
