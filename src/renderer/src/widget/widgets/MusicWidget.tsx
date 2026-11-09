import { useEffect, useRef, useState, type JSX, type PointerEvent as ReactPointerEvent } from 'react'
import type { MusicSettings, MusicSnapshot } from '@shared/types'
import { useMusicSnapshot } from '../../hooks'
import { formatDuration } from '../../format'
import { IconNext, IconNote, IconPause, IconPlay, IconPrev } from '../../ui/icons'

function useProgress(snapshot: MusicSnapshot | null): { position: number; duration: number } {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [])

  if (!snapshot) return { position: 0, duration: 0 }
  const duration = snapshot.durationMs ?? 0
  const base = snapshot.positionMs ?? 0
  const rate = snapshot.playbackRate && snapshot.playbackRate > 0 ? snapshot.playbackRate : 1
  const elapsed = snapshot.status === 'playing' ? Math.max(0, now - snapshot.updatedAt) * rate : 0
  const position = duration > 0 ? Math.min(duration, base + elapsed) : base
  return { position: Math.max(0, position), duration }
}

export function MusicWidget({
  settings,
  interactive
}: {
  settings: MusicSettings
  interactive: boolean
}): JSX.Element {
  const snapshot = useMusicSnapshot()
  const { position, duration } = useProgress(snapshot)
  const barRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ ratio: number } | null>(null)

  const hasTrack =
    snapshot !== null &&
    snapshot.status !== 'unavailable' &&
    snapshot.status !== 'closed' &&
    snapshot.status !== 'stopped' &&
    Boolean(snapshot.title)

  if (!hasTrack) {
    const hint =
      snapshot?.status === 'unavailable'
        ? 'Не удалось подключиться к медиа-сессии'
        : 'Включите музыку в Яндекс Музыке или другом плеере'
    return (
      <div className="music music--empty">
        <div className="music__art music__art--empty">
          <IconNote size={22} />
        </div>
        <div className="music__body">
          <div className="music__title">Ничего не играет</div>
          <div className="music__sub">{hint}</div>
        </div>
      </div>
    )
  }

  const percent = duration > 0 ? Math.min(100, (position / duration) * 100) : 0
  const playing = snapshot.status === 'playing'

  const seekTo = (clientX: number): void => {
    const bar = barRef.current
    if (!bar || duration <= 0) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    window.widgets.musicControl('seek', Math.round(ratio * duration))
  }

  const onBarPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!interactive) return
    event.preventDefault()
    event.stopPropagation()
    seekTo(event.clientX)
  }

  const onBarPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!interactive || duration <= 0) return
    const bar = barRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    setHover({ ratio: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) })
  }

  return (
    <div className="music">
      {settings.showArt && (
        <div className="music__art">
          {snapshot.artwork ? (
            <img src={snapshot.artwork} alt="" draggable={false} />
          ) : (
            <div className="music__art-fallback">
              <IconNote size={22} />
            </div>
          )}
        </div>
      )}

      <div className="music__body">
        <div className="music__title" title={snapshot.title}>
          {snapshot.title}
        </div>
        <div className="music__sub" title={snapshot.artist}>
          <span className="music__artist">{snapshot.artist ?? 'Неизвестный исполнитель'}</span>
          {settings.showSource && snapshot.source && (
            <>
              <span className="music__dot">·</span>
              <span className="music__source">{snapshot.source}</span>
            </>
          )}
          {!playing && <span className="music__state">пауза</span>}
        </div>

        {settings.showProgress && duration > 0 && (
          <div className={`music__progress${interactive ? ' is-seekable' : ''}`}>
            <div
              className="music__bar no-drag"
              ref={barRef}
              onPointerDown={onBarPointerDown}
              onPointerMove={onBarPointerMove}
              onPointerLeave={() => setHover(null)}
              title={interactive ? 'Нажмите, чтобы перемотать' : undefined}
            >
              {hover && <div className="music__bar-ghost" style={{ width: `${hover.ratio * 100}%` }} />}
              <div className="music__bar-fill" style={{ width: `${percent}%` }}>
                <span className="music__bar-knob" />
              </div>
            </div>
            <div className="music__times">
              <span>{formatDuration(position)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>
        )}

        {settings.showControls && interactive && (
          <div className="music__controls no-drag">
            <button
              className="music__ctrl"
              title="Предыдущий трек"
              onClick={() => window.widgets.musicControl('prev')}
              disabled={snapshot.canPrev === false}
            >
              <IconPrev size={13} />
            </button>
            <button
              className="music__ctrl music__ctrl--main"
              title={playing ? 'Пауза' : 'Играть'}
              onClick={() => window.widgets.musicControl('toggle')}
            >
              {playing ? <IconPause size={14} /> : <IconPlay size={14} />}
            </button>
            <button
              className="music__ctrl"
              title="Следующий трек"
              onClick={() => window.widgets.musicControl('next')}
              disabled={snapshot.canNext === false}
            >
              <IconNext size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
