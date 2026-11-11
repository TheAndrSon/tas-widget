import type { ReactElement, ReactNode } from 'react'
import type { WidgetId } from '@shared/types'
import { EqualizerWidget } from './widgets/EqualizerWidget'
import { MusicWidget } from './widgets/MusicWidget'
import { SimsRewards } from './widgets/SimsRewards'
import { SimsWidget } from './widgets/SimsWidget'
import { SystemWidget } from './widgets/SystemWidget'
import { WeatherWidget } from './widgets/WeatherWidget'

function Placeholder({ id }: { id: string }): ReactElement {
  return (
    <div className="widget widget--placeholder">
      <strong>Виджет «{id}» пока не перенесён</strong>
      <span>Смотри план в docs/PROJECT_GUIDE.md</span>
    </div>
  )
}

export function App(): ReactElement {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('widget') as string | null
  const instance = params.get('instance') ?? ''

  let content: ReactNode
  switch (id) {
    case 'system':
      content = <SystemWidget />
      break
    case 'music':
      content = <MusicWidget />
      break
    case 'weather':
      content = <WeatherWidget instanceId={instance} />
      break
    case 'equalizer':
      content = <EqualizerWidget instanceId={instance} />
      break
    case 'plumbob':
      content = <SimsWidget instanceId={instance} />
      break
    case 'rewards':
      content = <SimsRewards instanceId={instance} />
      break
    default:
      content = <Placeholder id={id ?? 'unknown'} />
  }

  return <div className="widget-root">{content}</div>
}
