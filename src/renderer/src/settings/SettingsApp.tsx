import { useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import type {
  AppSettings,
  City,
  EqualizerSettings,
  ImageAsset,
  SettingsPatch,
  SimsNeed,
  SimsSettings,
  VisualizerSettings,
  WeatherInstancePatch,
  WeatherProvider,
  WeatherSettings,
  WidgetId,
  WindowLayer,
  WindowStyle,
  WindowStylePreset,
  WindowTarget
} from '@shared/types'
import { MAX_EQUALIZER_COPIES, MAX_SIMS_INSTANCES, MAX_WEATHER_CITIES } from '@shared/defaults'
import { SIMS_ACHIEVEMENTS, SIMS_NEEDS } from '@shared/sims'
import { WINDOW_PRESETS } from '@shared/windowStyle'
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

function WindowControls({
  locked,
  layer,
  onLocked,
  onLayer,
  onReset
}: {
  locked: boolean
  layer: WindowLayer
  onLocked: (locked: boolean) => void
  onLayer: (layer: WindowLayer) => void
  onReset: () => void
}): ReactElement {
  return (
    <>
      <div className="row">
        <div className="row__text">
          <span className="row__label">Заблокировать</span>
          <span className="row__hint">Окно нельзя перетащить, кнопки продолжают работать</span>
        </div>
        <Switch checked={locked} onChange={onLocked} />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Слой</span>
          <span className="row__hint">0 — рабочий стол, 1–3 — поверх остальных окон</span>
        </div>
        <select
          className="select"
          value={layer}
          onChange={event => onLayer(Number(event.target.value) as WindowLayer)}
        >
          <option value={0}>Рабочий стол</option>
          <option value={1}>Слой 1</option>
          <option value={2}>Слой 2</option>
          <option value={3}>Слой 3</option>
        </select>
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Положение</span>
          <span className="row__hint">Вернуть окно на стандартное место</span>
        </div>
        <div className="align-buttons">
          <button type="button" onClick={onReset}>
            Сбросить положение
          </button>
        </div>
      </div>
    </>
  )
}

function WindowStyleControls({
  target,
  style,
  customStyles,
  accent,
  refresh
}: {
  target: WindowTarget
  style: WindowStyle
  customStyles: WindowStylePreset[]
  accent: boolean
  refresh: () => Promise<void>
}): ReactElement {
  const [name, setName] = useState('')
  const [assets, setAssets] = useState<ImageAsset[]>([])

  useEffect(() => {
    window.api
      .listImages()
      .then(items => setAssets(items))
      .catch(() => undefined)
  }, [])

  const apply = (next: WindowStyle): void => {
    void window.api.setWindowStyle(target, next).then(refresh)
  }
  const patch = (next: Partial<WindowStyle>): void => apply({ ...style, ...next })
  const patchOutline = (next: Partial<WindowStyle['outline']>): void =>
    patch({ outline: { ...style.outline, ...next } })
  const patchGlow = (next: Partial<WindowStyle['glow']>): void =>
    patch({ glow: { ...style.glow, ...next } })
  const patchAccent = (next: Partial<WindowStyle['accent']>): void =>
    patch({ accent: { ...style.accent, ...next } })

  const patchImage = (index: number, next: Partial<WindowStyle['images'][number]>): void => {
    patch({
      images: style.images.map((image, itemIndex) =>
        itemIndex === index ? { ...image, ...next } : image
      )
    })
  }

  const addImageLayer = (assetId: string | null = null): void => {
    if (style.images.length >= 2) return
    patch({
      images: [
        ...style.images,
        { assetId, zoom: 1, x: 50, y: 50, opacity: 1, dim: 0, saturation: 1 }
      ]
    })
  }

  const removeImageLayer = (index: number): void => {
    patch({ images: style.images.filter((_, itemIndex) => itemIndex !== index) })
  }

  const moveImageLayer = (index: number, direction: -1 | 1): void => {
    const target = index + direction
    if (target < 0 || target >= style.images.length) return
    const images = [...style.images]
    const [item] = images.splice(index, 1)
    images.splice(target, 0, item)
    patch({ images })
  }

  const uploadImage = async (index: number): Promise<void> => {
    const asset = await window.api.addImage()
    if (!asset) return
    setAssets(current => [asset, ...current.filter(item => item.id !== asset.id)])
    patchImage(index, { assetId: asset.id })
  }

  const useAsset = (asset: ImageAsset): void => {
    if (style.images.length < 2) addImageLayer(asset.id)
    else patchImage(style.images.length - 1, { assetId: asset.id })
  }

  return (
    <>
      <div className="row row--stacked">
        <div className="row__text">
          <span className="row__label">Стиль окна</span>
          <span className="row__hint">Пресеты и свои сохранённые стили</span>
        </div>
        <div className="style-presets">
          {WINDOW_PRESETS.map(preset => (
            <button
              type="button"
              key={preset.id}
              onClick={() => apply(structuredClone(preset.style))}
            >
              {preset.name}
            </button>
          ))}
        </div>
        <div className="style-save">
          <input
            className="text-input"
            type="text"
            value={name}
            placeholder="Название своего стиля"
            onChange={event => setName(event.target.value)}
          />
          <button
            type="button"
            className="style-button"
            onClick={() => {
              if (!name.trim()) return
              void window.api.saveStyle(name, style).then(() => {
                setName('')
                void refresh()
              })
            }}
          >
            Сохранить
          </button>
          <button
            type="button"
            className="style-button"
            onClick={() => void window.api.applyStyleToAll(style).then(refresh)}
          >
            Ко всем виджетам
          </button>
        </div>
        {customStyles.length > 0 && (
          <div className="style-presets">
            {customStyles.map(preset => (
              <span className="style-preset" key={preset.id}>
                <button type="button" onClick={() => apply(structuredClone(preset.style))}>
                  {preset.name}
                </button>
                <button
                  type="button"
                  className="style-preset__remove"
                  title="Удалить стиль"
                  onClick={() => void window.api.removeStyle(preset.id).then(refresh)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Без окна</span>
          <span className="row__hint">Прозрачный фон, без рамки и отступов</span>
        </div>
        <Switch checked={style.windowless} onChange={windowless => patch({ windowless })} />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Скругление углов</span>
        </div>
        <Slider
          min={0}
          max={48}
          step={1}
          value={style.radius}
          onChange={radius => patch({ radius })}
          format={item => `${item}px`}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Фон</span>
          <span className="row__hint">Градиент и прозрачность</span>
        </div>
        <div className="color-pair">
          <input
            type="color"
            className="color-input"
            value={style.background.color1}
            onChange={event =>
              patch({ background: { ...style.background, color1: event.target.value } })
            }
          />
          <input
            type="color"
            className="color-input"
            value={style.background.color2}
            onChange={event =>
              patch({ background: { ...style.background, color2: event.target.value } })
            }
          />
        </div>
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Угол градиента</span>
        </div>
        <Slider
          min={0}
          max={360}
          step={1}
          value={style.background.angle}
          onChange={angle => patch({ background: { ...style.background, angle } })}
          format={item => `${item}°`}
        />
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Прозрачность фона</span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={style.background.opacity}
          onChange={opacity => patch({ background: { ...style.background, opacity } })}
          format={item => `${Math.round(item * 100)}%`}
        />
      </div>

      <div className="row row--stacked">
        <div className="row__text">
          <span className="row__label">Картинки</span>
          <span className="row__hint">
            До двух слоёв. Оригиналы хранятся в библиотеке и переиспользуются
          </span>
        </div>

        {style.images.map((image, index) => {
          const asset = assets.find(item => item.id === image.assetId)
          return (
            <div className="image-layer" key={index}>
              <div className="image-layer__head">
                <span>Слой {index + 1}</span>
                <div className="image-layer__actions">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveImageLayer(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === style.images.length - 1}
                    onClick={() => moveImageLayer(index, 1)}
                  >
                    ↓
                  </button>
                  <button type="button" onClick={() => removeImageLayer(index)}>
                    ×
                  </button>
                </div>
              </div>

              <div
                className="image-preview"
                style={
                  asset?.thumb
                    ? {
                        backgroundImage: `url(${asset.thumb})`,
                        backgroundSize: `${image.zoom * 100}%`,
                        backgroundPosition: `${image.x}% ${image.y}%`,
                        opacity: image.opacity,
                        filter: `saturate(${image.saturation}) brightness(${1 - image.dim * 0.6})`
                      }
                    : undefined
                }
              >
                {!asset && <span>Картинка не выбрана</span>}
              </div>

              <div className="image-layer__row">
                <select
                  className="select"
                  value={image.assetId ?? ''}
                  onChange={event => patchImage(index, { assetId: event.target.value || null })}
                >
                  <option value="">— не выбрана —</option>
                  {assets.map(item => (
                    <option value={item.id} key={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="style-button"
                  onClick={() => void uploadImage(index)}
                >
                  Загрузить…
                </button>
              </div>

              <div className="image-layer__grid">
                <label>
                  Зум
                  <Slider
                    min={1}
                    max={6}
                    step={0.05}
                    value={image.zoom}
                    onChange={zoom => patchImage(index, { zoom })}
                    format={item => `${item.toFixed(2)}×`}
                  />
                </label>
                <label>
                  По X
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={image.x}
                    onChange={x => patchImage(index, { x })}
                    format={item => `${item}%`}
                  />
                </label>
                <label>
                  По Y
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={image.y}
                    onChange={y => patchImage(index, { y })}
                    format={item => `${item}%`}
                  />
                </label>
                <label>
                  Прозрачность
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={image.opacity}
                    onChange={opacity => patchImage(index, { opacity })}
                    format={item => `${Math.round(item * 100)}%`}
                  />
                </label>
                <label>
                  Затемнение
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={image.dim}
                    onChange={dim => patchImage(index, { dim })}
                    format={item => `${Math.round(item * 100)}%`}
                  />
                </label>
                <label>
                  Насыщенность
                  <Slider
                    min={0}
                    max={2}
                    step={0.01}
                    value={image.saturation}
                    onChange={saturation => patchImage(index, { saturation })}
                    format={item => `${Math.round(item * 100)}%`}
                  />
                </label>
              </div>
            </div>
          )
        })}

        {style.images.length < 2 && (
          <button type="button" className="style-button" onClick={() => addImageLayer()}>
            + Добавить слой
          </button>
        )}

        {assets.length > 0 && (
          <div className="image-library">
            <span className="row__hint">Библиотека оригиналов</span>
            <div className="image-library__grid">
              {assets.map(asset => (
                <div className="image-library__item" key={asset.id}>
                  <button
                    type="button"
                    className="image-library__thumb"
                    title={`Использовать «${asset.name}»`}
                    style={{ backgroundImage: asset.thumb ? `url(${asset.thumb})` : undefined }}
                    onClick={() => useAsset(asset)}
                  />
                  <span title={asset.name}>
                    {asset.name} · {asset.width}×{asset.height}
                  </span>
                  <button
                    type="button"
                    className="image-library__remove"
                    title="Удалить оригинал"
                    onClick={() =>
                      void window.api
                        .removeImage(asset.id)
                        .then(() => setAssets(items => items.filter(item => item.id !== asset.id)))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="row">
        <div className="row__text">
          <span className="row__label">Обводка</span>
          <span className="row__hint">Привязана к форме окна</span>
        </div>
        <Switch checked={style.outline.enabled} onChange={enabled => patchOutline({ enabled })} />
      </div>

      {style.outline.enabled && (
        <>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Положение обводки</span>
            </div>
            <Segmented
              value={style.outline.placement}
              options={[
                { value: 'under', label: 'Под окном' },
                { value: 'over', label: 'Над окном' }
              ]}
              onChange={placement => patchOutline({ placement })}
            />
          </div>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Цвет обводки</span>
            </div>
            <input
              type="color"
              className="color-input"
              value={style.outline.color}
              onChange={event => patchOutline({ color: event.target.value })}
            />
          </div>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Толщина</span>
            </div>
            <Slider
              min={0.5}
              max={12}
              step={0.5}
              value={style.outline.thickness}
              onChange={thickness => patchOutline({ thickness })}
              format={item => `${item}px`}
            />
          </div>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Свечение обводки</span>
            </div>
            <Slider
              min={0}
              max={24}
              step={1}
              value={style.outline.glow}
              onChange={glow => patchOutline({ glow })}
              format={item => `${item}px`}
            />
          </div>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Интенсивность</span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={style.outline.intensity}
              onChange={intensity => patchOutline({ intensity })}
              format={item => `${Math.round(item * 100)}%`}
            />
          </div>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Неоновая лампа</span>
              <span className="row__hint">Лёгкое мерцание обводки</span>
            </div>
            <Switch checked={style.outline.lamp} onChange={lamp => patchOutline({ lamp })} />
          </div>
        </>
      )}

      <div className="row">
        <div className="row__text">
          <span className="row__label">Свечение окна</span>
          <span className="row__hint">Не обрезается, пока spread ≤ 24 px</span>
        </div>
        <Switch checked={style.glow.enabled} onChange={enabled => patchGlow({ enabled })} />
      </div>

      {style.glow.enabled && (
        <>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Цвет свечения</span>
            </div>
            <input
              type="color"
              className="color-input"
              value={style.glow.color}
              onChange={event => patchGlow({ color: event.target.value })}
            />
          </div>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Сила</span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={style.glow.intensity}
              onChange={intensity => patchGlow({ intensity })}
              format={item => `${Math.round(item * 100)}%`}
            />
          </div>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Рассеивание</span>
            </div>
            <Slider
              min={0}
              max={24}
              step={1}
              value={style.glow.spread}
              onChange={spread => patchGlow({ spread })}
              format={item => `${item}px`}
            />
          </div>
        </>
      )}

      {accent && (
        <>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Световой акцент</span>
              <span className="row__hint">Мягкое пятно света внутри окна</span>
            </div>
            <Switch checked={style.accent.enabled} onChange={enabled => patchAccent({ enabled })} />
          </div>

          {style.accent.enabled && (
            <>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Цвет акцента</span>
                </div>
                <input
                  type="color"
                  className="color-input"
                  value={style.accent.color}
                  onChange={event => patchAccent({ color: event.target.value })}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Интенсивность</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={style.accent.intensity}
                  onChange={intensity => patchAccent({ intensity })}
                  format={item => `${Math.round(item * 100)}%`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Размер</span>
                </div>
                <Slider
                  min={15}
                  max={100}
                  step={1}
                  value={style.accent.size}
                  onChange={size => patchAccent({ size })}
                  format={item => `${item}%`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Позиция по X</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={style.accent.x}
                  onChange={x => patchAccent({ x })}
                  format={item => `${item}%`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Позиция по Y</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={style.accent.y}
                  onChange={y => patchAccent({ y })}
                  format={item => `${item}%`}
                />
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}

function NumberSlider({
  min,
  max,
  step,
  value,
  onChange,
  suffix
}: {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  suffix?: string
}): ReactElement {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  const commit = (next: number): void => {
    if (!Number.isFinite(next)) return
    const clamped = Math.min(max, Math.max(min, next))
    setLocal(clamped)
    onChange(clamped)
  }

  return (
    <div className="number-slider">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={local}
        onChange={event => commit(Number(event.target.value))}
      />
      <input
        type="number"
        className="number-input"
        min={min}
        max={max}
        step={step}
        value={Math.round(local * 100) / 100}
        onChange={event => commit(Number(event.target.value))}
      />
      {suffix && <span className="number-suffix">{suffix}</span>}
    </div>
  )
}

function SystemPanel({ settings, patch, toggleWidget, refresh }: PanelProps): ReactElement {
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

      <WindowControls
        locked={settings.widgets.system.locked}
        layer={settings.widgets.system.layer}
        onLocked={locked => void window.api.setWindowLock({ type: 'system' }, locked).then(refresh)}
        onLayer={layer => void window.api.setWindowLayer({ type: 'system' }, layer).then(refresh)}
        onReset={() => void window.api.resetWindowPosition({ type: 'system' }).then(refresh)}
      />

      <WindowStyleControls
        target={{ type: 'system' }}
        style={settings.widgets.system.style}
        customStyles={settings.customStyles}
        accent
        refresh={refresh}
      />

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

function MusicPanel({ settings, patch, toggleWidget, refresh }: PanelProps): ReactElement {
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

      <WindowControls
        locked={settings.widgets.music.locked}
        layer={settings.widgets.music.layer}
        onLocked={locked => void window.api.setWindowLock({ type: 'music' }, locked).then(refresh)}
        onLayer={layer => void window.api.setWindowLayer({ type: 'music' }, layer).then(refresh)}
        onReset={() => void window.api.resetWindowPosition({ type: 'music' }).then(refresh)}
      />

      <WindowStyleControls
        target={{ type: 'music' }}
        style={settings.widgets.music.style}
        customStyles={settings.customStyles}
        accent
        refresh={refresh}
      />

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

      <VisualizerControls
        value={music.visualizer}
        onChange={visualizer => patch({ music: { visualizer } })}
        allowedModes={['off', 'bars', 'dots']}
      />

      <p className="note">
        Визуализация рисуется на фоне окна. Для музыки доступны точки и столбики со своими
        настройками и свечением.
      </p>
    </section>
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
}): ReactElement {
  const set = (patch: Partial<VisualizerSettings>): void => onChange({ ...value, ...patch })
  const mode = value.mode
  const spectrum = ['bars', 'radial', 'line', 'waveform', 'dots'].includes(mode)
  const hasAxis = ['bars', 'line', 'dots', 'sparks'].includes(mode)

  return (
    <>
      <div className="row">
        <div className="row__text">
          <span className="row__label">Визуализация</span>
          <span className="row__hint">Что рисовать под музыку</span>
        </div>
        <Segmented
          value={mode}
          options={
            allowedModes
              ? VISUALIZER_MODES.filter(item => allowedModes.includes(item.value))
              : VISUALIZER_MODES
          }
          onChange={next => set({ mode: next })}
        />
      </div>

      {mode !== 'off' && (
        <>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Палитра</span>
              <span className="row__hint">Цвета низа и верха</span>
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

          {value.palette === 'custom' && (
            <div className="row">
              <div className="row__text">
                <span className="row__label">Свои цвета</span>
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
              <span className="row__hint">Ограничение роста элементов</span>
            </div>
            <Slider
              min={10}
              max={100}
              step={1}
              value={value.maxHeight}
              onChange={maxHeight => set({ maxHeight })}
              format={item => `${item}%`}
            />
          </div>

          {['bars', 'radial', 'line', 'waveform', 'dots'].includes(mode) && (
            <div className="row">
              <div className="row__text">
                <span className="row__label">Количество</span>
                <span className="row__hint">12–3600 элементов, можно ввести число</span>
              </div>
              <NumberSlider
                min={12}
                max={3600}
                step={1}
                value={value.bars}
                onChange={bars => set({ bars })}
              />
            </div>
          )}

          {mode === 'bars' && (
            <div className="row">
              <div className="row__text">
                <span className="row__label">Форма столбиков</span>
              </div>
              <Segmented
                value={value.barShape}
                options={[
                  { value: 'rounded', label: 'Закруглённые' },
                  { value: 'rect', label: 'Прямоугольные' }
                ]}
                onChange={barShape => set({ barShape })}
              />
            </div>
          )}

          {mode === 'bars' && (
            <>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Толщина столбика</span>
                </div>
                <Slider
                  min={1}
                  max={60}
                  step={1}
                  value={value.barThickness}
                  onChange={barThickness => set({ barThickness })}
                  format={item => `${item}px`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Зазор</span>
                </div>
                <Slider
                  min={0}
                  max={40}
                  step={1}
                  value={value.barGap}
                  onChange={barGap => set({ barGap })}
                  format={item => `${item}px`}
                />
              </div>
            </>
          )}

          {mode === 'radial' && (
            <div className="row">
              <div className="row__text">
                <span className="row__label">Толщина лучей</span>
              </div>
              <Slider
                min={1}
                max={24}
                step={0.5}
                value={value.barThickness}
                onChange={barThickness => set({ barThickness })}
                format={item => `${item}px`}
              />
            </div>
          )}

          {mode === 'line' && (
            <div className="row">
              <div className="row__text">
                <span className="row__label">Толщина линии</span>
              </div>
              <Slider
                min={1}
                max={24}
                step={0.5}
                value={value.lineThickness}
                onChange={lineThickness => set({ lineThickness })}
                format={item => `${item}px`}
              />
            </div>
          )}

          {mode === 'dots' && (
            <>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Размер точки</span>
                </div>
                <Slider
                  min={1}
                  max={30}
                  step={0.5}
                  value={value.dotSize}
                  onChange={dotSize => set({ dotSize })}
                  format={item => `${item}px`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Зазор</span>
                </div>
                <Slider
                  min={0}
                  max={40}
                  step={1}
                  value={value.barGap}
                  onChange={barGap => set({ barGap })}
                  format={item => `${item}px`}
                />
              </div>
            </>
          )}

          {mode === 'particles' && (
            <>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Источник частиц</span>
                  <span className="row__hint">Из низа окна или из центра с разбросом</span>
                </div>
                <Segmented
                  value={value.particleOrigin}
                  options={[
                    { value: 'bottom', label: 'Снизу' },
                    { value: 'center', label: 'Из центра' }
                  ]}
                  onChange={particleOrigin => set({ particleOrigin })}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Количество частиц</span>
                </div>
                <NumberSlider
                  min={20}
                  max={1200}
                  step={10}
                  value={value.particleCount}
                  onChange={particleCount => set({ particleCount })}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Распределение по области</span>
                  <span className="row__hint">Больше — равномернее по всей площади</span>
                </div>
                <Slider
                  min={0.1}
                  max={1}
                  step={0.01}
                  value={value.particleSpread}
                  onChange={particleSpread => set({ particleSpread })}
                  format={item => `${Math.round(item * 100)}%`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Реакция на музыку</span>
                  <span className="row__hint">Насколько резко ускоряются на битах</span>
                </div>
                <Slider
                  min={0}
                  max={3}
                  step={0.05}
                  value={value.particleReactivity}
                  onChange={particleReactivity => set({ particleReactivity })}
                  format={item => `${item.toFixed(2)}×`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Размер частиц</span>
                </div>
                <Slider
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={value.sparkSize}
                  onChange={sparkSize => set({ sparkSize })}
                  format={item => `${item}px`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Базовая скорость</span>
                </div>
                <Slider
                  min={0.2}
                  max={5}
                  step={0.05}
                  value={value.sparkSpeed}
                  onChange={sparkSpeed => set({ sparkSpeed })}
                  format={item => `${item.toFixed(1)}×`}
                />
              </div>
            </>
          )}

          {mode === 'waves' && (
            <>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Количество волн</span>
                  <span className="row__hint">Сколько волн одновременно</span>
                </div>
                <NumberSlider
                  min={1}
                  max={24}
                  step={1}
                  value={value.waveCount}
                  onChange={waveCount => set({ waveCount })}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Скорость волн</span>
                </div>
                <Slider
                  min={0.2}
                  max={5}
                  step={0.05}
                  value={value.waveSpeed}
                  onChange={waveSpeed => set({ waveSpeed })}
                  format={item => `${item.toFixed(1)}×`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Время жизни</span>
                  <span className="row__hint">Сколько живёт волна до растворения</span>
                </div>
                <Slider
                  min={0.4}
                  max={8}
                  step={0.1}
                  value={value.waveLife}
                  onChange={waveLife => set({ waveLife })}
                  format={item => `${item.toFixed(1)} с`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Интенсивность</span>
                </div>
                <Slider
                  min={0.1}
                  max={2}
                  step={0.05}
                  value={value.waveIntensity}
                  onChange={waveIntensity => set({ waveIntensity })}
                  format={item => `${Math.round(item * 100)}%`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Начальный радиус</span>
                </div>
                <NumberSlider
                  min={2}
                  max={400}
                  step={1}
                  value={value.waveRadius}
                  onChange={waveRadius => set({ waveRadius })}
                  suffix="px"
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Толщина волн</span>
                </div>
                <Slider
                  min={1}
                  max={24}
                  step={0.5}
                  value={value.waveThickness}
                  onChange={waveThickness => set({ waveThickness })}
                  format={item => `${item}px`}
                />
              </div>
            </>
          )}

          {hasAxis && (
            <>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Отражение</span>
                  <span className="row__hint">Зеркальная копия относительно оси</span>
                </div>
                <Switch checked={value.mirror} onChange={mirror => set({ mirror })} />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Положение оси</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={value.axis}
                  onChange={axis => set({ axis })}
                  format={item => `${Math.round(item * 100)}%`}
                />
              </div>
              {value.mirror && (
                <>
                  <div className="row">
                    <div className="row__text">
                      <span className="row__label">Сдвиг отражения X</span>
                      <span className="row__hint">Ось остаётся на месте</span>
                    </div>
                    <NumberSlider
                      min={-600}
                      max={600}
                      step={1}
                      value={value.mirrorOffsetX}
                      onChange={mirrorOffsetX => set({ mirrorOffsetX })}
                      suffix="px"
                    />
                  </div>
                  <div className="row">
                    <div className="row__text">
                      <span className="row__label">Сдвиг отражения Y</span>
                    </div>
                    <NumberSlider
                      min={-600}
                      max={600}
                      step={1}
                      value={value.mirrorOffsetY}
                      onChange={mirrorOffsetY => set({ mirrorOffsetY })}
                      suffix="px"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {mode === 'radial' && (
            <>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Отражение</span>
                  <span className="row__hint">Лучи с противоположной стороны</span>
                </div>
                <Switch checked={value.mirror} onChange={mirror => set({ mirror })} />
              </div>
              {value.mirror && (
                <>
                  <div className="row">
                    <div className="row__text">
                      <span className="row__label">Сдвиг отражения X</span>
                    </div>
                    <NumberSlider
                      min={-600}
                      max={600}
                      step={1}
                      value={value.mirrorOffsetX}
                      onChange={mirrorOffsetX => set({ mirrorOffsetX })}
                      suffix="px"
                    />
                  </div>
                  <div className="row">
                    <div className="row__text">
                      <span className="row__label">Сдвиг отражения Y</span>
                    </div>
                    <NumberSlider
                      min={-600}
                      max={600}
                      step={1}
                      value={value.mirrorOffsetY}
                      onChange={mirrorOffsetY => set({ mirrorOffsetY })}
                      suffix="px"
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="row">
            <div className="row__text">
              <span className="row__label">Поворот</span>
            </div>
            <Slider
              min={0}
              max={360}
              step={1}
              value={value.rotation}
              onChange={rotation => set({ rotation })}
              format={item => `${item}°`}
            />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Отражение по X</span>
            </div>
            <Switch checked={value.mirrorX} onChange={mirrorX => set({ mirrorX })} />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Отражение по Y</span>
            </div>
            <Switch checked={value.mirrorY} onChange={mirrorY => set({ mirrorY })} />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Свечение визуализации</span>
              <span className="row__hint">Для всех режимов</span>
            </div>
            <Switch checked={value.glowEnabled} onChange={glowEnabled => set({ glowEnabled })} />
          </div>

          {value.glowEnabled && (
            <>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Интенсивность свечения</span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={value.glowIntensity}
                  onChange={glowIntensity => set({ glowIntensity })}
                  format={item => `${Math.round(item * 100)}%`}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Рассеивание свечения</span>
                </div>
                <Slider
                  min={0}
                  max={60}
                  step={1}
                  value={value.glowSpread}
                  onChange={glowSpread => set({ glowSpread })}
                  format={item => `${item}px`}
                />
              </div>
            </>
          )}

          {spectrum && (
            <>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Частоты</span>
                  <span className="row__hint">Диапазон анализа, Гц</span>
                </div>
                <div className="range-pair">
                  <NumberSlider
                    min={20}
                    max={16000}
                    step={10}
                    value={value.freqMin}
                    onChange={freqMin =>
                      set({ freqMin, freqMax: Math.max(freqMin + 100, value.freqMax) })
                    }
                    suffix="Гц"
                  />
                  <NumberSlider
                    min={100}
                    max={22000}
                    step={100}
                    value={value.freqMax}
                    onChange={freqMax => set({ freqMax: Math.max(value.freqMin + 100, freqMax) })}
                    suffix="Гц"
                  />
                </div>
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Шкала частот</span>
                  <span className="row__hint">
                    Логарифм сжимает высокие частоты и даёт больше деталей в басе; линейно делит
                    диапазон поровну
                  </span>
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

          <WindowControls
            locked={active.locked}
            layer={active.layer}
            onLocked={locked =>
              void window.api
                .setWindowLock({ type: 'weather', instanceId: active.id }, locked)
                .then(refresh)
            }
            onLayer={layer =>
              void window.api
                .setWindowLayer({ type: 'weather', instanceId: active.id }, layer)
                .then(refresh)
            }
            onReset={() =>
              void window.api
                .resetWindowPosition({ type: 'weather', instanceId: active.id })
                .then(refresh)
            }
          />

          <WindowStyleControls
            target={{ type: 'weather', instanceId: active.id }}
            style={active.style}
            customStyles={settings.customStyles}
            accent
            refresh={refresh}
          />

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

function EqualizerPanel({ settings, refresh }: PanelProps): ReactElement {
  const instances = settings.equalizer.instances
  const [activeId, setActiveId] = useState<string | null>(instances[0]?.id ?? null)
  const active = instances.find(instance => instance.id === activeId) ?? instances[0] ?? null
  const [displays, setDisplays] = useState<Array<{ id: number; label: string }>>([])

  useEffect(() => {
    window.api
      .getDisplays()
      .then(items => setDisplays(items))
      .catch(() => undefined)
  }, [])

  const update = async (patch: Partial<EqualizerSettings>): Promise<void> => {
    if (!active) return
    await window.api.patchEqualizer(active.id, { settings: patch })
    await refresh()
  }

  const addCopy = async (): Promise<void> => {
    const instance = await window.api.addEqualizer()
    await refresh()
    if (instance) setActiveId(instance.id)
  }

  const removeCopy = async (id: string): Promise<void> => {
    await window.api.removeEqualizer(id)
    await refresh()
  }

  const toggleCopy = async (): Promise<void> => {
    if (!active) return
    if (active.enabled) await window.api.closeEqualizer(active.id)
    else await window.api.openEqualizer(active.id)
    await refresh()
  }

  return (
    <section className="panel">
      <div className="row row--stacked">
        <div className="row__text">
          <span className="row__label">Копии эквалайзера</span>
          <span className="row__hint">До 5 независимых визуализаций со своими настройками</span>
        </div>
        <div className="city-list">
          {instances.map((instance, index) => (
            <div
              className={`city-chip ${active?.id === instance.id ? 'is-active' : ''}`}
              key={instance.id}
            >
              <button
                type="button"
                className="city-chip__name"
                onClick={() => setActiveId(instance.id)}
              >
                Эквалайзер {index + 1}
              </button>
              <button
                type="button"
                className="city-chip__remove"
                title="Удалить копию"
                onClick={() => void removeCopy(instance.id)}
              >
                ×
              </button>
            </div>
          ))}
          {instances.length < MAX_EQUALIZER_COPIES && (
            <button type="button" className="city-add" onClick={() => void addCopy()}>
              + Добавить копию
            </button>
          )}
        </div>
      </div>

      {!active && (
        <p className="note">Копий пока нет. Добавьте копию, чтобы открыть визуализацию.</p>
      )}

      {active && (
        <>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Показывать эту копию</span>
              <span className="row__hint">
                {active.width} × {active.height} px — размер меняется перетаскиванием краёв окна
              </span>
            </div>
            <Switch checked={active.enabled} onChange={() => void toggleCopy()} />
          </div>

          <WindowControls
            locked={active.locked}
            layer={active.layer}
            onLocked={locked =>
              void window.api
                .setWindowLock({ type: 'equalizer', instanceId: active.id }, locked)
                .then(refresh)
            }
            onLayer={layer =>
              void window.api
                .setWindowLayer({ type: 'equalizer', instanceId: active.id }, layer)
                .then(refresh)
            }
            onReset={() =>
              void window.api
                .resetWindowPosition({ type: 'equalizer', instanceId: active.id })
                .then(refresh)
            }
          />

          <WindowStyleControls
            target={{ type: 'equalizer', instanceId: active.id }}
            style={active.style}
            customStyles={settings.customStyles}
            accent={false}
            refresh={refresh}
          />

          <div className="row">
            <div className="row__text">
              <span className="row__label">Положение</span>
              <span className="row__hint">Центр выбранного монитора</span>
            </div>
            <div className="align-buttons">
              <button type="button" onClick={() => void window.api.centerEqualizer(active.id)}>
                По центру монитора
              </button>
            </div>
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Монитор</span>
              <span className="row__hint">Для кнопки центрирования</span>
            </div>
            <select
              className="select"
              value={active.settings.displayId ?? 0}
              onChange={event => void update({ displayId: Number(event.target.value) || null })}
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
              <span className="row__label">Растянуть на весь монитор</span>
              <span className="row__hint">Окно займёт весь рабочий стол выбранного монитора</span>
            </div>
            <Switch
              checked={active.settings.stretch}
              onChange={stretch => void update({ stretch })}
            />
          </div>

          <VisualizerControls
            value={active.settings.visualizer}
            onChange={visualizer => void update({ visualizer })}
          />
        </>
      )}

      <p className="note">
        Звук захватывается через системный loopback Windows. При первом включении визуализации
        система может спросить разрешение на захват экрана.
      </p>
    </section>
  )
}

function SimsPanel({ settings, refresh }: PanelProps): ReactElement {
  const instances = settings.sims.instances
  const [activeId, setActiveId] = useState<string | null>(instances[0]?.id ?? null)
  const active = instances.find(instance => instance.id === activeId) ?? instances[0] ?? null

  const update = async (patch: { settings?: Partial<SimsSettings>; groupId?: string }) => {
    if (!active) return
    await window.api.patchSims(active.id, patch)
    await refresh()
  }

  const add = async (mode: 'plumbob' | 'needs'): Promise<void> => {
    const instance = await window.api.addSims(mode)
    await refresh()
    if (instance) setActiveId(instance.id)
  }

  const toggle = async (): Promise<void> => {
    if (!active) return
    if (active.enabled) await window.api.closeSims(active.id)
    else await window.api.openSims(active.id)
    await refresh()
  }

  return (
    <section className="panel">
      <div className="row row--stacked">
        <div className="row__text">
          <span className="row__label">Пламбоб и потребности</span>
          <span className="row__hint">До 4 окон, общая группа синхронизирует состояние</span>
        </div>
        <div className="city-list">
          {instances.map((instance, index) => (
            <div
              className={`city-chip ${active?.id === instance.id ? 'is-active' : ''}`}
              key={instance.id}
            >
              <button
                type="button"
                className="city-chip__name"
                onClick={() => setActiveId(instance.id)}
              >
                {instance.mode === 'needs' ? 'Потребности' : 'Пламбоб'} {index + 1}
              </button>
              <button
                type="button"
                className="city-chip__remove"
                onClick={() => void window.api.removeSims(instance.id).then(refresh)}
              >
                ×
              </button>
            </div>
          ))}
          {instances.length < MAX_SIMS_INSTANCES && (
            <>
              <button type="button" className="city-add" onClick={() => void add('plumbob')}>
                + Пламбоб
              </button>
              <button type="button" className="city-add" onClick={() => void add('needs')}>
                + Потребности
              </button>
            </>
          )}
        </div>
      </div>

      {active && (
        <>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Показывать это окно</span>
              <span className="row__hint">
                {active.mode === 'needs' ? 'Блок потребностей' : 'Кристалл с подписью'}
              </span>
            </div>
            <Switch checked={active.enabled} onChange={() => void toggle()} />
          </div>

          <WindowControls
            locked={active.locked}
            layer={active.layer}
            onLocked={locked =>
              void window.api
                .setWindowLock({ type: 'plumbob', instanceId: active.id }, locked)
                .then(refresh)
            }
            onLayer={layer =>
              void window.api
                .setWindowLayer({ type: 'plumbob', instanceId: active.id }, layer)
                .then(refresh)
            }
            onReset={() =>
              void window.api
                .resetWindowPosition({ type: 'plumbob', instanceId: active.id })
                .then(refresh)
            }
          />

          <WindowStyleControls
            target={{ type: 'plumbob', instanceId: active.id }}
            style={active.style}
            customStyles={settings.customStyles}
            accent
            refresh={refresh}
          />

          <div className="row">
            <div className="row__text">
              <span className="row__label">Группа</span>
              <span className="row__hint">Одинаковая группа — общие потребности и баллы</span>
            </div>
            <input
              className="text-input"
              value={active.groupId}
              onChange={event => void update({ groupId: event.target.value })}
            />
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Состояние группы</span>
              <span className="row__hint">Сбросить потребности, баллы и награды</span>
            </div>
            <div className="align-buttons">
              <button type="button" onClick={() => void window.api.resetSims(active.groupId)}>
                Сбросить
              </button>
            </div>
          </div>

          <div className="row">
            <div className="row__text">
              <span className="row__label">Режим сложности</span>
              <span className="row__hint">
                Лайт: +24 к потребности и +2★, хард: +16 и +1★, но быстрее просадка
              </span>
            </div>
            <Segmented
              value={active.settings.difficulty}
              options={[
                { value: 'light', label: 'Лайт' },
                { value: 'hard', label: 'Хард' }
              ]}
              onChange={difficulty => void update({ settings: { difficulty } })}
            />
          </div>

          {active.mode === 'plumbob' && (
            <>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Подпись</span>
                </div>
                <input
                  className="text-input"
                  value={active.settings.label}
                  onChange={event => void update({ settings: { label: event.target.value } })}
                />
              </div>
              <div className="row">
                <div className="row__text">
                  <span className="row__label">Анимация</span>
                </div>
                <select
                  className="select"
                  value={active.settings.animation}
                  onChange={event =>
                    void update({
                      settings: { animation: event.target.value as SimsSettings['animation'] }
                    })
                  }
                >
                  <option value="float">Парение</option>
                  <option value="spin">Вращение</option>
                  <option value="pulse">Пульсация</option>
                  <option value="none">Без анимации</option>
                </select>
              </div>
            </>
          )}

          <div className="row">
            <div className="row__text">
              <span className="row__label">Подпись состояния</span>
            </div>
            <Switch
              checked={active.settings.showLabel}
              onChange={showLabel => void update({ settings: { showLabel } })}
            />
          </div>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Баллы</span>
            </div>
            <Switch
              checked={active.settings.showPoints}
              onChange={showPoints => void update({ settings: { showPoints } })}
            />
          </div>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Режим сложности на виджете</span>
            </div>
            <Switch
              checked={active.settings.showDifficulty}
              onChange={showDifficulty => void update({ settings: { showDifficulty } })}
            />
          </div>
          <div className="row">
            <div className="row__text">
              <span className="row__label">Число настроения</span>
            </div>
            <Switch
              checked={active.settings.showMoodValue}
              onChange={showMoodValue => void update({ settings: { showMoodValue } })}
            />
          </div>

          {active.mode === 'needs' && (
            <div className="row row--stacked">
              <div className="row__text">
                <span className="row__label">Показывать потребности</span>
              </div>
              {SIMS_NEEDS.map(need => (
                <div className="row" key={need.key}>
                  <div className="row__text">
                    <span className="row__label">{need.label}</span>
                  </div>
                  <Switch
                    checked={active.settings.showNeeds[need.key as SimsNeed]}
                    onChange={value =>
                      void update({
                        settings: {
                          showNeeds: { ...active.settings.showNeeds, [need.key]: value }
                        }
                      })
                    }
                  />
                </div>
              ))}
            </div>
          )}

          <details className="sims-rules">
            <summary>Правила игры и награды</summary>
            <p>
              Лайт: +24 к потребности и +2★. Хард: +16 и +1★, побочный −4 и быстрее ночная просадка.
              Ночью 20:00–10:00 −1 (хард −2), днём −6 в час.
            </p>
            <p>
              При потребности ≤15 раз в 3 часа списывается 1★ за каждую низкую потребность. При
              настроении 80+ раз в 6 часов начисляется +3★ (лайт) / +2★ (хард). «Ухудшить» снижает
              выбранную потребность и стоит 1★.
            </p>
            <p>
              Полное описание: <code>docs/SIMS_GAME.md</code>
            </p>
            <div className="sims-rules__list">
              {SIMS_ACHIEVEMENTS.map(item => (
                <div key={item.id}>
                  <strong>{item.name}</strong>
                  <span>{item.hint}</span>
                </div>
              ))}
            </div>
          </details>
        </>
      )}
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

  const setAllLocked = useCallback(
    async (locked: boolean) => {
      await window.api.lockAll(locked)
      await refresh()
    },
    [refresh]
  )

  const setAllLayers = useCallback(
    async (layer: WindowLayer) => {
      await window.api.layerAll(layer)
      await refresh()
    },
    [refresh]
  )

  const resetAll = useCallback(async () => {
    await window.api.resetAllPositions()
    await refresh()
  }, [refresh])

  const allLocked = Boolean(
    settings &&
    [
      ...Object.values(settings.widgets),
      ...settings.weather.instances,
      ...settings.equalizer.instances
    ]
      .filter(Boolean)
      .every(item => item.locked)
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

        <div className="global-actions">
          <div className="global-actions__title">Все виджеты</div>
          <button type="button" onClick={() => void setAllLocked(!allLocked)}>
            {allLocked ? 'Разблокировать все' : 'Заблокировать все'}
          </button>
          <button type="button" onClick={() => void setAllLayers(0)}>
            На рабочий стол
          </button>
          <button type="button" onClick={() => void setAllLayers(1)}>
            Поверх всех
          </button>
          <button type="button" onClick={() => void resetAll()}>
            Сбросить позиции
          </button>
        </div>

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

        {settings && tab === 'plumbob' && (
          <SimsPanel
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
          tab !== 'equalizer' &&
          tab !== 'plumbob' && <PlannedPanel id={tab} />}
      </main>
    </div>
  )
}
