import { useEffect, useState, type JSX } from 'react'
import type {
  AstroSettings,
  CalendarSettings,
  ClockSettings,
  DiceSettings,
  EqualizerSettings,
  FinanceSettings,
  ImageAsset,
  ImageCrop,
  ImageSlot,
  MusicSettings,
  PersistedState,
  RuntimeInfo,
  SimsSettings,
  SystemSettings,
  TarotDeck,
  TarotSettings,
  TodoSettings,
  TwitchSettings,
  VisualizerSettings,
  WeatherSettings,
  WeekdaySettings,
  WidgetInstance,
  WidgetStyle,
  ZodiacPack
} from '@shared/types'
import { ZODIAC, ZODIAC_ORDER, signFromDayMonth } from '@shared/astro'
import { VISUALIZER_MODES, VISUALIZER_PALETTES } from '@shared/presets'
import { useMusicSnapshot } from '../hooks'
import { formatDuration } from '../format'
import { Row, Section, Segmented, Slider, Toggle, Chip } from './controls'
import { CityPicker } from './CityPicker'
import { CustomDates } from './CustomDates'
import { StyleEditor } from './StyleEditor'
import { ZodiacPackEditor } from './ZodiacPackEditor'
import { TarotDeckEditor } from './TarotDeckEditor'
import { CropModal } from '../components/CropModal'
import { IconNote } from '../ui/icons'

export interface PanelProps {
  instance: WidgetInstance
  state: PersistedState
  patchInstance: (patch: Partial<WidgetInstance>) => void
  patchSettings: (patch: Record<string, unknown>) => void
  onApplyAll: (style: WidgetStyle) => void
  section: 'content' | 'style'
}

function MusicPreview(): JSX.Element {
  const snapshot = useMusicSnapshot()
  const title = snapshot?.title
  const active = Boolean(
    title && snapshot?.status !== 'unavailable' && snapshot?.status !== 'closed'
  )

  return (
    <div className={`now-playing${active ? ' is-active' : ''}`}>
      <div className="now-playing__art">
        {snapshot?.artwork ? <img src={snapshot.artwork} alt="" /> : <IconNote size={18} />}
      </div>
      <div className="now-playing__text">
        <div className="now-playing__title">{active ? title : 'Ничего не играет'}</div>
        <div className="now-playing__meta">
          {active
            ? [
                snapshot?.artist,
                snapshot?.source,
                snapshot?.durationMs ? formatDuration(snapshot.durationMs) : null
              ]
                .filter(Boolean)
                .join(' · ')
            : snapshot?.status === 'unavailable'
              ? 'Медиа-сессия Windows недоступна'
              : 'Включите музыку в Яндекс Музыке или другом плеере'}
        </div>
      </div>
      {active && snapshot?.status === 'paused' && <Chip tone="warn">пауза</Chip>}
    </div>
  )
}

