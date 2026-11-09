import { useEffect, useRef, type JSX } from 'react'
import type { SimsAction, SimsSettings } from '@shared/types'
import { NEEDS, decayMood, moodColor, moodLabel, moodState } from '@shared/sims'
import { useAppState } from '../hooks'

export function SimsMenu({ instanceId }: { instanceId: string }): JSX.Element {
  const state = useAppState()
  const instance = state?.widgets.find((widget) => widget.id === instanceId)
  const settings = instance?.settings as SimsSettings | undefined
  const stored = settings ? state?.sims[settings.groupId] : undefined
  const leaveTimer = useRef<number | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') window.widgets.closeSimsMenu()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current)
    }
  }, [])

  const keepOpen = (): void => {
    if (leaveTimer.current !== null) {
      window.clearTimeout(leaveTimer.current)
      leaveTimer.current = null
    }
  }

  const scheduleClose = (): void => {
    keepOpen()
    leaveTimer.current = window.setTimeout(() => window.widgets.closeSimsMenu(), 380)
  }

  if (!settings || !stored) {
    return (
      <div className="sims-menu" onMouseEnter={keepOpen} onMouseLeave={scheduleClose}>
        <div className="sims-menu__empty">Нет данных о персонаже</div>
      </div>
    )
  }

  const mood = decayMood(stored)
  const act = (action: SimsAction): void => {
    void window.widgets.simsAction(settings.groupId, action, settings.difficulty)
  }

  return (
    <div className="sims-menu" onMouseEnter={keepOpen} onMouseLeave={scheduleClose}>
      <div className="sims-menu__card">
        <div className="sims-menu__head">
          <div>
            <div className="sims-menu__name">{settings.label || 'Пламбоб'}</div>
            <div className="sims-menu__state">
              {moodLabel(mood.mood)} · {moodState(mood)}
            </div>
          </div>
          <button
            type="button"
            className="sims-menu__close"
            onClick={() => window.widgets.closeSimsMenu()}
            title="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="sims-menu__needs">
          {NEEDS.map((need) => (
            <div className="sims-menu-need" key={need.key}>
              <button
                type="button"
                className="sims-menu-need__action"
                onClick={() => act(need.action)}
                title={`${need.label}: ${need.action}`}
              >
                {need.label}
              </button>
              <span className="sims-menu-need__track">
                <span
                  className="sims-menu-need__fill"
                  style={{ width: `${mood[need.key]}%`, background: moodColor(mood[need.key]) }}
                />
              </span>
              <span className="sims-menu-need__value">{mood[need.key]}</span>
            </div>
          ))}
        </div>

        <div className="sims-menu__footer">
          <button type="button" className="sims-menu__worsen" onClick={() => act('worsen')}>
            Ухудшить
          </button>
          {settings.showPoints && (
            <span className="sims-menu__points">★ {mood.points}</span>
          )}
        </div>
      </div>
    </div>
  )
}
