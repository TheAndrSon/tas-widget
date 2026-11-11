import type { JSX } from 'react'
import type { EqualizerSettings } from '@shared/types'
import { Visualizer } from './Visualizer'

export function EqualizerWidget({ settings }: { settings: EqualizerSettings }): JSX.Element {
  return (
    <div className={`eq${settings.visualizer.mode === 'off' ? ' is-empty' : ''}`}>
      <div className="eq__canvas">
        <Visualizer settings={settings.visualizer} flatWhenIdle />
      </div>
    </div>
  )
}
