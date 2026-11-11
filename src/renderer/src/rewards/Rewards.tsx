import { useEffect, type JSX } from 'react'
import { SIMS_ACHIEVEMENTS } from '@shared/sims'
import { useAppState } from '../hooks'

export function Rewards({ groupId }: { groupId: string }): JSX.Element {
  const state = useAppState()
  const mood = state?.sims[groupId]
  const unlocked = new Set(mood?.unlocked ?? [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') window.widgets.closeSimsRewards()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="rewards">
      <header className="rewards__head">
        <div>
          <strong>Награды</strong>
          <span>
            {unlocked.size} из {SIMS_ACHIEVEMENTS.length}
          </span>
        </div>
        <button type="button" onClick={() => window.widgets.closeSimsRewards()} title="Закрыть">
          ×
        </button>
      </header>

      <div className="rewards__list">
        {SIMS_ACHIEVEMENTS.map((item) => {
          const done = unlocked.has(item.id)
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
