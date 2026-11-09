import { useEffect, useRef, useState, type CSSProperties, type JSX } from 'react'
import type {
  BorderKind,
  ImageAsset,
  ImageCrop,
  ImageSlot,
  PersistedState,
  WidgetInstance,
  WidgetStyle
} from '@shared/types'
import {
  BORDER_OPTIONS,
  BUILTIN_PRESETS,
  CURSOR_EFFECT_OPTIONS,
  FONT_OPTIONS,
  SHAPE_OPTIONS,
  TEXTURE_OPTIONS,
  TEXT_ALIGN_OPTIONS,
  TYPE_ACCENTS,
  createBlankStyle,
  createDefaultStyle
} from '@shared/presets'
import { cropImageStyle, frameLayerStyle, imageUrl, presetPreviewStyle, withAlpha } from '../style'
import { Row, Segmented, Slider, Toggle } from './controls'
import { CropModal } from '../components/CropModal'
import { IconPlus, IconTrash } from '../ui/icons'

export interface StyleEditorProps {
  instance: WidgetInstance
  state: PersistedState
  onChange: (style: WidgetStyle) => void
  onApplyAll: (style: WidgetStyle) => void
}

type SlotKey = 'underlay' | 'overlay' | 'frame'
type CropTarget = { kind: 'slot'; key: SlotKey } | { kind: 'background' }

const SLOT_DEFAULTS: Record<SlotKey, ImageSlot> = {
  underlay: {
    enabled: true,
    imageId: '',
    crop: { x: 50, y: 50, zoom: 1 },
    opacity: 0.5,
    darken: 0,
    blend: 'normal',
    inset: 0,
    position: 'behind',
    placement: { x: 0, y: 0, scaleX: 100, scaleY: 100, rotate: 0, stretch: true }
  },
  overlay: {
    enabled: true,
    imageId: '',
    crop: { x: 50, y: 50, zoom: 1 },
    opacity: 0.3,
    darken: 0,
    blend: 'screen',
    inset: 0,
    position: 'behind',
    placement: { x: 0, y: 0, scaleX: 100, scaleY: 100, rotate: 0, stretch: true }
  },
  frame: {
    enabled: true,
    imageId: '',
    crop: { x: 50, y: 50, zoom: 1 },
    opacity: 1,
    darken: 0,
    blend: 'normal',
    inset: 0,
    position: 'above',
    placement: { x: 0, y: 0, scaleX: 100, scaleY: 100, rotate: 0, stretch: true }
  }
}

