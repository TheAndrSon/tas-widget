import {
  useEffect,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactElement
} from 'react'
import type { AppSettings, EqualizerSettings } from '@shared/types'
import { Visualizer } from './Visualizer'
import './EqualizerWidget.css'

function useEqualizerSettings(): EqualizerSettings | null {
  const [settings, setSettings] = useState<EqualizerSettings | null>(null)

  useEffect(() => {
    let alive = true
    const apply = (next: AppSettings): void => {
      if (alive) setSettings(next.equalizer)
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
  }, [])

  return settings
}

export function EqualizerWidget(): ReactElement | null {
  const settings = useEqualizerSettings()

  if (!settings) return null

  const sideways = settings.dock === 'left' || settings.dock === 'right'
  const scaleX = (sideways ? settings.mirrorY : settings.mirrorX) ? -1 : 1
  const scaleY = (sideways ? settings.mirrorX : settings.mirrorY) ? -1 : 1
  const mirrorStyle = { transform: `scale(${scaleX}, ${scaleY})` } as CSSProperties

  const onContextMenu = (event: ReactMouseEvent<HTMLDivElement>): void => {
    event.preventDefault()
    void window.api.showContextMenu()
  }

  return (
    <div
      className={`widget eq${settings.visualizer.mode === 'off' ? ' is-empty' : ''}${
        settings.dock !== 'free' ? ' is-dock' : ''
      } eq-dock-${settings.dock}`}
      onContextMenu={onContextMenu}
    >
      <div className="eq__canvas">
        <div className="eq__mirror" style={mirrorStyle}>
          <Visualizer settings={settings.visualizer} />
        </div>
      </div>
    </div>
  )
}