function VisualizerControls({
  value,
  onChange,
  allowedModes
}: {
  value: VisualizerSettings
  onChange: (next: VisualizerSettings) => void
  allowedModes?: VisualizerSettings['mode'][]
}): JSX.Element {
  const set = (patch: Partial<VisualizerSettings>): void => onChange({ ...value, ...patch })
  const mode = value.mode
  const spectrum = ['bars', 'radial', 'line', 'waveform', 'dots'].includes(mode)

  return (
    <>
      <Row label="Визуализация" hint="Фон или обводка, реагирующие на звук">
        <Segmented
          value={mode}
          options={
            allowedModes
              ? VISUALIZER_MODES.filter((item) => allowedModes.includes(item.value))
              : VISUALIZER_MODES
          }
          onChange={(next) => set({ mode: next })}
        />
      </Row>

      {mode !== 'off' && (
        <>
          <Row label="Палитра">
            <Segmented
              value={value.palette}
              options={VISUALIZER_PALETTES.map((item) => ({
                value: item.value,
                label: item.label
              }))}
              onChange={(next) => {
                const preset = VISUALIZER_PALETTES.find((item) => item.value === next)
                set({
                  palette: next,
                  color1: preset?.color1 ?? value.color1,
                  color2: preset?.color2 ?? value.color2
                })
              }}
            />
          </Row>

          {value.palette === 'custom' && (
            <Row label="Цвета" hint="Низ и верх градиента">
              <div className="color-pair">
                <input
                  type="color"
                  className="color-input"
                  value={value.color1}
                  onChange={(event) => set({ color1: event.target.value })}
                />
                <input
                  type="color"
                  className="color-input"
                  value={value.color2}
                  onChange={(event) => set({ color2: event.target.value })}
                />
              </div>
            </Row>
          )}

          <Row label="Интенсивность">
            <Slider
              min={0.2}
              max={2}
              step={0.05}
              value={value.intensity}
              onChange={(intensity) => set({ intensity })}
              format={(item) => `${Math.round(item * 100)}%`}
            />
          </Row>

          <Row label="Макс. высота">
            <Slider
              min={10}
              max={100}
              step={1}
              value={value.maxHeight}
              onChange={(maxHeight) => set({ maxHeight })}
              format={(item) => `${item}%`}
            />
          </Row>

          {['bars', 'radial', 'line', 'waveform', 'dots'].includes(mode) && (
            <Row label="Количество" hint="12–3600 элементов">
              <Slider
                min={12}
                max={3600}
                step={1}
                value={value.bars}
                onChange={(bars) => set({ bars })}
                format={(item) => String(item)}
              />
            </Row>
          )}

          {mode === 'bars' && (
            <>
              <Row label="Форма столбиков">
                <Segmented
                  value={value.barShape}
                  options={[
                    { value: 'rounded', label: 'Закруглённые' },
                    { value: 'rect', label: 'Прямоугольные' }
                  ]}
                  onChange={(barShape) => set({ barShape })}
                />
              </Row>
              <Row label="Толщина столбика">
                <Slider
                  min={1}
                  max={60}
                  step={1}
                  value={value.barThickness}
                  onChange={(barThickness) => set({ barThickness })}
                  format={(item) => `${item}px`}
                />
              </Row>
              <Row label="Зазор">
                <Slider
                  min={0}
                  max={40}
                  step={1}
                  value={value.barGap}
                  onChange={(barGap) => set({ barGap })}
                  format={(item) => `${item}px`}
                />
              </Row>
            </>
          )}

          {mode === 'radial' && (
            <>
              <Row label="Половина спектра" hint="Отражение дополнит вторую половину">
                <Toggle checked={value.radialHalf} onChange={(radialHalf) => set({ radialHalf })} />
              </Row>
              <Row label="Толщина лучей">
                <Slider
                  min={1}
                  max={24}
                  step={0.5}
                  value={value.barThickness}
                  onChange={(barThickness) => set({ barThickness })}
                  format={(item) => `${item}px`}
                />
              </Row>
            </>
          )}

          {mode === 'particles' && (
            <>
              <Row label="Источник частиц">
                <Segmented
                  value={value.particleOrigin}
                  options={[
                    { value: 'bottom', label: 'Снизу' },
                    { value: 'center', label: 'Из центра' }
                  ]}
                  onChange={(particleOrigin) => set({ particleOrigin })}
                />
              </Row>
              <Row label="Количество частиц">
                <Slider
                  min={20}
                  max={1200}
                  step={10}
                  value={value.particleCount}
                  onChange={(particleCount) => set({ particleCount })}
                  format={(item) => String(item)}
                />
              </Row>
              <Row label="Реакция на музыку">
                <Slider
                  min={0}
                  max={3}
                  step={0.05}
                  value={value.particleReactivity}
                  onChange={(particleReactivity) => set({ particleReactivity })}
                  format={(item) => `${item.toFixed(2)}×`}
                />
              </Row>
              <Row label="Распределение по области">
                <Slider
                  min={0.1}
                  max={1}
                  step={0.01}
                  value={value.particleSpread}
                  onChange={(particleSpread) => set({ particleSpread })}
                  format={(item) => `${Math.round(item * 100)}%`}
                />
              </Row>
              <Row label="Размер частиц">
                <Slider
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={value.sparkSize}
                  onChange={(sparkSize) => set({ sparkSize })}
                  format={(item) => `${item}px`}
                />
              </Row>
              <Row label="Случайный размер">
                <Toggle
                  checked={value.particleRandomSize}
                  onChange={(particleRandomSize) => set({ particleRandomSize })}
                />
              </Row>
              <Row label="Базовая скорость">
                <Slider
                  min={0.2}
                  max={5}
                  step={0.05}
                  value={value.sparkSpeed}
                  onChange={(sparkSpeed) => set({ sparkSpeed })}
                  format={(item) => `${item.toFixed(1)}×`}
                />
              </Row>
            </>
          )}

          {(mode === 'bars' || mode === 'dots' || mode === 'particles' || mode === 'line') && (
            <Row label="Отражение" hint="Зеркальная копия относительно оси">
              <Toggle checked={value.mirror} onChange={(mirror) => set({ mirror })} />
            </Row>
          )}

          {mode === 'radial' && (
            <Row label="Отражение" hint="Лучи с противоположной стороны">
              <Toggle checked={value.mirror} onChange={(mirror) => set({ mirror })} />
            </Row>
          )}

          {value.mirror && (
            <>
              <Row label="Сдвиг отражения X">
                <Slider
                  min={-600}
                  max={600}
                  step={1}
                  value={value.mirrorOffsetX}
                  onChange={(mirrorOffsetX) => set({ mirrorOffsetX })}
                  format={(item) => `${item}px`}
                />
              </Row>
              <Row label="Сдвиг отражения Y">
                <Slider
                  min={-600}
                  max={600}
                  step={1}
                  value={value.mirrorOffsetY}
                  onChange={(mirrorOffsetY) => set({ mirrorOffsetY })}
                  format={(item) => `${item}px`}
                />
              </Row>
            </>
          )}

          <Row label="Свечение визуализации">
            <Toggle checked={value.glowEnabled} onChange={(glowEnabled) => set({ glowEnabled })} />
          </Row>

          {value.glowEnabled && (
            <>
              <Row label="Интенсивность свечения">
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={value.glowIntensity}
                  onChange={(glowIntensity) => set({ glowIntensity })}
                  format={(item) => `${Math.round(item * 100)}%`}
                />
              </Row>
              <Row label="Рассеивание свечения">
                <Slider
                  min={0}
                  max={60}
                  step={1}
                  value={value.glowSpread}
                  onChange={(glowSpread) => set({ glowSpread })}
                  format={(item) => `${item}px`}
                />
              </Row>
            </>
          )}

          {spectrum && (
            <>
              <Row label="Частоты" hint="Диапазон анализа, Гц">
                <Slider
                  min={20}
                  max={16000}
                  step={10}
                  value={value.freqMin}
                  onChange={(freqMin) =>
                    set({ freqMin, freqMax: Math.max(freqMin + 100, value.freqMax) })
                  }
                  format={(item) => `${item}`}
                />
              </Row>
              <Row label="Верхняя частота">
                <Slider
                  min={100}
                  max={22000}
                  step={100}
                  value={value.freqMax}
                  onChange={(freqMax) => set({ freqMax: Math.max(value.freqMin + 100, freqMax) })}
                  format={(item) => `${item}`}
                />
              </Row>
              <Row
                label="Шкала частот"
                hint="Логарифм сжимает высокие частоты и даёт больше деталей в басе; линейно делит диапазон поровну"
              >
                <Segmented
                  value={value.freqScale}
                  options={[
                    { value: 'log', label: 'Логарифм' },
                    { value: 'linear', label: 'Линейно' }
                  ]}
                  onChange={(freqScale) => set({ freqScale })}
                />
              </Row>
            </>
          )}
        </>
      )}
    </>
  )
}

