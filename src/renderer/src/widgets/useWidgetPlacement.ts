import { useEffect, useState } from 'react'
import type { AppSettings, WidgetId, WidgetPlacement } from '@shared/types'

export function useWidgetPlacement(id: WidgetId): WidgetPlacement | null {
  const [placement, setPlacement] = useState<WidgetPlacement | null>(null)

  useEffect(() => {
    let alive = true
    const apply = (next: AppSettings): void => {
      if (alive) setPlacement(next.widgets[id] ?? null)
    }
    window.api
      .getSettings()
      .then(apply)
      .catch(() => undefined)
    const off = window.api.onSettingsChanged(apply)
    return () => {
      alive = false
      off()
    }
  }, [id])

  return placement
}
