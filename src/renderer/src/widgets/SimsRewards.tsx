import { useEffect, useState, type ReactElement } from 'react'
import type { AppSettings, SimsInstance, SimsState } from '@shared/types'
import { SIMS_ACHIEVEMENTS } from '@shared/sims'
import './SimsRewards.css'

export function SimsRewards({ instanceId }: { instanceId: string }): ReactElement {
  const [instance, setInstance] = useState<SimsInstance | null>(null)
  const [state, setState] = useState<SimsState | null>(null)

  useEffect(() => {
    let alive = true
    const applySettings = (next: AppSettings): void => {
      if (!alive) return
      setInstance(next.sims.instances.find(item => item.id === instanceId) ?? null)
    }
    void window.api
      .getSettings()
      .then(applySettings)
      .catch(() => undefined)
    const offSettings = window.api.onSettingsChanged(applySettings)

    const applySims = (groups: Record<string, SimsState>): void => {
      if (!alive) return
      const current = groups[instance?.groupId ?? 'default']
      setState(current ?? null)
    }
    void window.api
      .getSims()
      .then(applySims)
      .catch(() => undefined)
    const offSims = window.api.onSimsChanged(applySims)
    return () => {
      alive = false
      offSettings()
      offSims()
    }
  }, [instanceId, instance?.groupId])

  const unlocked = state?.unlocked.length ?? 0

  return (
    <div className="rewards">
      <header className="rewards__head">
        <div>
          <strong>Награды</strong>
          <span>
            {unlocked} из {SIMS_ACHIEVEMENTS.length}
          </span>
        </div>
        <button type="button" onClick={() => void window.api.closeSimsRewards()}>
          ×
        </button>
      </header>

      <div className="rewards__list">
        {SIMS_ACHIEVEMENTS.map(item => {
          const done = state?.unlocked.includes(item.id) ?? false
          return (
            <div className={`rewards__item${done ? ' is-done' : ''}`} key={item.id}>
              <span className="rewards__icon">{done ? '🏆' : '☆'}</span>
              <div>
                <strong>{item.name}</strong>
                <small>{item.hint}</small>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
