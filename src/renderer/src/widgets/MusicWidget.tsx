import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement
} from 'react'
import type { AppSettings, MusicSettings, MusicSnapshot } from '@shared/types'
import { IconNext, IconNote, IconPause, IconPlay, IconPrev } from './icons'
import { useWidgetPlacement } from './useWidgetPlacement'
import './MusicWidget.css'

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0:00'
  const total = Math.floor(ms / 1000)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function useMusicSnapshot(): MusicSnapshot | null {
  const [snapshot, setSnapshot] = useState<MusicSnapshot | null>(null)
  const artRef = useRef<{ key?: string; url?: string }>({})

  useEffect(() => {
    let alive = true
    const apply = (next: MusicSnapshot): void => {
      if (!alive) return
      if (next.artwork && next.artworkKey) {
        artRef.current = { key: next.artworkKey, url: next.artwork }
      }
      const cached = artRef.current
      setSnapshot({
        ...next,
        artwork: cached.key && cached.key === next.artworkKey ? cached.url : undefined
      })
    }
    window.api
      .getMusic()
      .then(apply)
      .catch(() => undefined)
    const off = window.api.onMusicSample(apply)
    return () => {
      alive = false
      off()
    }
  }, [])

  return snapshot
}

function useMusicSettings(): MusicSettings | null {
  const [settings, setSettings] = useState<MusicSettings | null>(null)

  useEffect(() => {
    let alive = true
    const apply = (next: AppSettings): void => {
      if (alive) setSettings(next.music)
    }
    window.api
      .getSettings()
      .then(apply)
      .catch(() => undefined)
    const off = window.api.onSettingsChanged(apply)
    return () => {
      alive = false
      off()
    }
  }, [])

  return settings
}

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

export function MusicWidget(): ReactElement | null {
  const snapshot = useMusicSnapshot()
  const placement = useWidgetPlacement('music')
  const settings = useMusicSettings()
  const { position, duration } = useProgress(snapshot)
  const barRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ ratio: number } | null>(null)

  if (!settings) return null

  const hasTrack =
    snapshot !== null &&
    snapshot.status !== 'unavailable' &&
    snapshot.status !== 'closed' &&
    snapshot.status !== 'stopped' &&
    Boolean(snapshot.title)

  const onContextMenu = (event: ReactMouseEvent<HTMLDivElement>): void => {
    event.preventDefault()
    void window.api.showContextMenu()
  }

  if (!hasTrack) {
    const hint =
      snapshot?.status === 'unavailable'
        ? 'Не удалось подключиться к медиа-сессии'
        : 'Включите музыку в Яндекс Музыке или другом плеере'
    return (
      <div
        className={`widget music music--empty${placement?.locked ? ' is-locked' : ''}`}
        onContextMenu={onContextMenu}
      >
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

  const control =
    (action: 'toggle' | 'next' | 'prev') =>
    (event: ReactMouseEvent<HTMLButtonElement>): void => {
      event.currentTarget.blur()
      window.api.musicControl(action)
    }

  const seekTo = (clientX: number): void => {
    const bar = barRef.current
    if (!bar || duration <= 0) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    window.api.musicControl('seek', Math.round(ratio * duration))
  }

  const onBarPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    event.stopPropagation()
    seekTo(event.clientX)
  }

  const onBarPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (duration <= 0) return
    const bar = barRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    setHover({ ratio: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)) })
  }

  return (
    <div
      className={`widget music${placement?.locked ? ' is-locked' : ''}`}
      onContextMenu={onContextMenu}
    >
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
          <div className="music__progress is-seekable">
            <div
              className="music__bar no-drag"
              ref={barRef}
              onPointerDown={onBarPointerDown}
              onPointerMove={onBarPointerMove}
              onPointerLeave={() => setHover(null)}
              title="Нажмите, чтобы перемотать"
            >
              {hover && (
                <div className="music__bar-ghost" style={{ width: `${hover.ratio * 100}%` }} />
              )}
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

        {settings.showControls && (
          <div className="music__controls no-drag">
            <button
              type="button"
              className="music__ctrl"
              title="Предыдущий трек"
              onClick={control('prev')}
              disabled={snapshot.canPrev === false}
            >
              <IconPrev size={13} />
            </button>
            <button
              type="button"
              className="music__ctrl music__ctrl--main"
              title={playing ? 'Пауза' : 'Играть'}
              onClick={control('toggle')}
            >
              {playing ? <IconPause size={14} /> : <IconPlay size={14} />}
            </button>
            <button
              type="button"
              className="music__ctrl"
              title="Следующий трек"
              onClick={control('next')}
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
