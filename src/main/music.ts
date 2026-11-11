import { spawn, type ChildProcess } from 'node:child_process'
import type { MusicAction, MusicSnapshot, MusicStatus } from '../shared/types'
import { resourcePath } from './paths'

function toDataUrl(base64: string): string | null {
  if (!base64) return null
  let mime = 'image/jpeg'
  if (base64.startsWith('iVBOR')) mime = 'image/png'
  else if (base64.startsWith('UklGR')) mime = 'image/webp'
  else if (base64.startsWith('R0lGOD')) mime = 'image/gif'
  else if (base64.startsWith('/9j/')) mime = 'image/jpeg'
  else if (!base64.startsWith('/')) return null
  return `data:${mime};base64,${base64}`
}

function mapStatus(value: unknown): MusicStatus {
  switch (value) {
    case 'playing':
    case 'paused':
    case 'stopped':
    case 'closed':
    case 'unavailable':
      return value
    default:
      return 'stopped'
  }
}

function friendlySource(source?: string): string | undefined {
  if (!source) return undefined
  const raw = source.replace(/\.exe$/i, '').trim()
  const lower = raw.toLowerCase()
  if (lower.includes('yandex')) return 'Яндекс Музыка'
  if (lower.includes('spotify')) return 'Spotify'
  if (lower.includes('aimp')) return 'AIMP'
  if (lower.includes('foobar')) return 'foobar2000'
  if (lower.includes('vlc')) return 'VLC'
  if (lower.includes('chrome')) return 'Chrome'
  if (lower.includes('firefox')) return 'Firefox'
  if (lower.includes('edge')) return 'Edge'
  if (lower.includes('zunemusic') || lower.includes('mediaplayer')) return 'Media Player'
  return raw.replace(/([a-z])([A-Z])/g, '$1 $2')
}

interface ArtCache {
  key: string
  dataUrl: string
}

interface PlayClock {
  positionMs: number
  at: number
  reported: number
  trackKey: string
  rate: number
}

export class MusicService {
  private snapshot: MusicSnapshot = { status: 'stopped', updatedAt: Date.now() }
  private play: PlayClock = { positionMs: 0, at: Date.now(), reported: -1, trackKey: '', rate: 1 }
  private art: ArtCache | null = null
  private proc: ChildProcess | null = null
  private buffer = ''
  private restartTimer: NodeJS.Timeout | null = null
  private stopped = true
  private listeners = new Set<(snap: MusicSnapshot) => void>()

  start(): void {
    if (!this.stopped) return
    this.stopped = false
    this.launch()
  }

  stop(): void {
    this.stopped = true
    if (this.restartTimer) {
      clearTimeout(this.restartTimer)
      this.restartTimer = null
    }
    if (this.proc && !this.proc.killed) {
      this.proc.kill()
      this.proc = null
    }
  }

  onUpdate(listener: (snap: MusicSnapshot) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot(): MusicSnapshot {
    return {
      ...this.snapshot,
      artwork: this.art?.dataUrl,
      artworkKey: this.art?.key
    }
  }

  control(action: MusicAction, positionMs?: number): void {
    if (action === 'seek') {
      this.seek(positionMs ?? 0)
      return
    }
    this.runControl([action])
  }

  seek(positionMs: number): void {
    const duration = this.snapshot.durationMs ?? 0
    const clamped = Math.max(0, duration > 0 ? Math.min(duration, positionMs) : positionMs)
    const now = Date.now()
    this.play = {
      positionMs: clamped,
      at: now,
      reported: clamped,
      trackKey: this.play.trackKey,
      rate: this.play.rate
    }
    this.snapshot = { ...this.snapshot, positionMs: clamped, updatedAt: now }
    this.emit({ ...this.snapshot })
    this.runControl(['seek', String(Math.round(clamped))])
  }

  private runControl(args: string[]): void {
    try {
      const child = spawn(
        'powershell.exe',
        [
          '-NoLogo',
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          resourcePath('smtc-control.ps1'),
          ...args
        ],
        { windowsHide: true, stdio: 'ignore' }
      )
      child.on('error', error => console.error('[music] control error', error.message))
    } catch (error) {
      console.error('[music] control failed', error)
    }
  }

  private launch(): void {
    if (this.stopped) return
    const script = resourcePath('smtc.ps1')
    try {
      this.proc = spawn(
        'powershell.exe',
        ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script],
        { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }
      )
    } catch (error) {
      this.fail(error instanceof Error ? error.message : String(error))
      return
    }

    this.buffer = ''
    this.proc.stdout?.setEncoding('utf8')
    this.proc.stdout?.on('data', (chunk: string) => this.onData(chunk))
    this.proc.stderr?.setEncoding('utf8')
    this.proc.stderr?.on('data', (chunk: string) => {
      const text = String(chunk).trim()
      if (text) console.error('[music] smtc:', text.slice(0, 400))
    })
    this.proc.on('error', error => this.fail(error.message))
    this.proc.on('exit', () => {
      this.proc = null
      if (this.stopped) return
      this.fail('Медиа-сессия недоступна')
      this.restartTimer = setTimeout(() => this.launch(), 8000)
    })
  }

