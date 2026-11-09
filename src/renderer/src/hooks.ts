import { useEffect, useRef, useState } from 'react'
import type {
  City,
  MusicSnapshot,
  PersistedState,
  WeatherProvider,
  WeatherSnapshot,
  WeatherUnits
} from '@shared/types'
export function useAppState(): PersistedState | null {
  const [state, setState] = useState<PersistedState | null>(null)
  useEffect(() => {
    let alive = true
    window.widgets
      .getState()
      .then((next) => {
        if (alive) setState(next)
      })
      .catch(() => undefined)
    const off = window.widgets.onState((next) => setState(next))
    return () => {
      alive = false
      off()
    }
  }, [])
  return state
}

export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}

export function useMusicSnapshot(): MusicSnapshot | null {
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
    window.widgets
      .getMusic()
      .then(apply)
      .catch(() => undefined)
    const off = window.widgets.onMusic(apply)
    return () => {
      alive = false
      off()
    }
  }, [])

  return snapshot
}

interface WeatherState {
  data: WeatherSnapshot | null
  error: string | null
  loading: boolean
}

export function useWeather(
  city: City | null,
  units: WeatherUnits,
  provider: WeatherProvider,
  yandexKey = ''
): WeatherState {
  const [state, setState] = useState<WeatherState>({ data: null, error: null, loading: false })
  const key = city ? `${city.lat.toFixed(3)},${city.lon.toFixed(3)}` : ''

  useEffect(() => {
    if (!city) {
      setState({ data: null, error: 'Город не выбран', loading: false })
      return
    }
    let alive = true
    const hasData = { current: false }
    const failed = { current: false }
    setState({ data: null, error: null, loading: true })

    const load = async (): Promise<void> => {
      setState((prev) => ({ ...prev, loading: !prev.data }))
      const result = await window.widgets.getWeather(city, units, provider, yandexKey)
      if (!alive) return
      if (result.ok) {
        hasData.current = true
        failed.current = false
        setState({ data: result.data, error: null, loading: false })
      } else {
        failed.current = true
        setState((prev) => ({ ...prev, error: result.error, loading: false }))
      }
    }

    void load()
    const retry = setInterval(() => {
      if (!hasData.current || failed.current) void load()
    }, 60_000)
    const refresh = setInterval(() => void load(), 10 * 60 * 1000)
    return () => {
      alive = false
      clearInterval(retry)
      clearInterval(refresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, units, provider])

  return state
}