function BirthDateInput({
  value,
  onChange
}: {
  value: string
  onChange: (value: string) => void
}): JSX.Element {
  const initial = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-') : ['', '', '']
  const [day, setDay] = useState(initial[2])
  const [month, setMonth] = useState(initial[1])
  const [year, setYear] = useState(initial[0])

  useEffect(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parts = value.split('-')
      setYear(parts[0])
      setMonth(parts[1])
      setDay(parts[2])
    }
  }, [value])

  const commit = (nextDay: string, nextMonth: string, nextYear: string): void => {
    setDay(nextDay)
    setMonth(nextMonth)
    setYear(nextYear)
    const d = Number(nextDay)
    const m = Number(nextMonth)
    const y = Number(nextYear)
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      onChange(
        `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      )
    }
  }

  return (
    <div className="birth-date">
      <input
        className="text-input birth-date__part"
        inputMode="numeric"
        placeholder="ДД"
        maxLength={2}
        value={day}
        onChange={(event) => commit(event.target.value.replace(/\D/g, ''), month, year)}
      />
      <span>.</span>
      <input
        className="text-input birth-date__part"
        inputMode="numeric"
        placeholder="ММ"
        maxLength={2}
        value={month}
        onChange={(event) => commit(day, event.target.value.replace(/\D/g, ''), year)}
      />
      <span>.</span>
      <input
        className="text-input birth-date__part birth-date__part--year"
        inputMode="numeric"
        placeholder="ГГГГ"
        maxLength={4}
        value={year}
        onChange={(event) => commit(day, month, event.target.value.replace(/\D/g, ''))}
      />
    </div>
  )
}

function CommonSection({ instance, patchInstance }: PanelProps): JSX.Element {
  return (
    <Section title="Положение и вид">
      <Row
        label="Показывать виджет"
        hint="Выключенный виджет исчезает с экрана, но сохраняет настройки"
      >
        <Toggle
          checked={instance.enabled}
          onChange={(value) => patchInstance({ enabled: value })}
        />
      </Row>
      <Row
        label="Редактирование"
        hint={
          instance.locked
            ? 'Заблокирован: клики проходят сквозь виджет'
            : 'Разблокирован: можно перетаскивать и нажимать кнопки'
        }
      >
        <Toggle
          checked={!instance.locked}
          onChange={(value) => patchInstance({ locked: !value })}
        />
      </Row>
      <Row label="Слой" hint="«Поверх окон» — над приложениями; «На рабочем столе» — за окнами">
        <Segmented
          value={instance.layer}
          options={[
            { value: 'always', label: 'Поверх окон' },
            { value: 'desktop', label: 'На рабочем столе' }
          ]}
          onChange={(value) => patchInstance({ layer: value })}
        />
      </Row>
      {instance.type !== 'equalizer' && (
        <Row
          label="Размер"
          hint="Потяните за угол карточки в режиме редактирования. Минимум — контент плюс запас на пару символов; при смене настроек окно подрастает."
        >
          {instance.manualSize ? (
            <button
              type="button"
              className="btn"
              onClick={() => window.widgets.setManualSize(instance.id, null)}
            >
              Вернуть авторазмер
            </button>
          ) : (
            <span className="pill-muted">авторазмер</span>
          )}
        </Row>
      )}
    </Section>
  )
}

function WeatherPanel({ instance, patchSettings }: PanelProps): JSX.Element {
  const weather = instance.settings as WeatherSettings
  return (
    <Section title="Погода" hint="Open-Meteo · резервный 7timer">
      <Row label="Город" stacked>
        <CityPicker city={weather.city} onPick={(city) => patchSettings({ city })} />
      </Row>
      <Row label="Единицы">
        <Segmented
          value={weather.units}
          options={[
            { value: 'metric', label: '°C' },
            { value: 'imperial', label: '°F' }
          ]}
          onChange={(value) => patchSettings({ units: value })}
        />
      </Row>
      <Row
        label="Источник"
        hint="Open-Meteo — по умолчанию; MET Norway и wttr.in дают другую картину осадков"
      >
        <select
          className="select"
          value={weather.provider}
          onChange={(event) => patchSettings({ provider: event.target.value })}
        >
          <option value="open-meteo">Open-Meteo</option>
          <option value="metno">MET Norway</option>
          <option value="wttr">wttr.in</option>
          <option value="yandex">Яндекс.Погода</option>
        </select>
      </Row>
      {weather.provider === 'yandex' && (
        <Row
          label="Ключ Яндекс.Погоды"
          hint="Хранится локально; без ключа используется резервный источник"
        >
          <input
            className="text-input"
            type="password"
            value={weather.yandexKey}
            placeholder="X-Yandex-API-Key"
            onChange={(event) => patchSettings({ yandexKey: event.target.value })}
          />
        </Row>
      )}
      <Row
        label="Атмосфера по времени суток"
        hint="Рассвет, солнце, закат, луна и звёзды поверх фона"
      >
        <Toggle
          checked={weather.atmosphere}
          onChange={(value) => patchSettings({ atmosphere: value })}
        />
      </Row>
      <Row label="Прогноз" hint="До 5 дней вперёд">
        <Segmented
          value={String(weather.forecastDays)}
          options={[
            { value: '0', label: 'Без' },
            { value: '3', label: '3 дня' },
            { value: '5', label: '5 дней' }
          ]}
          onChange={(value) => patchSettings({ forecastDays: Number(value) as 0 | 3 | 5 })}
        />
      </Row>
      <Row label="Солнце" hint="Восход, закат и длина светового дня">
        <Segmented
          value={weather.sunMode}
          options={[
            { value: 'off', label: 'Нет' },
            { value: 'compact', label: 'Компактно' },
            { value: 'arc', label: 'Дуга' }
          ]}
          onChange={(value) => patchSettings({ sunMode: value })}
        />
      </Row>
      <Row label="Название города">
        <Toggle
          checked={weather.showCity}
          onChange={(value) => patchSettings({ showCity: value })}
        />
      </Row>
      <Row label="Ощущается как">
        <Toggle
          checked={weather.showFeelsLike}
          onChange={(value) => patchSettings({ showFeelsLike: value })}
        />
      </Row>
      <Row label="Ветер">
        <Toggle
          checked={weather.showWind}
          onChange={(value) => patchSettings({ showWind: value })}
        />
      </Row>
      <Row label="Влажность">
        <Toggle
          checked={weather.showHumidity}
          onChange={(value) => patchSettings({ showHumidity: value })}
        />
      </Row>
    </Section>
  )
}

function MusicPanel({ instance, patchSettings }: PanelProps): JSX.Element {
  const music = instance.settings as MusicSettings
  return (
    <>
      <Section title="Сейчас играет" hint="системная медиа-сессия Windows">
        <Row label="Трек" stacked>
          <MusicPreview />
        </Row>
      </Section>
      <Section title="Отображение">
        <Row label="Обложка">
          <Toggle checked={music.showArt} onChange={(value) => patchSettings({ showArt: value })} />
        </Row>
        <Row label="Прогресс и время">
          <Toggle
            checked={music.showProgress}
            onChange={(value) => patchSettings({ showProgress: value })}
          />
        </Row>
        <Row label="Кнопки управления" hint="Доступны в режиме редактирования">
          <Toggle
            checked={music.showControls}
            onChange={(value) => patchSettings({ showControls: value })}
          />
        </Row>
        <Row label="Название плеера">
          <Toggle
            checked={music.showSource}
            onChange={(value) => patchSettings({ showSource: value })}
          />
        </Row>
        <VisualizerControls
          value={music.visualizer}
          onChange={(visualizer) => patchSettings({ visualizer })}
          allowedModes={['off', 'bars', 'dots']}
        />
        <Row
          label="Управление в заблокированном виде"
          hint="Виджет продолжит принимать клики по кнопкам и шкале, но перетаскивать его будет нельзя. Область виджета будет перехватывать клики."
        >
          <Toggle
            checked={music.interactiveWhenLocked}
            onChange={(value) => patchSettings({ interactiveWhenLocked: value })}
          />
        </Row>
      </Section>
    </>
  )
}

function ClockPanel({ instance, patchSettings }: PanelProps): JSX.Element {
  const clock = instance.settings as ClockSettings
  return (
    <Section title="Часы" hint="время и дополнительный город">
      <Row label="24-часовой формат">
        <Toggle checked={clock.format24} onChange={(value) => patchSettings({ format24: value })} />
      </Row>
      <Row label="Секунды">
        <Toggle
          checked={clock.showSeconds}
          onChange={(value) => patchSettings({ showSeconds: value })}
        />
      </Row>
      <Row label="Разделитель времени" hint="Символ между часами, минутами и секундами">
        <select
          className="select"
          value={clock.separator}
          onChange={(event) =>
            patchSettings({ separator: event.target.value as ClockSettings['separator'] })
          }
        >
          <option value="dots">Точки</option>
          <option value="colon">Двоеточие</option>
          <option value="bar">Вертикальная черта</option>
          <option value="none">Без символа</option>
        </select>
      </Row>
      <Row label="Время другого города" hint="Название и время под основными часами">
        <Toggle
          checked={clock.showCityTime}
          onChange={(value) => patchSettings({ showCityTime: value })}
        />
      </Row>
      {clock.showCityTime && (
        <Row label="Город" stacked>
          <CityPicker
            city={clock.city}
            onPick={(city) => patchSettings({ city, showCityTime: true })}
          />
        </Row>
      )}
      <div className="style-note">
        Кегль, шрифт, обводка, тень и паттерн текста — в «Стиль и фон». Окно подстраивается под
        содержимое с запасом по самой широкой цифре.
      </div>
    </Section>
  )
}

function WeekdayPanel({ instance, patchSettings }: PanelProps): JSX.Element {
  const weekday = instance.settings as WeekdaySettings
  return (
    <Section title="День недели" hint="день, сокращение и дата">
      <Row label="Основной день недели">
        <Toggle
          checked={weekday.showWeekday}
          onChange={(value) => patchSettings({ showWeekday: value })}
        />
      </Row>
      {weekday.showWeekday && (
        <>
          <Row label="Формат дня">
            <Segmented
              value={weekday.weekdayFormat}
              options={[
                { value: 'full', label: 'Полное' },
                { value: 'short', label: 'Короткое' }
              ]}
              onChange={(weekdayFormat) => patchSettings({ weekdayFormat })}
            />
          </Row>
          <Row label="Капсом">
            <Toggle
              checked={weekday.uppercase}
              onChange={(value) => patchSettings({ uppercase: value })}
            />
          </Row>
        </>
      )}
      <Row label="Язык">
        <Segmented
          value={weekday.language}
          options={[
            { value: 'ru', label: 'Русский' },
            { value: 'en', label: 'English' }
          ]}
          onChange={(language) => patchSettings({ language })}
        />
      </Row>
      <Row label="Вторая строка" hint="Короткий день и дата, например «пн, 9 ноября»">
        <Toggle
          checked={weekday.showSecondary}
          onChange={(value) => patchSettings({ showSecondary: value })}
        />
      </Row>
      {weekday.showSecondary && (
        <Row label="Показывать дату">
          <Toggle
            checked={weekday.showDate}
            onChange={(value) => patchSettings({ showDate: value })}
          />
        </Row>
      )}
      {weekday.showSecondary && weekday.showDate && (
        <Row label="Формат даты">
          <select
            className="select"
            value={weekday.dateFormat}
            onChange={(event) => patchSettings({ dateFormat: event.target.value })}
          >
            <option value="long">{weekday.language === 'ru' ? '8 ноября' : '8 November'}</option>
            <option value="numeric">08.11.2026</option>
            <option value="short">{weekday.language === 'ru' ? '8 нояб.' : '8 Nov'}</option>
          </select>
        </Row>
      )}
      <Row label="Номер недели">
        <Toggle
          checked={weekday.showWeekNumber}
          onChange={(value) => patchSettings({ showWeekNumber: value })}
        />
      </Row>
      <div className="style-note">
        Кегль один на виджет; вторичная строка и номер недели масштабируются пропорционально. Окно
        резервирует место под самый длинный день и дату.
      </div>
    </Section>
  )
}

function CalendarPanel({ instance, patchSettings }: PanelProps): JSX.Element {
  const calendar = instance.settings as CalendarSettings
  return (
    <>
      <Section title="Вид календаря">
        <Row label="Период">
          <Segmented
            value={calendar.view}
            options={[
              { value: 'week', label: 'Неделя' },
              { value: 'month', label: 'Месяц' },
              { value: '3months', label: '3 месяца' }
            ]}
            onChange={(value) => patchSettings({ view: value })}
          />
        </Row>
        {calendar.view === '3months' && (
          <Row label="Раскладка">
            <Segmented
              value={calendar.layout}
              options={[
                { value: 'row', label: 'В ряд' },
                { value: 'column', label: 'В столбик' }
              ]}
              onChange={(value) => patchSettings({ layout: value })}
            />
          </Row>
        )}
        <Row label="Праздники РФ" hint="Официальные праздники и нерабочие дни">
          <Toggle
            checked={calendar.showHolidays}
            onChange={(value) => patchSettings({ showHolidays: value })}
          />
        </Row>
        <Row label="Цвет праздников" hint="Применяется к числам по производственному календарю">
          <input
            type="color"
            className="color-input"
            value={calendar.holidayColor}
            onChange={(event) => patchSettings({ holidayColor: event.target.value })}
          />
        </Row>
        <Row label="Номера недель">
          <Toggle
            checked={calendar.showWeekNumbers}
            onChange={(value) => patchSettings({ showWeekNumbers: value })}
          />
        </Row>
      </Section>

      <Section title="Свои даты" hint="выделяются цветом или сердечком">
        <Row label="Даты" stacked>
          <CustomDates
            dates={calendar.customDates}
            onChange={(next) => patchSettings({ customDates: next })}
          />
        </Row>
      </Section>
    </>
  )
}

function AstroPanel({ instance, state, patchSettings }: PanelProps): JSX.Element {
  const astro = instance.settings as AstroSettings
  const [editor, setEditor] = useState<ZodiacPack | null | 'new'>(null)
  const selectedPack = astro.zodiacPackId
    ? state.zodiacPacks.find((pack) => pack.id === astro.zodiacPackId)
    : undefined
  const checked = signFromDayMonth(astro.checkDay, astro.checkMonth)

  return (
    <>
      <Section title="Астро" hint="развлекательный контент">
        <Row label="Что показать">
          <Segmented
            value={astro.view}
            options={[
              { value: 'sign', label: 'Мой знак' },
              { value: 'check', label: 'Знак по дате' },
              { value: 'all', label: 'Все знаки' }
            ]}
            onChange={(view) => patchSettings({ view })}
          />
        </Row>

        {astro.view === 'sign' && (
          <>
            <Row label="Дата рождения" hint="День, месяц и год вводятся отдельно">
              <BirthDateInput
                value={astro.birthDate}
                onChange={(birthDate) => patchSettings({ birthDate })}
              />
            </Row>
            <Row label="Знак" hint="«Авто» — по дате рождения или по текущей дате">
              <select
                className="select"
                value={astro.sign}
                onChange={(event) => patchSettings({ sign: event.target.value })}
              >
                <option value="auto">Авто</option>
                {ZODIAC_ORDER.map((sign) => (
                  <option value={sign} key={sign}>
                    {ZODIAC[sign].name}
                  </option>
                ))}
              </select>
            </Row>
          </>
        )}

        {astro.view === 'check' && (
          <>
            <Row label="Дата" hint="Без года: важен только день и месяц">
              <div className="birth-date">
                <input
                  className="text-input birth-date__part"
                  inputMode="numeric"
                  maxLength={2}
                  value={astro.checkDay}
                  onChange={(event) =>
                    patchSettings({
                      checkDay: Math.min(31, Math.max(1, Number(event.target.value) || 1))
                    })
                  }
                />
                <span>.</span>
                <input
                  className="text-input birth-date__part"
                  inputMode="numeric"
                  maxLength={2}
                  value={astro.checkMonth}
                  onChange={(event) =>
                    patchSettings({
                      checkMonth: Math.min(12, Math.max(1, Number(event.target.value) || 1))
                    })
                  }
                />
                <span className="astro-panel__result">— {ZODIAC[checked].name}</span>
              </div>
            </Row>
            <div className="style-note">
              {String(astro.checkDay).padStart(2, '0')}.{String(astro.checkMonth).padStart(2, '0')}{' '}
              — {ZODIAC[checked].name}, {ZODIAC[checked].dates}
            </div>
          </>
        )}

        {astro.view === 'all' && (
          <div className="style-note">
            Показаны все 12 знаков с датами. Текущий знак подсвечен в виджете.
          </div>
        )}

        <Row label="Фаза Луны">
          <Toggle
            checked={astro.showMoon}
            onChange={(value) => patchSettings({ showMoon: value })}
          />
        </Row>
        <Row label="Стихия и планета">
          <Toggle
            checked={astro.showElement}
            onChange={(value) => patchSettings({ showElement: value })}
          />
        </Row>
        <Row label="Совет дня">
          <Toggle
            checked={astro.showPhrase}
            onChange={(value) => patchSettings({ showPhrase: value })}
          />
        </Row>
      </Section>

      <Section title="Стиль значков" hint="свой набор картинок для 12 знаков">
        <Row label="Набор">
          <select
            className="select"
            value={astro.zodiacPackId ?? ''}
            onChange={(event) => patchSettings({ zodiacPackId: event.target.value || null })}
          >
            <option value="">По умолчанию (символы)</option>
            {state.zodiacPacks.map((pack) => (
              <option value={pack.id} key={pack.id}>
                {pack.name}
              </option>
            ))}
          </select>
        </Row>
        <div className="slot-editor__actions">
          <button type="button" className="btn btn--small" onClick={() => setEditor('new')}>
            Создать набор
          </button>
          <button
            type="button"
            className="btn btn--small"
            disabled={!selectedPack}
            onClick={() => selectedPack && setEditor(selectedPack)}
          >
            Редактировать
          </button>
          {selectedPack && (
            <button
              type="button"
              className="btn btn--small btn--danger-ghost"
              onClick={() => {
                void window.widgets.deleteZodiacPack(selectedPack.id)
                patchSettings({ zodiacPackId: null })
              }}
            >
              Удалить
            </button>
          )}
        </div>
        <div className="style-note">
          Каждый значок кадрируется в квадрат — одинаковый размер на всех знаках.
        </div>
      </Section>

      {editor && (
        <ZodiacPackEditor
          pack={editor === 'new' ? null : editor}
          onClose={() => setEditor(null)}
          onSave={(pack) => {
            void window.widgets.saveZodiacPack(pack).then((saved) => {
              patchSettings({ zodiacPackId: saved.id })
              setEditor(null)
            })
          }}
        />
      )}
    </>
  )
}

function TarotPanel({ instance, state, patchSettings }: PanelProps): JSX.Element {
  const tarot = instance.settings as TarotSettings
  const [editor, setEditor] = useState<TarotDeck | null | 'new'>(null)
  const [backCrop, setBackCrop] = useState<{ asset: ImageAsset; crop: ImageCrop } | null>(null)
  const selectedDeck = tarot.deckId
    ? state.tarotDecks.find((deck) => deck.id === tarot.deckId)
    : undefined

  return (
    <>
      <Section title="Таро" hint="колода, рубашка и переворот карт">
        <Row label="Расклад">
          <Segmented
            value={String(tarot.spread)}
            options={[
              { value: '1', label: '1 карта' },
              { value: '3', label: '3 карты' },
              { value: '5', label: '5 карт' }
            ]}
            onChange={(value) => patchSettings({ spread: Number(value) as 1 | 3 | 5 })}
          />
        </Row>
        <Row label="Рубашка карт" hint="Своя картинка для этого виджета; у колоды может быть своя">
          <div className="inline-control">
            {tarot.back?.imageId && (
              <span className="slot-thumb">
                <img src={`tasimage://asset/${tarot.back.imageId}`} alt="" />
              </span>
            )}
            <button
              type="button"
              className="btn btn--small"
              onClick={async () => {
                const asset = await window.widgets.pickImage()
                if (asset) {
                  setBackCrop({ asset, crop: { x: 50, y: 50, zoom: 1 } })
                }
              }}
            >
              {tarot.back?.imageId ? 'Заменить' : 'Выбрать'}
            </button>
            {tarot.back?.imageId && (
              <button
                type="button"
                className="btn btn--small btn--danger-ghost"
                onClick={() => patchSettings({ back: null })}
              >
                Убрать
              </button>
            )}
          </div>
        </Row>
        <Row label="Перевёрнутые карты">
          <Toggle
            checked={tarot.reversed}
            onChange={(value) => patchSettings({ reversed: value })}
          />
        </Row>
        <Row label="Показывать значения">
          <Toggle
            checked={tarot.showMeanings}
            onChange={(value) => patchSettings({ showMeanings: value })}
          />
        </Row>
        <Row label="Карты рубашкой" hint="Переворачиваются по клику; работает и в блокировке">
          <Toggle
            checked={tarot.faceDown}
            onChange={(value) => patchSettings({ faceDown: value })}
          />
        </Row>
        <Row
          label="Клик и переворот в блокировке"
          hint="Виджет остаётся интерактивным, но перетаскивать его нельзя."
        >
          <Toggle
            checked={tarot.interactiveWhenLocked}
            onChange={(value) => patchSettings({ interactiveWhenLocked: value })}
          />
        </Row>
      </Section>

      <Section title="Колода" hint="свои изображения для каждой карты">
        <Row label="Набор">
          <select
            className="select"
            value={tarot.deckId ?? ''}
            onChange={(event) => patchSettings({ deckId: event.target.value || null })}
          >
            <option value="">По умолчанию (графика)</option>
            {state.tarotDecks.map((deck) => (
              <option value={deck.id} key={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </Row>
        <div className="slot-editor__actions">
          <button type="button" className="btn btn--small" onClick={() => setEditor('new')}>
            Создать колоду
          </button>
          <button
            type="button"
            className="btn btn--small"
            disabled={!selectedDeck}
            onClick={() => selectedDeck && setEditor(selectedDeck)}
          >
            Редактировать
          </button>
          {selectedDeck && (
            <button
              type="button"
              className="btn btn--small btn--danger-ghost"
              onClick={() => {
                void window.widgets.deleteTarotDeck(selectedDeck.id)
                patchSettings({ deckId: null })
              }}
            >
              Удалить
            </button>
          )}
        </div>
        <div className="style-note">
          Создайте колоду, выберите картинку и при желании своё название и значения для каждой из 78
          карт — колода сохранится как пресет.
        </div>
      </Section>

      {editor && (
        <TarotDeckEditor
          deck={editor === 'new' ? null : editor}
          onClose={() => setEditor(null)}
          onSave={(deck) => {
            void window.widgets.saveTarotDeck(deck).then((saved) => {
              patchSettings({ deckId: saved.id })
              setEditor(null)
            })
          }}
        />
      )}

      {backCrop && (
        <CropModal
          asset={backCrop.asset}
          initial={backCrop.crop}
          aspect={92 / 140}
          title="Рубашка карт"
          onSave={(crop) => {
            patchSettings({
              back: {
                enabled: true,
                imageId: backCrop.asset.id,
                crop,
                opacity: 1,
                darken: 0,
                blend: 'normal',
                inset: 0,
                position: 'behind',
                placement: { x: 0, y: 0, scaleX: 100, scaleY: 100, rotate: 0, stretch: true }
              }
            })
            setBackCrop(null)
          }}
          onClose={() => setBackCrop(null)}
        />
      )}
    </>
  )
}

function DicePanel({ instance, patchSettings }: PanelProps): JSX.Element {
  const dice = instance.settings as DiceSettings
  const [crop, setCrop] = useState<{
    key: 'diceSkin' | 'coinHeads' | 'coinTails'
    asset: ImageAsset
  } | null>(null)

  const slot = (key: 'diceSkin' | 'coinHeads' | 'coinTails'): ImageSlot | null => dice[key]
  const defaultSlot: ImageSlot = {
    enabled: true,
    imageId: '',
    crop: { x: 50, y: 50, zoom: 1 },
    opacity: 1,
    darken: 0,
    blend: 'normal',
    inset: 0,
    position: 'behind',
    placement: { x: 0, y: 0, scaleX: 100, scaleY: 100, rotate: 0, stretch: true }
  }
  const pick = async (key: 'diceSkin' | 'coinHeads' | 'coinTails'): Promise<void> => {
    const asset = await window.widgets.pickImage()
    if (!asset) return
    patchSettings({ [key]: { ...(dice[key] ?? defaultSlot), imageId: asset.id } })
    setCrop({ key, asset })
  }
  const saveCrop = (cropValue: ImageCrop): void => {
    if (!crop) return
    const current = dice[crop.key] ?? defaultSlot
    patchSettings({ [crop.key]: { ...current, crop: cropValue } })
    setCrop(null)
  }

  const SlotRow = ({
    label,
    keyName,
    hint
  }: {
    label: string
    keyName: 'diceSkin' | 'coinHeads' | 'coinTails'
    hint: string
  }): JSX.Element => {
    const value = slot(keyName)
    return (
      <>
        <div className="image-row">
          <div className="slot-thumb slot-thumb--wide">
            {value?.imageId ? (
              <img src={`tasimage://asset/${value.imageId}`} alt="" />
            ) : (
              <span>нет</span>
            )}
          </div>
          <div className="image-row__text">
            <div className="slot-editor__label">{label}</div>
            <div className="slot-editor__hint">{hint}</div>
          </div>
          <button type="button" className="btn btn--small" onClick={() => void pick(keyName)}>
            {value?.imageId ? 'Заменить' : 'Выбрать'}
          </button>
        </div>
        {value?.imageId && (
          <>
            <Row label="Прозрачность">
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={value.opacity}
                onChange={(opacity) => patchSettings({ [keyName]: { ...value, opacity } })}
                format={(item) => `${Math.round(item * 100)}%`}
              />
            </Row>
            <Row label="Затемнение">
              <Slider
                min={0}
                max={0.9}
                step={0.02}
                value={value.darken}
                onChange={(darken) => patchSettings({ [keyName]: { ...value, darken } })}
                format={(item) => `${Math.round(item * 100)}%`}
              />
            </Row>
            <div className="slot-editor__actions">
              <button
                type="button"
                className="btn btn--small"
                onClick={() =>
                  setCrop({
                    key: keyName,
                    asset: { id: value.imageId, name: label, file: '', width: 0, height: 0 }
                  })
                }
              >
                Кадрировать
              </button>
              <button
                type="button"
                className="btn btn--small btn--danger-ghost"
                onClick={() => patchSettings({ [keyName]: null })}
              >
                Убрать
              </button>
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <Section title="Кубик" hint="грани, монета и свои скины">
      <Row label="Тип">
        <Segmented
          value={dice.die}
          options={[
            { value: 'd6', label: 'd6' },
            { value: 'd20', label: 'd20' },
            { value: 'coin', label: 'монета' }
          ]}
          onChange={(value) => patchSettings({ die: value })}
        />
      </Row>
      {dice.die !== 'coin' && (
        <Row label="Количество">
          <Segmented
            value={String(dice.count)}
            options={[
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3', label: '3' }
            ]}
            onChange={(value) => patchSettings({ count: Number(value) as 1 | 2 | 3 })}
          />
        </Row>
      )}
      {dice.die === 'd20' && (
        <Row label="Критические исходы" hint="1 — провал, 20 — успех">
          <Toggle checked={dice.crit} onChange={(value) => patchSettings({ crit: value })} />
        </Row>
      )}
      {dice.die !== 'coin' && (
        <Row label="Точки на кубике">
          <Toggle checked={dice.showPips} onChange={(showPips) => patchSettings({ showPips })} />
        </Row>
      )}
      <Row label={dice.die === 'coin' ? 'Символ на монете' : 'Числа на гранях'}>
        <Toggle
          checked={dice.showFaceText}
          onChange={(showFaceText) => patchSettings({ showFaceText })}
        />
      </Row>
      {dice.die === 'coin' && (
        <Row label="Подписи «Орёл/Решка» на монете">
          <Toggle
            checked={dice.showCoinLabel}
            onChange={(showCoinLabel) => patchSettings({ showCoinLabel })}
          />
        </Row>
      )}
      {dice.die === 'd20' && (
        <>
          <Row label="Текст критического успеха" hint="До 70 символов">
            <input
              className="text-input"
              maxLength={70}
              value={dice.critText}
              onChange={(event) => patchSettings({ critText: event.target.value })}
            />
          </Row>
          <Row label="Текст критического провала" hint="До 70 символов">
            <input
              className="text-input"
              maxLength={70}
              value={dice.failText}
              onChange={(event) => patchSettings({ failText: event.target.value })}
            />
          </Row>
        </>
      )}
      <Row label="Отключить всю обводку" hint="Полезно, если установлен свой скин">
        <Toggle
          checked={dice.hideOutline}
          onChange={(hideOutline) => patchSettings({ hideOutline })}
        />
      </Row>
      {dice.die !== 'coin' && (
        <SlotRow
          label="Скин кубика"
          keyName="diceSkin"
          hint="Одна картинка на все грани; можно убрать точки и числа"
        />
      )}
      {dice.die === 'coin' && (
        <>
          <SlotRow label="Орёл" keyName="coinHeads" hint="Своя картинка для стороны «Орёл»" />
          <SlotRow label="Решка" keyName="coinTails" hint="Своя картинка для стороны «Решка»" />
        </>
      )}
      <Row
        label="Интерактивность в блокировке"
        hint="Кубик и переключатель остаются активными; область виджета перехватывает клики."
      >
        <Toggle
          checked={dice.interactiveWhenLocked}
          onChange={(value) => patchSettings({ interactiveWhenLocked: value })}
        />
      </Row>
      {crop && (
        <CropModal
          asset={crop.asset}
          initial={dice[crop.key]?.crop ?? { x: 50, y: 50, zoom: 1 }}
          aspect={1}
          title={
            crop.key === 'diceSkin' ? 'Скин кубика' : crop.key === 'coinHeads' ? 'Орёл' : 'Решка'
          }
          onSave={saveCrop}
          onClose={() => setCrop(null)}
        />
      )}
    </Section>
  )
}

function EqualizerPanel({ instance, patchSettings }: PanelProps): JSX.Element {
  const eq = instance.settings as EqualizerSettings
  const [displays, setDisplays] = useState<RuntimeInfo['displays']>([])
  useEffect(() => {
    window.widgets
      .getRuntime()
      .then((runtime) => setDisplays(runtime.displays))
      .catch(() => undefined)
  }, [])
  return (
    <Section title="Эквалайзер" hint="визуализация текущей музыки">
      <VisualizerControls
        value={eq.visualizer}
        onChange={(visualizer) => patchSettings({ visualizer })}
        allowedModes={['off', 'radial', 'particles']}
      />
      <Row label="Масштаб визуализации" hint="50–500%; размер окна меняется вместе с визуализацией">
        <Slider
          min={0.5}
          max={5}
          step={0.05}
          value={eq.scale}
          onChange={(scale) => patchSettings({ scale })}
          format={(value) => `${Math.round(value * 100)}%`}
        />
      </Row>
      <Row label="Монитор" hint="Эквалайзер не будет перескакивать на другой монитор даже частично">
        <select
          className="select"
          value={eq.displayId ?? 0}
          onChange={(event) => patchSettings({ displayId: Number(event.target.value) || null })}
        >
          <option value={0}>Текущий</option>
          {displays.map((display) => (
            <option value={display.id} key={display.id}>
              {display.label}
            </option>
          ))}
        </select>
      </Row>
      <Row label="Размещение" hint="Полоса по краю монитора на всю длину">
        <select
          className="select"
          value={eq.dock}
          onChange={(event) => {
            const dock = event.target.value
            patchSettings({ dock })
            if (dock === 'free') window.widgets.setManualSize(instance.id, null)
          }}
        >
          <option value="free">Обычное окно</option>
          <option value="bottom">Нижний край</option>
          <option value="top">Верхний край</option>
          <option value="left">Левый край</option>
          <option value="right">Правый край</option>
        </select>
      </Row>
      {eq.dock !== 'free' && (
        <Row label="Толщина полосы">
          <Slider
            min={48}
            max={320}
            step={2}
            value={eq.dockThickness}
            onChange={(dockThickness) => patchSettings({ dockThickness })}
            format={(value) => `${value}px`}
          />
        </Row>
      )}
      <Row label="Отражение">
        <div className="inline-control">
          <Toggle checked={eq.mirrorX} onChange={(mirrorX) => patchSettings({ mirrorX })} />
          <span className="row__hint">по горизонтали</span>
        </div>
      </Row>
      <Row label="Отражение">
        <div className="inline-control">
          <Toggle checked={eq.mirrorY} onChange={(mirrorY) => patchSettings({ mirrorY })} />
          <span className="row__hint">по вертикали</span>
        </div>
      </Row>
      {eq.dock === 'free' && (
        <Row label="Край монитора" hint="Центрирует окно у выбранной грани">
          <div className="slot-editor__actions">
            <button
              type="button"
              className="btn btn--small"
              onClick={() => window.widgets.alignEqualizer(instance.id, 'top')}
            >
              Сверху
            </button>
            <button
              type="button"
              className="btn btn--small"
              onClick={() => window.widgets.alignEqualizer(instance.id, 'bottom')}
            >
              Снизу
            </button>
            <button
              type="button"
              className="btn btn--small"
              onClick={() => window.widgets.alignEqualizer(instance.id, 'left')}
            >
              Слева
            </button>
            <button
              type="button"
              className="btn btn--small"
              onClick={() => window.widgets.alignEqualizer(instance.id, 'right')}
            >
              Справа
            </button>
          </div>
        </Row>
      )}
      <div className="style-note">
        Данные берутся из системной медиа-сессии Windows — как у виджета музыки.
      </div>
    </Section>
  )
}

function TodoPanel({ instance, patchSettings }: PanelProps): JSX.Element {
  const todo = instance.settings as TodoSettings
  const done = todo.items.filter((item) => item.done).length
  return (
    <Section title="Дела на неделю" hint="список и отметки">
      <Row label="Вид по умолчанию">
        <Segmented
          value={todo.view}
          options={[
            { value: 'today', label: 'Сегодня' },
            { value: 'week', label: 'Неделя' }
          ]}
          onChange={(view) => patchSettings({ view })}
        />
      </Row>
      <Row label="Выполненные">
        <Toggle
          checked={todo.showCompleted}
          onChange={(value) => patchSettings({ showCompleted: value })}
        />
      </Row>
      <Row label="Отметки в блокировке" hint="Чекбоксы работают, окно перехватывает клики">
        <Toggle
          checked={todo.interactiveWhenLocked}
          onChange={(value) => patchSettings({ interactiveWhenLocked: value })}
        />
      </Row>

      <div className="slot-editor__actions">
        <button
          type="button"
          className="btn btn--small"
          onClick={() => patchSettings({ items: todo.items.filter((item) => !item.done) })}
        >
          Убрать выполненные ({done})
        </button>
        <button
          type="button"
          className="btn btn--small btn--danger-ghost"
          onClick={() => patchSettings({ items: [] })}
        >
          Очистить всё
        </button>
      </div>
      <div className="style-note">
        Дела добавляются прямо на виджете. Стикеры больше не используются.
      </div>
    </Section>
  )
}

function SimsPanel({ instance, patchSettings }: PanelProps): JSX.Element {
  const sims = instance.settings as SimsSettings
  return (
    <Section title="Sims" hint="пламбоб и потребности">
      <Row label="Режим">
        <Segmented
          value={sims.mode}
          options={[
            { value: 'plumbob', label: 'Пламбоб' },
            { value: 'needs', label: 'Потребности' }
          ]}
          onChange={(mode) => patchSettings({ mode })}
        />
      </Row>
      <Row
        label="Сложность"
        hint="Лайт: +24 и +2★. Хард: +16 и +1★, побочный минус и быстрее просадка"
      >
        <Segmented
          value={sims.difficulty}
          options={[
            { value: 'classic', label: 'Лайт' },
            { value: 'hard', label: 'Хард' }
          ]}
          onChange={(difficulty) => patchSettings({ difficulty })}
        />
      </Row>
      <Row label="Баллы">
        <Toggle
          checked={sims.showPoints}
          onChange={(value) => patchSettings({ showPoints: value })}
        />
      </Row>
      <Row label="Режим сложности" hint="Подпись «база/хард» в нижней строке">
        <Toggle
          checked={sims.showDifficulty}
          onChange={(value) => patchSettings({ showDifficulty: value })}
        />
      </Row>
      <Row label="Число настроения" hint="Цифровое значение рядом со шкалой">
        <Toggle
          checked={sims.showMoodValue}
          onChange={(value) => patchSettings({ showMoodValue: value })}
        />
      </Row>
      <Row label="Стрелка меню" hint="Тонкая стрелка при наведении открывает панель действий">
        <Toggle
          checked={sims.showArrow}
          onChange={(value) => patchSettings({ showArrow: value })}
        />
      </Row>
      <Row label="Вид пламбоба">
        <Segmented
          value={sims.plumbobVariant}
          options={[
            { value: 'classic', label: 'Классика' },
            { value: 'faceted', label: 'Грани' }
          ]}
          onChange={(plumbobVariant) => patchSettings({ plumbobVariant })}
        />
      </Row>
      <Row label="Группа" hint="Виджеты с одинаковой группой реагируют друг на друга">
        <input
          className="text-input"
          value={sims.groupId}
          maxLength={24}
          onChange={(event) => patchSettings({ groupId: event.target.value || 'sim-1' })}
        />
      </Row>
      <Row label="Название" hint="Подпись на пламбобе">
        <input
          className="text-input"
          value={sims.label}
          maxLength={24}
          onChange={(event) => patchSettings({ label: event.target.value })}
        />
      </Row>
      <Row label="Цвет">
        <Segmented
          value={sims.colorMode}
          options={[
            { value: 'mood', label: 'По настроению' },
            { value: 'custom', label: 'Свой' }
          ]}
          onChange={(colorMode) => patchSettings({ colorMode })}
        />
      </Row>
      {sims.colorMode === 'custom' && (
        <Row label="Цвет пламбоба">
          <input
            type="color"
            className="color-input"
            value={sims.color}
            onChange={(event) => patchSettings({ color: event.target.value })}
          />
        </Row>
      )}
      <Row label="Анимация">
        <Segmented
          value={sims.animation}
          options={[
            { value: 'float', label: 'Парение' },
            { value: 'spin', label: 'Вращение' },
            { value: 'pulse', label: 'Пульс' },
            { value: 'none', label: 'Нет' }
          ]}
          onChange={(animation) => patchSettings({ animation })}
        />
      </Row>
      <Row label="Подпись">
        <Toggle
          checked={sims.showLabel}
          onChange={(value) => patchSettings({ showLabel: value })}
        />
      </Row>
      <Row label="Блики и частицы" hint="Светящиеся искры вокруг пламбоба">
        <Toggle checked={sims.bling} onChange={(value) => patchSettings({ bling: value })} />
      </Row>
      {sims.bling && (
        <Row label="Интенсивность бликов">
          <Slider
            min={0.2}
            max={1.5}
            step={0.05}
            value={sims.blingIntensity}
            onChange={(blingIntensity) => patchSettings({ blingIntensity })}
            format={(value) => `${Math.round(value * 100)}%`}
          />
        </Row>
      )}
      <Row label="Игра в блокировке" hint="Кнопки потребностей остаются активными">
        <Toggle
          checked={sims.interactiveWhenLocked}
          onChange={(value) => patchSettings({ interactiveWhenLocked: value })}
        />
      </Row>
      <div className="slot-editor__actions">
        <button
          type="button"
          className="btn btn--small"
          onClick={() => void window.widgets.simsAction(sims.groupId, 'reset')}
        >
          Сбросить настроение
        </button>
      </div>
      <div className="style-note">
        Добавьте вторую копию Sims с тем же groupId — например, «потребности» рядом с пламбобом.
      </div>
    </Section>
  )
}

function FinancePanel({ instance, patchSettings }: PanelProps): JSX.Element {
  const finance = instance.settings as FinanceSettings
  return (
    <Section title="Финансы" hint="ставка и курсы ЦБ РФ, калькулятор">
      <Row label="Валюты" hint="До 3 кодов через запятую: USD, EUR, CNY">
        <input
          className="text-input"
          value={finance.currencyCodes.join(', ')}
          onChange={(event) =>
            patchSettings({
              currencyCodes: event.target.value
                .split(',')
                .map((code) => code.trim().toUpperCase())
                .filter(Boolean)
                .slice(0, 3)
            })
          }
        />
      </Row>
      <Row label="Ключевая ставка">
        <Toggle
          checked={finance.showKeyRate}
          onChange={(showKeyRate) => patchSettings({ showKeyRate })}
        />
      </Row>
      <div className="style-note">
        Курсы и ключевая ставка обновляются автоматически. Банковские ставки не парсятся —
        калькулятор считает по вашим значениям.
      </div>
    </Section>
  )
}

function TwitchPanel({ instance, patchSettings }: PanelProps): JSX.Element {
  const twitch = instance.settings as TwitchSettings
  return (
    <Section title="Twitch" hint="статус каналов и онлайн">
      <Row label="Каналы" hint="По одному в строке или через запятую">
        <textarea
          className="text-input textarea-input"
          value={twitch.channels.join('\n')}
          onChange={(event) =>
            patchSettings({
              channels: event.target.value
                .split(/[\n,]+/)
                .map((channel) => channel.trim().replace(/^#/, ''))
                .filter(Boolean)
                .slice(0, 12)
            })
          }
        />
      </Row>
      <Row label="Client ID" hint="Из приложения Twitch Developer">
        <input
          className="text-input"
          value={twitch.clientId}
          onChange={(event) => patchSettings({ clientId: event.target.value })}
        />
      </Row>
      <Row label="Client Secret">
        <input
          className="text-input"
          type="password"
          value={twitch.clientSecret}
          onChange={(event) => patchSettings({ clientSecret: event.target.value })}
        />
      </Row>
      <Row label="Показывать offline">
        <Toggle
          checked={twitch.showOffline}
          onChange={(showOffline) => patchSettings({ showOffline })}
        />
      </Row>
      <div className="style-note">
        Без ключей виджет показывает подсказку. Ключи хранятся локально.
      </div>
    </Section>
  )
}

function SystemPanel({ instance, patchSettings }: PanelProps): JSX.Element {
  const system = instance.settings as SystemSettings
  return (
    <Section title="Система" hint="минималистичный монитор">
      <Row label="Ориентация">
        <Segmented
          value={system.orientation}
          options={[
            { value: 'horizontal', label: 'Горизонтально' },
            { value: 'vertical', label: 'Вертикально' }
          ]}
          onChange={(orientation) => patchSettings({ orientation })}
        />
      </Row>
      <Row label="CPU">
        <Toggle checked={system.showCpu} onChange={(showCpu) => patchSettings({ showCpu })} />
      </Row>
      <Row label="RAM">
        <Toggle checked={system.showRam} onChange={(showRam) => patchSettings({ showRam })} />
      </Row>
      <Row label="GPU">
        <Toggle checked={system.showGpu} onChange={(showGpu) => patchSettings({ showGpu })} />
      </Row>
      <Row label="Сеть">
        <Toggle
          checked={system.showNetwork}
          onChange={(showNetwork) => patchSettings({ showNetwork })}
        />
      </Row>
    </Section>
  )
}

export function WidgetPanel(props: PanelProps): JSX.Element {
  const type = props.instance.type
  if (props.section === 'style') {
    return (
      <StyleEditor
        instance={props.instance}
        state={props.state}
        onChange={(style) => props.patchInstance({ style })}
        onApplyAll={props.onApplyAll}
      />
    )
  }
  return (
    <>
      <CommonSection {...props} />
      {type === 'weather' && <WeatherPanel {...props} />}
      {type === 'music' && <MusicPanel {...props} />}
      {type === 'clock' && <ClockPanel {...props} />}
      {type === 'weekday' && <WeekdayPanel {...props} />}
      {type === 'calendar' && <CalendarPanel {...props} />}
      {type === 'astro' && <AstroPanel {...props} />}
      {type === 'tarot' && <TarotPanel {...props} />}
      {type === 'dice' && <DicePanel {...props} />}
      {type === 'equalizer' && <EqualizerPanel {...props} />}
      {type === 'todo' && <TodoPanel {...props} />}
      {type === 'sims' && <SimsPanel {...props} />}
      {type === 'finance' && <FinancePanel {...props} />}
      {type === 'twitch' && <TwitchPanel {...props} />}
      {type === 'system' && <SystemPanel {...props} />}
    </>
  )
}
