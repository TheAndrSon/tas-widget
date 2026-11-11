import { useEffect, useState, type MouseEvent as ReactMouseEvent, type ReactElement } from 'react'
import type { AppSettings, EqualizerInstance } from '@shared/types'
import { Visualizer } from './Visualizer'
import { defaultWindowStyle } from '@shared/windowStyle'
import { WindowStyleLayers, windowStyleClass, windowStyleVars } from './WindowStyleLayers'
import './EqualizerWidget.css'

function useEqualizerInstance(id: string): {
  instance: EqualizerInstance | null
  loaded: boolean
} {
  const [state, setState] = useState<{ instance: EqualizerInstance | null; loaded: boolean }>({
    instance: null,
    loaded: false
  })

  useEffect(() => {
    let alive = true
    const apply = (next: AppSettings): void => {
      if (!alive) return
      setState({
        instance: next.equalizer.instances.find(item => item.id === id) ?? null,
        loaded: true
      })
    }
    window.api
      .getSettings()
      .then(apply)
      .catch(() => {
        if (alive) setState({ instance: null, loaded: true })
      })
    const off = window.api.onSettingsChanged(apply)
    return () => {
      alive = false
      off()
    }
  }, [id])

  return state
}

export function EqualizerWidget({ instanceId }: { instanceId: string }): ReactElement | null {
  const { instance, loaded } = useEqualizerInstance(instanceId)

  if (!loaded) return null

  const onContextMenu = (event: ReactMouseEvent<HTMLDivElement>): void => {
    event.preventDefault()
    void window.api.showContextMenu()
  }

  if (!instance) {
    return (
      <div className="widget eq is-windowless" onContextMenu={onContextMenu}>
        <div className="eq__empty">Эквалайзер удалён</div>
      </div>
    )
  }

  const settings = instance.settings
  const style = instance.style ?? defaultWindowStyle()

  return (
    <div
      className={`widget eq${settings.visualizer.mode === 'off' ? ' is-empty' : ''}${
        instance.locked ? ' is-locked' : ''
      } ${windowStyleClass(style)}`}
      style={windowStyleVars(style)}
      onContextMenu={onContextMenu}
    >
      <WindowStyleLayers style={style} accent={false} />
      <div className="eq__canvas">
        <Visualizer settings={settings.visualizer} />
      </div>
      {settings.visualizer.mode === 'off' && (
        <div className="eq__empty">Выберите визуализацию в настройках</div>
      )}
    </div>
  )
}