function SlotEditor({
  label,
  hint,
  slot,
  frame,
  images,
  onChange,
  onPick,
  onPickExisting,
  onCrop
}: {
  label: string
  hint: string
  slot: ImageSlot | null
  frame?: boolean
  images: ImageAsset[]
  onChange: (slot: ImageSlot | null) => void
  onPick: () => void
  onPickExisting: (asset: ImageAsset) => void
  onCrop: () => void
}): JSX.Element {
  const value = slot ?? SLOT_DEFAULTS[frame ? 'frame' : 'underlay']
  return (
    <div className={`slot-editor${slot ? '' : ' is-off'}`}>
      <div className="slot-editor__head">
        <Toggle checked={Boolean(slot?.enabled)} onChange={(enabled) => slot && onChange({ ...slot, enabled })} />
        <div className="slot-thumb">
          {slot?.imageId ? (
            <img src={imageUrl(slot.imageId)} style={cropImageStyle(slot.crop)} alt="" />
          ) : (
            <span>нет</span>
          )}
        </div>
        <div className="slot-editor__text">
          <div className="slot-editor__label">{label}</div>
          <div className="slot-editor__hint">{hint}</div>
        </div>
        <button type="button" className="btn btn--small" onClick={onPick}>
          {slot?.imageId ? 'Заменить' : 'Выбрать'}
        </button>
      </div>

      {images.length > 0 && (
        <div className="image-library">
          {images.slice(0, 10).map((image) => (
            <button
              type="button"
              key={image.id}
              className={`image-library__item${slot?.imageId === image.id ? ' is-active' : ''}`}
              title={image.name}
              onClick={() => onPickExisting(image)}
            >
              <img src={imageUrl(image.id)} alt="" />
            </button>
          ))}
        </div>
      )}

      {slot?.imageId && (
        <>
          <Row label="Прозрачность">
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={slot.opacity}
              onChange={(opacity) => onChange({ ...slot, opacity })}
              format={(item) => `${Math.round(item * 100)}%`}
            />
          </Row>
          {!frame && (
            <Row label="Смешивание">
              <select
                className="select select--small"
                value={slot.blend}
                onChange={(event) =>
                  onChange({ ...slot, blend: event.target.value as ImageSlot['blend'] })
                }
              >
                <option value="normal">Обычное</option>
                <option value="screen">Экран</option>
                <option value="multiply">Умножение</option>
                <option value="overlay">Перекрытие</option>
                <option value="soft-light">Мягкий свет</option>
              </select>
            </Row>
          )}
          {frame && (
            <>
              <Row label="Слой">
                <Segmented
                  value={slot.position}
                  options={[
                    { value: 'behind', label: 'Под карточкой' },
                    { value: 'above', label: 'Поверх' }
                  ]}
                  onChange={(position) => onChange({ ...slot, position })}
                />
              </Row>
              <Row label="Отступ наружу" hint="Насколько рамка выходит за карточку">
                <Slider
                  min={-20}
                  max={80}
                  step={1}
                  value={slot.inset}
                  onChange={(inset) => onChange({ ...slot, inset })}
                  format={(item) => `${item}%`}
                />
              </Row>
              <Row label="Смещение по X">
                <Slider
                  min={-50}
                  max={50}
                  step={1}
                  value={slot.placement.x}
                  onChange={(x) =>
                    onChange({ ...slot, placement: { ...slot.placement, x } })
                  }
                  format={(value) => `${value}%`}
                />
              </Row>
              <Row label="Смещение по Y">
                <Slider
                  min={-50}
                  max={50}
                  step={1}
                  value={slot.placement.y}
                  onChange={(y) =>
                    onChange({ ...slot, placement: { ...slot.placement, y } })
                  }
                  format={(value) => `${value}%`}
                />
              </Row>
              <Row label="Масштаб" hint="Пропорционально по обеим осям">
                <Slider
                  min={20}
                  max={300}
                  step={5}
                  value={Math.round((slot.placement.scaleX + slot.placement.scaleY) / 2)}
                  onChange={(scale) =>
                    onChange({
                      ...slot,
                      placement: {
                        ...slot.placement,
                        scaleX: scale,
                        scaleY: scale
                      }
                    })
                  }
                  format={(value) => `${value}%`}
                />
              </Row>
              <Row label="Растяжение по X">
                <Slider
                  min={20}
                  max={300}
                  step={5}
                  value={slot.placement.scaleX}
                  onChange={(scaleX) =>
                    onChange({
                      ...slot,
                      placement: { ...slot.placement, scaleX, stretch: true }
                    })
                  }
                  format={(value) => `${value}%`}
                />
              </Row>
              <Row label="Растяжение по Y">
                <Slider
                  min={20}
                  max={300}
                  step={5}
                  value={slot.placement.scaleY}
                  onChange={(scaleY) =>
                    onChange({
                      ...slot,
                      placement: { ...slot.placement, scaleY, stretch: true }
                    })
                  }
                  format={(value) => `${value}%`}
                />
              </Row>
              <Row label="Поворот">
                <Slider
                  min={-180}
                  max={180}
                  step={1}
                  value={slot.placement.rotate}
                  onChange={(rotate) =>
                    onChange({ ...slot, placement: { ...slot.placement, rotate } })
                  }
                  format={(value) => `${value}°`}
                />
              </Row>
            </>
          )}
          <div className="slot-editor__actions">
            <button type="button" className="btn btn--small" onClick={onCrop}>
              Кадрировать
            </button>
            <button
              type="button"
              className="btn btn--small btn--danger-ghost"
              onClick={() => onChange(null)}
            >
              <IconTrash size={12} />
              Убрать
            </button>
          </div>
        </>
      )}
      {!slot?.imageId && (
        <div className="slot-editor__empty-hint">
          {frame
            ? 'Рамка — отдельная картинка с прозрачным центром. Можно вынести за пределы окна и двигать.'
            : 'Картинка под или над фоном; кадрируйте её как аватар.'}
        </div>
      )}
    </div>
  )
}