  private fail(message: string): void {
    const snapshot: MusicSnapshot = {
      status: 'unavailable',
      updatedAt: Date.now(),
      error: message
    }
    this.snapshot = snapshot
    this.emit(snapshot)
  }

  private onData(chunk: string): void {
    this.buffer += chunk
    let index = this.buffer.indexOf('\n')
    while (index !== -1) {
      const line = this.buffer.slice(0, index).trim()
      this.buffer = this.buffer.slice(index + 1)
      if (line.startsWith('{')) this.handleLine(line)
      index = this.buffer.indexOf('\n')
    }
    if (this.buffer.length > 4_000_000) this.buffer = ''
  }

  private handleLine(line: string): void {
    let raw: Record<string, unknown>
    try {
      raw = JSON.parse(line) as Record<string, unknown>
    } catch {
      return
    }

    let artwork: string | undefined
    if (typeof raw.artwork === 'string') {
      const dataUrl = toDataUrl(raw.artwork)
      if (dataUrl) {
        const key = String(raw.artworkKey ?? `${raw.title ?? ''}|${raw.artist ?? ''}`)
        this.art = { key, dataUrl }
        artwork = dataUrl
      }
    }

    const now = Date.now()
    const status = mapStatus(raw.status)
    const title = typeof raw.title === 'string' ? raw.title.trim() : ''
    const artist = typeof raw.artist === 'string' ? raw.artist.trim() : ''
    const duration = typeof raw.durationMs === 'number' ? Math.max(0, raw.durationMs) : 0
    const reported = typeof raw.positionMs === 'number' ? Math.max(0, raw.positionMs) : 0
    const rateValue = typeof raw.playbackRate === 'number' ? raw.playbackRate : 1
    const rate = rateValue > 0 && rateValue < 16 ? rateValue : 1
    const trackKey = `${title}|${artist}|${duration}|${raw.source ?? ''}`

    if (trackKey !== this.play.trackKey) {
      this.play = { positionMs: reported, at: now, reported, trackKey, rate }
    } else if (status === 'playing') {
      const delta = now - this.play.at
      // Позиция трека идёт в медиа-времени: при 1.5× она растёт в 1.5 раза быстрее.
      const estimated = this.play.positionMs + delta * this.play.rate
      const reportChanged = Math.abs(reported - this.play.reported) >= 800
      // Если плеер присылает новую позицию — доверяем ей. Если позиция «залипла»
      // (так бывает у браузерных сессий), продолжаем считать время сами.
      this.play.positionMs = reportChanged ? reported : Math.max(0, estimated)
      this.play.at = now
      this.play.reported = reported
      this.play.rate = rate
    } else {
      // Пауза: сохраняем последнюю оценку, если плеер не прислал новую позицию.
      const reportChanged = Math.abs(reported - this.play.reported) >= 800
      if (reportChanged && reported > 0) {
        this.play.positionMs = reported
      }
      this.play.at = now
      this.play.reported = reported
      this.play.rate = rate
    }

    const snapshot: MusicSnapshot = {
      status,
      title: title || undefined,
      artist: artist || undefined,
      album: typeof raw.album === 'string' && raw.album.trim() ? raw.album.trim() : undefined,
      source: friendlySource(typeof raw.source === 'string' ? raw.source : undefined),
      positionMs: Math.round(this.play.positionMs),
      durationMs: duration || undefined,
      playbackRate: rate,
      canPlay: Boolean(raw.canPlay),
      canNext: Boolean(raw.canNext),
      canPrev: Boolean(raw.canPrev),
      canSeek: Boolean(raw.canSeek),
      artworkKey: this.art?.key,
      updatedAt: now,
      error: typeof raw.error === 'string' ? raw.error : undefined
    }

    this.snapshot = snapshot
    this.emit(artwork ? { ...snapshot, artwork } : snapshot)
  }

  private emit(snapshot: MusicSnapshot): void {
    for (const listener of this.listeners) {
      try {
        listener(snapshot)
      } catch (error) {
        console.error('[music] listener error', error)
      }
    }
  }
}
