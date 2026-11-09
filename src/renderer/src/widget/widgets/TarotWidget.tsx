import {
  useEffect,
  useRef,
  useState,
  type JSX
} from 'react'
import type { TarotSettings } from '@shared/types'
import { cardMeaning, drawSpread, type DrawnCard } from '@shared/tarot'
import { useAppState } from '../../hooks'
import { cropImageStyle, imageUrl } from '../../style'

export function TarotWidget({
  settings,
  interactive,
  instanceId
}: {
  settings: TarotSettings
  interactive: boolean
  instanceId: string
}): JSX.Element {
  const state = useAppState()
  const deck = settings.deckId
    ? state?.tarotDecks.find((item) => item.id === settings.deckId)
    : undefined
  const back = settings.back ?? deck?.back ?? null
  const [cards, setCards] = useState<DrawnCard[]>(() =>
    drawSpread(settings.spread, settings.reversed)
  )
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    Array.from({ length: settings.spread }, () => !settings.faceDown)
  )
  const listRef = useRef<HTMLDivElement>(null)

  const nameOf = (drawn: DrawnCard): string =>
    deck?.meanings?.[drawn.card.id]?.name?.trim() || drawn.card.name
  const meaningOf = (drawn: DrawnCard): string => {
    const custom = deck?.meanings?.[drawn.card.id]
    const value = drawn.reversed ? custom?.reversed : custom?.upright
    return value?.trim() || cardMeaning(drawn)
  }

  useEffect(() => {
    setCards(drawSpread(settings.spread, settings.reversed))
    setRevealed(Array.from({ length: settings.spread }, () => !settings.faceDown))
  }, [settings.spread, settings.reversed, settings.faceDown])

  const draw = (): void => {
    setCards(drawSpread(settings.spread, settings.reversed))
    setRevealed(Array.from({ length: settings.spread }, () => !settings.faceDown))
  }

  const reveal = (index: number): void => {
    if (!interactive) return
    setRevealed((previous) => previous.map((value, item) => (item === index ? true : value)))
  }

  const setSpread = (spread: 1 | 3 | 5): void => {
    if (!interactive || spread === settings.spread) return
    void window.widgets.updateWidgetSettings(instanceId, { spread })
  }

  return (
    <div className={`tarot${settings.spread === 5 ? ' is-five' : ''}`}>
      <div className="tarot__head">
        <div>
          <div className="tarot__title">Расклад дня</div>
          <div className="tarot__sub">
            {deck ? `колода · ${deck.name}` : '78 карт · свой стиль'}
          </div>
        </div>
        <div className="tarot__head-right">
          <div className="tarot__spreads no-drag">
            {([1, 3, 5] as const).map((spread) => (
              <button
                type="button"
                key={spread}
                className={settings.spread === spread ? 'is-active' : ''}
                disabled={!interactive}
                onClick={() => setSpread(spread)}
                title={`Расклад на ${spread}`}
              >
                {spread}
              </button>
            ))}
          </div>
          <span className="tarot__count">
            {cards.length} карт{cards.length === 1 ? 'а' : 'ы'}
          </span>
        </div>
      </div>

      <div
        className={`tarot__cards${cards.length === 1 ? ' is-single' : ''}${cards.length === 5 ? ' is-five' : ''}`}
        ref={listRef}
      >
        {cards.map((drawn, index) => {
          const slot = deck?.cards[drawn.card.id]
          return (
            <div
              className={`tarot-card${drawn.reversed ? ' is-reversed' : ''}${revealed[index] ? ' is-revealed' : ''}`}
              key={`${drawn.card.id}-${index}`}
              onClick={() => reveal(index)}
            >
              <div className="tarot-card__inner">
                <div className="tarot-card__face tarot-card__back">
                  {back?.imageId ? (
                    <img
                      className="tarot-card__back-img"
                      src={imageUrl(back.imageId)}
                      style={cropImageStyle(back.crop)}
                      alt=""
                    />
                  ) : (
                    <>
                      <span className="tarot-card__back-mark">✦</span>
                      <span className="tarot-card__back-moon">☾</span>
                      <span className="tarot-card__back-line" />
                    </>
                  )}
                </div>
                <div className="tarot-card__face tarot-card__front">
                  <div className="tarot-card__top">
                    <span>{drawn.card.numeral}</span>
                    <span>{drawn.position}</span>
                  </div>
                  <div className="tarot-card__art">
                    {slot?.imageId ? (
                      <img src={imageUrl(slot.imageId)} style={cropImageStyle(slot.crop)} alt="" />
                    ) : (
                      <>
                        <span className="tarot-card__moon">☾</span>
                        <span className="tarot-card__star">✦</span>
                      </>
                    )}
                  </div>
                  <div className="tarot-card__name">{nameOf(drawn)}</div>
                  {drawn.reversed && <div className="tarot-card__rev">перевёрнута</div>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {settings.showMeanings && (
        <div className="tarot__meanings">
          {cards.map((drawn, index) => (
            <div className="tarot__meaning" key={`${drawn.card.id}-m-${index}`}>
              <span className="tarot__meaning-name">
                {revealed[index] ? nameOf(drawn) : 'Скрытая карта'}:
              </span>{' '}
              {revealed[index] ? meaningOf(drawn) : 'нажмите, чтобы открыть'}
            </div>
          ))}
        </div>
      )}

      {interactive ? (
        <button type="button" className="tarot-draw no-drag" onClick={draw}>
          <span className="tarot-draw__symbol">✦</span>
          Новый расклад
          <span className="tarot-draw__symbol">☾</span>
        </button>
      ) : (
        <div className="tarot__hint">Разблокируйте виджет или включите интерактивность в настройках</div>
      )}
    </div>
  )
}
