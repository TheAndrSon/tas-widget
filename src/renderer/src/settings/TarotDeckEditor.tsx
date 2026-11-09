import { useState, type JSX } from 'react'
import type { ImageAsset, ImageCrop, ImageSlot, TarotDeck } from '@shared/types'
import { TAROT_CARDS } from '@shared/tarot'
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

export function TarotDeckEditor({
  deck,
  onSave,
  onClose
}: {
  deck: TarotDeck | null
  onSave: (deck: TarotDeck) => void
  onClose: () => void
}): JSX.Element {
  const [name, setName] = useState(deck?.name ?? 'Моя колода')
  const [cards, setCards] = useState<Record<string, ImageSlot | null>>(deck?.cards ?? {})
  const [back, setBack] = useState<ImageSlot | null>(deck?.back ?? null)
  const [backCrop, setBackCrop] = useState<{ asset: ImageAsset; crop: ImageCrop } | null>(null)
  const [meanings, setMeanings] = useState<
    NonNullable<TarotDeck['meanings']>
  >(deck?.meanings ?? {})
  const [editing, setEditing] = useState<string | null>(null)
  const [cropState, setCropState] = useState<{
    asset: ImageAsset
    cardId: string
    crop: ImageCrop
  } | null>(null)

  const patchMeaning = (
    cardId: string,
    patch: { name?: string; upright?: string; reversed?: string }
  ): void => {
    setMeanings((previous) => ({
      ...previous,
      [cardId]: { ...previous[cardId], ...patch }
    }))
  }

  const pick = async (cardId: string): Promise<void> => {
    const asset = await window.widgets.pickImage()
    if (!asset) return
    setCropState({ asset, cardId, crop: { x: 50, y: 50, zoom: 1 } })
  }

  const saveCrop = (crop: ImageCrop): void => {
    if (!cropState) return
    setCards((previous) => ({
      ...previous,
      [cropState.cardId]: { ...DEFAULT_SLOT, imageId: cropState.asset.id, crop }
    }))
    setCropState(null)
  }

  const filled = Object.values(cards).filter((slot) => slot?.imageId).length

  return (
    <div className="pack-overlay">
      <div className="pack-panel pack-panel--wide">
        <div className="pack-head">
          <div>
            <div className="pack-title">Своя колода таро</div>
            <div className="pack-sub">
              78 карт · {filled} из 78 заполнено · карты 92×140
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} title="Закрыть">
            ×
          </button>
        </div>

        <label className="pack-name">
          Название колоды
          <input
            value={name}
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            className="text-input"
          />
        </label>

        <div className="pack-back">
          <span className="pack-back__thumb">
            {back?.imageId ? (
              <img src={imageUrl(back.imageId)} style={cropImageStyle(back.crop)} alt="" />
            ) : (
              <span>рубашка</span>
            )}
          </span>
          <span className="pack-back__text">Рубашка всей колоды</span>
          <button
            type="button"
            className="btn btn--small"
            onClick={async () => {
              const asset = await window.widgets.pickImage()
              if (asset) setBackCrop({ asset, crop: { x: 50, y: 50, zoom: 1 } })
            }}
          >
            {back?.imageId ? 'Заменить' : 'Выбрать'}
          </button>
          {back?.imageId && (
            <button
              type="button"
              className="btn btn--small btn--danger-ghost"
              onClick={() => setBack(null)}
            >
              <IconTrash size={12} />
            </button>
          )}
        </div>

        <div className="pack-list pack-list--cards">
          {TAROT_CARDS.map((card) => {
            const slot = cards[card.id]
            const meaning = meanings[card.id] ?? {}
            return (
              <div className="pack-card-block" key={card.id}>
                <div className="pack-row">
                  <span className="pack-row__numeral">{card.numeral}</span>
                  <span className="pack-row__name">{card.name}</span>
                  <span className="pack-row__thumb pack-row__thumb--card">
                    {slot?.imageId ? (
                      <img src={imageUrl(slot.imageId)} style={cropImageStyle(slot.crop)} alt="" />
                    ) : (
                      <span>рубашка</span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="btn btn--small"
                    onClick={() => void pick(card.id)}
                  >
                    {slot?.imageId ? 'Заменить' : 'Выбрать'}
                  </button>
                  <button
                    type="button"
                    className={`btn btn--small${editing === card.id ? ' btn--primary' : ''}`}
                    title="Своё название и значения карты"
                    onClick={() => setEditing(editing === card.id ? null : card.id)}
                  >
                    Текст
                  </button>
                  {slot?.imageId && (
                    <button
                      type="button"
                      className="btn btn--small btn--danger-ghost"
                      title="Убрать картинку"
                      onClick={() => setCards((previous) => ({ ...previous, [card.id]: null }))}
                    >
                      <IconTrash size={12} />
                    </button>
                  )}
                </div>
                {editing === card.id && (
                  <div className="pack-meanings">
                    <label>
                      Название
                      <input
                        className="text-input"
                        maxLength={60}
                        value={meaning.name ?? ''}
                        placeholder={card.name}
                        onChange={(event) => patchMeaning(card.id, { name: event.target.value })}
                      />
                    </label>
                    <label>
                      Прямое значение
                      <textarea
                        className="text-input textarea-input"
                        maxLength={220}
                        value={meaning.upright ?? ''}
                        placeholder={card.upright}
                        onChange={(event) => patchMeaning(card.id, { upright: event.target.value })}
                      />
                    </label>
                    <label>
                      Перевёрнутое значение
                      <textarea
                        className="text-input textarea-input"
                        maxLength={220}
                        value={meaning.reversed ?? ''}
                        placeholder={card.reversed}
                        onChange={(event) => patchMeaning(card.id, { reversed: event.target.value })}
                      />
                    </label>
                  </div>
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
                id: deck?.id ?? `deck-${Date.now().toString(36)}`,
                name: name.trim() || 'Моя колода',
                builtin: false,
                cards,
                back,
                meanings
              })
            }
          >
            Сохранить колоду
          </button>
        </div>
      </div>

      {cropState && (
        <CropModal
          asset={cropState.asset}
          initial={cropState.crop}
          aspect={92 / 140}
          title={`Карта · ${TAROT_CARDS.find((card) => card.id === cropState.cardId)?.name ?? ''}`}
          onSave={saveCrop}
          onClose={() => setCropState(null)}
        />
      )}

      {backCrop && (
        <CropModal
          asset={backCrop.asset}
          initial={backCrop.crop}
          aspect={92 / 140}
          title="Рубашка колоды"
          onSave={(crop) => {
            setBack({ ...DEFAULT_SLOT, imageId: backCrop.asset.id, crop })
            setBackCrop(null)
          }}
          onClose={() => setBackCrop(null)}
        />
      )}
    </div>
  )
}
