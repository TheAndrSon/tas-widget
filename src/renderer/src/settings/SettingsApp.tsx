import { useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import type { AppSettings, SettingsPatch, WeatherProvider, WidgetId } from '@shared/types'
import { WIDGETS } from '@shared/widgets'
import { CityPicker } from './CityPicker'

const TAB_ORDER: WidgetId[] = ['system', 'music', 'weather', 'equalizer', 'plumbob']

const TAB_HINTS: Record<WidgetId, string> = {
  system: 'Процессор, память и загрузка дисков',
  music: 'Трек из любого плеера через Windows SMTC',
  weather: 'Погода по городу, без ключей и регистрации',
  equalizer: 'Аудиовизуализация для рабочего стола',
  plumbob: 'Кристалл над симом'
}

function Switch({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (value: boolean) => void
}): ReactElement {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span className="switch__track">
        <span className="switch__thumb" />
      </span>
    </label>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}): ReactElement {
  return (
    <div className="segmented">
      {options.map(option => (
        <button
          type="button"
          key={option.value}
          className={option.value === value ? 'is-active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

interface PanelProps {
  settings: AppSettings
  patch: (value: SettingsPatch) => void
  toggleWidget: (id: WidgetId, enabled: boolean) => void
}

function SystemPanel({ settings, patch, toggleWidget }: PanelProps): ReactElement {
  return (
    <section className="panel">
      <div className="row">
        <div className="row__text">
          <span className="row__label">Показывать виджет</span>
          <span className="row__hint">Окно на рабочем столе поверх остальных приложений</span>
        </div>
        <Switch
          checked={settings.widgets.system.enabled}
          onChange={value => toggleWidget('system', value)}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Период опроса</span>
          <span className="row__hint">Как часто обновлять процессор, память и диски</span>
        </div>
        <select
          className="select"
          value={settings.system.intervalMs}
          onChange={event => patch({ system: { intervalMs: Number(event.target.value) } })}
        >
          <option value={1000}>1 секунда</option>
          <option value={2000}>2 секунды</option>
          <option value={5000}>5 секунд</option>
          <option value={10000}>10 секунд</option>
        </select>
      </div>

      <p className="note">
        Позиция окна запоминается автоматически. Скрыть виджет или открыть настройки можно правым
        кликом по нему.
      </p>
    </section>
  )
}

function MusicPanel({ settings, patch, toggleWidget }: PanelProps): ReactElement {
  const music = settings.music

  return (
    <section className="panel">
      <div className="row">
        <div className="row__text">
          <span className="row__label">Показывать виджет</span>
          <span className="row__hint">Трек из системной медиа-сессии Windows</span>
        </div>
        <Switch
          checked={settings.widgets.music.enabled}
          onChange={value => toggleWidget('music', value)}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Обложка</span>
          <span className="row__hint">Обложка альбома из медиа-сессии</span>
        </div>
        <Switch checked={music.showArt} onChange={value => patch({ music: { showArt: value } })} />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Прогресс и время</span>
          <span className="row__hint">Шкала трека с перемоткой по клику</span>
        </div>
        <Switch
          checked={music.showProgress}
          onChange={value => patch({ music: { showProgress: value } })}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Кнопки управления</span>
          <span className="row__hint">Предыдущий трек, пауза и следующий трек</span>
        </div>
        <Switch
          checked={music.showControls}
          onChange={value => patch({ music: { showControls: value } })}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Название плеера</span>
          <span className="row__hint">Яндекс Музыка, Spotify, AIMP и другие</span>
        </div>
        <Switch
          checked={music.showSource}
          onChange={value => patch({ music: { showSource: value } })}
        />
      </div>

      <p className="note">
        Виджет работает через Windows SMTC и не требует настройки плеера. Позиция окна запоминается
        автоматически.
      </p>
    </section>
  )
}

function WeatherPanel({ settings, patch, toggleWidget }: PanelProps): ReactElement {
  const weather = settings.weather

  return (
    <section className="panel">
      <div className="row">
        <div className="row__text">
          <span className="row__label">Показывать виджет</span>
          <span className="row__hint">Текущая погода, прогноз и солнце на рабочем столе</span>
        </div>
        <Switch
          checked={settings.widgets.weather.enabled}
          onChange={value => toggleWidget('weather', value)}
        />
      </div>

      <div className="row row--stacked">
        <div className="row__text">
          <span className="row__label">Город</span>
          <span className="row__hint">Поиск по всему миру через Open-Meteo</span>
        </div>
        <CityPicker city={weather.city} onPick={city => patch({ weather: { city } })} />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Единицы</span>
          <span className="row__hint">Температура и скорость ветра</span>
        </div>
        <Segmented
          value={weather.units}
          options={[
            { value: 'metric', label: '°C' },
            { value: 'imperial', label: '°F' }
          ]}
          onChange={value => patch({ weather: { units: value } })}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Источник</span>
          <span className="row__hint">
            Open-Meteo по умолчанию; MET Norway и wttr.in дают другую картину осадков
          </span>
        </div>
        <select
          className="select"
          value={weather.provider}
          onChange={event =>
            patch({ weather: { provider: event.target.value as WeatherProvider } })
          }
        >
          <option value="open-meteo">Open-Meteo</option>
          <option value="metno">MET Norway</option>
          <option value="wttr">wttr.in</option>
          <option value="yandex">Яндекс.Погода</option>
        </select>
      </div>

      {weather.provider === 'yandex' && (
        <div className="row">
          <div className="row__text">
            <span className="row__label">Ключ Яндекс.Погоды</span>
            <span className="row__hint">
              Хранится локально; при ошибке используется резервный источник
            </span>
          </div>
          <input
            className="text-input"
            type="password"
            value={weather.yandexKey}
            placeholder="X-Yandex-API-Key"
            onChange={event => patch({ weather: { yandexKey: event.target.value } })}
          />
        </div>
      )}

      <div className="row">
        <div className="row__text">
          <span className="row__label">Атмосфера по времени суток</span>
          <span className="row__hint">Рассвет, солнце, закат, луна и звёзды</span>
        </div>
        <Switch
          checked={weather.atmosphere}
          onChange={value => patch({ weather: { atmosphere: value } })}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Прогноз</span>
          <span className="row__hint">Сколько дней показывать</span>
        </div>
        <Segmented
          value={String(weather.forecastDays)}
          options={[
            { value: '0', label: 'Без' },
            { value: '3', label: '3 дня' },
            { value: '5', label: '5 дней' }
          ]}
          onChange={value => patch({ weather: { forecastDays: Number(value) as 0 | 3 | 5 } })}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Солнце</span>
          <span className="row__hint">Восход, закат и длина светового дня</span>
        </div>
        <Segmented
          value={weather.sunMode}
          options={[
            { value: 'off', label: 'Нет' },
            { value: 'compact', label: 'Компактно' },
            { value: 'arc', label: 'Дуга' }
          ]}
          onChange={value => patch({ weather: { sunMode: value } })}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Название города</span>
        </div>
        <Switch
          checked={weather.showCity}
          onChange={value => patch({ weather: { showCity: value } })}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Ощущается как</span>
        </div>
        <Switch
          checked={weather.showFeelsLike}
          onChange={value => patch({ weather: { showFeelsLike: value } })}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Ветер</span>
        </div>
        <Switch
          checked={weather.showWind}
          onChange={value => patch({ weather: { showWind: value } })}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Влажность</span>
        </div>
        <Switch
          checked={weather.showHumidity}
          onChange={value => patch({ weather: { showHumidity: value } })}
        />
      </div>

      <p className="note">
        Погода обновляется каждые 10 минут. Позиция окна запоминается автоматически.
      </p>
    </section>
  )
}

function PlannedPanel({ id }: { id: WidgetId }): ReactElement {
  return (
    <section className="panel panel--empty">
      <div className="empty__badge">скоро</div>
      <h2 className="empty__title">{WIDGETS[id].title}</h2>
      <p className="empty__text">
        {TAB_HINTS[id]}. Виджет появится в одном из ближайших обновлений — следи за роадмапом в
        docs/PROJECT_GUIDE.md.
      </p>
    </section>
  )
}

export function SettingsApp(): ReactElement {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [tab, setTab] = useState<WidgetId>('system')

  const refresh = useCallback(async () => {
    setSettings(await window.api.getSettings())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const patch = useCallback(async (value: SettingsPatch) => {
    setSettings(await window.api.patchSettings(value))
  }, [])

  const toggleWidget = useCallback(
    async (id: WidgetId, enabled: boolean) => {
      if (enabled) await window.api.openWidget(id)
      else await window.api.closeWidget(id)
      await refresh()
    },
    [refresh]
  )

  return (
    <div className="settings">
      <aside className="settings__side">
        <div className="brand">
          <span className="brand__logo">T</span>
          <div className="brand__text">
            <strong>TAS Widget</strong>
            <span>настройки</span>
          </div>
        </div>

        <nav className="nav">
          {TAB_ORDER.map(id => (
            <button
              type="button"
              key={id}
              className={`nav__item ${tab === id ? 'is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              <span>{WIDGETS[id].title}</span>
              {!WIDGETS[id].ready && <span className="nav__badge">скоро</span>}
            </button>
          ))}
        </nav>

        <div className="settings__foot">Изменения сохраняются автоматически</div>
      </aside>

      <main className="settings__main">
        <header className="settings__head">
          <h1>{WIDGETS[tab].title}</h1>
          <p>{TAB_HINTS[tab]}</p>
        </header>

        {!settings && <div className="loading">Загружаю настройки…</div>}

        {settings && tab === 'system' && (
          <SystemPanel settings={settings} patch={patch} toggleWidget={toggleWidget} />
        )}

        {settings && tab === 'music' && (
          <MusicPanel settings={settings} patch={patch} toggleWidget={toggleWidget} />
        )}

        {settings && tab === 'weather' && (
          <WeatherPanel settings={settings} patch={patch} toggleWidget={toggleWidget} />
        )}

        {settings && tab !== 'system' && tab !== 'music' && tab !== 'weather' && (
          <PlannedPanel id={tab} />
        )}
      </main>
    </div>
  )
}
