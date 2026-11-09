import { useState, type JSX } from 'react'
import type { ImageAsset, ImageCrop, ImageSlot, ZodiacPack, ZodiacSign } from '@shared/types'
import { ZODIAC, ZODIAC_ORDER } from '@shared/astro'
import { cropImageStyle, imageUrl } from '../style'
import { CropModal } from '../components/CropModal'
import { IconTrash } from '../ui/icons'

const DEFAULT_SLOT: ImageSlot = {
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

export function ZodiacPackEditor({
  pack,
  onSave,
  onClose
}: {
  pack: ZodiacPack | null
  onSave: (pack: ZodiacPack) => void
  onClose: () => void
}): JSX.Element {
  const [name, setName] = useState(pack?.name ?? 'Мой набор знаков')
  const [images, setImages] = useState<Partial<Record<ZodiacSign, ImageSlot | null>>>(
    pack?.images ?? {}
  )
  const [cropState, setCropState] = useState<{
    asset: ImageAsset
    sign: ZodiacSign
    crop: ImageCrop
  } | null>(null)

  const pick = async (sign: ZodiacSign): Promise<void> => {
    const asset = await window.widgets.pickImage()
    if (!asset) return
    setCropState({ asset, sign, crop: { x: 50, y: 50, zoom: 1 } })
  }

  const saveCrop = (crop: ImageCrop): void => {
    if (!cropState) return
    setImages((previous) => ({
      ...previous,
      [cropState.sign]: { ...DEFAULT_SLOT, imageId: cropState.asset.id, crop }
    }))
    setCropState(null)
  }

  return (
    <div className="pack-overlay">
      <div className="pack-panel">
        <div className="pack-head">
          <div>
            <div className="pack-title">Свой набор знаков</div>
            <div className="pack-sub">Картинка для каждого знака, квадратная область</div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} title="Закрыть">
            ×
          </button>
        </div>

        <label className="pack-name">
          Название
          <input
            value={name}
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            className="text-input"
          />
        </label>

        <div className="pack-list">
          {ZODIAC_ORDER.map((sign) => {
            const slot = images[sign]
            return (
              <div className="pack-row" key={sign}>
                <span className="pack-row__glyph">{ZODIAC[sign].glyph}</span>
                <span className="pack-row__name">{ZODIAC[sign].name}</span>
                <span className="pack-row__thumb">
                  {slot?.imageId ? (
                    <img src={imageUrl(slot.imageId)} style={cropImageStyle(slot.crop)} alt="" />
                  ) : (
                    <span>нет</span>
                  )}
                </span>
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={() => void pick(sign)}
                >
                  {slot?.imageId ? 'Заменить' : 'Выбрать'}
                </button>
                {slot?.imageId && (
                  <button
                    type="button"
                    className="btn btn--small btn--danger-ghost"
                    title="Убрать картинку"
                    onClick={() =>
                      setImages((previous) => ({ ...previous, [sign]: null }))
                    }
                  >
                    <IconTrash size={12} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="pack-actions">
          <button type="button" className="btn" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() =>
              onSave({
                id: pack?.id ?? `zodiac-${Date.now().toString(36)}`,
                name: name.trim() || 'Мой набор знаков',
                builtin: false,
                images
              })
            }
          >
            Сохранить набор
          </button>
        </div>
      </div>

      {cropState && (
        <CropModal
          asset={cropState.asset}
          initial={cropState.crop}
          aspect={1}
          title={`Знак · ${ZODIAC[cropState.sign].name}`}
          onSave={saveCrop}
          onClose={() => setCropState(null)}
        />
      )}
    </div>
  )
}
