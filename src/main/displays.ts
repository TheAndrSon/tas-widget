import { screen, type Display } from 'electron'
import type { DisplayInfo } from '../shared/types'

export function getDisplayList(): DisplayInfo[] {
  const displays = screen.getAllDisplays()
  return displays.map((display, index) => ({
    id: display.id,
    label: `Экран ${index + 1}${display.id === screen.getPrimaryDisplay().id ? ' (основной)' : ''}`,
    primary: display.id === screen.getPrimaryDisplay().id,
    workArea: {
      x: display.workArea.x,
      y: display.workArea.y,
      width: display.workArea.width,
      height: display.workArea.height
    },
    scaleFactor: display.scaleFactor
  }))
}

/** Монитор для новых виджетов: явно выбранный или тот, где сейчас курсор. */
export function resolveTargetDisplay(preferredId?: number): Display {
  if (preferredId) {
    const found = screen.getAllDisplays().find((display) => display.id === preferredId)
    if (found) return found
  }
  return screen.getDisplayNearestPoint(screen.getCursorScreenPoint())
}

export function displayById(id: number): Display | undefined {
  return screen.getAllDisplays().find((display) => display.id === id)
}
