import { useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import type {
  AppSettings,
  City,
  EqualizerSettings,
  SettingsPatch,
  VisualizerSettings,
  WeatherInstancePatch,
  WeatherProvider,
  WeatherSettings,
  WidgetId
} from '@shared/types'
import { MAX_WEATHER_CITIES } from '@shared/defaults'
import { VISUALIZER_MODES, VISUALIZER_PALETTES } from '@shared/visualizer'
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
  refresh: () => Promise<void>
}

function Range({
  value,
  onChange
}: {
  value: number
  onChange: (value: number) => void
}): ReactElement {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <div className="slider">
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(local * 100)}
        onChange={event => {
          const next = Number(event.target.value) / 100
          setLocal(next)
          onChange(next)
        }}
      />
      <span className="slider__value">{Math.round(local * 100)}%</span>
    </div>
  )
}

function Slider({
  min,
  max,
  step,
  value,
  onChange,
  format
}: {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  format: (value: number) => string
}): ReactElement {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <div className="range">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={local}
        onChange={event => {
          const next = Number(event.target.value)
          setLocal(next)
          onChange(next)
        }}
      />
      <span className="range__value">{format(local)}</span>
    </div>
  )
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

function VisualizerControls({
  value,
  onChange
}: {
  value: VisualizerSettings
  onChange: (next: VisualizerSettings) => void
}): ReactElement {
  const set = (patch: Partial<VisualizerSettings>): void => onChange({ ...value, ...patch })
  const palette = VISUALIZER_PALETTES.find(item => item.value === value.palette)
  const spectrumModes = ['bars', 'mirror', 'radial', 'line', 'dots']

  return (
    <>
      <div className="row">
        <div className="row__text">
          <span className="row__label">Визуализация</span>
          <span className="row__hint">Что рисовать под музыку</span>
        </div>
        <Segmented value={value.mode} options={VISUALIZER_MODES} onChange={mode => set({ mode })} />
      </div>

      {value.mode !== 'off' && (
        <>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Захват звука</span>
              <span className="row__hint">
                Windows отдаёт системный микс; отдельное окно — следующий этап
              </span>
            </div>
            <select
              className="select"
              value={value.source}
              onChange={event =>
                set({ source: event.target.value as VisualizerSettings['source'] })
              }
            >
              <option value="system">Вся система</option>
              <option value="window">Одно окно</option>
              <option value="multi">Несколько окон</option>
            </select>
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Палитра</span>
            </div>
            <Segmented
              value={value.palette}
              options={VISUALIZER_PALETTES.map(item => ({
                value: item.value,
                label: item.label
              }))}
              onChange={next => {
                const preset = VISUALIZER_PALETTES.find(item => item.value === next)
                set({
                  palette: next,
                  color1: preset?.color1 ?? value.color1,
                  color2: preset?.color2 ?? value.color2
                })
              }}
            />
          </div>

          {(value.palette === 'gradient' || value.palette === 'custom') && (
            <div className="row">
              <div className="row__text">
                <span className="row__label">Цвета</span>
                <span className="row__hint">Низ и верх градиента</span>
              </div>
              <div className="color-pair">
                <input
                  type="color"
                  className="color-input"
                  value={value.color1}
                  onChange={event => set({ color1: event.target.value })}
                  title="Цвет снизу"
                />
                <input
                  type="color"
                  className="color-input"
                  value={value.color2}
                  onChange={event => set({ color2: event.target.value })}
                  title="Цвет сверху"
                />
              </div>
            </div>
          )}

          {value.palette === 'gradient' && (
            <>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Угол градиента</span>
                </div>
                <Slider
                  min={0}
                  max={360}
                  step={1}
                  value={value.gradientAngle}
                  onChange={gradientAngle => set({ gradientAngle })}
                  format={item => `${item}°`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Масштаб перелива</span>
                </div>
                <Slider
                  min={0.2}
                  max={5}
                  step={0.1}
                  value={value.gradientScale}
                  onChange={gradientScale => set({ gradientScale })}
                  format={item => `${item.toFixed(1)}×`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Скорость перелива</span>
                </div>
                <Slider
                  min={0.2}
                  max={5}
                  step={0.1}
                  value={value.gradientSpeed}
                  onChange={gradientSpeed => set({ gradientSpeed })}
                  format={item => `${item.toFixed(1)}×`}
                />
              </div>
            </>
          )}

          {value.mode === 'ring' && (
            <>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Толщина колец</span>
                </div>
                <Slider
                  min={1}
                  max={18}
                  step={1}
                  value={value.ringThickness}
                  onChange={ringThickness => set({ ringThickness })}
                  format={item => `${item}px`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Пульсация</span>
                </div>
                <Slider
                  min={0}
                  max={2}
                  step={0.05}
                  value={value.ringPulse}
                  onChange={ringPulse => set({ ringPulse })}
                  format={item => `${Math.round(item * 100)}%`}
                />
              </div>
            </>
          )}

          {value.mode === 'mirror' && (
            <div className="row">
              <div className="row__text">
                <span className="row__label">Ось зеркала</span>
              </div>
              <Segmented
                value={value.mirrorOrigin}
                options={[
                  { value: 'start', label: 'От начала' },
                  { value: 'end', label: 'От конца' }
                ]}
                onChange={mirrorOrigin => set({ mirrorOrigin })}
              />
            </div>
          )}

          <div className="row">
            <div className="row__text">
              <span className="row__label">Интенсивность</span>
            </div>
            <Slider
              min={0.2}
              max={2}
              step={0.05}
              value={value.intensity}
              onChange={intensity => set({ intensity })}
              format={item => `${Math.round(item * 100)}%`}
            />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Макс. высота</span>
              <span className="row__hint">Ограничение высоты столбиков и лучей</span>
            </div>
            <Slider
              min={20}
              max={100}
              step={1}
              value={value.maxHeight}
              onChange={maxHeight => set({ maxHeight })}
              format={item => `${item}%`}
            />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Количество столбиков</span>
              <span className="row__hint">12–1200, логарифмическая шкала</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={Math.round((Math.log(Math.max(12, value.bars) / 12) / Math.log(100)) * 100)}
              onChange={position =>
                set({
                  bars: Math.max(
                    12,
                    Math.min(1200, Math.round(12 * Math.pow(1200 / 12, position / 100)))
                  )
                })
              }
              format={() => String(value.bars)}
            />
          </div>

          {spectrumModes.includes(value.mode) && (
            <>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Частоты</span>
                  <span className="row__hint">Диапазон анализа, Гц</span>
                </div>
                <div className="range-pair">
                  <Slider
                    min={20}
                    max={16000}
                    step={10}
                    value={value.freqMin}
                    onChange={freqMin =>
                      set({ freqMin, freqMax: Math.max(freqMin + 100, value.freqMax) })
                    }
                    format={item => `${item}`}
                  />
                  <Slider
                    min={100}
                    max={22000}
                    step={100}
                    value={value.freqMax}
                    onChange={freqMax => set({ freqMax: Math.max(value.freqMin + 100, freqMax) })}
                    format={item => `${item}`}
                  />
                </div>
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Шкала частот</span>
                </div>
                <Segmented
                  value={value.freqScale}
                  options={[
                    { value: 'log', label: 'Логарифм' },
                    { value: 'linear', label: 'Линейно' }
                  ]}
                  onChange={freqScale => set({ freqScale })}
                />
              </div>
            </>
          )}

          {palette && (
            <p className="note">
              Палитра «{palette.label}». Захват идёт через системный loopback Windows.
            </p>
          )}
        </>
      )}
    </>
  )
}

function WeatherPanel({ settings, refresh }: PanelProps): ReactElement {
  const instances = settings.weather.instances
  const [activeId, setActiveId] = useState<string | null>(instances[0]?.id ?? null)
  const [adding, setAdding] = useState(false)
  const active = instances.find(instance => instance.id === activeId) ?? instances[0] ?? null

  const update = async (patch: WeatherInstancePatch): Promise<void> => {
    if (!active) return
    await window.api.patchWeather(active.id, patch)
    await refresh()
  }

  const updateSettings = (patch: Partial<WeatherSettings>): void => {
    void update({ settings: patch })
  }

  const addCity = async (city: City): Promise<void> => {
    const instance = await window.api.addWeather(city)
    await refresh()
    setAdding(false)
    if (instance) setActiveId(instance.id)
  }

  const removeCity = async (id: string): Promise<void> => {
    await window.api.removeWeather(id)
    await refresh()
  }

  const toggleCity = async (): Promise<void> => {
    if (!active) return
    if (active.enabled) await window.api.closeWeather(active.id)
    else await window.api.openWeather(active.id)
    await refresh()
  }

  const patchIntensity = (key: 'dawn' | 'day' | 'dusk' | 'night', value: number): void => {
    if (!active) return
    updateSettings({
      atmosphereIntensity: { ...active.settings.atmosphereIntensity, [key]: value }
    })
  }

  return (
    <section className="panel">
      <div className="row row--stacked">
        <div className="row__text">
          <span className="row__label">Города</span>
          <span className="row__hint">До 5 окон, у каждого города свои настройки</span>
        </div>
        <div className="city-list">
          {instances.map(instance => (
            <div
              className={`city-chip ${active?.id === instance.id ? 'is-active' : ''}`}
              key={instance.id}
            >
              <button
                type="button"
                className="city-chip__name"
                onClick={() => setActiveId(instance.id)}
              >
                {instance.city.name}
              </button>
              <button
                type="button"
                className="city-chip__remove"
                title="Удалить город"
                onClick={() => void removeCity(instance.id)}
              >
                ×
              </button>
            </div>
          ))}
          {instances.length < MAX_WEATHER_CITIES && (
            <button type="button" className="city-add" onClick={() => setAdding(value => !value)}>
              + Добавить город
            </button>
          )}
        </div>
        {adding && <CityPicker city={null} onPick={city => void addCity(city)} />}
      </div>

      {!active && (
        <p className="note">Городов пока нет. Добавьте город, чтобы открыть окно погоды.</p>
      )}

      {active && (
        <>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Показывать это окно</span>
              <span className="row__hint">{active.city.name}</span>
            </div>
            <Switch checked={active.enabled} onChange={() => void toggleCity()} />
          </div>

          <div className="row row--stacked">
            <div className="row__text">
              <span className="row__label">Город</span>
              <span className="row__hint">Поиск по всему миру через Open-Meteo</span>
            </div>
            <CityPicker city={active.city} onPick={city => void update({ city })} />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Единицы</span>
              <span className="row__hint">Температура и скорость ветра</span>
            </div>
            <Segmented
              value={active.settings.units}
              options={[
                { value: 'metric', label: '°C' },
                { value: 'imperial', label: '°F' }
              ]}
              onChange={value => updateSettings({ units: value })}
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
              value={active.settings.provider}
              onChange={event =>
                updateSettings({ provider: event.target.value as WeatherProvider })
              }
            >
              <option value="open-meteo">Open-Meteo</option>
              <option value="metno">MET Norway</option>
              <option value="wttr">wttr.in</option>
              <option value="yandex">Яндекс.Погода</option>
            </select>
          </div>

          {active.settings.provider === 'yandex' && (
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
                value={active.settings.yandexKey}
                placeholder="X-Yandex-API-Key"
                onChange={event => updateSettings({ yandexKey: event.target.value })}
              />
            </div>
          )}

          <div className="row">
            <div className="row__text">
              <span className="row__label">Атмосфера по времени суток</span>
              <span className="row__hint">Рассвет, солнце, закат, луна и звёзды</span>
            </div>
            <Switch
              checked={active.settings.atmosphere}
              onChange={value => updateSettings({ atmosphere: value })}
            />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Рассвет</span>
            </div>
            <Range
              value={active.settings.atmosphereIntensity.dawn}
              onChange={value => patchIntensity('dawn', value)}
            />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">День</span>
            </div>
            <Range
              value={active.settings.atmosphereIntensity.day}
              onChange={value => patchIntensity('day', value)}
            />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Закат</span>
            </div>
            <Range
              value={active.settings.atmosphereIntensity.dusk}
              onChange={value => patchIntensity('dusk', value)}
            />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Ночь</span>
            </div>
            <Range
              value={active.settings.atmosphereIntensity.night}
              onChange={value => patchIntensity('night', value)}
            />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Прогноз</span>
              <span className="row__hint">Сколько дней показывать</span>
            </div>
            <Segmented
              value={String(active.settings.forecastDays)}
              options={[
                { value: '0', label: 'Без' },
                { value: '3', label: '3 дня' },
                { value: '5', label: '5 дней' }
              ]}
              onChange={value => updateSettings({ forecastDays: Number(value) as 0 | 3 | 5 })}
            />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Солнце</span>
              <span className="row__hint">Восход, закат и длина светового дня</span>
            </div>
            <Segmented
              value={active.settings.sunMode}
              options={[
                { value: 'off', label: 'Нет' },
                { value: 'compact', label: 'Компактно' },
                { value: 'arc', label: 'Дуга' }
              ]}
              onChange={value => updateSettings({ sunMode: value })}
            />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Название города</span>
            </div>
            <Switch
              checked={active.settings.showCity}
              onChange={value => updateSettings({ showCity: value })}
            />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Ощущается как</span>
            </div>
            <Switch
              checked={active.settings.showFeelsLike}
              onChange={value => updateSettings({ showFeelsLike: value })}
            />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Ветер</span>
            </div>
            <Switch
              checked={active.settings.showWind}
              onChange={value => updateSettings({ showWind: value })}
            />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Влажность</span>
            </div>
            <Switch
              checked={active.settings.showHumidity}
              onChange={value => updateSettings({ showHumidity: value })}
            />
          </div>
        </>
      )}

      <p className="note">
        Погода обновляется каждые 10 минут. Позиция каждого окна запоминается автоматически.
      </p>
    </section>
  )
}

function EqualizerPanel({ settings, patch, toggleWidget }: PanelProps): ReactElement {
  const eq = settings.equalizer
  const [displays, setDisplays] = useState<Array<{ id: number; label: string }>>([])

  useEffect(() => {
    window.api
      .getDisplays()
      .then(items => setDisplays(items))
      .catch(() => undefined)
  }, [])

  const patchEq = (value: Partial<EqualizerSettings>): void => patch({ equalizer: value })

  return (
    <section className="panel">
      <div className="row">
        <div className="row__text">
          <span className="row__label">Показывать виджет</span>
          <span className="row__hint">Визуализация системного звука на рабочем столе</span>
        </div>
        <Switch
          checked={settings.widgets.equalizer.enabled}
          onChange={value => toggleWidget('equalizer', value)}
        />
      </div>

      <VisualizerControls value={eq.visualizer} onChange={visualizer => patchEq({ visualizer })} />

      <div className="row">
        <div className="row__text">
          <span className="row__label">Масштаб окна</span>
          <span className="row__hint">50–300%, меняется только в обычном окне</span>
        </div>
        <Slider
          min={0.5}
          max={3}
          step={0.05}
          value={eq.scale}
          onChange={scale => patchEq({ scale })}
          format={item => `${Math.round(item * 100)}%`}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Монитор</span>
          <span className="row__hint">Для полосы по краю выбранного монитора</span>
        </div>
        <select
          className="select"
          value={eq.displayId ?? 0}
          onChange={event => patchEq({ displayId: Number(event.target.value) || null })}
        >
          <option value={0}>Текущий</option>
          {displays.map(display => (
            <option value={display.id} key={display.id}>
              {display.label}
            </option>
          ))}
        </select>
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Размещение</span>
          <span className="row__hint">Полоса по краю монитора на всю длину</span>
        </div>
        <select
          className="select"
          value={eq.dock}
          onChange={event => patchEq({ dock: event.target.value as EqualizerSettings['dock'] })}
        >
          <option value="free">Обычное окно</option>
          <option value="bottom">Нижний край</option>
          <option value="top">Верхний край</option>
          <option value="left">Левый край</option>
          <option value="right">Правый край</option>
        </select>
      </div>

      {eq.dock !== 'free' && (
        <div className="row">
          <div className="row__text">
            <span className="row__label">Толщина полосы</span>
          </div>
          <Slider
            min={48}
            max={360}
            step={2}
            value={eq.dockThickness}
            onChange={dockThickness => patchEq({ dockThickness })}
            format={item => `${item}px`}
          />
        </div>
      )}

      <div className="row">
        <div className="row__text">
          <span className="row__label">Отражение по горизонтали</span>
        </div>
        <Switch checked={eq.mirrorX} onChange={mirrorX => patchEq({ mirrorX })} />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Отражение по вертикали</span>
        </div>
        <Switch checked={eq.mirrorY} onChange={mirrorY => patchEq({ mirrorY })} />
      </div>

      {eq.dock === 'free' && (
        <div className="row">
          <div className="row__text">
            <span className="row__label">Край монитора</span>
            <span className="row__hint">Центрирует окно у выбранной грани</span>
          </div>
          <div className="align-buttons">
            <button type="button" onClick={() => void window.api.alignEqualizer('top')}>
              Сверху
            </button>
            <button type="button" onClick={() => void window.api.alignEqualizer('bottom')}>
              Снизу
            </button>
            <button type="button" onClick={() => void window.api.alignEqualizer('left')}>
              Слева
            </button>
            <button type="button" onClick={() => void window.api.alignEqualizer('right')}>
              Справа
            </button>
          </div>
        </div>
      )}

      <p className="note">
        Звук захватывается через системный loopback Windows. При первом включении визуализации
        система может спросить разрешение на захват экрана.
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
  const [tab, setTab] = useState<WidgetId>(() => {
    const initial = new URLSearchParams(window.location.search).get('tab') as WidgetId | null
    return initial && TAB_ORDER.includes(initial) ? initial : 'system'
  })

  const refresh = useCallback(async () => {
    setSettings(await window.api.getSettings())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => window.api.onSettingsTab(id => setTab(id)), [])

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
          <SystemPanel
            settings={settings}
            patch={patch}
            toggleWidget={toggleWidget}
            refresh={refresh}
          />
        )}

        {settings && tab === 'music' && (
          <MusicPanel
            settings={settings}
            patch={patch}
            toggleWidget={toggleWidget}
            refresh={refresh}
          />
        )}

        {settings && tab === 'weather' && (
          <WeatherPanel
            settings={settings}
            patch={patch}
            toggleWidget={toggleWidget}
            refresh={refresh}
          />
        )}

        {settings && tab === 'equalizer' && (
          <EqualizerPanel
            settings={settings}
            patch={patch}
            toggleWidget={toggleWidget}
            refresh={refresh}
          />
        )}

        {settings &&
          tab !== 'system' &&
          tab !== 'music' &&
          tab !== 'weather' &&
          tab !== 'equalizer' && <PlannedPanel id={tab} />}
      </main>
    </div>
  )
}
