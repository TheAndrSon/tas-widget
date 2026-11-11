import { useEffect, useRef, useState, type ReactElement } from 'react'
import type { City } from '@shared/types'
import { CITY_PRESETS } from '@shared/defaults'

export function CityPicker({
  city,
  onPick
}: {
  city: City | null
  onPick: (city: City) => void
}): ReactElement {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<City[]>([])
  const [busy, setBusy] = useState(false)
  const [focused, setFocused] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    const text = query.trim()
    if (text.length < 2) {
      setResults([])
      setBusy(false)
      return
    }
    const id = ++requestId.current
    setBusy(true)
    const timer = setTimeout(async () => {
      try {
        const found = await window.api.searchCity(text)
        if (requestId.current === id) {
          setResults(found)
          setBusy(false)
        }
      } catch {
        if (requestId.current === id) {
          setResults([])
          setBusy(false)
        }
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [query])

  const pick = (next: City): void => {
    onPick(next)
    setQuery('')
    setResults([])
    setFocused(false)
  }

  const showPresets = query.trim().length < 2 && focused

  return (
    <div className="city-picker">
      <div className="city-picker__current">
        <div>
          <div className="city-picker__name">{city?.name ?? 'Город не выбран'}</div>
          <div className="city-picker__meta">
            {city
              ? [city.admin1, city.country].filter(Boolean).join(', ')
              : 'Выберите город из списка'}
          </div>
        </div>
      </div>

      <div className="search">
        <input
          type="text"
          value={query}
          placeholder="Найти город…"
          onChange={event => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
        />
        {busy && <span className="search__spinner" />}
      </div>

      {showPresets && (
        <div className="city-presets">
          {CITY_PRESETS.map(preset => (
            <button type="button" key={preset.id} onClick={() => pick(preset)}>
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="city-results">
          {results.map(item => (
            <button type="button" key={`${item.id}-${item.lat}`} onClick={() => pick(item)}>
              <span className="city-results__name">{item.name}</span>
              <span className="city-results__region">
                {[item.admin1, item.country].filter(Boolean).join(', ')}
              </span>
            </button>
          ))}
        </div>
      )}

      {!busy && query.trim().length >= 2 && results.length === 0 && (
        <div className="city-empty">Город не найден</div>
      )}
    </div>
  )
}