export function StyleEditor({
  instance,
  state,
  onChange,
  onApplyAll
}: StyleEditorProps): JSX.Element {
  const style = instance.style
  const [presetName, setPresetName] = useState('')
  const [imageNotice, setImageNotice] = useState('')
  const [installedFonts, setInstalledFonts] = useState<string[]>([])
  useEffect(() => {
    window.widgets
      .getFonts()
      .then(setInstalledFonts)
      .catch(() => undefined)
  }, [])
  const [cropState, setCropState] = useState<{
    asset: ImageAsset
    crop: ImageCrop
    target: CropTarget
  } | null>(null)
  const styleRef = useRef(style)
  styleRef.current = style
  const fontChoices = installedFonts.length
    ? installedFonts.map((name) => ({
        label: name,
        value: `'${name.replace(/'/g, "\\'")}', sans-serif`
      }))
    : [...FONT_OPTIONS]
  if (!fontChoices.some((font) => font.value === style.fontFamily)) {
    fontChoices.unshift({ label: 'Текущий шрифт', value: style.fontFamily })
  }

  const set = (patch: Partial<WidgetStyle>): void => onChange({ ...style, ...patch })
  const setBackground = (patch: Partial<WidgetStyle['background']>): void =>
    onChange({ ...style, background: { ...style.background, ...patch } })
  const setBorder = (patch: Partial<WidgetStyle['border']>): void =>
    onChange({ ...style, border: { ...style.border, ...patch } })
  const setFont = (patch: Partial<WidgetStyle['font']>): void =>
    onChange({ ...style, font: { ...style.font, ...patch } })
  const setFontOutline = (patch: Partial<WidgetStyle['font']['outline']>): void =>
    setFont({ outline: { ...style.font.outline, ...patch } })
  const setFontShadow = (patch: Partial<WidgetStyle['font']['shadow']>): void =>
    setFont({ shadow: { ...style.font.shadow, ...patch } })
  const setAmbient = (patch: Partial<WidgetStyle['ambient']>): void =>
    onChange({ ...style, ambient: { ...style.ambient, ...patch } })
  const setAlign = (patch: Partial<WidgetStyle['align']>): void =>
    onChange({ ...style, align: { ...style.align, ...patch } })
  const setSlot = (key: SlotKey, slot: ImageSlot | null): void =>
    onChange({ ...style, [key]: slot } as WidgetStyle)

  const presets = [...BUILTIN_PRESETS, ...state.customPresets]
  const findImage = (id: string | null): ImageAsset | undefined =>
    id ? state.images.find((image) => image.id === id) : undefined

  const pickImage = async (target: CropTarget): Promise<void> => {
    const asset = await window.widgets.pickImage()
    if (!asset) return
    const crop = { x: 50, y: 50, zoom: 1 }
    if (target.kind === 'background') {
      onChange({ ...style, background: { ...style.background, kind: 'image', imageId: asset.id, crop } })
    } else {
      const current = style[target.key]
      const slot: ImageSlot = {
        ...(current ?? SLOT_DEFAULTS[target.key]),
        imageId: asset.id,
        crop
      }
      setSlot(target.key, slot)
    }
    setCropState({ asset, crop, target })
  }

  const openCrop = (target: CropTarget): void => {
    const imageId = target.kind === 'background' ? style.background.imageId : style[target.key]?.imageId
    const asset = findImage(imageId ?? null)
    if (!asset) return
    const crop =
      target.kind === 'background'
        ? style.background.crop
        : style[target.key]?.crop ?? { x: 50, y: 50, zoom: 1 }
    setCropState({ asset, crop, target })
  }

  const saveCrop = (crop: ImageCrop): void => {
    if (!cropState) return
    const current = styleRef.current
    const target = cropState.target
    if (target.kind === 'background') {
      onChange({ ...current, background: { ...current.background, crop } })
    } else {
      const slot = current[target.key]
      if (slot) setSlot(target.key, { ...slot, crop })
    }
    setCropState(null)
  }

  const applySlotToAll = (key: SlotKey): void => {
    const current = styleRef.current
    const slot = current[key]
    if (!slot?.imageId) return
    for (const widget of state.widgets) {
      if (widget.id === instance.id) continue
      void window.widgets.updateWidget(widget.id, {
        style: { ...widget.style, [key]: structuredClone(slot) }
      })
    }
  }

  const applyBackgroundToAll = (): void => {
    const current = styleRef.current
    if (!current.background.imageId) return
    for (const widget of state.widgets) {
      if (widget.id === instance.id) continue
      void window.widgets.updateWidget(widget.id, {
        style: {
          ...widget.style,
          background: {
            ...widget.style.background,
            kind: 'image',
            imageId: current.background.imageId,
            crop: current.background.crop
          }
        }
      })
    }
  }

  const savePreset = async (): Promise<void> => {
    const preset = await window.widgets.savePreset(presetName.trim() || 'Мой пресет', style)
    setPresetName('')
    onChange({ ...style, presetId: preset.id })
  }

  const applyPreset = (presetStyle: WidgetStyle, id: string | null): void => {
    onChange({ ...structuredClone(presetStyle), presetId: id })
  }

  const framePreview = style.frame?.imageId ? (
    <div className="frame-preview">
      <div className="frame-preview__card" />
      <div className="frame-preview__frame" style={frameLayerStyle({ ...style.frame, position: 'above' })}>
        <img src={imageUrl(style.frame.imageId)} alt="" />
      </div>
    </div>
  ) : null

  const imageUsed = (id: string): boolean => {
    const slot = (value: { imageId?: string } | null | undefined): boolean =>
      value?.imageId === id
    for (const widget of state.widgets) {
      if (
        widget.style.background.imageId === id ||
        slot(widget.style.underlay) ||
        slot(widget.style.overlay) ||
        slot(widget.style.frame)
      ) {
        return true
      }
      const settings = widget.settings as {
        diceSkin?: { imageId?: string } | null
        coinHeads?: { imageId?: string } | null
        coinTails?: { imageId?: string } | null
        stickers?: Array<{ imageId?: string | null }>
      }
      if (
        settings.diceSkin?.imageId === id ||
        settings.coinHeads?.imageId === id ||
        settings.coinTails?.imageId === id ||
        settings.stickers?.some((sticker) => sticker.imageId === id)
      ) {
        return true
      }
    }
    return (
      state.zodiacPacks.some((pack) =>
        Object.values(pack.images).some((item) => item?.imageId === id)
      ) ||
      state.tarotDecks.some((deck) =>
        Object.values(deck.cards).some((item) => item?.imageId === id)
      )
    )
  }

  return (
    <>
      <section className="section">
        <div className="section__title">Стиль</div>
        <div className="section__card style-presets-card">
          <div className="preset-actions" style={{ marginTop: 0, marginBottom: 10 }}>
            <button
              type="button"
              className="btn btn--small"
              onClick={() => applyPreset(BUILTIN_PRESETS[0].style, BUILTIN_PRESETS[0].id)}
            >
              Сбросить к оформлению по умолчанию
            </button>
            <button
              type="button"
              className="btn btn--small"
              onClick={() => applyPreset(createDefaultStyle(instance.type), null)}
            >
              Сбросить к стилю типа
            </button>
          </div>
          <div className="preset-strip">
            {presets.map((preset) => (
              <div
                className={`preset-card${style.presetId === preset.id ? ' is-active' : ''}`}
                key={preset.id}
                onClick={() => applyPreset(preset.style, preset.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') applyPreset(preset.style, preset.id)
                }}
              >
                <div className="preset-thumb" style={presetPreviewStyle(preset.style)}>
                  <span
                    className="preset-thumb__dot"
                    style={{ background: preset.style.accent || TYPE_ACCENTS[instance.type] }}
                  />
                </div>
                <span className="preset-card__name">{preset.name}</span>
                {!preset.builtin && (
                  <button
                    type="button"
                    className="preset-card__delete"
                    title="Удалить пресет"
                    onClick={(event) => {
                      event.stopPropagation()
                      void window.widgets.deletePreset(preset.id)
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <div
              className="preset-card preset-card--blank"
              onClick={() => applyPreset(createBlankStyle(), null)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') applyPreset(createBlankStyle(), null)
              }}
            >
              <div className="preset-thumb preset-thumb--blank">
                <IconPlus size={16} />
              </div>
              <span className="preset-card__name">С нуля</span>
            </div>
          </div>

          <div className="preset-actions">
            <input
              type="text"
              className="preset-name-input"
              placeholder="Название пресета"
              value={presetName}
              maxLength={40}
              onChange={(event) => setPresetName(event.target.value)}
            />
            <button type="button" className="btn btn--small" onClick={() => void savePreset()}>
              Сохранить пресет
            </button>
            <button
              type="button"
              className="btn btn--small"
              onClick={() => onApplyAll(styleRef.current)}
              title="Применить текущий стиль ко всем виджетам"
            >
              Применить ко всем
            </button>
          </div>
        </div>
      </section>

      <details className="style-section" open>
        <summary>Фон</summary>
        <div className="style-section__body">
          <Row label="Фон" hint="Прозрачность меняет только фон, не текст">
            <Segmented
              value={style.background.kind}
              options={[
                { value: 'glass', label: 'Стекло' },
                { value: 'color', label: 'Цвет' },
                { value: 'gradient', label: 'Градиент' },
                { value: 'image', label: 'Картинка' }
              ]}
              onChange={(kind) => setBackground({ kind })}
            />
          </Row>
          <Row label="Прозрачность фона">
            <Slider
              min={0}
              max={1}
              step={0.02}
              value={style.background.opacity}
              onChange={(opacity) => setBackground({ opacity })}
              format={(value) => `${Math.round(value * 100)}%`}
            />
          </Row>

          {style.background.kind === 'glass' && (
            <>
              <Row label="Цвет стекла">
                <input
                  type="color"
                  className="color-input"
                  value={style.background.color}
                  onChange={(event) => setBackground({ color: event.target.value })}
                />
              </Row>
              <Row label="Размытие">
                <Slider
                  min={0}
                  max={60}
                  step={1}
                  value={style.background.blur}
                  onChange={(blur) => setBackground({ blur })}
                  format={(value) => `${value}px`}
                />
              </Row>
            </>
          )}

          {style.background.kind === 'color' && (
            <Row label="Цвет">
              <input
                type="color"
                className="color-input"
                value={style.background.color}
                onChange={(event) => setBackground({ color: event.target.value })}
              />
            </Row>
          )}

          {style.background.kind === 'gradient' && (
            <>
              <Row label="Цвета">
                <div className="color-pair">
                  <input
                    type="color"
                    className="color-input"
                    value={style.background.color}
                    onChange={(event) => setBackground({ color: event.target.value })}
                  />
                  <input
                    type="color"
                    className="color-input"
                    value={style.background.color2}
                    onChange={(event) => setBackground({ color2: event.target.value })}
                  />
                </div>
              </Row>
              <Row label="Угол">
                <Slider
                  min={0}
                  max={360}
                  step={1}
                  value={style.background.angle}
                  onChange={(angle) => setBackground({ angle })}
                  format={(value) => `${value}°`}
                />
              </Row>
            </>
          )}

          {style.background.kind === 'image' && (
            <>
              <div className="image-row">
                <div className="slot-thumb slot-thumb--wide">
                  {style.background.imageId ? (
                    <img
                      src={imageUrl(style.background.imageId)}
                      style={cropImageStyle(style.background.crop)}
                      alt=""
                    />
                  ) : (
                    <span>нет</span>
                  )}
                </div>
                <div className="image-row__text">
                  <div className="slot-editor__label">Фоновое изображение</div>
                  <div className="slot-editor__hint">
                    {findImage(style.background.imageId)?.name ?? 'картинка не выбрана'}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={() => void pickImage({ kind: 'background' })}
                >
                  {style.background.imageId ? 'Заменить' : 'Выбрать'}
                </button>
              </div>
              {style.background.imageId && (
                <div className="slot-editor__actions">
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => openCrop({ kind: 'background' })}
                  >
                    Кадрировать
                  </button>
                  <button type="button" className="btn btn--small" onClick={applyBackgroundToAll}>
                    Ко всем виджетам
                  </button>
                  <button
                    type="button"
                    className="btn btn--small btn--danger-ghost"
                    onClick={() => setBackground({ imageId: null, kind: 'glass' })}
                  >
                    <IconTrash size={12} />
                    Убрать
                  </button>
                </div>
              )}
              {state.images.length > 0 && (
                <div className="image-library">
                  {state.images.slice(0, 10).map((image) => (
                    <button
                      type="button"
                      key={image.id}
                      className={`image-library__item${style.background.imageId === image.id ? ' is-active' : ''}`}
                      title={image.name}
                      onClick={() => {
                        const crop = { x: 50, y: 50, zoom: 1 }
                        onChange({
                          ...style,
                          background: { ...style.background, kind: 'image', imageId: image.id, crop }
                        })
                        setCropState({ asset: image, crop, target: { kind: 'background' } })
                      }}
                    >
                      <img src={imageUrl(image.id)} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <Row label="Затемнение" hint="Помогает читать текст на светлых картинках">
            <Slider
              min={0}
              max={0.85}
              step={0.02}
              value={style.background.darken}
              onChange={(darken) => setBackground({ darken })}
              format={(value) => `${Math.round(value * 100)}%`}
            />
          </Row>

          <Row label="Эффект фона" hint="Звёзды, светлячки, матрица, ретровейв или погода">
            <Segmented
              value={style.ambient.kind}
              options={[
                { value: 'none', label: 'Нет' },
                { value: 'stars', label: 'Звёзды' },
                { value: 'fireflies', label: 'Светлячки' },
                { value: 'matrix', label: 'Матрица' },
                { value: 'synthwave', label: 'Ретровейв' },
                { value: 'weather', label: 'Погода' }
              ]}
              onChange={(kind) => setAmbient({ kind })}
            />
          </Row>
          {style.ambient.kind !== 'none' && (
            <>
              <Row label="Интенсивность">
                <Slider
                  min={0.1}
                  max={1.5}
                  step={0.05}
                  value={style.ambient.intensity}
                  onChange={(intensity) => setAmbient({ intensity })}
                  format={(value) => `${Math.round(value * 100)}%`}
                />
              </Row>
              <Row label="Цвет">
                <input
                  type="color"
                  className="color-input"
                  value={style.ambient.color}
                  onChange={(event) => setAmbient({ color: event.target.value })}
                />
              </Row>
            </>
          )}
          {style.ambient.kind === 'stars' && (
            <Row label="Падающие звёзды" hint="Как часто: меньше — чаще">
              <Slider
                min={2}
                max={30}
                step={1}
                value={style.ambient.shootingFrequency}
                onChange={(shootingFrequency) => setAmbient({ shootingFrequency })}
                format={(value) => `${value} с`}
              />
            </Row>
          )}
        </div>
      </details>

      <details className="style-section" open>
        <summary>Окно</summary>
        <div className="style-section__body">
          <Row label="Без окна" hint="Только контент: фон, обводка, рамка и тень скрываются">
            <Toggle
              checked={style.windowless}
              onChange={(windowless) => set({ windowless })}
            />
          </Row>
          {style.windowless && (
            <div className="style-note">
              Окно прозрачное. Фон, обводка и рамка скрыты, но сохраняются в настройках
              и вернутся, если выключить этот режим.
            </div>
          )}
          <div className="shape-grid">
            {SHAPE_OPTIONS.map((shape) => (
              <button
                type="button"
                key={shape.value}
                className={`shape-choice${style.shape === shape.value ? ' is-active' : ''}`}
                onClick={() => set({ shape: shape.value })}
                title={shape.hint}
              >
                <span className={`shape-choice__preview shape-choice__preview--${shape.value}`} />
                <span className="shape-choice__label">{shape.label}</span>
              </button>
            ))}
          </div>

          {style.shape === 'squircle' && (
            <Row label="Радиус">
              <Slider
                min={0}
                max={80}
                step={1}
                value={style.radius}
                onChange={(radius) =>
                  set({ radius, corners: { tl: radius, tr: radius, br: radius, bl: radius } })
                }
                format={(value) => `${value}px`}
              />
            </Row>
          )}

          {style.shape === 'custom' && (
            <>
              {(['tl', 'tr', 'br', 'bl'] as const).map((corner) => (
                <Row
                  key={corner}
                  label={
                    corner === 'tl'
                      ? 'Верхний левый'
                      : corner === 'tr'
                        ? 'Верхний правый'
                        : corner === 'br'
                          ? 'Нижний правый'
                          : 'Нижний левый'
                  }
                >
                  <Slider
                    min={0}
                    max={120}
                    step={1}
                    value={style.corners[corner]}
                    onChange={(value) => set({ corners: { ...style.corners, [corner]: value } })}
                    format={(value) => `${value}px`}
                  />
                </Row>
              ))}
            </>
          )}

          <Row label="Обводка" hint="Включается отдельно; не обрезается на скруглениях">
            <Toggle
              checked={style.border.enabled}
              onChange={(enabled) => setBorder({ enabled })}
            />
          </Row>
          {style.border.enabled && (
            <>
              <div className="border-style-grid">
                {BORDER_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`border-style${style.border.style === option.value ? ' is-active' : ''}`}
                    title={option.hint}
                    onClick={() => setBorder({ style: option.value as BorderKind })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <Row label="Толщина">
                <Slider
                  min={0}
                  max={8}
                  step={1}
                  value={style.border.width}
                  onChange={(width) => setBorder({ width })}
                  format={(value) => `${value}px`}
                />
              </Row>
              <Row label="Цвет">
                <div className="color-pair">
                  <input
                    type="color"
                    className="color-input"
                    value={style.border.color}
                    onChange={(event) => setBorder({ color: event.target.value })}
                  />
                  <input
                    type="color"
                    className="color-input"
                    value={style.border.color2}
                    onChange={(event) => setBorder({ color2: event.target.value })}
                  />
                </div>
              </Row>
              <Row label="Прозрачность">
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={style.border.opacity}
                  onChange={(opacity) => setBorder({ opacity })}
                  format={(value) => `${Math.round(value * 100)}%`}
                />
              </Row>
              <Row label="Сила свечения">
                <Slider
                  min={0}
                  max={2}
                  step={0.05}
                  value={style.border.glow}
                  onChange={(glow) => setBorder({ glow })}
                  format={(value) => `${Math.round(value * 50)}%`}
                />
              </Row>
              <Row label="Размер свечения">
                <Slider
                  min={0}
                  max={48}
                  step={1}
                  value={style.border.glowSize}
                  onChange={(glowSize) => setBorder({ glowSize })}
                  format={(value) => `${value}px`}
                />
              </Row>
              <Row label="Анимация">
                <Toggle
                  checked={style.border.animated}
                  onChange={(animated) => setBorder({ animated })}
                />
              </Row>
            </>
          )}

          <Row label="Цвет текста">
            <input
              type="color"
              className="color-input"
              value={style.textColor}
              onChange={(event) =>
                set({
                  textColor: event.target.value,
                  mutedColor: withAlpha(event.target.value, 0.58)
                })
              }
            />
          </Row>
          <Row label="Вторичный текст">
            <input
              type="color"
              className="color-input"
              value={style.mutedColor}
              onChange={(event) => set({ mutedColor: event.target.value })}
            />
          </Row>
          <Row label="Акцент" hint="Если выключен — цвет зависит от типа виджета">
            <div className="inline-control">
              <Toggle
                checked={style.accent !== null}
                onChange={(value) => set({ accent: value ? TYPE_ACCENTS[instance.type] : null })}
              />
              <input
                type="color"
                className="color-input"
                value={style.accent ?? TYPE_ACCENTS[instance.type]}
                disabled={style.accent === null}
                onChange={(event) => set({ accent: event.target.value })}
              />
            </div>
          </Row>
          <Row label="Текстура">
            <Segmented
              value={style.texture}
              options={TEXTURE_OPTIONS}
              onChange={(texture) => set({ texture })}
            />
          </Row>
        </div>
      </details>

      <details className="style-section">
        <summary>Шрифт</summary>
        <div className="style-section__body">
          <Row label="Гарнитура">
            <select
              className="select"
              value={style.fontFamily}
              onChange={(event) => set({ fontFamily: event.target.value })}
            >
              {fontChoices.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Кегль текста" hint="Один размер на виджет; окно подстраивается с запасом">
            <Slider
              min={0.5}
              max={2.4}
              step={0.05}
              value={style.fontScale}
              onChange={(fontScale) => set({ fontScale })}
              format={(value) => `${Math.round(value * 100)}%`}
            />
          </Row>

          <Row label="Обводка текста">
            <Toggle
              checked={style.font.outline.enabled}
              onChange={(enabled) => setFontOutline({ enabled })}
            />
          </Row>
          {style.font.outline.enabled && (
            <>
              <Row label="Толщина обводки">
                <Slider
                  min={0.5}
                  max={4}
                  step={0.1}
                  value={style.font.outline.width}
                  onChange={(width) => setFontOutline({ width })}
                  format={(value) => `${value.toFixed(1)}px`}
                />
              </Row>
              <Row label="Цвет обводки">
                <div className="inline-control">
                  <input
                    type="color"
                    className="color-input"
                    value={style.font.outline.color}
                    onChange={(event) => setFontOutline({ color: event.target.value })}
                  />
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={style.font.outline.opacity}
                    onChange={(opacity) => setFontOutline({ opacity })}
                    format={(value) => `${Math.round(value * 100)}%`}
                  />
                </div>
              </Row>
              <Row label="Режим обводки" hint="«От края» рисует обводку под заливкой, чтобы не перекрывать текст">
                <Segmented
                  value={style.font.outline.mode}
                  options={[
                    { value: 'center', label: 'От центра' },
                    { value: 'outside', label: 'От края' }
                  ]}
                  onChange={(mode) => setFontOutline({ mode })}
                />
              </Row>
            </>
          )}
          <Row label="Контрастная обводка" hint="Основной текст: чёрная на светлом, белая на тёмном">
            <Toggle
              checked={style.font.contrastPrimary}
              onChange={(contrastPrimary) => setFont({ contrastPrimary })}
            />
          </Row>
          <Row label="Контрастная обводка" hint="Вторичный текст">
            <Toggle
              checked={style.font.contrastSecondary}
              onChange={(contrastSecondary) => setFont({ contrastSecondary })}
            />
          </Row>

          {(instance.type === 'clock' || instance.type === 'weekday') && (
            <Row label="Паттерн текста" hint="Штриховка или точки поверх заливки основного текста">
              <Segmented
                value={style.font.pattern}
                options={[
                  { value: 'none', label: 'Нет' },
                  { value: 'horizontal', label: 'Штрих' },
                  { value: 'diagonal', label: 'Диагональ' },
                  { value: 'dots', label: 'Точки' },
                  { value: 'grid', label: 'Сетка' }
                ]}
                onChange={(pattern) => setFont({ pattern })}
              />
            </Row>
          )}

          <Row label="Тень текста">
            <Toggle
              checked={style.font.shadow.enabled}
              onChange={(enabled) => setFontShadow({ enabled })}
            />
          </Row>
          {style.font.shadow.enabled && (
            <>
              <Row label="Цвет тени">
                <div className="inline-control">
                  <input
                    type="color"
                    className="color-input"
                    value={style.font.shadow.color}
                    onChange={(event) => setFontShadow({ color: event.target.value })}
                  />
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={style.font.shadow.opacity}
                    onChange={(opacity) => setFontShadow({ opacity })}
                    format={(value) => `${Math.round(value * 100)}%`}
                  />
                </div>
              </Row>
              <Row label="Рассеивание">
                <Slider
                  min={0}
                  max={30}
                  step={1}
                  value={style.font.shadow.blur}
                  onChange={(blur) => setFontShadow({ blur })}
                  format={(value) => `${value}px`}
                />
              </Row>
              <Row label="Сдвиг">
                <div className="border-controls">
                  <Slider
                    min={-12}
                    max={12}
                    step={1}
                    value={style.font.shadow.offsetX}
                    onChange={(offsetX) => setFontShadow({ offsetX })}
                    format={(value) => `X ${value}`}
                  />
                  <Slider
                    min={-12}
                    max={12}
                    step={1}
                    value={style.font.shadow.offsetY}
                    onChange={(offsetY) => setFontShadow({ offsetY })}
                    format={(value) => `Y ${value}`}
                  />
                </div>
              </Row>
            </>
          )}

          <Row label="Выравнивание" hint="Основной текст">
            <Segmented
              value={style.align.primary}
              options={TEXT_ALIGN_OPTIONS}
              onChange={(primary) => setAlign({ primary })}
            />
          </Row>
          <Row label="Выравнивание" hint="Вторичный текст">
            <Segmented
              value={style.align.secondary}
              options={TEXT_ALIGN_OPTIONS}
              onChange={(secondary) => setAlign({ secondary })}
            />
          </Row>

          <div className="font-preview" style={{ fontFamily: style.fontFamily }}>
            Аа Бб Вв 0123456789
          </div>
        </div>
      </details>

      <details className="style-section">
        <summary>Картинки</summary>
        <div className="style-section__body">
          <SlotEditor
            label="Обводка / рамка"
            hint="Отдельная картинка вокруг карточки: под ней или поверх"
            slot={style.frame}
            frame
            images={state.images}
            onChange={(slot) => setSlot('frame', slot)}
            onPick={() => void pickImage({ kind: 'slot', key: 'frame' })}
            onPickExisting={(asset) => {
              const slot = {
                ...SLOT_DEFAULTS.frame,
                imageId: asset.id,
                crop: { x: 50, y: 50, zoom: 1 }
              }
              setSlot('frame', slot)
              setCropState({ asset, crop: slot.crop, target: { kind: 'slot', key: 'frame' } })
            }}
            onCrop={() => openCrop({ kind: 'slot', key: 'frame' })}
          />
          {framePreview}
          <div className="slot-editor__actions">
            <button type="button" className="btn btn--small" onClick={() => applySlotToAll('frame')}>
              Рамку ко всем
            </button>
          </div>
          <div className="image-manage">
            <div className="image-manage__title">Библиотека изображений</div>
            {state.images.length === 0 && (
              <div className="slot-editor__empty-hint">Пока нет добавленных картинок.</div>
            )}
            {state.images.map((image) => {
              const used = imageUsed(image.id)
              return (
                <div className="image-manage__row" key={image.id}>
                  <span className="slot-thumb">
                    <img src={imageUrl(image.id)} alt="" />
                  </span>
                  <span className="image-manage__name" title={image.name}>
                    {image.name}
                  </span>
                  <button
                    type="button"
                    className="btn btn--small btn--danger-ghost"
                    disabled={used}
                    title={used ? 'Используется в виджете, колоде или наборе' : 'Удалить из библиотеки'}
                    onClick={async () => {
                      const result = await window.widgets.deleteImage(image.id)
                      if (!result.ok) {
                        setImageNotice(
                          result.used ? 'Картинка используется и не удалена.' : 'Не удалось удалить.'
                        )
                      } else {
                        setImageNotice('')
                      }
                    }}
                  >
                    <IconTrash size={12} />
                  </button>
                </div>
              )
            })}
            {imageNotice && <div className="style-note">{imageNotice}</div>}
          </div>
        </div>
      </details>

      <details className="style-section">
        <summary>Эффект курсора</summary>
        <div className="style-section__body">
          <div className="cursor-grid">
            {CURSOR_EFFECT_OPTIONS.map((effect) => (
              <button
                type="button"
                key={effect.value}
                className={`cursor-choice${style.cursorEffect === effect.value ? ' is-active' : ''}`}
                onClick={() => set({ cursorEffect: effect.value })}
              >
                <span className={`cursor-choice__dot cursor-choice__dot--${effect.value}`} />
                <span className="cursor-choice__label">{effect.label}</span>
                <span className="cursor-choice__hint">{effect.hint}</span>
              </button>
            ))}
          </div>
          <p className="style-note">
            Эффект виден и на заблокированном виджете: приложение отслеживает позицию курсора.
            Искры при клике работают, когда виджет принимает клики.
          </p>
        </div>
      </details>

      {cropState && (
        <CropModal
          asset={cropState.asset}
          initial={cropState.crop}
          aspect={cropState.target.kind === 'slot' && cropState.target.key === 'frame' ? 1 : 4 / 3}
          onSave={saveCrop}
          onClose={() => setCropState(null)}
        />
      )}
    </>
  )
}
