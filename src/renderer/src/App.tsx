import type { ReactElement, ReactNode } from 'react'
import type { WidgetId } from '@shared/types'
import { MusicWidget } from './widgets/MusicWidget'
import { SystemWidget } from './widgets/SystemWidget'

function Placeholder({ id }: { id: string }): ReactElement {
  return (
    <div className="widget widget--placeholder">
      <strong>Виджет «{id}» пока не перенесён</strong>
      <span>Смотри план в docs/PROJECT_GUIDE.md</span>
    </div>
  )
}

export function App(): ReactElement {
  const id = new URLSearchParams(window.location.search).get('widget') as WidgetId | null

  let content: ReactNode
  switch (id) {
    case 'system':
      content = <SystemWidget />
      break
    case 'music':
      content = <MusicWidget />
      break
    default:
      content = <Placeholder id={id ?? 'unknown'} />
  }

  return <div className="widget-root">{content}</div>
}
