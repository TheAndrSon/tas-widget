import type { CSSProperties, JSX } from 'react'
import type { EqualizerSettings } from '@shared/types'
import { Visualizer } from './Visualizer'

export function EqualizerWidget({ settings }: { settings: EqualizerSettings }): JSX.Element {
  const sideways = settings.dock === 'left' || settings.dock === 'right'
  const scaleX = (sideways ? settings.mirrorY : settings.mirrorX) ? -1 : 1
  const scaleY = (sideways ? settings.mirrorX : settings.mirrorY) ? -1 : 1
  const style = {
    zoom: settings.dock === 'free' ? settings.scale : 1
  } as CSSProperties
  return (
    <div
      className={`eq${settings.visualizer.mode === 'off' ? ' is-empty' : ''}${settings.dock !== 'free' ? ' is-dock' : ''} eq-dock-${settings.dock}`}
      style={style}
    >
      <div className="eq__canvas">
        <div className="eq__mirror" style={{ transform: `scale(${scaleX}, ${scaleY})` }}>
          <Visualizer settings={settings.visualizer} />
        </div>
      </div>
    </div>
  )
}
