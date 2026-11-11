import { useEffect, useState, type CSSProperties, type ReactElement } from 'react'
import type { AppSettings, SimsAction, SimsInstance, SimsNeed, SimsState } from '@shared/types'
import { SIMS_ACHIEVEMENTS, SIMS_NEEDS, moodColor, moodLabel, moodState } from '@shared/sims'
import { defaultWindowStyle } from '@shared/windowStyle'
import { WindowStyleLayers, windowStyleClass, windowStyleVars } from './WindowStyleLayers'
import './SimsWidget.css'

function useSimsInstance(id: string): SimsInstance | null {
  const [instance, setInstance] = useState<SimsInstance | null>(null)
  useEffect(() => {
    let alive = true
    const apply = (next: AppSettings): void => {
      if (alive) setInstance(next.sims.instances.find(item => item.id === id) ?? null)
    }
    void window.api
      .getSettings()
      .then(apply)
      .catch(() => undefined)
    const off = window.api.onSettingsChanged(apply)
    return () => {
      alive = false
      off()
    }
  }, [id])
  return instance
}

function useSimsGroup(groupId: string | undefined): SimsState | null {
  const [state, setState] = useState<SimsState | null>(null)
  useEffect(() => {
    if (!groupId) return
    let alive = true
    const apply = (groups: Record<string, SimsState>): void => {
      if (alive) setState(groups[groupId] ?? null)
    }
    void window.api
      .getSims()
      .then(apply)
      .catch(() => undefined)
    const off = window.api.onSimsChanged(apply)
    return () => {
      alive = false
      off()
    }
  }, [groupId])
  return state
}

function Plumbob({ spinning, color }: { spinning: boolean; color: string }): ReactElement {
  return (
    <div
      className={`plumbob-3d${spinning ? ' is-spinning' : ''}`}
      style={{ '--sims-color': color } as CSSProperties}
    >
      <div className="plumbob-3d__glow" />
      <div className="plumbob-3d__gem">
        {[0, 30, 60, 90, 120, 150].map(angle => (
          <span
            className="plumbob-3d__facet"
            key={angle}
            style={{ transform: `rotateY(${angle}deg)` }}
          />
        ))}
      </div>
      <span className="plumbob-3d__shine" />
    </div>
  )
}

export function SimsWidget({ instanceId }: { instanceId: string }): ReactElement | null {
  const instance = useSimsInstance(instanceId)
  const state = useSimsGroup(instance?.groupId)
  const [worsen, setWorsen] = useState(false)

  if (!instance) {
    return (
      <div className="widget sims">
        <div className="sims__empty">Пламбоб удалён</div>
      </div>
    )
  }

  const settings = instance.settings
  const style = instance.style ?? defaultWindowStyle()
  const mood = state?.mood ?? 50
  const color = moodColor(mood)
  const unlocked = state?.unlocked.length ?? 0

  const act = (action: SimsAction, need: SimsNeed): void => {
    if (!state) return
    void window.api.simsAction(state.groupId, worsen ? 'worsen' : action, need, settings.difficulty)
  }

  return (
    <div
      className={`widget sims${instance.mode === 'needs' ? ' sims--needs' : ' sims--plumbob'} sims-anim-${settings.animation}${instance.locked ? ' is-locked' : ''} ${windowStyleClass(style)}`}
      style={{ ...windowStyleVars(style), '--sims-color': color } as CSSProperties}
      onContextMenu={event => {
        event.preventDefault()
        void window.api.showContextMenu()
      }}
    >
      <WindowStyleLayers style={style} accent />

      {!state && <div className="sims__empty">Состояние группы не найдено</div>}

      {state && instance.mode === 'plumbob' && (
        <>
          <div className="plumbob-stage">
            <Plumbob spinning={settings.animation === 'spin'} color={color} />
            {settings.bling && (
              <div
                className="sims-bling"
                style={{ '--bling': settings.blingIntensity } as CSSProperties}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7].map(index => (
                  <span key={index} className={`sims-bling__spark sims-bling__spark--${index}`} />
                ))}
              </div>
            )}
          </div>
          {settings.showLabel && (
            <div className="sims__label">
              <span className="sims__label-name">{settings.label || 'Пламбоб'}</span>
              <span className="sims__caption">
                {moodLabel(mood)} · {moodState(state)}
              </span>
            </div>
          )}
          <div className="sims__scoreline">
            {settings.showPoints && <span className="sims__points">★ {state.points}</span>}
            {settings.showDifficulty && (
              <span
                className={`sims__difficulty${settings.difficulty === 'hard' ? ' is-hard' : ''}`}
              >
                {settings.difficulty === 'hard' ? 'хард' : 'лайт'}
              </span>
            )}
            {settings.showMoodValue && <span className="sims__moodvalue">{mood}</span>}
          </div>
        </>
      )}

      {state && instance.mode === 'needs' && (
        <>
          <div className="sims__head">
            <span className="sims__dot" style={{ background: color }} />
            <div className="sims__headtext">
              <div className="sims__title">Потребности</div>
              <div className="sims__caption">
                {moodLabel(mood)} · {moodState(state)}
              </div>
            </div>
            <span className="sims__mood">{mood}</span>
            <button
              type="button"
              className="sims__trophy"
              title="Награды"
              onClick={() => void window.api.openSimsRewards(instanceId)}
            >
              🏆 {unlocked}/{SIMS_ACHIEVEMENTS.length}
            </button>
          </div>

          <div className="sims__needs">
            {SIMS_NEEDS.filter(need => settings.showNeeds[need.key]).map(need => (
              <div className="sims-need" key={need.key}>
                <span className="sims-need__label">{need.label}</span>
                <span className="sims-need__track">
                  <span
                    className="sims-need__fill"
                    style={{ width: `${state[need.key]}%`, background: moodColor(state[need.key]) }}
                  />
                </span>
                <span className="sims-need__value">{state[need.key]}</span>
              </div>
            ))}
          </div>

          <div className="sims__actions">
            {SIMS_NEEDS.filter(need => settings.showNeeds[need.key]).map(need => (
              <button
                type="button"
                key={need.key}
                className={worsen ? 'is-worsen' : ''}
                onClick={() => act(need.action, need.key)}
                title={worsen ? `Ухудшить: ${need.label}` : need.label}
              >
                {need.label}
              </button>
            ))}
            <button
              type="button"
              className={`sims__worsen${worsen ? ' is-active' : ''}`}
              onClick={() => setWorsen(value => !value)}
            >
              {worsen ? 'Улучшить' : 'Ухудшить'}
            </button>
          </div>

          <div className="sims__meta">
            <span>★ {state.points}</span>
            <span>{settings.difficulty === 'hard' ? 'хард' : 'лайт'}</span>
            <span>{state.stats.actions} действий</span>
          </div>
        </>
      )}
    </div>
  )
}
